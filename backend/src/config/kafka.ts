import { Kafka, Partitioners } from "kafkajs";
import logger from "../utils/logger";
import { prisma } from "./db.prisma";

const kafka = new Kafka({
  clientId: "whatsapp-clone-backend",
  brokers: [process.env.REDPANDA_KAFKA_BROKER_URL as string],
  ssl: {},
  sasl: {
    mechanism: "scram-sha-256",
    username: process.env.REDPANDA_KAFKA_USERNAME as string,
    password: process.env.REDPANDA_KAFKA_PASSWORD as string,
  },

  connectionTimeout: 10000,
  authenticationTimeout: 10000,
  retry: {
    initialRetryTime: 300,
    retries: 5,
    restartOnFailure: async (error) => true,
  },
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});
export const consumer = kafka.consumer({ groupId: "chat-messages-group" });

export const connectKafka = async () => {
  try {
    await producer.connect();
    logger.info("🟢 Connected to Redpanda (Kafka Producer)");

    (async () => {
      try {
        await consumer.subscribe({
          topic: process.env.REDPANDA_KAFKA_TOPIC!,
          fromBeginning: false,
        });

        await consumer.run({
          eachMessage: async ({ message }) => {
            if (!message.value) return;

            try {
              const payload = JSON.parse(message.value.toString());

              // save to db
              await prisma.message.create({
                data: {
                  id: payload.id,
                  content: payload.content,
                  senderId: payload.senderId,
                  receiverId: payload.receiverId,
                  chatId: payload.chatId,
                  status: "SENT",
                  createdAt: new Date(payload.timestamp),
                },
              });
              logger.info(
                `💾 [Redpanda Consumer]: Synced Message ${payload.id} to DB`,
              );
            } catch (dbError) {
              logger.error(
                "❌ Database sync failed inside consumer worker thread:",
                dbError,
              );
            }
          },
        });

        logger.info("🎧 Redpanda Consumer is now running in the background");
      } catch (consumerError) {
        logger.error("🔴 Kafka Consumer Background Error:", consumerError);
      }
    })();
  } catch (error) {
    logger.error("🔴 Kafka Producer Connection Error", error);
  }
};
