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
    if (verificarLogin) res.redirect('/home')
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
                    <a href="http://localhost:3006/redefinirSenha?token=${token}&email=${email}">Redefinir Senha</a>
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
            .select();
        if (error) {
            console.log(error);
            return res.json({ success: false, message: 'Erro ao criar usuario.' });
        } else {
            console.log(data);
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
                            <a href="http://localhost:3006/confirmarEmail?token=${token}&email=${email}">Confirmar E-mail</a>
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
        .select();

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
    res.clearCookie("token")
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

app.get('/editarProjeto', async function (req, res) {
    if (req.session.loggedin) {
        const idProjeto = req.query.idProjeto;

        const { data, error } = await supabase.rpc(
            'editar_projeto',
            { id_projeto_param: idProjeto }
        );

        if (error) throw error;

        const orientador = data[0].orientador;
        const tipo = data[0].tipo;
        const idAlunos = data[0].idAlunos ? data[0].idAlunos.split(', ') : [];
        const alunos = data[0].alunos ? data[0].alunos.split(', ') : [];

        res.render('editarProjeto', { idProjeto, orientador, idAlunos, alunos, tipo })
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/editarUsuario', async function (req, res) {
    if (req.session.loggedin) {
        const idUser = req.session.idUser;
        const sql = 'SELECT nm_usuario nome, email, senha FROM usuario WHERE id_usuario = ?';

        const { data, error } = await supabase
            .from('usuario')
            .select('nm_usuario, email, senha')
            .eq('id_usuario', idUser)

        if (error) throw error;

        const nome = data[0].nm_usuario;
        const email = data[0].email;
        const senha = data[0].senha;

        res.render('editarUsuario', { nome, email, senha });

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/editarUsuario', async function (req, res) {
    if (req.session.loggedin) {
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
            .eq('id_usuario', req.session.idUser)

        if (error) {
            console.log(error);
            return res.status(400).json({ mensagem: 'Ocorreu um erro ao atualizar esse perfil! Tente novamente mais tarde.' });
        } else {
            if (nome) req.session.nome = nome;
            return res.status(200).json({ mensagem: 'Perfil atualizado com sucesso. Redirecionando para página inicial.' });
        }

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/editarSenha', function (req, res) {
    if (req.session.loggedin) {
        const { senhaAntiga, senhaAtual } = req.body;
        const id = req.session.idUser;

        let sql = 'SELECT * FROM usuario WHERE id_usuario = ? AND senha = MD5(?)';

        connection.query(sql, [id, senhaAntiga], function (err, results) {
            if (err) {
                console.log(err);
                return res.status(400).json({ mensagem: 'Ocorreu uma erro interno! Tente novamente mais tarde.' })
            }
            else {
                if (!results.length) {
                    return res.status(400).json({ mensagem: 'Sua senha antiga está errada! Tente novamente.' })
                }
                connection.query('UPDATE usuario SET senha = MD5(?) WHERE id_usuario = ?', [senhaAtual, id], function (erro, resultado) {
                    if (erro) {
                        console.log(erro);
                        return res.status(400).json({ mensagem: 'Ocorreu um erro ao tentar alterar sua senha! Tente novamente mais tarde.' })
                    } else {
                        console.log(resultado);
                        return res.status(200).json({ mensagem: 'Senha alterada com sucesso! Você voltará a página inicial.' });
                    }
                });
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/emailDeletarUsuario', function (req, res) {
    const idUser = req.session.idUser;
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
            <a href="http://localhost:3006/deletarConta?&email=${email}&id=${idUser}">Excluir Conta</a>
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
    if (req.session.loggedin) {
        const { email, id } = req.query;

        res.render('deletarConta', { email, id })
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/deletarConta', function (req, res) {
    if (req.session.loggedin) {
        const { id } = req.body;
        const sql = 'DELETE FROM usuario WHERE id_usuario = ?';

        connection.query(sql, id, function (err, results) {
            if (err) {
                console.log(err);
                return res.status(400).json({ mensagem: 'Ocorreu um erro ao tentar excluir sua conta! Tente novamente mais tarde.' })
            } else {
                console.log(results);
                return res.status(200).json({ mensagem: 'Conta removida com sucesso. Você pode fechar essa página.' })
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/emailDelete', function (req, res) {
    if (req.session.loggedin) {
        const idProjeto = req.body.idProjeto;
        const nomeProjeto = req.body.nomeProjeto;

        let emails = [];
        const sql = 'SELECT email FROM usuario WHERE id_usuario IN (SELECT id_aluno FROM projeto_aluno WHERE id_projeto = ?)';

        connection.query(sql, [idProjeto], function (err, results) {
            if (err) throw err;
            for (var i = 0; i < results.length; i++) {
                emails[i] = results[i].email;
            }
            emails.forEach(email => {
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
                    subject: 'Exclusão de Projeto - TCC Mentor',
                    html: `
                    <p>Um participante de seu projeto ${nomeProjeto} solicitou a exclusão.</p>
                    <p>Clique no link abaixo para votar por <strong>excluir o projeto</strong>:</p>
                    <a href="http://localhost:3006/deletarProjeto?&email=${email}&id=${idProjeto}">Excluir projeto</a>
                    <p>Ou releve este e-mail caso vote pela permanência do mesmo.</p>
                `
                };

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
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
})

app.get('/deletarProjeto', function (req, res) {
    if (req.session.loggedin) {
        const { email, id } = req.query;

        res.render('deletarProjeto', { email, id });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/deletarProjeto', function (req, res) {
    if (req.session.loggedin) {
        const id = req.body.id;
        const sql = 'UPDATE projeto SET voto_deletar = voto_deletar + 1 WHERE id_projeto = ?';

        connection.query(sql, [id], function (err, results) {
            if (err) {
                console.log(err);
                res.json({ success: false, message: 'Ocorreu um erro ao registrar seu voto! Tente novamente mais tarde.' });
            } else {
                connection.query('SELECT COUNT(id_aluno) contagem, voto_deletar FROM projeto_aluno NATURAL JOIN projeto WHERE id_projeto = ?', [id], function (erro, resultado) {
                    if (erro) throw erro;
                    if (((resultado[0].contagem / 2) >= resultado[0].voto_deletar) || resultado[0].contagem == 1) {
                        connection.query('DELETE FROM projeto WHERE id_projeto = ?', [id], function (erro2, resultado2) {
                            if (erro2) {
                                console.log(erro2);
                                res.json({ success: false, message: 'Erro ao deletar projeto. Contate o Suporte!' });
                            } else {
                                console.log(resultado2);
                                res.json({ success: true, message: 'Seu projeto foi deletado com sucesso!' });
                            }
                        })
                    } else {
                        console.log(resultado);
                        res.json({ success: true, message: 'Seu voto foi computado. Caso mais da metade dos participantes concordem, seu projeto será excluido!' })
                    }
                })
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/adicionarAluno', function (req, res) {
    if (req.session.loggedin) {
        const emails = req.body.email;
        const idProjeto = req.body.idProjeto;

        const sql = "SELECT * FROM usuario WHERE email IN (?)";

        connection.query(sql, [emails], function (err, results) {
            if (err) throw err;
            if (results.length < 1) {
                return res.json({ success: false, message: 'E-mail(s) sem cadastro! Solicite o(s) a criar uma conta!' });
            } else {
                const encontrados = results.map(user => user.email);
                const id = results.map(user => user.id_usuario);
                connection.query('SELECT * FROM usuario NATURAL JOIN projeto_aluno WHERE id_aluno IN (?)',
                    [id], function (err2, results2) {
                        if (err2) throw err2;
                        if (results2.length) {
                            const nome = results2[0].nm_usuario;
                            return res.json({ success: false, message: `Aluno ${nome} já possui um projeto em criado!` })
                        } else {
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
                    <p>${req.session.nome} te convidou para entrar em um projeto!</p>
                    <p>Clique no link abaixo para ver o convite:</p>
                    <a href="http://localhost:3006/conviteProjeto?email=${email}&id=${idProjeto}">Entre no meu grupo!</a>`
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
                        }
                    });
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/conviteProjeto', function (req, res) {
    if (req.session.loggedin) {
        const emails = req.query.email;
        const id = req.query.id;
        const sql = 'SELECT nm_projeto, dc_projeto, tp_projeto FROM projeto WHERE id_projeto = ?';

        connection.query(sql, [id], function (err, results) {
            const nomeP = results[0].nm_projeto;
            const descP = results[0].dc_projeto;
            const tipoP = results[0].tp_projeto;

            res.render('conviteProjeto', { emails, id, nomeP, descP, tipoP });
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/conviteProjeto', function (req, res) {
    if (req.session.loggedin) {
        const { email, id } = req.body;
        const sql = 'INSERT INTO projeto_aluno (id_projeto, id_aluno) VALUES (?, (SELECT id_usuario FROM usuario WHERE email = ?))';

        connection.query('SELECT * FROM projeto_aluno WHERE id_aluno = (SELECT id_usuario FROM usuario WHERE email = ?)', [email], function (erro, resultado) {
            if (erro) {
                console.log(erro);
                res.json({ success: false, message: 'Ocorreu um erro ao entrar no projeto! Tente novamente mais tarde.' });
            } else {
                if (resultado.length !== 0) {
                    res.json({ success: false, message: 'Essa conta já possui um projeto ativo. Não foi possível entrar!' })
                } else {
                    connection.query(sql, [id, email], function (err, results) {
                        if (err) {
                            console.log(err);
                            res.json({ success: false, message: 'Ocorreu um erro ao entrar no projeto! Tente novamente mais tarde.' })
                        } else {
                            console.log(results);
                            res.json({ success: true, message: 'Você entrou no projeto! Faça login para continuar.' })
                        }
                    })
                }
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/removerAluno', function (req, res) {
    if (req.session.loggedin) {
        const aluno = req.body.aluno;
        let sql = 'DELETE FROM projeto_aluno WHERE id_aluno = ?';

        connection.query(sql, [aluno], function (err, results) {
            if (err) {
                console.log(err);
                return res.json({ success: false, message: 'Ocorreu um erro ao remover o aluno. Tente novamente mais tarde.' });
            } else {
                return res.json({ success: true, message: 'Aluno removido com sucesso!' });
            }
        });
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/mensagens', async (req, res) => {
    if (req.session.loggedin) {
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

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/mensagens', upload.single('arquivo_pdf'), async (req, res) => {
    if (req.session.loggedin) {
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
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.post('/analisaMsg', async function (req, res) {
    if (req.session.loggedin) {
        const mensagem = req.body.msg;
        const idProjeto = req.body.idProjeto;

        console.log(mensagem)
        const url = `https://linhaguga.app.n8n.cloud/webhook/analyse-webhook?message=${mensagem}`;

        const res = await fetch(url, {
            method: "GET"
        });

        const data = await res.json();

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

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
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

app.get('/adicionarProjeto', function (req, res) {
    if (req.session.loggedin) {
        const cargo = req.session.cargo;
        res.render('adicionarProjeto', { cargo })
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
})

app.post('/adicionarProjeto', function (req, res) {
    const { nome, desc, tipo, orientador } = req.body;
    console.log(nome)
    const url = nome.toLowerCase().replace(/\s+/g, '-');

    if (req.session.cargo === 'ALUN')
        orientador = req.body
    else
        orientador = req.session.idUser

    const sql = "INSERT INTO projeto (nm_projeto, dc_projeto, tp_projeto, id_orientador, url) SELECT ?, ?, ?, id_usuario, ? FROM usuario WHERE nm_usuario = ?";
    let motivo = '';

    connection.query(sql, [nome, desc, tipo, url, orientador], function (err, results) {
        if (err) {
            console.log(err);
            if (err = "Error: ER_DUP_ENTRY: Duplicate entry 'TCC mentor' for key 'nm_projeto'") {
                motivo = ' Nome de projeto já existente!';
            }
            return res.json({ success: false, message: 'Erro ao criar projeto.' + motivo });

        } else if (results.affectedRows == 0) {
            return res.json({ success: false, message: 'Erro ao criar projeto: Orientador não registrado.' });

        } else {
            console.log(results);
            const idProjeto = results.insertId;
            const sqlAluno = "INSERT INTO projeto_aluno (id_projeto, id_aluno) SELECT '?', id_usuario FROM usuario WHERE nm_usuario = ?";

            connection.query(sqlAluno, [idProjeto, req.session.nome], function (err2, results2) {
                if (err2) {
                    console.log("Aluno err: ", err2);
                    return res.json({ success: false, message: 'Erro ao criar projeto.' });
                } else {
                    console.log("Aluno results: ", results2);
                    return res.json({ success: true, message: 'Projeto criado com sucesso!' })
                }
            })
        }
    })
});

if (require.main === module) {
    app.listen(3006, function () {
        console.log("Aplicativo rodando na porta 3006.");
    });
} else {
    module.exports = app;
}
