
const jwt = require("jsonwebtoken");
const {
  jwtExpiration,
  jwtSecret,
  jwtRefreshExpiration,
  jwtRefreshSecret,
} = require("../config");

const createJWT = ({ payload }) => {
  const token = jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiration });
  return token;
};

const createRefreshJWT = ({ payload }) => {
  const token = jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: jwtRefreshExpiration,
  });
  return token;
};

const isTokenValid = ({ token }) => jwt.verify(token, jwtSecret);

const isRefreshTokenValid = ({ token }) => jwt.verify(token, jwtRefreshSecret);



module.exports = {
  createJWT,
  isTokenValid,
  createRefreshJWT,
  isRefreshTokenValid,
};