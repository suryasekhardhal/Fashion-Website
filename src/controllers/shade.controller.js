import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { Shade } from "../models/shade.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {Product} from "../models/product.model.js"
import mongoose from "mongoose";

const createShade = asyncHandler(async(req,res)=>{
    const {productId,shadeName,shadeCode,stock,price} = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId) || !shadeName || !shadeCode || stock === undefined || stock < 0) {
        throw new ApiError(400,"All fields are required");
    }
    if(price !== undefined && price < 0){
        throw new ApiError(400,"Price cannot be undefined, negative or zero");
    }
    const shadeImageFile = req.file;

    if (!shadeImageFile) {
        throw new ApiError(400, "Shade image is required");
    }
    
    const product = await Product.findOne({_id:productId,isActive:true});
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    const shadeImageUrl = await uploadOnCloudinary(shadeImageFile.path);
    if(!shadeImageUrl){
        throw new ApiError(500,"Failed to upload shade image in cloudinary");
    }

    const shade = await Shade.create({
        product:product._id,
        shadeName,
        shadeCode,
        shadeImage:shadeImageUrl.url,
        stock,
        price
    });

    if(!shade){
        throw new ApiError(500,"Failed to create shade");
    }
    return res.status(201).json(new ApiResponce(201,shade,"Shade created successfully"));
});

const getShadesByProduct = asyncHandler(async(req,res)=>{
    const {productId} = req.params;
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new ApiError(400,"Invalid product ID");
        }
        const productExists = await Product.findOne({_id:productId,isActive:true});
        if(!productExists){
            throw new ApiError(404,"Product not found");
        }

        const shades = await Shade.find({product:productExists._id,isActive:true}).select("shadeName shadeCode shadeImage stock price").sort({createdAt:1});
        if(shades.length === 0){
            return res.status(200).json(new ApiResponce(200,[],"No shades found for this product"));
        }
        return res.status(200).json(new ApiResponce(200,shades,"Shades fetched successfully"));

})

const updateShade = asyncHandler(async(req,res)=>{
    const {shadeId} = req.params;
    const {shadeName,shadeCode,stock,price,isActive} = req.body;
    if (!mongoose.Types.ObjectId.isValid(shadeId)) {
        throw new ApiError(400,"Invalid shade ID");
    }
    if(stock !== undefined && stock < 0){
        throw new ApiError(400,"Stock cannot be negative");
    }
    if(price !== undefined && price < 0){
        throw new ApiError(400,"Price cannot be negative");
    }
    const shade = await Shade.findById(shadeId);
    if(!shade){
        throw new ApiError(404,"Shade not found");
    }
    
    if (shadeName) shade.shadeName = shadeName;
    if (shadeCode) shade.shadeCode = shadeCode;
    if (stock !== undefined) shade.stock = stock;
    if (price !== undefined) shade.price = price;
    if (isActive !== undefined) shade.isActive = isActive;

    if (req.file?.path) {
    const uploaded = await uploadOnCloudinary(req.file.path);
    if (!uploaded) {
        throw new ApiError(500, "Failed to upload shade image");
    }
    shade.shadeImage = uploaded.url;
    }

    await shade.save();
  
    
    return res.status(200).json(new ApiResponce(200,shade,"Shade updated successfully"));
})

const toggleShadeStatus = asyncHandler(async(req,res)=>{
    const {shadeId} = req.params;
    if (!mongoose.Types.ObjectId.isValid(shadeId)) {
        throw new ApiError(400,"Invalid shade ID");
    }
    const shade = await Shade.findById(shadeId);
    if(!shade){
        throw new ApiError(404,"Shade not found");
    }
    shade.isActive = !shade.isActive;
    await shade.save();
    const status = shade.isActive ? "activated" : "deactivated";
    return res.status(200).json(new ApiResponce(200,shade,`Shade ${status} successfully`));
});

const deleteShade = asyncHandler(async(req,res)=>{
    const {shadeId} = req.params;
    if (!mongoose.Types.ObjectId.isValid(shadeId)) {
        throw new ApiError(400,"Invalid shade ID");
    }
    const shade = await Shade.findByIdAndDelete(shadeId);
    if(!shade){
        throw new ApiError(404,"Shade not found");
    }
    return res.status(200).json(new ApiResponce(200,null,"Shade deleted successfully"));
});   



export {createShade,getShadesByProduct,updateShade,toggleShadeStatus,deleteShade}