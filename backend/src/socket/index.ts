import { createAdapter } from "@socket.io/redis-streams-adapter";
import cookie from "cookie";
import { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, Socket } from "socket.io";
import { prisma } from "../config/db.prisma";

import { producer } from "../config/kafka";
import redisClient from "../config/redis";
import logger from "../utils/logger";

// ── In-memory online user tracking ──────────────────────────────────────────
const onlineUsers = new Map<string, Set<string>>(); // userId → Set<socketId>

function addOnlineUser(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
}

function removeOnlineUser(userId: string, socketId: string) {
  const sockets = onlineUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      onlineUsers.delete(userId);
    }
  }
}

function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

function getOnlineUserIds(): string[] {
  return Array.from(onlineUsers.keys());
}

export const initializeSocket = (httpsServer: HttpServer) => {
  const io = new Server(httpsServer, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    },
    adapter: createAdapter(redisClient),
  });

  // ── JWT Auth Middleware ──────────────────────────────────────────────────
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie || "");
      const token = cookies?.accessToken;

      if (!token) return next(new Error("Authentication error: No token"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        id: string;
      };

      socket.data.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  // ── Connection Handler ──────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    logger.info(`User connected: ${userId} (Socket: ${socket.id})`);

    // Join personal room
    socket.join(userId);

    // Track online status
    addOnlineUser(userId, socket.id);

    // Broadcast to all connected clients that this user is online
    socket.broadcast.emit("user_online", { userId });

    // Send the connecting client the list of currently online users
    socket.emit("get_online_users", { onlineUsers: getOnlineUserIds() });

    // ── Send Message ────────────────────────────────────────────────────
    socket.on(
      "send_message",
      async (
        data: { receiverId: string; content: string; chatId: string },
        ackCallback?: (ack: {
          id: string;
          chatId: string;
          timestamp: string;
        }) => void,
      ) => {
        // Validate payload before any string operations
        if (
          !data.chatId ||
          typeof data.chatId !== "string" ||
          !data.receiverId ||
          typeof data.receiverId !== "string" ||
          !data.content ||
          typeof data.content !== "string"
        ) {
          logger.error(
            `Invalid send_message payload from ${userId}: ${JSON.stringify(data)}`,
          );
          return;
        }

        // Generate deterministic chatId if client sends a temp id
        let chatId = data.chatId;
        if (chatId.startsWith("temp_")) {
          const sorted = [userId, data.receiverId].sort();
          chatId = `chat_${sorted[0]}_${sorted[1]}`;
        }

        const messageId = crypto.randomUUID();
        const timestamp = new Date().toISOString();

        // ── 1. FAST PATH: Immediate Ack to Sender ──
        if (typeof ackCallback === "function") {
          ackCallback({ id: messageId, chatId, timestamp });
        }

        // ── 2. FAST PATH: Immediate Emit to Receiver (UI updates instantly) ──
        // We emit with default/null sender profile. The frontend can resolve
        // the sender name/avatar from its own chat cache anyway.
        const fastPayload = {
          id: messageId,
          senderId: userId,
          senderName: "User", // Defaults for the fast path
          senderAvatar: null,
          receiverId: data.receiverId,
          content: data.content,
          chatId,
          timestamp,
          status: "SENT",
        };

        io.to(data.receiverId).emit("receive_message", fastPayload);

        // ── 3. BACKGROUND TASKS: Heavy DB & Kafka Operations ──
        // Fire and forget without blocking the socket event loop
        Promise.resolve().then(async () => {
          let senderName = "User";
          let senderAvatar: string | null = null;
          try {
            const sender = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, avatar: true },
            });
            if (sender) {
              senderName = sender.name;
              senderAvatar = sender.avatar;
            }
          } catch (err) {
            logger.error("Failed to fetch sender info", err);
          }

          const fullPayload = {
            ...fastPayload,
            senderName,
            senderAvatar,
          };

          // Push to Kafka (fire-and-forget — non-blocking)
          producer
            .send({
              topic: process.env.REDPANDA_KAFKA_TOPIC!,
              messages: [
                {
                  key: chatId,
                  value: JSON.stringify(fullPayload),
                },
              ],
            })
            .catch((kafkaError) => {
              logger.error(
                "Failed to stream message to Kafka background thread",
                kafkaError,
              );
            });
        });

        // Browser-side notification system handles all notification delivery.
        // The frontend listens to 'receive_message' via Socket.IO and decides
        // whether to show a browser notification based on visibility state,
        // active chat context, and user preferences stored in the DB.
      },
    );

    // ── Mark Messages as Read ─────────────────────────────────────────────
    socket.on(
      "mark_messages_read",
      async (data: { chatId: string; senderId: string }) => {
        if (!data.chatId || !data.senderId) {
          logger.error(
            `Invalid mark_messages_read payload from ${userId}: ${JSON.stringify(data)}`,
          );
          return;
        }

        try {
          // Update all unread messages in this chat sent BY the other user TO me
          await prisma.message.updateMany({
            where: {
              chatId: data.chatId,
              senderId: data.senderId,
              receiverId: userId,
              status: { not: "READ" },
            },
            data: { status: "READ" },
          });

          // Notify the original sender that their messages have been read
          io.to(data.senderId).emit("messages_read", {
            chatId: data.chatId,
            readBy: userId,
          });
        } catch (error) {
          logger.error("Failed to mark messages as read", error);
        }
      },
    );

    // ── Disconnect ────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId}`);
      removeOnlineUser(userId, socket.id);

      // Only broadcast offline if user has no other active sockets
      if (!isUserOnline(userId)) {
        socket.broadcast.emit("user_offline", { userId });
      }
    });
  });

  return io;
};
