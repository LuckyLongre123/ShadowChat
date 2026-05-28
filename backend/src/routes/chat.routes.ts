import { Router } from "express";
import chatControllers from "../controllers/chat.controllers";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

// All chat routes require authentication
router.use(verifyJWT);

router.route("/").get(chatControllers.getUserChats);
router.route("/access").post(chatControllers.accessChat);
router.route("/:chatId/messages").get(chatControllers.getChatMessages);

export default router;
