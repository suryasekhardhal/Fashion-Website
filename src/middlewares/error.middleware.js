import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const fields = Object.keys(err.keyValue).join(", ");
    err = new ApiError(
      409,
      `Duplicate value for field(s): ${fields}`
    );
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
};

export default errorHandler;
