exports.up = function(knex) {
  return knex.schema.table('sessions', (table) => {
    table.string('operator').defaultTo('Unknown')
  })
}

exports.down = function(knex) {
  return knex.schema.table('sessions', (table) => {
    table.dropColumn('operator')
  })
}
