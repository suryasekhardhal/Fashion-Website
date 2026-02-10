import { Wishlist } from "../models/wishlist.model.js";
import { Product } from "../models/product.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import mongoose from "mongoose";

const addToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const { productId } = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400,"Invalid product ID");
    }

    const product = await Product.findById(productId);
    if(!product) {
        throw new ApiError(404,"Product not found");
    }

    const wishlist = await Wishlist.findOne({ user: userId });
    if(wishlist) {
        const isProductInWishlist = wishlist.products.some(p => p.toString() === productId);
        if (isProductInWishlist) {
            throw new ApiError(409, "Product already in wishlist");
        }
        wishlist.products.push(productId);
        await wishlist.save();
        return res.status(200)
        .json(new ApiResponce(
            200,
            wishlist,
            "Product added to wishlist successfully"
        ));
    } 
    const newWishlist = await Wishlist.create({
        user: userId,
        products: [productId]
    });
    
    if (!newWishlist) {
        throw new ApiError(500, "Failed to create wishlist");
    }
    res.status(201).json(new ApiResponce(201,newWishlist,"Product added to wishlist successfully"));
    
});

const getWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const wishlist = await Wishlist.findOne({ user: userId }).populate("products", "name images slug brand basePrice discountedPrice");
    if (!wishlist) {
        return res.status(200)
        .json(new ApiResponce(
            200,
            { products: [] },
            "Wishlist is empty"
        ));
    }
    res.status(200)
    .json(new ApiResponce(
        200,
        wishlist,
        "Wishlist retrieved successfully"
    ));
});

const removeFromWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const { productId } = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400,"Invalid product ID");
    }
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        throw new ApiError(404, "Wishlist not found");
    }
    const productIndex = wishlist.products.findIndex(p => p.toString() === productId);
    if (productIndex === -1) {
        throw new ApiError(404, "Product not found in wishlist");
    }
    wishlist.products.splice(productIndex, 1);
    await wishlist.save();
    res.status(200)
    .json(new ApiResponce(
        200,
        wishlist,
        "Product removed from wishlist successfully"
    ));
});

const isInWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const { productId } = req.query;
    if(!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400,"Invalid product ID");
    }
    const wishlist = await Wishlist.findOne({ user: userId });
    if (!wishlist) {
        return res.status(200)
        .json(new ApiResponce(
            200,
            { isInWishlist: false },
            "Wishlist is empty"
        ));
    }
    const isProductInWishlist = wishlist.products.some(p => p.toString() === productId);
    res.status(200)
    .json(new ApiResponce(
        200,
        { isInWishlist: isProductInWishlist },
        "Wishlist status retrieved successfully"
    ));
});
export { addToWishlist, getWishlist, removeFromWishlist, isInWishlist }

