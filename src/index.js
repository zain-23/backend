import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
console.log("Hello from index.js");

dotenv.config({
  path: "./env",
});

connectDB()
  .then(() => {
    app.listen(
      process.env.PORT || 8000,
      console.log(
        `server is running at port http://localhost:${process.env.PORT}`
      )
    );
  })
  .catch((err) => {
    console.log("MONGO db connection failed :", err);
  });
