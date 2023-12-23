import connectDB from "./db/index.js";
import dotenv from "dotenv";
console.log("Hello from index.js");

dotenv.config({
  path: "./env",
});

connectDB();
