import { Router } from 'express'
import { TokenValidator } from '../libs/tokenValidator.js';
import { follow, getFollowings, getFollowers, unfollow } from '../controllers/followUp/followUp.controller.js';

const router = Router()

router.post('/api/follow', TokenValidator, follow)

router.post('/api/unfollow', TokenValidator, unfollow)

router.get('/api/followers', TokenValidator, getFollowers)

router.get('/api/followings', TokenValidator, getFollowings)


export default router;