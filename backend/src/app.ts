import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import { corsOptions } from "./constants";
import globalErrorHandler from "./middlewares/errorHandler";

const app: Application = express();

// global middleware
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https://lh3.googleusercontent.com"],
        connectSrc: [
          "'self'",
          "https://shadow-chat-six.vercel.app",
          "http://localhost:3000",
        ],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  }),
);
app.use(cors(corsOptions));
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// route imports
import authRoute from "./routes/auth.routes";
import chatRoute from "./routes/chat.routes";
import notificationRoute from "./routes/notificationPreferences.routes";
import userRoute from "./routes/user.routes";

// use routes
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/chats", chatRoute);
app.use("/api/v1/notifications", notificationRoute);

app.get("/", (_, res) => {
  res.send("Backend Running");
});

// global error handler
app.use(globalErrorHandler);

export default app;
