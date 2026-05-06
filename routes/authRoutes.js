const express = require("express");
const router = express.Router();
const AuthController = require("../controllers/authController");
const { auth, loginLimiter } = require("../middlewares/authMiddleware");


router.post("/refresh", AuthController.refresh);
router.post("/login", loginLimiter, AuthController.login);
router.post("/forgetPassword", AuthController.forgetPassword);
router.patch("/resetPassword/:resetId", AuthController.resetPassword);
router.post("/register", AuthController.register);
router.patch("/confirmEmail/:confirmId", AuthController.confirmEmail);
router.post("/logout", AuthController.logout);
router.get("/home", auth, AuthController.home);
router.get("/project/:projectId", auth, AuthController.project);
module.exports = router;