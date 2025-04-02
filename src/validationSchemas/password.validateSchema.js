import Joi from "joi";

const passwordSchema = Joi.object({
  newPassword: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password should be 6-30 characters and contain only letters and numbers",
      "any.required": "Password is required",
    }),
  oldPassword: Joi.string()
    .pattern(new RegExp("^[a-zA-Z0-9]{6,30}$"))
    .required()
    .messages({
      "string.empty": "Password is required",
      "string.pattern.base":
        "Password should be 6-30 characters and contain only letters and numbers",
      "any.required": "Password is required",
    }),
});

export { passwordSchema };
