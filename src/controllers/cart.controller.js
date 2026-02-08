import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Cart } from "../models/cart.model.js";
import { Shade } from "../models/shade.model.js";
import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import e from "express";

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
    const shade = await Shade.findOne({_id:shadeId,product:productId}).lean(); // i have to add isActive:true
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

const getCart = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const cart = await Cart.findOne({user:userId}).populate({
        path:"items.product",
        select:"name basePrice"
    }).populate({
        path:"items.shade",
        select:"shadeName price"
    });

    if(!cart){
        return res.status(200)
        .json(new ApiResponce(
            200,
            {items:[]},
            "Cart is empty",
        )
        );
    }

    cart.totalPrice = cart.items.reduce((total, item) => {
    return total + item.price * item.quantity;
    }, 0);

await cart.save()

    return res.status(200)
    .json(new ApiResponce(
        200,
        cart,
        "Cart retrieved successfully",
    )
    );
});

const updateCartItemQuantity = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const {productId,shadeId,quantity} = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(shadeId) || quantity === undefined || quantity < 0){
        throw new ApiError(400,"Product ID, shade ID and quantity are required, and quantity must be greater than zero");
    }
    const cart = await Cart.findOne({user:userId});
    if(!cart){
        throw new ApiError(404,"Cart not found");
    }
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString() && item.shade.toString() === shadeId.toString());
    if(itemIndex === -1){
        throw new ApiError(404,"Cart item not found");
    }
    const item = cart.items[itemIndex];
    const shade = await Shade.findOne({_id:shadeId,product:productId});// i have to add isActive:true 
    if(!shade){
        throw new ApiError(404,"No shades found for this product");
    }
    if (shade.stock < quantity) {
        throw new ApiError(400,"Insufficient quantity available");
    }
    if(quantity === 0){
        cart.items.splice(itemIndex,1);
    } else{
        item.quantity = quantity;
    }
    

    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();
    return res.status(200)
            .json(new ApiResponce(
            200,
            cart,
            "Cart item quantity updated successfully",
        )
        );
});

const removeCartItem = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const {productId,shadeId} = req.body;
    if(!mongoose.Types.ObjectId.isValid(productId) || !mongoose.Types.ObjectId.isValid(shadeId)){
        throw new ApiError(400,"Product ID and shade ID are required");
    }
    const cart = await Cart.findOne({user:userId});
    if(!cart){
        return res.status(200)
        .json(new ApiResponce(
            200,
            {items:[]},
            "Cart is empty",
        )
        );
    }
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId.toString() && item.shade.toString() === shadeId.toString());
    if(itemIndex === -1){
        throw new ApiError(404,"Cart item not found");
    }
    cart.items.splice(itemIndex,1);
    cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();
    return res.status(200)
            .json(new ApiResponce(
            200,
            cart,
            "Cart item removed successfully",
        )
        );
});

const clearCart = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const cart = await Cart.findOne({user:userId});
    if(!cart){
        return res.status(200)
        .json(new ApiResponce(
            200,
            {items:[]},
            "Cart is empty",
        )
        );
    }
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();
    return res.status(200)
            .json(new ApiResponce(
            200,
            cart,
            "Cart cleared successfully",
        )
        );
});

