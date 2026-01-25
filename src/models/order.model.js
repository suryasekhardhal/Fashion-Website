import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
{
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    shippingAddress: {
        fullName: {
            type: String,
            required: true,
        },
        phone: {
            type: String,
            required: true,
        },
        street: {
            type: String,
            required: true,
        },
        city: {
            type: String,
            required: true,
        },
        state: {
            type: String,
            required: true,
        },
        zipCode: {
            type: String,
            required: true,
        },
        country: {
            type: String,
            required: true,
        },
    },

    orderItems: [
    {
        product: {
            type: Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
        },
        shade: {
        type: Schema.Types.ObjectId,
        ref: "Shade",
        required: true,
        },
    },
    ],
    paymentMethod: {
        type: String,
        enum: ["cod", "upi", "card", "netbanking", "wallet"],
        required: true

    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    orderStatus: {
        type: String,
        enum: ["processing", "shipped", "delivered", "cancelled"],
        default: "processing",
    },
    totalPrice: {
        type: Number,
    },
    placedAt: {
        type: Date,
        default: Date.now,
    },
    deliveredAt: {
        type: Date,
    },
},
{ timestamps: true },
);

orderSchema.index({ user: 1 });

export const Order = mongoose.model("Order", orderSchema);
