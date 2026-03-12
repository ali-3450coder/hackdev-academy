// HackDev Academy — Bölüm Sayfası İstemci Mantığı
// Copyright © 2025 Muhammed Ali. Tüm hakları saklıdır.

(function() {
  'use strict';

  // Bölüm konfigürasyonu (her bölüm sayfası data attribute ile belirtir)
  const BOLUM_ID = parseInt(document.body.dataset.bolumId || '1');
  const TOTAL_KONU = document.querySelectorAll('[data-konu-id]').length;

  // Süre takibi
  let lastSentTime = Date.now();
  let activeKonuId = null;
  let completedKonular = new Set();

  // Topbar progress güncelle
  function updateTopbarProgress() {
    const count = completedKonular.size;
    const label = document.getElementById('topbarProgressLabel');
    const bar = document.getElementById('topbarProgressBar');
    if (label) label.textContent = `${count}/${TOTAL_KONU}`;
    if (bar) bar.style.width = TOTAL_KONU > 0 ? (count / TOTAL_KONU * 100) + '%' : '0%';
  }

  // Görünür konu takibi (IntersectionObserver)
  const konuObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.3) {
        const konuId = entry.target.dataset.konuId;
        if (konuId && konuId !== activeKonuId) {
          if (activeKonuId) markKonuCompleted(activeKonuId);
          activeKonuId = konuId;
          markKonuInProgress(konuId);
        }
      }
    });
  }, { threshold: 0.3 });

  function markKonuInProgress(konuId) {
    API.progress.updateKonu({
      bolum_id: BOLUM_ID,
      konu_id: konuId,
      status: 'in_progress',
      scroll_position: Math.round(window.scrollY),
      time_spent_sec: 0
    }).catch(() => {});
  }

  function markKonuCompleted(konuId) {
    if (!konuId || completedKonular.has(konuId)) return;
    completedKonular.add(konuId);

    const marker = document.querySelector(`[data-konu-marker="${konuId}"]`);
    if (marker) marker.classList.add('konu-completed');

    const section = document.querySelector(`[data-konu-id="${konuId}"] .konu-title`);
    if (section) section.classList.add('konu-done');

    updateTopbarProgress();

    API.progress.updateKonu({
      bolum_id: BOLUM_ID,
      konu_id: konuId,
      status: 'completed',
      scroll_position: Math.round(window.scrollY),
      time_spent_sec: 0
    }).catch(() => {});
  }

  // Süre gönderimi (her 30 saniye)
  setInterval(async function() {
    if (!activeKonuId) return;
    const now = Date.now();
    const elapsed = Math.round((now - lastSentTime) / 1000);
    lastSentTime = now;
    if (elapsed > 0) {
      await API.progress.updateKonu({
        bolum_id: BOLUM_ID,
        konu_id: activeKonuId,
        status: 'in_progress',
        scroll_position: Math.round(window.scrollY),
        time_spent_sec: elapsed
      }).catch(() => {});
    }
  }, 30000);

  // Sayfa terk edilirken son süreyi gönder
  window.addEventListener('beforeunload', function() {
    const elapsed = Math.round((Date.now() - lastSentTime) / 1000);
    if (activeKonuId && elapsed > 0) {
      navigator.sendBeacon('/api/progress/konu', JSON.stringify({
        bolum_id: BOLUM_ID,
        konu_id: activeKonuId,
        status: 'in_progress',
        scroll_position: Math.round(window.scrollY),
        time_spent_sec: elapsed
      }));
    }
  });

  // === GÖREV (TASK) YÖNETİMİ ===
  async function loadTasks(tasks) {
    if (!tasks || tasks.length === 0) return;
    tasks.forEach(task => {
      if (!task.completed) return;
      const checkbox = document.querySelector(`[data-task-id="${task.task_id}"]`);
      if (checkbox) {
        checkbox.checked = true;
        checkbox.closest('.task-item')?.classList.add('task-done');
      }
    });
  }

  function initTaskListeners() {
    document.querySelectorAll('[data-task-id]').forEach(checkbox => {
      checkbox.addEventListener('change', async function() {
        const taskId = checkbox.dataset.taskId;
        const completed = checkbox.checked;
        checkbox.closest('.task-item')?.classList.toggle('task-done', completed);

        await API.progress.updateTask({
          bolum_id: BOLUM_ID,
          task_id: taskId,
          completed
        }).catch(() => {});
      });
    });
  }

  // === KONU İLERLEME ===
  async function loadKonuProgress(progress) {
    if (!progress || progress.length === 0) return;

    progress.forEach(p => {
      if (p.status === 'completed') {
        completedKonular.add(p.konu_id);

        // Sidebar nav item işaretle
        const marker = document.querySelector(`[data-konu-marker="${p.konu_id}"]`);
        if (marker) marker.classList.add('konu-completed');

        // Konu başlığını işaretle
        const section = document.querySelector(`[data-konu-id="${p.konu_id}"] .konu-title`);
        if (section) section.classList.add('konu-done');
      }
    });

    updateTopbarProgress();
  }

  function initKonuObservers() {
    document.querySelectorAll('[data-konu-id]').forEach(section => {
      konuObserver.observe(section);
    });
  }

  // === QUIZ YÖNETİMİ ===
  let quizAnswers = {}; // { question_id: { selected: 'a', is_correct: bool } }
  let quizSubmitted = false;

  const QUIZ_DATA = window.QUIZ_DATA || {};

  async function loadQuizResults() {
    const data = await API.quiz.getResults(BOLUM_ID);
    if (!data) return;

    if (data.result) {
      quizSubmitted = true;
      data.answers.forEach(ans => {
        quizAnswers[ans.question_id] = {
          selected: ans.selected_ans,
          is_correct: !!ans.is_correct
        };
      });
      renderExistingAnswers(data.result, data.answers);
    }
  }

  function renderExistingAnswers(result, answers) {
    const quizSection = document.querySelector('.quiz-section');
    if (!quizSection) return;

    answers.forEach(ans => {
      const qEl = document.querySelector(`[data-question-id="${ans.question_id}"]`);
      if (!qEl) return;

      qEl.querySelectorAll('[data-answer]').forEach(opt => {
        opt.classList.remove('selected', 'correct', 'incorrect', 'wrong');
        if (opt.dataset.answer === ans.selected_ans) {
          opt.classList.add('selected', ans.is_correct ? 'correct' : 'incorrect');
        }
        const correct = QUIZ_DATA[ans.question_id]?.correct;
        if (correct && opt.dataset.answer === correct) {
          opt.classList.add('correct');
        }
      });

      const exp = qEl.querySelector('.answer-explanation');
      if (exp) exp.classList.remove('hidden');
    });

    showQuizResult(result.score, result.total, result.passed);

    const submitBtn = document.querySelector('#quizSubmit');
    if (submitBtn) submitBtn.style.display = 'none';

    const retryBtn = document.querySelector('#quizRetry');
    if (retryBtn) retryBtn.style.display = 'inline-flex';
  }

  function initQuizListeners() {
    // Cevap seçimi
    document.querySelectorAll('[data-answer]').forEach(opt => {
      opt.addEventListener('click', async function() {
        if (quizSubmitted) return;

        const qEl = opt.closest('[data-question-id]');
        if (!qEl) return;
        const questionId = qEl.dataset.questionId;
        const selected = opt.dataset.answer;
        const isCorrect = QUIZ_DATA[questionId]?.correct === selected;

        qEl.querySelectorAll('[data-answer]').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');

        quizAnswers[questionId] = { selected, is_correct: isCorrect };

        await API.quiz.submitAnswer({
          bolum_id: BOLUM_ID,
          question_id: questionId,
          selected_ans: selected,
          is_correct: isCorrect
        }).catch(() => {});
      });
    });

    // Quiz gönder
    const submitBtn = document.querySelector('#quizSubmit');
    if (submitBtn) {
      submitBtn.addEventListener('click', async function() {
        if (activeKonuId) markKonuCompleted(activeKonuId);

        const questions = document.querySelectorAll('[data-question-id]');
        const totalQ = questions.length;

        if (Object.keys(quizAnswers).length < totalQ) {
          alert(`Lütfen tüm ${totalQ} soruyu cevaplayın. (${Object.keys(quizAnswers).length}/${totalQ})`);
          return;
        }

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner"></span> Değerlendiriliyor...';

        const answers = Object.entries(quizAnswers).map(([qId, ans]) => ({
          question_id: qId,
          selected_ans: ans.selected,
          is_correct: ans.is_correct
        }));

        const correct = answers.filter(a => a.is_correct).length;
        const total = answers.length;

        const result = await API.quiz.submitAll({
          bolum_id: BOLUM_ID,
          answers,
          score: correct,
          total
        });

        if (!result) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = 'Hata — Sayfayı yenileyin';
          alert('Sonuçlar gönderilirken bir hata oluştu. Sayfayı yenileyip tekrar deneyin.');
          return;
        }

        quizSubmitted = true;

        answers.forEach(ans => {
          const qEl = document.querySelector(`[data-question-id="${ans.question_id}"]`);
          if (!qEl) return;

          qEl.querySelectorAll('[data-answer]').forEach(opt => {
            const correctAns = QUIZ_DATA[ans.question_id]?.correct;
            if (opt.dataset.answer === ans.selected_ans) {
              opt.classList.add(ans.is_correct ? 'correct' : 'incorrect');
            }
            if (correctAns && opt.dataset.answer === correctAns) {
              opt.classList.add('correct');
            }
          });

          const exp = qEl.querySelector('.answer-explanation');
          if (exp) exp.classList.remove('hidden');
        });

        showQuizResult(result.score, result.total, result.passed);
        submitBtn.style.display = 'none';

        const retryBtn = document.querySelector('#quizRetry');
        if (retryBtn) retryBtn.style.display = 'inline-flex';

        if (result.passed) {
          document.querySelectorAll('[data-next-bolum]').forEach(btn => {
            btn.removeAttribute('disabled');
            btn.removeAttribute('title');
            btn.classList.remove('btn-disabled');
          });
        }
      });
    }

    // Tekrar dene
    const retryBtn = document.querySelector('#quizRetry');
    if (retryBtn) {
      retryBtn.addEventListener('click', function() {
        quizAnswers = {};
        quizSubmitted = false;

        document.querySelectorAll('[data-answer]').forEach(opt => {
          opt.classList.remove('selected', 'correct', 'incorrect', 'wrong');
        });
        document.querySelectorAll('.answer-explanation').forEach(el => el.classList.add('hidden'));

        const resultEl = document.querySelector('.quiz-result');
        if (resultEl) resultEl.classList.add('hidden');

        const submitBtn = document.querySelector('#quizSubmit');
        if (submitBtn) {
          submitBtn.style.display = 'inline-flex';
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Sonucu Gör →';
        }
        retryBtn.style.display = 'none';
      });
    }
  }

  function showQuizResult(score, total, passed) {
    let resultEl = document.querySelector('.quiz-result');
    if (!resultEl) {
      resultEl = document.createElement('div');
      resultEl.className = 'quiz-result';
      document.querySelector('.quiz-section')?.appendChild(resultEl);
    }

    const pct = Math.round((score / total) * 100);
    const passThreshold = 70;

    resultEl.innerHTML = `
      <div class="quiz-result-inner ${passed ? 'passed' : 'failed'}">
        <div class="result-icon">${passed ? '🏆' : '📚'}</div>
        <div class="result-score">${score}/${total}</div>
        <div class="result-pct">${pct}%</div>
        <div class="result-msg">${passed
          ? '✓ Tebrikler! Bölümü başarıyla tamamladınız.'
          : `✗ Geçme eşiği %${passThreshold}. Tekrar deneyin.`}</div>
        ${passed ? `<div class="result-next-hint">Bir sonraki bölüme geçebilirsiniz →</div>` : ''}
      </div>`;
    resultEl.classList.remove('hidden');
    resultEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // === LOGOUT BUTONU ===
  function initLogout() {
    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', async function() {
        await API.auth.logout();
        window.location.href = '/auth/login.html';
      });
    });
  }

  // === SIDEBAR TOGGLE (MOBİL) ===
  function initSidebar() {
    const toggler = document.querySelector('[data-sidebar-toggle]');
    const sidebar = document.querySelector('.bolum-sidebar');
    if (!toggler || !sidebar) return;

    toggler.addEventListener('click', function(e) {
      e.stopPropagation();
      sidebar.classList.toggle('sidebar-open');
    });

    // Dışarı tıklayınca kapat
    document.addEventListener('click', function(e) {
      if (sidebar.classList.contains('sidebar-open') &&
          !sidebar.contains(e.target) &&
          !toggler.contains(e.target)) {
        sidebar.classList.remove('sidebar-open');
      }
    });
  }

  // === BAŞLATMA ===
  document.addEventListener('DOMContentLoaded', async function() {
    // Auth kontrolü
    const authed = await API.checkAuth();
    if (!authed) {
      window.location.href = '/auth/login.html';
      return;
    }

    // Kullanıcı bilgilerini yükle
    const user = await API.auth.me();
    if (user) {
      const nameEl = document.querySelector('[data-user-name]');
      if (nameEl) nameEl.textContent = user.full_name || user.username;

      const avatarEl = document.querySelector('[data-user-avatar]');
      if (avatarEl) {
        avatarEl.src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.avatar_seed || user.username)}&backgroundColor=b8f535&textColor=080c12`;
      }
    }

    // Topbar initial
    updateTopbarProgress();

    // Bölüm ilerlemesini yükle
    const bolumData = await API.progress.getBolum(BOLUM_ID);
    if (bolumData) {
      await loadKonuProgress(bolumData.progress);
      await loadTasks(bolumData.tasks);
    }

    // Quiz sonuçlarını yükle
    await loadQuizResults();

    // Observer ve dinleyiciler
    initKonuObservers();
    initTaskListeners();
    initQuizListeners();
    initLogout();
    initSidebar();

    // Bir sonraki bölüm butonu durumu kontrol
    const quizResults = await API.quiz.getResults(BOLUM_ID);
    if (quizResults?.result?.passed) {
      document.querySelectorAll('[data-next-bolum]').forEach(btn => {
        btn.removeAttribute('disabled');
        btn.removeAttribute('title');
        btn.classList.remove('btn-disabled');
      });
    }
  });

  window.BolumManager = { quizAnswers: () => quizAnswers };
})();
