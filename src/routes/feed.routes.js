import { Router } from 'express'
import { createPost, getPostById, deletePost, commentPost, likePost, dislikePost, getAllPostsByUserById, uploadVideoPost } from '../controllers/posts/posts.controller.js';
import { getAllPostsByFollowings } from '../controllers/interaction/getAllPostsByFollowings.controller.js'
import { TokenValidator } from '../libs/tokenValidator.js';
import multer from "../libs/multer.js"
import { getAllPostsWithOutPriceByUser, getAllPostsByUser } from '../controllers/profile/profile.controller.js';

const router = Router()

router.post('/api/post', TokenValidator, multer.fields([{
    name: 'images',
    maxCount: 7
}, {   
    name: 'video',
    maxCount: 1
}]), createPost)
router.post('/api/like/:id', TokenValidator, likePost)
router.post('/api/dislike/:id', TokenValidator, dislikePost)
router.post('/api/comment-post', TokenValidator, commentPost)

router.get('/api/posts', TokenValidator, getAllPostsByFollowings)
router.get('/api/posts-user', TokenValidator, getAllPostsByUser)
router.get('/api/gallery-posts', TokenValidator, getAllPostsWithOutPriceByUser)
router.get('/api/posts-user/:id', TokenValidator, getAllPostsByUserById)
router.get('/api/post/:id', getPostById)

router.delete('/api/post/:id', TokenValidator, deletePost)

export default router;