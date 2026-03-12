require('dotenv').config();

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

const { generalLimiter } = require('./middleware/rateLimit');
const { requestLogger } = require('./middleware/logger');

const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const quizRoutes = require('./routes/quiz');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Güvenlik middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "https://api.dicebear.com", "data:"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS politikası tarafından engellendi'));
    }
  },
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));

// Logger
app.use(requestLogger);

// Genel rate limit
app.use('/api', generalLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Statik dosyalar
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback — HTML sayfalarını yönlendir
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard/index.html'));
});
app.get('/auth/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/auth/login.html'));
});
app.get('/auth/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/auth/register.html'));
});
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/index.html'));
});

// 404 handler
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint bulunamadı' });
  }
  res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  res.status(500).json({ error: 'Sunucu hatası' });
});

async function setupDatabase() {
  const knexConfig = require('../knexfile');
  const env = process.env.NODE_ENV === 'production' ? 'production' : 'development';
  const db = require('knex')(knexConfig[env]);

  // Migration'ları uygula
  await db.migrate.latest();
  console.log('✅ Migration tamamlandı');

  // İlk kurulum: hiç kullanıcı yoksa admin oluştur
  const userCount = await db('users').count('id as cnt').first();
  if (parseInt(userCount.cnt) === 0) {
    const bcrypt = require('bcryptjs');
    const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@hackdev.academy';
    const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
    const adminName     = process.env.SEED_ADMIN_FULLNAME || 'HackDev Admin';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD;

    if (!adminPassword) {
      console.warn('⚠️  SEED_ADMIN_PASSWORD tanımlı değil — admin hesabı oluşturulamadı!');
    } else {
      await db('users').insert({
        username:      adminUsername,
        email:         adminEmail,
        password_hash: await bcrypt.hash(adminPassword, 12),
        full_name:     adminName,
        role:          'admin',
        is_active:     1,
        avatar_seed:   adminUsername
      });
      console.log(`✅ Admin hesabı oluşturuldu → ${adminEmail}`);
    }
  }

  await db.destroy();
}

async function startServer() {
  try {
    await setupDatabase();
  } catch (err) {
    console.error('❌ Veritabanı kurulum hatası:', err.message);
    // Hata olsa bile sunucuyu başlat
  }

  app.listen(PORT, () => {
    console.log(`HackDev Academy sunucusu http://localhost:${PORT} adresinde çalışıyor`);
    console.log(`Ortam: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();

module.exports = app;
