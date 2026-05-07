const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const UserRepository = require("../repositories/UserRepository");

const auth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Token not provided",
    });
  }
  const token = authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UserRepository.findByIds([decoded.id]);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);

    return res.status(401).json({
      success: false,
      message: "Invalid token"
    });
  }
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts. Please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true
});

module.exports = {
  auth,
  loginLimiter
};