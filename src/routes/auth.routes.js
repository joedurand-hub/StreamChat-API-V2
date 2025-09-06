import { Router } from 'express'
import { signup, login, logout, reset, changePassword, sendVerificationCode, verifyCode } from '../controllers/auth/auth.controller.js';
import { TokenValidator } from '../libs/tokenValidator.js';

const router = Router()

router.post('/api/register', signup)

router.post('/api/login', login)

router.post('/api/logout', TokenValidator, logout)

router.post('/api/reset-password', reset)

router.put('/api/change-password', TokenValidator, changePassword)

router.post('/api/send-verification-code', TokenValidator, sendVerificationCode)

router.post('/api/verify-code', TokenValidator, verifyCode)



export default router;