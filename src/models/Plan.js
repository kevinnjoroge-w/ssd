const { Model } = require('objection');

class Plan extends Model {
  static get tableName() {
    return 'plans';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['coverage_type', 'min_premium', 'max_coverage'],
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        coverage_type: { type: 'string' }, // 'basic', 'standard', 'comprehensive'
        description: { type: 'string' },
        min_premium: { type: 'number' },
        max_premium: { type: 'number' },
        max_coverage: { type: 'number' },
        coverage_multiplier: { type: 'number', default: 500 },
        benefits: { type: 'object' },
        active: { type: 'boolean', default: true },
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      policies: {
        relation: Model.HasManyRelation,
        modelClass: require('./Policy'),
        join: {
          from: 'plans.id',
          to: 'policies.plan_id'
        }
      }
    };
  }
}

module.exports = Plan;
