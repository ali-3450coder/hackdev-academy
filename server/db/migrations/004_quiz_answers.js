exports.up = function(knex) {
  return knex.schema
    .createTable('quiz_answers', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('bolum_id').notNullable();
      table.string('question_id', 30).notNullable();
      table.string('selected_ans', 5).notNullable();
      table.integer('is_correct').notNullable();
      table.datetime('answered_at').notNullable().defaultTo(knex.fn.now());
      table.unique(['user_id', 'bolum_id', 'question_id']);
    })
    .createTable('bolum_quiz_results', function(table) {
      table.increments('id').primary();
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.integer('bolum_id').notNullable();
      table.integer('score').notNullable();
      table.integer('total').notNullable();
      table.integer('passed').notNullable();
      table.datetime('attempt_at').notNullable().defaultTo(knex.fn.now());
      table.unique(['user_id', 'bolum_id']);
    });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('bolum_quiz_results')
    .dropTableIfExists('quiz_answers');
};
