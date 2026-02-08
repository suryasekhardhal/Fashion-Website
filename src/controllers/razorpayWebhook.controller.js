import crypto from "crypto";
import mongoose from "mongoose";
import { Order } from "../models/order.model.js";
import { Shade } from "../models/shade.model.js";

export const razorpayWebhook = async (req, res) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const signature = req.headers["x-razorpay-signature"];

  // Verify signature
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(req.rawBody)
    .digest("hex");

  if (expectedSignature !== signature) {
    return res.status(400).json({ message: "Invalid webhook signature" });
  }

  const { event, payload } = req.body;

  try {
    // ===============================
    // PAYMENT SUCCESS
    // ===============================
    if (event === "payment.captured") {
      const payment = payload.payment.entity;

      const gatewayOrderId = payment.order_id;
      const paymentId = payment.id;

      const order = await Order.findOne({ gatewayOrderId });

      if (!order) {
        return res.status(200).json({ message: "Order not found" });
      }

      // Idempotency
      if (order.paymentStatus === "completed") {
        return res.status(200).json({ message: "Already processed" });
      }

      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Deduct stock
        for (const item of order.orderItems) {
          const shade = await Shade.findOneAndUpdate(
            {
              _id: item.shade,
              stock: { $gte: item.quantity }
            },
            {
              $inc: { stock: -item.quantity }
            },
            { session, new: true }
          );

          if (!shade) {
            throw new Error("Insufficient stock");
          }
        }

        // Update order
        order.paymentStatus = "completed";
        order.orderStatus = "processing";
        order.paymentId = paymentId;
        order.paymentProvider = "razorpay";
        order.paidAt = new Date();

        await order.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res.status(200).json({ message: "Payment processed" });
      } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
      }
    }

    // ===============================
    // PAYMENT FAILED
    // ===============================
    if (event === "payment.failed") {
      const payment = payload.payment.entity;
      const gatewayOrderId = payment.order_id;

      await Order.findOneAndUpdate(
        { gatewayOrderId },
        { paymentStatus: "failed" }
      );

      return res.status(200).json({ message: "Payment marked failed" });
    }

    return res.status(200).json({ message: "Event ignored" });

  } catch (error) {
    console.error("Webhook Error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};
