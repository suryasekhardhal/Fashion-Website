import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Category } from "../models/category.model.js";
// it create multple products as same name we must fixed the slug issue so it create one product with unique slug
const createProduct = asyncHandler(async(req,res)=>{
    const {name,brand,category,basePrice,discountedPrice,description,ingredients,howToUse,skinType} = req.body;

    if(!name || !brand || !category || basePrice === null || !description){
        throw new ApiError(400,"Name, brand, category, basePrice and description are required");
    }
    
    const imagesUrlsLocalPath = req.files
    if(!imagesUrlsLocalPath || imagesUrlsLocalPath.length===0){
        throw new ApiError(400,"Product images are required");
    }
    const uploadedImages  = await Promise.all(
        imagesUrlsLocalPath.map(File=>uploadOnCloudinary(File.path))
    )
   const imageUrls = uploadedImages
    .filter(img => img)
    .map(img => img.url);

    if(imageUrls.length===0){
        throw new ApiError(500,"Failed to upload images");
    }

     if (discountedPrice && discountedPrice >= basePrice) {
    throw new ApiError(
      400,
      "Discounted price must be less than base price"
    );
  }

    const categoryExists = await Category.findOne({_id:category,isActive:true});
    if(!categoryExists){
        throw new ApiError(400,"Invalid category");
    }

    const product = await Product.create({
        name,
        brand,
        category,
        basePrice,
        discountedPrice,
        images:imageUrls,
        description,
        ingredients,
        howToUse,
        skinType
     });

     if(!product){
        throw new ApiError(500,"Failed to create product");
     }

     await product.populate("category", "name slug");

        return res.status(201)
        .json(new ApiResponce(
            201,
            product,
            "Product created successfully",
        ))

});

const getAllProducts = asyncHandler(async(req,res)=>{});

const getProductsBySlug = asyncHandler(async(req,res)=>{});



export {createProduct,getAllProducts,getProductsBySlug};