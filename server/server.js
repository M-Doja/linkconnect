var config = require('./../config');
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var User = require('./../models/user');
var port = process.env.PORT || 3000;
var passport = require('passport');
var bodyParser = require('body-parser');
var LocalStrategy = require('passport-local');
var passportLocalMongoose = require('passport-local-mongoose');
var socketIO = require('socket.io');
var clientio = require('socket.io-client')('http://localhost');
var http = require('http');
const {generateMessage, generateLocationMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users} = require('./utils/users');
var Mid = require('../middleware');
var usersRouter = require('./../routes/user');
var postsRouter = require('./../routes/post');
var mailRouter = require('./../routes/inbox');
var imageRouter = require('./../routes/images');
var  app = express();

var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
var userRouter = require('./../routes/user');

var url
if (process.env.NODE_ENV === 'production') {
  url = config.DB_Prod_URI;
}else {
  url = 'mongodb://localhost:27017/linkconnectDB';
}
mongoose.connect(url,(err, db) => {
  useMongoClient: true
}, (err, db) => {
  if (err) {
    console.log(err);
  }
  console.log('Now connected to DB');
  db = db;
});

// view engine setup
app.set('views', path.join(__dirname, '/../views'));
app.set('view engine', 'ejs');
app.engine('.html', require('ejs').renderFile);
app.use(express.static(__dirname + '/../public'));
app.set('view options', { layout: false });
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('express-session')({
  secret: 'config.Session_Secret',
  resave: false,
  saveUninitialized: false
}));
// app.use(function(req, res, next) {
//     if (req.session.user === null){
//       return res.redirect('/login');
//     }   else{
//         next();
//     }
// });
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

/* Render Landing Page */
app.get('/', (req, res,next) => {
  res.render('index', { title: 'Link Connect' , user: ''});
});

/* Render Login Form */
app.get('/login', (req, res, next) => {
  res.render('login',{title:"Link Connect",errMsg: '', user: '' });
});

/* Render Register Form */
app.get('/register', (req, res, next) => {
  res.render('register',{title:"Link Connect", errMsg: '', user: '' });
});

/* GET Log Out Page*/
app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

/* POST Log In */
app.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user) {
    if (err) {
      return res.render('login',{ title:'Link Connect', success : false, errMsg : err.message });
    }

    if (! user) {
       res.render('login',{ title:'Link Connect', success : false, errMsg : 'Invalid username or password!' });
    }

    req.login(user, function(err){
      if(err){
        return res.render('login',{ title:'Link Connect', success : false, errMsg : err.message });
      }
       res.redirect('/user/home');
    });
  })(req, res, next);
});

/* POST Sign Up */
app.post('/register', (req, res) => {

  User.register(new User({
    username: req.body.username,
  }),req.body.password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render('register',{title:'Link Connect', errMsg: err.message});
    }
    passport.authenticate('local')(req, res, function(){
      res.redirect('/user/home');
    });
  });
});

/* Render Chat Login Form */
app.get('/chat/login' ,Mid.isLoggedIn ,(req, res,next) => {
  res.render('chat/login');
});

/* Render Chat Room  */
app.get('/chat', Mid.isLoggedIn, (req, res,next) => {
  res.render('chat/chat');
});

io.on('connection', (socket) => {
  console.log('New User Connected');
  socket.on('join', (params, cb) => {
    if (!isRealString(params.name) || !isRealString(params.room)) {
      return cb('Name and room name are required.')
    }

    socket.join(params.room);
    users.removeUser(socket.id);
    users.addUser(socket.id, Mid.capitalizeName(params.name), params.room)
    io.to(params.room).emit('updateUserList', users.getUserList(params.room));
    socket.emit('newMessage', generateMessage('Admin',`Welcome to Chat Node ${Mid.capitalizeName(params.name)}`));
    socket.broadcast.to(params.room).emit('newMessage', generateMessage('Admin',`${Mid.capitalizeName(params.name)} has joined the room`));
    cb();
  });

  socket.on('createMessage', (message, cb) => {
    var user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      io.to(user.room).emit('newMessage', generateMessage(Mid.capitalizeName(user.name), message.text));
    }
    cb();
  });

  socket.on('createLocationMessage', (coords) => {
    var user = users.getUser(socket.id);
    if (user) {
      io.to(user.room).emit('newLocationMessage', generateLocationMessage(Mid.capitalizeName(user.name), coords.latitude, coords.longitude))
    }
  });

  socket.on('disconnect', ()  => {
    var user = users.removeUser(socket.id);
    if (user) {
      io.to(user.room).emit('updateUserList', users.getUserList(user.room));
      io.to(user.room).emit('newMessage', generateMessage('Admin', `${Mid.capitalizeName(user.name)} has left.`));
    }
  });
});

app.use(function(err, req, res, next) {
    if(401 == err.status) {
        res.render('users/login')
    }
});

app.use('/user', usersRouter);
app.use('/posts', postsRouter);
app.use('/inbox', mailRouter);
app.use('/upload', imageRouter);

server.listen(port, ()  => {
  console.log(`App listening on port ${port}`);
});
