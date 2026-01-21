exports.up = async function(knex) {
  await knex.schema.table('sessions', table => {
    table.string('operator').defaultTo('Unknown')
  })
}

exports.down = async function(knex) {
  await knex.schema.table('sessions', table => {
    table.dropColumn('operator')
  })
}
