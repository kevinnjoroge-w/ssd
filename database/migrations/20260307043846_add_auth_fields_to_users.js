/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
    return knex.schema.table('users', (table) => {
        table.string('pin', 4); // For USSD
        table.string('password'); // For Web
    });
};

exports.down = function (knex) {
    return knex.schema.table('users', (table) => {
        table.dropColumn('pin');
        table.dropColumn('password');
    });
};
