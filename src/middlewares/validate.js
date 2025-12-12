import { formatZodError } from "../utils/zodErrorFormatter.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: formatZodError(result.error),
    });
  }

  req.body = result.data;
  next();
};
