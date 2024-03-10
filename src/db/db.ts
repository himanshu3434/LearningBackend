import mongoose from "mongoose";
import { DB_Name } from "../constant.js";

const connectDB = async () => {
  try {
    // const uri = process.env.MONGO_URI as string;
    const uri = process.env.MONGO_URI || "";
    const connectionInstance: typeof mongoose = await mongoose.connect(uri);
    console.log(`Mongo Db Connected   ${connectionInstance.connection.host}`);
  } catch (error) {
    console.log("Unable To Connect To Db  : ", error);
    process.exit(1);
  }
};

export default connectDB;
