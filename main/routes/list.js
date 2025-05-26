var express = require('express');
var router = express.Router();
var async = require('async');

var pool = require('../models/db');
var list_m = require('../models/list');
var tran = require('../models/transformer');


// http://127.0.0.1:3000/list/1.html
router.get('/:pid.html', function(req, res) {
    var pid = req.params.pid || 1;
    var msg = req.query.msg;
    console.log('跳转详情页 ' + pid);

	async.parallel([
		function(callback){
			list_m.getListById(pid, function(result){
				callback(null, result[0]);
			})
		},
		function(callback){
			list_m.getReplyById(pid, function(result){
				callback(null, result);
			})
		},
    ], function(err, results) {
        if (err) {
            console.error("Error fetching post details:", err);
            res.status(500).send("Internal server error");
        } else {
            console.log("Results: ", results);
            res.render('post', { data: results, msg: msg });
        }
    });
	
});




router.get('/addreply', async function(req, res) {
    if (req.session.user) {
        const pid = parseInt(req.query.pid);
        const content = req.query.content;
        const uid = req.session.user.uid;
        const posttime = new Date();

        console.log("提交时间：" + posttime);

        try {
            // 获取行数
            const rowCount = await new Promise((resolve, reject) => {
                pool.getConnection(function(err, connection) {
                    if (err) reject(err);
                    connection.query('SELECT COUNT(*) AS rowCount FROM `reply`', function(error, results) {
                        if (error) reject(error);
                        connection.release();
                        resolve(results[0].rowCount);
                    });
                });
            });
            //获取在当前post下的编号
			const rowCount2 = await new Promise((resolve, reject) => {
                pool.getConnection(function(err, connection) {
                    if (err) reject(err);
                    connection.query('SELECT COUNT(*) AS rowCount FROM `reply` WHERE `pid`=?',pid, function(error, results) {
                        if (error) reject(error);
                        connection.release();
                        resolve(results[0].rowCount);
                    });
                });
            });

            const id = rowCount + 1;
			const id2 =rowCount2 + 1;
            //console.log(id);

            const params = { id: id, pid: pid, uid: uid, content: content, posttime: posttime };
            //console.log(params);

            list_m.addReply(params, function(result) {
                //console.log(result);
                if (result.affectedRows) {
					temp = tran.transformer(posttime);
                    res.json({ code: 0, msg: '回复成功', data: { id:id2, posttime: temp, author: req.session.user.username } });
                } else {
                    res.json({ code: 2, msg: '回复失败，请重新尝试' });
                }
            });
        } catch (error) {
            console.error("出现错误：" + error.message);
            res.json({ code: 2, msg: '回复失败，请重新尝试' });
        }
    } else {
        res.json({ code: 1, msg: '您还未登录' });
    }
});

router.get('/r_update', function(req, res) {
    const pid = req.query.pid;
    
    list_m.getReplyById(pid, function(result) {
        res.json(result);
    });
});

router.get('/addtopic', async function(req, res) {
    if (req.session.user) {
        const title = req.query.title;
        const content = req.query.content;
        const uid = req.session.user.uid;
        const posttime = new Date();
        const type = req.query.type;

        console.log("提交时间：" + posttime);

        try {
            // 获取行数
            const rowCount = await new Promise((resolve, reject) => {
                pool.getConnection(function(err, connection) {
                    if (err) reject(err);
                    connection.query('SELECT COUNT(*) AS rowCount FROM `post`', function(error, results) {
                        if (error) reject(error);
                        connection.release();
                        resolve(results[0].rowCount);
                    });
                });
            });

            const id = rowCount + 1;
            //console.log(id);

            const params = { id: id, uid: uid, title: title, content: content, posttime: posttime, type: type};
            //console.log(params);

            list_m.addTopic(params, function(result) {
                //console.log(result);
                if (result.affectedRows) {
					var temp=tran.transformer(posttime);
                    res.json({ code: 0, msg: '添加成功', data: { url: '/list/' + id + '.html', id:id, title: title, author: req.session.user.username, posttime: temp } });
                } else {
                    res.json({ code: 2, msg: '添加失败，请重新尝试' });
                }
            });
        } catch (error) {
            console.error("出现错误：" + error.message);
            res.json({ code: 2, msg: '添加失败，请重新尝试' });
        }
    } else {
        res.json({ code: 1, msg: '您还未登录' });
    }
});

router.get('/api/post/state', function(req, res) {
    const postId = req.query.postId;
    const userId = req.query.userId;
    if (!postId || !userId) {
        return res.status(400).json({ error: '参数缺失' });
    }
    list_m.checkUserPostState(postId, userId, function(err, state) {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json(state);
    });
});

router.post('/api/post/action', function(req, res) {
    if (req.session.user) {
        const { postId, type, isActive } = req.body;

        const userId = req.session.user.uid;
        if (!postId || !userId || !type) {
            return res.status(400).json({ error: '参数缺失' });
        }
        list_m.updateUserPostState(postId, userId, type, isActive, function(err, result) {
            if (err) {
                return res.status(500).json({ error: '数据库错误' });
            }
            res.json({ success: true });
        });
    }
    else{
        res.json({ code: 1, msg: '您还未登录' });
    }
});

router.get('/api/post/heat', function(req, res) {
    const postId = req.query.postId;
    if (!postId) {
        return res.status(400).json({ error: '参数缺失' });
    }
    list_m.getPostHeat(postId, function(err, heat) {
        if (err) {
            return res.status(500).json({ error: '数据库错误' });
        }
        res.json({ heat });
    });
});
/* // 改到routes/index.js
router.get('/collection', function(req, res) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    // 假设你有 getUserCollections 方法，查找当前用户收藏的帖子
    list_m.getUserCollections(req.session.user.uid, function(err, posts) {
        if (err) {
            console.error(err);
            return res.status(500).send('数据库错误');
        }
        res.render('collection', {
            title: '收藏夹',
            user: req.session.user,
            data: posts || []
        });
    });
});
*/
module.exports = router;