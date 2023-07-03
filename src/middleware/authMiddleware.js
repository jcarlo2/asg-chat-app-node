const SECRET_KEY = "asg-chat-app";

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const jwtToken = req.cookies.jwt;
  const username = req.cookies.auth_username;

  if (!jwtToken || !username)
    return res.status(403).send("Authentication failed");

  try {
    const decoded = jwt.verify(jwtToken, SECRET_KEY);
    if (decoded.username !== username)
      return res.status(403).send("Invalid token");

    next();
  } catch (error) {
    console.log(error);
    return res.status(403).send("Forbidden 123");
  }
};

module.exports = authMiddleware;
