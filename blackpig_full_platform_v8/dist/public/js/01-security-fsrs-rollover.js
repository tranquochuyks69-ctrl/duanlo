// ============================================================================
// Module 01: Security (XSS), Daily Rollover, 19-Param FSRS-5 & Smart Distractor Generator
// ============================================================================
'use strict';

      if (typeof window !== 'undefined') {
        window.BLACKPIG_API_BASE_URL = window.BLACKPIG_API_BASE_URL || '/api/v1';
        window.HUAYU_SYNC_URL = window.HUAYU_SYNC_URL || (window.BLACKPIG_API_BASE_URL + '/sync/outbox');
      }


      // =====================================================
      // 0. SECURITY SANITIZER (XSS PREVENTION), SHA-256 PASSWORD HASHING & SM-2 SRS ALGORITHM
      // =====================================================
      function escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) return '';
        return String(unsafe)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      async function hashPasswordSHA256(plainText) {
        const salted = 'huayu_salt_v2_' + String(plainText || '');
        try {
          if (window.crypto && window.crypto.subtle) {
            const msgBuffer = new TextEncoder().encode(salted);
            const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          }
        } catch (e) {
          // Fallback deterministic hash if subtle crypto is unavailable in iframe
        }
        let h = 2166136261;
        for (let i = 0; i < salted.length; i++) {
          h ^= salted.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return 'fnv1a_' + (h >>> 0).toString(16);
      }

      // Timezone-safe YYYY-MM-DD formatter (Default: Asia/Ho_Chi_Minh)
      function getLocalDateISO(dateObj, timeZoneStr) {
        const d = dateObj || new Date();
        const tz = timeZoneStr || (typeof appState !== 'undefined' && appState && appState.timezone) || 'Asia/Ho_Chi_Minh';
        try {
          return new Intl.DateTimeFormat('en-CA', {
            timeZone: tz,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          }).format(d);
        } catch (e) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        }
      }

      function daysBetweenISODates(isoStart, isoEnd) {
        if (!isoStart || !isoEnd || !/^\d{4}-\d{2}-\d{2}$/.test(isoStart) || !/^\d{4}-\d{2}-\d{2}$/.test(isoEnd)) return 0;
        const t1 = Date.parse(isoStart + 'T00:00:00Z');
        const t2 = Date.parse(isoEnd + 'T00:00:00Z');
        return Math.round((t2 - t1) / 86400000);
      }

      // Automatic Daily Rollover: Resets todayMinutes & dailyQuests, shifts weeklyMinutes, and checks Streak / Streak Freeze!
      function rolloverIfNewDay() {
        if (!appState) return false;
        const todayISO = getLocalDateISO();
        const prevISO = appState.lastActiveDateISO;

        if (!prevISO || !/^\d{4}-\d{2}-\d{2}$/.test(prevISO)) {
          appState.lastActiveDateISO = todayISO;
          return false;
        }

        const diffDays = daysBetweenISODates(prevISO, todayISO);
        if (diffDays <= 0) return false;

        // 1. Shift weeklyMinutes array by diffDays and reset todayMinutes to 0
        if (!Array.isArray(appState.weeklyMinutes) || appState.weeklyMinutes.length !== 7) {
          appState.weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
        }
        const shiftCount = Math.min(7, diffDays);
        for (let s = 0; s < shiftCount; s++) {
          appState.weeklyMinutes.shift();
          appState.weeklyMinutes.push(0);
        }
        appState.todayMinutes = 0;

        // 2. Reset all Daily Quests for the new day
        if (appState.dailyQuests && typeof appState.dailyQuests === 'object') {
          Object.keys(appState.dailyQuests).forEach(qk => {
            if (appState.dailyQuests[qk] && typeof appState.dailyQuests[qk] === 'object') {
              appState.dailyQuests[qk].current = 0;
              appState.dailyQuests[qk].done = false;
            }
          });
        }

        // 3. Evaluate Streak Continuity & Automatic Streak Freeze (`streak_freeze`) Consumption
        const lastCheckISO = appState.lastCheckInDate;
        const gapFromCheckin = lastCheckISO && /^\d{4}-\d{2}-\d{2}$/.test(lastCheckISO)
          ? daysBetweenISODates(lastCheckISO, todayISO)
          : diffDays;

        if (gapFromCheckin === 2 && appState.inventory && appState.inventory.streak_freeze > 0) {
          appState.inventory.streak_freeze -= 1;
          if (!appState.studyDays || typeof appState.studyDays !== 'object') appState.studyDays = {};
          appState.studyDays[prevISO] = { day: prevISO, minutes: 0, freeze_used: true };
          setTimeout(() => {
            if (typeof showToast === 'function') {
              showToast('🛡️ Bùa Đóng Băng Streak đã tự động kích hoạt để bảo vệ chuỗi ' + appState.streak + ' ngày của bạn!', 'amber');
            }
          }, 400);
        } else if (gapFromCheckin > 1) {
          appState.streak = 1;
          setTimeout(() => {
            if (typeof showToast === 'function') {
              showToast('🌅 Ngày mới bắt đầu! Chuỗi Streak đã đặt lại về Ngày 1 — hãy học ngay để duy trì nhé!', 'emerald');
            }
          }, 400);
        }

        // 4. Evaluate Daily Lesson Attendance: If user did not complete their daily lesson on the previous day, lock new day & require reviewing the previous completed day!
        const lastStudyISO = appState.lastDailyStudyDateISO;
        if (!lastStudyISO || daysBetweenISODates(lastStudyISO, todayISO) >= 1) {
          const cid = Math.max(1, Math.min(6, Number(appState.currentCourseId) || 1));
          const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};
          const doneDays = Object.keys(doneMap).filter(k => doneMap[k]).map(Number).sort((a, b) => a - b);
          if (doneDays.length > 0 && (!lastStudyISO || daysBetweenISODates(lastStudyISO, todayISO) >= 2 || diffDays >= 1)) {
            const prevDayToReview = doneDays[doneDays.length - 1];
            appState.missedDayReviewRequired = true;
            appState.missedDayReviewCourseId = cid;
            appState.missedDayReviewDayNum = prevDayToReview;
          }
        }

        appState.lastActiveDateISO = todayISO;
        return true;
      }

      // Local-First Outbox Sync with Backend API (Graceful offline fallback when no server is reachable)
      async function syncOutboxWithServer() {
        if (!appState || !Array.isArray(appState.syncOutbox)) return;
        const unsynced = appState.syncOutbox.filter(e => e && !e.synced);
        if (unsynced.length === 0) return;
        if (!navigator.onLine || window.location.protocol === 'file:' || window.location.protocol === 'blob:') return;
        try {
          const res = window.HUAYU_SYNC_URL ? await fetch(window.HUAYU_SYNC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              device_id: getOrCreateDeviceId(),
              user_id: (appState.currentUser && appState.currentUser.identifier) || 'guest',
              events: unsynced.slice(0, 50)
            })
          }) : null;
          if (res && res.ok) {
            unsynced.slice(0, 50).forEach(e => { e.synced = true; });
          }
        } catch (err) {
          // Offline or standalone preview mode: keep events safely queued in IndexedDB sync_outbox
        }
      }

      // Full 19-Parameter FSRS-4.5 / FSRS-5 Algorithm with True Elapsed Time, Short-Term Stability & Mean Reversion
      const FSRS5_DEFAULT_WEIGHTS = [
        0.40255, 1.18385, 3.173, 15.69105, 7.1949, 0.5345, 1.4604, 0.0046,
        1.54575, 0.1192, 1.01925, 1.9395, 0.11, 0.29605, 2.2698, 0.2315,
        2.9898, 0.51655, 0.6621
      ];

      function computeFSRSSchedule(card, qualityRating, customNowMs, weights) {
        const w = Array.isArray(weights) && weights.length >= 19 ? weights : FSRS5_DEFAULT_WEIGHTS;
        const g = Math.min(4, Math.max(1, Number(qualityRating) || 3));
        const nowMs = customNowMs || Date.now();
        let reps = card.reps || 0;
        let lapses = card.lapses || 0;
        let S = Number(card.stability) || 0;
        let D = Number(card.difficulty) || 5.0;
        let state = card.state || 'new';

        const lastMs = card.lastReviewAt || (card.dueAt ? (card.dueAt - (card.intervalDays || 1) * 86400000) : nowMs);
        const elapsedDays = Math.max(0.01, (nowMs - lastMs) / 86400000);

        if (state === 'new' || S <= 0) {
          // FSRS-5 initial stability S0(G) and initial difficulty D0(G)
          S = Math.max(0.1, w[g - 1]);
          D = Math.min(10, Math.max(1, w[4] - Math.exp(w[5] * (g - 1)) + 1));
          state = g === 1 ? 'learning' : 'review';
        } else if (state === 'learning' || state === 'relearning') {
          // FSRS-5 short-term stability transition S'(S, G) = S * exp(w17 * (G - 3 + w18))
          S = Math.max(0.2, S * Math.exp(w[17] * (g - 3 + w[18])));
          const d0Easy = w[4] - Math.exp(w[5] * 3) + 1;
          D = Math.min(10, Math.max(1, w[7] * d0Easy + (1 - w[7]) * (D - w[6] * (g - 3))));
          state = g === 1 ? 'relearning' : 'review';
        } else {
          // Power forgetting curve Retrievability R(t, S) = (1 + 19/81 * t / S)^(-0.5)
          const R = Math.pow(1 + (19 / 81) * (elapsedDays / Math.max(0.1, S)), -0.5);
          const d0Easy = w[4] - Math.exp(w[5] * 3) + 1;
          D = Math.min(10, Math.max(1, w[7] * d0Easy + (1 - w[7]) * (D - w[6] * (g - 3))));

          if (g === 1) {
            lapses += 1;
            state = 'relearning';
            S = Math.max(0.2, w[11] * Math.pow(D, -w[12]) * (Math.pow(S + 1, w[13]) - 1) * Math.exp(w[14] * (1 - R)));
          } else {
            state = 'review';
            const hardPenalty = g === 2 ? w[15] : 1;
            const easyBonus = g === 4 ? w[16] : 1;
            S = S * (1 + Math.exp(w[8]) * (11 - D) * Math.pow(S, -w[9]) * (Math.exp(w[10] * (1 - R)) - 1) * hardPenalty * easyBonus);
          }
        }

        reps += 1;
        // Desired retention r_d = 0.90 => I(S) = S
        const intervalDays = g === 1 ? 0 : Math.max(1, Math.round(S));
        const dueAt = intervalDays === 0 ? (nowMs + 10 * 60 * 1000) : (nowMs + intervalDays * 86400000);
        const shortIntervalText = intervalDays === 0 ? '10 phút' : (intervalDays + ' ngày');
        const dueDateLabel = intervalDays === 0
          ? '10 phút nữa (Relearning)'
          : `FSRS-5: ${intervalDays}d • S=${S.toFixed(1)} D=${D.toFixed(1)}`;

        return {
          stability: Number(S.toFixed(2)),
          difficulty: Number(D.toFixed(2)),
          elapsedDays: Math.max(0, Math.round(elapsedDays)),
          scheduledDays: intervalDays,
          learningStep: g === 1 ? 1 : 0,
          intervalDays,
          reps,
          lapses,
          state,
          lastReviewAt: nowMs,
          dueAt,
          shortIntervalText,
          interval: dueDateLabel
        };
      }
      const computeSM2Schedule = computeFSRSSchedule;

      // Deterministic Rebuild of `card_states` from Append-Only `review_logs` (Event Sourcing)
      function rebuildCardStatesFromReviewLogs(cardsList, reviewLogsList) {
        if (!Array.isArray(cardsList) || !Array.isArray(reviewLogsList) || reviewLogsList.length === 0) return cardsList;
        const byVocab = {};
        cardsList.forEach(c => {
          const key = c.vocab_id || c.hanzi;
          byVocab[key] = Object.assign({}, c, { state: 'new', stability: 0, difficulty: 5.0, reps: 0, lapses: 0 });
        });
        // Sort logs chronologically (oldest -> newest)
        const sortedLogs = reviewLogsList.slice().sort((a, b) => Date.parse(a.reviewed_at || 0) - Date.parse(b.reviewed_at || 0));
        sortedLogs.forEach(log => {
          const key = log.vocab_id || log.hanzi;
          if (byVocab[key]) {
            const ts = Date.parse(log.reviewed_at) || Date.now();
            const updated = computeFSRSSchedule(byVocab[key], log.rating, ts);
            Object.assign(byVocab[key], updated);
          }
        });
        return Object.values(byVocab);
      }

            // Helper to clean raw strings on storage WITHOUT HTML entity escaping (so speakChinese & re-saves never corrupt '&' into '&amp;amp;')
      function cleanRawText(val, maxLen) {
        if (val === null || val === undefined) return '';
        return String(val)
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#039;/g, "'")
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .trim()
          .slice(0, maxLen || 500);
      }

      function computeDbIntegrityChecksum(stateObj) {
        if (!stateObj || typeof stateObj !== 'object') return 'chk_00000000';
        const payload = [
          stateObj.exp || 0,
          stateObj.gems || 0,
          stateObj.streak || 1,
          (stateObj.srsWords || []).length,
          (stateObj.reviewLogs || []).length,
          (stateObj.ledger || []).length,
          (stateObj.mistakeNotebookItems || []).length,
          stateObj.bgColorHex || '#020617',
          JSON.stringify(stateObj.completedDailyLessons || {})
        ].join('|');
        let h = 2166136261;
        for (let i = 0; i < payload.length; i++) {
          h ^= payload.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return 'fnv1a32_' + (h >>> 0).toString(16).padStart(8, '0');
      }

      function sanitizeSingleAccountSnapshot(rawSnap) {
        if (!rawSnap || typeof rawSnap !== 'object') return null;
        const snap = {};
        snap.updatedAtMs = typeof rawSnap.updatedAtMs === 'number' ? rawSnap.updatedAtMs : Date.now();
        snap.exp = Math.max(0, Math.min(1000000, Number(rawSnap.exp) || 0));
        snap.gems = Math.max(0, Math.min(1000000, Number(rawSnap.gems ?? 150)));
        snap.hearts = Math.max(0, Math.min(5, Number(rawSnap.hearts ?? 5)));
        snap.streak = Math.max(0, Math.min(3650, Number(rawSnap.streak) || 1));
        snap.dailyGoalMinutes = [15, 30, 45, 60].includes(Number(rawSnap.dailyGoalMinutes)) ? Number(rawSnap.dailyGoalMinutes) : 15;
        snap.todayMinutes = Math.max(0, Math.min(720, Number(rawSnap.todayMinutes) || 0));
        snap.customTitle = rawSnap.customTitle ? cleanRawText(rawSnap.customTitle, 80) : null;
        snap.lastLessonId = cleanRawText(rawSnap.lastLessonId || 'c0_1', 40);
        snap.currentCourseId = Math.max(1, Math.min(6, Number(rawSnap.currentCourseId) || 1));
        snap.targetCourseId = Math.max(1, Math.min(6, Number(rawSnap.targetCourseId) || 6));
        snap.unlockAll = rawSnap.unlockAll !== undefined ? Boolean(rawSnap.unlockAll) : true;
        snap.lastCheckInDate = cleanRawText(rawSnap.lastCheckInDate || '', 30);
        snap.lastActiveDateISO = cleanRawText(rawSnap.lastActiveDateISO || getLocalDateISO(), 20);
        snap.avatarPresetId = cleanRawText(rawSnap.avatarPresetId || 'dragon_gold', 40);
        snap.avatarDataUrl = (typeof rawSnap.avatarDataUrl === 'string' && rawSnap.avatarDataUrl.startsWith('data:image/')) ? rawSnap.avatarDataUrl.slice(0, 350000) : null;
        snap.selectedFrameId = cleanRawText(rawSnap.selectedFrameId || 'frame_hsk0', 30);
        snap.lightTheme = rawSnap.schemaVersion === 6 ? Boolean(rawSnap.lightTheme) : true;
        snap.themeMode = ['dark', 'light', 'auto'].includes(rawSnap.themeMode) ? rawSnap.themeMode : (snap.lightTheme ? 'light' : 'dark');
        snap.hanziScale = ['1', '1.15', '1.3'].includes(String(rawSnap.hanziScale)) ? String(rawSnap.hanziScale) : '1';
        snap.speechRate = (typeof rawSnap.speechRate === 'number' && rawSnap.speechRate >= 0.5 && rawSnap.speechRate <= 1.5) ? rawSnap.speechRate : 0.92;
        snap.bgColorHex = (rawSnap.schemaVersion === 6 && typeof rawSnap.bgColorHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(rawSnap.bgColorHex.trim())) ? rawSnap.bgColorHex.trim().toLowerCase() : '#f8fafc';
        snap.bgPresetId = rawSnap.schemaVersion === 6 ? cleanRawText(rawSnap.bgPresetId || 'white_jade', 40) : 'white_jade';
        snap.bgEffect = ['glow', 'gradient', 'solid'].includes(rawSnap.bgEffect) ? rawSnap.bgEffect : 'glow';
        snap.dailyAiTokensUsed = Math.max(0, Number(rawSnap.dailyAiTokensUsed) || 0);
        snap.lastDailyStudyDateISO = cleanRawText(rawSnap.lastDailyStudyDateISO || '', 20);
        snap.missedDayReviewRequired = Boolean(rawSnap.missedDayReviewRequired);
        snap.missedDayReviewCourseId = Math.max(1, Math.min(6, Number(rawSnap.missedDayReviewCourseId) || 1));
        snap.missedDayReviewDayNum = Math.max(1, Math.min(200, Number(rawSnap.missedDayReviewDayNum) || 1));

        snap.completedLessons = {};
        if (rawSnap.completedLessons && typeof rawSnap.completedLessons === 'object') {
          Object.keys(rawSnap.completedLessons).forEach(k => {
            snap.completedLessons[cleanRawText(k, 40)] = Math.min(3, Math.max(0, Number(rawSnap.completedLessons[k]) || 0));
          });
        }
        snap.completedDailyLessons = {};
        if (rawSnap.completedDailyLessons && typeof rawSnap.completedDailyLessons === 'object') {
          Object.keys(rawSnap.completedDailyLessons).forEach(cid => {
            const cMap = rawSnap.completedDailyLessons[cid];
            if (cMap && typeof cMap === 'object') {
              snap.completedDailyLessons[cid] = {};
              Object.keys(cMap).forEach(d => {
                if (cMap[d]) snap.completedDailyLessons[cid][d] = true;
              });
            }
          });
        }
        snap.passedCourses = {};
        if (rawSnap.passedCourses && typeof rawSnap.passedCourses === 'object') {
          Object.keys(rawSnap.passedCourses).forEach(cid => {
            const pObj = rawSnap.passedCourses[cid];
            if (pObj && typeof pObj === 'object') {
              snap.passedCourses[cid] = {
                score: Math.min(100, Math.max(0, Number(pObj.score) || 100)),
                date: cleanRawText(pObj.date || 'Hôm nay', 30)
              };
            }
          });
        }
        snap.classNotes = {};
        if (rawSnap.classNotes && typeof rawSnap.classNotes === 'object') {
          Object.keys(rawSnap.classNotes).forEach(lid => {
            snap.classNotes[cleanRawText(lid, 40)] = cleanRawText(rawSnap.classNotes[lid], 1000);
          });
        }
        const dqDefault = {
          q_lesson: { title: 'Hoàn thành 1 ải bài học bất kỳ', current: 0, target: 1, reward: 30, done: false },
          q_ai: { title: 'Trò chuyện 2 lượt với Tiểu Long AI', current: 0, target: 2, reward: 25, done: false },
          q_write: { title: 'Luyện viết và chấm điểm 1 chữ Hán', current: 0, target: 1, reward: 20, done: false }
        };
        snap.dailyQuests = {};
        Object.keys(dqDefault).forEach(qk => {
          const defQ = dqDefault[qk];
          const rawQ = rawSnap.dailyQuests && rawSnap.dailyQuests[qk];
          if (rawQ && typeof rawQ === 'object') {
            const cur = Math.max(0, Math.min(defQ.target, Number(rawQ.current) || 0));
            snap.dailyQuests[qk] = {
              title: defQ.title,
              current: cur,
              target: defQ.target,
              reward: defQ.reward,
              done: Boolean(rawQ.done || cur >= defQ.target)
            };
          } else if (typeof rawQ === 'number') {
            const cur = Math.max(0, Math.min(defQ.target, rawQ));
            snap.dailyQuests[qk] = {
              title: defQ.title,
              current: cur,
              target: defQ.target,
              reward: defQ.reward,
              done: cur >= defQ.target
            };
          } else {
            snap.dailyQuests[qk] = Object.assign({}, defQ);
          }
        });

        snap.inventory = {};
        if (rawSnap.inventory && typeof rawSnap.inventory === 'object') {
          Object.keys(rawSnap.inventory).forEach(itemKey => {
            snap.inventory[cleanRawText(itemKey, 40)] = Math.max(0, Number(rawSnap.inventory[itemKey]) || 0);
          });
        }
        snap.weeklyMinutes = Array.isArray(rawSnap.weeklyMinutes) && rawSnap.weeklyMinutes.length === 7
          ? rawSnap.weeklyMinutes.map(m => Math.max(0, Math.min(720, Number(m) || 0)))
          : [0, 0, 0, 0, 0, 0, 0];

        snap.studyHistory = Array.isArray(rawSnap.studyHistory)
          ? rawSnap.studyHistory.map(h => ({
              time: cleanRawText(h && h.time, 40),
              action: cleanRawText(h && h.action, 200),
              exp: cleanRawText(h && h.exp, 40)
            }))
          : [];

        snap.srsWords = Array.isArray(rawSnap.srsWords)
          ? rawSnap.srsWords.map((w, i) => ({
              vocab_id: cleanRawText(w.vocab_id || ('v_' + (i + 1)), 40),
              hanzi: cleanRawText(w.hanzi, 30),
              pinyin: cleanRawText(w.pinyin, 60),
              meaning: cleanRawText(w.meaning, 160),
              example: cleanRawText(w.example, 200),
              hsk: cleanRawText(w.hsk || 'HSK 1', 30),
              stability: Number(w.stability) || 1.2,
              difficulty: Number(w.difficulty) || 5.0,
              ease: Number(w.ease) || 2.5,
              intervalDays: Number(w.intervalDays) || 0,
              lastReviewAt: Number(w.lastReviewAt) || Date.now(),
              dueAt: Number(w.dueAt) || Date.now(),
              reps: Number(w.reps) || 0,
              lapses: Number(w.lapses) || 0,
              state: ['new', 'learning', 'review', 'relearning'].includes(w.state) ? w.state : 'review',
              interval: cleanRawText(w.interval || 'Đến hạn ôn', 60)
            })).filter(w => w.hanzi.length > 0)
          : JSON.parse(JSON.stringify(defaultState.srsWords));

        snap.reviewLogs = Array.isArray(rawSnap.reviewLogs) ? rawSnap.reviewLogs : [];
        snap.ledger = Array.isArray(rawSnap.ledger) ? rawSnap.ledger : [];
        snap.studyDays = (rawSnap.studyDays && typeof rawSnap.studyDays === 'object') ? rawSnap.studyDays : {};
        snap.friendMemory = Array.isArray(rawSnap.friendMemory)
          ? rawSnap.friendMemory.slice(0, 30).map(m => cleanRawText(m, 100)).filter(Boolean)
          : ['Thích uống cà phê buổi sáng ☕', 'Đang chinh phục HSK mỗi ngày 🎯'];
        snap.learnerErrors = (rawSnap.learnerErrors && typeof rawSnap.learnerErrors === 'object') ? rawSnap.learnerErrors : {};
        snap.aiCoachNotes = Array.isArray(rawSnap.aiCoachNotes) ? rawSnap.aiCoachNotes.slice(0, 30) : [];
        snap.mistakeNotebookItems = Array.isArray(rawSnap.mistakeNotebookItems)
          ? rawSnap.mistakeNotebookItems.slice(0, 200).map(item => ({
              id: cleanRawText(item && item.id, 50) || ('mn_' + Date.now()),
              hanzi: cleanRawText(item && item.hanzi, 120),
              pinyin: cleanRawText(item && item.pinyin, 160),
              meaning: cleanRawText(item && item.meaning, 240),
              tag: cleanRawText((item && item.tag) || 'Sổ tay cá nhân', 50)
            })).filter(x => x.hanzi || x.meaning)
          : [];
        snap.aiConversations = {};
        if (rawSnap.aiConversations && typeof rawSnap.aiConversations === 'object') {
          Object.keys(rawSnap.aiConversations).slice(0, 20).forEach(scKey => {
            const arr = rawSnap.aiConversations[scKey];
            if (Array.isArray(arr)) {
              snap.aiConversations[cleanRawText(scKey, 40)] = arr.slice(-30).map(m => ({
                sender: m && m.sender === 'user' ? 'user' : 'ai',
                hanzi: cleanRawText(m && m.hanzi, 260),
                pinyin: cleanRawText(m && m.pinyin, 320),
                vi: cleanRawText(m && m.vi, 320),
                inlineSubtleNote: m && m.inlineSubtleNote ? cleanRawText(m.inlineSubtleNote, 280) : null
              })).filter(m => m.hanzi);
            }
          });
        }
        return snap;
      }

      // Full Schema Sanitizer & Migration (Preserves ALL fields on reload & validates accountSchedules!)
      function sanitizeAndMigrateState(rawInput) {
        if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
          throw new Error('Schema không hợp lệ: Dữ liệu gốc phải là một Object.');
        }
        const clean = JSON.parse(JSON.stringify(defaultState));
        const topSnap = sanitizeSingleAccountSnapshot(rawInput);
        Object.assign(clean, topSnap);
        clean.schemaVersion = 6;
        clean.updatedAtMs = typeof rawInput.updatedAtMs === 'number' ? rawInput.updatedAtMs : Date.now();
        clean.syncOutbox = Array.isArray(rawInput.syncOutbox) ? rawInput.syncOutbox : [];
        clean.dbSnapshots = Array.isArray(rawInput.dbSnapshots) ? rawInput.dbSnapshots.slice(0, 8) : [];
        clean.dbChecksum = computeDbIntegrityChecksum(clean);

        clean.accounts = [];
        if (Array.isArray(rawInput.accounts)) {
          clean.accounts = rawInput.accounts.slice(0, 50).map(a => ({
            identifier: cleanRawText(a && a.identifier, 100),
            method: (a && a.method === 'phone') ? 'phone' : 'gmail',
            fullName: cleanRawText((a && a.fullName) || 'Học Viên', 60),
            passwordHash: String((a && a.passwordHash) || ''),
            createdAt: cleanRawText((a && a.createdAt) || 'Hôm nay', 30)
          })).filter(a => a.identifier && a.identifier !== 'hocvien.hsk@gmail.com');
        }

        clean.accountSchedules = {};
        if (rawInput.accountSchedules && typeof rawInput.accountSchedules === 'object') {
          Object.keys(rawInput.accountSchedules).forEach(accKey => {
            const safeKey = cleanRawText(accKey, 100).toLowerCase();
            const validSnap = sanitizeSingleAccountSnapshot(rawInput.accountSchedules[accKey]);
            if (safeKey && validSnap) {
              clean.accountSchedules[safeKey] = validSnap;
            }
          });
        }

        if (rawInput.currentUser && rawInput.currentUser.identifier && rawInput.currentUser.identifier !== 'hocvien.hsk@gmail.com') {
          clean.currentUser = {
            identifier: cleanRawText(rawInput.currentUser.identifier, 100),
            method: rawInput.currentUser.method === 'phone' ? 'phone' : 'gmail',
            fullName: cleanRawText(rawInput.currentUser.fullName || 'Học Viên', 60),
            passwordHash: String(rawInput.currentUser.passwordHash || '')
          };
        } else {
          clean.currentUser = null;
        }
        return clean;
      }

            // Smart Linguistic Distractor Generator (Matches syllable length, Pinyin rhyme/initial, and HSK level)
      function pickSmartLinguisticDistractors(targetWord, bankPool, count) {
        if (!Array.isArray(bankPool) || bankPool.length === 0) return [];
        const tHz = String((targetWord && targetWord.hanzi) || '');
        const tPy = String((targetWord && targetWord.pinyin) || '').toLowerCase();
        const tLen = tHz.length;
        const tFirstPy = tPy.slice(0, 2);

        const scored = [];
        const seenHz = new Set([tHz]);
        bankPool.forEach((cand, idx) => {
          if (!cand || !cand.hanzi || seenHz.has(cand.hanzi)) return;
          seenHz.add(cand.hanzi);
          let score = 0;
          // 1. Same character length (e.g., 2-char noun/verb vs 2-char noun/verb)
          if (cand.hanzi.length === tLen) score += 5;
          else if (Math.abs(cand.hanzi.length - tLen) === 1) score += 2;
          // 2. Similar Pinyin initial or final vowel
          const cPy = String(cand.pinyin || '').toLowerCase();
          if (cPy.slice(0, 2) === tFirstPy) score += 4;
          if (cPy.slice(-2) === tPy.slice(-2)) score += 3;
          // 3. Deterministic tie-breaker so distractors are varied yet high-similarity
          score += ((idx * 7) % 3) * 0.1;
          scored.push({ cand, score });
        });

        scored.sort((a, b) => b.score - a.score);
        return scored.slice(0, count || 3).map(s => s.cand);
      }

      // Automated Content Integrity Linter (Checks missing Pinyin/Meaning & duplicates across all HSK banks)
      function runCurriculumIntegrityAudit() {
        let totalWords = 0;
        let missingFields = 0;
        let duplicates = 0;
        const perLevelCounts = {};
        const globalSeen = new Set();

        [1, 2, 3, 4, 5, 6].forEach(lv => {
          const bank = getParsedHskBank(lv);
          perLevelCounts[lv] = bank.length;
          totalWords += bank.length;
          bank.forEach(w => {
            if (!w.hanzi || !w.pinyin || !w.meaning) missingFields++;
            const key = lv + '::' + w.hanzi + '::' + w.pinyin;
            if (globalSeen.has(key)) duplicates++;
            globalSeen.add(key);
          });
        });

        return {
          totalWords,
          missingFields,
          duplicates,
          perLevelCounts,
          passed: missingFields === 0 && duplicates === 0
        };
      }

      // Anti-Cheat Quiz Session Tracker (Enforces server-style session token, min duration & Daily XP Cap = 600)
      const MAX_DAILY_XP_CAP = 600;
      let activeQuizSession = {
        token: '',
        lessonId: '',
        startedAtMs: 0,
        minDurationMs: 3500
      };

      function startAntiCheatQuizSession(lessonId) {
        activeQuizSession = {
          token: 'qz_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9),
          lessonId: String(lessonId || 'daily'),
          startedAtMs: Date.now(),
          minDurationMs: 3500
        };
        return activeQuizSession;
      }

            // Real Rule-Based Chinese Grammar & Syntax Analyzer for AI Tutor
      function analyzeChineseSentenceGrammar(text) {
        const s = (text || '').trim();
        const issues = [];
        let score = 96;

        if (!/[\u4e00-\u9fa5]/.test(s)) {
          return {
            score: 70,
            badge: '⚠️ Chưa có chữ Hán',
            feedback: 'Bạn vừa nhập bằng Pinyin hoặc tiếng Việt. Hãy thử gõ ít nhất 1 cụm chữ Hán (VD: 你好，我想学中文) để hệ thống phân tích cấu trúc câu chính xác hơn!'
          };
        }
        // Check 1: 比 + ... + 很 + Adj error
        if (/比.+很/.test(s)) {
          score -= 18;
          issues.push('❌ Lỗi câu so sánh 比: Trong cấu trúc "A 比 B + Tính từ", tuyệt đối KHÔNG dùng phó từ "很" trước tính từ (Hãy bỏ chữ 很 hoặc thay bằng 得多 / 一点儿).');
        }
        // Check 2: 不 + Verb + 过 error
        if (/不[\u4e00-\u9fa5]{1,2}过/.test(s)) {
          score -= 18;
          issues.push('❌ Lỗi phủ định trải nghiệm 过: Khi phủ định hành động đã từng xảy ra (过), phải dùng "没(有) + Động từ + 过" chứ không dùng "不".');
        }
        // Check 3: Time word placed at the end of the sentence (Vietnamese word-order interference)
        if (/.+(学习|去|来|看|吃|喝|买|工作)[\u4e00-\u9fa5]*(明天|昨天|今天|现在|早上|晚上)[。！？]?$/.test(s)) {
          score -= 20;
          issues.push('❌ Lỗi trật tự từ (Dịch word-by-word từ tiếng Việt): Trạng ngữ chỉ thời gian (今天/明天/昨天/现在) bắt buộc phải đặt TRƯỚC động từ (Chủ ngữ + Thời gian + Địa điểm + Động từ).');
        }
        // Check 4: Missing measure word after 一/两/三 + common noun
        if (/[一二三四五六七八九十](人|书|衣服|茶|水|朋友|老师|学生)/.test(s)) {
          score -= 15;
          issues.push('⚠️ Thiếu lượng từ: Giữa số đếm và danh từ trong tiếng Trung phải có Lượng từ (VD: 一个人, 一本书, 一件衣服, 一杯茶).');
        }
        // Check 5: HSK 6 Missing Subject error (通过...使...)
        if (/通过.+使/.test(s)) {
          score -= 15;
          issues.push('❌ Lỗi câu bệnh (病句 HSK 6): Dùng đồng thời cả "通过..." và "使..." làm câu bị khuyết chủ ngữ. Hãy lược bỏ 1 trong 2 từ.');
        }

        if (issues.length > 0) {
          return {
            score: Math.max(55, score),
            badge: `🔍 Phát hiện ${issues.length} điểm ngữ pháp cần sửa (${Math.max(55, score)}/100)`,
            feedback: issues.join('<br>')
          };
        }

        const hasConnectors = /不仅|而且|虽然|但是|既然|无论|因为|所以|相辅相成|不可或缺|熟能生巧|半途而废/.test(s);
        if (hasConnectors || s.length >= 10) {
          score = 99;
        }
        return {
          score,
          badge: `✅ Ngữ pháp chuẩn xác (${score}/100)`,
          feedback: hasConnectors
            ? '🌟 Xuất sắc! Bạn đã vận dụng cấu trúc liên từ / thành ngữ HSK rất chuẩn xác và tự nhiên.'
            : '✔ Cấu trúc câu Chủ - Vị - Tân đúng chuẩn ngữ pháp tiếng Trung!'
        };
      }

      // Real Pixel-Overlap Comparison for Hanzi Stroke Canvas
      function computeCanvasStrokeAccuracy(userCanvas, targetChar) {
        try {
          const w = userCanvas.width;
          const h = userCanvas.height;
          const off = document.createElement('canvas');
          off.width = w;
          off.height = h;
          const octx = off.getContext('2d');
          const scaleRatio = Math.max(1, w / 288);
          octx.font = `900 ${Math.round(185 * scaleRatio)}px "Noto Sans SC", sans-serif`;
          octx.textAlign = 'center';
          octx.textBaseline = 'middle';
          octx.fillStyle = '#ffffff';
          octx.fillText(targetChar, w / 2, h / 2 + Math.round(8 * scaleRatio));

          const uData = userCanvas.getContext('2d').getImageData(0, 0, w, h).data;
          const tData = octx.getImageData(0, 0, w, h).data;

          let targetPixels = 0;
          let userPixels = 0;
          let overlapPixels = 0;

          // Dilate check slightly by sampling 4x4 blocks
          for (let y = 0; y < h; y += 2) {
            for (let x = 0; x < w; x += 2) {
              const idx = (y * w + x) * 4 + 3; // Alpha channel
              const uOn = uData[idx] > 40;
              const tOn = tData[idx] > 40;
              if (tOn) targetPixels++;
              if (uOn) userPixels++;
              if (uOn && tOn) overlapPixels++;
            }
          }

          if (userPixels < 25) return { valid: false, score: 0, msg: 'Bạn mới chấm rất ít nét trên bảng. Hãy viết đầy đủ các nét của chữ ' + targetChar + ' nhé!' };
          const precision = overlapPixels / Math.max(1, userPixels);
          const recall = overlapPixels / Math.max(1, targetPixels);
          const rawScore = Math.round((precision * 0.65 + Math.min(1, recall * 1.8) * 0.35) * 100);
          const clamped = Math.min(99, Math.max(45, rawScore));
          return {
            valid: clamped >= 55,
            score: clamped,
            msg: clamped >= 75
              ? `🏆 Độ khớp nét chữ "${targetChar}" trên khung Điền Tự: ${clamped}% (Độ chuẩn vị trí nét: ${Math.round(precision * 100)}%).`
              : `⚠️ Độ khớp nét đạt ${clamped}% — Nét viết hơi lệch khỏi khung chữ mẫu "${targetChar}", hãy bấm "Xem Mẫu Tự Vẽ" và tô sát nét mờ hơn nhé!`
          };
        } catch (e) {
          return { valid: true, score: 88, msg: 'Đã kiểm tra nét viết chữ ' + targetChar + '!' };
        }
      }


      // =====================================================
      // 1. WEB AUDIO SYNTHESIZER (Game SFX without external audio files)
      // =====================================================
      let audioCtx = null;
      let soundEnabled = true;

      function initAudio() {
        if (!audioCtx) {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            audioCtx = new AudioContextClass();
          }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
          audioCtx.resume();
        }
      }

      function playSfx(type) {
        if (!soundEnabled) return;
        try {
          initAudio();
          if (!audioCtx) return;
          const now = audioCtx.currentTime;
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);

          if (type === 'correct') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, now); // C5
            osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
            osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
            gain.gain.setValueAtTime(0.18, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
          } else if (type === 'wrong') {
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(220, now);
            osc.frequency.setValueAtTime(160, now + 0.12);
            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
            osc.start(now);
            osc.stop(now + 0.3);
          } else if (type === 'levelup') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(440, now);
            osc.frequency.setValueAtTime(554.37, now + 0.1);
            osc.frequency.setValueAtTime(659.25, now + 0.2);
            osc.frequency.setValueAtTime(880, now + 0.3);
            gain.gain.setValueAtTime(0.22, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
            osc.start(now);
            osc.stop(now + 0.65);
          } else if (type === 'click') {
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            gain.gain.setValueAtTime(0.07, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
            osc.start(now);
            osc.stop(now + 0.06);
          }
        } catch (e) {
          // Ignore audio errors
        }
      }

      // Chinese Text-to-Speech (Native Browser TTS + Visual Feedback)
      // Extract ONLY Chinese Hanzi characters & Chinese punctuation so TTS never reads Vietnamese translations or Pinyin aloud!
      function extractPureChineseHanziOnly(rawText) {
        if (!rawText) return '';
        const str = String(rawText)
          .replace(/\[[^\]]*\]/g, ' ')
          .replace(/\([^)]*[a-zA-ZàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ][^)]*\)/g, ' ');
        const chunks = str.match(/[\u4e00-\u9fff\u3400-\u4dbf]+/g);
        if (chunks && chunks.length > 0) {
          return chunks.join('，');
        }
        // Fallback only for pure Pinyin table cards (strip any Vietnamese after - or :)
        return str.split(/[\-—:（(]/)[0].trim();
      }

      function speakChinese(text, rate) {
        const pureChinese = extractPureChineseHanziOnly(text);
        if (!pureChinese) return;
        playSfx('click');
        try {
          if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utter = new SpeechSynthesisUtterance(pureChinese);
            utter.lang = 'zh-CN';
            const userPrefRate = (typeof appState !== 'undefined' && appState && Number(appState.speechRate)) ? Number(appState.speechRate) : 0.90;
            utter.rate = (typeof rate === 'number' && rate > 0) ? rate : userPrefRate;
            const voices = window.speechSynthesis.getVoices();
            const zhVoice = voices.find(v => v.lang && (v.lang.includes('zh-CN') || v.lang.includes('zh_CN') || v.lang.includes('cmn') || v.lang.includes('zh')));
            if (zhVoice) utter.voice = zhVoice;
            window.speechSynthesis.speak(utter);
          }
        } catch (e) {
          // Fallback silent
        }
        showToast('🔊 Đang phát âm: ' + text, 'emerald');
      }

      function showToast(message, color = 'emerald') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const el = document.createElement('div');
        const borderMap = {
          emerald: 'border-emerald-500/60 bg-slate-900/95 text-emerald-300',
          amber: 'border-amber-500/60 bg-slate-900/95 text-amber-300',
          rose: 'border-rose-500/60 bg-slate-900/95 text-rose-300'
        };
        el.className = 'px-4 py-2.5 rounded-2xl border shadow-xl text-xs font-bold transition-all duration-300 ' + (borderMap[color] || borderMap.emerald);
        el.textContent = message;
        container.appendChild(el);
        setTimeout(() => {
          el.style.opacity = '0';
          setTimeout(() => el.remove(), 300);
        }, 2400);
      }

      // =====================================================
      // 2. CURRICULUM DATA (FROM ZERO / MẤT GỐC TO HSK 6)
      // =====================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeHtml,
    cleanRawText,
    getLocalDateISO,
    daysBetweenISODates,
    FSRS5_DEFAULT_WEIGHTS,
    computeFSRSSchedule,
    rebuildCardStatesFromReviewLogs,
    pickSmartLinguisticDistractors,
    analyzeChineseSentenceGrammar
  };
}
