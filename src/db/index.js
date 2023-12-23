import mongoose from "mongoose";
import { dbName } from "../constant/constant.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${dbName}`
    );
    console.log(
      `mongodb connected !! DB HOST : ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log(`ERROR FROM MONGODB : ${error}`);
  }
};

export default connectDB;
