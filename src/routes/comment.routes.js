import { Router } from "express";
import { addComments } from "../controllers/comment.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
const router = Router();

router.route("/comment-post/:videoId").post(verifyJwt, addComments);

export default router;
