import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../config/db.prisma";
import firebaseAdminAuth from "../config/firebase-admin";
import { cookieOptions } from "../constants";
import {
  FirebaseAuthTokenType,
  PhoneType,
  VerifyOtpType,
} from "../schemas/auth.schema";
import {
  checkVerificationSMS,
  sendVerificationSMS,
} from "../services/twilio.service";
import { ApiError } from "../utils/ApiError";
import ApiResponse from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import { generateToken } from "../utils/jwt";
import logger from "../utils/logger";

const getMe = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`[API] GET /auth/me - Fetching profile for current session`);

  const token = req.cookies.accessToken;

  if (!token) {
    logger.warn(`[API] GET /auth/me - Failed: No accessToken cookie found`);
    throw new ApiError(401, "Not authenticated");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
    id: string;
  };

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      phone: true,
    },
  });

  if (!user) {
    logger.warn(
      `[API] GET /auth/me - Failed: User ID ${decoded.id} no longer exists in DB`,
    );
    throw new ApiError(404, "User no longer exists");
  }

  logger.info(
    `[API] GET /auth/me - Success: Profile fetched for user ${user.id}`,
  );
  res
    .status(200)
    .json(new ApiResponse(200, { user }, "User profile fetched successfully"));
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  logger.info(`[API] POST /auth/logout - Processing logout request`);

  res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "Logged out successfully"));

  logger.info(`[API] POST /auth/logout - Success: accessToken cleared`);
});

const sendVerificationOTP = asyncHandler(
  async (req: Request<{}, {}, PhoneType>, res: Response): Promise<void> => {
    const { phone } = req.body;
    logger.info(
      `[API] POST /auth/send-otp - Request received for phone: ${phone}`,
    );

    await sendVerificationSMS(phone);

    logger.info(`[API] POST /auth/send-otp - Success: OTP sent to ${phone}`);
    res
      .status(200)
      .json(
        new ApiResponse(200, { phone }, "OTP sent successfully to your number"),
      );
  },
);

const verifyOTP = asyncHandler(
  async (req: Request<{}, {}, VerifyOtpType>, res: Response): Promise<void> => {
    const { code, phone, name } = req.body;
    logger.info(
      `[API] POST /auth/verify-otp - Attempting registration/verification for phone: ${phone}`,
    );

    const existingUser = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUser) {
      logger.warn(
        `[API] POST /auth/verify-otp - Failed: User already exists with phone: ${phone}`,
      );
      throw new ApiError(
        409,
        "User already exists with this phone number. Please use the login route.",
      );
    }

    // 2. Check Twilio for OTP Validity
    const isVerified = await checkVerificationSMS(phone, code);
    if (!isVerified) {
      logger.warn(
        `[API] POST /auth/verify-otp - Failed: Invalid or expired OTP code for ${phone}`,
      );
      throw new ApiError(400, "Invalid or expired OTP code");
    }

    logger.info(
      `[API] POST /auth/verify-otp - OTP Verified for: ${phone}. Creating new user DB record...`,
    );

    // 3. Create New User in DB
    const newUser = await prisma.user.create({
      data: {
        phoneNo: phone, // Check your schema if this should be 'phone' or 'phoneNo'
        name,
      },
    });

    // 4. Generate Token (Auto-Login after registration)
    const token = generateToken(newUser.id);

    logger.info(
      `[API] POST /auth/verify-otp - Success: New user registered ${newUser.name} (${newUser.id})`,
    );

    // 5. Send Success Response
    res
      .status(201)
      .cookie("accessToken", token, cookieOptions)
      .json(
        new ApiResponse(
          201,
          {
            user: newUser,
            token,
          },
          "User registered and logged in successfully",
        ),
      );
  },
);

const googleLogin = asyncHandler(
  async (req: Request<{}, {}, FirebaseAuthTokenType>, res: Response) => {
    logger.info(
      `[API] POST /auth/google - Initializing Google OAuth login flow`,
    );
    const { idToken } = req.body;

    if (!idToken) {
      logger.warn(
        `[API] POST /auth/google - Failed: Missing Firebase ID Token`,
      );
      throw new ApiError(400, "Firebase ID Token is required");
    }

    // verify the token with firebase admin
    const decodedData = await firebaseAdminAuth.verifyIdToken(idToken);
    const { email, name, picture, uid } = decodedData;

    if (!email) {
      logger.warn(
        `[API] POST /auth/google - Failed: Email not provided in Google ID Token for UID: ${uid}`,
      );
      throw new ApiError(400, "Email not provided by Google");
    }

    logger.info(
      `[API] POST /auth/google - Token verified. Processing upsert for email: ${email}`,
    );

    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        name: name || "Google User",
        avatar: picture,
      },
      create: {
        email,
        name: name || "Google User",
        avatar: picture,
        id: uid,
      },
    });

    const token = generateToken(user.id);

    logger.info(
      `[API] POST /auth/google - Success: Google Login completed for user: ${user.id}`,
    );
    res
      .status(200)
      .cookie("accessToken", token, cookieOptions)
      .json(new ApiResponse(200, { user, token }, "Google Login successful"));
  },
);

export default {
  getMe,
  logout,
  sendVerificationOTP,
  verifyOTP,
  googleLogin,
};
