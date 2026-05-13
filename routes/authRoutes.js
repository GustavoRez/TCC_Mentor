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
router.get("/project/create", auth, AuthController.createProjectScreen);
router.post("/project/create", auth, AuthController.createProject);
router.get("/project/:projectId", auth, AuthController.project);
router.get("/project/update/:projectId", auth, AuthController.editProject); //link foi mudado
router.post("/project/addParticipant/:projectId", auth, AuthController.addParticipant);
router.get("/project/:inviteId/join", auth, AuthController.joinProjectScreen);
router.patch("/project/:inviteId/join", auth, AuthController.joinProject);
router.post("/project/:projectId/removeParticipant", auth, AuthController.removeParticipant);

router.post("/project/delete", auth, AuthController.deleteProjectEmail);
router.get("/project/delete/:deleteId", auth, AuthController.deleteProjectScreen);
router.post("/project/delete/:deleteId", auth, AuthController.deleteProject);

router.get("/profile", auth, AuthController.updateProfileScreen);
router.patch("/profile/update", auth, AuthController.updateProfile);
router.patch("/profile/updatePassword", auth, AuthController.updatePassword);
router.post("/profile/delete", auth, AuthController.deleteProfileEmail);
router.get("/profile/delete/:deleteId", auth, AuthController.deleteProfileScreen);
router.post("/profile/delete/:deleteId", auth, AuthController.deleteProfile);
module.exports = router;