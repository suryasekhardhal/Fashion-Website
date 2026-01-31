import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Category } from "../models/category.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const createCategory = asyncHandler(async (req, res) => {
    const {name,description} = req.body
    if(!name || !description){
        throw new ApiError(400,"Name, description and image are required")
    }
    const categoryImageLocalPath = req.file?.path
    if(!categoryImageLocalPath){
        throw new ApiError(400,"Category image is required")
    }
    const image = await uploadOnCloudinary(categoryImageLocalPath)
    if(!image){
        throw new ApiError(500,"Failed to upload image to cloudinary")
    }

    const category = await Category.create({
        name,
        description,
        image:image.url
    })
    const createdCategory = await Category.findById(category._id)

    if(!createdCategory){
        throw new ApiError(500,"Failed to create category")
    }

    return res.status(201)
    .json(new ApiResponce(
        201,
        createdCategory,
        "Category created successfully",
        ))


});

const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({isActive:true}).select("name image slug").sort({ createdAt: -1 })
    return res.status(200)  
        .json(new ApiResponce(
            200,
            categories,
            "Categories fetched successfully"
        ))
})

const getCategoryBySlug = asyncHandler(async(req,res)=>{
    const {slug} = req.params
    if(!slug){
        throw new ApiError(400,"Slug is required")
    }
    const slugCategory = await Category.findOne({slug,isActive:true})
    if(!slugCategory){
        throw new ApiError(404,"Category not found")
    }
    return res.status(200)
    .json(new ApiResponce(
        200,
        slugCategory,
        "Category fetched successfully"
    ))
    
})

const toggleCategory = asyncHandler(async(req,res)=>{
    const {slug} = req.params
    if(!slug){
        throw new ApiError(400,"Slug is required")
    }
    const category = await Category.findOneAndUpdate({slug})
    if(!category){
        throw new ApiError(404,"Category not found")
    }
   
    category.isActive = !category.isActive
    await category.save()
    
    return res.status(200)
        .json(new ApiResponce(
            200,
            category,
            `${category.isActive ? "Enabled" : "Disabled"} Category successfully`
        ))
})

export { createCategory, getAllCategories, getCategoryBySlug, toggleCategory };