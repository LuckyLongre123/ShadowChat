import "dotenv/config";

import { createServer } from "http";
import app from "./app";
import { checkDBConnection } from "./config/db.prisma";
import { connectKafka } from "./config/kafka";
import { initializeSocket } from "./socket";
import logger from "./utils/logger";

const PORT = process.env.PORT || 8000;

const httpServer = createServer(app);

const startServer = async () => {
  try {
    // Initialize Database Connection Here
    await checkDBConnection();

    initializeSocket(httpServer);

    await connectKafka();

    httpServer.listen(PORT, () => {
      logger.info(`Server is running on port: ${PORT}`);
      logger.info("The Root Api: /api/v1/auth");
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
};

startServer();
