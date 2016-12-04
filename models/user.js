var mongoose = require('mongoose');

var user = {
    name: { type: String, required: true },
    email: { type: String, required: true},
    picture: { type: String },
    oauth: { type: String, required: true },
    deviceId: { type: String }
};

var userSchema = new mongoose.Schema(user);

userSchema.index({ email: 1 }, { unique: true });

module.exports = userSchema;
module.exports.userSchema = userSchema;