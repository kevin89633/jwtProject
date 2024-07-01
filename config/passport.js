let JwtStrategy = require("passport-jwt").Strategy;
let ExtractJwt = require("passport-jwt").ExtractJwt; //負責拉出jwt中需要的部分
const User = require("../models").user;

module.exports = (passport) => {
  let opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
  opts.secretOrKey = process.env.PASSPORT_SECRET;

  passport.use(
    new JwtStrategy(opts, async function (jwt_payload, done) {
      //console.log(jwt_payload); //看看jwt_payload裡面是什麼
      try {
        let foundUser = await User.findOne({ _id: jwt_payload._id }).exec();
        if (foundUser) {
          done(null, foundUser); //把req.user的值設為foundUser
        } else {
          done(null, false);
        }
      } catch (e) {
        return done(e, false);
      }
    })
  );
};
