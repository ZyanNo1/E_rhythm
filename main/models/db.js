var mysql = require('mysql');

var pool = mysql.createPool({
    host : '127.0.0.1',
    user : 'YOUR_USERNAME',
    password : 'YOUR_PASSWORD',
    database : 'e_rhythm'
});

module.exports = pool;  
