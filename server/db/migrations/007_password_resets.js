exports.up = function(knex) {
  return knex.schema.createTable('password_reset_tokens', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('token_hash').notNullable().unique();
    table.string('new_password_plain', 30); // Admin tarafından sıfırlanınca geçici şifre burada tutulur
    table.integer('created_by_admin').notNullable().defaultTo(0);
    table.datetime('expires_at').notNullable();
    table.datetime('used_at');
    table.datetime('created_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('password_reset_tokens');
};
