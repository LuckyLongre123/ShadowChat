import { Request, Response } from "express";
import { prisma } from "../config/db.prisma";
import { ApiError } from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import logger from "../utils/logger"; // 👈 Logger imported

// ── GET /api/v1/notifications/preferences ───────────────────────────────────
// Returns the user's notification preferences, creating defaults if first visit.
const getPreferences = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  logger.info(
    `[API] GET /notifications/preferences - Fetching preferences for session`,
  );

  if (!userId) {
    logger.warn(
      `[API] GET /notifications/preferences - Failed: Unauthorized, missing userId in request`,
    );
    throw new ApiError(401, "Unauthorized");
  }

  // upsert: creates with defaults on first access, returns existing otherwise
  const preferences = await prisma.notificationPreferences.upsert({
    where: { userId },
    update: {}, // no changes on a plain GET
    create: {
      userId,
      notificationsEnabled: true,
      desktopNotifications: true,
      soundEnabled: true,
      previewEnabled: true,
      muted: false,
    },
    select: {
      notificationsEnabled: true,
      desktopNotifications: true,
      soundEnabled: true,
      previewEnabled: true,
      muted: true,
      updatedAt: true,
    },
  });

  logger.info(
    `[API] GET /notifications/preferences - Success: Preferences fetched/initialized for user ${userId}`,
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { preferences },
        "Notification preferences fetched successfully",
      ),
    );
});

// ── PUT /api/v1/notifications/preferences ───────────────────────────────────
// Partial update — only the fields included in the body are changed.
const updatePreferences = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  logger.info(`[API] PUT /notifications/preferences - Update requested`);

  if (!userId) {
    logger.warn(
      `[API] PUT /notifications/preferences - Failed: Unauthorized, missing userId in request`,
    );
    throw new ApiError(401, "Unauthorized");
  }

  const {
    notificationsEnabled,
    desktopNotifications,
    soundEnabled,
    previewEnabled,
    muted,
  } = req.body;

  // Build update payload — only include defined fields to allow partial updates
  const updateData: Record<string, boolean> = {};
  if (typeof notificationsEnabled === "boolean")
    updateData.notificationsEnabled = notificationsEnabled;
  if (typeof desktopNotifications === "boolean")
    updateData.desktopNotifications = desktopNotifications;
  if (typeof soundEnabled === "boolean") updateData.soundEnabled = soundEnabled;
  if (typeof previewEnabled === "boolean")
    updateData.previewEnabled = previewEnabled;
  if (typeof muted === "boolean") updateData.muted = muted;

  if (Object.keys(updateData).length === 0) {
    logger.warn(
      `[API] PUT /notifications/preferences - Failed: Empty payload or no valid fields provided by user ${userId}`,
    );
    throw new ApiError(400, "No valid preference fields provided");
  }

  logger.debug(
    `[API] PUT /notifications/preferences - User ${userId} updating fields: ${Object.keys(updateData).join(", ")}`,
  );

  const preferences = await prisma.notificationPreferences.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      notificationsEnabled: notificationsEnabled ?? true,
      desktopNotifications: desktopNotifications ?? true,
      soundEnabled: soundEnabled ?? true,
      previewEnabled: previewEnabled ?? true,
      muted: muted ?? false,
    },
    select: {
      notificationsEnabled: true,
      desktopNotifications: true,
      soundEnabled: true,
      previewEnabled: true,
      muted: true,
      updatedAt: true,
    },
  });

  logger.info(
    `[API] PUT /notifications/preferences - Success: Preferences updated securely for user ${userId}`,
  );

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { preferences },
        "Notification preferences updated successfully",
      ),
    );
});

export default { getPreferences, updatePreferences };
