import mongoose from "mongoose";
import { mongodb_uri, project_name, url_params } from "../constants.js";

export default async function connectDb() {
  try {
    const connectionInstance = mongoose.connect(
      mongodb_uri + project_name + url_params,
    );

    console.log(
      `Database is connected successfully at host : ${(await connectionInstance).connection.host}`,
    );
  } catch (error) {
    console.log("Error Connecting Database", error);
  }
}
