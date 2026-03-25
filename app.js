var express = require("express");
var app = express();
var connection = require('./database');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { supabase } = require("./supabaseClient");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const baseUrl = process.env.BASE_URL;

app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static('public/uploads'));
app.use(express.static(path.join(__dirname, 'Css')));

app.set('view engine', 'ejs')

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + file.originalname;
        cb(null, uniqueName);
    }
});

const upload = multer({ storage: storage });

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

function verificarLogin(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.sendFile(path.join(__dirname + '/views/not_logged.html'));
    }

    try {
        const usuario = jwt.verify(token, process.env.JWT_SECRET)

        req.usuario = usuario

        next()
    } catch {
        return res.sendFile(path.join(__dirname + '/views/not_logged.html'));
    }
}

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/tela_inicial.html'));
});

app.get('/login', function (req, res) {
    if (req.cookies.token) res.redirect('/home')
    else res.sendFile(path.join(__dirname + '/views/login.html'));
});

app.post('/login', async function (req, res) {
    const user = req.body.user;
    const pass = req.body.pass;

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', user)
        .single();

    if (!data) {
        return res.json({ success: false, message: 'Usuário não encotrado. Verfique seu email.' });
    }

    if (error) throw error;

    const senhaValida = await bcrypt.compare(pass, data.senha);

    if (senhaValida) {
        req.session.loggedin = true;
        req.session.idUser = data.id_usuario;
        req.session.nome = data.nm_usuario;
        req.session.cargo = data.cargo;

        const token = jwt.sign(
            {
                id: data.id_usuario,
                nome: data.nm_usuario,
                cargo: data.cargo
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        )

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            sameSite: "strict"
        })

        return res.json({ success: true, message: 'Login concluído! Redirecionando...' });
    } else {
        return res.json({ success: false, message: 'Login e/ou senha incorretos.' });
    }
});

app.get('/esqueciSenha', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/esqueciSenha.html'));
})

app.post('/esqueciSenha', async function (req, res) {
    const email = req.body.email;

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email)

    if (error) throw error;

    if (data.length < 1) {
        return res.json({ success: false, message: 'Esse e-mail não possui cadastro ou ainda não foi verificado!' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000);

    const { data: dataUpdate, error: errorUpdate } = await supabase
        .from('usuario')
        .update(
            {
                token_recuperacao: token,
                token_expira: expira
            }
        )
        .eq('email', email)

    if (errorUpdate) {
        console.log(errorUpdate)
    };

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'admtccmentor@gmail.com',
            pass: 'rsaq gcbr domf jbkv'
        }
    });

    const mailOptions = {
        from: 'TCC Mentor <admtccmentor@gmail.com>',
        to: email,
        subject: 'Recuperação de Senha - TCC Mentor',
        html: `
                    <p>Você solicitou a recuperação de senha.</p>
                    <p>Clique no link abaixo para redefinir sua senha:</p>
                    <a href="${baseUrl}/redefinirSenha?token=${token}&email=${email}">Redefinir Senha</a>
                    <p>Este link é válido por 1 hora.</p>
                `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
            return res.json({ success: false, message: 'Erro ao enviar o e-mail.' });
        } else {
            return res.json({ success: true, message: 'E-mail de recuperação enviado com sucesso!' });
        }
    });
});

app.get('/redefinirSenha', async function (req, res) {
    const { email, token } = req.query;

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email)
        .eq('token_recuperacao', token)

    if (error) throw error;
    if (data.length === 0) {
        return res.send('Token inválido ou expirado. Solicite outro!');
    }

    const usuario = data[0];
    const agora = new Date();
    if (agora > usuario.token_expira) {
        return res.send('Token expirado. Solicite outro!');
    }

    res.render('redefinirSenha', { email, token });
});

