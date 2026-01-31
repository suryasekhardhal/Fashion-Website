import {upload} from '../middlewares/multer.middleware.js'
import { admin } from '../middlewares/isAdmin.middleware.js';
import { createCategory,getAllCategories,getCategoryBySlug ,toggleCategory} from '../controllers/category.controller.js';
import {verifyJWT} from '../middlewares/auth.middleware.js'
import Router from 'express';

const router = Router();

router.route('/create-category').post(verifyJWT,admin,upload.single('image'),createCategory);
router.route('/all-categories').get(getAllCategories);
router.route('/:slug').get(getCategoryBySlug);
router.route('/toggle-category/:slug').post(verifyJWT,admin,toggleCategory);

export default router;
