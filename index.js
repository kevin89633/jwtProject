const express = require("express");
const app = express();
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const authRoute = require("./routes").auth;
const courseRoute = require("./routes").course;
const passport = require("passport");
require("./config/passport")(passport);

mongoose
  .connect("mongodb://localhost:27017/mernDB")
  .then(() => {
    console.log("connecting to MongoDB");
  })
  .catch((e) => {
    console.log(e);
  });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/user", authRoute);

//只有登入系統的人才能夠去新增課程或註冊課程 > 代表他們都一定會有jwt
//如果request header內部沒有jwt, 則request就會被視為是unauthorized
app.use(
  "/api/courses",
  passport.authenticate("jwt", { session: false }),
  courseRoute
);

app.listen(8080, () => {
  console.log("Server is running at port 8080...");
});
