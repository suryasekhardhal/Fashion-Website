import {verifyJWT} from "../middlewares/auth.middleware.js";
import {addToCart,getCart} from "../controllers/cart.controller.js";
import { Router } from "express";

const router = Router();

router.route("/add-to-cart").post(verifyJWT,addToCart);
router.route("/get-cart").get(verifyJWT,getCart);

export default router