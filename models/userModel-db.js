const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
  name: {
    type: String,
    // required: true,
  },
  email: {
    type: String,
    // required: true,
  },
  password: {
    type: String,
    // required: true,
  },

  fileLink: {
    type: String,
    default: "NONE",
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("docs", UserSchema);
