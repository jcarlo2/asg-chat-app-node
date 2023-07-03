const express = require("express");
const router = express.Router();
const userController = require("../controller/UserController");
const { check } = require("express-validator");
const User = require("../database/model/User");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const SECRET_KEY = "asg-chat-app";

router.get("/init", (req, res) => {
  const jwtCookie = req.cookies.jwt;
  const username = req.cookies.auth_username;
  const decoded = jwt.verify(jwtCookie, SECRET_KEY);
  if(!jwtCookie || !username) return res.json({ isVerified: false });
  if (decoded.username !== username || Date.now() >= decoded.exp * 1000) {
    return res.json({ isVerified: false });
  }
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  return res.json({ isVerified: true });
});

router.post(
  "/register",
  [
    check("username")
      .notEmpty()
      .withMessage("Username is required")
      .bail()
      .custom(async (value) => {
        const user = await User.findOne({ where: { username: value } });
        if (user) {
          throw new Error("Username already exists");
        }
        return true;
      }),
    check("email")
      .notEmpty()
      .withMessage("Email is required")
      .bail()
      .isEmail()
      .withMessage("Invalid email format")
      .bail()
      .custom(async (value) => {
        const user = await User.findOne({ where: { email: value } });
        if (user) {
          throw new Error("Email already exists");
        }
        return true;
      }),
    check("password")
      .notEmpty()
      .withMessage("Password is required")
      .bail()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long")
      .bail()
      .custom((value, { req }) => {
        if (value !== req.body.password_confirmation) {
          throw new Error("Confirm password does not match");
        }
        return true;
      }),
    check("password_confirmation")
      .notEmpty()
      .withMessage("Confirm password is required"),
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("gender").notEmpty().withMessage("Gender is required"),
    check("birthdate")
      .notEmpty()
      .withMessage("Birthdate is required")
      .bail()
      .isDate()
      .withMessage("Invalid date format"),
  ],
  userController.store
);
router.post(
  "/verify",
  [
    check("username").notEmpty(),
    check("password")
      .notEmpty()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  userController.verify
);

module.exports = router;
