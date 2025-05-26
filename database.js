var mysql = require("mysql");

var connection = mysql.createConnection({
    host: 'localhost',
    database: 'tcc_mentor',
    user: 'root',
    password: ''
});

module.exports = connection;