app.post('/redefinirSenha', async function (req, res) {
    const { senha, email } = req.body;
    const senhaHash = await bcrypt.hash(senha, 10)

    const { data, error } = await supabase
        .from('usuario')
        .update(
            {
                senha: senhaHash,
                token_recuperacao: null
            }
        )
        .eq('email', email)

    if (error) {
        console.log(error);
        return res.json({ success: false, message: 'Erro ao alterar senha.' });
    } else {
        console.log(data);
        return res.json({ success: true, message: 'Senha alterada! Faça o login para continuar.' });
    }
});

app.get('/cadastro', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/cadastro.html'));
});

app.post('/cadastro', async function (req, res) {
    const { email, nome, cargo, senha } = req.body;
    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('email', email);

    if (error) throw error;

    if (data.length < 1) {
        const token = crypto.randomBytes(20).toString('hex');
        const senhaHash = await bcrypt.hash(senha, 10)
        const { data, error } = await supabase
            .from('usuario')
            .insert([
                {
                    nm_usuario: nome,
                    cargo: cargo,
                    senha: senhaHash,
                    token: token
                }
            ])
        if (error) {
            console.log(error);
            return res.json({ success: false, message: 'Erro ao criar usuario.' });
        } else {
            let msg = 'Perfil criado! Faça o login para continuar. ';

            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'admtccmentor@gmail.com',
                    pass: 'rsaq gcbr domf jbkv'
                }
            });

            const mailOptions = {
                from: 'TCC Mentor <admtccmentor@gmail.com>',
                to: email,
                subject: 'Confirmação de Cadastro - TCC Mentor',
                html: `
                            <p>Bem-vindo! 🎉</p>
                            <p>Para concluir seu cadastro, confirme seu e-mail clicando no link abaixo:</p>
                            <a href="${baseUrl}/confirmarEmail?token=${token}&email=${email}">Confirmar E-mail</a>
                            `
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.error(error);
                    return res.json({ success: false, message: msg + 'Erro ao enviar o e-mail de verificação.' });
                } else {
                    return res.json({ success: true, message: msg + 'E-mail de verificação enviado com sucesso!' });
                }
            });
        }
    } else
        return res.json({ success: false, message: 'Esse email já possui cadastro!' });
});

app.get('/confirmarEmail', async function (req, res) {
    const { token, email } = req.query;
    let msg;
    const { data, error } = await supabase
        .from('usuario')
        .update(
            {
                email: email
            }
        )
        .eq('token', token)

    if (error) {
        console.log(error);
        msg = 'Algo deu errado! Tente criar uma conta novamente mais tarde.';
    } else {
        console.log(data);
        msg = 'E-mail verificado com sucesso!';
    }
    res.render('confirmaEmail', { msg });
});

app.post('/quit', function (req, res) {
    req.session.loggedin = false;
    req.session.username = null;
    req.session.avatar = null;
    req.session.cargo = null;
    res.clearCookie("token");
    res.redirect('/')
});

app.get('/home', verificarLogin, async function (req, res) {
    const nome = req.usuario.nome;
    const id = req.usuario.id;
    const cargo = req.usuario.cargo;
    let nomeProjetos = [];
    let tipos = [];
    let orientadores = [];
    let alunos = [];
    let dados;
    let err;

    if (req.usuario.cargo === 'ALUN') {
        const { data, error } = await supabase.rpc('buscar_projeto_por_aluno', {
            id_aluno_param: id
        });
        dados = data;
        err = error;
    } else {
        const { data, error } = await supabase.rpc('buscar_projetos_por_orientador', {
            id_orientador_param: id
        });
        dados = data;
        err = error;
    }

    if (err) throw err;
    for (var i = 0; i < dados.length; i++) {
        nomeProjetos[i] = dados[i].nm_projeto;
        tipos[i] = dados[i].tp_projeto;
        orientadores[i] = dados[i].orientador;
        alunos[i] = dados[i].alunos;
    }
    if (nomeProjetos[0] == null) {
        nomeProjetos = '';
    }
    res.render('home', { id, nome, cargo, nomeProjetos, tipos, orientadores, alunos });
});

