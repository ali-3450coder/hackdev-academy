/**
 * GELİŞTİRME ORTAMI SEED DOSYASI
 *
 * Bu dosya SADECE lokal geliştirme için test verisi oluşturur.
 * Tüm bilgiler .env dosyasından okunur — bu dosyada kimlik bilgisi yoktur.
 * Production ortamında `npm run db:seed` komutunu ÇALIŞTIRMAYIN.
 */
const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Mevcut kayıtları temizle (bağımlı tablolar önce)
  await knex('activity_logs').del();
  await knex('password_reset_tokens').del();
  await knex('certificates').del();
  await knex('bolum_quiz_results').del();
  await knex('quiz_answers').del();
  await knex('task_completions').del();
  await knex('user_progress').del();
  await knex('refresh_tokens').del();
  await knex('users').del();

  // Tüm bilgileri .env'den oku
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@hackdev.academy';
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminName     = process.env.SEED_ADMIN_FULLNAME || 'HackDev Admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'DevAdmin@Local1';

  const testEmail    = process.env.SEED_TEST_EMAIL    || 'test@hackdev.academy';
  const testUsername = process.env.SEED_TEST_USERNAME || 'testuser';
  const testName     = process.env.SEED_TEST_FULLNAME || 'Test Kullanici';
  const testPassword = process.env.SEED_TEST_PASSWORD || 'DevTest@Local1';

  await knex('users').insert([
    {
      username:      adminUsername,
      email:         adminEmail,
      password_hash: await bcrypt.hash(adminPassword, 12),
      full_name:     adminName,
      role:          'admin',
      is_active:     1,
      avatar_seed:   adminUsername
    },
    {
      username:      testUsername,
      email:         testEmail,
      password_hash: await bcrypt.hash(testPassword, 12),
      full_name:     testName,
      role:          'student',
      is_active:     1,
      avatar_seed:   testUsername
    }
  ]);

  console.log('✓ Seed tamamlandi:');
  console.log(`  Admin → ${adminEmail} / ${adminPassword}`);
  console.log(`  Test  → ${testEmail} / ${testPassword}`);
};
