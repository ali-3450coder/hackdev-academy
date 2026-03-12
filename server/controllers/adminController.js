const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');

// ── Genel İstatistikler ────────────────────────────────────────────────────
async function getStats(req, res) {
  try {
    const [totalUsers]    = await db('users').count('id as c');
    const [activeUsers]   = await db('users').where('is_active', 1).count('id as c');
    const [adminCount]    = await db('users').where('role', 'admin').count('id as c');
    const [totalProgress] = await db('user_progress').where('status', 'completed').count('id as c');
    const [totalQuizPass] = await db('bolum_quiz_results').where('passed', 1).count('id as c');
    const [totalCerts]    = await db('certificates').count('id as c');

    // Son 7 günde kayıt olan kullanıcılar
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [newUsers] = await db('users').where('created_at', '>=', sevenDaysAgo).count('id as c');

    // Son 7 günde login
    const [recentLogins] = await db('activity_logs')
      .where('event_type', 'login')
      .where('created_at', '>=', sevenDaysAgo)
      .count('id as c');

    res.json({
      stats: {
        total_users:      parseInt(totalUsers.c),
        active_users:     parseInt(activeUsers.c),
        admin_count:      parseInt(adminCount.c),
        new_users_7d:     parseInt(newUsers.c),
        recent_logins_7d: parseInt(recentLogins.c),
        total_completions: parseInt(totalProgress.c),
        total_quiz_passes: parseInt(totalQuizPass.c),
        total_certs:      parseInt(totalCerts.c)
      }
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı Listesi ──────────────────────────────────────────────────────
async function getUsers(req, res) {
  try {
    const { search, role, is_active, sort = 'created_at', order = 'desc' } = req.query;

    let query = db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'is_active',
              'avatar_seed', 'login_count', 'created_at', 'updated_at', 'last_login_at');

    if (search) {
      query = query.where(function() {
        this.where('username', 'like', `%${search}%`)
          .orWhere('email', 'like', `%${search}%`)
          .orWhere('full_name', 'like', `%${search}%`);
      });
    }
    if (role)      query = query.where('role', role);
    if (is_active !== undefined) query = query.where('is_active', is_active === 'true' ? 1 : 0);

    const allowedSort = ['created_at', 'last_login_at', 'username', 'email', 'login_count'];
    const sortCol = allowedSort.includes(sort) ? sort : 'created_at';
    query = query.orderBy(sortCol, order === 'asc' ? 'asc' : 'desc');

    const users = await query;

    const usersWithStats = await Promise.all(users.map(async (user) => {
      const [progress]   = await db('user_progress').where({ user_id: user.id, status: 'completed' }).count('id as c');
      const [quizPassed] = await db('bolum_quiz_results').where({ user_id: user.id, passed: 1 }).count('id as c');
      const [certCount]  = await db('certificates').where('user_id', user.id).count('id as c');
      return {
        ...user,
        completed_topics: parseInt(progress.c),
        passed_quizzes:   parseInt(quizPassed.c),
        certificates:     parseInt(certCount.c)
      };
    }));

    res.json({ users: usersWithStats });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Tek Kullanıcı Detayı ───────────────────────────────────────────────────
async function getUserDetail(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'is_active',
              'avatar_seed', 'phone', 'bio', 'login_count', 'created_at', 'updated_at', 'last_login_at')
      .where('id', userId)
      .first();

    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const progress   = await db('user_progress').where('user_id', userId);
    const quizResults = await db('bolum_quiz_results').where('user_id', userId);
    const certs      = await db('certificates').where('user_id', userId);
    const recentLogs = await db('activity_logs')
      .where('user_id', userId)
      .orderBy('created_at', 'desc')
      .limit(20);

    // Admin tarafından sıfırlanan ve henüz kullanılmamış şifre
    const pendingReset = await db('password_reset_tokens')
      .where({ user_id: userId, created_by_admin: 1 })
      .whereNull('used_at')
      .where('expires_at', '>', new Date().toISOString())
      .select('new_password_plain', 'created_at', 'expires_at')
      .first();

    res.json({
      user,
      progress,
      quiz_results: quizResults,
      certificates: certs,
      recent_activity: recentLogs,
      pending_reset: pendingReset || null
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı Aktif/Pasif ──────────────────────────────────────────────────
async function setUserStatus(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { is_active } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Kendi hesabınızı pasif yapamazsınız' });
    }

    await db('users').where('id', userId).update({
      is_active: is_active ? 1 : 0,
      updated_at: new Date().toISOString()
    });

    // Pasif yapılınca tüm token'ları iptal et
    if (!is_active) {
      await db('refresh_tokens').where('user_id', userId).update({
        revoked_at: new Date().toISOString()
      });
    }

    res.json({ message: `Kullanıcı ${is_active ? 'aktifleştirildi' : 'devre dışı bırakıldı'}` });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Rol Değiştir ───────────────────────────────────────────────────────────
async function setUserRole(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { role } = req.body;

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Kendi rolünüzü değiştiremezsiniz' });
    }

    await db('users').where('id', userId).update({
      role,
      updated_at: new Date().toISOString()
    });

    res.json({ message: `Kullanıcı rolü "${role}" olarak güncellendi` });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Şifre Sıfırla (Admin) ──────────────────────────────────────────────────
async function resetUserPassword(req, res) {
  try {
    const userId = parseInt(req.params.id);

    const user = await db('users').where('id', userId).first();
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    // Rastgele geçici şifre üret: 2 büyük + 4 küçük + 2 rakam + 1 sembol
    const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const lower   = 'abcdefghjkmnpqrstuvwxyz';
    const digits  = '23456789';
    const symbols = '@#!$';
    const rand = (chars) => chars[Math.floor(Math.random() * chars.length)];
    const tempPassword = [
      rand(upper), rand(upper),
      rand(lower), rand(lower), rand(lower), rand(lower),
      rand(digits), rand(digits),
      rand(symbols)
    ].sort(() => Math.random() - 0.5).join('');

    const passwordHash = await bcrypt.hash(tempPassword, 12);
    const tokenHash    = crypto.randomBytes(32).toString('hex');
    const expiresAt    = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 saat

    // Eski reset token'larını temizle
    await db('password_reset_tokens')
      .where({ user_id: userId, created_by_admin: 1 })
      .whereNull('used_at')
      .del();

    // Şifreyi güncelle
    await db('users').where('id', userId).update({
      password_hash: passwordHash,
      updated_at: new Date().toISOString()
    });

    // Tüm aktif oturumları kapat
    await db('refresh_tokens').where('user_id', userId).update({
      revoked_at: new Date().toISOString()
    });

    // Geçici şifreyi kaydet (admin panelinde göster)
    await db('password_reset_tokens').insert({
      user_id: userId,
      token_hash: tokenHash,
      new_password_plain: tempPassword,
      created_by_admin: 1,
      expires_at: expiresAt
    });

    // Log
    await db('activity_logs').insert({
      user_id: req.user.id,
      event_type: 'admin_password_reset',
      event_data: JSON.stringify({ target_user_id: userId, target_email: user.email }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({
      message: 'Şifre sıfırlandı',
      temp_password: tempPassword,
      expires_at: expiresAt
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı Sil ─────────────────────────────────────────────────────────
async function deleteUser(req, res) {
  try {
    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
    }

    const user = await db('users').where('id', userId).first();
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    if (user.role === 'admin') {
      return res.status(400).json({ error: 'Admin hesabı silinemez. Önce rolü değiştirin.' });
    }

    await db('users').where('id', userId).del();

    await db('activity_logs').insert({
      user_id: req.user.id,
      event_type: 'admin_delete_user',
      event_data: JSON.stringify({ deleted_user_id: userId, deleted_email: user.email }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: 'Kullanıcı silindi' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Sistem Logları ─────────────────────────────────────────────────────────
async function getLogs(req, res) {
  try {
    const { event_type, user_id, limit = 100, offset = 0 } = req.query;

    let query = db('activity_logs')
      .leftJoin('users', 'activity_logs.user_id', 'users.id')
      .select(
        'activity_logs.id',
        'activity_logs.user_id',
        'activity_logs.event_type',
        'activity_logs.event_data',
        'activity_logs.ip_address',
        'activity_logs.created_at',
        'users.username',
        'users.email'
      )
      .orderBy('activity_logs.created_at', 'desc')
      .limit(Math.min(parseInt(limit), 500))
      .offset(parseInt(offset));

    if (event_type) query = query.where('activity_logs.event_type', event_type);
    if (user_id)    query = query.where('activity_logs.user_id', parseInt(user_id));

    const logs = await query;
    const [{ total }] = await db('activity_logs').count('id as total');

    res.json({ logs, total: parseInt(total) });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı Profil Düzenle ───────────────────────────────────────────────
async function updateUserProfile(req, res) {
  try {
    const userId = parseInt(req.params.id);
    const { full_name, email, phone, bio } = req.body;

    if (email) {
      const existing = await db('users').where('email', email).whereNot('id', userId).first();
      if (existing) return res.status(400).json({ error: 'Bu e-posta başka bir kullanıcıya ait' });
    }

    const updates = { updated_at: new Date().toISOString() };
    if (full_name !== undefined) updates.full_name = full_name.trim();
    if (email     !== undefined) updates.email     = email.trim().toLowerCase();
    if (phone     !== undefined) updates.phone     = phone.trim();
    if (bio       !== undefined) updates.bio       = bio.trim();

    await db('users').where('id', userId).update(updates);

    await db('activity_logs').insert({
      user_id:    req.user.id,
      event_type: 'admin_edit_profile',
      event_data: JSON.stringify({ target_user_id: userId }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: 'Profil güncellendi' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı İlerlemesini Sıfırla ────────────────────────────────────────
async function resetUserProgress(req, res) {
  try {
    const userId   = parseInt(req.params.id);
    const bolumId  = req.query.bolum_id ? parseInt(req.query.bolum_id) : null;

    let pq = db('user_progress').where('user_id', userId);
    let tq = db('task_completions').where('user_id', userId);
    if (bolumId) { pq = pq.where('bolum_id', bolumId); tq = tq.where('bolum_id', bolumId); }

    const dp = await pq.del();
    const dt = await tq.del();

    await db('activity_logs').insert({
      user_id:    req.user.id,
      event_type: 'admin_reset_progress',
      event_data: JSON.stringify({ target_user_id: userId, bolum_id: bolumId || 'all', deleted: dp + dt }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: `İlerleme sıfırlandı (${dp} konu + ${dt} görev silindi)` });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcı Quiz Sonuçlarını Sıfırla ────────────────────────────────────
async function resetUserQuiz(req, res) {
  try {
    const userId  = parseInt(req.params.id);
    const bolumId = req.query.bolum_id ? parseInt(req.query.bolum_id) : null;

    let rq = db('bolum_quiz_results').where('user_id', userId);
    let aq = db('quiz_answers').where('user_id', userId);
    if (bolumId) { rq = rq.where('bolum_id', bolumId); aq = aq.where('bolum_id', bolumId); }

    const dr = await rq.del();
    const da = await aq.del();

    await db('activity_logs').insert({
      user_id:    req.user.id,
      event_type: 'admin_reset_quiz',
      event_data: JSON.stringify({ target_user_id: userId, bolum_id: bolumId || 'all', deleted: dr + da }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: `Quiz sıfırlandı (${dr} sonuç + ${da} cevap silindi)` });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Sertifika Listesi ──────────────────────────────────────────────────────
async function getCertificates(req, res) {
  try {
    const { user_id, bolum_id } = req.query;

    let q = db('certificates')
      .leftJoin('users', 'certificates.user_id', 'users.id')
      .select(
        'certificates.id',
        'certificates.user_id',
        'certificates.bolum_id',
        'certificates.certificate_no',
        'certificates.issued_at',
        'users.username',
        'users.full_name',
        'users.email',
        'users.avatar_seed'
      )
      .orderBy('certificates.issued_at', 'desc');

    if (user_id)  q = q.where('certificates.user_id', parseInt(user_id));
    if (bolum_id) q = q.where('certificates.bolum_id', parseInt(bolum_id));

    const certs = await q;
    res.json({ certificates: certs });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Sertifika Ver ──────────────────────────────────────────────────────────
async function issueCertificate(req, res) {
  try {
    const userId  = parseInt(req.params.id);
    const bolumId = parseInt(req.body.bolum_id);

    if (!bolumId || bolumId < 1 || bolumId > 3) {
      return res.status(400).json({ error: 'Geçerli bir bolum_id girin (1-3)' });
    }

    const user = await db('users').where('id', userId).first();
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

    const existing = await db('certificates').where({ user_id: userId, bolum_id: bolumId }).first();
    if (existing) return res.status(400).json({ error: `Bölüm ${bolumId} sertifikası zaten mevcut` });

    const certNo = `HD-${String(userId).padStart(4,'0')}-B${bolumId}-${Date.now().toString(36).toUpperCase()}`;

    await db('certificates').insert({
      user_id:        userId,
      bolum_id:       bolumId,
      certificate_no: certNo,
      issued_at:      new Date().toISOString()
    });

    await db('activity_logs').insert({
      user_id:    req.user.id,
      event_type: 'admin_issue_certificate',
      event_data: JSON.stringify({ target_user_id: userId, bolum_id: bolumId, cert_no: certNo }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: 'Sertifika verildi', certificate_no: certNo });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Sertifika İptal ────────────────────────────────────────────────────────
async function revokeCertificate(req, res) {
  try {
    const certId = parseInt(req.params.id);
    const cert   = await db('certificates').where('id', certId).first();
    if (!cert) return res.status(404).json({ error: 'Sertifika bulunamadı' });

    await db('certificates').where('id', certId).del();

    await db('activity_logs').insert({
      user_id:    req.user.id,
      event_type: 'admin_revoke_certificate',
      event_data: JSON.stringify({ cert_id: certId, user_id: cert.user_id, cert_no: cert.certificate_no }),
      ip_address: req.ip,
      user_agent: req.get('user-agent') || ''
    });

    res.json({ message: 'Sertifika iptal edildi' });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Kullanıcıları CSV Olarak Dışa Aktar ───────────────────────────────────
async function exportUsersCSV(req, res) {
  try {
    const users = await db('users')
      .select('id', 'username', 'email', 'full_name', 'role', 'is_active',
              'login_count', 'created_at', 'last_login_at', 'phone');

    const header = ['ID','Kullanıcı Adı','E-posta','Ad Soyad','Rol','Aktif','Giriş Sayısı','Telefon','Kayıt Tarihi','Son Giriş'];
    const rows   = users.map(u => [
      u.id, u.username, u.email, u.full_name || '', u.role,
      u.is_active ? 'Evet' : 'Hayır', u.login_count, u.phone || '',
      u.created_at || '', u.last_login_at || ''
    ]);

    const esc  = v => `"${String(v).replace(/"/g, '""')}"`;
    const csv  = [header, ...rows].map(row => row.map(esc).join(',')).join('\r\n');
    const date = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kullanicilar-${date}.csv"`);
    res.send('\uFEFF' + csv); // UTF-8 BOM (Excel uyumu)
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Eski Logları Temizle ───────────────────────────────────────────────────
async function clearLogs(req, res) {
  try {
    const days   = Math.max(1, parseInt(req.query.days || 30));
    const cutoff = new Date(Date.now() - days * 864e5).toISOString();
    const deleted = await db('activity_logs').where('created_at', '<', cutoff).del();
    res.json({ message: `${deleted} log silindi (${days} günden eski)`, deleted });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

// ── Veritabanı İstatistikleri ──────────────────────────────────────────────
async function getDbStats(req, res) {
  try {
    const count = async (tbl) => parseInt((await db(tbl).count('id as c'))[0].c);

    const [u, p, qr, qa, tc, c, al, rt, pr] = await Promise.all([
      count('users'), count('user_progress'), count('bolum_quiz_results'),
      count('quiz_answers'), count('task_completions'), count('certificates'),
      count('activity_logs'), count('refresh_tokens'), count('password_reset_tokens')
    ]);

    res.json({
      tables: [
        { name: 'users',                  label: 'Kullanıcılar',              count: u,  icon: '👤' },
        { name: 'user_progress',          label: 'Konu İlerlemesi',           count: p,  icon: '📚' },
        { name: 'bolum_quiz_results',     label: 'Quiz Sonuçları',            count: qr, icon: '📝' },
        { name: 'quiz_answers',           label: 'Quiz Cevapları',            count: qa, icon: '✏️'  },
        { name: 'task_completions',       label: 'Görev Tamamlamaları',       count: tc, icon: '✅' },
        { name: 'certificates',           label: 'Sertifikalar',              count: c,  icon: '🏅' },
        { name: 'activity_logs',          label: 'Aktivite Logları',          count: al, icon: '📋' },
        { name: 'refresh_tokens',         label: 'Oturum Tokenları',          count: rt, icon: '🔑' },
        { name: 'password_reset_tokens',  label: 'Şifre Sıfırlama Tokenları', count: pr, icon: '🔒' }
      ]
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
}

module.exports = {
  getStats, getUsers, getUserDetail,
  setUserStatus, setUserRole, resetUserPassword, deleteUser,
  updateUserProfile, resetUserProgress, resetUserQuiz,
  getCertificates, issueCertificate, revokeCertificate,
  exportUsersCSV, clearLogs, getDbStats,
  getLogs
};
