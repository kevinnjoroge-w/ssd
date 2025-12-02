const { Model } = require('objection');

class Payment extends Model {
  static get tableName() {
    return 'payments';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'amount', 'status'],
      properties: {
        id: { type: 'string' },
        user_id: { type: 'string' },
        policy_id: { type: 'string' },
        amount: { type: 'number', minimum: 0 },
        currency: { type: 'string', default: 'KES' },
        payment_method: { type: 'string' }, // 'mpesa', 'bank_transfer'
        status: { type: 'string' }, // 'pending', 'completed', 'failed'
        transaction_id: { type: 'string' },
        mpesa_receipt: { type: 'string' },
        mpesa_phone: { type: 'string' },
        period: { type: 'string' }, // monthly, quarterly, yearly
        due_date: { type: 'string', format: 'date' },
        paid_date: { type: 'string', format: 'date-time' },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'payments.user_id',
          to: 'users.id'
        }
      },
      policy: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./Policy'),
        join: {
          from: 'payments.policy_id',
          to: 'policies.id'
        }
      }
    };
  }
}

module.exports = Payment;
