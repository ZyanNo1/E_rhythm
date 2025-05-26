var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session')

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/user');
var listRouter = require('./routes/list');
const apiRouter = require('./routes/api');
var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'views')));
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'zyan', // 
  cookie: { maxAge: 60*60*1000 },
  resave : false,
  saveUninitialized : true
}));

app.use(function(req, res, next){
	// 如果cookie中存在，则说明已经登录
	if( req.session.user ){
		res.locals.user = {
			uid : req.session.user.uid,
			username : req.session.user.username
		}
	}else{
		res.locals.user = {};
	}
	next();
})

app.use('/', indexRouter);
app.use('/home', indexRouter)
app.use('/user', usersRouter);
app.use('/list', listRouter);
app.use('/api', apiRouter);
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  console.error('EJS/Express error:', err);
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  // render the error page
  res.status(err.status || 500);
  res.render('error');
});



module.exports = app;
