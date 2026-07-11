import { Router } from 'express'
import { TokenValidator } from '../libs/tokenValidator.js'
import { createCall, endCall, getCall, heartbeatCall, respondCall } from '../controllers/calls/calls.controller.js'
const router = Router()
router.post('/api/calls', TokenValidator, createCall)
router.get('/api/calls/:id', TokenValidator, getCall)
router.post('/api/calls/:id/respond', TokenValidator, respondCall)
router.post('/api/calls/:id/heartbeat', TokenValidator, heartbeatCall)
router.post('/api/calls/:id/end', TokenValidator, endCall)
export default router
