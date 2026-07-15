import dotenv from 'dotenv'
dotenv.config()
import app from "./src/app.js"
import './src/database.js'
import { createServer } from 'http'
import { attachRealtimeServer } from './src/services/realtime.service.js'

const server = createServer(app)
attachRealtimeServer(server)

server.listen(app.get('port'), () => {
    console.log(`app en puerto ${app.get('port')}`)
})
