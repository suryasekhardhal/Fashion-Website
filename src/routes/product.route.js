import {verifyJWT} from "../middlewares/auth.middleware.js";
import {admin} from "../middlewares/isAdmin.middleware.js";
import { createProduct,getAllProducts,getProductsByCategory,getProductsBySlug,toggleProductStatus,updateProduct,searchProducts } from "../controllers/product.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/create-product").post(verifyJWT,admin,upload.array("images",5),createProduct);
router.route("/search").get(searchProducts);
router.route("/all-products").get(getAllProducts);
router.route("/products/category/:slug").get(getProductsByCategory);
router.route("/products/slug/:slug").get(getProductsBySlug);
router.route("/toggle-product-status/:productId").patch(verifyJWT,admin,toggleProductStatus);
router.route("/update-product/:productId").put(verifyJWT,admin,updateProduct);



export default router;