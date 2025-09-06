import { Router } from 'express'
import {
    getProfile, updateProfile, pictureProfile, getProfileById,
    deleteAccount
} from '../controllers/profile/profile.controller.js';
import { TokenValidator } from '../libs/tokenValidator.js';
import multer from "../libs/multer.js"

const router = Router()

router.get('/api/profile', TokenValidator, getProfile)
router.get('/api/profileById/:id', getProfileById)

router.put('/api/profile/:id', TokenValidator, updateProfile)

router.put('/api/profile-picture', TokenValidator,
    multer.fields([{ name: 'image', maxCount: 1 }]), pictureProfile)

router.delete('/api/delete-account', TokenValidator, deleteAccount)



export default router;