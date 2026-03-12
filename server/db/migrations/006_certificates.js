exports.up = function(knex) {
  return knex.schema.createTable('certificates', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.integer('bolum_id').notNullable();
    table.string('certificate_no', 30).notNullable().unique(); // HDA-2026-XXXX
    table.datetime('issued_at').notNullable().defaultTo(knex.fn.now());
    table.unique(['user_id', 'bolum_id']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('certificates');
};
