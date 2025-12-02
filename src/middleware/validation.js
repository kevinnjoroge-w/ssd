const Joi = require('joi');

class ValidationMiddleware {
  /**
   * Validate USSD request
   */
  static validateUSSDRequest(req, res, next) {
    const schema = Joi.object({
      sessionId: Joi.string().required(),
      phoneNumber: Joi.string().pattern(/^(\+254|0)[0-9]{9}$/).required(),
      text: Joi.string().allow('').optional()
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid USSD request',
        details: error.details[0].message
      });
    }

    next();
  }

  /**
   * Validate payment request
   */
  static validatePaymentRequest(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().uuid().required(),
      policyId: Joi.string().uuid().optional(),
      amount: Joi.number().positive().required(),
      phoneNumber: Joi.string().pattern(/^(\+254|0)[0-9]{9}$/).required(),
      description: Joi.string().optional()
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid payment request',
        details: error.details[0].message
      });
    }

    next();
  }

  /**
   * Validate user registration
   */
  static validateUserRegistration(req, res, next) {
    const schema = Joi.object({
      phoneNumber: Joi.string().pattern(/^(\+254|0)[0-9]{9}$/).required(),
      name: Joi.string().min(2).max(100).required(),
      occupation: Joi.string().optional(),
      incomeRange: Joi.string().valid('low', 'medium', 'high').optional()
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid registration data',
        details: error.details[0].message
      });
    }

    next();
  }

  /**
   * Validate policy creation
   */
  static validatePolicyCreation(req, res, next) {
    const schema = Joi.object({
      userId: Joi.string().uuid().required(),
      planId: Joi.string().uuid().required(),
      premium: Joi.number().positive().required()
    });

    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        error: 'Invalid policy data',
        details: error.details[0].message
      });
    }

    next();
  }
}

module.exports = ValidationMiddleware;
