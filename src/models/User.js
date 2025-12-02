const { Model } = require('objection');
const knex = require('../config/database');

Model.knex(knex);

class User extends Model {
  static get tableName() {
    return 'users';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['phone', 'name'],
      properties: {
        id: { type: 'string' },
        phone: { type: 'string', minLength: 10, maxLength: 13 },
        name: { type: 'string', minLength: 2, maxLength: 100 },
        email: { type: 'string' },
        occupation: { type: 'string' },
        income_range: { type: 'string' }, // 'low', 'medium', 'high'
        preferred_language: { type: 'string', default: 'en' }, // 'en' or 'sw'
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      sessions: {
        relation: Model.HasManyRelation,
        modelClass: require('./Session'),
        join: {
          from: 'users.id',
          to: 'sessions.user_id'
        }
      },
      payments: {
        relation: Model.HasManyRelation,
        modelClass: require('./Payment'),
        join: {
          from: 'users.id',
          to: 'payments.user_id'
        }
      },
      policies: {
        relation: Model.HasManyRelation,
        modelClass: require('./Policy'),
        join: {
          from: 'users.id',
          to: 'policies.user_id'
        }
      }
    };
  }
}

module.exports = User;
