var express = require('express');
var router = express.Router();
var user_m = require('../models/user');
const multer = require('multer');
const path = require('path');

// 个人中心
router.get('/info', function(req, res, next) {
	var id=req.session.user.uid;
	if (req.session.user.uid){
		user_m.load(id, function(result){
			if(result){
				console.log(result);
				res.render('user', {data:result});
				//console.log(data);
			}
			else{
				res.redirect('/home');
			}
		});
	}
	else{
		res.redirect('/login');
	}
	
});

router.post('/updateIntroduction', function(req, res) {
    const userId = req.body.user_id;
    const introduction = req.body.introduction;

    if (!userId || !introduction) {
        return res.status(400).json({ success: false, message: '缺少必要的参数' });
    }

    user_m.updateIntroduction(userId, introduction, function(result) {
        if (result) {
            res.json({ success: true, message: '简介更新成功' });
        } else {
            res.json({ success: false, message: '更新失败' });
        }
    });
});


router.post('/updateIntroduction', function(req, res) { 
	const userId = req.body.user_id; 
	const introduction = req.body.introduction; 
	if (!userId || !introduction) { 
		return res.status(400).json({ success: false, message: '缺少必要的参数' }); 
	} 
	user_m.updateIntroduction(userId, introduction, function(result) {
		 if (result) { 
			//console.log('简介更新成功');
			res.json({ success: true, message:'简介更新成功'}); 
		} else {
			console.log('简介更新失败');
			//res.json({ success: false }); 
		} 
	}); 
});

// 进入到登录页面
router.get('/login', function(req, res, next) {
  res.render('login', {errmsg:''});
});

// 处理登录请求
router.post('/login', function(req, res, next) {
	// console.log(req.body.username, req.body.password);
	var username = req.body.username || '',
			password = req.body.password || '';


	user_m.login(username, password, function(result){
		if(result.length){
			// console.log( req.session );
			req.session.user = {
				uid : result[0].id,
				username : username
			};
			console.log('登录成功');
			res.redirect('/home');
		}else{
			console.log('登录失败');
			res.render('login', {errmsg:'用户名或密码错误'});
		}
	});
});

// 展示注册页面
router.get('/reg', function(req, res, next){
	res.render('register', {errmsg:''});
});

// 处理注册数据
router.post('/reg', function(req, res, next){
	var username = req.body.username || '',
			email = req.body.email || '',
			password = req.body.password || '',
			password2 = req.body.password2 || '';

	if(password!=password2){
		res.render('register', {errmsg:'密码不一致'});
		return;
	}
	var regtime = new Date();

	user_m.reg(username, password, email, regtime, function(result){
		if(result.isExisted){
			res.render('register', {errmsg:'用户名已存在'});
		}else if(result.affectedRows){
			req.session.user = {
				uid : result.insertId,
				username : username
			};	
			console.log("跳转主页");
			res.redirect('/home');
			//console.log(100);
		}else{
			res.render('register', {errmsg:'注册失败，请重新尝试'});
		}
	});
	
});

// 登出
router.get('/logout', function(req, res, next){
	req.session.destroy();
  res.redirect('/home');
})

// 处理头像上传
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../public/uploads/avatars'));
    },
    filename: function (req, file, cb) {
		const userId = req.session.user ? req.session.user.uid : 'guest';
        const ext = path.extname(file.originalname);
        cb(null, 'avatar_' + userId + '_' + Date.now() + ext);
    }
});
const upload = multer({ storage: storage });

router.post('/uploadAvatar', upload.single('avatar'), function(req, res) {
    const user_id = req.body.user_id;
    const avatarPath = '/uploads/avatars/' + req.file.filename;
    // 更新数据库
    user_m.updateAvatar(user_id, avatarPath, function(success) {
        if (success) {
            res.json({ success: true, avatarUrl: avatarPath });
        } else {
            res.json({ success: false });
        }
    });
});
module.exports = router;