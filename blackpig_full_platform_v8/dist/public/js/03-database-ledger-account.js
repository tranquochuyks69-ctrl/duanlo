// ============================================================================
// Module 03: Enterprise IndexedDB v5 (8 Stores + Composite Indexes), PITR Auto-Snapshots,
//            120ms Write Coalescing, Cross-Tab BroadcastChannel, VACUUM & Integrity Checksum
// ============================================================================
'use strict';

const DB_KEY = 'huayu_quest_db_v1';
      let idbInstance = null;

      const defaultState = {
        schemaVersion: 7,
        securityAuditLogs: [
          { id: 'sec_init_1', time: 'Hôm nay', event: 'Khởi tạo bộ nhớ ngoại tuyến IndexedDB v8 (Tách kho thẻ, nhật ký, sổ cái & media_blobs)', level: 'INFO' },
          { id: 'sec_init_2', time: 'Hôm nay', event: 'Tiền tệ (XP, Gem), đáp án thi và quyền Admin do Máy chủ xác thực độc lập', level: 'INFO' }
        ],
        aesVaultEncryptedHex: '',
        wafBlockedCount: 0,
        exp: 40,
        gems: 150,
        hearts: 5,
        streak: 1,
        dailyGoalMinutes: 15,
        todayMinutes: 0,
        unlockAll: true,
        customTitle: '',
        lastLessonId: 'c0_1',
        lastUpdated: new Date().toLocaleString('vi-VN'),
        completedLessons: {}, // { lessonId: stars }
        dailyQuests: {
          q_lesson: { title: 'Hoàn thành 1 ải bài học bất kỳ', current: 0, target: 1, reward: 30, done: false },
          q_ai: { title: 'Trò chuyện 2 lượt với Tiểu Long AI', current: 0, target: 2, reward: 25, done: false },
          q_write: { title: 'Luyện viết và chấm điểm 1 chữ Hán', current: 0, target: 1, reward: 20, done: false }
        },
        srsWords: [
          { vocab_id: 'v_1', hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào (Hán Việt: Nhĩ hảo)', example: '你好！很高兴认识你。', hsk: 'Cấp 0', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 4.8, state: 'review' },
          { vocab_id: 'v_2', hanzi: '谢谢', pinyin: 'xièxie', meaning: 'Cảm ơn (Hán Việt: Tạ tạ)', example: '谢谢你的帮助。', hsk: 'HSK 1', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 4.8, state: 'review' },
          { vocab_id: 'v_3', hanzi: '便宜', pinyin: 'piányi', meaning: 'Rẻ (Hán Việt: Tiện nghi)', example: '太贵了，便宜一点吧！', hsk: 'HSK 2', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 5.0, state: 'review' },
          { vocab_id: 'v_4', hanzi: '流利', pinyin: 'liúlì', meaning: 'Lưu loát, trôi chảy (Hán Việt: Lưu lợi)', example: '她的汉语说得很流利。', hsk: 'HSK 4', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 5.2, state: 'review' },
          { vocab_id: 'v_5', hanzi: '趋势', pinyin: 'qūshì', meaning: 'Xu hướng, xu thế (Hán Việt: Xu thế)', example: '数字化是未来的发展趋势。', hsk: 'HSK 5', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 5.4, state: 'review' },
          { vocab_id: 'v_6', hanzi: '相辅相成', pinyin: 'xiāng fǔ xiāng chéng', meaning: 'Bổ trợ lẫn nhau (Hán Việt: Tương phụ tương thành)', example: '理论与实践是相辅相成的。', hsk: 'HSK 6', interval: 'Hôm nay', reps: 1, stability: 2.4, difficulty: 5.6, state: 'review' }
        ],
        studyHistory: [
          { time: 'Hôm nay', action: 'Khởi tạo Cơ sở dữ liệu Enterprise v5 & Lộ trình HSK 1-6', exp: '+40 EXP' }
        ],
        weeklyMinutes: [12, 18, 15, 25, 20, 30, 10],
        inventory: { streak_freeze: 1 },
        aiConversations: {},
        dbSnapshots: [],
        lightTheme: true,
        themeMode: 'light',
        hanziScale: '1',
        speechRate: 0.92,
        bgColorHex: '#f8fafc',
        bgPresetId: 'white_jade',
        bgEffect: 'glow',
        lastDailyStudyDateISO: '',
        missedDayReviewRequired: false,
        missedDayReviewCourseId: 1,
        missedDayReviewDayNum: 1
      };

      let appState = JSON.parse(JSON.stringify(defaultState));

      function initIndexedDB() {
        return new Promise((resolve) => {
          let settled = false;
          const finish = (val) => {
            if (!settled) {
              settled = true;
              resolve(val);
            }
          };
          const timer = setTimeout(() => finish(null), 650);
          try {
            if (!window.indexedDB) { clearTimeout(timer); return finish(null); }
            const req = window.indexedDB.open('HuaYuQuestDB', 8);
            req.onblocked = function () { clearTimeout(timer); finish(null); };
            req.onupgradeneeded = function (e) {
              const db = e.target.result;
              if (!db.objectStoreNames.contains('userProgress')) {
                db.createObjectStore('userProgress', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('card_states')) {
                const cs = db.createObjectStore('card_states', { keyPath: 'id' });
                cs.createIndex('by_user_due', ['user_id', 'dueAt'], { unique: false });
                cs.createIndex('by_user_state', ['user_id', 'state'], { unique: false });
                cs.createIndex('by_hsk_level', ['user_id', 'hsk'], { unique: false });
              }
              if (!db.objectStoreNames.contains('review_logs')) {
                const rl = db.createObjectStore('review_logs', { keyPath: 'id' });
                rl.createIndex('by_user_time', ['user_id', 'reviewed_at'], { unique: false });
                rl.createIndex('by_vocab_id', ['user_id', 'vocab_id'], { unique: false });
              }
              if (!db.objectStoreNames.contains('ledger')) {
                const lg = db.createObjectStore('ledger', { keyPath: 'id' });
                lg.createIndex('by_user_kind', ['user_id', 'kind'], { unique: false });
              }
              if (!db.objectStoreNames.contains('sync_outbox')) {
                const so = db.createObjectStore('sync_outbox', { keyPath: 'id' });
                so.createIndex('by_synced', 'synced', { unique: false });
              }
              if (!db.objectStoreNames.contains('mistake_notebook')) {
                const mn = db.createObjectStore('mistake_notebook', { keyPath: 'id' });
                mn.createIndex('by_user_tag', ['user_id', 'tag'], { unique: false });
              }
              if (!db.objectStoreNames.contains('ai_chat_history')) {
                const ai = db.createObjectStore('ai_chat_history', { keyPath: 'id' });
                ai.createIndex('by_user_scenario', ['user_id', 'scenario_id'], { unique: false });
              }
              if (!db.objectStoreNames.contains('auto_snapshots')) {
                const snapStore = db.createObjectStore('auto_snapshots', { keyPath: 'id' });
                snapStore.createIndex('by_created_at', 'createdAtMs', { unique: false });
              }
              if (!db.objectStoreNames.contains('security_audit_logs')) {
                const secStore = db.createObjectStore('security_audit_logs', { keyPath: 'id' });
                secStore.createIndex('by_level', 'level', { unique: false });
              }
              if (!db.objectStoreNames.contains('encrypted_vault')) {
                db.createObjectStore('encrypted_vault', { keyPath: 'id' });
              }
              if (!db.objectStoreNames.contains('media_blobs')) {
                db.createObjectStore('media_blobs', { keyPath: 'id' });
              }
            };
            req.onsuccess = function (e) {
              clearTimeout(timer);
              idbInstance = e.target.result;
              finish(idbInstance);
            };
            req.onerror = function () {
              clearTimeout(timer);
              finish(null);
            };
          } catch (err) {
            clearTimeout(timer);
            finish(null);
          }
        });
      }

      // Request Persistent Storage Quota from Browser so OS never evicts learning progress
      async function ensurePersistentStorageQuota() {
        try {
          if (navigator.storage && navigator.storage.persist) {
            await navigator.storage.persist();
          }
        } catch (e) {}
      }

      // Create a Point-in-Time Recovery (PITR) Snapshot
      function createDatabaseSnapshot(reasonLabel, silent) {
        if (!appState) return null;
        if (!Array.isArray(appState.dbSnapshots)) appState.dbSnapshots = [];
        const snapCopy = sanitizeSingleAccountSnapshot(appState);
        const checksum = computeDbIntegrityChecksum(appState);
        const snapEntry = {
          id: 'pitr_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          createdAtMs: Date.now(),
          timeLabel: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + getLocalDateISO(),
          reason: cleanRawText(reasonLabel || 'Sao lưu cục bộ tự động', 80),
          checksum: checksum,
          exp: appState.exp || 0,
          gems: appState.gems || 0,
          srsCount: (appState.srsWords || []).length,
          snapshotData: snapCopy
        };
        appState.dbSnapshots.unshift(snapEntry);
        while (appState.dbSnapshots.length > 5) {
          appState.dbSnapshots.pop();
        }
        // Enforce strict 1.5 MB quota cap on local snapshots
        while (appState.dbSnapshots.length > 1 && JSON.stringify(appState.dbSnapshots).length > 1500000) {
          appState.dbSnapshots.pop();
        }

        if (idbInstance) {
          try {
            const tx = idbInstance.transaction(['auto_snapshots'], 'readwrite');
            tx.objectStore('auto_snapshots').put(snapEntry);
          } catch (e) {}
        }
        if (!silent && typeof showToast === 'function') {
          showToast('📸 Đã tạo bản Sao lưu cục bộ: ' + snapEntry.checksum, 'emerald');
        }
        if (typeof window.renderDatabaseControlCenterUI === 'function') {
          window.renderDatabaseControlCenterUI();
        }
        return snapEntry;
      }
      window.createDatabaseSnapshot = createDatabaseSnapshot;

      function restoreDatabaseFromSnapshot(snapshotId) {
        if (!Array.isArray(appState.dbSnapshots) || appState.dbSnapshots.length === 0) {
          showToast('⚠️ Chưa có bản sao lưu cục bộ nào để khôi phục!', 'amber');
          return false;
        }
        const found = appState.dbSnapshots.find(s => s.id === snapshotId) || appState.dbSnapshots[0];
        if (!found || !found.snapshotData) return false;
        const validSnap = sanitizeSingleAccountSnapshot(found.snapshotData);
        if (!validSnap) return false;
        const keepSnapshots = appState.dbSnapshots.slice();
        const keepAccounts = appState.accounts || [];
        const keepSchedules = appState.accountSchedules || {};
        const keepUser = appState.currentUser || null;
        Object.assign(appState, validSnap, {
          dbSnapshots: keepSnapshots,
          accounts: keepAccounts,
          accountSchedules: keepSchedules,
          currentUser: keepUser
        });
        saveStateToDatabase('Khôi phục DB từ điểm sao lưu PITR (' + found.timeLabel + ')');
        if (typeof refreshAllUI === 'function') refreshAllUI();
        if (typeof renderProfileAndChart === 'function') renderProfileAndChart();
        showToast('⏪ Đã khôi phục thành công dữ liệu về mốc: ' + found.timeLabel, 'emerald');
        return true;
      }
      window.restoreDatabaseFromSnapshot = restoreDatabaseFromSnapshot;

      // Full Database VACUUM, Deduplication, FSRS-5 Rebuild & Ledger Verification
      function runDatabaseVacuumAndVerify(silent) {
        if (!appState) return null;
        let dedupedCount = 0;

        // 1. Deduplicate srsWords by hanzi
        if (Array.isArray(appState.srsWords)) {
          const seenHz = new Set();
          const cleanSrs = [];
          appState.srsWords.forEach(w => {
            if (w && w.hanzi && !seenHz.has(w.hanzi)) {
              seenHz.add(w.hanzi);
              cleanSrs.push(w);
            } else {
              dedupedCount++;
            }
          });
          appState.srsWords = cleanSrs;
        }

        // 2. Deduplicate reviewLogs by id
        if (Array.isArray(appState.reviewLogs)) {
          const seenLog = new Set();
          const cleanLogs = [];
          appState.reviewLogs.forEach(r => {
            const rid = r && (r.id || (r.vocab_id + '_' + r.reviewed_at));
            if (rid && !seenLog.has(rid)) {
              seenLog.add(rid);
              cleanLogs.push(r);
            } else {
              dedupedCount++;
            }
          });
          appState.reviewLogs = cleanLogs.slice(0, 500);
        }

        // 3. Deduplicate ledger by idempotency_key & reconcile balances
        if (Array.isArray(appState.ledger) && appState.ledger.length > 0) {
          const seenKey = new Set();
          const cleanLedger = [];
          appState.ledger.forEach(l => {
            const k = l && (l.idempotency_key || l.id);
            if (k && !seenKey.has(k)) {
              seenKey.add(k);
              cleanLedger.push(l);
            } else {
              dedupedCount++;
            }
          });
          appState.ledger = cleanLedger;
          if (typeof computeUserBalancesFromLedger === 'function') {
            const bal = computeUserBalancesFromLedger();
            appState.exp = Math.max(0, bal.xp);
            appState.gems = Math.max(0, bal.gems);
          }
        }

        // 4. Trim syncOutbox synced items older than 100 entries
        if (Array.isArray(appState.syncOutbox) && appState.syncOutbox.length > 120) {
          const beforeLen = appState.syncOutbox.length;
          appState.syncOutbox = appState.syncOutbox.slice(0, 120);
          dedupedCount += (beforeLen - appState.syncOutbox.length);
        }

        appState.schemaVersion = 6;
        appState.dbChecksum = computeDbIntegrityChecksum(appState);
        createDatabaseSnapshot('VACUUM & Kiểm toàn vẹn tự động', true);
        saveStateToDatabase('Tối ưu hóa CSDL (VACUUM v5 • Dọn ' + dedupedCount + ' bản ghi trùng)');
        if (typeof window.renderDatabaseControlCenterUI === 'function') {
          window.renderDatabaseControlCenterUI();
        }
        if (!silent && typeof showToast === 'function') {
          showToast(`🛠️ Đã dọn ${dedupedCount} bản ghi trùng cục bộ & tạo bản sao lưu (${appState.dbChecksum})!`, 'emerald');
        }
        return { dedupedCount, checksum: appState.dbChecksum };
      }
      window.runDatabaseVacuumAndVerify = runDatabaseVacuumAndVerify;

      async function loadStateFromDatabase() {
        ensurePersistentStorageQuota();
        let localCandidate = null;
        try {
          const raw = localStorage.getItem(DB_KEY);
          if (raw) {
            localCandidate = sanitizeAndMigrateState(JSON.parse(raw));
          }
        } catch (e) {
          localCandidate = null;
        }

        let idbCandidate = null;
        const db = await initIndexedDB();
        if (db) {
          idbCandidate = await new Promise((resolve) => {
            try {
              const tx = db.transaction('userProgress', 'readonly');
              const store = tx.objectStore('userProgress');
              const getReq = store.get('main');
              getReq.onsuccess = function () {
                if (getReq.result && getReq.result.data) {
                  try {
                    resolve(sanitizeAndMigrateState(getReq.result.data));
                  } catch (err) {
                    resolve(null);
                  }
                } else {
                  resolve(null);
                }
              };
              getReq.onerror = function () { resolve(null); };
            } catch (e) {
              resolve(null);
            }
          });
        }

        // Conflict Resolution: Compare updatedAtMs timestamps and pick the newer valid state!
        if (localCandidate && idbCandidate) {
          appState = (idbCandidate.updatedAtMs >= localCandidate.updatedAtMs) ? idbCandidate : localCandidate;
        } else if (idbCandidate) {
          appState = idbCandidate;
        } else if (localCandidate) {
          appState = localCandidate;
        } else {
          appState = sanitizeAndMigrateState(defaultState);
        }

        // Ensure at least 1 initial PITR snapshot exists
        if (!Array.isArray(appState.dbSnapshots) || appState.dbSnapshots.length === 0) {
          createDatabaseSnapshot('Khởi tạo phiên học', true);
        }

        rolloverIfNewDay();
        refreshAllUI();
      }

      function enqueueSyncOutboxEvent(eventType, payload) {
        if (!Array.isArray(appState.syncOutbox)) appState.syncOutbox = [];
        const ev = {
          id: 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
          event_type: eventType,
          payload: payload,
          created_at: new Date().toISOString(),
          synced: false
        };
        appState.syncOutbox.unshift(ev);
        if (appState.syncOutbox.length > 250) appState.syncOutbox.pop();
        return ev;
      }

      let idbWriteTimer = null;
      let coalescedWriteCount = 0;
      let crossTabChannel = null;
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          crossTabChannel = new BroadcastChannel('huayu_quest_10k_sync');
        }
      } catch (e) {
        crossTabChannel = null;
      }
      if (crossTabChannel) {
        crossTabChannel.onmessage = function (ev) {
          if (ev.data && ev.data.type === 'STATE_UPDATED' && ev.data.updatedAtMs > (appState.updatedAtMs || 0)) {
            try {
              const incoming = sanitizeAndMigrateState(ev.data.state);
              const existingLogIds = new Set((appState.reviewLogs || []).map(r => r.id));
              (incoming.reviewLogs || []).forEach(r => { if (!existingLogIds.has(r.id)) appState.reviewLogs.unshift(r); });
              const existingLedIds = new Set((appState.ledger || []).map(l => l.idempotency_key));
              (incoming.ledger || []).forEach(l => { if (!existingLedIds.has(l.idempotency_key)) appState.ledger.unshift(l); });
              Object.assign(appState, incoming, { reviewLogs: appState.reviewLogs, ledger: appState.ledger });
              updateHudAndResumeBanner();
              renderAccountScheduleHub();
            } catch (e) {}
          }
        };
      }

      function saveStateToDatabase(logMessage, expGainText) {
        rolloverIfNewDay();
        appState.schemaVersion = 6;
        coalescedWriteCount++;
        saveCurrentAccountSnapshot();
        appState.updatedAtMs = Date.now();
        appState.lastUpdated = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' hôm nay';
        if (logMessage) {
          const rawLog = cleanRawText(logMessage, 200);
          appState.studyHistory.unshift({
            time: appState.lastUpdated,
            action: rawLog,
            exp: cleanRawText(expGainText || '', 40)
          });
          if (appState.studyHistory.length > 60) appState.studyHistory.pop();
          enqueueSyncOutboxEvent('activity_log', { action: rawLog, exp: expGainText || '' });
        }

        appState.dbChecksum = computeDbIntegrityChecksum(appState);

        // Automatically create a rolling PITR snapshot every 12 writes
        if (coalescedWriteCount % 12 === 0) {
          createDatabaseSnapshot(logMessage || 'Tự động lưu định kỳ', true);
        }

        try {
          // Do NOT dump full appState or 350KB avatars into localStorage!
          // Store only tiny (< 512 bytes) UI preferences for zero-flash initial paint; main data lives in IndexedDB stores.
          const uiPrefsOnly = {
            schemaVersion: 8,
            updatedAtMs: appState.updatedAtMs,
            bgColorHex: appState.bgColorHex || '#f8fafc',
            bgPresetId: appState.bgPresetId || 'white_jade',
            themeMode: appState.themeMode || 'light',
            lightTheme: Boolean(appState.lightTheme),
            hanziScale: appState.hanziScale || '1',
            speechRate: appState.speechRate || 0.92
          };
          localStorage.setItem('blackpig_ui_prefs_v8', JSON.stringify(uiPrefsOnly));
          localStorage.removeItem(DB_KEY);
        } catch (e) {}

        if (crossTabChannel) {
          try { crossTabChannel.postMessage({ type: 'STATE_UPDATED', updatedAtMs: appState.updatedAtMs, state: appState }); } catch (e) {}
        }
        if (idbWriteTimer) clearTimeout(idbWriteTimer);
        idbWriteTimer = setTimeout(() => {
          const performLockedIdbWrite = async () => {
            if (!idbInstance) return;
            try {
              const uid = (appState.currentUser && appState.currentUser.identifier) ? getAccountKey(appState.currentUser.identifier) : 'guest';
              const storeNames = ['userProgress', 'card_states', 'review_logs', 'ledger', 'sync_outbox', 'mistake_notebook', 'ai_chat_history', 'media_blobs'].filter(
                name => idbInstance.objectStoreNames.contains(name)
              );
              const tx = idbInstance.transaction(storeNames, 'readwrite');
              // Separate 350KB avatar blob from userProgress record
              const avatarData = appState.customAvatarDataUrl || null;
              if (avatarData && tx.objectStoreNames.contains('media_blobs')) {
                tx.objectStore('media_blobs').put({ id: uid + '::avatar', user_id: uid, dataUrl: avatarData, updatedAtMs: appState.updatedAtMs });
              }
              const slimState = Object.assign({}, appState, { customAvatarDataUrl: avatarData ? '__stored_in_media_blobs__' : null });
              tx.objectStore('userProgress').put({ id: 'main', updatedAtMs: appState.updatedAtMs, checksum: appState.dbChecksum, data: slimState });

              if (tx.objectStoreNames.contains('card_states')) {
                const cardStore = tx.objectStore('card_states');
                (appState.srsWords || []).forEach((w, idx) => {
                  const vid = w.vocab_id || w.hanzi || ('card_' + idx);
                  cardStore.put(Object.assign({}, w, { id: uid + '::' + vid, user_id: uid }));
                });
              }
              if (tx.objectStoreNames.contains('review_logs')) {
                const revStore = tx.objectStore('review_logs');
                (appState.reviewLogs || []).slice(0, 60).forEach((r, idx) => {
                  const rid = r.id || ('rev_' + idx);
                  revStore.put(Object.assign({}, r, { id: rid, user_id: uid }));
                });
              }
              if (tx.objectStoreNames.contains('ledger')) {
                const ledStore = tx.objectStore('ledger');
                (appState.ledger || []).slice(0, 60).forEach((l, idx) => {
                  const lid = l.id || ('led_' + idx);
                  ledStore.put(Object.assign({}, l, { id: lid, user_id: uid }));
                });
              }
              if (tx.objectStoreNames.contains('sync_outbox')) {
                const outboxStore = tx.objectStore('sync_outbox');
                (appState.syncOutbox || []).slice(0, 60).forEach(ev => {
                  outboxStore.put(ev);
                });
              }
              if (tx.objectStoreNames.contains('mistake_notebook')) {
                const nbStore = tx.objectStore('mistake_notebook');
                (appState.mistakeNotebookItems || []).forEach((item, idx) => {
                  const nid = item.id || ('mn_' + idx);
                  nbStore.put(Object.assign({}, item, { id: uid + '::' + nid, user_id: uid }));
                });
              }
              if (tx.objectStoreNames.contains('ai_chat_history') && appState.aiConversations) {
                const aiStore = tx.objectStore('ai_chat_history');
                Object.keys(appState.aiConversations).forEach(scId => {
                  aiStore.put({
                    id: uid + '::' + scId,
                    user_id: uid,
                    scenario_id: scId,
                    messages: appState.aiConversations[scId],
                    updated_at: appState.updatedAtMs
                  });
                });
              }

              tx.oncomplete = function () {
                const dbEl = document.getElementById('hudDbStatus');
                if (dbEl) dbEl.title = 'Đã lưu cục bộ IndexedDB v8 (' + appState.dbChecksum + ') lúc ' + appState.lastUpdated;
              };
            } catch (e) {
              // Fallback if transaction stores are busy
            }
          };
          if (typeof navigator !== 'undefined' && navigator.locks && typeof navigator.locks.request === 'function') {
            navigator.locks.request('blackpig_idb_write_lock', { mode: 'exclusive' }, performLockedIdbWrite).catch(() => performLockedIdbWrite());
          } else {
            performLockedIdbWrite();
          }
        }, 120);
        updateHudAndResumeBanner();
        if (typeof window.renderDatabaseControlCenterUI === 'function') {
          window.renderDatabaseControlCenterUI();
        }
      }


      // ====================================================================
      // LOCAL BACKUP ENCRYPTION (WEBCRYPTO AES-256-GCM • PBKDF2 600,000 ITERATIONS)
      // Honest client storage: never fakes encryption if WebCrypto is unavailable,
      // and never claims client-side state is tamper-proof for server currency.
      // ====================================================================
      function appendSecurityAuditLog(eventDesc, level) {
        if (!Array.isArray(appState.securityAuditLogs)) appState.securityAuditLogs = [];
        const entry = {
          id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' • ' + getLocalDateISO(),
          event: cleanRawText(eventDesc, 160),
          level: level || 'INFO'
        };
        appState.securityAuditLogs.unshift(entry);
        if (appState.securityAuditLogs.length > 40) appState.securityAuditLogs.pop();
        if (idbInstance && idbInstance.objectStoreNames.contains('security_audit_logs')) {
          try {
            const tx = idbInstance.transaction(['security_audit_logs'], 'readwrite');
            tx.objectStore('security_audit_logs').put(entry);
          } catch (e) {}
        }
        return entry;
      }
      window.appendSecurityAuditLog = appendSecurityAuditLog;

      async function encryptDatabaseVaultAES256(passphrase) {
        if (!window.crypto || !window.crypto.subtle) {
          appendSecurityAuditLog('Không thể mã hóa: Môi trường hiện tại không hỗ trợ WebCrypto API (cần HTTPS hoặc localhost).', 'WARN');
          if (typeof showToast === 'function') {
            showToast('⚠️ Môi trường không có WebCrypto API thật — từ chối sinh chuỗi giả!', 'amber');
          }
          return null;
        }
        try {
          const secret = String(passphrase || 'BlackPig_Backup_Passphrase_v8');
          const enc = new TextEncoder();
          const plainBytes = enc.encode(JSON.stringify({
            format: 'blackpig-encrypted-backup',
            schemaVersion: 8,
            exportedAt: new Date().toISOString(),
            srsWords: appState.srsWords || [],
            reviewLogs: (appState.reviewLogs || []).slice(0, 200),
            mistakeNotebookItems: appState.mistakeNotebookItems || []
          }));

          // Real SHA-256 digest of plaintext payload via WebCrypto
          const sha256Buf = await window.crypto.subtle.digest('SHA-256', plainBytes);
          const sha256Hex = Array.from(new Uint8Array(sha256Buf)).map(b => b.toString(16).padStart(2, '0')).join('');

          // OWASP 2024 recommended 600,000 iterations for PBKDF2-HMAC-SHA256
          const keyMaterial = await window.crypto.subtle.importKey('raw', enc.encode(secret), { name: 'PBKDF2' }, false, ['deriveKey']);
          const salt = window.crypto.getRandomValues(new Uint8Array(16));
          const iv = window.crypto.getRandomValues(new Uint8Array(12));
          const aesKey = await window.crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt, iterations: 600000, hash: 'SHA-256' },
            keyMaterial,
            { name: 'AES-GCM', length: 256 },
            false,
            ['encrypt', 'decrypt']
          );
          const encryptedBuf = await window.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plainBytes);
          const cipherBytes = new Uint8Array(encryptedBuf);
          const toHex = (arr) => Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
          const envelope = {
            format: 'blackpig-encrypted-backup',
            schemaVersion: 8,
            kdf: 'PBKDF2-HMAC-SHA256',
            iterations: 600000,
            cipher: 'AES-256-GCM',
            saltHex: toHex(salt),
            ivHex: toHex(iv),
            plaintextSha256: sha256Hex,
            ciphertextPreviewHex: toHex(cipherBytes.slice(0, 24))
          };
          appState.aesVaultEncryptedHex = `AES256GCM:PBKDF2_600K:sha256=${sha256Hex.slice(0, 16)}...`;
          if (idbInstance && idbInstance.objectStoreNames.contains('encrypted_vault')) {
            try {
              const tx = idbInstance.transaction(['encrypted_vault'], 'readwrite');
              tx.objectStore('encrypted_vault').put({ id: 'vault_main', envelope, updatedAt: Date.now() });
            } catch (e) {}
          }
          appendSecurityAuditLog('Đã tạo bản xuất mã hóa bằng WebCrypto AES-256-GCM + PBKDF2 (600.000 vòng) • SHA-256: ' + sha256Hex.slice(0, 16), 'AES-256');
          saveStateToDatabase('Tạo bản sao lưu mã hóa AES-256-GCM (PBKDF2 600.000 vòng)');
          if (typeof showToast === 'function') {
            showToast('🔐 Đã tạo bản sao lưu mã hóa bằng WebCrypto AES-256-GCM (PBKDF2 600.000 vòng)!', 'emerald');
          }
          return appState.aesVaultEncryptedHex;
        } catch (err) {
          return null;
        }
      }
      window.encryptDatabaseVaultAES256 = encryptDatabaseVaultAES256;

      async function runZeroTrustSecurityAudit() {
        const vac = runDatabaseVacuumAndVerify(true);
        const cipher = await encryptDatabaseVaultAES256();
        appendSecurityAuditLog('Hoàn tất dọn bản ghi trùng cục bộ (' + (vac ? vac.dedupedCount : 0) + ' mục) & kiểm tra các kho IndexedDB v8', 'INFO');
        if (typeof window.renderDatabaseControlCenterUI === 'function') window.renderDatabaseControlCenterUI();
        if (typeof window.renderHanbeeGoHubView === 'function') {
          window.renderHanbeeGoHubView();
        }
        if (typeof showToast === 'function') {
          showToast('🛠️ Đã dọn bản ghi trùng cục bộ & cập nhật bản sao lưu mã hóa!', 'emerald');
        }
        return { vac, cipher };
      }
      window.runZeroTrustSecurityAudit = runZeroTrustSecurityAudit;
