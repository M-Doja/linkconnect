var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/user');
var Post = require('../models/post');
var Mid = require('../middleware');

/* Get Post Add Page */
router.get('/new', Mid.isLoggedIn, function(req, res, next) {
  res.render('posts/newPost', {user: req.user,title: 'Link Connect'});
});

/* Get Posts Page */
router.get('/all', Mid.isLoggedIn, (req, res) => {
  Post.find({}, function(err, allPosts){
    if (err) {
      res.send(err);
    }
    var numUnRead = req.user.inbox.length - req.user.seen.length;
  res.render('posts/allPosts', {user: req.user,title: 'Link Connect',unread: numUnRead,entry: allPosts});
  });
});

/* Post Add New Post */
router.post('/new', Mid.isLoggedIn, function(req, res, next) {
  var post = new Post({
    subject: req.body.subject,
    body: req.body.body,
    date: new Date().toLocaleDateString(),
    time: new Date().getTime(),
    authorId: req.user.id,
    author: req.user.username
  });
  User.findById({'_id': req.user.id}, function(err, user){
    if (err) {
      return res.send(err);
    }
    // ONLY 3 POSTS ALLOWED
    if (user.posts.length < 3) {

      post.save(function(err, post){
        if (err) {
          return res.send(err);
        }

        user.posts.push({
          postId: post.id,
          postDate: post.date.getDate()
        });
        user.save(function(err){
          if (err) {
            return console.log(err);
          }
        });
        res.redirect('/posts/all');

      }); // End of Entry Save fn
    }else {
      res.redirect('/user/home');
    }
  });
  // res.render('posts/allPosts', {user: req.user,title: 'Link Connect'});
});

/* Get Single Post */
router.get('/:id', Mid.isLoggedIn, function(req, res, next) {
  Post.find({'_id': req.params.id}, function(err, post){
    if (err) {
      res.send(err)
    }
    var numUnRead = req.user.inbox.length - req.user.seen.length;
    res.render('posts/post', { user: req.user, currentUser:req.user, entry:post,unread: numUnRead, title: 'Link Connect'});
  })
});

/* Post Update Post */
router.post('/update/:id', Mid.isLoggedIn, function(req, res, next){
  Post.find({'_id': req.params.id},  function(err, ent){
    if (err) {
      res.send(err);
    }
    res.render('posts/updatePost', {user: req.user, title: 'Link Connect', ent: ent });
  });
});

/* Post Save Updated Post */
router.post('/save/:id', Mid.isLoggedIn, function(req, res, next){
  var updatePost = {
    subject: req.body.subjectUpdate,
    body: req.body.bodyUpdate
  };
  Post.findOneAndUpdate({'_id': req.params.id}, updatePost)
  .then(function(post){
    Post.findOne({'_id': req.params.id})
    .then(function(newEntry){
      res.redirect(`/posts/${newEntry.id}`)
    })
  });
});

/* Post Delete Post By Id */
router.post('/delete/:id', Mid.isLoggedIn, function(req, res, next){
  User.updateOne(req.user, {$pull: {posts: {postId :req.params.id }}}, function(err, user) {
    if (err) {
      console.log(err);
    }
    Post.findOneAndDelete({'_id': req.params.id},  function(err, doc) {
      if (err) {
        res.send(err)
      }
      res.redirect('/posts/all');
    });
  });
});

/* Post Upvote Post */
router.post('/:id/vote/up', Mid.isLoggedIn, function(req, res, next){
  var voteDn, voteUp;

  Post.findById({'_id': req.params.id}, function(err, singleEntry) {
    for (var i = 0; i < singleEntry.upvotes.length; i++) {
      if (req.user.id === singleEntry.upvotes[i].voterId) {
        console.log('You Already Voted Up');
        voteUp = true;
      }
    }

    for (var i = 0; i < singleEntry.downvotes.length; i++) {
      if (req.user.id === singleEntry.downvotes[i].voterId) {
        console.log('You Already Voted Down');
        voteDn = true;
      }
    }
    if (voteDn) {
      Post.updateOne(singleEntry, {$pull: {downvotes: {voterId: req.user.id}}}, (err, result) => {
        // console.log("result: ", result);
      });
    }
    if (!voteUp) {
      singleEntry.upvotes.push({
        voterId: req.user.id
      });
    }

    singleEntry.save(function(err){
      console.log('Voted Up');
    });
    res.redirect(`/posts/${req.params.id}`);

  });
});

/* Post Downvote Post */
router.post('/:id/vote/down', Mid.isLoggedIn, function(req, res, next){
  var voteUp, voteDn;
  Post.findById({'_id': req.params.id}, function(err, singleEntry){
    for (var i = 0; i < singleEntry.upvotes.length; i++) {
      if (req.user.id === singleEntry.upvotes[i].voterId) {
        console.log('You Already Voted Up');
        voteUp = true;
      }
    }

    for (var i = 0; i < singleEntry.downvotes.length; i++) {
      if (req.user.id === singleEntry.downvotes[i].voterId) {
        console.log('You Already Voted Down');
        voteDn = true;
      }
    }

    if (voteUp) {
      Post.updateOne(singleEntry, {$pull: {upvotes: {voterId: req.user.id}}}, (err, result) => {
        // console.log("result: ", result);
      });
    }
    if (!voteDn) {
      singleEntry.downvotes.push({
        voterId: req.user.id
      });
    }

    singleEntry.save(function(err){
      console.log('Voted Down');
    });
    res.redirect(`/posts/${req.params.id}`);
  })
});

module.exports = router;
