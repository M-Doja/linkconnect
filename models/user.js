var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');

var userSchema = new mongoose.Schema({
  username: String,
  password: String,
  balance: Number,
  avatar: String,
  payMember: false,
  status: String,
  joined: Date,
  followers: [],
  following: [],
  posts : [],
  inbox: [],
  seen: [],
  sent: []
});

mongoose.plugin(schema => { schema.options.usePushEach = true });

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
