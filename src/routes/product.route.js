import {verifyJWT} from "../middlewares/auth.middleware.js";
import {admin} from "../middlewares/isAdmin.middleware.js";
import { createProduct,getAllProducts,getProductsBySlug } from "../controllers/product.controller.js";
import {upload} from "../middlewares/multer.middleware.js";

import { Router } from "express";

const router = Router();

router.route("/create-product").post(verifyJWT,admin,upload.array("images",5),createProduct);

export default router;