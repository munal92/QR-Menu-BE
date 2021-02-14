const bcryptjs = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const secret = require("../config/secret.js");

const UserDB = require("../models/userModel-db.js");
const { isValid } = require("../config/user-service.js");

// @POSTREQ Create a new user
router.post("/signup", (req, res) => {
  const userInfo = req.body;
  console.log(userInfo);
  if (isValid(userInfo)) {
    const rounds = process.env.BCRYPT_ROUNDS || 8;
    const hash = bcryptjs.hashSync(userInfo.password, rounds);
    userInfo.password = hash;
    const new_user = new UserDB({
      name: userInfo.name,
      email: userInfo.email,
      password: userInfo.password,
    });
    new_user
      .save()
      .then((data) => {
        res.status(200).json(data);
      })
      .catch((err) => {
        res
          .status(500)
          .json({ message: "Server Error Try Again Later", error: err });
      });
  } else {
    res.status(404).json({
      message: "Please provide username and password ",
    });
  }
});

router.post("/signin", (req, res) => {
  const userInfo = req.body;
  if (isValid(userInfo)) {
    try {
      UserDB.findOne({ email: userInfo.email }, (err, user_data) => {
        if (err) {
          console.error(err);
        } else {
          if (
            (userInfo &&
              bcryptjs.compareSync(userInfo.password, user_data.password)) ||
            userInfo.password === user_data.password
          ) {
            //console.log("u",u , "\nuserInfo", userInfo)
            const token = generateToken(user_data);
            res.status(200).json({ message: "Login Successful", token });
          } else {
            res.status(401).json({ message: "Invalid credentials" });
          }
        }
      });
    } catch (err) {
      res.status(500).json({ errorMessage: "server Error", err });
    }
  } else {
    res.status(404).json({
      message: "please provide username and password ",
    });
  }
});

function generateToken(user) {
  const payload = {
    subject: user._id,
    name: user.name,
    email: user.email,
  };

  const options = {
    expiresIn: "1h",
  };

  return jwt.sign(payload, secret.jwtSecret, options);
}

module.exports = router;
