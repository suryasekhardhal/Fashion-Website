import {upload} from '../middlewares/multer.middleware.js'
import { admin } from '../middlewares/isAdmin.middleware.js';
import { createCategory } from '../controllers/category.controller.js';
import Router from 'express';

const router = Router();

router.route('/create-category').post(admin,upload.single('image'),createCategory);

export default router;
