import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { fileUploadHandler } from "../utils/fileUpload.js";
type filesMulter = { [fieldname: string]: Express.Multer.File[] };

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

export { registerUser };
