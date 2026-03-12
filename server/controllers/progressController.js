const db = require('../config/database');

async function getDashboard(req, res) {
  try {
    const userId = req.user.id;

    // Her bölüm için istatistikler
    const bolumler = [];
    const konuCounts = { 1: 21, 2: 26, 3: 21 };

    for (let bolumId = 1; bolumId <= 3; bolumId++) {
      const progress = await db('user_progress')
        .where({ user_id: userId, bolum_id: bolumId })
        .select('status', 'time_spent_sec');

      const quizResult = await db('bolum_quiz_results')
        .where({ user_id: userId, bolum_id: bolumId })
        .first();

      const tamamlanan = progress.filter(p => p.status === 'completed').length;
      const totalSure = progress.reduce((sum, p) => sum + (p.time_spent_sec || 0), 0);

      bolumler.push({
        bolum_id: bolumId,
        tamamlanan_konu: tamamlanan,
        toplam_konu: konuCounts[bolumId],
        quiz_score: quizResult?.score || 0,
        quiz_total: quizResult?.total || 0,
        quiz_passed: quizResult?.passed || 0,
        time_spent_sec: totalSure
      });
    }

    const totalKonu = Object.values(konuCounts).reduce((a, b) => a + b, 0);
    const tamamlananKonu = bolumler.reduce((sum, b) => sum + b.tamamlanan_konu, 0);
    const overallPercent = Math.round((tamamlananKonu / totalKonu) * 100);

    res.json({ bolumler, overall_percent: overallPercent });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function updateKonu(req, res) {
  try {
    const { bolum_id, konu_id, status, scroll_position, time_spent_sec } = req.body;
    const userId = req.user.id;

    const existing = await db('user_progress')
      .where({ user_id: userId, bolum_id, konu_id })
      .first();

    const now = new Date().toISOString();
    const completedAt = status === 'completed' ? now : null;

    if (existing) {
      // Tamamlanmış konuyu geri alma
      const newStatus = existing.status === 'completed' && status !== 'completed'
        ? existing.status
        : status;

      await db('user_progress')
        .where({ user_id: userId, bolum_id, konu_id })
        .update({
          status: newStatus,
          scroll_position: scroll_position || existing.scroll_position,
          time_spent_sec: (existing.time_spent_sec || 0) + (time_spent_sec || 0),
          completed_at: newStatus === 'completed' ? (existing.completed_at || completedAt) : null,
          updated_at: now
        });
    } else {
      await db('user_progress').insert({
        user_id: userId,
        bolum_id,
        konu_id,
        status: status || 'in_progress',
        scroll_position: scroll_position || 0,
        time_spent_sec: time_spent_sec || 0,
        completed_at: completedAt,
        updated_at: now
      });
    }

    res.json({ success: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function getBolum(req, res) {
  try {
    const { bolum_id } = req.params;
    const userId = req.user.id;

    const progress = await db('user_progress')
      .where({ user_id: userId, bolum_id: parseInt(bolum_id) });

    const tasks = await db('task_completions')
      .where({ user_id: userId, bolum_id: parseInt(bolum_id) });

    res.json({ progress, tasks });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

async function updateTask(req, res) {
  try {
    const { bolum_id, task_id, completed } = req.body;
    const userId = req.user.id;

    const existing = await db('task_completions')
      .where({ user_id: userId, bolum_id, task_id })
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await db('task_completions')
        .where({ user_id: userId, bolum_id, task_id })
        .update({
          completed: completed ? 1 : 0,
          completed_at: completed ? now : null
        });
    } else {
      await db('task_completions').insert({
        user_id: userId,
        bolum_id,
        task_id,
        completed: completed ? 1 : 0,
        completed_at: completed ? now : null
      });
    }

    res.json({ success: true });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = { getDashboard, updateKonu, getBolum, updateTask };
