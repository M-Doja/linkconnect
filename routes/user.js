var express = require('express');
var router = express.Router();
var Mid = require('../middleware');
var User = require('../models/user');
var Post = require('../models/post');
var Message = require('../models/message');


/* @ GET Home Page */
router.get('/home', Mid.isLoggedIn, function(req, res, next) {
  var numUnRead = req.user.inbox.length - req.user.seen.length;
  res.render('users/home', {title: 'Link Connect', user: req.user, unread: numUnRead});
});

// Show All Messgaes
router.get('/all', Mid.isLoggedIn, (req, res, next) => {
  var numUnRead = req.user.inbox.length - req.user.seen.length;
  Msg.find({'toId': req.user.id}, function(err, allMessages) {
    if (err) {
      console.log(err);
    }
     allMessages.sort(function(a,b){
      return new Date(b.date) - new Date(a.date);
    });
    res.render('inbox/allMail',{unread: numUnRead, title: 'Link Connect', user:req.user,  inbox: allMessages})
  });
});

// POST New Message
router.post('/:username/new/message', Mid.isLoggedIn, (req, res, next) => {
  User.findOne({'username': req.params.username}, function(err, user){
    if (err) {
      console.log( err);
    }
    const newMsg = new Message({
      subject: req.body.mailSubject,
      body: req.body.mailBody,
      date: new Date(),
      toId: user.id,
      toName:user.username,
      fromId: req.user.id,
      fromName: req.user.username,
      seen: false
    });
    newMsg.save(function(err){
      if (err) {
        console.log(err);
      }
      var msgObj = {
        msgId: newMsg.id,
      }
      user.inbox.push(msgObj);
      user.save();
        res.redirect('/user/community/all');
    });
  });
});

/* GET Profile Page */
router.get('/:username', Mid.isLoggedIn, function(req, res, next) {
  User.find({}, function(err, allUsers) {
    if (err) {
      res.send(err);
    }
    Post.find({}, function(err, allPosts){
      if (err) {
        res.send(err)
      }
      var user;
      var iFollowYou;
      var numUnRead = req.user.inbox.length - req.user.seen.length;
      for (var i = 0; i < allUsers.length; i++) {
        if (allUsers[i].username === req.params.username) {
          user = allUsers[i];
          if (req.user.id !== user.id) {
            numUnRead = 0
          }
          req.user.following.forEach((followedUser) => {
            if (followedUser.id) {
              if (followedUser.id === user.id) {
                iFollowYou = true;
                return iFollowYou;
              }
            }
          });
          res.render('users/profile', {
            title: 'Link Connect',
            currentUser: req.user,
            user: user,
            allUsers: allUsers,
            unread: numUnRead,
            entry: allPosts,
            isFollowing: iFollowYou
          });
        }
      }
    });
  });
});

/* GET Profile Settings Page */
router.get('/:username/settings', Mid.isLoggedIn, function(req, res, next) {
  res.render('users/settings', {title: 'Link Connect', user: req.user});
});

/* GET Community Page */
router.get('/community/all', Mid.isLoggedIn, function(req, res, next) {
  User.find({}, function(err, allUsers){
    if (err) {
      res.send(err)
    }
    var numUnRead = req.user.inbox.length - req.user.seen.length;

    res.render('users/community', {
      title: 'Link Connect',
      user: req.user,
      users: allUsers,
      unread: numUnRead,
      errMsg: ''
    });
  })
});

/* Post Find Community Member */
router.post('/community/member', Mid.isLoggedIn, function(req, res, next) {
  const reqSearch = req.body.search;
  User.find({'username': req.body.search.toLowerCase()}, function(err, user){
    if (err) {
      return res.redirect('/user/community/all');
    }
    if (user[0] === undefined ) {
      return res.render('users/community', {
        unread:numUnRead,
        title: 'Link Connect',
        users: user,
        user : req.user,
        errMsg:'Sorry no user found by that name'
      })
    }else {
      var numUnRead = req.user.inbox.length - req.user.seen.length;
      return res.render('users/community', {
        unread:numUnRead,
        title: 'Link Connect',
        users: user,
        user : req.user,
        errMsg:''
      })
    }

  })
});

/* Post Add User to Follow */
router.post('/add/follow/:id', Mid.isLoggedIn, (req, res, next) => {
  User.findById({'_id': req.params.id}, function(err, userFollowed){
    User.findById({'_id': req.user.id}, function(err, follower){
      if (err) {
        console.log(err);
      }
      let alreadyFollowing;
      follower.following.forEach((followedUser) => {
        if (req.params.id === followedUser.id) {
          alreadyFollowing = true;
          return alreadyFollowing
        }
      });
      if (!alreadyFollowing) {
        follower.following.push({
          id: req.params.id,
          name: userFollowed.username,
          pic: userFollowed.avatar
        });
      }
      follower.save(function(err){
        if (err) {
          console.log(err);
        }
      });
    });

    let alreadyAFollower;
    url = userFollowed.username;
    userFollowed.followers.forEach((followingUser) => {
      if (req.user.id === followingUser.id) {
        alreadyAFollower = true;
        return alreadyAFollower
      }
    });

    if (!alreadyAFollower) {
      userFollowed.followers.push({
        id: req.user.id,
        name: req.user.username,
        pic: req.user.avatar
      });
    }

    userFollowed.save(function(err){
      if (err) {
        console.log(err);
      }
    });
    var numUnRead = req.user.inbox.length - req.user.seen.length;

   res.render('users/profile', {unread:numUnRead, isFollowing: 'iFollowYou', currentUser : req.user, user : userFollowed, entry:[], text: "Welcome back to your page",title: 'Link Connect', msg: [], docs: '', profile: ''});
 });
});

/*  Post Remove Followed User */
router.post('/remove/follower/:id', Mid.isLoggedIn, (req, res, next) => {
  User.updateOne(req.user, {$pull: {following: {id :req.params.id }}}, function(err) {
    if (err) {
      res.send(err);
    }
    User.findById({'_id': req.params.id}, function(err, user) {
      if (err) {
        res.send(err);
      }
      User.updateOne(user, {$pull: {followers: {id : req.user.id }}}, function(err) {
        if (err) {
          res.send(err);
        }
      });
      res.redirect(`/user/${user.username}`)
    });
  });
});



module.exports = router;
