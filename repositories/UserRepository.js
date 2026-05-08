const { supabase } = require("../supabaseClient");

const findByEmail = async (email) => {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("email", email)
        .maybeSingle();

    if (error) {
        console.log(error);
        throw new Error("Error finding user by email.");
    }

    return data;
};

const findByEmailArray = async (emails) => {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .in("email", emails);

    if (error) {
        console.log(error);
        throw new Error("Error finding users by email.");
    }

    // emails encontrados no banco
    const foundEmails = data.map(user => user.email);

    // emails que não existem
    const notFoundEmails = emails.filter(
        email => !foundEmails.includes(email)
    );

    return {
        users: data,
        notFoundEmails
    };
};

const saveRefreshToken = async (userId, refreshToken) => {
    const { data, error } = await supabase
        .from("usuario")
        .update({ refreshToken })
        .eq("id_usuario", userId);

    if (error) {
        console.log(error);
        throw new Error("Error saving token.");
    }

    return data;

};

const findByRefreshToken = async (refreshToken) => {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("refreshToken", refreshToken)
        .single();

    if (error) {
        console.log(error);
        throw new Error("Error finding user by token.");
    }

    return data;
};

const findByIds = async (ids) => {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .in("id_usuario", ids);


    if (error) {
        console.log(error);
        throw new Error("Error finding user by ID.");
    }

    return data;
};

const updatePasswordToken = async ({ email, token, expiration }) => {
    const { data, error } = await supabase
        .from("usuario")
        .update({ token_recuperacao: token, token_expira: expiration })
        .eq("email", email);

    if (error) {
        console.log(error);
        throw new Error("Error updating password token.");
    }

    return data;
};

const updatePassword = async ({ email, password }) => {
    const { data, error } = await supabase
        .from("usuario")
        .update({ senha: password, token_recuperacao: null, token_expira: null })
        .eq("email", email);

    if (error) {
        console.log(error);
        throw new Error("Error updating password.");
    }

    return data;
};

const findByToken = async (token) => {
    const { data, error } = await supabase
        .from("usuario")
        .select("*")
        .eq("token", token)
        .maybeSingle();

    if (error) {
        console.log(error);
        throw new Error("Token not found. Please request a new one.");
    }

    return data;
};

const createUser = async ({ name, role, pass, token, email }) => {
    const { data, error } = await supabase
        .from("usuario")
        .insert([{
            nm_usuario: name,
            cargo: role,
            senha: pass,
            token: token,
            email: email,
            email_verified: false
        }]);

    if (error) {
        console.log(error);
        throw new Error("Error creating user.");
    }

    return data;
};

const confirmEmail = async ({ token, email }) => {
    const { data, error } = await supabase
        .from("usuario")
        .update({ email_verified: true, token: null })
        .eq("token", token);

    if (error) {
        console.log(error);
        throw new Error("Error confirming email.");
    }

    return data;
};

const findHomeDataAluno = async (userId) => {
    const { data, error } = await supabase
        .rpc('buscar_projeto_por_aluno', { id_aluno_param: userId });

    if (error) {
        console.log(error);
        throw new Error("Error fetching home data for aluno.");
    }
    return data;
};

const findHomeDataOrientador = async (userId) => {
    const { data, error } = await supabase
        .rpc('buscar_projetos_por_orientador', { id_orientador_param: userId });

    if (error) {
        console.log(error);
        throw new Error("Error fetching home data for orientador.");
    }
    return data;
};

const findProjectById = async (projectId) => {
    const { data, error } = await supabase
        .rpc('buscar_projeto_por_id', { id_projeto_param: projectId });

    if (error) {
        console.log(error);
        throw new Error("Error fetching project data.");
    }
    return data;
};

const findMessagesByProjectId = async (projectId) => {
    const { data, error } = await supabase
        .rpc('find_messages_by_project_id', { id_projeto_param: projectId });

    if (error) {
        console.log(error);
        throw new Error("Error fetching messages for project.");
    }
    return data;
};

const checkUserProjectParticipation = async (userId, projectId) => {
    const { data, error } = await supabase
        .from('projeto_aluno')
        .select('*')
        .in('id_aluno', userId)
        .eq('id_projeto', projectId)

    if (error) {
        console.log(error);
        throw new Error("Error checking user project participation.");
    }

    return data;
};

const editProject = async (projectId) => {
    const { data, error } = await supabase
        .rpc('editar_projeto', { id_projeto_param: projectId });

    if (error) {
        console.log(error);
        throw new Error("Error fetching project data for editing.");
    }

    return data;
};

const addParticipantToProject = async (userId, projectId) => {
    const { error } = await supabase
        .from('projeto_aluno')
        .insert([{
            id_aluno: userId,
            id_projeto: projectId
        }]);

    if (error) {
        console.log(error);
        throw new Error("Error fetching project data for editing.");
    }

    return 0;
};

const removeParticipantFromProject = async (userId, projectId) => {
    const { error } = await supabase
        .from('projeto_aluno')
        .delete()
        .eq('id_aluno', userId)
        .eq('id_projeto', projectId);

    if (error) {
        console.log(error);
        throw new Error("Error removing participant from project.");
    }

    return 0;
};

const updateProfile = async ({ id, name, email }) => {
    const { error } = await supabase.from("usuario")
        .update({ nm_usuario: name, email: email })
        .eq("id_usuario", id);

    if (error) {
        console.log(error);
        throw new Error("Error updating profile.");
    }

    return 0;
};

const deleteProfile = async ({ id }) => {
    const { error: errorProj } = await supabase
        .from("usuario")
        .delete()
        .eq("id_usuario", id)
    
        const { error: errorMessage } = await supabase
        .from("usuario")
        .delete()
        .eq("id_usuario", id)
    
        const { error: errorUser } = await supabase
        .from("usuario")
        .delete()
        .eq("id_usuario", id)

    if (errorProj) {
        console.log(errorProj);
        throw new Error("Error deleting profile.");
    }

    return 0;
};

module.exports = {
    findByEmail,
    findByEmailArray,
    findByToken,
    findByRefreshToken,
    saveRefreshToken,
    findByIds,
    createUser,
    confirmEmail,
    updatePasswordToken,
    updatePassword,
    findHomeDataAluno,
    findHomeDataOrientador,
    findProjectById,
    findMessagesByProjectId,
    checkUserProjectParticipation,
    editProject,
    addParticipantToProject,
    removeParticipantFromProject,
    updateProfile,
    deleteProfile
};