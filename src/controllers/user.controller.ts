import { User } from "../models/user.model.js";
import { CustomRequest, Iuser } from "../types/types.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fileUploadHandler } from "../utils/fileUpload.js";
import mongoose, { Types } from "mongoose";

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

  //console.log("here 1", req.files);
  const localFilePathAvatar = (req.files as filesMulter)?.avatar[0]?.path;
  // console.log("here 2");

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
  // console.log("password ", passwordValid);
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

const changeCurrentPassword = asyncHandler(async (req: CustomRequest, res) => {
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword)
    throw new apiError(404, "oldPassword or newPassword field is empty");

  const user = await User.findById(req.user?._id);
  if (!user) throw new apiError(404, "User Not Found ");
  const checkedPassword = user.isPasswordCorrect(oldPassword);
  if (!checkedPassword) throw new apiError(401, "Password is invalid");

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  res
    .status(200)
    .json(new apiResponse(200, {}, "Password Changed SuccessFully"));
});

const changeAccountDetail = asyncHandler(async (req: CustomRequest, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email)
    throw new apiError(404, "The updation field is empty");

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    {
      new: true,
    }
  ).select("-password -refreshToken");

  if (!updatedUser)
    throw new apiError(500, "internal Server error While updating to database");

  res
    .status(200)
    .json(new apiResponse(200, {}, "All Details Updated Successfull"));
});

const getCurrentUser = asyncHandler(async (req: CustomRequest, res) => {
  res.status(200).json(new apiResponse(200, { user: req.user }, "User Data"));
});

const updateUserAvator = asyncHandler(async (req: CustomRequest, res) => {
  const localAvatarFilePath = req.file?.path;
  // console.log(localAvatarFilePath);
  // console.log((req.files as filesMulter)?.avatar[0]?.path);
  if (!localAvatarFilePath) throw new apiError(404, "Avatar not Found ");

  const avatar = await fileUploadHandler(localAvatarFilePath);
  if (!avatar?.url)
    throw new apiError(
      500,
      "Internal Server Error While Uploading the Image to Cloud"
    );
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user)
    throw new apiError(500, "Failed to update the avatar Database Error ");

  res
    .status(200)
    .json(new apiResponse(200, { user: user }, "Avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req: CustomRequest, res) => {
  const localCoverImageFilePath = req.file?.path;
  if (!localCoverImageFilePath) throw new apiError(404, "Avatar not Found ");

  const coverImage = await fileUploadHandler(localCoverImageFilePath);
  if (!coverImage?.url)
    throw new apiError(
      500,
      "Internal Server Error While Uploading the Image to Cloud"
    );
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  if (!user)
    throw new apiError(500, "Failed to update the avatar Database Error ");

  res
    .status(200)
    .json(
      new apiResponse(200, { user: user }, "Cover Image  updated successfully")
    );
});

const getChannelProfile = asyncHandler(async (req: CustomRequest, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new apiError(400, "username not found ");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        username: 1,
        subscribersCount: 1,
        channelCount: 1,
        isSubscribed: 1,
        email: 1,
      },
    },
  ]);

  if (channel.length == 0) throw new apiError(404, "Channel Not Found");

  return res
    .status(200)
    .json(
      new apiResponse(
        200,
        channel[0],
        "Channel  Exist and Fetched Successfully"
      )
    );
});

const getUserWatchHistory = asyncHandler(async (req: CustomRequest, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchhistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $addFields: {
                    fullName: 1,
                    avatar: 1,
                    username: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  if (!user) throw new apiError(404, "User History Not Found");

  res
    .status(200)
    .json(
      new apiResponse(
        200,
        user[0].watchHistory,
        "User History Fetched SuccessFully "
      )
    );
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  changeAccountDetail,
  getCurrentUser,
  updateUserAvator,
  updateUserCoverImage,
  getChannelProfile,
  getUserWatchHistory,
};
