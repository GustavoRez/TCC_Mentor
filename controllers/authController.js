const { join } = require("node:path");
const AuthService = require("../services/AuthService");

const refresh = async (req, res, next) => {
  try {
    const result = await AuthService.refresh(req);

    return res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.message,
    });
  }
};

const login = async (req, res, next) => {
  try {
    const { accessToken, refreshToken } = await AuthService.login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
    });

    return res.json({
      success: true,
      accessToken,
    });

  } catch (err) {
    next(err);
  }
};

const forgetPassword = async (req, res, next) => {
  try {
    const result = await AuthService.forgetPassword(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { resetId } = req.params;
    const { newPassword } = req.body;

    const result = await AuthService.resetPassword({ resetId, newPassword });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const confirmEmail = async (req, res, next) => {
  try {
    const { confirmId } = req.params;

    const result = await AuthService.confirmEmail({ confirmId });
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await AuthService.logout(req.body);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const home = async (req, res, next) => {
  try {
    const result = await AuthService.home(req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const project = async (req, res, next) => {
  try {
    const projectId = req.params.projectId.split('-')[0];
    const result = await AuthService.project(req.user, projectId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const editProject = async (req, res, next) => {
  try {
    const projectId = req.params.projectId.split('-')[0];
    const result = await AuthService.editProject(req.user, projectId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const addParticipant = async (req, res, next) => {
  try {
    const projectId = req.params.projectId.split('-')[0];
    const result = await AuthService.addParticipant(req.body, req.user, projectId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const joinProjectScreen = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const result = await AuthService.joinProjectScreen(req.user, inviteId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const joinProject = async (req, res, next) => {
  try {
    const { inviteId } = req.params;

    const result = await AuthService.joinProject(req.user, inviteId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const removeParticipant = async (req, res, next) => {
  try {
    const projectId = req.params.projectId.split('-')[0];
    const result = await AuthService.removeParticipant(req.body, req.user, projectId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateProfileScreen = async (req, res, next) => {
  try {
    const result = await AuthService.updateProfileScreen(req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const result = await AuthService.updateProfile(req.body, req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const result = await AuthService.updatePassword(req.body, req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteProfileEmail = async (req, res, next) => {
  try {
    const result = await AuthService.deleteProfileEmail(req.user);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteProfileScreen = async (req, res, next) => {
  try {
    const { deleteId } = req.params;

    const result = await AuthService.deleteProfileScreen(req.user, deleteId);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const deleteProfile = async (req, res, next) => {
  try {
    const { deleteId } = req.params;
    const { password } = req.body;

    const result = await AuthService.deleteProfile(req.user, deleteId, password);
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  refresh,
  login,
  register,
  confirmEmail,
  forgetPassword,
  resetPassword,
  logout,
  home,
  project,
  editProject,
  addParticipant,
  joinProjectScreen,
  joinProject,
  removeParticipant,
  updateProfileScreen,
  updateProfile,
  updatePassword,
  deleteProfileEmail,
  deleteProfileScreen,
  deleteProfile
};