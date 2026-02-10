import { Review } from "../models/review.model.js";
import { ApiError } from "../utils/ApiError.js";
import { Product } from "../models/product.model.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose, { mongo } from "mongoose";

const createOrUpdateReview = asyncHandler(async (req, res) => {
    const { productId, comment, rating } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    // Validate rating
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be a number between 1 and 5");
    }

    // Ensure product exists
    const product = await Product.findById(productId);
    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    // Check existing review
    const existingReview = await Review.findOne({
        product: productId,
        user: req.user._id,
    });

    if (existingReview) {
        existingReview.rating = rating;
        if (comment !== undefined) {
            existingReview.comment = comment;
        }

        await existingReview.save();

        return res.status(200).json(
            new ApiResponce(
                200,
                existingReview,
                "Review updated successfully"
            )
        );
    }

    // Create new review
    const review = await Review.create({
        product: productId,
        user: req.user._id,
        rating,
        comment,
    });

    return res.status(201).json(
        new ApiResponce(
            201,
            review,
            "Review created successfully"
        )
    );
});

const getAllReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
        throw new ApiError(400, "Invalid product ID");
    }

    // Ensure product exists
    const productExists = await Product.exists({ _id: productId });
    if (!productExists) {
        throw new ApiError(404, "Product not found");
    }

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalReviews = await Review.countDocuments({ product: productId });

    const reviews = await Review.find({ product: productId })
        .populate("user", "name")
        .sort({ createdAt: -1 }) // latest first
        .skip(skip)
        .limit(limit)
        .lean();

    return res.status(200).json(
        new ApiResponce(
            200,
            {
                reviews,
                pagination: {
                    totalReviews,
                    page,
                    limit,
                    totalPages: Math.ceil(totalReviews / limit),
                },
            },
            reviews.length > 0
                ? "Reviews fetched successfully"
                : "No reviews found for this product"
        )
    );
});


const deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
        throw new ApiError(400, "Invalid review ID");
    }

    const review = await Review.findById(reviewId);

    if (!review) {
        throw new ApiError(404, "Review not found");
    }

    // Authorization: owner or admin
    if (
        review.user.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
    ) {
        throw new ApiError(403, "You are not allowed to delete this review");
    }

    await review.deleteOne();

    return res.status(200).json(
        new ApiResponce(
            200,
            null,
            "Review deleted successfully"
        )
    );
});


export { createOrUpdateReview, deleteReview ,getAllReviews};

