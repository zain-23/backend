import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { upload } from "./middlewares/multer.middleware.js";
import userRoutes from "./routes/user.routes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.get("/", function (req, res) {
  res.send("server is running");
});

//user Routes
//http:localhost:8000/api/v2/users
app.use("/api/v1/users", userRoutes);

// app.use(upload());
export { app };
