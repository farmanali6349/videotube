import Joi from "joi";

// User registration schema
const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please enter a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password should be 6-30 characters and contain only letters and numbers",
      "any.required": "Password is required",
    }),
});

export { loginSchema };
