exports.up = async function(knex) {
  const exists = await knex.schema.hasColumn('payments', 'checkout_request_id').catch(()=>false);
  if (!exists) {
    await knex.schema.table('payments', table => {
      table.string('checkout_request_id')
      table.string('merchant_request_id')
    })
  }
}

exports.down = async function(knex) {
  const exists = await knex.schema.hasColumn('payments', 'checkout_request_id').catch(()=>false);
  if (exists) {
    await knex.schema.table('payments', table => {
      table.dropColumn('checkout_request_id')
      table.dropColumn('merchant_request_id')
    })
  }
}
