import { Router } from 'express'
import { revenueCatWebhook } from '../controllers/webhooks/revenuecat.controller.js'
const router = Router()
router.post('/api/webhooks/revenuecat', revenueCatWebhook)
export default router
