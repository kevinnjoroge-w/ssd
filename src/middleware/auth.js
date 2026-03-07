const jwt = require('jsonwebtoken');

class AuthMiddleware {
  /**
   * Verify JWT token
   */
  static verify(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          error: 'No authorization token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({
        error: 'Invalid or expired token'
      });
    }
  }

  /**
   * Verify Admin role
   */
  static async isAdmin(req, res, next) {
    try {
      const User = require('../models/User');
      const user = await User.query().findById(req.user.userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied. Admin privileges required.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify admin status' });
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );
  }

  /**
   * Decode token without verification (for debugging)
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthMiddleware;
