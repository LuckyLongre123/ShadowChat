import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import logger from "../utils/logger";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const checkDBConnection = async () => {
  try {
    await prisma.$connect();

    logger.info("✅ Database connected successfully");
  } catch (err) {
    logger.error("❌ Database connection failed");
    logger.error(err);

    process.exit(1);
  }
};

export { checkDBConnection, prisma };