app.get('/projeto-:projectURL', verificarLogin, async function (req, res) {
    const URL = req.params.projectURL;
    const cargo = req.usuario.cargo;
    let idProjeto;
    let projeto;
    let desc;
    let tipo;
    let orientador;
    let aluno = [];
    const mensagem = [];
    const dtMensagem = [];
    const remetente = [];
    const nmRemetente = [];

    const { data, error } = await supabase.rpc(
        'buscar_projeto_por_url',
        { url_param: URL }
    );

    if (error) throw error;
    idProjeto = data[0].id_projeto;
    projeto = data[0].nm_projeto;
    desc = data[0].dc_projeto;
    tipo = data[0].tp_projeto;
    orientador = data[0].orientador;
    aluno = data[0].alunos

    const mensagens = data
        .filter(r => r.mensagem !== null)
        .map(r => ({
            mensagem: r.mensagem,
            data_envio: r.data_envio,
            remetente: r.remetente,
            nmRemetente: r.nmRemetente
        }));
    res.render('projeto', { cargo, idProjeto, projeto, desc, tipo, orientador, aluno, mensagens })
});

app.get('/editarProjeto', verificarLogin, async function (req, res) {
    const idProjeto = req.query.idProjeto;

    const { data, error } = await supabase.rpc(
        'editar_projeto',
        { id_projeto_param: idProjeto }
    );

    if (error) throw error;

    const orientador = data[0].orientador;
    const tipo = data[0].tipo;
    const idAlunos = data[0].idalunos ? data[0].idalunos.split(', ') : [];
    const alunos = data[0].alunos ? data[0].alunos.split(', ') : [];

    res.render('editarProjeto', { idProjeto, orientador, idAlunos, alunos, tipo })
});

app.get('/editarUsuario', verificarLogin, async function (req, res) {
    const idUser = req.usuario.id;

    const { data, error } = await supabase
        .from('usuario')
        .select('nm_usuario, email, senha')
        .eq('id_usuario', idUser)

    if (error) throw error;

    const nome = data[0].nm_usuario;
    const email = data[0].email;
    const senha = data[0].senha;

    res.render('editarUsuario', { nome, email, senha });
});

app.post('/editarUsuario', verificarLogin, async function (req, res) {
    const { nome, email } = req.body;
    const updates = {};

    if (nome) updates.nm_usuario = nome;
    if (email) updates.email = email;


    if (!nome && !email) {
        return res.status(400).json({ mensagem: 'Não foi feita nenhuma alteração.' });
    }

    const { data, error } = await supabase
        .from('usuario')
        .update(updates)
        .eq('id_usuario', req.usuario.id)

    if (error) {
        console.log(error);
        return res.status(400).json({ mensagem: 'Ocorreu um erro ao atualizar esse perfil! Tente novamente mais tarde.' });
    } else {
        if (nome) req.session.nome = nome;
        return res.status(200).json({ mensagem: 'Perfil atualizado com sucesso. Redirecionando para página inicial.' });
    }
});

app.post('/editarSenha', verificarLogin, async function (req, res) {
    const { senhaAntiga, senhaAtual } = req.body;
    const idUser = req.usuario.id;


    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', idUser)


    const senhaValida = await bcrypt.compare(senhaAntiga, data[0].senha);

    if (error) {
        console.log(error);
        return res.status(400).json({ mensagem: 'Ocorreu uma erro interno! Tente novamente mais tarde.' })
    };

    if (!senhaValida) {
        return res.status(400).json({ mensagem: 'Sua senha antiga está errada! Tente novamente.' })
    }

    const { data: dataU, error: errorU } = await supabase
        .from('usuario')
        .update({
            senha: await bcrypt.hash(senhaAtual, 10)
        })
        .eq('id_usuario', idUser)

    if (errorU) {
        console.log(errorU);
        return res.status(400).json({ mensagem: 'Ocorreu um erro ao tentar alterar sua senha! Tente novamente mais tarde.' })
    }

    return res.status(200).json({ mensagem: 'Senha alterada com sucesso! Você voltará a página inicial.' });
});

