import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import commentRouter from "./routes/comment.routes.js";

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
app.use("/api/v2/video", videoRouter);
app.use("/api/v3/comment", commentRouter);

// app.use(upload());
export { app };
