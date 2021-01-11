module.exports = (app, passport) => {
  const async = require("async");
  const moment = require("moment");
  const mongoose = require("mongoose");
  const crypto = require("crypto");
  const Key = require("../config/Key");
  const User = require("../models/User.js");
  const Util = require("../models/Util.js");
  const Send_message = "올바른 경로가 아닙니다.";
  const isLoggedIn = require("../config/login.js");
  app.all("*", async (req, res, next) => {
    try {
      res.set(
        "Content-Security-Policy",
        "default-src *; style-src 'self' http://* 'unsafe-inline'; script-src 'self' http://* 'unsafe-inline' 'unsafe-eval'"
      );
      //isLoggedIn.isLoggedIn();
      next();
    } catch (err) {
      console.log(err);
      res.send(
        '<script>alert("고객센터로 연락주세요");location.href="/"</script>'
      );
    }
  });

  app.get("/login", async (req, res) => {
    try {
      return res.render("login.pug");
    } catch (err) {
      console.log(err);
      return res.render("login.pug");
    }
  });
  app.get("/register", async (req, res) => {
    try {
      return res.render("register.pug");
    } catch (err) {
      console.log(err);
      return res.render("login.pug");
    }
  });
  app.post("/register", async (req, res) => {
    try {
      let chk_id = await User.info_admin.findOne({ iu_id: req.body.userId });
      if (chk_id) {
        return res.json("가입된 아이디입니다.");
      } else {
        let salt = Math.round(new Date().valueOf() * Math.random()) + "";
        let hashPassword = crypto
          .createHash("sha512")
          .update(req.body.userPassword + salt)
          .digest("hex");
        await User.info_admin({
          iu_id: req.body.userId,
          iu_password: hashPassword,
          iu_salt: salt,
          iu_status: 0, //0이면 대기 . 1 정상 2 정지 3 삭제
          iu_regDate: moment(),
          iu_loginCount: 0,
        }).save();
        return res.json("가입완료");
      }
      //res.render("register.pug");
    } catch (err) {
      console.log(err);
    }
  });

  app.post(
    "/login",
    passport.authenticate("login", {
      failureRedirect: "/login_false",
      failureFlash: true,
    }),
    async (req, res) => {
      try {
        return res.json("ok");
      } catch (err) {
        console.log(err);
        return res.json({
          type: 0,
          message: Send_message,
        });
      }
    }
  );

  app.get("/login_false", async (req, res) => {
    //넘어오는 값 구분해서 로그인 실패 json 쏴주기
    try {
      return res.json("아이디 및 비밀번호를 확인해주세요.");
    } catch (err) {
      console.log(err);
      return res.json({ type: 0, message: Send_message });
    }
  });
  app.get("/logout", async (req, res) => {
    try {
      req.logout();
      return res.json("ok");
    } catch (err) {
      console.log(err);
      res.send(
        '<script>alert("고객센터로 연락주세요");location.href="/"</script>'
      );
    }
  });
};
