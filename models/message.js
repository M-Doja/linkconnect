const mongoose = require('mongoose');
const User = require('./user');
const messageSchema = new mongoose.Schema({
  subject: String,
  body: String,
  date: Date,
  seen: false,
  toId: String,
  toName: String,
  fromId: String,
  fromName: String
});

module.exports = mongoose.model('Message', messageSchema);
