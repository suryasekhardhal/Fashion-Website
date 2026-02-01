import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createProduct = asyncHandler(async(req,res)=>{});

const getAllProducts = asyncHandler(async(req,res)=>{});

const getProductsBySlug = asyncHandler(async(req,res)=>{});



export {createProduct,getAllProducts,getProductsBySlug};