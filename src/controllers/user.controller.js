import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import fs from "fs";
import jwt from "jsonwebtoken";
import debugLib from "debug";
import { refresh_token_secret } from "../constants.js";
import mongoose from "mongoose";

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

async function generateAccessAndRefreshToken(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(400, "Invalid User Id");
  }

  const refreshToken = user.generateRefreshToken();
  const accessToken = user.generateAccessToken();

  user.refreshToken = refreshToken;
  await user.save();

  return { refreshToken, accessToken };
}

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  debug(user);

  if (!user) {
    throw new ApiError(400, "Email or password is incorrect");
  }

  // Comparing Password
  const isValidPassword = await user.isPasswordCorrect(password);

  if (!isValidPassword) {
    throw new ApiError(400, "Email or password is incorrect");
  }

  // Creating Access Token And Refresh Token

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.status(200).cookie("accessToken", accessToken, options);
  res.status(200).cookie("refreshToken", refreshToken, options);
  res.status(200).json(
    new ApiResponse(
      200,
      {
        user: {
          userData: updatedUser,
          refreshToken,
          accessToken,
        },
      },
      "User loggedIn Successfully"
    )
  );
});

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  res.status(200).clearCookie("accessToken", options);
  res.status(200).clearCookie("refreshToken", options);
  res
    .status(200)
    .json(new ApiResponse(200, {}, "User Logged Out Successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const refreshToken =
      req.cookies?.refreshToken ||
      req.header("Authorization").replace("Bearer ", "");

    debug("refreshToken: ", refreshToken);

    if (!refreshToken) {
      throw new ApiError(401, "Unauthorized Request");
    }

    let decodedToken;
    try {
      decodedToken = jwt.verify(refreshToken, refresh_token_secret);
    } catch (err) {
      if (err.name === "JsonWebTokenError" && err.message === "jwt malformed") {
        throw new ApiError(401, "Token Is Tempered Or Malformed");
      } else {
        throw new ApiError(401, "Invalid Token");
      }
    }

    debug("Decoded Token: ", decodedToken);
    const user = await User.findById(decodedToken._id).select("-password");

    debug(user);

    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }

    // Compare the Refresh Token From Frontend and From Database
    if (refreshToken !== user.refreshToken) {
      throw new ApiError(401, "Token has expired or used");
    }

    debug("Token Is Valid");

    const tokens = await generateAccessAndRefreshToken(user._id);

    console.log("TOKENS: ", tokens);

    const updatedUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    debug("Updated User: ", updatedUser);

    const options = {
      httpOnly: true,
      secure: true,
    };

    res.status(200).cookie("accessToken", tokens.accessToken, options);
    res.status(200).cookie("refreshToken", tokens.refreshToken, options);
    res.status(200).json(
      new ApiResponse(
        200,
        {
          user: {
            userData: updatedUser,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        },
        "Token refreshed Successfully"
      )
    );
  } catch (error) {
    debug("Error in refreshing token", error);
    throw new ApiError(401, "Invalid Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id);

  const isPasswordValid = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordValid) {
    throw new ApiError(400, "Inavlid Old Password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "User Fetched Successfully"));
});

const updateDetails = asyncHandler(async (req, res) => {
  // TODO: Place a in router validator before updating
  const { name, email, username } = req.body;

  // User
  const user = await User.findById(req.user?._id).select(
    "-password -refreshToken"
  );

  if (user && user.username !== username) {
    const isDuplicateUsername = await User.findOne({ username });

    if (isDuplicateUsername) {
      throw new ApiError(409, "Username already exist");
    }

    user.username = username;
  }

  if (user && user.email.trim() !== email.trim()) {
    const isDuplicateEmail = await User.findOne({ email: email });

    if (isDuplicateEmail) {
      throw new ApiError(409, "Email already exist");
    }

    user.email = email;
  }

  if (user && user.name !== name) {
    user.name = name;
  }

  await user.save({ validateBeforeSave: false });

  // Validate userUpdate

  const updatedUser = await User.findById(user._id);

  if (!updatedUser) {
    throw new ApiError(500, "Error Updating User");
  }

  res
    .status(200)
    .json(
      new ApiResponse(200, { user: updatedUser }, "User Updated Successfully")
    );
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarFileLocalPath = req.file.path;

  if (!avatarFileLocalPath) {
    throw new ApiError(400, "Avatar File not received");
  }

  // Cleaning The Previous User
  const user = await User.findById(req.user._id);

  if (user.avatar) {
    // Delete The Image From Cloudinary
    const result = await deleteFromCloudinary(user.avatar);

    if (result.result === "ok") {
      debug("Prev Avatar deleted from cloudinary");
    } else if (result.result === "not found") {
      debug("Avatar not exist on cloudinary");
    } else {
      debug("Error uploading Avatar : ", result);
    }
  }

  const avatar = await uploadOnCloudinary(avatarFileLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Error uploading file");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: avatar.url } },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(500, "Error updating user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User Avatar Updated Successfully"
      )
    );
});

const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageFileLocalPath = req.file.path;

  if (!coverImageFileLocalPath) {
    throw new ApiError(400, "Cover Image File not received");
  }

  // Cleaning The Previous User Cover Image
  const user = await User.findById(req.user._id);

  if (user.coverImage) {
    // Delete The Image From Cloudinary
    const result = await deleteFromCloudinary(user.coverImage);

    if (result.result === "ok") {
      debug("Prev Cover Image deleted from cloudinary");
    } else if (result.result === "not found") {
      debug("Cover Image not exist on cloudinary");
    } else {
      debug("Error uploading Cover Image : ", result);
    }
  }

  const coverImage = await uploadOnCloudinary(coverImageFileLocalPath);

  if (!coverImage) {
    throw new ApiError(500, "Error uploading Cover Image file");
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { coverImage: coverImage.url } },
    { new: true }
  );

  if (!updatedUser) {
    throw new ApiError(500, "Error updating user");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser },
        "User Cover Image Updated Successfully"
      )
    );
});

const getChannelInfo = asyncHandler(async (req, res) => {
  // name, username, email, subscribers, subscribedTo, isSubscribed, avatar
  const channel = await User.aggregate([
    // Get The User First
    {
      $match: {
        username: req.params.username,
      },
    },

    // Get The Subscribers
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },

    // Get The Subscribed To
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },

    // Count The Subscribers and SubscribedTo
    {
      $addFields: {
        subsribers: {
          $size: "$subscribers",
        },
        subscribedTo: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req?.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },

    // Project The Data
    {
      $project: {
        name: 1,
        username: 1,
        subscribers: 1,
        subscribedTo: 1,
        email: 1,
        avatar: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(501, "Internal Server Error");
  }

  res
    .status(200)
    .json(
      new ApiResponse(
        200,
        channel[0],
        "Channel information fetched successfully"
      )
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const watchHistory = await User.aggregate([
    // Get User
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },

    // Get Videos
    {
      $lookup: {
        from: "vidoes",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",

        // Get User Info In Vidoes
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    name: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
});
export {
  register,
  login,
  logout,
  refreshAccessToken,
  updateAvatar,
  changePassword,
  getCurrentUser,
  updateDetails,
  updateCoverImage,
  getChannelInfo,
  getWatchHistory,
};
