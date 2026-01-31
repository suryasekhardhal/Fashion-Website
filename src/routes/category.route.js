import {upload} from '../middlewares/multer.middleware.js'
import { admin } from '../middlewares/isAdmin.middleware.js';
import { createCategory } from '../controllers/category.controller.js';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import Router from 'express';

const router = Router();

router.route('/create-category').post(verifyJWT,admin,upload.single('image'),createCategory);

export default router;
