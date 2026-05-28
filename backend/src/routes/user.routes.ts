import { Router } from "express";
import userControllers from "../controllers/user.controllers";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

// All user routes require authentication
router.use(verifyJWT);

router.route("/search").get(userControllers.searchUsers);

export default router;
