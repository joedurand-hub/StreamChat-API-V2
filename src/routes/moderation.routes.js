import { Router } from 'express'
import { createDenouncePost, updateDenouncePost, getDenouncePost, deleteDenouncePost } from '../controllers/admin/moderatePublications.controller.js'
import {  createDenounceUser, updateDenounceUser, getDenounceUser, deleteDenounceUser } from '../controllers/admin/moderateUsers.controllers.js'
import { TokenValidator } from '../libs/tokenValidator.js';

const router = Router()

router.get('/api/post/denounce/:id', getDenouncePost) //cambiar a getAllDenouncePosts
router.post('/api/post/denounce/:id', TokenValidator, createDenouncePost)
router.put('/api/post/denounce/:id', TokenValidator, updateDenouncePost)
router.delete('/api/post/denounce/:id', TokenValidator, deleteDenouncePost)

router.get('/api/post/denounce/:id', TokenValidator, getDenounceUser) 
//cambiar a getAllDenounceUsers usando de ejemplo discoverUsers
router.post('/api/post/denounce/:id', TokenValidator, createDenounceUser)
router.put('/api/post/denounce/:id', TokenValidator, updateDenounceUser)
router.delete('/api/post/denounce/:id', TokenValidator, deleteDenounceUser)


export default router;
