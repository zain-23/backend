import { Router } from "express";
import { registerUser } from "../controllers/user.contoller.js";

const router = Router();

router.route("/register").post(registerUser);

export default router;
