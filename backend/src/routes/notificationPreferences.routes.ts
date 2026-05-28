import { Router } from "express";
import notificationPreferencesController from "../controllers/notificationPreferences.controllers";
import verifyJWT from "../middlewares/auth.middleware";

const router = Router();

// All notification preference routes require authentication
router.use(verifyJWT);

// GET  /api/v1/notifications/preferences
router.get("/preferences", notificationPreferencesController.getPreferences);

// PUT  /api/v1/notifications/preferences
router.put("/preferences", notificationPreferencesController.updatePreferences);

export default router;
