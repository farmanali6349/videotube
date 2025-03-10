import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import fs from "fs";
import debugLib from "debug";

const debug = debugLib("development:user.controller.js");

const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  // Validate Data
  if (
    name &&
    username &&
    email &&
    password &&
    [name, username, email, password].some((field) => field.trim() === "")
  ) {
    throw new ApiError(400, "Make sure all fields are provided");
  }

  // Check Duplication

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "Username or Email Already Exist");
  }

  // Upload Images
  const avatarLocalFile =
    req?.files && req?.files?.avatar ? req.files.avatar[0]?.path : null;
  const coverImageLocalFile =
    req?.files && req?.files?.coverImage ? req.files.coverImage[0]?.path : null;

  if (!avatarLocalFile) {
    throw new ApiError(400, "Upload avatar picture");
  }

  if (!coverImageLocalFile) {
    throw new ApiError(400, "Upload coverImage picture");
  }

  // Upload Images
  const avatar = avatarLocalFile
    ? await uploadOnCloudinary(avatarLocalFile)
    : null;
  const coverImage = coverImageLocalFile
    ? await uploadOnCloudinary(coverImageLocalFile)
    : null;

  if (!avatar) {
    throw new ApiError(500, "Uploading Avatar Failed");
  }

  // Creating User
  const newUser = new User({
    name,
    username: username.toLowerCase(),
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage.url || "",
  });
  await newUser.save();

  // Verify User Creation

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshToken"
  );

  if (createdUser) {
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User Created Successfully"));
  } else {
    throw new ApiError(400, "Error Creating User");
  }
});

export { register };
