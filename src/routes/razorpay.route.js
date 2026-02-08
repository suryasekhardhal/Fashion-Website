import { Router } from "express";
import { razorpayWebhook } from "../controllers/razorpayWebhook.controller.js";

const router = Router();

router.route("/razorpay/webhook").post(razorpayWebhook);

export default router;
