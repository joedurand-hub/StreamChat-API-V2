import { Router } from 'express'
import { buyCoins } from '../controllers/mercadopago/coins.controller.js'
import { postsWithPriceByUser, postsWithPriceByUserId } from "../controllers/mercadopago/products.controller.js"
import { webHooks } from '../controllers/mercadopago/webHooks.js'
import { redirectUrlMp } from '../controllers/mercadopago/redirectUrlMp.controller.js'
import { TokenValidator } from '../libs/tokenValidator.js';

const router = Router()

router.post('/api/buy-coins', TokenValidator, buyCoins)
router.post('/api/notifications', webHooks)

router.get('/api/productsByUser', TokenValidator, postsWithPriceByUser)
router.get('/api/productsByUser/:id', TokenValidator, postsWithPriceByUserId)
router.get('/api/mp-connect', redirectUrlMp)


export default router;
