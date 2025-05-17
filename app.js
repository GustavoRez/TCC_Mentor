var express = require("express");
var app = express();
var connection = require('./database');
const path = require('path');
const session = require('express-session');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'images')));

app.set('view engine', 'ejs')

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

    if (req.session.loggedin) {
        const sql = "SELECT nm_projeto, tp_projeto, o.nm_usuario orientador, a.nm_usuario aluno FROM usuario o JOIN projeto ON (o.id_usuario = id_orientador) NATURAL JOIN projeto_aluno JOIN usuario a ON (id_aluno = a.id_usuario) WHERE a.id_usuario = ?";
        connection.query(sql, [id], function (err, results) {
            if (err) throw err;
            for (var i = 0; i < results.length; i++) {
                nomeProjetos[i] = results[i].nm_projeto;
                tipos[i] = results[i].tp_projeto;
                orientadores[i] = results[i].orientador;
                alunos[i] = results[i].aluno;
            }
            res.render('home', { nome, cargo, nomeProjetos, tipos, orientadores, alunos })
        })

    } else
        res.sendFile(path.join(__dirname + '/views/not_logged.html'));
});

app.get('/adicionarProjeto', function (req, res) {

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

