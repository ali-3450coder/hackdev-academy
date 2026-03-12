const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { logActivity } = require('../middleware/logger');

async function getProfile(req, res) {
  try {
    const user = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'avatar_seed', 'created_at', 'last_login_at')
      .where('id', req.user.id)
      .first();

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // İstatistikler
    const progressCount = await db('user_progress')
      .where({ user_id: req.user.id, status: 'completed' })
      .count('id as count')
      .first();

    const totalTime = await db('user_progress')
      .where('user_id', req.user.id)
      .sum('time_spent_sec as total')
      .first();

    const quizResults = await db('bolum_quiz_results')
      .where('user_id', req.user.id);

    const avgScore = quizResults.length > 0
      ? Math.round(quizResults.reduce((sum, r) => sum + (r.score / r.total * 100), 0) / quizResults.length)
      : 0;

    res.json({
      user,
      stats: {
        completed_topics: parseInt(progressCount?.count || 0),
        total_time_sec: parseInt(totalTime?.total || 0),
        quiz_avg_score: avgScore,
        quiz_count: quizResults.length
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function updateProfile(req, res) {
  try {
    const { full_name, username } = req.body;
    const userId = req.user.id;

    if (username) {
      const existing = await db('users')
        .where('username', username.toLowerCase())
        .whereNot('id', userId)
        .first();

      if (existing) {
        return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanımda' });
      }
    }

    await db('users').where('id', userId).update({
      full_name: full_name || undefined,
      username: username ? username.toLowerCase() : undefined,
      updated_at: new Date().toISOString()
    });

    const updated = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role')
      .where('id', userId)
      .first();

    res.json({ user: updated });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function changePassword(req, res) {
  try {
    const { current_password, new_password } = req.body;
    const userId = req.user.id;

    const user = await db('users').where('id', userId).first();
    const valid = await bcrypt.compare(current_password, user.password_hash);

    if (!valid) {
      return res.status(400).json({ error: 'Mevcut şifre hatalı' });
    }

    const newHash = await bcrypt.hash(new_password, 12);
    await db('users').where('id', userId).update({
      password_hash: newHash,
      updated_at: new Date().toISOString()
    });

    await logActivity(userId, 'password_change', null, req);

    res.json({ message: 'Şifre başarıyla değiştirildi' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function getActivity(req, res) {
  try {
    const logs = await db('activity_logs')
      .where('user_id', req.user.id)
      .orderBy('created_at', 'desc')
      .limit(50);

    res.json({ logs });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = { getProfile, updateProfile, changePassword, getActivity };
