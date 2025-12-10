const {
  createJWT,
  isTokenValid,
  createRefreshJWT,
  isRefreshTokenValid,
} = require("./jwt");
const {
  createTokenUser,
  attachCookiesToResponse
} = require("./createTokenUser");

module.exports = {
  createJWT,
  isTokenValid,
  createRefreshToken: createRefreshJWT,
  isRefreshTokenValid,
  createTokenUser,
  attachCookiesToResponse
};