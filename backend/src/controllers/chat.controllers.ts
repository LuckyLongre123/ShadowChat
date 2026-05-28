import { Request, Response } from "express";
import { prisma } from "../config/db.prisma";
import { ApiError } from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import logger from "../utils/logger"; // 👈 Logger imported

/**
 * Generates a deterministic chatId for a 1-on-1 conversation.
 * Sorts user IDs so both users always get the same chatId.
 */
function generateChatId(userA: string, userB: string): string {
  const sorted = [userA, userB].sort();
  return `chat_${sorted[0]}_${sorted[1]}`;
}

/**
 * @route   POST /api/v1/chats/access
 * @desc    Access or initiate a chat with another user
 * @access  Private
 */
const accessChat = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.body;
  const currentUserId = req.user!.id;

  logger.info(
    `[API] POST /chats/access - User ${currentUserId} requesting chat with Target ${userId}`,
  );

  if (!userId || typeof userId !== "string") {
    logger.warn(
      `[API] POST /chats/access - Failed: target userId is missing or invalid payload`,
    );
    throw new ApiError(400, "userId is required");
  }

  if (userId === currentUserId) {
    logger.warn(
      `[API] POST /chats/access - Failed: User ${currentUserId} attempted to chat with themselves`,
    );
    throw new ApiError(400, "Cannot start a chat with yourself");
  }

  // Verify the target user exists
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true },
  });

  if (!targetUser) {
    logger.warn(
      `[API] POST /chats/access - Failed: Target user ${userId} not found in DB`,
    );
    throw new ApiError(404, "User not found");
  }

  // Generate deterministic chatId
  const chatId = generateChatId(currentUserId, userId);
  logger.info(`[API] POST /chats/access - Generated/Mapped Chat ID: ${chatId}`);

  // Fetch messages for this chat
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      senderId: true,
      receiverId: true,
      chatId: true,
      status: true,
      createdAt: true,
    },
  });

  const isNewChat = messages.length === 0;

  logger.info(
    `[API] POST /chats/access - Success: Chat ${chatId} fetched. Is New: ${isNewChat}, History Length: ${messages.length}`,
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        chatId,
        isNewChat,
        participant: targetUser,
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          receiverId: m.receiverId,
          chatId: m.chatId,
          status: m.status,
          timestamp: m.createdAt.toISOString(),
        })),
      },
      isNewChat ? "New chat initiated" : "Chat fetched successfully",
    ),
  );
});

/**
 * @route   GET /api/v1/chats
 * @desc    Get all chats for the current user (with real unread counts)
 * @access  Private
 *
 * OPTIMIZED: Uses minimal queries instead of N+1
 */
const getUserChats = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user!.id;
  logger.info(
    `[API] GET /chats - Fetching all recent chats for user: ${currentUserId}`,
  );

  // ── Get all messages where user is sender or receiver (for chat list)
  const allMessages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    },
    select: {
      id: true,
      content: true,
      senderId: true,
      receiverId: true,
      chatId: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  if (allMessages.length === 0) {
    logger.info(
      `[API] GET /chats - Success: No chat history found for user ${currentUserId}`,
    );
    res.status(200).json(new ApiResponse(200, { chats: [] }, "No chats found"));
    return;
  }

  // ── Get latest message per chat (deduplicate)
  const latestMessagesMap = new Map<string, (typeof allMessages)[0]>();
  const otherUserIds = new Set<string>();

  for (const msg of allMessages) {
    if (!latestMessagesMap.has(msg.chatId)) {
      latestMessagesMap.set(msg.chatId, msg);
      // Determine the other user in this chat
      const otherUserId =
        msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
      otherUserIds.add(otherUserId);
    }
  }

  // ── Fetch all participant users in ONE query (instead of N queries)
  const participants = await prisma.user.findMany({
    where: { id: { in: Array.from(otherUserIds) } },
    select: { id: true, name: true, email: true, avatar: true },
  });

  const participantMap = new Map(participants.map((p) => [p.id, p]));

  // ── Get unread counts for all chats (in ONE query instead of N)
  const unreadCounts = await prisma.message.groupBy({
    by: ["chatId"],
    where: {
      receiverId: currentUserId,
      status: { not: "READ" },
    },
    _count: true,
  });

  const unreadCountMap = new Map(
    unreadCounts.map((uc) => [uc.chatId, uc._count]),
  );

  // ── Build final chat list
  const chats = Array.from(latestMessagesMap.values())
    .map((lastMessage) => {
      const otherUserId =
        lastMessage.senderId === currentUserId
          ? lastMessage.receiverId
          : lastMessage.senderId;

      const participant = participantMap.get(otherUserId);
      if (!participant) return null;

      return {
        id: lastMessage.chatId,
        participant: {
          id: participant.id,
          name: participant.name,
          email: participant.email,
          avatar: participant.avatar,
          isOnline: false, // Will be set by socket on client
        },
        lastMessage: lastMessage.content,
        lastMessageTime: lastMessage.createdAt.toISOString(),
        unreadCount: unreadCountMap.get(lastMessage.chatId) || 0,
      };
    })
    .filter(Boolean);

  // Sort by latest message time
  chats.sort(
    (a, b) =>
      new Date(b!.lastMessageTime).getTime() -
      new Date(a!.lastMessageTime).getTime(),
  );

  logger.info(
    `[API] GET /chats - Success: Fetched and aggregated ${chats.length} active chats for user ${currentUserId}`,
  );

  res
    .status(200)
    .json(new ApiResponse(200, { chats }, "Chats fetched successfully"));
});

/**
 * @route   GET /api/v1/chats/:chatId/messages
 * @desc    Get message history for a specific chat
 * @access  Private
 */
const getChatMessages = asyncHandler(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const currentUserId = req.user!.id;

  logger.info(
    `[API] GET /chats/${chatId}/messages - Fetching messages for user: ${currentUserId}`,
  );

  if (!chatId) {
    logger.warn(
      `[API] GET /chats/${chatId}/messages - Failed: chatId parameter is missing`,
    );
    throw new ApiError(400, "chatId is required");
  }

  // Verify the user is a participant in this chat
  const userMessage = await prisma.message.findFirst({
    where: {
      chatId: chatId as string,
      OR: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    },
  });

  if (!userMessage) {
    // Either chat doesn't exist or user isn't a participant — return empty
    logger.warn(
      `[API] GET /chats/${chatId}/messages - Empty Return: User ${currentUserId} is not a participant or chat is completely empty`,
    );
    res
      .status(200)
      .json(new ApiResponse(200, { messages: [] }, "No messages found"));
    return;
  }

  const messages = await prisma.message.findMany({
    where: { chatId: chatId as string },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      senderId: true,
      receiverId: true,
      chatId: true,
      status: true,
      createdAt: true,
    },
  });

  logger.info(
    `[API] GET /chats/${chatId}/messages - Success: Fetched ${messages.length} messages`,
  );

  res.status(200).json(
    new ApiResponse(
      200,
      {
        messages: messages.map((m) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          receiverId: m.receiverId,
          chatId: m.chatId,
          status: m.status,
          timestamp: m.createdAt.toISOString(),
        })),
      },
      "Messages fetched successfully",
    ),
  );
});

export default { accessChat, getUserChats, getChatMessages };
