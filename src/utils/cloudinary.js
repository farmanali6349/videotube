import { v2 as cloudinary } from "cloudinary";
import debugLib from "debug";
import fs from "fs";

import {
  cloudinary_api_key,
  cloudinary_api_secret,
  cloudinary_cloud_name,
} from "../constants.js";

const debug = debugLib("development:cloudinary.js");

cloudinary.config({
  cloud_name: cloudinary_cloud_name,
  api_key: cloudinary_api_key,
  api_secret: cloudinary_api_secret,
});

async function uploadOnCloudinary(localFilePath, folder = "videotube/misc") {
  try {
    if (!localFilePath) {
      debug("File path is not provided");
      return null;
    }

    // Determining the folder
    const fileExtension = localFilePath.split(".").pop().toLowerCase();
    const videoExtensions = ["mp4", "avi", "mov", "mkv"];
    const photoExtensions = ["jpg", "jpeg", "png", "gif", "webp"];

    if (videoExtensions.includes(fileExtension)) {
      folder = "videotube/videos";
    } else if (photoExtensions.includes(fileExtension)) {
      folder = "videotube/photos";
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
      folder,
    });

    fs.unlinkSync(localFilePath);

    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    debug("Error uploading the file on cloudinary", error);
    return null;
  }
}

export { uploadOnCloudinary };
