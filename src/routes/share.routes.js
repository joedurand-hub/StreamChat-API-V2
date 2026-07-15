import { Router } from 'express'
import { renderSharedPost, renderSharedProfile } from '../controllers/share/share.controller.js'

const router = Router()
router.get('/share/post/:id', renderSharedPost)
router.get('/share/profile/:id', renderSharedProfile)

export default router
