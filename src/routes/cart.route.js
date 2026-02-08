import {verifyJWT} from "../middlewares/auth.middleware.js";
import {addToCart,getCart,updateCartItemQuantity,removeCartItem,clearCart,validateCartBeforeCheckout,refreshCart} from "../controllers/cart.controller.js";
import { Router } from "express";

const router = Router();

router.route("/add-to-cart").post(verifyJWT,addToCart);
router.route("/get-cart").get(verifyJWT,getCart);
router.route("/update-cart-item").put(verifyJWT,updateCartItemQuantity);
router.route("/remove-cart-item").delete(verifyJWT,removeCartItem);
router.route("/clear-cart").delete(verifyJWT,clearCart);
router.route("/validate-cart").post(verifyJWT,validateCartBeforeCheckout);
router.route("/refresh-cart").post(verifyJWT,refreshCart);

export default router