const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded.user; // ✅ FIXED: Use decoded.user instead of decoded
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = auth;