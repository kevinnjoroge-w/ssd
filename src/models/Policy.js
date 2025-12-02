const { Model } = require('objection');

class Policy extends Model {
  static get tableName() {
    return 'policies';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['user_id', 'plan_id', 'premium', 'coverage_amount'],
      properties: {
        id: { type: 'string' },
        user_id: { type: 'string' },
        plan_id: { type: 'string' },
        policy_number: { type: 'string', unique: true },
        premium: { type: 'number', minimum: 50 },
        coverage_amount: { type: 'number' },
        status: { type: 'string' }, // active, inactive, expired, claimed
        start_date: { type: 'string', format: 'date' },
        end_date: { type: 'string', format: 'date' },
        auto_renew: { type: 'boolean', default: true },
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
          from: 'policies.user_id',
          to: 'users.id'
        }
      },
      plan: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./Plan'),
        join: {
          from: 'policies.plan_id',
          to: 'plans.id'
        }
      },
      payments: {
        relation: Model.HasManyRelation,
        modelClass: require('./Payment'),
        join: {
          from: 'policies.id',
          to: 'payments.policy_id'
        }
      }
    };
  }
}

module.exports = Policy;
