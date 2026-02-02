import {verifyJWT} from "../middlewares/auth.middleware.js";
import {admin} from "../middlewares/isAdmin.middleware.js";
import { createProduct,getAllProducts,getProductsByCategory,getProductsBySlug } from "../controllers/product.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/create-product").post(verifyJWT,admin,upload.array("images",5),createProduct);
router.route("/all-products").get(getAllProducts);
router.route("/products/category/:slug").get(getProductsByCategory);
router.route("/products/slug/:slug").get(getProductsBySlug);

export default router;