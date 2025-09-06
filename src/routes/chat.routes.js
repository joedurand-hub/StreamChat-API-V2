import { Router } from 'express'
import { createChat, userChats, findChat, deleteChat } from '../controllers/chat/chat.controller.js';
import { sendPaidMessage } from '../controllers/wallet/wallet.controller.js';
import { TokenValidator } from '../libs/tokenValidator.js';

const router = Router()

router.post('/api/chat', TokenValidator, createChat)
router.post('/api/message', TokenValidator, sendPaidMessage)
router.get('/api/chats', TokenValidator, userChats)
router.get('/api/chat/:secondId', TokenValidator, findChat)
router.delete('/api/delete-chat/:chatId', TokenValidator, deleteChat)

export default router;