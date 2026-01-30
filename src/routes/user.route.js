import {registerUser, signInUser,logoutUser,generateNewAccessToken} from '../controllers/user.controller.js';
import { Router } from 'express';
import {verifyJWT} from '../middlewares/auth.middleware.js'

const router = Router();

router.route("/register").post(registerUser);
router.route("/login").post(signInUser);
router.route("/logout").post(verifyJWT,logoutUser);
router.route("/refresh-token").get(generateNewAccessToken);

export default router;