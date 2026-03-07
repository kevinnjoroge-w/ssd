exports.up = async function (knex) {
    const exists = await knex.schema.hasColumn('payments', 'updated_at').catch(() => false);
    if (!exists) {
        await knex.schema.table('payments', table => {
            table.timestamp('updated_at')
        })
    }
}

exports.down = async function (knex) {
    const exists = await knex.schema.hasColumn('payments', 'updated_at').catch(() => false);
    if (exists) {
        await knex.schema.table('payments', table => {
            table.dropColumn('updated_at')
        })
    }
}
