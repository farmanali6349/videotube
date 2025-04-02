import { ApiError } from "../utils/ApiError.js";
import debugLib from "debug";

const debug = debugLib("development:validate.middleware.js");
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path[0],
        message: detail.message,
      }));

      debug("Validation errors", errors);

      return res
        .status(400)
        .json(new ApiError(400, "Validation Failed", errors));
    }

    return next();
  };
};

export { validate };
