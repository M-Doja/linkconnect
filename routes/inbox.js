var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Msg = require('../models/message');
var Mid = require('../middleware');

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


// Read One Message
router.get('/read/:id',Mid.isLoggedIn, (req, res, next) => {
  var numUnRead = req.user.inbox.length - req.user.seen.length;
  var seenMail = {
    seen: true
  }
  Msg.findOneAndUpdate({'_id': req.params.id}, seenMail)
  .then(function(mail){
    User.findById({'_id': req.user.id}, function(err, user){
      if (mail.seen === false) {
        user.seen.push({'mailId':mail.id});
      }
      user.save(function(err){
        if (err) {
          console.log(err);
        }
      });
    });
    Msg.findOne({'_id': req.params.id}, function(err, mail){
      if (err) {
        console.log(err);
      }
      if (req.user.inbox.length === 0) {
        numUnRead = 0
      }
      res.render('inbox/message', {unread: 0, mail:mail, user: req.user, title: 'Link Connect'});
    })
  });
});

// Delete One Message
router.post('/remove/:id', Mid.isLoggedIn, (req, res, next) => {
  User.updateOne(req.user, {$pull: {inbox: {msgId :req.params.id }, seen: {mailId: req.params.id}}}, function(err, user) {
    if (err) {
      res.send(err);
    }
    Msg.findOneAndDelete({'_id': req.params.id},  function(err, doc) {
      if (err) {
        res.send(err)
      }
      res.redirect('/inbox/all');
    });
  });
});

// Reply To Message
router.post("/:id/reply", Mid.isLoggedIn, (req, res, next) => {
  const id = req.params.id;
  Msg.findById({'_id': id}, function(err, msg) {
    if (err) {
      console.log(err);
    }
    let sub;
    if (req.body.mailReplySubject) {
       sub = req.body.mailReplySubject
    }else {
       sub = "re: "+msg.subject
    }
    const replyMsg = new Msg({
      subject: sub,
      body: req.body.mailReply,
      date: new Date(),
      fromId: req.user.id,
      fromName: req.user.username,
      seen: false
    });
    User.findById({'_id': msg.fromId }, function(err, user) {
      if (err) {
        console.log(err);
      }
      replyMsg.toId =  user.id;
      replyMsg.toName = user.username;
      replyMsg.save(function(err){
        if (err) {
          console.log(err);
        }
        user.inbox.push({
          msgId: replyMsg.id,
        });
        user.save();
        User.findById({'_id': req.user.id}, function(err, curUser) {
          if (err) {
            console.log(err);
          }
          curUser.sent.push({
            msgId: replyMsg.id,
          });
          curUser.save();
        res.redirect('/inbox/all');
      });
     });
    }); //User
  }); //Message
});

module.exports = router;
