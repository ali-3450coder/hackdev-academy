// HackDev Academy — Dashboard İstemci Mantığı
// Copyright © 2025 Muhammed Ali. Tüm hakları saklıdır.

(function() {
  'use strict';

  const BOLUM_TOPICS = { 1: 21, 2: 26, 3: 21 };
  const BOLUM_NAMES = {
    1: 'Web & HTML Temelleri',
    2: "HTML'deki Tüm Etiketler",
    3: 'Profesyonel HTML'
  };
  const BOLUM_URLS = {
    1: '/bolum/01-web-html-temelleri.html',
    2: '/bolum/02-html-etiketleri.html',
    3: '/bolum/03-profesyonel-html.html'
  };

  function $(id) { return document.getElementById(id); }

  // Zaman formatlama
  function formatTime(sec) {
    if (!sec || sec === 0) return '0dk';
    if (sec < 60) return sec + 'sn';
    const m = Math.floor(sec / 60);
    if (m < 60) return m + 'dk';
    return Math.floor(m / 60) + 'sa ' + (m % 60) + 'dk';
  }

  // Tarih formatlama
  function formatDate(isoStr) {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Aktivite tipi Türkçe
  function eventLabel(type) {
    const map = {
      login: '🔐 Giriş yapıldı',
      logout: '🚪 Çıkış yapıldı',
      register: '🎉 Hesap oluşturuldu',
      quiz_submit: '📝 Quiz tamamlandı',
      quiz_answer: '✏️ Quiz cevaplandı',
      bolum_complete: '🏆 Bölüm tamamlandı',
      page_view: '👁 Sayfa görüntülendi',
      password_change: '🔑 Şifre değiştirildi'
    };
    return map[type] || type;
  }

  // SVG dairesel ilerleme
  function buildCircularProgress(pct, size = 80, stroke = 6) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--bg4)" stroke-width="${stroke}"/>
      <circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none"
        stroke="var(--acid)" stroke-width="${stroke}"
        stroke-dasharray="${dash} ${circ}" stroke-dashoffset="0"
        stroke-linecap="round"
        transform="rotate(-90 ${size/2} ${size/2})"
        style="transition:stroke-dasharray 0.8s ease"/>
      <text x="${size/2}" y="${size/2+6}" text-anchor="middle"
        fill="var(--text)" font-size="14" font-weight="600"
        font-family="var(--font-mono)">${pct}%</text>
    </svg>`;
  }

  // Kullanıcı bilgilerini yükle
  async function loadUser() {
    const user = await API.auth.me();
    if (!user) {
      window.location.href = '/auth/login.html';
      return null;
    }

    // Adı güncelle
    const nameEl = document.querySelector('[data-user-name]');
    if (nameEl) nameEl.textContent = user.full_name || user.username;

    const greet = $('greetingName');
    if (greet) greet.textContent = user.full_name ? user.full_name.split(' ')[0] : user.username;

    // Avatar (DiceBear)
    const avatarEl = document.querySelector('[data-user-avatar]');
    if (avatarEl) {
      const seed = user.avatar_seed || user.username;
      avatarEl.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b8f535&textColor=080c12`;
      avatarEl.alt = user.username;
    }

    // Rol
    const roleEl = $('userRole');
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Yönetici' : 'Öğrenci';

    // Profil formu
    const profileInput = $('profileFullName');
    if (profileInput) profileInput.value = user.full_name || '';

    return user;
  }

  // Tarih
  function loadDate() {
    const el = $('currentDate');
    if (!el) return;
    el.textContent = new Date().toLocaleDateString('tr-TR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });
  }

  // İlerleme verilerini yükle
  async function loadProgress() {
    const data = await API.progress.dashboard();
    if (!data) return;

    // Genel ilerleme
    const overallEl = $('overallPercent');
    const overallBar = $('overallBar');
    if (overallEl) overallEl.textContent = data.overall_percent + '%';
    if (overallBar) overallBar.style.width = data.overall_percent + '%';

    // İstatistikler
    let totalCompleted = 0, totalTime = 0;
    let quizScores = [], quizCount = 0;

    data.bolumler.forEach(b => {
      totalCompleted += b.tamamlanan_konu;
      totalTime += b.time_spent_sec;
      if (b.quiz_total > 0) {
        quizScores.push(Math.round((b.quiz_score / b.quiz_total) * 100));
        quizCount++;
      }
    });

    const completedEl = $('completedTopics');
    if (completedEl) completedEl.textContent = totalCompleted;

    const timeEl = $('totalTime');
    if (timeEl) timeEl.textContent = formatTime(totalTime);

    const avgEl = $('quizAvg');
    if (avgEl) {
      const avg = quizScores.length > 0
        ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
        : 0;
      avgEl.textContent = avg + '%';
    }

    // Bölüm kartları
    data.bolumler.forEach((b, i) => {
      const idx = i + 1;
      const total = BOLUM_TOPICS[idx];
      const pct = total > 0 ? Math.round((b.tamamlanan_konu / total) * 100) : 0;

      // Progress bar
      const bar = document.querySelector(`#bolumCard${idx} .progress-fill`);
      if (bar) bar.style.width = pct + '%';

      // Konu sayısı
      const done = document.querySelector(`#bolumCard${idx} .done-count`);
      if (done) done.textContent = b.tamamlanan_konu;

      const pctEl = document.querySelector(`#bolumCard${idx} .bolum-pct`);
      if (pctEl) pctEl.textContent = pct + '%';

      // Quiz skoru
      const scoreEl = document.querySelector(`#bolumCard${idx} .bolum-quiz-score`);
      if (scoreEl) {
        if (b.quiz_total > 0) {
          const scorePct = Math.round((b.quiz_score / b.quiz_total) * 100);
          const passed = b.quiz_passed;
          scoreEl.innerHTML = `Quiz: <span style="color:${passed ? 'var(--success)' : 'var(--danger)'}">${b.quiz_score}/${b.quiz_total} (${scorePct}%)</span>`;
        } else {
          scoreEl.textContent = 'Quiz bekleniyor';
        }
      }

      // Aksiyon butonu
      const actionBtn = document.querySelector(`#bolumCard${idx} .bolum-action-btn`);
      if (actionBtn) {
        actionBtn.onclick = () => { window.location.href = BOLUM_URLS[idx]; };
        actionBtn.textContent = b.tamamlanan_konu > 0 ? '→ Devam Et' : '→ Başla';
      }

      // Kilit kontrolü (Bölüm 2 için Bölüm 1 quizi, Bölüm 3 için Bölüm 2 quizi)
      const lockOverlay = document.querySelector(`#bolumCard${idx} .lock-overlay`);
      const card = document.getElementById(`bolumCard${idx}`);
      if (lockOverlay && idx > 1) {
        const prevBolum = data.bolumler[idx - 2];
        if (!prevBolum?.quiz_passed) {
          lockOverlay.style.display = 'flex';
          if (card) card.classList.add('locked');
          if (actionBtn) {
            actionBtn.disabled = true;
            actionBtn.title = `Önce Bölüm ${idx-1} quizini tamamlayın`;
          }
        } else {
          lockOverlay.style.display = 'none';
          if (card) card.classList.remove('locked');
        }
      }
    });
  }

  // Aktivite logları
  async function loadActivity() {
    const logs = await API.user.getActivity();
    const listEl = $('activityList');
    if (!listEl) return;

    if (!logs || logs.length === 0) {
      listEl.innerHTML = '<div class="activity-empty">Henüz aktivite yok</div>';
      return;
    }

    listEl.innerHTML = logs.slice(0, 10).map(log => {
      const d = new Date(log.created_at);
      const timeStr = d.toLocaleString('tr-TR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
      return `<div class="activity-item fade-in">
        <span class="activity-icon">${eventLabel(log.event_type).split(' ')[0]}</span>
        <div class="activity-text">
          <span class="activity-event">${eventLabel(log.event_type).slice(2)}</span>
          <span class="activity-time">${timeStr}</span>
        </div>
      </div>`;
    }).join('');
  }

  // Profil formu
  function initProfileForms() {
    const fullNameForm = $('fullNameForm');
    if (fullNameForm) {
      fullNameForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const full_name = $('profileFullName')?.value.trim();
        const feedback = $('profileFeedback');

        if (!full_name || full_name.length < 2) {
          if (feedback) {
            feedback.className = 'alert alert-danger';
            feedback.textContent = 'Ad soyad en az 2 karakter olmalı';
            feedback.classList.remove('hidden');
          }
          return;
        }

        const btn = fullNameForm.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;

        const result = await API.user.updateProfile({ full_name });

        if (feedback) {
          feedback.classList.remove('hidden');
          if (result.ok) {
            feedback.className = 'alert alert-success';
            feedback.textContent = '✓ Ad soyad güncellendi';
            // UI güncelle
            document.querySelectorAll('[data-user-name]').forEach(el => el.textContent = full_name);
            const greet = $('greetingName');
            if (greet) greet.textContent = full_name.split(' ')[0];
          } else {
            feedback.className = 'alert alert-danger';
            feedback.textContent = result.error || 'Güncelleme başarısız';
          }
          setTimeout(() => feedback.classList.add('hidden'), 4000);
        }
        if (btn) btn.disabled = false;
      });
    }

    const passwordForm = $('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const current = $('currentPassword')?.value;
        const newPw = $('newPassword')?.value;
        const newPw2 = $('newPassword2')?.value;
        const feedback = $('passwordFeedback');

        if (!current || !newPw || !newPw2) {
          if (feedback) {
            feedback.className = 'alert alert-danger';
            feedback.textContent = 'Tüm alanları doldurun';
            feedback.classList.remove('hidden');
          }
          return;
        }

        if (newPw !== newPw2) {
          if (feedback) {
            feedback.className = 'alert alert-danger';
            feedback.textContent = 'Yeni şifreler eşleşmiyor';
            feedback.classList.remove('hidden');
          }
          return;
        }

        const btn = passwordForm.querySelector('button[type=submit]');
        if (btn) btn.disabled = true;

        const result = await API.user.changePassword({
          current_password: current,
          new_password: newPw
        });

        if (feedback) {
          feedback.classList.remove('hidden');
          if (result.ok) {
            feedback.className = 'alert alert-success';
            feedback.textContent = '✓ Şifre başarıyla değiştirildi';
            passwordForm.reset();
          } else {
            feedback.className = 'alert alert-danger';
            feedback.textContent = result.error || 'Şifre değiştirme başarısız';
          }
          setTimeout(() => feedback.classList.add('hidden'), 5000);
        }
        if (btn) btn.disabled = false;
      });
    }
  }

  // Sidebar hamburger (mobil)
  function initSidebar() {
    const hamburger = $('hamburger');
    const sidebar = document.querySelector('.sidebar');
    if (!hamburger || !sidebar) return;

    hamburger.addEventListener('click', function() {
      sidebar.classList.toggle('sidebar-open');
    });

    document.addEventListener('click', function(e) {
      if (!sidebar.contains(e.target) && !hamburger.contains(e.target)) {
        sidebar.classList.remove('sidebar-open');
      }
    });
  }

  // Başlat
  document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const refreshed = await API.checkAuth();
    if (!refreshed) {
      window.location.href = '/auth/login.html';
      return;
    }

    await loadUser();
    loadDate();
    await Promise.all([loadProgress(), loadActivity()]);
    initProfileForms();
    initSidebar();

    // Logout butonları
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', async function() {
        await API.auth.logout();
        window.location.href = '/auth/login.html';
      });
    });

    // Profil linkine scroll
    document.querySelectorAll('a[href="#profile"]').forEach(a => {
      a.addEventListener('click', function(e) {
        e.preventDefault();
        $('profile')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  });
})();
