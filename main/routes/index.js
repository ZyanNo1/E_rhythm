var express = require('express');
var router = express.Router();
var list_m= require('../models/list');
var pool = require('../models/db');
var tran = require('../models/transformer');
/* welcome page. */
router.get('/', function(req, res, next) {
  res.render('header', { title: '欢迎' });
});
/* home page. */
router.get('/home', function(req, res, next) {
  if (!req.session.user) {
    return res.render('home', { title: '主页', user: {} });
  }
  pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, results) {
    let avatar = results && results[0] ? results[0].avatar : null;
    res.render('home', { title: '主页', user: { ...req.session.user, avatar } });
  });
});
/* write page */

router.get('/write', (req, res) => { 
    if (!req.session.user) {
        return res.render('write', { title: '创作', user: {} });
    }
    pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, results) {
        let avatar = results && results[0] ? results[0].avatar : null;
        res.render('write', { title: '创作', user: { ...req.session.user, avatar } });
    });
}); 
 
router.get('/pediaHome', function(req, res, next) {
  if (!req.session.user) {
        return res.render('ERpediaHome', { title: '亿韵百科', user: {} });
    }
    pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, results) {
        let avatar = results && results[0] ? results[0].avatar : null;
        res.render('ERpediaHome', { title: '亿韵百科', user: { ...req.session.user, avatar } });
    });
});

router.post('/submitPost', function(req, res) {
    const { title, content, type } = req.body;
    const userId = req.user.id; 

    // 获取当前 post 表中的最大 ID
    pool.getConnection(function(err, connection) {
        if (err) {
            res.json({ success: false, message: '数据库连接失败' });
            return;
        }

        connection.query('SELECT MAX(id) AS maxId FROM post', function(err, result) {
            if (err) {
                connection.release();
                res.json({ success: false, message: '无法获取最大ID' });
                return;
            }

            const newId = (result[0].maxId || 0) + 1;

            // 插入新记录
            connection.query('INSERT INTO post (id, title, content, type, uid) VALUES (?, ?, ?, ?, ?)', [newId, title, content, type, userId], function(err, result) {
                connection.release();
                if (err) {
                    res.json({ success: false, message: '数据库插入失败' });
                } else {
                    res.json({ success: true, message: '文章已成功提交' });
                }
            });
        });
    });
});

router.post('/addtopic', async function(req, res) {
  if (req.session.user) {
      const title = req.body.title;  // 从请求体中获取数据
      const content = req.body.content;  // 从请求体中获取数据
      const uid = req.session.user.uid;
      const posttime = new Date();
      const type = req.body.type;  // 从请求体中获取数据

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

          const params = { id: id, uid: uid, title: title, content: content, posttime: posttime, type: type };

          list_m.addTopic(params, function(result) {
              if (result.affectedRows) {
                pool.getConnection(function(err, connection) {
                    if (!err) {
                        connection.query(
                            'UPDATE user SET contribution = contribution + 100 WHERE id = ?',
                            [uid],
                            function(err) { connection.release(); }
                        );
                    }
                });
                  const temp = tran.transformer(posttime);
                  res.json({ code: 0, msg: '添加成功', data: { url: '/list/' + id + '.html', id: id, title: title, author: req.session.user.username, posttime: temp, type: type } });
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



router.get('/cowork', function(req, res, next) {
    const wd = req.query.wd;
    if (!req.session.user) {
        // 未登录
        if (wd) {
            list_m.searchPosts(wd, function(results) {
                res.render('cowork', {
                    data: results,
                    user: {}
                });
            });
        } else {
            list_m.getIndexList(function(result){
                res.render('cowork',{data:result, title: '社区', user: {}});
            });
        }
        return;
    }
    // 已登录，查头像
    pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, results) {
        let avatar = results && results[0] ? results[0].avatar : null;
        if (wd) {
            list_m.searchPosts(wd, function(results) {
                res.render('cowork', {
                    data: results,
                    user: { ...req.session.user, avatar }
                });
            });
        } else {
            list_m.getIndexList(function(result){
                res.render('cowork',{data:result, title: '社区', user: { ...req.session.user, avatar }});
            });
        }
    });
});


router.get('/collection', function(req, res) {
    if (!req.session.user) {
        return res.redirect('/user/login');
    }
    pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, results) {
        let avatar = results && results[0] ? results[0].avatar : null;
        list_m.getUserCollections(req.session.user.uid, function(err, posts) {
            if (err) {
                console.error(err);
                return res.status(500).send('数据库错误');
            }
            res.render('collection', {
                title: '收藏夹',
                user: { ...req.session.user, avatar },
                data: posts || []
            });
        });
    });
});

router.get('/pediaIndex', function(req, res) {
    const wd = req.query.wd|| '';
    const categories = req.query.categories ? req.query.categories.split(',') : [] || '';
    let sql = "SELECT * FROM yixiang";
    let params = [];
    if (categories.includes('自然意象') && !categories.includes('植物意象')) {
        categories.push('植物意象');
    }
    if ((wd && wd.trim()) || (categories && categories.length > 0 && categories[0] !== "")) {
        let whereArr = [];
        if (wd && wd.trim()) {
            whereArr.push("(name LIKE ? OR meaning LIKE ?)");
            params.push(`%${wd}%`, `%${wd}%`);
        }
        if (categories.length > 0 && categories[0] !== "") {
            whereArr.push("(" + categories.map(() => "category=?").join(" OR ") + ")");
            params = params.concat(categories);
        }
        sql += " WHERE " + whereArr.join(" AND ");
    }

    if (!req.session.user) {
        return pool.query(sql, params, function(err, results) {
            if (err) return res.status(500).send('数据库错误');
            res.render('ERpediaIndex', {
                data: results,
                wd: wd,
                categories: req.query.categories || "",
                user: {}
            });
        });
    }

pool.query('SELECT avatar FROM user WHERE id=?', [req.session.user.uid], function(err, avatarResults) {
        let avatar = avatarResults && avatarResults[0] ? avatarResults[0].avatar : null;
        pool.query(sql, params, function(err, results) {
            if (err) return res.status(500).send('数据库错误');
            res.render('ERpediaIndex', {
                data: results,
                wd: wd,
                categories: req.query.categories || "",
                user: { ...req.session.user, avatar }
            });
        });
    });
});


module.exports = router;


router.post('http://localhost:5000/process', async (req, res) => {
    try {
        // 假设你从表单中获取了名为inputText的数据
        const inputText = req.body.inputText;
        console.log("我监测到生成古诗的请求了!!!!!!!!!!!!!!!")
        // 使用axios向Python后端发送POST请求
        const response = await axios.post('http://localhost:5000/process', { inputText });
        
        // 将Python后端的响应返回给前端
        res.send(response.data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing request');
    }
});