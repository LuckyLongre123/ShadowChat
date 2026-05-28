import { Router } from "express";
import authControllers from "../controllers/auth.controllers";
import validateZod from "../middlewares/validateRequest";
import {
  firebaseAuthTokenSchema,
  phoneSchema,
  verifyOtpSchema,
} from "../schemas/auth.schema";

const router = Router();

router.route("/me").get(authControllers.getMe);
router.route("/logout").post(authControllers.logout);

router
  .route("/send-otp")
  .post(validateZod(phoneSchema), authControllers.sendVerificationOTP);

router
  .route("/verify-otp")
  .post(validateZod(verifyOtpSchema), authControllers.verifyOTP);

router
  .route("/google")
  .post(validateZod(firebaseAuthTokenSchema), authControllers.googleLogin);
export default router;
