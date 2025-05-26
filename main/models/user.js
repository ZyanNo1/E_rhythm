var pool = require('./db');// 连接数据库
    //crypto = require('crypto'); // 对密码进行加密

module.exports = {
    /*hash : function(str){
        return crypto.createHmac('sha1', str).update('love').digest('hex');
    },*/

    // 注册
    reg : function(username, password,email,regtime, cb){
        pool.getConnection(function(err, connection){
            if(err) throw err;
            var rowCount;
            connection.query('SELECT COUNT(*) AS rowCount FROM `user`', function (error, results, fields) {
                if (error) throw error;
                // 获取行数
                rowCount = results[0].rowCount;
                console.log(rowCount);

              });

            // 首先检测用户名是否存在
            connection.query('SELECT `id` FROM `user` WHERE `username`=?', [username], function(err, sele_res){
                if(err) throw err;
                console.log(sele_res);

                // 若用户名已存在，则直接回调
                if(sele_res.length){
                    cb({isExisted:true});
                    connection.release();
                }else{
                    // 否则将信息插入到数据库中
                    var params = {id:rowCount+1,username:username, password:password, email:email, regtime:regtime};
                    connection.query('INSERT INTO `user` SET ?', params, function(err, insert_res){
                        if(err) throw err;

                        cb(insert_res);
                        connection.release();
                    })
                }
            })
        });
    },

    login : function(username, password, cb){
        pool.getConnection(function(err, connection){
            if(err) throw err;

            connection.query('SELECT `id` FROM `user` WHERE `username`=? AND `password`=?', [username, password], function(err, result){
                if(err) throw err;

                cb(result);
                connection.release();
            })
        });
    },

    load: function (id, cb){
        pool.getConnection((err, connection) => { 
            if (err) throw err; 
            // 我这里更新了data的逻辑，新加了一个头像的数据
            connection.query('SELECT `id`, `regtime`, `post_num`, `contribution`, `introduction`, `avatar` FROM `user` WHERE `id` = ?', [id], (err, result) => {
                 if (err) throw err; 
                 cb(result); 
                 connection.release(); 
            }); 
        });
    },

    updateIntroduction: function(user_id, introduction, cb) {
         pool.getConnection((err, connection) => { 
            if (err) { 
                console.error('Error getting database connection:', err);
                 return cb(false); 
            }
            connection.query('UPDATE `user` SET `introduction` = ? WHERE `id` = ?', [introduction, user_id], (err, result) => { 
                if (err) { 
                    console.error('Error executing query:', err); 
                    return cb(false); 
                } 
                cb(true); 
                connection.release(); 
            }); 
        }); 
    },

    updateAvatar: function(user_id, avatarPath, cb) {
        pool.getConnection((err, connection) => {
            if (err) return cb(false);
            connection.query(
                'UPDATE `user` SET `avatar` = ? WHERE `id` = ?',
                [avatarPath, user_id],
                (err, result) => {
                    connection.release();
                    if (err) return cb(false);
                    cb(true);
                }
            );
        });
    }
}