exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('id').primary();
    table.string('username', 30).notNullable().unique();
    table.string('email', 255).notNullable().unique();
    table.text('password_hash').notNullable();
    table.string('full_name', 100);
    table.string('role', 20).notNullable().defaultTo('student'); // admin | student
    table.integer('is_active').notNullable().defaultTo(1);
    table.string('avatar_seed', 100);
    table.string('phone', 20);
    table.text('bio');
    table.integer('login_count').notNullable().defaultTo(0);
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    table.datetime('last_login_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
