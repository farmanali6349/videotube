import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateDetails,
  updateAvatar,
  updateCoverImage,
  getChannelInfo,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

// Validation Schemas
import { registerSchema } from "../validationSchemas/register.validatonSchema.js";
import { loginSchema } from "../validationSchemas/login.validateSchema.js";
import { detailsSchema } from "../validationSchemas/details.validateSchema.js";
import { passwordSchema } from "../validationSchemas/password.validateSchema.js";
import { validate } from "../middlewares/validate.middleware.js";
import { isLoggedIn } from "../middlewares/auth.middleware.js";

const router = Router();

// Authentication
router.route("/register").post(
  upload.fields([
    {
      name: "avatar",
      maxCount: 1,
    },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  validate(registerSchema),
  register
);
router.route("/login").post(validate(loginSchema), login);
router.route("/logout").post(isLoggedIn, logout);
router.route("/refresh-access-token").post(refreshAccessToken);

// Get Current User
router.route("/get-current-user").get(isLoggedIn, getCurrentUser);

// Update Controllers
router
  .route("/update-details")
  .post(isLoggedIn, validate(detailsSchema), updateDetails);
router
  .route("/change-password")
  .post(isLoggedIn, validate(passwordSchema), changePassword);
router
  .route("/update-avatar")
  .post(isLoggedIn, upload.single("avatar"), updateAvatar);

router
  .route("/update-cover-image")
  .post(isLoggedIn, upload.single("coverImage"), updateCoverImage);

router.route("/get-channel-info").post(isLoggedIn, getChannelInfo);
router.route("/get-watch-history").post(isLoggedIn, getWatchHistory);
export default router;
