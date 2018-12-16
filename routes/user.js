var express = require('express');
var router = express.Router();
var Mid = require('../middleware');
var User = require('../models/user');
var Post = require('../models/post');
var Message = require('../models/message');



/* @ GET Home Page */
router.get('/home', Mid.isLoggedIn, function(req, res, next) {
  var numUnRead = req.user.inbox.length - req.user.seen.length;
  var userName = Mid.capitalizeName(req.user.username);
  res.render('users/home', {title: 'Red Raven Social', name: userName, user: req.user, unread: numUnRead});
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
    res.render('inbox/allMail',{unread: numUnRead, title: 'Red Raven Social', user:req.user,  inbox: allMessages})
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
  User.findOne({'username': req.params.username}, function(err, userWithProfile) {
    if (err) {
      res.send(err);
    }
    var iFollowYou, user;
    req.user.following.forEach((followedUser) => {
      if (followedUser.id) {
        if (followedUser.id === userWithProfile.id) {
          iFollowYou = true;
          return iFollowYou;
        }
      }
    });

    if (userWithProfile.username === req.user.username) { // Seeing Own Profile
      Post.find({'author': userWithProfile.username}, function(err, usersOwnPosts) {
        if (err) {
          res.send(err);
        }
        for (var i = 0; i < usersOwnPosts.length; i++) {
          usersOwnPosts[i].postName = Mid.capSentence(usersOwnPosts[i].postName);
        }

        var name = Mid.capitalizeName(userWithProfile.username)
        var numUnRead = req.user.inbox.length - req.user.seen.length;
        User.find({}, function(err, allUsers){
          if (err) {
            res.send(err);
          }
          res.render('users/profile', {
            title: 'Red Raven Social',
            currentUser: req.user,
            user: userWithProfile,
            allUsers: allUsers,
            unread: numUnRead,
            name: name,
            isFollowing: iFollowYou
          });
        });
      });
    }else { // Seeing Another Users Profile
      var name = Mid.capitalizeName(userWithProfile.username)
      var numUnRead = req.user.inbox.length - req.user.seen.length;
      User.find({}, function(err, allUsers){
        if (err) {
          res.send(err);
        }
        res.render('users/profile', {
          title: 'Red Raven Social',
          currentUser: req.user,
          user: userWithProfile,
          allUsers: allUsers,
          unread: numUnRead,
          name: name,
          isFollowing: iFollowYou
        });
      });
    }
  });
});

/* GET Profile Settings Page */
router.get('/:username/settings', Mid.isLoggedIn, function(req, res, next) {
  var numUnRead = req.user.inbox.length - req.user.seen.length;
  res.render('users/settings', {title: 'Red Raven Social', user: req.user, unread:numUnRead});
});


/* GET Community Page */
router.get('/community/all', Mid.isLoggedIn, function(req, res, next) {
  User.find({}, function(err, allUsers){
    if (err) {
      res.send(err)
    }


    function capitalizeName(){
      for (var i = 0; i < allUsers.length; i++) {
        var nm = allUsers[i].username;
        nm = nm.split('');
        if (nm.length > 1) {
          var first = nm[0].charAt(0).toUpperCase() + nm[0].slice(1).toLowerCase();
          var last = nm[1].charAt(0).toUpperCase() + nm[1].slice(1).toLowerCase();
          return nm = first +' '+ last;
        }else {
          return nm =  nm[0].charAt(0).toUpperCase() + nm[0].slice(1).toLowerCase();
        }
      }
    }

    var numUnRead = req.user.inbox.length - req.user.seen.length;

    res.render('users/community', {
      title: 'Red Raven Social',
      user: req.user,
      users: allUsers,
      unread: numUnRead,
      errMsg: ''
    });
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
        console.log('followedUser', followedUser);
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

   res.render('users/profile', {unread:numUnRead, isFollowing: 'iFollowYou', currentUser : req.user, user : userFollowed, entry:[], text: "Welcome back to your page",title: 'Red Raven Social', msg: [], docs: '', profile: ''});
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


router.post('/:username/acct_cancel', (req, res, next) => {
  User.findOneAndDelete({'username': req.params.username},  function(err, doc) {
    if (err) {
      res.send(err)
    }
    res.redirect('/');
  });
});


module.exports = router;
