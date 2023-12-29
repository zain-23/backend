import { Router } from "express";
import {
  changeCurrentPassword,
  channelSubscribed,
  createUserWatchHistory,
  getUserChannelsDetails,
  getUserWatchHistory,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
  updateUserCoverImage,
  updateUserDetails,
} from "../controllers/user.contoller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  registerUser
);

router.route("/login").post(loginUser);
router.route("/logout").post(verifyJwt, logout);
router.route("/refresh-token").post(refreshAccessToken);
router.route("/change-password").post(verifyJwt, changeCurrentPassword);

router
  .route("/change-avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router
  .route("/change-coverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.route("/update-user").patch(verifyJwt, updateUserDetails);
router.route("/video/:videoId").get(verifyJwt, createUserWatchHistory);
router.route("/watch-history").get(verifyJwt, getUserWatchHistory);

// later i move this from here
router.route("/subscribed/:username").post(verifyJwt, channelSubscribed);
router.route("/find-channel/:userName").get(getUserChannelsDetails);

export default router;
