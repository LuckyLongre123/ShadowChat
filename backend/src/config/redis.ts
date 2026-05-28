import Redis from "ioredis";
import logger from "../utils/logger";

const redisClient = new Redis(process.env.UPSTASH_REDIS_REST_URL as string);

redisClient.on("connect", () => logger.info("🟢 Connected to Upstash Redis"));
redisClient.on("error", (err) => logger.error("🔴 Redis Error", err));

export default redisClient;
