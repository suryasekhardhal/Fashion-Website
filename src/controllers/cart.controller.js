import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Cart } from "../models/cart.model.js";
import { Shade } from "../models/shade.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";

const addToCart = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const {productId,shadeId,quantity} = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(shadeId) || quantity === undefined || quantity <= 0){
        throw new ApiError(400,"Product ID, shade ID and quantity are required, and quantity must be greater than zero");
    }
    const product = await Product.findOne({ _id:productId,isActive:true }).lean();
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    const shade = await Shade.findOne({_id:shadeId,product:productId,isActive:true}).lean();
    if(!shade){
        throw new ApiError(404,"No shades found for this product");
    }
    if (shade.stock < quantity) {
        throw new ApiError(400,"Insufficient quantity available");
    }
    let cart = await Cart.findOne({user:userId});
    if(!cart){
        cart = new Cart({
            user:userId,
            items:[{
                product:productId,
                shade:shadeId,
                quantity,
                price:shade.price || product.basePrice
            }],
            totalPrice:shade.price * quantity
        });
        await cart.save();

        return res.status(201)
        .json(new ApiResponce(
            201,
            cart,
            "Product added to cart",
        )
        );
    }

    const existingItem = cart.items.find(item => item.product.toString() === productId.toString() && item.shade.toString() === shadeId.toString());

    if(existingItem){
        if (shade.stock < existingItem.quantity + quantity) {
            throw new ApiError(400,"Insufficient quantity available");
        }
        existingItem.quantity += quantity;
    } else {
        cart.items.push({
            product:productId,
            shade:shadeId,
            quantity,
            price:shade.price || product.basePrice
        });
    } 

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();
    return res.status(200)
    .json(new ApiResponce(
        200,
        cart,
        "Product added to cart",
    )
    );
    
});
    
    
