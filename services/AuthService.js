const UserRepository = require("../repositories/UserRepository");
const bcrypt = require("bcrypt");
const crypto = require('crypto');
const jwt = require("jsonwebtoken");
const EmailService = require("./EmailService");
const RedisClient = require("../config/redisClient");
const AppError = require('../errors/AppError');

const baseUrl = process.env.BASE_URL;

const refresh = async (req) => {
  const token = req.cookies.refreshToken;

  if (!token) {
    throw new AppError('No refresh token', 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET_REFRESH);

  const user = await UserRepository.findByRefreshToken(token);

  if (!user) {
    throw new AppError('Invalid refresh token', 401);
  }

  const newAccessToken = jwt.sign(
    { id: user.id_usuario, nome: user.nm_usuario, cargo: user.cargo },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  return { accessToken: newAccessToken };
};

const login = async ({ user, pass }) => {
  const data = await UserRepository.findByEmail(user);

  if (!data) {
    throw new AppError("Invalid email or password", 401);
  }

  const senhaValida = await bcrypt.compare(pass, data.senha);

  if (!senhaValida) {
    throw new AppError("Invalid email or password", 401);
  }

  const accessToken = jwt.sign(
    {
      id: data.id_usuario,
      nome: data.nm_usuario,
      cargo: data.cargo
    },
    process.env.JWT_SECRET,
    { expiresIn: "15m", algorithm: "HS256" }
  );

  const refreshToken = jwt.sign(
    { id: data.id_usuario },
    process.env.JWT_SECRET_REFRESH,
    { expiresIn: "7d", algorithm: "HS256" }
  );

  await UserRepository.saveRefreshToken(data.id_usuario, refreshToken);

  return { accessToken, refreshToken };
};

const forgetPassword = async ({ email }) => {
  const user = await UserRepository.findByEmail(email);

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = crypto.randomBytes(20).toString('hex');
  const expiration = new Date(Date.now() + 3600000);
  await UserRepository.updatePasswordToken({ email, token, expiration });

  const resetId = crypto.randomUUID();
  await RedisClient.set(
    `reset:${resetId}`,
    JSON.stringify({ email, token, expiresAt: Date.now() + 3600000 }),
    { EX: 3600 }
  );

  try {
    await EmailService.sendEmail({
      to: email,
      subject: "Reset Password - TCC Mentor",
      html: `<p>Hi ${user.nm_usuario},</p>
    <p>You have requested to reset your password. Click the link below to reset it:</p>
    <p><a href="${baseUrl}/resetPassword/${resetId}">Reset Password</a></p>
    <p>This link will expire in 1 hour.</p>`
    });
  } catch (err) {
    console.log("Error sending email:", err.message);
    throw new AppError("Error sending reset password email.", 500);
  }

  return { message: "Password reset email sent." };
};

const resetPassword = async ({ resetId, newPassword }) => {
  const data = await RedisClient.get(`reset:${resetId}`);

  if (!data) {
    throw new AppError("Invalid or expired token. Please request a new password reset.", 400);
  }

  const parsed = data;

  const user = await UserRepository.findByEmail(parsed.email);

  if (!user) {
    throw new AppError("Invalid email or token. Please request a new password reset.", 400);
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await UserRepository.updatePassword({ email: parsed.email, password: hashedPassword });

  await RedisClient.del(`reset:${resetId}`);

  return { message: "Password reset successfully." };
};

const register = async ({ email, name, role, pass }) => {
  if (!email || !pass || !name) {
    throw new AppError("Missing required fields", 400);
  }

  const existingUser = await UserRepository.findByEmail(email);

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }


  const token = crypto.randomBytes(20).toString('hex');
  const hashedPassword = await bcrypt.hash(pass, 10);
  const newUser = await UserRepository.createUser({
    name,
    role,
    pass: hashedPassword,
    token,
    email
  });

  const redisConfirm = crypto.randomUUID();
  await RedisClient.set(
    `confirm:${redisConfirm}`,
    JSON.stringify({ email, token }),
    { EX: 3600 }
  );

  try {
    await EmailService.sendEmail({
      to: email,
      subject: "Welcome to TCC Mentor",
      html: `<p>Hi ${name},</p>
    <p>Welcome to TCC Mentor! Your account has been created successfully.</p>
    <p><a href="${baseUrl}/confirmEmail/${redisConfirm}">Confirm your email</a></p>`
    }
    );

  } catch (err) {
    console.log("Error sending email:", err.message);
    throw new AppError("User created, but error sending confirmation email.", 201);
  }

  return { message: "User created successfully. Verification email sent." };
};

const confirmEmail = async ({ confirmId }) => {
  const data = await RedisClient.get(`confirm:${confirmId}`);

  if (!data) {
    throw new AppError("Invalid or expired confirmation link. Please request a new one.", 400);
  }

  const parsed = data;

  console.log("Confirming email for:", parsed.email);
  const user = await UserRepository.findByEmail(parsed.email);

  if (user.email_verified) {
    return { message: "Email already verified." };
  }

  await UserRepository.confirmEmail({ token: parsed.token, email: parsed.email });
  return { message: "Email confirmed successfully." };
};

const logout = async ({ refreshToken }) => {
  const user = await UserRepository.findByRefreshToken(refreshToken);
  if (!user) {
    throw new AppError("Invalid refresh token", 401);
  }

  await UserRepository.saveRefreshToken(user.id_usuario, null);
  return { message: "Logged out successfully." };
}

const home = async (user) => {
  const data = {
    id: user.id,
    nome: user.nome,
    cargo: user.cargo
  };

  const homeData = {
    idProjeto: [],
    nomeProjetos: [],
    tipos: [],
    orientadores: [],
    alunos: []
  };

  const projects = data.cargo === 'ALUN' ? await UserRepository.findHomeDataAluno(user.id) : await UserRepository.findHomeDataOrientador(user.id);

  projects.forEach(proj => {
    homeData.idProjeto.push(proj.id_projeto);
    homeData.nomeProjetos.push(proj.nm_projeto);
    homeData.tipos.push(proj.tp_projeto);
    homeData.orientadores.push(proj.orientador);
    homeData.alunos.push(proj.alunos);
  });

  return { user: data, homeData };
}

const project = async (user, projectId) => {
  const isParticipant = await UserRepository.checkUserProjectParticipation([user.id], projectId);

  if (!isParticipant) {
    throw new AppError("Project not found or access denied", 403);
  }

  const cargo = user.cargo;

  const projectData = {
    idProjeto: null,
    nomeProjeto: null,
    descricaoProjeto: null,
    tipoProjeto: null,
    orientador: null,
    alunos: null
  };

  const messageData = {
    mensagem: [],
    remetente: [],
    dataEnvio: [],
    cargoRemetente: []
  }

  const project = await UserRepository.findProjectById(projectId);

  if (project && project.length > 0) {
    projectData.idProjeto = project[0].id_projeto;
    projectData.nomeProjeto = project[0].nm_projeto;
    projectData.descricaoProjeto = project[0].dc_projeto;
    projectData.tipoProjeto = project[0].tp_projeto;
    projectData.orientador = project[0].orientador;
    projectData.alunos = project[0].alunos;
  }

  const messages = await UserRepository.findMessagesByProjectId(projectId);

  const messagesData = messages
    .filter(msg => msg.mensagem)
    .map(msg => ({
      mensagem: msg.mensagem,
      remetente: msg.nm_remetente,
      dataEnvio: msg.data_envio,
      cargoRemetente: msg.cargo_remetente
    }));


  return { cargo, projectData, messagesData };
}

const editProject = async (user, projectId) => {
  const isParticipant = await UserRepository.checkUserProjectParticipation([user.id], projectId);

  if (!isParticipant) {
    throw new AppError("Project not found or access denied", 403);
  }

  const editProjectData = {
    tp_projeto: null,
    orientador: null,
    id_alunos: null,
    nm_alunos: null
  };

  const project = await UserRepository.editProject(projectId);

  if (project && project.length > 0) {
    editProjectData.tp_projeto = project[0].tipo;
    editProjectData.orientador = project[0].orientador;
    editProjectData.id_alunos = project[0].idalunos || null;
    editProjectData.nm_alunos = project[0].alunos || null;
  }

  return { editProjectData };
};

const addParticipant = async ({ emails }, user, projectId) => {
  const isParticipant = await UserRepository.checkUserProjectParticipation([user.id], projectId);

  if (!isParticipant) {
    throw new AppError("Project not found or access denied", 403);
  }
  console.log("Adding participant with emails:", emails, "to project:", projectId);
  const participant = await UserRepository.findByEmailArray(emails);

  if (!participant.users.length) {
    throw new AppError("User(s) with this email not found!", 404);
  }

  const ids = participant.users.map(u => u.id_usuario);

  const participantsInProjects = await UserRepository.checkUserProjectParticipation(ids, projectId);

  const existingParticipants = participant.users
    .filter(user =>
      participantsInProjects.some(
        p => p.id_aluno === user.id_usuario
      )
    )
    .map(user => user.email);

  if (existingParticipants.length === participant.users.length) {
    throw new AppError("All users with this email are already participants in a project!", 409);
  }

  for (const email of emails) {
    const inviteId = crypto.randomUUID();

    await RedisClient.set(
      `invite:${inviteId}`,
      JSON.stringify({ email, projectId }),
      { EX: 3600 }
    );

    try {
      await EmailService.sendEmail({
        to: email,
        subject: "Project Invitation - TCC Mentor",
        html: `<p>${user.nome} has invited you to join a project!</p>
        <p>Click the link below to confirm your email:</p>
        <p><a href="${baseUrl}/project/${inviteId}/join">Accept Invitation</a></p>`
      }
      );

    } catch (err) {
      console.log("Error sending email:", err.message);
      throw new AppError("Error sending invitation email.", 201);
    }
  }

  return { message: "Invitation sent successfully.", notFound: participant.notFoundEmails, existingParticipants };
};

const joinProjectScreen = async (user, inviteId) => {
  const data = await RedisClient.get(`invite:${inviteId}`);
  if (!data) {
    throw new AppError("Invalid or expired invitation link. Please request a new one.", 400);
  }

  const isParticipant = await UserRepository.checkUserProjectParticipation([user.id], data.projectId);

  if (!isParticipant) {
    throw new AppError("Project not found or access denied", 403);
  }

  const participant = await UserRepository.findByIds([user.id]);

  if (!participant) {
    throw new AppError("User with this email not found!", 404);
  }

  const projectData = {
    nomeProjeto: null,
    descricaoProjeto: null,
    tipoProjeto: null
  };

  const project = await UserRepository.findProjectById(data.projectId);

  if (project && project.length > 0) {
    projectData.nomeProjeto = project[0].nm_projeto;
    projectData.descricaoProjeto = project[0].dc_projeto;
    projectData.tipoProjeto = project[0].tp_projeto;
  }

  return { projectData };
};

const joinProject = async (user, inviteId) => {
  const data = await RedisClient.get(`invite:${inviteId}`);
  if (!data) {
    throw new AppError("Invalid or expired invitation link. Please request a new one.", 400);
  }

  const isParticipant = await UserRepository.checkUserProjectParticipation([user.id], data.projectId);

  if (!isParticipant) {
    throw new AppError("Project not found or access denied", 403);
  }

  const participant = await UserRepository.findByEmail(data.email);

  if (!participant) {
    throw new AppError("User with this email not found!", 404);
  }

  await UserRepository.addParticipantToProject(user.id, data.projectId);

  return { message: "Project joined successfully." };
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
  joinProject
};