import { Router } from 'express'
import { getWallet, buyContentById, bringAllPurchasesByUser, createWithdrawalRequest, updateBalanceWithHistoryPurchases } from '../controllers/wallet/wallet.controller.js';
import { TokenValidator } from '../libs/tokenValidator.js';
const router = Router()

router.post('/api/create-withdrawl-request', TokenValidator, createWithdrawalRequest)
router.post('/api/buy-content', TokenValidator, buyContentById)
router.post('/api/update-balance-with-history', TokenValidator, updateBalanceWithHistoryPurchases)

router.get('/api/purchasesByUser', TokenValidator, bringAllPurchasesByUser)
router.get('/api/wallet', TokenValidator, getWallet)



export default router;