exports.up = async function (knex) {
    const tableExists = await knex.schema.hasTable('users');
    if (tableExists) {
        const hasPin = await knex.schema.hasColumn('users', 'pin');
        const hasRole = await knex.schema.hasColumn('users', 'role');
        const hasPassword = await knex.schema.hasColumn('users', 'password');

        await knex.schema.table('users', table => {
            if (!hasPin) {
                table.string('pin', 4);
            }
            if (!hasRole) {
                table.string('role').defaultTo('customer');
            }
            if (!hasPassword) {
                table.string('password');
            }
        });
    }
};

exports.down = async function (knex) {
    const tableExists = await knex.schema.hasTable('users');
    if (tableExists) {
        await knex.schema.table('users', table => {
            table.dropColumn('pin');
            table.dropColumn('role');
            table.dropColumn('password');
        });
    }
};
