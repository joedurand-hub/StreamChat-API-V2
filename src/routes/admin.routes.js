import { Router } from 'express'
import { createDenouncePost, getDenouncePost, updateDenouncePost, deleteDenouncePost } from '../controllers/admin/moderatePublications.controller.js';
import { createDenounceUser, getDenounceUser, updateDenounceUser, deleteDenounceUser } from '../controllers/admin/moderateUsers.controllers.js';
import { getWalletsWithWithdrawlRequests, updateWithdrawalStatus } from '../controllers/admin/withdrawalRequests.controller.js';
import { getAllUsers } from '../controllers/admin/users.controller.js';
import { TokenValidator } from '../libs/tokenValidator.js';
import { AdminValidator } from '../libs/adminValidator.js';
const router = Router()
const adminOnly = [TokenValidator, AdminValidator]

// publicaciones
router.post('/create-denounce-post', ...adminOnly, createDenouncePost)
router.get('/get-denounce-posts', ...adminOnly, getDenouncePost)
router.put('/update-denounce-post', ...adminOnly, updateDenouncePost)
router.delete('/delete-denounce-post', ...adminOnly, deleteDenouncePost)

// usuarios
router.get('/get-all-users', ...adminOnly, getAllUsers)
router.post('/create-denounce-user', ...adminOnly, createDenounceUser)
router.get('/get-denounce-users', ...adminOnly, getDenounceUser)
router.put('/update-denounce-user', ...adminOnly, updateDenounceUser)
router.delete('/delete-denounce-user', ...adminOnly, deleteDenounceUser)

//wallets
router.get('/get-withdrawl-requests', ...adminOnly, getWalletsWithWithdrawlRequests)
router.patch('/api/admin/wallets/:walletId/withdrawals/:requestId', ...adminOnly, updateWithdrawalStatus)


export default router;
