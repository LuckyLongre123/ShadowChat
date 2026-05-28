import { prisma } from "../config/db.prisma";
import { consumer } from "../config/kafka";
import logger from "../utils/logger";

export const startMessageWorker = async () => {
  await consumer.connect();
  await consumer.subscribe({
    topic: process.env.REDPANDA_KAFKA_TOPIC!,
    fromBeginning: false,
  });

  logger.info(
    `👷 Kafka Worker started listening to ${process.env.REDPANDA_KAFKA_TOPIC}`,
  );

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      if (!message.value) return;

      try {
        const payload = JSON.parse(message.value.toString());

        await prisma.message.create({
          data: {
            id: payload.id,
            content: payload.content,
            senderId: payload.senderId,
            receiverId: payload.receiverId,
            chatId: payload.chatId,
            status: payload.status ?? 'SENT',
            createdAt: new Date(payload.timestamp),
          },
        });
      } catch (error) {
        logger.error("Error saving message to DB", error);
      }
    },
  });
};
