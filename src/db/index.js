import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async function () {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(`MongoDB connected ${connectionInstance.connection.host}`);
  } catch (error) {
    console.error("Error in db connection", error);
    process.exit(1);
  }
};

export default connectDB;
