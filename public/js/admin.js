'use strict';

(function () {

  // ── State ─────────────────────────────────────────
  let logsOffset        = 0;
  let resetTargetId     = null;
  let resetTargetName   = '';
  let clearLogsDays     = 30;
  let issueCertUserId   = null;
  let issueCertUserName = '';

  // ── Yardımcı ─────────────────────────────────────
  function toast(msg, type = 'success') {
    const el = document.getElementById('adminToast');
    el.textContent = (type === 'success' ? '✓ ' : '✗ ') + msg;
    el.className = `admin-toast ${type} show`;
    setTimeout(() => el.classList.remove('show'), 3500);
  }

  function formatDate(str) {
    if (!str) return '—';
    const d = new Date(str);
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
      + ' ' + d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }

  function formatRelative(str) {
    if (!str) return '—';
    const diff = Date.now() - new Date(str).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Az önce';
    if (m < 60) return `${m} dk önce`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} sa önce`;
    const day = Math.floor(h / 24);
    return day < 30 ? `${day} gün önce` : formatDate(str);
  }

  function logEventClass(ev) {
    if (!ev) return '';
    if (ev.startsWith('login'))    return 'login';
    if (ev.startsWith('logout'))   return 'logout';
    if (ev.startsWith('register')) return 'register';
    if (ev.startsWith('quiz'))     return 'quiz';
    if (ev.startsWith('admin'))    return 'admin';
    return '';
  }

  const EVENT_LABELS = {
    login: 'Giriş', logout: 'Çıkış', register: 'Kayıt',
    quiz_submit: 'Quiz', konu_progress: 'İlerleme', task_complete: 'Görev',
    admin_password_reset: 'Şifre Sıfırlama',   admin_delete_user: 'Kullanıcı Silme',
    admin_reset_progress: 'İlerleme Sıfırlama', admin_reset_quiz: 'Quiz Sıfırlama',
    admin_issue_certificate: 'Sertifika Verme', admin_revoke_certificate: 'Sertifika İptali',
    admin_edit_profile: 'Profil Düzenleme'
  };
  function logEventLabel(ev) { return EVENT_LABELS[ev] || ev; }

  function showModal(id)  { document.getElementById(id).classList.remove('hidden'); }
  function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

  function avatarSrc(seed) {
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed || '?')}&backgroundColor=b8f535&textColor=080c12`;
  }

  // ── Panel Navigasyonu ─────────────────────────────
  function initNav() {
    const items = document.querySelectorAll('.admin-nav-item[data-panel]');
    const titles = {
      dashboard: 'Dashboard', users: 'Kullanıcı Yönetimi',
      certificates: 'Sertifika Yönetimi', logs: 'Sistem Logları', database: 'Veritabanı'
    };
    items.forEach(item => {
      item.addEventListener('click', function() {
        items.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        const panel = this.dataset.panel;
        document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('panel-' + panel).classList.add('active');
        document.getElementById('topbarTitle').textContent = titles[panel] || panel;
        if (panel === 'users')        loadUsers();
        if (panel === 'certificates') loadCertificates();
        if (panel === 'logs')         loadLogs(true);
        if (panel === 'database')     loadDbStats();
      });
    });
  }

  // ── Dashboard ─────────────────────────────────────
  async function loadStats() {
    try {
      const res = await API.request('GET', '/admin/stats');
      if (!res || !res.ok) return;
      const { stats } = await res.json();
      document.getElementById('statGrid').innerHTML = `
        <div class="stat-card accent">
          <div class="stat-card-icon">👥</div>
          <div class="stat-card-value">${stats.total_users}</div>
          <div class="stat-card-label">Toplam Kullanıcı</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">✅</div>
          <div class="stat-card-value">${stats.active_users}</div>
          <div class="stat-card-label">Aktif Kullanıcı</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">🆕</div>
          <div class="stat-card-value">${stats.new_users_7d}</div>
          <div class="stat-card-label">Son 7 Günde Kayıt</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">🔑</div>
          <div class="stat-card-value">${stats.recent_logins_7d}</div>
          <div class="stat-card-label">Son 7 Günde Giriş</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">📚</div>
          <div class="stat-card-value">${stats.total_completions}</div>
          <div class="stat-card-label">Tamamlanan Konu</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-icon">🏆</div>
          <div class="stat-card-value">${stats.total_certs}</div>
          <div class="stat-card-label">Verilen Sertifika</div>
        </div>
      `;
    } catch(e) {
      document.getElementById('statGrid').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>İstatistikler yüklenemedi</div></div>';
    }
  }

  async function loadRecentUsers() {
    try {
      const res = await API.request('GET', '/admin/users');
      if (!res || !res.ok) return;
      const { users } = await res.json();
      const recent = [...users].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).slice(0,5);
      document.getElementById('recentUsersBody').innerHTML = recent.length ? recent.map(u => `
        <tr>
          <td>
            <div class="user-cell">
              <img class="user-avatar-sm" src="${avatarSrc(u.avatar_seed || u.username)}" alt="">
              <div class="user-info-sm">
                <div class="user-name">${u.full_name || u.username}</div>
                <div class="user-email">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${formatRelative(u.created_at)}</td>
          <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? 'Aktif' : 'Pasif'}</span></td>
        </tr>
      `).join('') : '<tr><td colspan="3"><div class="empty-state"><div class="empty-state-text">Kayıt yok</div></div></td></tr>';
    } catch(e) {}
  }

  async function loadRecentLogs() {
    try {
      const res = await API.request('GET', '/admin/logs?limit=8');
      if (!res || !res.ok) return;
      const { logs } = await res.json();
      document.getElementById('recentLogsBody').innerHTML = logs.length ? logs.map(l => `
        <tr>
          <td><span class="log-event ${logEventClass(l.event_type)}">${logEventLabel(l.event_type)}</span></td>
          <td style="font-size:0.8rem">${l.username || '—'}</td>
          <td style="font-size:0.75rem;color:var(--text3)">${formatRelative(l.created_at)}</td>
        </tr>
      `).join('') : '<tr><td colspan="3"><div class="empty-state"><div class="empty-state-text">Log yok</div></div></td></tr>';
    } catch(e) {}
  }

  // ── Kullanıcılar Paneli ───────────────────────────
  async function loadUsers() {
    const body = document.getElementById('usersTableBody');
    body.innerHTML = '<tr><td colspan="8" class="admin-loading"><div class="spinner"></div> Yükleniyor…</td></tr>';
    try {
      const search   = document.getElementById('userSearch').value;
      const role     = document.getElementById('roleFilter').value;
      const isActive = document.getElementById('statusFilter').value;
      let url = '/admin/users?';
      if (search)   url += `search=${encodeURIComponent(search)}&`;
      if (role)     url += `role=${role}&`;
      if (isActive) url += `is_active=${isActive}&`;

      const res = await API.request('GET', url);
      if (!res || !res.ok) throw new Error();
      const { users } = await res.json();
      renderUsersTable(users);
    } catch(e) {
      body.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Yüklenemedi</div></div></td></tr>';
    }
  }

  function renderUsersTable(users) {
    const body = document.getElementById('usersTableBody');
    if (!users.length) {
      body.innerHTML = '<tr><td colspan="8"><div class="empty-state"><div class="empty-state-icon">👤</div><div class="empty-state-text">Kullanıcı bulunamadı</div></div></td></tr>';
      return;
    }
    body.innerHTML = users.map(u => `
      <tr>
        <td>
          <div class="user-cell">
            <img class="user-avatar-sm" src="${avatarSrc(u.avatar_seed || u.username)}" alt="">
            <div class="user-info-sm">
              <div class="user-name">${u.full_name || '—'}</div>
              <div class="user-email">${u.email}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-${u.role}">${u.role === 'admin' ? 'Admin' : 'Öğrenci'}</span></td>
        <td><span class="badge badge-${u.is_active ? 'active' : 'inactive'}">${u.is_active ? '● Aktif' : '○ Pasif'}</span></td>
        <td style="text-align:center">${u.completed_topics}</td>
        <td style="text-align:center">${u.passed_quizzes}/3</td>
        <td style="text-align:center">${u.certificates > 0 ? '🏅 '+u.certificates : '—'}</td>
        <td style="font-size:0.75rem;color:var(--text3)">${formatRelative(u.last_login_at)}</td>
        <td>
          <div class="action-btns">
            <button class="btn-icon success" title="Detay" data-action="detail" data-id="${u.id}">🔍</button>
            <button class="btn-icon" title="Şifre Sıfırla" data-action="reset" data-id="${u.id}" data-name="${u.full_name || u.username}">🔑</button>
            <button class="btn-icon" title="${u.is_active ? 'Pasif Yap' : 'Aktif Yap'}" data-action="toggle" data-id="${u.id}" data-active="${u.is_active}">
              ${u.is_active ? '🔒' : '🔓'}
            </button>
            <button class="btn-icon danger" title="Sil" data-action="delete" data-id="${u.id}" data-name="${u.full_name || u.username}">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  // ── Kullanıcı Detay Modalı ────────────────────────
  async function openUserDetail(userId) {
    showModal('userModal');
    activateTab('detail');
    document.getElementById('userModalBody').innerHTML = '<div class="admin-loading"><div class="spinner"></div></div>';

    try {
      const res = await API.request('GET', `/admin/users/${userId}`);
      if (!res || !res.ok) throw new Error();
      const { user, progress, quiz_results, certificates, recent_activity, pending_reset } = await res.json();

      const completedTopics = progress.filter(p => p.status === 'completed').length;
      const totalTimeMin    = Math.floor(progress.reduce((s,p) => s+(p.time_spent_sec||0),0) / 60);

      document.getElementById('userModalBody').innerHTML = `
        <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
          <img style="width:56px;height:56px;border-radius:50%;border:2px solid var(--acid);"
            src="${avatarSrc(user.avatar_seed || user.username)}" alt="">
          <div>
            <div style="font-weight:700;font-size:1.1rem;color:var(--text)">${user.full_name || user.username}</div>
            <div style="font-size:0.8rem;color:var(--text3)">${user.email}</div>
            <div style="margin-top:4px;display:flex;gap:6px;">
              <span class="badge badge-${user.role}">${user.role === 'admin' ? 'Admin' : 'Öğrenci'}</span>
              <span class="badge badge-${user.is_active ? 'active' : 'inactive'}">${user.is_active ? 'Aktif' : 'Pasif'}</span>
            </div>
          </div>
        </div>
        ${pending_reset ? `
          <div class="temp-pass-box" style="margin-bottom:16px;">
            <div class="label">⚠️ BEKLEYEN GEÇİCİ ŞİFRE</div>
            <div class="password">${pending_reset.new_password_plain}</div>
            <div class="note">Geçerlilik: ${formatDate(pending_reset.expires_at)}</div>
          </div>
        ` : ''}
        <div style="margin-bottom:16px;">
          <div class="detail-row"><span class="detail-label">Kullanıcı Adı</span><span class="detail-value">@${user.username}</span></div>
          <div class="detail-row"><span class="detail-label">Kayıt Tarihi</span><span class="detail-value">${formatDate(user.created_at)}</span></div>
          <div class="detail-row"><span class="detail-label">Son Giriş</span><span class="detail-value">${formatRelative(user.last_login_at)}</span></div>
          <div class="detail-row"><span class="detail-label">Toplam Giriş</span><span class="detail-value">${user.login_count} kez</span></div>
          <div class="detail-row"><span class="detail-label">Telefon</span><span class="detail-value">${user.phone || '—'}</span></div>
          <div class="detail-row"><span class="detail-label">Tamamlanan Konu</span><span class="detail-value">${completedTopics} konu</span></div>
          <div class="detail-row"><span class="detail-label">Geçilen Quiz</span><span class="detail-value">${quiz_results.filter(q=>q.passed).length}/${quiz_results.length}</span></div>
          <div class="detail-row"><span class="detail-label">Toplam Süre</span><span class="detail-value">${totalTimeMin} dk</span></div>
          <div class="detail-row"><span class="detail-label">Sertifika</span><span class="detail-value">${certificates.length ? '🏅 '+certificates.map(c=>c.certificate_no).join(', ') : '—'}</span></div>
          ${user.bio ? `<div class="detail-row"><span class="detail-label">Bio</span><span class="detail-value" style="font-size:0.8rem">${user.bio}</span></div>` : ''}
        </div>
        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem;font-weight:700;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Son Aktiviteler</div>
          ${recent_activity.slice(0,5).map(l => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid var(--border);font-size:0.8rem;">
              <span class="log-event ${logEventClass(l.event_type)}">${logEventLabel(l.event_type)}</span>
              <span style="color:var(--text3)">${formatRelative(l.created_at)}</span>
            </div>
          `).join('') || '<div style="color:var(--text3);font-size:0.8rem">Aktivite yok</div>'}
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
          <button class="btn btn-primary btn-sm" data-action="reset" data-id="${user.id}" data-name="${user.full_name||user.username}">🔑 Şifre Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="toggle" data-id="${user.id}" data-active="${user.is_active}">
            ${user.is_active ? '🔒 Pasif Yap' : '🔓 Aktif Yap'}
          </button>
          ${user.role !== 'admin'
            ? `<button class="btn btn-ghost btn-sm" data-action="make-admin" data-id="${user.id}">⭐ Admin Yap</button>`
            : `<button class="btn btn-ghost btn-sm" data-action="make-student" data-id="${user.id}">👤 Öğrenci Yap</button>`}
        </div>
      `;

      // Edit sekmesini doldur
      document.getElementById('editUserId').value   = user.id;
      document.getElementById('editFullName').value = user.full_name || '';
      document.getElementById('editEmail').value    = user.email    || '';
      document.getElementById('editPhone').value    = user.phone    || '';
      document.getElementById('editBio').value      = user.bio      || '';

      // Veri sekmesini oluştur
      buildDataTab(user, progress, quiz_results, certificates);

    } catch(e) {
      document.getElementById('userModalBody').innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Detaylar yüklenemedi</div></div>';
    }
  }

  function buildDataTab(user, progress, quizResults, certs) {
    const html = `
      <div class="data-section">
        <div class="data-section-title">📚 İlerleme Sıfırlama</div>
        <div style="font-size:0.8rem;color:var(--text3);margin-bottom:10px;">
          ${[1,2,3].map(b => {
            const c = progress.filter(p => p.bolum_id === b && p.status === 'completed').length;
            const t = progress.filter(p => p.bolum_id === b).length;
            return `<span style="margin-right:12px">B${b}: <strong style="color:var(--text)">${c}/${t}</strong> konu</span>`;
          }).join('')}
        </div>
        <div class="data-section-actions">
          <button class="btn btn-ghost btn-sm" data-action="reset-progress" data-id="${user.id}" data-bolum="1">B1 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-progress" data-id="${user.id}" data-bolum="2">B2 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-progress" data-id="${user.id}" data-bolum="3">B3 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-progress-all" data-id="${user.id}" style="color:var(--danger)">Tümünü Sıfırla</button>
        </div>
      </div>
      <div class="data-section">
        <div class="data-section-title">📝 Quiz Sıfırlama</div>
        <div style="font-size:0.8rem;color:var(--text3);margin-bottom:10px;">
          ${[1,2,3].map(b => {
            const r = quizResults.find(q => q.bolum_id === b);
            return `<span style="margin-right:12px">B${b}: <strong style="color:var(--text)">${r ? (r.passed ? '✅ Geçti' : r.score+'/'+r.total) : '—'}</strong></span>`;
          }).join('')}
        </div>
        <div class="data-section-actions">
          <button class="btn btn-ghost btn-sm" data-action="reset-quiz" data-id="${user.id}" data-bolum="1">B1 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-quiz" data-id="${user.id}" data-bolum="2">B2 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-quiz" data-id="${user.id}" data-bolum="3">B3 Sıfırla</button>
          <button class="btn btn-ghost btn-sm" data-action="reset-quiz-all" data-id="${user.id}" style="color:var(--danger)">Tümünü Sıfırla</button>
        </div>
      </div>
      <div class="data-section">
        <div class="data-section-title">🏅 Sertifika Yönetimi</div>
        <div style="margin-bottom:6px">
          ${[1,2,3].map(b => {
            const cert = certs.find(c => c.bolum_id === b);
            return cert
              ? `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:0.8rem;">
                  <span style="color:var(--text)">🏅 B${b} — <code style="font-family:var(--font-mono);color:var(--acid)">${cert.certificate_no}</code></span>
                  <button class="btn-icon danger" data-action="revoke-cert" data-cert-id="${cert.id}" title="İptal Et">✕</button>
                 </div>`
              : `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:0.8rem;">
                  <span style="color:var(--text3)">○ Bölüm ${b} — sertifika yok</span>
                  <button class="btn btn-ghost btn-sm" data-action="issue-cert" data-id="${user.id}" data-name="${user.full_name||user.username}" data-bolum="${b}">+ Ver</button>
                 </div>`;
          }).join('')}
        </div>
      </div>
    `;
    document.getElementById('dataManageBody').innerHTML = html;
  }

  // ── Modal Sekme Geçişi ────────────────────────────
  function activateTab(name) {
    const map = { detail: 'tabDetail', edit: 'tabEdit', data: 'tabData' };
    document.querySelectorAll('.admin-modal-tab').forEach(t =>
      t.classList.toggle('active', t.dataset.tab === name)
    );
    Object.values(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.display = 'none'; el.classList.remove('active'); }
    });
    const target = document.getElementById(map[name]);
    if (target) { target.style.display = 'block'; target.classList.add('active'); }
  }

  // ── Sertifikalar Paneli ───────────────────────────
  async function loadCertificates() {
    const body = document.getElementById('certsTableBody');
    body.innerHTML = '<tr><td colspan="5" class="admin-loading"><div class="spinner"></div> Yükleniyor…</td></tr>';
    try {
      const bolum = document.getElementById('certBolumFilter').value;
      let url = '/admin/certificates?';
      if (bolum) url += `bolum_id=${bolum}`;

      const res = await API.request('GET', url);
      if (!res || !res.ok) throw new Error();
      const { certificates } = await res.json();

      if (!certificates.length) {
        body.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">🏅</div><div class="empty-state-text">Sertifika bulunamadı</div></div></td></tr>';
        return;
      }

      body.innerHTML = certificates.map(c => `
        <tr>
          <td><code style="font-family:var(--font-mono);font-size:0.8rem;color:var(--acid)">${c.certificate_no}</code></td>
          <td>
            <div class="user-cell">
              <img class="user-avatar-sm" src="${avatarSrc(c.avatar_seed || c.username)}" alt="">
              <div class="user-info-sm">
                <div class="user-name">${c.full_name || c.username}</div>
                <div class="user-email">${c.email}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-student">Bölüm ${c.bolum_id}</span></td>
          <td style="font-size:0.8rem;color:var(--text3)">${formatDate(c.issued_at)}</td>
          <td><button class="btn-icon danger" title="İptal Et" data-action="revoke-cert" data-cert-id="${c.id}">🗑</button></td>
        </tr>
      `).join('');
    } catch(e) {
      body.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Yüklenemedi</div></div></td></tr>';
    }
  }

  // ── Loglar Paneli ─────────────────────────────────
  async function loadLogs(reset = false) {
    if (reset) { logsOffset = 0; document.getElementById('logsTableBody').innerHTML = ''; }
    try {
      const event = document.getElementById('logEventFilter').value;
      let url = `/admin/logs?limit=50&offset=${logsOffset}`;
      if (event) url += `&event_type=${event}`;

      const res = await API.request('GET', url);
      if (!res || !res.ok) throw new Error();
      const { logs, total } = await res.json();

      const body = document.getElementById('logsTableBody');
      if (logsOffset === 0) body.innerHTML = '';

      if (!logs.length && logsOffset === 0) {
        body.innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">📋</div><div class="empty-state-text">Log bulunamadı</div></div></td></tr>';
        return;
      }

      body.insertAdjacentHTML('beforeend', logs.map(l => `
        <tr>
          <td style="color:var(--text3);font-size:0.75rem">#${l.id}</td>
          <td><span class="log-event ${logEventClass(l.event_type)}">${logEventLabel(l.event_type)}</span></td>
          <td>
            <div style="font-size:0.8rem;font-weight:600;color:var(--text)">${l.username || '—'}</div>
            <div style="font-size:0.7rem;color:var(--text3)">${l.email || ''}</div>
          </td>
          <td style="font-size:0.75rem;color:var(--text3);font-family:var(--font-mono)">${l.ip_address || '—'}</td>
          <td style="font-size:0.75rem;color:var(--text3)">${formatDate(l.created_at)}</td>
        </tr>
      `).join(''));

      logsOffset += logs.length;
      document.getElementById('loadMoreLogs').style.display = logsOffset >= total ? 'none' : 'inline-flex';
    } catch(e) {
      if (logsOffset === 0) {
        document.getElementById('logsTableBody').innerHTML = '<tr><td colspan="5"><div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Loglar yüklenemedi</div></div></td></tr>';
      }
    }
  }

  // ── Veritabanı Paneli ─────────────────────────────
  async function loadDbStats() {
    const grid = document.getElementById('dbStatGrid');
    grid.innerHTML = '<div class="admin-loading"><div class="spinner"></div> Yükleniyor…</div>';
    try {
      const res = await API.request('GET', '/admin/db-stats');
      if (!res || !res.ok) throw new Error();
      const { tables } = await res.json();
      grid.innerHTML = tables.map(t => `
        <div class="stat-card">
          <div class="stat-card-icon">${t.icon}</div>
          <div class="stat-card-value">${t.count.toLocaleString('tr-TR')}</div>
          <div class="stat-card-label">${t.label}</div>
          <div style="font-size:0.65rem;color:var(--text3);font-family:var(--font-mono);margin-top:2px">${t.name}</div>
        </div>
      `).join('');
    } catch(e) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-state-icon">⚠️</div><div>Yüklenemedi</div></div>';
    }
  }

  // ── Event Delegation ──────────────────────────────
  function handleTableAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    const id     = parseInt(btn.dataset.id);
    const name   = btn.dataset.name || '';

    if (action === 'detail')             { openUserDetail(id); return; }
    if (action === 'reset')              { openResetModal(id, name); return; }
    if (action === 'toggle')             { toggleUserStatus(id, btn.dataset.active === '1' || btn.dataset.active === 'true'); return; }
    if (action === 'delete')             { confirmDeleteUser(id, name); return; }
    if (action === 'make-admin')         { setRole(id, 'admin'); return; }
    if (action === 'make-student')       { setRole(id, 'student'); return; }
    if (action === 'reset-progress')     { doResetProgress(id, parseInt(btn.dataset.bolum)); return; }
    if (action === 'reset-progress-all') { doResetProgress(id, null); return; }
    if (action === 'reset-quiz')         { doResetQuiz(id, parseInt(btn.dataset.bolum)); return; }
    if (action === 'reset-quiz-all')     { doResetQuiz(id, null); return; }
    if (action === 'revoke-cert')        { doRevokeCert(parseInt(btn.dataset.certId)); return; }
    if (action === 'issue-cert')         { openIssueCertModal(id, name, parseInt(btn.dataset.bolum)); return; }
  }

  // ── Şifre Sıfırla ─────────────────────────────────
  function openResetModal(userId, userName) {
    resetTargetId = userId; resetTargetName = userName;
    document.getElementById('resetTargetInfo').textContent = `Kullanıcı: ${userName} (ID: ${userId})`;
    showModal('resetModal');
  }
  async function doResetPassword() {
    closeModal('resetModal');
    try {
      const res = await API.request('POST', `/admin/users/${resetTargetId}/reset-password`);
      if (!res || !res.ok) throw new Error();
      const data = await res.json();
      document.getElementById('resultPassword').textContent = data.temp_password;
      showModal('passwordResultModal');
      toast('Şifre sıfırlandı');
      loadUsers();
    } catch(e) { toast('Şifre sıfırlanamadı', 'error'); }
  }

  // ── Aktif/Pasif ───────────────────────────────────
  async function toggleUserStatus(userId, currentlyActive) {
    try {
      const res = await API.request('PUT', `/admin/users/${userId}/status`, { is_active: !currentlyActive });
      if (!res || !res.ok) throw new Error();
      toast(!currentlyActive ? 'Kullanıcı aktifleştirildi' : 'Kullanıcı devre dışı bırakıldı');
      closeModal('userModal'); loadUsers();
    } catch(e) { toast('İşlem başarısız', 'error'); }
  }

  // ── Rol ──────────────────────────────────────────
  async function setRole(userId, role) {
    try {
      const res = await API.request('PUT', `/admin/users/${userId}/role`, { role });
      if (!res || !res.ok) throw new Error();
      toast(`Rol "${role === 'admin' ? 'Admin' : 'Öğrenci'}" olarak değiştirildi`);
      closeModal('userModal'); loadUsers();
    } catch(e) { toast('Rol değiştirilemedi', 'error'); }
  }

  // ── Kullanıcı Sil ─────────────────────────────────
  function confirmDeleteUser(userId, userName) {
    if (!confirm(`"${userName}" kullanıcısını silmek istediğinizden emin misiniz?\nBu işlem geri alınamaz!`)) return;
    deleteUser(userId);
  }
  async function deleteUser(userId) {
    try {
      const res = await API.request('DELETE', `/admin/users/${userId}`);
      if (!res || !res.ok) { const d = await res.json(); toast(d.error || 'Silinemedi', 'error'); return; }
      toast('Kullanıcı silindi');
      closeModal('userModal'); loadUsers();
    } catch(e) { toast('Silme başarısız', 'error'); }
  }

  // ── Profil Düzenle ────────────────────────────────
  async function saveProfile(e) {
    e.preventDefault();
    const userId = parseInt(document.getElementById('editUserId').value);
    const body = {
      full_name: document.getElementById('editFullName').value,
      email:     document.getElementById('editEmail').value,
      phone:     document.getElementById('editPhone').value,
      bio:       document.getElementById('editBio').value
    };
    try {
      const res = await API.request('PUT', `/admin/users/${userId}/profile`, body);
      if (!res || !res.ok) { const d = await res.json(); toast(d.error || 'Güncellenemedi', 'error'); return; }
      toast('Profil güncellendi');
      openUserDetail(userId);
      loadUsers();
    } catch(e) { toast('Güncelleme başarısız', 'error'); }
  }

  // ── İlerleme Sıfırla ──────────────────────────────
  async function doResetProgress(userId, bolumId) {
    const label = bolumId ? `Bölüm ${bolumId}` : 'tüm bölümler';
    if (!confirm(`${label} ilerlemesi sıfırlanacak. Onaylıyor musunuz?`)) return;
    try {
      const url = bolumId ? `/admin/users/${userId}/progress?bolum_id=${bolumId}` : `/admin/users/${userId}/progress`;
      const res = await API.request('DELETE', url);
      if (!res || !res.ok) throw new Error();
      toast((await res.json()).message);
      openUserDetail(userId);
    } catch(e) { toast('Sıfırlanamadı', 'error'); }
  }

  // ── Quiz Sıfırla ──────────────────────────────────
  async function doResetQuiz(userId, bolumId) {
    const label = bolumId ? `Bölüm ${bolumId}` : 'tüm bölümler';
    if (!confirm(`${label} quiz sonuçları sıfırlanacak. Onaylıyor musunuz?`)) return;
    try {
      const url = bolumId ? `/admin/users/${userId}/quiz?bolum_id=${bolumId}` : `/admin/users/${userId}/quiz`;
      const res = await API.request('DELETE', url);
      if (!res || !res.ok) throw new Error();
      toast((await res.json()).message);
      openUserDetail(userId);
    } catch(e) { toast('Sıfırlanamadı', 'error'); }
  }

  // ── Sertifika İptal ───────────────────────────────
  async function doRevokeCert(certId) {
    if (!confirm('Sertifika iptal edilecek. Bu işlem geri alınamaz!')) return;
    try {
      const res = await API.request('DELETE', `/admin/certificates/${certId}`);
      if (!res || !res.ok) throw new Error();
      toast('Sertifika iptal edildi');
      loadCertificates();
      const editId = document.getElementById('editUserId').value;
      if (editId) openUserDetail(parseInt(editId));
    } catch(e) { toast('İptal başarısız', 'error'); }
  }

  // ── Sertifika Ver ─────────────────────────────────
  function openIssueCertModal(userId, userName, defaultBolum) {
    issueCertUserId = userId; issueCertUserName = userName;
    document.getElementById('issueCertInfo').textContent = `Kullanıcı: ${userName}`;
    if (defaultBolum) document.getElementById('issueCertBolum').value = defaultBolum;
    showModal('issueCertModal');
  }
  async function doIssueCert() {
    const bolumId = parseInt(document.getElementById('issueCertBolum').value);
    closeModal('issueCertModal');
    try {
      const res = await API.request('POST', `/admin/users/${issueCertUserId}/certificates`, { bolum_id: bolumId });
      if (!res || !res.ok) { const d = await res.json(); toast(d.error || 'Verilemedi', 'error'); return; }
      const d = await res.json();
      toast(`Sertifika verildi: ${d.certificate_no}`);
      loadCertificates();
      openUserDetail(issueCertUserId);
    } catch(e) { toast('Sertifika verilemedi', 'error'); }
  }

  // ── Log Temizle ───────────────────────────────────
  function openClearLogsModal(days) {
    clearLogsDays = days;
    document.getElementById('clearLogsInfo').textContent =
      `${days} günden eski tüm loglar silinecek. Bu işlem geri alınamaz!`;
    showModal('clearLogsModal');
  }
  async function doClearLogs() {
    closeModal('clearLogsModal');
    try {
      const res = await API.request('DELETE', `/admin/logs?days=${clearLogsDays}`);
      if (!res || !res.ok) throw new Error();
      toast((await res.json()).message);
      loadLogs(true);
      loadDbStats();
    } catch(e) { toast('Temizlenemedi', 'error'); }
  }

  // ── Başlatma ──────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async function () {
    const authed = await API.checkAuth();
    if (!authed) { window.location.href = '/auth/login.html'; return; }
    const user = await API.auth.me();
    if (!user || user.role !== 'admin') { window.location.href = '/dashboard/index.html'; return; }

    document.querySelector('[data-admin-name]').textContent = user.full_name || user.username;
    document.querySelector('[data-admin-avatar]').src = avatarSrc(user.avatar_seed || user.username);

    loadStats(); loadRecentUsers(); loadRecentLogs(); initNav();

    // Modal kapat
    ['closeUserModal','closeResetModal','closePasswordResult','closeClearLogsModal',
     'cancelReset','cancelClearLogs','closeIssueCertModal','cancelIssueCert'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', () => {
        if (id.includes('Reset') || id.includes('closeReset') || id === 'cancelReset') closeModal('resetModal');
        else if (id.includes('Logs') || id.includes('clearLogs')) closeModal('clearLogsModal');
        else if (id.includes('Cert') && !id.includes('close')) closeModal('issueCertModal');
        else if (id === 'closeIssueCertModal') closeModal('issueCertModal');
        else if (id === 'closePasswordResult') closeModal('passwordResultModal');
        else if (id === 'closeUserModal') closeModal('userModal');
      });
    });
    document.getElementById('cancelEdit').addEventListener('click', () => activateTab('detail'));

    // Modal sekme geçişi
    document.querySelectorAll('.admin-modal-tab').forEach(tab => {
      tab.addEventListener('click', () => activateTab(tab.dataset.tab));
    });

    // İşlemler
    document.getElementById('confirmReset').addEventListener('click', doResetPassword);
    document.getElementById('copyPassword').addEventListener('click', () => {
      navigator.clipboard.writeText(document.getElementById('resultPassword').textContent)
        .then(() => toast('Şifre kopyalandı'));
    });
    document.getElementById('editProfileForm').addEventListener('submit', saveProfile);
    document.getElementById('confirmClearLogs').addEventListener('click', doClearLogs);
    document.getElementById('clearLogsBtn').addEventListener('click', () => openClearLogsModal(30));
    document.getElementById('dbClearLogsBtn').addEventListener('click', () =>
      openClearLogsModal(parseInt(document.getElementById('clearDaysSelect').value))
    );
    document.getElementById('clearExpiredTokensBtn').addEventListener('click', () =>
      toast('Süresi dolan tokenlar sunucu yeniden başlatılınca otomatik temizlenir', 'error')
    );
    document.getElementById('confirmIssueCert').addEventListener('click', doIssueCert);

    // Yenile
    document.getElementById('refreshBtn').addEventListener('click', () => {
      const panel = document.querySelector('.admin-panel.active').id.replace('panel-', '');
      if (panel === 'dashboard')    { loadStats(); loadRecentUsers(); loadRecentLogs(); }
      if (panel === 'users')        loadUsers();
      if (panel === 'certificates') loadCertificates();
      if (panel === 'logs')         loadLogs(true);
      if (panel === 'database')     loadDbStats();
      toast('Yenilendi');
    });

    // Delegation
    ['usersTableBody','userModalBody','dataManageBody','certsTableBody'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('click', handleTableAction);
    });

    // Filtreler
    let searchTimer;
    document.getElementById('userSearch').addEventListener('input', () => {
      clearTimeout(searchTimer); searchTimer = setTimeout(loadUsers, 350);
    });
    document.getElementById('roleFilter').addEventListener('change', loadUsers);
    document.getElementById('statusFilter').addEventListener('change', loadUsers);
    document.getElementById('certBolumFilter').addEventListener('change', loadCertificates);
    document.getElementById('logEventFilter').addEventListener('change', () => loadLogs(true));
    document.getElementById('loadMoreLogs').addEventListener('click', () => loadLogs(false));

    // Logout
    document.querySelector('[data-logout]').addEventListener('click', async () => {
      await API.auth.logout();
      window.location.href = '/auth/login.html';
    });
  });

})();
