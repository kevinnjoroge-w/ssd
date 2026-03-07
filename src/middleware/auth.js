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
      // If role is already in the token, we can use it directly
      if (req.user && req.user.role === 'admin') {
        return next();
      }

      const User = require('../models/User');
      const user = await User.query().findById(req.user.userId);

      if (!user || user.role !== 'admin') {
        return res.status(403).json({
          error: 'Access denied. Admin privileges required.'
        });
      }

      // Cache role in req.user for subsequent middleware
      req.user.role = user.role;
      next();
    } catch (error) {
      console.error('Admin verification error:', error);
      res.status(500).json({ error: 'Failed to verify admin status' });
    }
  }

  /**
   * Authorize user to access their own data or allow admin
   */
  static authorizeUser(req, res, next) {
    try {
      const { userId } = req.params;
      const bodyUserId = req.body.userId;
      const authenticatedUserId = req.user.userId;
      const isAdmin = req.user.role === 'admin';

      // Check if the user is accessing their own data or is an admin
      const isOwner = (userId && userId === authenticatedUserId) ||
        (bodyUserId && bodyUserId === authenticatedUserId);

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          error: 'Access denied. You can only access your own data.'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({ error: 'Authorization check failed' });
    }
  }

  /**
   * Generate JWT token
   */
  static generateToken(userId, role = 'user') {
    return jwt.sign(
      { userId, role },
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
