exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', function(table) {
    table.increments('id').primary();
    table.integer('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('event_type', 50).notNullable();
    table.text('event_data');
    table.string('ip_address', 45);
    table.text('user_agent');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('activity_logs');
};
