import { Router } from 'express'
import { notification, getNotifications, getNotificationsLength } from '../controllers/notifications/notifications.controller.js'
import { TokenValidator } from '../libs/tokenValidator.js';

const router = Router()

router.post('/api/notification', TokenValidator, notification)
router.get('/api/notification', TokenValidator, getNotifications)
router.get('/api/notification/length', TokenValidator, getNotificationsLength)

export default router;
