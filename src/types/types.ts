import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
export type ControllerType = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void | Response<any, Record<string, any>>>;

export interface Iuser extends Document {
  _id: Types.ObjectId;
  username: string;
  email: string;
  fullName: string;
  avatar: string;
  coverImage?: string;
  password: string;
  refreshToken: string;
  watchHistory: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isPasswordCorrect(password: string): boolean;
  generateAccessTokens(): string;
  generateRefreshTokens(): string;
}

export interface CustomRequest extends Request {
  user?: Iuser;
}
