import { Router } from "express";
import { addComments } from "../controllers/comment.controller.js";
const router = Router();

router.route("/comment-post/:videoId").post(addComments);

export default router;
