import {verifyJWT} from "../middlewares/auth.middleware.js";
import{admin} from "../middlewares/isAdmin.middleware.js"
import {createOrderFromCart, getMyOrders, getOrderById , cancelOrder, adminOrderList, updateOrderStatus, updatePaymentStatus,initiatePayment} from "../controllers/order.controller.js";
import { Router } from "express";

const router = Router();

router.route("/orders").post(verifyJWT, createOrderFromCart);
router.route("/orders").get(verifyJWT, getMyOrders);
router.route("/orders/:orderId").get(verifyJWT, getOrderById);
router.route("/orders/:orderId/cancel").patch(verifyJWT, cancelOrder);
router.route("/orders/:orderId/initiate-payment").post(verifyJWT, initiatePayment);
router.route("/admin/orders").get(verifyJWT, admin, adminOrderList);
router.route("/admin/orders/:orderId/status").patch(verifyJWT, admin, updateOrderStatus);
router.route("/admin/orders/:orderId/payment-status").patch(verifyJWT, admin, updatePaymentStatus);

export default router;