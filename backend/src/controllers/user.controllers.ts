import { Request, Response } from "express";
import { prisma } from "../config/db.prisma";
import { ApiError } from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import logger from "../utils/logger"; // 👈 Logger imported

/**
 * @route   GET /api/v1/users/search?query=email_or_name
 * @desc    Search users by name or email (excludes current user)
 * @access  Private
 */
const searchUsers = asyncHandler(async (req: Request, res: Response) => {
  const { query } = req.query;
  const currentUserId = req.user!.id;

  logger.info(
    `[API] GET /users/search - User ${currentUserId} initiated search with query: "${query}"`,
  );

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    logger.warn(
      `[API] GET /users/search - Failed: Empty or invalid search query provided by user ${currentUserId}`,
    );
    throw new ApiError(400, "Search query is required");
  }

  const searchTerm = query.trim();

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: currentUserId } },
        {
          OR: [
            { name: { contains: searchTerm, mode: "insensitive" } },
            { email: { contains: searchTerm, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
    take: 20, // Industry standard limit check
  });

  logger.info(
    `[API] GET /users/search - Success: Found ${users.length} users matching "${searchTerm}" for user ${currentUserId}`,
  );

  res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users fetched successfully"));
});

export default { searchUsers };
