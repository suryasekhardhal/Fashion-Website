import {verifyJWT} from "../middlewares/auth.middleware.js";
import { addToWishlist, getWishlist, removeFromWishlist, isInWishlist } from "../controllers/wishlist.controller.js";
import { Router } from "express";

const router = Router();

router.route("/add-wishlist").post(verifyJWT, addToWishlist)
router.route("/get-wishlist").get(verifyJWT, getWishlist)
router.route("/remove-wishlist").delete(verifyJWT, removeFromWishlist)
router.route("/wishlist/status").get(verifyJWT, isInWishlist)

export default router;

