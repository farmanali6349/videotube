import { ApiError } from "../utils/ApiError.js";

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        feild: detail.path[0],
        message: detail.message,
      }));

      throw new ApiError(400, "Validation Failed", errors);
    }

    return next();
  };
};

export { validate };
