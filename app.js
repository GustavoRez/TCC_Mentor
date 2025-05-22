var express = require("express");
var app = express();
var connection = require('./database');
const path = require('path');
const multer = require('multer');
const session = require('express-session');
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static('public/uploads'));

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

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/tela_inicial.html'));
});

app.get('/login', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/login.html'));
});

app.post('/login', function (req, res) {
    const user = req.body.user;
    const pass = req.body.pass;
    const sql = "SELECT * FROM usuario WHERE email = ? AND senha = MD5(?)";

    connection.query(sql, [user, pass], function (err, results) {
        if (err) throw err;
        if (results.length) {
            req.session.loggedin = true;
            req.session.idUser = results[0].id_usuario;
            req.session.nome = results[0].nm_usuario;
            req.session.cargo = results[0].cargo;
            return res.json({ success: true, message: 'Login concluído! Redirecionando...' });
        } else {
            return res.json({ success: false, message: 'Nao achei oce' });
        }
    });
});

app.get('/cadastro', function (req, res) {
    res.sendFile(path.join(__dirname + '/views/cadastro.html'));
});

app.post('/cadastro', function (req, res) {
    const { email, nome, cargo, senha } = req.body;
    const sql = "SELECT * FROM usuario WHERE email = ?";

    connection.query(sql, email, function (err, results) {
        if (err) throw err;
        console.log(results.length)
        if (results.length < 1) {
            const sql2 = "INSERT INTO usuario (nm_usuario, cargo, email, senha) VALUES (?, ?, ?, MD5(?))";
            connection.query(sql2, [nome, cargo, email, senha], function (err2, results2) {
                if (err) {
                    console.log(err2);
                    return res.json({ success: false, message: 'Erro ao criar usuario.' });
                } else {
                    console.log(results2);
                    return res.json({ success: true, message: 'Perfil criado! Faça o login para continuar.' });
                }

            })
        } else
            return res.json({ success: false, message: 'Esse email já possui cadastro!' });
    })
})

app.post('/quit', function (req, res) {
    req.session.loggedin = false;
    req.session.username = null;
    req.session.avatar = null;
    req.session.cargo = null;
    res.redirect('/')
});

