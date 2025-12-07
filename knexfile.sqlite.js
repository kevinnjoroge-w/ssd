const path = require('path')

module.exports = {
  development: {
    client: 'sqlite3',
    connection: {
      filename: path.resolve(__dirname, 'database', 'insurance_sqlite.db')
    },
    useNullAsDefault: true,
    migrations: {
      directory: path.resolve(__dirname, 'database', 'migrations_sqlite')
    },
    seeds: {
      directory: path.resolve(__dirname, 'database', 'seeds_sqlite')
    }
  }
}
