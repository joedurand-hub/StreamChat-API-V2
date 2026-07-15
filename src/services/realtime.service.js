import jwt from 'jsonwebtoken';
import { WebSocketServer, WebSocket } from 'ws';

const clientsByUser = new Map();

const sendJson = (socket, payload) => {
    if (socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify(payload));
};

export const isUserOnline = (userId) => (clientsByUser.get(userId?.toString())?.size || 0) > 0;

export const publishToUsers = (userIds, payload) => {
    const uniqueIds = new Set((userIds || []).filter(Boolean).map((id) => id.toString()));
    uniqueIds.forEach((userId) => {
        clientsByUser.get(userId)?.forEach((socket) => sendJson(socket, payload));
    });
};

const broadcastPresence = (userId, online) => {
    const payload = { type: 'presence', userId, online, occurredAt: new Date().toISOString() };
    clientsByUser.forEach((sockets) => sockets.forEach((socket) => sendJson(socket, payload)));
};

export const attachRealtimeServer = (server) => {
    const websocketServer = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        try {
            const url = new URL(request.url, 'http://localhost');
            if (url.pathname !== '/realtime') {
                socket.destroy();
                return;
            }

            const token = request.headers.authtoken || url.searchParams.get('token');
            const payload = jwt.verify(token, process.env.TOKEN_KEY_JWT || 'tokentest');
            request.userId = payload._id?.toString();
            if (!request.userId) throw new Error('Token sin usuario');

            websocketServer.handleUpgrade(request, socket, head, (client) => {
                websocketServer.emit('connection', client, request);
            });
        } catch {
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        }
    });

    websocketServer.on('connection', (socket, request) => {
        const userId = request.userId;
        const wasOffline = !isUserOnline(userId);
        const sockets = clientsByUser.get(userId) || new Set();
        sockets.add(socket);
        clientsByUser.set(userId, sockets);
        socket.isAlive = true;

        sendJson(socket, {
            type: 'presence_snapshot',
            onlineUserIds: [...clientsByUser.keys()].filter(isUserOnline),
        });
        if (wasOffline) broadcastPresence(userId, true);

        socket.on('pong', () => { socket.isAlive = true; });
        socket.on('message', (rawMessage) => {
            try {
                const message = JSON.parse(rawMessage.toString());
                if (message.type === 'ping') sendJson(socket, { type: 'pong' });
            } catch {
                sendJson(socket, { type: 'error', code: 'INVALID_MESSAGE' });
            }
        });

        socket.on('close', () => {
            const userSockets = clientsByUser.get(userId);
            userSockets?.delete(socket);
            if (!userSockets?.size) {
                clientsByUser.delete(userId);
                broadcastPresence(userId, false);
            }
        });
    });

    const heartbeat = setInterval(() => {
        websocketServer.clients.forEach((socket) => {
            if (socket.isAlive === false) return socket.terminate();
            socket.isAlive = false;
            socket.ping();
        });
    }, 30000);
    heartbeat.unref?.();
    websocketServer.on('close', () => clearInterval(heartbeat));

    return websocketServer;
};
