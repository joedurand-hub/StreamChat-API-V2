import { Router } from 'express'
import { TokenValidator } from '../libs/tokenValidator.js'
import { registerPushToken, unregisterPushToken } from '../controllers/push/push.controller.js'
const router = Router()
router.post('/api/push-token', TokenValidator, registerPushToken)
router.delete('/api/push-token', TokenValidator, unregisterPushToken)
export default router
