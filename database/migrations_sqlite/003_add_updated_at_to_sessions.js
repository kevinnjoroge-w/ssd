exports.up = async function(knex) {
  // SQLite does not allow adding a column with a non-constant default via ALTER.
  // Add the nullable column, then populate existing rows from created_at.
  await knex.schema.table('sessions', table => {
    table.timestamp('updated_at')
  })

  // Set existing rows' updated_at to created_at where present
  await knex('sessions').whereNotNull('created_at').update({ updated_at: knex.raw("created_at") });
}

exports.down = async function(knex) {
  await knex.schema.table('sessions', table => {
    table.dropColumn('updated_at')
  })
}