app.post('/emailDeletarUsuario', verificarLogin, function (req, res) {
    const idUser = req.usuario.id;
    const { email } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'admtccmentor@gmail.com',
            pass: 'rsaq gcbr domf jbkv'
        }
    });

    const mailOptions = {
        from: 'TCC Mentor <admtccmentor@gmail.com>',
        to: email,
        subject: 'Exclusão de Conta - TCC Mentor',
        html: `
            <p>Você solicitou a exclusão de sua conta.</p>
            <p>Clique no link abaixo para <strong>apagar ela</strong>:</p>
            <a href="${baseUrl}/deletarConta?&email=${email}&id=${idUser}">Excluir Conta</a>
            <p>Caso não reconheça essa solicitação, considere alterar sua senha.</p>
            <p>Uma exclusão de conta é uma ação irreversível!</p>
            `
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.error(error);
            return res.status(400).json({ mensagem: 'Ocorreu um erro ao enviar o email! Tente novamente mais tarde.' });
        } else {
            return res.status(200).json({ mensagem: 'E-mail para exclusão de conta enviado com sucesso!' });
        }
    });
});

app.get('/deletarConta', function (req, res) {
    const { email, id } = req.query;

    res.render('deletarConta', { email, id })
});

app.post('/deletarConta', verificarLogin, async function (req, res) {
    const { email } = req.body;
    const idUser = req.usuario.id;

    const { data, error } = await supabase
        .from('usuario')
        .select('*')
        .eq('id_usuario', idUser)
        .eq('email', email)

    if (error) {
        console.log(error);
        return res.json({ success: false, mensagem: 'Ocorreu um erro ao tentar excluir sua conta! Tente novamente mais tarde.' });

    }

    if (data.length > 0) {
        const { data: dataD, error: errorD } = await supabase
            .from('usuario')
            .delete()
            .eq('id_usuario', idUser);

        if (errorD) {
            console.log(errorD);
            return res.json({ success: false, mensagem: 'Ocorreu um erro ao tentar excluir sua conta! Tente novamente mais tarde.' });
        }

        res.clearCookie("token");
        return res.json({ success: true, mensagem: 'Conta removida com sucesso. Redirecionando... ' });
    }
    else {
        return res.json({ success: false, mensagem: 'Conta inválida! Faça login em SUA conta e tente novamente.' });
    }
});

app.post('/emailDelete', verificarLogin, async function (req, res) {
    const idProjeto = req.body.idProjeto;
    const nomeProjeto = req.body.nomeProjeto;

    const { data: alunos, error: erro1 } = await supabase
        .from("projeto_aluno")
        .select("id_aluno")
        .eq("id_projeto", idProjeto);

    let ids = alunos.map(a => a.id_aluno);

    if (erro1) { return res.json({ success: false, message: 'Erro ao achar projeto. Tente novamente mais tarde!' }) }

    const { data: emails, error: erro2 } = await supabase
        .from("usuario")
        .select("email")
        .in("id_usuario", ids);

    if (erro2) { return res.json({ success: false, message: 'Erro ao buscar participantes do projeto. Tente novamente mais tarde!' }) }

    emails.forEach(email => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'admtccmentor@gmail.com',
                pass: 'rsaq gcbr domf jbkv'
            }
        })
        const mailOptions = {
            from: 'TCC Mentor <admtccmentor@gmail.com>',
            to: email.email,
            subject: 'Exclusão de Projeto - TCC Mentor',
            html: `
                     <p>Um participante de seu projeto ${nomeProjeto} solicitou a exclusão.</p>
                     <p>Clique no link abaixo para votar por <strong>excluir o projeto</strong>:</p>
                     <a href="${baseUrl}/deletarProjeto?&email=${email.email}&id=${idProjeto}">Excluir projeto</a>
                     <p>Ou releve este e-mail caso vote pela permanência do mesmo.</p>
                 `
        }
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
                return res.json({ success: false, message: 'Erro ao enviar o e-mail.' });
            } else {
                return res.json({ success: true, message: 'E-mail para votação enviado com sucesso!' });
            }
        });
    });
});

