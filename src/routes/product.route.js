import {verifyJWT} from "../middlewares/auth.middleware.js";
import {admin} from "../middlewares/isAdmin.middleware.js";
import { createProduct,getAllProducts,getProductsByCategory,getProductsBySlug,toggleProductStatus,updateProduct,deleteProduct } from "../controllers/product.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/create-product").post(verifyJWT,admin,upload.array("images",5),createProduct);
router.route("/all-products").get(getAllProducts);
router.route("/products/category/:slug").get(getProductsByCategory);
router.route("/products/slug/:slug").get(getProductsBySlug);
router.route("/toggle-product-status/:productId").patch(verifyJWT,admin,toggleProductStatus);
router.route("/update-product/:productId").put(verifyJWT,admin,upload.array("images",5),updateProduct);
router.route("/delete-product/:productId").delete(verifyJWT,admin,deleteProduct);


export default router;