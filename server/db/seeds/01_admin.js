/**
 * GELİŞTİRME ORTAMI SEED DOSYASI
 *
 * Bu dosya SADECE lokal geliştirme için test verisi oluşturur.
 * Production ortamında `npm run db:seed` komutunu ÇALIŞTIRMAYIN.
 *
 * Varsayılan test hesapları:
 *   Admin : admin@hackdev.academy / Admin123!
 *   Test  : test@hackdev.academy  / Test123!
 */
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Mevcut kayıtları temizle
  await knex('activity_logs').del();
  await knex('bolum_quiz_results').del();
  await knex('quiz_answers').del();
  await knex('task_completions').del();
  await knex('user_progress').del();
  await knex('refresh_tokens').del();
  await knex('users').del();

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@hackdev.academy',
      password_hash: passwordHash,
      full_name: 'HackDev Admin',
      role: 'admin',
      is_active: 1,
      avatar_seed: 'admin'
    },
    {
      username: 'testuser',
      email: 'test@hackdev.academy',
      password_hash: await bcrypt.hash('Test123!', 12),
      full_name: 'Test Kullanıcı',
      role: 'student',
      is_active: 1,
      avatar_seed: 'testuser'
    }
  ]);
};
