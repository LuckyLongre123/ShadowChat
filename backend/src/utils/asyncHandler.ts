import { NextFunction, Request, RequestHandler, Response } from "express";

const asyncHandler =
  (
    requestHandler: (
      req: Request,
      res: Response,
      next: NextFunction,
    ) => Promise<any>,
  ): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error),
    );
  };

export default asyncHandler;
