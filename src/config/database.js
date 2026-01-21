const knex = require('knex');
const environment = process.env.NODE_ENV || 'development';

// Use SQLite for development/test by default (no PostgreSQL required)
let knexConfig;
try {
  const sqliteKnexfile = require('../../knexfile.sqlite');
  knexConfig = sqliteKnexfile[environment] || sqliteKnexfile.development;
} catch (e) {
  // Fallback to PostgreSQL if SQLite config is not available
  const knexfile = require('../../knexfile');
  knexConfig = knexfile[environment] || knexfile.development;

  }

const db = knex(knexConfig);

module.exports = db;