const validateCartBeforeCheckout = asyncHandler(async(req,res)=>{
    const userId = req.user._id;
    if(!userId){
        throw new ApiError(401,"Unauthorized User");
    }
    const cart = await Cart.findOne({user:userId});
    if(!cart || cart.items.length === 0){
        return res.status(200)
        .json(new ApiResponce(
            200,
            {items:[]},
            "Cart is empty",
        )
        );
    }
    let errors = [];
    let warnings = [];

    const validatedItems = [];

    for(const item of cart.items){
        // “Optimize with batch queries before production”
        // “Implement caching for product and shade details to reduce database load”
        const product = await Product.findOne({_id:item.product,isActive:true});
        if(!product){
            errors.push({
                type: "PRODUCT_INACTIVE",
                productId: item.product,
                message: "Product is no longer available"
            });
            continue;
        }
        const shade = await Shade.findOne({_id:item.shade,product:item.product,isActive:true}); // i have to add isActive:true
        if(!shade){
            errors.push({
                type: "SHADE_INACTIVE",
                productId: item.product,
                shadeId: item.shade,
                message: "Selected shade is no longer available"
            });
            continue;
        }
        if(shade.stock < item.quantity){
           errors.push({
                type: "INSUFFICIENT_STOCK",
                productId: item.product,
                shadeId: item.shade,
                availableStock: shade.stock,
                requestedQuantity: item.quantity,
                message: `Only ${shade.stock} items left in stock`
            });
            continue;
        }

        const finalPrice = shade.price ?? product.discountedPrice ?? product.basePrice;

        if(finalPrice !== item.price){
            warnings.push({
                type: "PRICE_UPDATED",
                productId: item.product,
                shadeId: item.shade,
                oldPrice: item.price,
                newPrice: finalPrice,
                message: "Product price has been updated"
            });
        }
        validatedItems.push({
            ...item.toObject(),
            price:finalPrice
        });
    }
    if(errors.length > 0){
        return res.status(400)
        .json(new ApiResponce(
            400,
            {errors,warnings},
            "Cart validation failed",
        )
        );
    }
    
    cart.items = validatedItems;
    cart.totalPrice = validatedItems.reduce((total, item) => total + item.price * item.quantity, 0);
    await cart.save();
    return res.status(200)
            .json(new ApiResponce(
            200,
            {cart,warnings},
            "Cart validated successfully",
        )
        );
});

const refreshCart = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized User");
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
        return res.status(200).json(
            new ApiResponce(200, { items: [] }, "Cart is empty")
        );
    }

    const warnings = [];
    const refreshedItems = [];

    for (const item of cart.items) {
        const product = await Product.findOne({
            _id: item.product,
            isActive: true
        });

        if (!product) {
            warnings.push({
                type: "PRODUCT_REMOVED",
                productId: item.product,
                message: "Product is no longer available"
            });
            continue;
        }

        const shade = await Shade.findOne({
            _id: item.shade,
            product: item.product,
            isActive: true
        });

        if (!shade) {
            warnings.push({
                type: "SHADE_REMOVED",
                productId: item.product,
                shadeId: item.shade,
                message: "Selected shade is no longer available"
            });
            continue;
        }

        // Adjust quantity if stock reduced
        let finalQuantity = item.quantity;
        if (shade.stock < item.quantity) {
            finalQuantity = shade.stock;
            warnings.push({
                type: "QUANTITY_ADJUSTED",
                productId: item.product,
                shadeId: item.shade,
                availableStock: shade.stock,
                message: "Quantity adjusted due to limited stock"
            });
        }

        // Skip item if stock is zero
        if (finalQuantity === 0) {
            warnings.push({
                type: "OUT_OF_STOCK",
                productId: item.product,
                shadeId: item.shade,
                message: "Item removed because it is out of stock"
            });
            continue;
        }

        const finalPrice =
            shade.price ??
            product.discountedPrice ??
            product.basePrice;

        if (finalPrice !== item.price) {
            warnings.push({
                type: "PRICE_UPDATED",
                productId: item.product,
                shadeId: item.shade,
                oldPrice: item.price,
                newPrice: finalPrice,
                message: "Price has been updated"
            });
        }

        refreshedItems.push({
            product: item.product,
            shade: item.shade,
            quantity: finalQuantity,
            price: finalPrice
        });
    }

    cart.items = refreshedItems;
    cart.totalPrice = refreshedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    await cart.save();

    return res.status(200).json(
        new ApiResponce(
            200,
            { cart, warnings },
            "Cart refreshed successfully"
        )
    );
});





export {addToCart,getCart,updateCartItemQuantity,removeCartItem,clearCart,validateCartBeforeCheckout,refreshCart};
    
    
