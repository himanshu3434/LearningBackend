import mongoose, { Schema, Types } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Iuser } from "../types/types.js";
//error facing in index:true in username
/*
the problem is that it is taking all type as array 
 in username
*/

const userSchema = new Schema(
  {
    username: {
      type: String,
      require: [true, "username is required"],
      unique: [true, "username already exist "],
      lowercase: [true, "username Should be in lower case"],
      trim: [true, ""],
      index: [true],
    },
    email: {
      type: String,
      require: [true, "email is required"],
      unique: [true, "email already exist "],
    },
    fullName: {
      type: String,
      require: true,
      trim: true,
    },
    avatar: {
      type: String, //cloudiary
      require: true,
    },
    coverImage: {
      type: String,
    },
    password: {
      type: String,
      require: [true, "Password is required"],
    },
    refreshToken: {
      type: String,
    },
    watchHistory: [
      {
        type: Types.ObjectId,
        ref: "Video",
      },
    ],
  },
  { timestamps: true }
);
//for encryption of the password  middleware just before saving the database
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  //temp fix by if see other sol
  //   if (this.password == null || this.password == undefined) return next();
  if (this.password) this.password = await bcrypt.hash(this.password, 10);

  next();
});
//it is to check the password provide is correct or not
userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessTokens = function () {
  const secret: string = process.env.ACCESS_TOKEN_SECRET as string;
  return jwt.sign(
    { _id: this._id, username: this.username, email: this.email },
    secret,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshTokens = function () {
  const secret: string = process.env.REFRESH_TOKEN_SECRET as string;
  return jwt.sign({ _id: this._id }, secret, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};

export const User = mongoose.model<Iuser>("User", userSchema);
