import { NextFunction, Request, Response } from "express";
import { ZodError, ZodObject } from "zod";
import { ApiError } from "../utils/ApiError";

const validateZod =
  (schema: ZodObject) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.issues.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        next(new ApiError(400, "Invalid Request Body", formattedErrors));
      } else {
        next(error);
      }
    }
  };

export default validateZod;
