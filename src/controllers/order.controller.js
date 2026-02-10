import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponce } from "../utils/ApiResponce.js";
import { Cart } from "../models/cart.model.js";
import { Order } from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { Shade } from "../models/shade.model.js";

const createOrderFromCart = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        throw new ApiError(401, "Unauthorized user");
    }

    const { shippingAddress, paymentMethod } = req.body;

    if (!shippingAddress || !paymentMethod) {
        throw new ApiError(400, "Shipping address and payment method are required");
    }

    //Fetch cart
    const cart = await Cart.findOne({ user: userId });
    if (!cart || cart.items.length === 0) {
        throw new ApiError(400, "Cart is empty");
    }

    const orderItems = [];
    let totalPrice = 0;

    //Validate each cart item again (final check)
    for (const item of cart.items) {
        const product = await Product.findOne({
            _id: item.product,
            isActive: true,
        });

        if (!product) {
            throw new ApiError(400, "One or more products are no longer available");
        }

        const shade = await Shade.findOne({
            _id: item.shade,
            product: item.product,
            isActive: true,
        });

        if (!shade) {
            throw new ApiError(400, "One or more shades are no longer available");
        }

        if (shade.stock < item.quantity) {
            throw new ApiError(
                400,
                `Insufficient stock for ${product.name} - ${shade.shadeName}`,
            );
        }

        const finalPrice =
            shade.price ?? product.discountedPrice ?? product.basePrice;

        orderItems.push({
            product: item.product,
            shade: item.shade,
            quantity: item.quantity,
            price: finalPrice,
        });

        totalPrice += finalPrice * item.quantity;
    }

    //Create order
    const order = await Order.create({
        user: userId,
        shippingAddress,
        orderItems,
        paymentMethod,
        paymentStatus: paymentMethod === "cod" ? "pending" : "completed",
        orderStatus: "processing",
        totalPrice,
    });

    if (!order) {
        throw new ApiError(500, "Failed to create order");
    }

    //Reduce stock
    for (const item of orderItems) {
        await Shade.findByIdAndUpdate(item.shade, {
            $inc: { stock: -item.quantity },
        });
    }

    //Clear cart
    cart.items = [];
    cart.totalPrice = 0;
    await cart.save();

    return res
        .status(201)
        .json(new ApiResponce(201, order, "Order placed successfully"));
});

const getMyOrders = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized user");
    }

    const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .populate("orderItems.product", "name")
        .populate("orderItems.shade", "shadeName shadeCode")
        .select(
            "orderItems paymentMethod paymentStatus orderStatus totalPrice placedAt",
        );

    return res
        .status(200)
        .json(
            new ApiResponce(
                200,
                orders,
                orders.length > 0 ? "Orders fetched successfully" : "No orders found",
            ),
        );
});

const getOrderById = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const userRole = req.user?.role;
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findById(orderId)
        .populate("orderItems.product", "name")
        .populate("orderItems.shade", "shadeName shadeCode")
        .populate("user", "name email");

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    //Authorization check
    const isOwner = order.user._id.toString() === userId.toString();
    const isAdmin = userRole === "admin";

    if (!isOwner && !isAdmin) {
        throw new ApiError(403, "You are not allowed to view this order");
    }

    return res
        .status(200)
        .json(new ApiResponce(200, order, "Order fetched successfully"));
});

const cancelOrder = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.user.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not allowed to cancel this order");
    }

    if (order.orderStatus !== "processing") {
        throw new ApiError(400, "Order cannot be cancelled at this stage");
    }

    // Restore stock
    for (const item of order.orderItems) {
        await Shade.findByIdAndUpdate(item.shade, {
            $inc: { stock: item.quantity },
        });
    }

    order.orderStatus = "cancelled";
    await order.save();

    return res
        .status(200)
        .json(new ApiResponce(200, order, "Order cancelled successfully"));
});

const adminOrderList = asyncHandler(async (req, res) => {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const orders = await Order.find({})
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    return res
        .status(200)
        .json(new ApiResponce(200, orders, "Orders fetched successfully"));
});

const ORDER_TRANSITIONS = {
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
};


const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { newStatus } = req.body;

    if (!orderId || !newStatus) {
        throw new ApiError(400, "Order ID and newStatus are required");
    }

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    const currentStatus = order.orderStatus;
    const allowedNextStatuses = ORDER_TRANSITIONS[currentStatus] || [];

    if (!allowedNextStatuses.includes(newStatus)) {
        throw new ApiError(
            400,
            `Cannot change order status from '${currentStatus}' to '${newStatus}'`
        );
    }

    // Business rules
    if (newStatus === "shipped") {
        order.shippedAt = new Date();
    }

    if (newStatus === "delivered") {
        order.deliveredAt = new Date();
    }

    order.orderStatus = newStatus;
    await order.save();

    return res.status(200).json(
        new ApiResponce(
            200,
            order,
            `Order status updated to '${newStatus}' successfully`
        )
    );
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { paymentStatus } = req.body;

    const allowedStatuses = ["pending", "completed", "failed"];

    if (!allowedStatuses.includes(paymentStatus)) {
        throw new ApiError(400, "Invalid payment status");
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
        throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.paymentStatus === "completed") {
        throw new ApiError(400, "Payment already completed");
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    return res
        .status(200)
        .json(new ApiResponce(200, order, "Payment status updated successfully"));
});

const initiatePayment = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { orderId } = req.body;

    //Validate orderId
    if (!orderId) {
        throw new ApiError(400, "Order ID is required");
    }

    //Fetch order
    const order = await Order.findOne({
        _id: orderId,
        user: userId,
    });

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    //Validate order state
    if (order.paymentStatus !== "pending") {
        throw new ApiError(400, "Payment already processed for this order");
    }

    if (order.orderStatus === "cancelled") {
        throw new ApiError(400, "Cannot pay for a cancelled order");
    }

    if (!order.totalPrice || order.totalPrice <= 0) {
        throw new ApiError(400, "Invalid order amount");
    }

    //Create payment order on Razorpay
    const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(order.totalPrice * 100), // ₹ → paise
        currency: "INR",
        receipt: `order_rcpt_${order._id}`,
        notes: {
            orderId: order._id.toString(),
            userId: userId.toString(),
        },
    });

    //Save gateway info in DB
    order.gatewayOrderId = razorpayOrder.id;
    order.paymentProvider = "razorpay";
    await order.save();

    //Send payment data to frontend
    return res.status(200).json(
        new ApiResponce(
            200,
            {
                gatewayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                orderId: order._id,
                paymentProvider: "razorpay",
                key: process.env.RAZORPAY_KEY_ID,
            },
            "Payment initiated successfully",
        ),
    );
});

export {
    createOrderFromCart,
    getMyOrders,
    getOrderById,
    cancelOrder,
    adminOrderList,
    updateOrderStatus,
    updatePaymentStatus,
    initiatePayment,
};
