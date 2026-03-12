const secret = process.env.JWT_SECRET;

if (!secret || secret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.error('HATA: JWT_SECRET tanımlanmamış veya çok kısa. Sunucu durduruluyor.');
    process.exit(1);
  }
}

module.exports = {
  secret: secret || 'dev_only_secret_do_not_use_in_production_must_be_changed',
  accessExpires: process.env.JWT_ACCESS_EXPIRES || '15m',
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || '7d',
  refreshRememberExpires: process.env.JWT_REFRESH_REMEMBER_EXPIRES || '30d'
};
