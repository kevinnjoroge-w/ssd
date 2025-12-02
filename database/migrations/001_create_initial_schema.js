exports.up = function(knex) {
  return knex.schema
    // Users table
    .createTable('users', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('phone').notNullable().unique();
      table.string('name').notNullable();
      table.string('email').unique();
      table.string('occupation');
      table.enum('income_range', ['low', 'medium', 'high']);
      table.enum('preferred_language', ['en', 'sw']).defaultTo('en');
      table.timestamps(true, true);
      table.index('phone');
    })
    // Plans table
    .createTable('plans', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name').notNullable();
      table.enum('coverage_type', ['basic', 'standard', 'comprehensive']).notNullable();
      table.text('description');
      table.decimal('min_premium', 10, 2).notNullable();
      table.decimal('max_premium', 10, 2);
      table.decimal('max_coverage', 12, 2).notNullable();
      table.decimal('coverage_multiplier', 10, 2).defaultTo(500);
      table.json('benefits');
      table.boolean('active').defaultTo(true);
      table.timestamps(true, true);
      table.index('coverage_type');
    })
    // Policies table
    .createTable('policies', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.uuid('plan_id').notNullable();
      table.string('policy_number').notNullable().unique();
      table.decimal('premium', 10, 2).notNullable();
      table.decimal('coverage_amount', 12, 2).notNullable();
      table.enum('status', ['active', 'inactive', 'expired', 'claimed']).defaultTo('active');
      table.date('start_date');
      table.date('end_date');
      table.boolean('auto_renew').defaultTo(true);
      table.timestamps(true, true);
      
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('plan_id').references('plans.id').onDelete('RESTRICT');
      table.index(['user_id', 'status']);
    })
    // Sessions table
    .createTable('sessions', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('session_id').notNullable().unique();
      table.uuid('user_id');
      table.string('phone').notNullable();
      table.string('current_menu').defaultTo('main');
      table.string('user_input');
      table.json('session_data');
      table.enum('language', ['en', 'sw']).defaultTo('en');
      table.enum('status', ['active', 'ended']).defaultTo('active');
      table.timestamp('expires_at');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('users.id').onDelete('SET NULL');
      table.index(['session_id', 'phone']);
      table.index('expires_at');
    })
    // Payments table
    .createTable('payments', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.uuid('user_id').notNullable();
      table.uuid('policy_id');
      table.decimal('amount', 10, 2).notNullable();
      table.string('currency').defaultTo('KES');
      table.enum('payment_method', ['mpesa', 'bank_transfer']).notNullable();
      table.enum('status', ['pending', 'completed', 'failed']).defaultTo('pending');
      table.string('transaction_id').unique();
      table.string('mpesa_receipt');
      table.string('mpesa_phone');
      table.enum('period', ['monthly', 'quarterly', 'yearly']).defaultTo('monthly');
      table.date('due_date');
      table.timestamp('paid_date');
      table.timestamps(true, true);
      
      table.foreign('user_id').references('users.id').onDelete('CASCADE');
      table.foreign('policy_id').references('policies.id').onDelete('SET NULL');
      table.index(['user_id', 'status']);
      table.index('transaction_id');
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('payments')
    .dropTableIfExists('sessions')
    .dropTableIfExists('policies')
    .dropTableIfExists('plans')
    .dropTableIfExists('users');
};