app.get('/deletarProjeto', function (req, res) {
    const { email, id } = req.query;

    res.render('deletarProjeto', { email, id });
});

app.post('/deletarProjeto', verificarLogin, async function (req, res) {
    const id = req.body.id;
    const { data, error } = await supabase
        .from('projeto_aluno')
        .select('voto_delete')
        .eq('id_aluno', req.usuario.id)


    if (!data[0].voto_delete) {
        const { error: errorU } = await supabase.rpc("incrementar_voto", {
            id_projeto_param: id,
            id_aluno_param: req.usuario.id
        });

        if (errorU) {
            console.log(errorU);
            res.json({ success: false, message: 'Ocorreu um erro ao registrar seu voto! Tente novamente mais tarde.' });
        }
    } else {
        res.json({ success: false, message: 'Seu voto já foi computado. Aguarde o voto de seus companheiros.' });
    }

    const { data: dataS, error: errorS } = await supabase
        .rpc("contar_alunos_projeto", { id_projeto_param: id });

    if (errorS) {
        console.log(errorS);
    }

    console.log(dataS[0].contagem / 2)
    console.log(dataS[0].voto_deletar)

    if (dataS[0].voto_deletar > dataS[0].contagem / 2) {
        const { error: errorD } = await supabase
            .from(projeto)
            .delete()
            .eq('id_projeto', id)

        if (errorD) {
            console.log(errorD);
            res.json({ success: false, message: 'Erro ao deletar projeto! Tente novamente mais tarde.' });
        }

        res.json({ success: true, message: 'Seu projeto foi deletado com sucesso!' });
    }
});

app.post('/adicionarAluno', verificarLogin, async function (req, res) {
    const emails = req.body.email;
    const idProjeto = req.body.idProjeto;

    const { data: dataEmail, error: errorEmail } = await supabase
        .from('usuario')
        .select('*')
        .in('email', emails)

    if (errorEmail) throw errorEmail;

    if (dataEmail.length == 0) {
        return res.json({ success: false, message: 'E-mail(s) sem cadastro! Solicite o(s) a criar uma conta!' });
    }

    const encontrados = dataEmail.map(user => user.email);
    const id = dataEmail.map(user => user.id_usuario);

    const { data: dataProjeto, error: errorProjeto } = await supabase
        .from("usuario")
        .select('*, projeto_aluno (*)')
        .eq("id_usuario", id);

    if (errorProjeto) throw errorProjeto;

    if (dataProjeto[0].projeto_aluno.length > 0) {
        const nome = dataProjeto[0].nm_usuario;
        return res.json({ success: false, message: `Aluno ${nome} já possui um projeto em criado!` })
    }

    encontrados.forEach(email => {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'admtccmentor@gmail.com',
                pass: 'rsaq gcbr domf jbkv'
            }
        });
        const mailOptions = {
            from: 'TCC Mentor <admtccmentor@gmail.com>',
            to: encontrados,
            subject: 'Convite Para Projeto - TCC Mentor',
            html: `
                    <p>${req.usuario.nome} te convidou para entrar em um projeto!</p>
                    <p>Clique no link abaixo para ver o convite:</p>
                    <a href="${baseUrl}/conviteProjeto?email=${email}&id=${idProjeto}">Entre no meu grupo!</a>`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.error(error);
                return res.json({ success: false, message: 'Erro ao enviar o e-mail.' });
            } else {
                return res.json({ success: true, message: 'Solicitação enviada com sucesso!' });
            }
        });
    });
});

app.get('/conviteProjeto', async function (req, res) {
    const emails = req.query.email;
    const id = req.query.id;

    const { data, error } = await supabase
        .from('projeto')
        .select('*')
        .eq('id_projeto', id);

    if (error) throw error;
    const nomeP = data[0].nm_projeto;
    const descP = data[0].dc_projeto;
    const tipoP = data[0].tp_projeto;

    res.render('conviteProjeto', { emails, id, nomeP, descP, tipoP });
});

