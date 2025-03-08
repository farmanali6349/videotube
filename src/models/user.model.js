import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  access_token_secret,
  access_token_expiry,
  refresh_token_secret,
  refresh_token_expiry,
} from "../constants";
const userSchema = new Schema(
  {
    username: {
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      unique: true,
      trim: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    avatar: {
      type: String,
      default: "user.png",
      required: true,
    },
    coverImage: {
      type: String,
      default: "cover.png",
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(this.password, salt);
  this.password = hash;
  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      id: this._id,
      username: this.username,
      email: this.email,
      name: this.name,
    },
    access_token_secret,
    { expiresIn: access_token_expiry },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      id: this._id,
    },
    refresh_token_secret,
    { expiresIn: refresh_token_expiry },
  );
};

const User = mongoose.model("User", userSchema);

export default User;
