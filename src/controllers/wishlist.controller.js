import { Wishlist } from "../models/wishlist.model.js";
import {Shade} from "../models/shade.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import mongoose from "mongoose";
import e from "express";

const addToWishlist = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized");
    }
    const { productId,shadeId } = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(shadeId)) {
        throw new ApiError(400,"Invalid product ID or shade ID");
    }
    const shadeExist = await Shade.findById({_id:shadeId,product:productId});
    if (shadeExist) {
        throw new ApiError(404,"Shade not found for the given product");
    }
    const wishlist = await Wishlist.findOne({ user: userId });
    if(wishlist) {
        if(wishlist.products.includes(productId)) {
            throw new ApiError(409,"Product already in wishlist");
        }
        wishlist.products.push(productId);
        await wishlist.save();
        return res.status(200).json(new ApiResponce(200,wishlist,"Product added to wishlist successfully"));
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

export { addToWishlist }