app.post('/conviteProjeto', verificarLogin, async function (req, res) {
    const { email, id } = req.body;

    const { data: dataS, error: errorS } = await supabase
        .from('usuario')
        .select('id_usuario')
        .eq('email', email);

    if (errorS) {
        console.log(err);
        res.json({ success: false, message: 'Ocorreu um erro ao verificar aluno! Tente novamente mais tarde.' })
    }

    const { data, error } = await supabase
        .from('projeto_aluno')
        .select('*')
        .eq('id_aluno', dataS[0].id_usuario);

    if (error) throw error;

    if (data.length !== 0)
        res.json({ success: false, message: 'Essa conta já possui um projeto ativo. Não foi possível entrar!' })

    const { error: errorI } = await supabase
        .from('projeto_aluno')
        .insert({
            id_projeto: id,
            id_aluno: dataS[0].id_usuario
        })
        .eq('email', email);

    if (errorI) {
        console.log(err);
        res.json({ success: false, message: 'Ocorreu um erro ao entrar no projeto! Tente novamente mais tarde.' })
    }

    res.json({ success: true, message: 'Você entrou no projeto! Redirecionando para tela inicial...' })
});

app.post('/removerAluno', verificarLogin, async function (req, res) {
    const aluno = req.body.aluno;

    const { error } = await supabase
        .from('projeto_aluno')
        .delete()
        .eq('id_aluno', aluno)

    if (error) {
        console.log(error);
        return res.json({ success: false, message: 'Ocorreu um erro ao remover o aluno. Tente novamente mais tarde.' });
    }

    return res.json({ success: true, message: 'Aluno removido com sucesso!' });
});

app.get('/mensagens', verificarLogin, async (req, res) => {
    const idProjeto = req.query.idProjeto;

    if (!idProjeto) {
        return res.status(400).json({ error: 'ID do projeto não informado' });
    }

    const { data, error } = await supabase.rpc(
        'buscar_mensagens',
        { id_projeto_param: idProjeto }
    );

    if (error) {
        console.error("Erro ao buscar mensagens:", err);
        return res.status(500).json({ error: 'Erro no servidor' });
    }

    res.json(data);
});

app.post('/mensagens', verificarLogin, upload.single('arquivo_pdf'), async (req, res) => {
    const { idProjeto, remetente, mensagem } = req.body;
    const idRemetente = req.session.idUser;
    const arquivo_pdf = req.file ? req.file.filename : null;

    const { data, error } = await supabase
        .from('mensagem_chat')
        .insert({
            id_projeto: idProjeto,
            remetente: remetente,
            id_remetente: idRemetente,
            mensagem: mensagem,
            arquivo_pdf: arquivo_pdf
        });

    try {
        await new Promise((resolve, reject) => {
            if (error) return reject(error);
            resolve(data);
        });

        if (remetente === 'ORIE' && arquivo_pdf) {
            const pdfPath = path.join(__dirname, 'public/uploads', arquivo_pdf);

            const formData = new FormData();
            formData.append("file", fs.createReadStream(pdfPath));

            try {
                const respostaIA = await axios.post("http://localhost:8000/analisarPDF", formData, {
                    headers: formData.getHeaders(),
                });

                const mensagemIA = respostaIA.data.resposta;

                const { data: dataIA, error: errorIA } = await supabase
                    .from('mensagem_chat')
                    .insert({
                        id_projeto: idProjeto,
                        remetente: 'IA',
                        mensagem: mensagemIA,
                        arquivo_pdf: null
                    });

                await new Promise((resolve, reject) => {
                    if (errorIA) return reject(errorIA);
                    resolve(dataIA);
                });

            } catch (err) {
                console.error("Erro ao analisar PDF:", err.response?.data || err.message);
            }
        }

        res.json({ sucesso: true });

    } catch (err) {
        console.error("Erro no envio da mensagem:", err.message);
        res.status(500).json({ error: 'Erro ao enviar ou processar a mensagem' });
    }
});

