import { Request, Response, NextFunction } from "express";

const asyncHandler = (functionHandler: any) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(functionHandler()).catch((err) => next(err));
  };
};
export { asyncHandler };
// const asyncHandler = (fn) => async (req, res, next) => {
//   try {
//     await fn(req, res, next);
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };
