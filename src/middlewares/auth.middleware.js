import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import debugLib from "debug";
import { access_token_secret } from "../constants.js";
import User from "../models/user.model.js";

const debug = debugLib("development:auth.middleware.js");
const isLoggedIn = asyncHandler(async (req, res, next) => {
  try {
    const accessToken =
      req.cookies?.accessToken ||
      req.header("Authorization").replace("Bearer ", "");

    if (!accessToken) {
      throw new ApiError(401, "Unauthorized Request");
    }
    let decodedToken;

    try {
      decodedToken = jwt.verify(accessToken, access_token_secret);
    } catch (err) {
      if (err.name === "JsonWebTokenError" && err.message === "jwt malformed") {
        throw new ApiError(401, "Token Is Tempered Or Malformed");
      } else {
        throw new ApiError(401, "Invalid Token");
      }
    }

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Token");
    }

    req.user = user;
    next();
  } catch (error) {
    debug("Error occured during Token Authentication", error);
    throw new ApiError(401, error.message || "Invalid Token");
  }
});

export { isLoggedIn };