app.post('/analisaMsg', verificarLogin, async function (req, res) {
    const mensagem = req.body.msg;
    const idProjeto = req.body.idProjeto;

    console.log(mensagem)
    const url = `https://linhaguga.app.n8n.cloud/webhook/analyse-webhook?message=${mensagem}`;

    const response = await fetch(url, {
        method: "GET"
    });

    const data = await response.json();

    const { data: dataI, error: errorI } = await supabase
        .from('mensagem_chat')
        .insert({
            id_projeto: idProjeto,
            remetente: 'Tessy AI',
            mensagem: data.analise
        })
        .select();

    if (errorI) {
        console.log(errorI);
    }
});

app.post('/chatbox', (req, res) => {
    if (req.session.loggedin) {
        const { msg, idProjeto } = req.body;

        const sql = 'SELECT resumo FROM mensagem_chatbox WHERE id_projeto = ? ORDER BY data_envio DESC LIMIT 1';

        connection.query(sql, [idProjeto], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ error: 'Erro no banco' });
            }

            let resumoAntigo = '';
            if (results.length > 0) {
                resumoAntigo = results[0].resumo;
            }

            axios.post("http://localhost:8000/chatbox", {
                conteudo: msg,
                loggedin: req.session.loggedin,
                resumo: resumoAntigo,
            }).then((response) => {
                const mensagemIA = response.data.resposta;
                const resumoIA = response.data.resumo;

                const sql2 = "INSERT INTO mensagem_chatbox (id_projeto, resumo) VALUES (?, ?)";
                connection.query(sql2, [idProjeto, resumoIA], (err2) => {
                    if (err2) console.error(err2);
                });

                res.json({ resposta: mensagemIA });
            }).catch(error => {
                console.error(error);
                res.status(500).json({ error: 'Erro na chamada da IA' });
            });
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/adicionarProjeto', verificarLogin, function (req, res) {
    const cargo = req.usuario.cargo;
    res.render('adicionarProjeto', { cargo })
})

app.post('/adicionarProjeto', verificarLogin, async function (req, res) {
    const { nome, desc, tipo } = req.body;
    var orientador;
    const url = nome.toLowerCase().replace(/\s+/g, '-');

    if (req.usuario.cargo === 'ALUN') {
        const { data: dataOri, error: errorOri } = await supabase
            .from('usuario')
            .select('id_usuario')
            .eq('nm_usuario', req.body.orientador)

        if (errorOri) return res.json({ success: false, message: 'Erro interno. Tente novamente mais tarde.' });
        if (dataOri.length == 0) return res.json({ success: false, message: 'Erro ao criar projeto: Orientador não registrado.' });
        orientador = dataOri[0].id_usuario;
    }
    else
        orientador = req.usuario.id;

    const { data, error } = await supabase
        .from('projeto')
        .insert({
            nm_projeto: nome,
            dc_projeto: desc,
            tp_projeto: tipo,
            id_orientador: orientador,
            url: url
        })
    if (error) {
        console.log(error);
        if (error.message = 'duplicate key value violates unique constraint "projeto_nm_projeto_key"')
            return res.json({ success: false, message: 'Erro ao criar projeto. Nome de projeto já existente!' });

    }

    if (req.usuario.cargo === 'ALUN') {
        const { data: dataProj, error: errorProj } = await supabase
        .from('projeto')
        .select('id_projeto')
        .eq('nm_projeto', nome)

        if (errorProj) {
            console.log(errorProj)
            return res.json({success: false, message: "Erro interno. Tente novamente mais tarde."})
        }

        const { data: dataS, error: errorS } = await supabase
            .from('projeto_aluno')
            .insert({
                id_projeto: dataProj[0].id_projeto,
                id_aluno: req.usuario.id
            })

        if (errorS) {
            return res.json({ success: false, message: 'Erro ao criar projeto.' });
        } else {
            return res.json({ success: true, message: 'Projeto criado com sucesso!' })
        }
    }

});

if (require.main === module) {
    app.listen(3006, function () {
        console.log("Aplicativo rodando na porta 3006.");
    });
} else {
    module.exports = app;
}
