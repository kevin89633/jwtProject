const { model } = require("mongoose");
const { rawListeners, emit } = require("../models/user-model");
const router = require("express").Router();
const registerValidation = require("../validation").registerValidation;
const loginValidation = require("../validation").loginValidation;
const courseValidation = require("../validation").courseValidation;
const User = require("../models").user;
const jwt = require("jsonwebtoken");

router.use((req, res, next) => {
  console.log("Auth request...");
  next();
});

// router.get("/testAPI", (req, res) => {
//   return res.send("成功連結auth route");
// });

router.post("/register", async (req, res) => {
  //console.log("User registeration...");
  //console.log(req.body);
  //檢查資料是否符合格式規範
  let { error } = registerValidation(req.body);
  //console.log(error);
  if (error) return res.status(400).send(error.details[0].message);

  //確認email是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist)
    return res.status(400).send("The mail has already been registed");

  //new User
  let { email, username, password, role } = req.body;
  let newUser = new User({
    email: email,
    username: username,
    password: password,
    role: role,
  });
  try {
    let savedUser = await newUser.save();
    return res.send({
      msg: "使用者成功儲存",
      savedUser,
    });
  } catch (e) {
    return res.status(500).send("Cannot save User...");
  }
});

router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  //確認信箱
  const foundUser = await User.findOne({ email: req.body.email });
  if (!foundUser) return res.status(401).send("Cannot find the user...");

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) return res.status(500).send(err);
    if (isMatch) {
      //製作json web token
      const tokenObject = { _id: foundUser._id, email: foundUser.email }; //要在jwt裡面放什麼
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET); //幫jwt簽名
      return res.send({
        message: "成功登入",
        token: "JWT " + token, //記得這邊"JWT"後面要加一個空格
        user: foundUser,
      });
    } else {
      return res.status(401).send("Password incorrect..");
    }
  });
});

module.exports = router;
