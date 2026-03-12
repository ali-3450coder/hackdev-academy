const db = require('../config/database');

async function getUsers(req, res) {
  try {
    const users = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'is_active', 'created_at', 'last_login_at');

    // Her kullanıcı için istatistik
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const progress = await db('user_progress')
        .where({ user_id: user.id, status: 'completed' })
        .count('id as count')
        .first();

      const quizPassed = await db('bolum_quiz_results')
        .where({ user_id: user.id, passed: 1 })
        .count('id as count')
        .first();

      return {
        ...user,
        completed_topics: parseInt(progress?.count || 0),
        passed_quizzes: parseInt(quizPassed?.count || 0)
      };
    }));

    res.json({ users: usersWithStats });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function getLogs(req, res) {
  try {
    const { event_type, user_id, limit = 100 } = req.query;

    let query = db('activity_logs')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .select(
        'activity_logs.*',
        'users.username',
        'users.email'
      )
      .orderBy('activity_logs.created_at', 'desc')
      .limit(parseInt(limit));

    if (event_type) query = query.where('activity_logs.event_type', event_type);
    if (user_id) query = query.where('activity_logs.user_id', parseInt(user_id));

    const logs = await query;
    res.json({ logs });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function setUserStatus(req, res) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    await db('users').where('id', parseInt(id)).update({
      is_active: is_active ? 1 : 0,
      updated_at: new Date().toISOString()
    });

    res.json({ message: `Kullanıcı ${is_active ? 'aktifleştirildi' : 'devre dışı bırakıldı'}` });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = { getUsers, getLogs, setUserStatus };
