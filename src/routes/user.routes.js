import { Router } from "express";
import {
  changeCurrentPassword,
  loginUser,
  logout,
  refreshAccessToken,
  registerUser,
  updateUserAvatar,
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
  .post(verifyJwt, upload.single("avatar"), updateUserAvatar);

export default router;
