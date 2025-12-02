const { Model } = require('objection');

class Session extends Model {
  static get tableName() {
    return 'sessions';
  }

  static get jsonSchema() {
    return {
      type: 'object',
      required: ['session_id', 'phone'],
      properties: {
        id: { type: 'string' },
        session_id: { type: 'string', unique: true },
        user_id: { type: 'string' },
        phone: { type: 'string' },
        current_menu: { type: 'string' }, // menu state identifier
        user_input: { type: 'string' }, // last user input
        session_data: { type: 'object' }, // stores temp data
        language: { type: 'string', default: 'en' },
        status: { type: 'string', default: 'active' }, // active, ended
        created_at: { type: 'string', format: 'date-time' },
        updated_at: { type: 'string', format: 'date-time' },
        expires_at: { type: 'string', format: 'date-time' }
      }
    };
  }

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: require('./User'),
        join: {
          from: 'sessions.user_id',
          to: 'users.id'
        }
      }
    };
  }
}

module.exports = Session;
