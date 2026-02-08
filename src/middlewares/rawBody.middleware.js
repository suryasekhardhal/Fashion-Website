/**
 * This middleware captures the RAW request body
 * BEFORE express.json() parses it.
 * Required for payment gateway webhook verification.
 */
export const rawBodySaver = (req, res, buffer, encoding) => {
  if (buffer && buffer.length) {
    req.rawBody = buffer.toString(encoding || "utf8");
  }
};