const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'development_jwt_secret_key_localvibe_2026';
};

/**
 * Generate a signed JWT for an authenticated user
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role || 'USER'
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
};

/**
 * Verify and decode a JWT string
 */
const verifyToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

module.exports = {
  generateToken,
  verifyToken
};
