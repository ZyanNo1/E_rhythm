var pool = require('./db');
var tran = require('./transformer');
var func = {
	// 获取首页的主题
    getIndexList: function(cb) {
        pool.getConnection(function(err, connection) {
            if (err) throw err;
    
            console.log("getIndexList");
    
            connection.query(` 
                SELECT post.id, post.title, post.content, post.uid, post.like, post.collection, post.posttime, user.username 
                FROM post JOIN user ON post.uid = user.id`
            , function(err, result) {
                if (err) {
                    throw err;
                } else {
                    console.log("reading database");
                }
                for (var i = 0; i < result.length; i++) {
                    let temp = result[i].posttime;
                    result[i].posttime = tran.transformer(temp);
                }
                cb(result);
                console.log(result);
                connection.release();
            });
        });
    },
    

	// 根据id查询主题的详情信息
	getListById: function(id, cb) {
			pool.getConnection(function(err, connection) {
				if (err) {
					console.error("Error getting connection:", err);
					cb(null); // 返回 null 或合适的错误消息
					return;
				}
				const sql = `
					SELECT p.*, u.username, u.post_num, u.contribution 
					FROM post p
					JOIN user u ON p.uid = u.id
					WHERE p.id = ?
				`;
				
				connection.query(sql, [id], function(err, result) {
					if (err) {
						console.error("Error executing query:", err);
						cb(null); // 返回 null 或合适的错误消息
					} else {
						console.log("Query result:", result);
						cb(result);
					}
					connection.release();
				});
			});
		},

	// 某主题的回复
	getReplyById : function(pid, cb){
		pool.getConnection(function(err, connection){
		    if(err) throw err;

		    connection.query('SELECT DISTINCT r.*, u.username FROM `reply` r INNER JOIN `user` u ON r.uid= u.id, `user` WHERE `pid`=?' , [pid], function(err, result){
		        if(err) throw err;

				for(var i=0;i<result.length;i++){
					temp=result[i].posttime;
					result[i].posttime=tran.transformer(temp);
				}
				
		        cb(result);
				//console.log(result);
		        connection.release();
		    })
		});
	},

	/*
		添加回复
		pid, uid, content, createtime, type
	*/
	addReply : function(params, cb){
		pool.getConnection(function(err, connection){
		    if(err) {
				console.error("Error getting connection:", err);
				throw err;
			}

		    connection.query('INSERT INTO `reply` SET ?', params, function(err, result){
		        if(err) {
					connection.release();
					throw err;
				}
				else{
					console.log("database updated");

					connection.query(
						'UPDATE user SET contribution = contribution + 30 WHERE id = ?',
						[params.uid],
						function(err2) {
							// 可选：处理err2
							connection.release();
							cb(result);
						}
                	);
				}
				//console.log(result);
		    })

			/*connection.query('SELECT r.*, u.username FROM `reply` r  INNER JOIN `user` u ON r.uid= u.id WHERE r.id = (SELECT MAX(id) FROM `reply`);', function(err, result){
		        if(err) {
					throw err;
				}
				else{
					console.log("database updated");
				}

		        cb(result);
				console.log(result);
		        connection.release();
		    })*/
		});
	},

	/*
		添加主题
		uid, title, content, createtime
	*/
	addTopic : function(params, cb){
		pool.getConnection(function(err, connection){
		    if(err) throw err;

		    connection.query('INSERT INTO `post` SET ?', params, function(err, result){
				if(err) {
					throw err;
				}
				else{
					console.log("database updated");
				}

		        cb(result);
		        connection.release();
		    })
		});
	},

	checkUserPostState : function(postId, userId, cb){
		pool.getConnection(function(err, connection) {
			if (err) return cb(err);

			connection.query(
				'SELECT is_liked, is_collected FROM user_post_actions WHERE post_id = ? AND user_id = ?',
				[postId, userId],
				function(err, results) {
					connection.release();
					if (err) {
						console.error('SQL error:', err);
						return cb(err);
					}
					if (results.length > 0) {
						cb(null, {
							is_liked: !!results[0].is_liked,
							is_collected: !!results[0].is_collected
						});
					} else {
						cb(null, {
							is_liked: false,
							is_collected: false
						});
					}
				}
			);
    	});
	},
/*
	updateUserPostState : function(postId, userId, type, isActive, cb) {
		postId = Number(postId);
		userId = Number(userId);
		var column = (type === 'like') ? '`like`' : 'collection'; 
		pool.getConnection(function(err, connection) {
			if (err) return cb(err);

			connection.query(
				'SELECT id FROM user_post_actions WHERE post_id = ? AND user_id = ?',
				[postId, userId],
				function(err, results) {
					if (err) {
						console.error('SQL error:', err);
						connection.release();
						return cb(err);
					}

					var updateOrInsert = function() {
						// 更新帖子计数
						var increment = isActive ? 1 : -1;
						connection.query(
							`UPDATE post SET ${column} = ${column} + ? WHERE id = ?`,
							[increment, postId],
							function(err) {
								
								connection.release();
								if (err) {
									console.error('SQL error:', err);
									return cb(err);
								}
								cb(null, { success: true });
							}
						);
					};

					if (results.length === 0) {
						// 不存在记录，插入
						var is_liked = (type === 'like') ? isActive : false;
						var is_collected = (type === 'collection') ? isActive : false;
						connection.query(
							'INSERT INTO user_post_actions (post_id, user_id, is_liked, is_collected) VALUES (?, ?, ?, ?)',
							[postId, userId, is_liked, is_collected],
							function(err) {
								if (err) {
									console.error('SQL error:', err);
									connection.release();
									return cb(err);
								}
								updateOrInsert();
							}
						);
					} else {
						// 存在记录，更新
						var field = (type === 'like') ? 'is_liked' : 'is_collected';
						connection.query(
							`UPDATE user_post_actions SET ${field} = ? WHERE post_id = ? AND user_id = ?`,
							[isActive, postId, userId],
							function(err) {
								if (err) {
									console.error('SQL error:', err);
									connection.release();
									return cb(err);
								}
								updateOrInsert();
							}
						);
					}
				}
			);
		});
	},
*/
	updateUserPostState : function(postId, userId, type, isActive, cb) {
		postId = Number(postId);
		userId = Number(userId);
		var column = (type === 'like') ? '`like`' : 'collection';
		pool.getConnection(function(err, connection) {
			if (err) return cb(err);

			connection.query(
				'SELECT id, is_liked, is_collected FROM user_post_actions WHERE post_id = ? AND user_id = ?',
				[postId, userId],
				function(err, results) {
					if (err) {
						connection.release();
						return cb(err);
					}

					var updatePostCount = function(increment) {
						connection.query(
							`UPDATE post SET ${column} = ${column} + ? WHERE id = ?`,
							[increment, postId],
							function(err) {
								connection.release();
								if (err) return cb(err);
								cb(null, { success: true });
							}
						);
					};

					if (results.length === 0) {
						// 没有记录，插入
						var is_liked = (type === 'like') ? (isActive ? 1 : 0) : 0;
						var is_collected = (type === 'collection') ? (isActive ? 1 : 0) : 0;
						connection.query(
							'INSERT INTO user_post_actions (post_id, user_id, is_liked, is_collected) VALUES (?, ?, ?, ?)',
							[postId, userId, is_liked, is_collected],
							function(err) {
								if (err) {
									connection.release();
									return cb(err);
								}
								updatePostCount(isActive ? 1 : 0); // 只加不减，因为之前没有
							}
						);
					} else {
						// 有记录，判断是否需要加还是减
						var field = (type === 'like') ? 'is_liked' : 'is_collected';
						var prev = results[0][field];
						var increment = (isActive ? 1 : 0) - prev; // 1-1=0, 0-1=-1, 1-0=1, 0-0=0
						connection.query(
							`UPDATE user_post_actions SET ${field} = ? WHERE post_id = ? AND user_id = ?`,
							[isActive ? 1 : 0, postId, userId],
							function(err) {
								if (err) {
									connection.release();
									return cb(err);
								}
								if (increment !== 0) {
									updatePostCount(increment);
								} else {
									connection.release();
									cb(null, { success: true });
								}
							}
						);
					}
				}
			);
		});
	},

	getPostHeat : function(postId, cb) {
		pool.getConnection(function(err, connection) {
			if (err) return cb(err);

			connection.query(
				'SELECT `like`, `collection` FROM post WHERE id = ?',
				[postId],
				function(err, results) {
					connection.release();
					if (err) return cb(err);
					if (results.length > 0) {
						var like = results[0].like || 0;
						var collection = results[0].collection || 0;
						var heat = (2 * like + 3 * collection) * 10;
						cb(null, heat);
					} else {
						cb(null, 0);
					}
				}
			);
    	});
	},

	getUserCollections: function(userId, cb) {
		pool.getConnection(function(err, connection) {
			if (err) return cb(err);
			// 查询当前用户收藏的所有帖子及其作者名
			connection.query(
				`SELECT post.id, post.title, post.content, post.uid, post.like, post.collection, post.posttime, user.username
				FROM user_post_actions
				JOIN post ON user_post_actions.post_id = post.id
				JOIN user ON post.uid = user.id
				WHERE user_post_actions.user_id = ? AND user_post_actions.is_collected = 1`,
				[userId],
				function(err, results) {
					connection.release();
					if (err) {
						console.error('SQL error:', err);
						return cb(err);
					}
					console.log('收藏结果:', results);
					// 格式化时间
					for (var i = 0; i < results.length; i++) {
						let temp = results[i].posttime;
						results[i].posttime = tran.transformer(temp);
					}
					cb(null, results);
				}
			);
		});
	},

	searchPosts: function(keyword, cb) {
		pool.getConnection(function(err, connection) {
			if (err) return cb([]);
			const sql = `
				SELECT post.id, post.title, post.content, post.uid, post.like, post.collection, post.posttime, user.username
				FROM post JOIN user ON post.uid = user.id
				WHERE post.title LIKE ? OR post.content LIKE ?
			`;
			const wd = `%${keyword}%`;
			connection.query(sql, [wd, wd], function(err, results) {
				connection.release();
				if (err) return cb([]);
				for (var i = 0; i < results.length; i++) {
					let temp = results[i].posttime;
					results[i].posttime = tran.transformer(temp);
				}
				cb(results);
			});
		});
	},
}

module.exports = func;