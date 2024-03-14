import { User } from "../models/user.model.js";
import { CustomRequest, Iuser } from "../types/types.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fileUploadHandler } from "../utils/fileUpload.js";
import { Types } from "mongoose";

import jwt, { JwtPayload } from "jsonwebtoken";
type filesMulter = { [fieldname: string]: Express.Multer.File[] };
const generateAccessAndRefreshTokesn = async (userId: Types.ObjectId) => {
  const user = await User.findById(userId);
  console.log(user);
  const accessToken = user?.generateAccessTokens();
  const refreshToken = user?.generateRefreshTokens();
  if (user) {
    user.refreshToken = refreshToken || "";
    await user.save({ validateBeforeSave: false });
  }

  return { accessToken, refreshToken };
};
const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;

  //check if any field is empty
  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError(400, "all Fields Must be Field");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser)
    throw new apiError(409, "user with username or email already exist ");

  const localFilePathAvatar = (req.files as filesMulter)?.avatar[0]?.path;

  let localFilePathcoverImage, coverImage;

  if (
    req.files &&
    Array.isArray((req.files as filesMulter).coverImage) &&
    (req.files as filesMulter).coverImage.length > 0
  ) {
    localFilePathcoverImage = (req.files as filesMulter)?.coverImage?.[0]?.path;
    coverImage = await fileUploadHandler(localFilePathcoverImage);
  }

  if (!localFilePathAvatar) throw new apiError(400, "Avator is Required");

  const avatar = await fileUploadHandler(localFilePathAvatar);

  if (!avatar)
    throw new apiError(
      500,
      "Internal Server Error while Uploading the Image to Server"
    );

  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!newUser)
    throw new apiError(500, "Something went wrong while registoring the user ");

  res
    .status(201)
    .json(new apiResponse(200, newUser, "User Registered Successfully"));
});
const loginUser = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username && !email) {
    throw new apiError(400, " provide any of the two username or password");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new apiError(404, "User Not found");

  const passwordValid = user.isPasswordCorrect(password);

  if (!passwordValid) throw new apiError(401, "User Unauthorized");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokesn(
    user._id
  );
  const finalUser = await User.findById(user._id).select(
    "-password  -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { user: finalUser, accessToken, refreshToken },
        "User Logged In SuccessFully"
      )
    );
});

const logoutUser = asyncHandler(async (req: CustomRequest, res) => {
  const user = req.user;

  const updatedUser = await User.findByIdAndUpdate(
    user?._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
      new apiResponse(200, { loggedOut: true }, "User logged Out SuccessFully")
    );
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new apiError(401, "Unauthorised Request");

  const decodedRefreshToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET as string
  ) as JwtPayload;
  const user = await User.findById(decodedRefreshToken._id);

  if (!user) throw new apiError(401, "Invalid refresh token");
  if (incomingRefreshToken !== user.refreshToken)
    throw new apiError(401, "Refresh Token used or expired");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokesn(
    user._id
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new apiResponse(
        200,
        { accessToken: accessToken, refreshToken: refreshToken },
        "Tokens Refreshed SuccessFully"
      )
    );
});
export { registerUser, loginUser, logoutUser, refreshAccessToken };
