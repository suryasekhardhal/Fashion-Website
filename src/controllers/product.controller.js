import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Category } from "../models/category.model.js";

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

const getAllProducts = asyncHandler(async(req,res)=>{
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    
    const filter = {isActive:true};
    if(req.query.category) filter.category = req.query.category;
    if(req.query.isFeatured) filter.isFeatured = req.query.isFeatured === 'true';
    if(req.query.isNewArrival) filter.isNewArrival = req.query.isNewArrival === 'true';
    if(req.query.skinType) filter.skinType = req.query.skinType;

    const products =  await Product.find(filter)
    .lean()
    .populate("category","name slug")
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit);

    return res.status(200)
        .json(new ApiResponce(
            200,
            products,
            "Products fetched successfully",
        ))
});

const getProductsByCategory = asyncHandler(async(req,res)=>{
    const {slug} = req.params;
    const category = await Category.findOne({slug,isActive:true});
    if(!category){
        throw new ApiError(404,"Category not found");
    }   
    const products = await Product.find({category:category._id,isActive:true})
    .lean()
    .populate("category","name slug")
    .sort({createdAt:-1});
    if (!products || products.length === 0) {
        return res.status(200)
        .json(new ApiResponce(
            200,
            [],
            "No products found for this category",
        ));
    }
    return res.status(200)
    .json(new ApiResponce(
        200,
        products,
        "Products fetched successfully",
    ))

});

const getProductsBySlug = asyncHandler(async(req,res)=>{
    const {slug} = req.params;  
    const products = await Product.findOne({slug,isActive:true})
    .lean()
    .populate("category","name slug")
    .sort({createdAt:-1});
    if (!products || products.length === 0) {
        return res.status(200)
        .json(new ApiResponce(
            200,
            [],
            "No products found for this slug",
        ));
    }
    return res.status(200)
    .json(new ApiResponce(
        200,
        products,
        "Products fetched successfully",
    ))

});

const toggleProductStatus = asyncHandler(async(req,res)=>{
    // Implementation for toggling product status
    const {productId} = req.params;
    const product = await Product.findById(productId);
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    product.isActive = !product.isActive;
    await product.save();
    return res.status(200)
    .json(new ApiResponce(
        200,
        product,
        `Product has been ${product.isActive ? 'activated' : 'deactivated'} successfully`,
    ))

});

const updateProduct = asyncHandler(async(req,res)=>{
    // Implementation for updating a product
    // there is slug generation problem - fix it later
    const {productId} = req.params;
    const {name,brand,category,basePrice,discountedPrice,description,ingredients,howToUse,skinType} = req.body;
    //upadte the file also later
    const product = await Product.findByIdAndUpdate(productId,{
        name,
        brand,
        category,
        basePrice,
        discountedPrice,
        description,
        ingredients,
        howToUse,
        skinType
    },{new:true});
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    return res.status(200)
    .json(new ApiResponce(
        200,
        product,
        "Product updated successfully",
    ))
});

const searchProducts = asyncHandler(async(req,res)=>{
    const {query,category} = req.query;
    const filter = {isActive:true};
    if(query){
        const regex = new RegExp(query,"i");
        filter.$or = [
            {name:regex},
            {brand:regex}
        ]
    }

    if(category){
        const categoryDoc = await Category.findOne({slug:category,isActive:true});
        if(!categoryDoc){
        throw new ApiError(400,"Invalid category");
    }
    filter.category = categoryDoc._id;
    }

    const products = await Product.find(filter)
    .lean()
    .populate("category","name slug")
    .sort({createdAt:-1})
    .limit(20);

    return res.status(200)
    .json(new ApiResponce(
        200,
        products,
        products.length > 0 ? "Products fetched successfully" : "No products found",
    ))


});

const deleteProduct = asyncHandler(async(req,res)=>{
    // Implementation for deleting a product
    const {productId} = req.params;
    const product = await Product.findByIdAndDelete(productId);
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    return res.status(200)
    .json(new ApiResponce(
        200,
        null,
        "Product deleted successfully",
    ))
});

export {createProduct,getAllProducts,getProductsByCategory,getProductsBySlug,updateProduct,deleteProduct,toggleProductStatus,searchProducts};