app.get('/home', function (req, res) {
    const nome = req.session.nome;
    const id = req.session.idUser;
    const cargo = req.session.cargo;
    let nomeProjetos = [];
    let tipos = [];
    let orientadores = [];
    let alunos = [];
    let orientador = false;
    let sql;

    if (req.session.loggedin) {
        if (req.session.cargo === 'ALUN') {
            sql = "SELECT nm_projeto, tp_projeto, o.nm_usuario orientador, a.nm_usuario aluno FROM usuario o JOIN projeto ON (o.id_usuario = id_orientador) NATURAL JOIN projeto_aluno JOIN usuario a ON (id_aluno = a.id_usuario) WHERE a.id_usuario = ?";
        } else {
            sql = "SELECT p.nm_projeto, p.tp_projeto, o.nm_usuario AS orientador, GROUP_CONCAT(a.nm_usuario SEPARATOR ', ') AS alunos FROM projeto p JOIN usuario o ON o.id_usuario = p.id_orientador JOIN projeto_aluno pa ON pa.id_projeto = p.id_projeto JOIN usuario a ON a.id_usuario = pa.id_aluno WHERE o.id_usuario = ? GROUP BY p.id_projeto";
        }
        connection.query(sql, [id], function (err, results) {
            if (err) throw err;
            for (var i = 0; i < results.length; i++) {
                nomeProjetos[i] = results[i].nm_projeto;
                tipos[i] = results[i].tp_projeto;
                orientadores[i] = results[i].orientador;
                alunos[i] = results[i].alunos;
            }
            res.render('home', { nome, cargo, nomeProjetos, tipos, orientadores, alunos })
        })

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/projeto-:projectURL', function (req, res) {
    if (req.session.loggedin) {
        const URL = req.params.projectURL;
        const cargo = req.session.cargo;
        let idProjeto;
        let projeto;
        let desc;
        let tipo;
        let orientador;
        let aluno = [];
        const mensagem = [];
        const dtMensagem = [];
        const remetente = [];
        let sql = "SELECT p.id_projeto, p.nm_projeto, p.dc_projeto, p.tp_projeto, o.nm_usuario AS orientador, GROUP_CONCAT(DISTINCT a.nm_usuario SEPARATOR ', ') AS alunos, m.remetente, m.mensagem, DATE_FORMAT(m.data_envio, '%d/%m/%Y - %H:%i') AS data_envio FROM projeto p JOIN usuario o ON o.id_usuario = p.id_orientador JOIN projeto_aluno pa ON pa.id_projeto = p.id_projeto JOIN usuario a ON a.id_usuario = pa.id_aluno LEFT JOIN mensagem_chat m ON m.id_projeto = p.id_projeto WHERE url = ? GROUP BY p.id_projeto, p.nm_projeto, p.dc_projeto, p.tp_projeto, o.nm_usuario, m.remetente, m.mensagem, m.data_envio";

        connection.query(sql, URL, function (err, results) {
            if (err) throw err;
            idProjeto = results[0].id_projeto;
            projeto = results[0].nm_projeto;
            desc = results[0].dc_projeto;
            tipo = results[0].tp_projeto;
            orientador = results[0].orientador;
            aluno = results[0].alunos

            const mensagens = results
                .filter(r => r.mensagem !== null)
                .map(r => ({
                    mensagem: r.mensagem,
                    data_envio: r.data_envio,
                    remetente: r.remetente
                }));
            res.render('projeto', { cargo, idProjeto, projeto, desc, tipo, orientador, aluno, mensagens })
        })


    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
})

app.get('/mensagens', (req, res) => {
    const idProjeto = req.query.idProjeto;

    if (!idProjeto) {
        return res.status(400).json({ error: 'ID do projeto não informado' });
    }

    const sql = `
    SELECT mensagem, remetente, arquivo_pdf,
           DATE_FORMAT(data_envio, '%d/%m/%Y - %H:%i') AS data_envio
    FROM mensagem_chat
    WHERE id_projeto = ?
    ORDER BY data_envio ASC
  `;

    connection.query(sql, [idProjeto], (err, results) => {
        if (err) {
            console.error("Erro ao buscar mensagens:", err);
            return res.status(500).json({ error: 'Erro no servidor' });
        }

        res.json(results);
    });
});

app.post('/mensagens', upload.single('arquivo_pdf'), async (req, res) => {
    const { idProjeto, remetente, mensagem } = req.body;
    const arquivo_pdf = req.file ? req.file.filename : null;

    const sql = `
    INSERT INTO mensagem_chat (id_projeto, remetente, mensagem, arquivo_pdf)
    VALUES (?, ?, ?, ?)
  `;
    try {
        await new Promise((resolve, reject) => {
            connection.query(sql, [idProjeto, remetente, mensagem || null, arquivo_pdf], (err, results) => {
                if (err) return reject(err);
                resolve(results);
            });
        });

        if (remetente === 'ORIE' && mensagem) {
            const respostaIA = await axios.post("http://localhost:8000/analisar", {
                conteudo: mensagem,
            });
            const mensagemIA = respostaIA.data.resposta;

            await new Promise((resolve, reject) => {
                connection.query(sql, [idProjeto, 'IA', mensagemIA, null], (err, results) => {
                    if (err) return reject(err);
                    resolve(results);
                });
            });
        }

        if (remetente === 'ORIE' && arquivo_pdf) {
            const pdfPath = path.join(__dirname, 'public/uploads', arquivo_pdf);

            const formData = new FormData();
            formData.append("file", fs.createReadStream(pdfPath));

            try {
                const respostaIA = await axios.post("http://localhost:8000/analisarPDF", formData, {
                    headers: formData.getHeaders(),
                });

                const mensagemIA = respostaIA.data.resposta;

                await new Promise((resolve, reject) => {
                    connection.query(sql, [idProjeto, 'IA', mensagemIA, null], (err, results) => {
                        if (err) return reject(err);
                        resolve(results);
                    });
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

app.get('/adicionarProjeto', function (req, res) {
    if (req.session.loggedin) {
        const cargo = req.session.cargo;
        res.render('adicionarProjeto', { cargo })
    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
})

app.post('/adicionarProjeto', function (req, res) {
    const { nome, desc, tipo, alunos, orientador } = req.body;
    let coorientador;

    if (req.session.cargo === 'ALUN')
        orientador, coorientador = req.body
    else
        orientador = req.session.idUser

    const sql = "INSERT INTO projeto (nm_projeto, dc_projeto,  tp_projeto, id_orientador) SELECT ?, ?, ?, id_usuario FROM usuario WHERE nm_usuario = ?";


    connection.query(sql, [nome, desc, tipo, orientador], function (err, results) {
        if (err) {
            console.log(err);
            return res.json({ success: false, message: 'Erro ao criar projeto.' });
        } else {
            console.log(results);
            const idProjeto = results.insertId;
            const sqlAluno = "INSERT INTO projeto_aluno (id_projeto, id_aluno) SELECT '?', id_usuario FROM usuario WHERE nm_usuario = ?";

            connection.query(sqlAluno, [idProjeto, req.session.nome], function (err2, results2) {
                if (err2) {
                    console.log("Aluno err: ", err2);
                } else {
                    console.log("Aluno results: ", results2);
                }
            })
            return res.json({ success: true, message: 'Projeto criado com sucesso!' })
        }
    })
})

if (require.main === module) {
    app.listen(3000, function () {
        console.log("Aplicativo rodando na porta 3000.");
        connection.connect(function (err) {
            if (err) throw err;
            console.log("Database conectado!");
        })
    });
} else {
    module.exports = app;
}

