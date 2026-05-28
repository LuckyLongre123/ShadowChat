import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import logger from "../utils/logger";

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error?.statusCode ? error.statusCode : 500;
    const message = error?.message || "Internal Server Error";
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  logger.error(
    `${error.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`,
  );

  const response = {
    ...error,
    message: error.message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  res.status(error.statusCode).json(response);
};

export default globalErrorHandler;
