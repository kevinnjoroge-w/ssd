exports.up = function (knex) {
    return knex.schema.table('users', (table) => {
        table.string('role').defaultTo('customer'); // 'customer' or 'admin'
    });
};

exports.down = function (knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('role');
    });
};
