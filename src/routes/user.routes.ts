import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  changeAccountDetail,
  getCurrentUser,
  updateUserAvator,
  updateUserCoverImage,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

userRouter.route("/login").post(loginUser);

userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/getCurrentUser").get(verifyJWT, getCurrentUser);
userRouter.route("/changePassword").post(verifyJWT, changeCurrentPassword);
userRouter.route("/changeAccountDetail").post(verifyJWT, changeAccountDetail);
userRouter
  .route("/updateAvatar")
  .post(verifyJWT, upload.single("avatar"), updateUserAvator);
userRouter
  .route("/updateCoverImage")
  .post(verifyJWT, upload.single("coverImage"), updateUserCoverImage);
userRouter.route("/refresh-access-token").post(refreshAccessToken);

export default userRouter;
