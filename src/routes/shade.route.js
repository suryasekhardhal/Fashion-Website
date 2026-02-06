import {verifyJWT} from "../middlewares/auth.middleware.js";
import {admin} from "../middlewares/isAdmin.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";
import {createShade,getShadesByProduct,updateShade,toggleShadeStatus,deleteShade} from "../controllers/shade.controller.js";
import { Router } from "express";

const router = Router();

router.route("/create-shade").post(verifyJWT,admin,upload.single("shadeImage"),createShade);
router.route("/get-shades-by-product/:productId").get(getShadesByProduct);
router.route("/update-shade/:shadeId").put(verifyJWT,admin,upload.single("shadeImage"),updateShade);
router.route("/toggle-shade-status/:shadeId").put(verifyJWT,admin,toggleShadeStatus);
router.route("/delete-shade/:shadeId").delete(verifyJWT,admin,deleteShade);


export default router;