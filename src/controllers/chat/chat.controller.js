import Chat from "../../models/Chat.js"
import User from "../../models/User.js"

export const createChat = async (req, res, next) => {
    try {
        const { recivedId } = req.body
        const senderId = req.userId.toString()
        if (!recivedId) {
            return res.status(400).json({ message: "No se recibió el usuario destinatario" })
        }
        if (senderId === recivedId.toString()) {
            return res.status(400).json({ message: "No podés crear un chat con vos mismo" })
        }
        const [user, recipient] = await Promise.all([
            User.findById(senderId),
            User.findById(recivedId)
        ]);

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        if (!recipient) {
            return res.status(404).json({ message: "Usuario destinatario no encontrado" });
        }

        const chat = await Chat.findOne({
            members: { $all: [senderId, recivedId.toString()] }
        });

        if (chat) {
            return res.status(200).json({ message: "El chat ya existe:", chat });
        }

        const newChat = new Chat({ members: [senderId, recivedId.toString()] });
        const result = await newChat.save();
        const chatId = result._id;

        user.chats.addToSet(chatId);
        recipient.chats.addToSet(chatId);
        await Promise.all([user.save(), recipient.save()]);

        return res.status(201).json({ chat: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ha ocurrido un error al crear el chat", error });
        next(error);
    }
}

export const addMessage = async (chatId, senderId, remitterId, text, res) => {
    try {
        if(!chatId) {
            return res.status(403).json({message: "No se recibió el chatId para agregar el mensaje"})
        }

        if(!text) {
            return res.status(403).json({message: "No se puede enviar un mensaje vacío"})
        }

        if(!senderId) {
            return res.status(403).json({message: "No se recibió el id del usuario que envía el mensaje"})
        }

        if(!remitterId) {
            return res.status(403).json({message: "No se recibió el id del usuario receptor para agregar el mensaje"})
        }

        const normalizedSenderId = senderId.toString()
        const normalizedRemitterId = remitterId.toString()
        const newMessage = {
            senderId: normalizedSenderId,
            remitterId: normalizedRemitterId,
            text: text.trim(),
            read: false,
            date: new Date(),
        };

        const chat = await Chat.findById(chatId)
        if (!chat) {
            return res.status(404).json({ message: "Chat no encontrado" })
        }
        if (!chat.members.includes(normalizedSenderId) || !chat.members.includes(normalizedRemitterId)) {
            return res.status(403).json({ message: "Los usuarios no pertenecen a este chat" })
        }
        const updatedChat = await Chat.findByIdAndUpdate(chatId, {
                $push: { messages: newMessage}, 
                $inc: { messagesUnread: 1 } 
            }, { new: true, runValidators: true }
        );

        return res.status(200).json({ message: newMessage, chat: updatedChat });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
        next(error);
    }
}


export const userChats = async (req, res, next) => {
    try {

        const user = await User.findById(req.userId);
        const chats = await Chat.find({
            members: { $in: [req.userId] }
        });
        console.log("chats", chats)
        const usersInMyChat = chats.map(obj => obj.members).flat();
        console.log("usersInMyChat", usersInMyChat)

        const usersId = usersInMyChat.filter(member => member.toString() !== req.userId.toString());

        const usersExistingOnAllMyChats = await User.find({
            _id: {
                $in: usersId
            }
        });

        const userIdToChatsMap = {};
        chats.forEach(chat => {
            chat.members.forEach(memberId => {
                if (!userIdToChatsMap[memberId]) {
                    userIdToChatsMap[memberId] = [];
                }
                userIdToChatsMap[memberId].push(chat._id.toString());
            });
        });

        const usersDataInTheChat = usersExistingOnAllMyChats.map(user => ({
            id: user._id.toString(),
            userName: user.userName,
            profilePicture: user.profilePicture?.secure_url || null, 
            receiveVideocall: user.receiveVideocall,
            updatedAt: user.updatedAt,
            chatIds: userIdToChatsMap[user._id.toString()] || [] 
        }));

        res.status(200).json(usersDataInTheChat);

    } catch (error) {
        console.log(error);
        res.status(400).json({ message: "Error al obtener el listado de chats", error: error });
        next(error);
    }
};



export const findChat = async (req, res, next) => {
    // Recibe el segundo id como params, que es quien recibe los msjs
    // Con esos datos se pinta el Header de la conversación
    // y se renderizan los msjs
    try {
        if(!req.userId) {
            return res.status(404).json({ error: 'No ha iniciado sesión' });
        }
        const chat = await Chat.findOne({
            members: { $all: [req.userId, req.params.secondId] }
        })
        if (!chat) {
            return res.status(404).json({ error: 'Chat no encontrado' });
        }
        const user = await User.findById(req.params.secondId)
        if(!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const myId = req.userId.toString()
        const userName = user?.userName
        const receiveVideocall = user?.receiveVideocall
        const priceVideocall = user?.priceVideocall
        const receivePaidMessage = user?.receivePaidMessage
        const priceMessage = user?.priceMessage
        const profilePicture = user?.profilePicture?.secure_url || null

        let iterations = 0;
        chat.messages.forEach((message)=> {
            if(message.read === false) {
                iterations = iterations + 1
            }
            message.read = true;
        });
        chat.messagesUnread = Math.max(0, chat.messagesUnread - iterations)
        await chat.save()

        res.status(200).json({ 
            chat, 
            userName, 
            profilePicture, 
            receiveVideocall, 
            priceVideocall, 
            receivePaidMessage, 
            priceMessage, 
            myId
        })

    } catch (error) {
        console.log(error)
        res.status(400).json({ error: error })
        next(error)
    }
}

export const deleteChat = async (req, res, next) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, members: req.userId.toString() })
        if (!chat) return res.status(404).json({ message: "Chat no encontrado" })
        await Promise.all([
            Chat.deleteOne({ _id: chat._id }),
            User.updateMany({ _id: { $in: chat.members } }, { $pull: { chats: chat._id } })
        ])
        return res.status(200).json({ message: "Chat eliminado" })

    } catch (error) {
        console.log(error)
        res.status(400).json(error)
        next()
    }
}
