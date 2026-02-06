import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Product } from "../models/product.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Category } from "../models/category.model.js";
import mongoose from "mongoose";

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
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400,"Invalid product ID");
    }
    const product = await Product.findById(productId);
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    product.isActive = !product.isActive;
    await product.save();
    return res.status(200)
    .json(new ApiResponce(
        200,
        {isActive:product.isActive},
        `Product has been ${product.isActive ? 'activated' : 'deactivated'} successfully`,
    ))

});

const updateProduct = asyncHandler(async(req,res)=>{
    // Implementation for updating a product
    // there is slug generation problem - fix it later - fixed
    const {productId} = req.params;
    const {name,brand,category,basePrice,discountedPrice,description,ingredients,howToUse,skinType} = req.body;
    //upadte the file also later
    const product = await Product.findById(productId);
    if(!product){
        throw new ApiError(404,"Product not found");
    }
    if(name) product.name = name;
    if(brand) product.brand = brand;
    if(category) {
        const categoryExists = await Category.findOne({_id:category,isActive:true});
        if(!categoryExists){
            throw new ApiError(400,"Invalid category");
        }
        product.category = category;
    }
    // validate prices-later
    if(basePrice !== undefined && basePrice !== null) product.basePrice = basePrice;
    if(discountedPrice !== undefined && discountedPrice !== null) product.discountedPrice = discountedPrice;
    if(description) product.description = description;
    if(ingredients) product.ingredients = ingredients;
    if(howToUse) product.howToUse = howToUse;
    if(skinType) product.skinType = skinType;
    await product.save();
    await product.populate("category", "name slug");
    return res.status(200)
    .json(new ApiResponce(
        200,
        product,
        "Product updated successfully",
    ))
});

const searchProducts = asyncHandler(async(req,res)=>{
    const {q,query,category} = req.query;
    const searchQuery = q || query;
    if(!searchQuery){
        throw new ApiError(400,"Search query is required");
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const filter = {isActive:true};
    if(searchQuery){
        const regex = new RegExp(searchQuery,"i");
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
    .populate("category","name slug")
    .sort({createdAt:-1})
    .limit(limit)
    .skip(skip)
    .lean();

    return res.status(200)
    .json(new ApiResponce(
        200,
        products,
        products.length > 0 ? "Products fetched successfully" : "No products found",
    ))


});

const adminProductList = asyncHandler(async(req,res)=>{
    // Implementation for admin to get all products with more details and filters
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    if(req.query.category) filter.category = req.query.category;
    if(req.query.isActive) filter.isActive = req.query.isActive === 'true';
    if(req.query.brand) filter.brand = new RegExp(req.query.brand,"i");

    const totalProducts = await Product.countDocuments(filter);

    const products =  await Product.find(filter)
    .lean()
    .populate("category","name slug")
    .sort({createdAt:-1})
    .skip(skip)
    .limit(limit);

    return res.status(200)
        .json(new ApiResponce(
            200,
            {
                products,
                pagination:{
                    totalProducts,
                    page,
                    limit,
                    totalPages: Math.ceil(totalProducts / limit)
                }
            },
            "Admin only Products fetched successfully",
        ))
})

const bulkProductAction = asyncHandler(async(req,res)=>{
    const {action,productIds} = req.body;
    if(!action || !productIds || !Array.isArray(productIds) || productIds.length === 0){
        throw new ApiError(400,"Action and productIds are required and productIds should be a non-empty array");
    }

    const InvalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if(InvalidIds.length > 0){
        throw new ApiError(400,`Invalid product IDs: ${InvalidIds.join(", ")}`);
    }

    let update = {};

    switch (action) {
        case "enable":
            update = {isActive:true};
            break;
        case "disable":
            update = {isActive:false};
            break;
        case "feature":
            update = {isFeatured:true};
            break;
        case "unfeature":
            update = {isFeatured:false};
            break;
        default:
            throw new ApiError(400,"Invalid action");            
    }
    const result = await Product.updateMany({
        _id:{$in:productIds}},
        {$set:update}
    );
    return res.status(200)
    .json(new ApiResponce( 
        200,
        {
            matched: result.matchedCount,
            modified: result.modifiedCount
        },
        "Bulk action performed successfully",
    ))
})

const bulkCategoryChange = asyncHandler(async(req,res)=>{
    const {productIds,newCategoryId} = req.body;
    if(!newCategoryId || !mongoose.Types.ObjectId.isValid(newCategoryId)){
        throw new ApiError(400,"Valid newCategoryId is required");
    }
    if(!productIds || !Array.isArray(productIds) || productIds.length === 0){
        throw new ApiError(400,"productIds should be a non-empty array");
    }
    const categoryExists = await Category.findOne({_id:newCategoryId,isActive:true});
    if(!categoryExists){
        throw new ApiError(400,"Invalid category");
    }
    const InvalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if(InvalidIds.length > 0){
        throw new ApiError(400,`Invalid product IDs: ${InvalidIds.join(", ")}`);
    }
    const result = await Product.updateMany({
        _id:{$in:productIds},isActive:true},
        {$set:{category:newCategoryId}}
    );
    return res.status(200)
    .json(new ApiResponce(
        200,
        {
            matched: result.matchedCount,
            modified: result.modifiedCount
        },
        "Bulk category change performed successfully",
    ))
})

const bulkPriceDiscount = asyncHandler(async(req,res)=>{
    const {productIds,discountPercentage} = req.body;
    if(discountPercentage === undefined || discountPercentage === null || isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100){
        throw new ApiError(400,"Valid discountPercentage between 0 and 100 is required");
    }
    if(!productIds || !Array.isArray(productIds) || productIds.length === 0){
        throw new ApiError(400,"productIds should be a non-empty array");
    }
    const InvalidIds = productIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if(InvalidIds.length > 0){
        throw new ApiError(400,`Invalid product IDs: ${InvalidIds.join(", ")}`);
    }
    const products = await Product.find({_id:{$in:productIds},isActive:true});
    
    if(products.length === 0){
        throw new ApiError(404,"No active products found for discount in the given IDs");
    }

    const bulkOperations = products.map(product => {
        const newDiscountedPrice = Math.round(product.basePrice * (1 - discountPercentage / 100));
        return {
            updateOne: {
                filter: { _id: product._id },
                update: { discountedPrice: newDiscountedPrice }
            }
        };
    });
    const result = await Product.bulkWrite(bulkOperations);
    return res.status(200)
        .json(new ApiResponce(
            200,
            {
                matched: result.matchedCount,
                modified: result.modifiedCount
            },
            "Bulk price discount applied successfully",
        ))
})

// getRelatedProducts(productId) - Used for: “You may also like”
// Add later when frontend needs it.



export {createProduct,getAllProducts,getProductsByCategory,getProductsBySlug,updateProduct,toggleProductStatus,searchProducts,adminProductList,bulkProductAction,bulkCategoryChange,bulkPriceDiscount};