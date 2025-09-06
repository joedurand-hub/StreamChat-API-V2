import { Router } from 'express'
import { searchUser } from '../controllers/interaction/searchUser.controller.js';
import { discoverUsers, discoverPostsWithImages, discoverPostsWithTexts, discoverCreators, discoverPostsWithVideos } from '../controllers/interaction/discoverUsers.js';
import { postsRecomended } from "../controllers/interaction/postsRecomended.controller.js"
import { TokenValidator } from '../libs/tokenValidator.js';
import { discoverUsersWithVideocallActive } from '../controllers/interaction/discoverUsersWithVideocallActive.js';

const router = Router()

router.get('/api/search', TokenValidator, searchUser)
router.get('/api/discover-users', TokenValidator, discoverUsers)
router.get('/api/discover-videocalls', TokenValidator, discoverUsersWithVideocallActive)
router.get('/api/discover-creators', TokenValidator, discoverCreators)
router.get('/api/discover-images', TokenValidator, discoverPostsWithImages)
router.get('/api/discover-videos', TokenValidator, discoverPostsWithVideos)
router.get('/api/discover-texts', TokenValidator, discoverPostsWithTexts)
router.get('/api/posts-recomended', postsRecomended)

export default router;