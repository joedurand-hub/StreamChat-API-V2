import { Router } from 'express'
import { TokenValidator } from '../libs/tokenValidator.js'
import multer from '../libs/multer.js'
import { createStory, deleteStory, denounceStory, getStories } from '../controllers/stories/stories.controller.js'

const router = Router()

router.get('/api/stories', TokenValidator, getStories)
router.post('/api/stories', TokenValidator, multer.fields([{ name: 'story', maxCount: 1 }]), createStory)
router.post('/api/stories/:id/denounce', TokenValidator, denounceStory)
router.delete('/api/stories/:id', TokenValidator, deleteStory)

export default router
