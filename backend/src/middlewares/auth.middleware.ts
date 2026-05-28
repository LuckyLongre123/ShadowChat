import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/ApiError";
import asyncHandler from "../utils/asyncHandler";

// Extend Express Request to include `user`
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

const verifyJWT = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      throw new ApiError(401, "Unauthorized — no token provided");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        id: string;
      };

      req.user = { id: decoded.id };
      next();
    } catch {
      throw new ApiError(401, "Unauthorized — invalid or expired token");
    }
  },
);

export default verifyJWT;
