var mysql = require('mysql');

var pool = mysql.createPool({
    host : '127.0.0.1',
    user : 'root',
    password : 'lzy18762501',
    database : 'e_rhythm'
});

module.exports = pool;  
