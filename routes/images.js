var config = require('../config');
var express = require('express');
var router = express.Router();
var User = require('../models/user');
var Post = require('../models/post');
var Mid = require('../middleware');
var cloudinary = require('cloudinary');
var multer= require('multer');
var storage = multer.diskStorage({
  filename: function(req, file, cb){
    cb(null, Date.now() + file.originalname);
  }
});
var imageFilter = function(req, file, cb){
  if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
    return cb(new Error('Only images files are allowed'), false);
  }
  cb(null, true);
}
var upload = multer({
  storage: storage,
  fileFilter: imageFilter
});

if (process.env.NODE_ENV === 'production') {
  cloudinary.config({
      cloud_name: process.env.Cloud_Name,
      api_key: process.env.Cloud_Api_Key,
      api_secret: process.env.Cloud_Api_Secret
  });
}else {
  cloudinary.config({
      cloud_name: config.Cloud_Name,
      api_key: config.Cloud_Api_Key,
      api_secret: config.Cloud_Api_Secret
  });
}

router.post('/avatar/new/:id', Mid.isLoggedIn, upload.single('image'),(req, res, next) => {
  cloudinary.uploader.upload(req.file.path, function(result) {
    req.body.image = result.secure_url;
    User.findById({'_id': req.params.id}, function(err, user){
      if (err) {
        res.send(err);
      }
      user.avatar = req.body.image;
      user.save(function(err, user){
        if (err) {
          res.send(err)
        }
        res.redirect(`/user/${user.username}/settings`);
      })
    })
  });
});

module.exports = router;
