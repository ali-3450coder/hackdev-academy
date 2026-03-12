exports.up = function(knex) {
  return knex.schema
    .createTable('user_progress', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('bolum_id').notNullable();
      table.string('konu_id', 20).notNullable();
      table.string('status', 20).notNullable().defaultTo('not_started'); // not_started | in_progress | completed
      table.integer('time_spent_sec').notNullable().defaultTo(0);
      table.datetime('completed_at');
      table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      table.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
      table.unique(['user_id', 'bolum_id', 'konu_id']);
    })
    .createTable('task_completions', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('bolum_id').notNullable();
      table.string('task_id', 20).notNullable();
      table.integer('completed').notNullable().defaultTo(0);
      table.datetime('completed_at');
      table.unique(['user_id', 'bolum_id', 'task_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('task_completions')
    .dropTableIfExists('user_progress');
};
