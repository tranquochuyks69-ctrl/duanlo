// ============================================================================
// Module 04: Vivid Avatars, HSK 1-6 Reward Frames, HUD, Pure Chinese TTS & Final Exams
// ============================================================================
'use strict';

// 7. HUD, RANKING, DAILY QUESTS & RESUME BANNER
      // =====================================================
      function getRankInfo(exp) {
        const level = Math.floor((Number(exp) || 0) / 100) + 1;
        const stages = [
          { stageShort: 'Heo Con Nhập Môn', stageName: '小黑猪 • Tân Thủ', title: 'Heo Con Nhập Môn (Tân Thủ HSK 1)' },
          { stageShort: 'Heo Đen Tập Viết', stageName: '书童黑猪 • Đệ Tử', title: 'Heo Đen Tập Viết (Đệ Tử HSK 1+)' },
          { stageShort: 'Heo Đen Hiếu Học', stageName: '好学黑猪 • Môn Đồ', title: 'Heo Đen Hiếu Học (Môn Đồ HSK 2)' },
          { stageShort: 'Heo Đen Thông Thái', stageName: '智多黑猪 • Học Giả', title: 'Heo Đen Thông Thái (Học Giả HSK 3)' },
          { stageShort: 'Heo Đen Tài Ba', stageName: '才华黑猪 • Tinh Anh', title: 'Heo Đen Tài Ba (Tinh Anh HSK 4)' },
          { stageShort: 'Heo Đen Bác Học', stageName: '博学黑猪 • Cao Thủ', title: 'Heo Đen Bác Học (Cao Thủ HSK 5)' },
          { stageShort: 'Heo Đen Đại Sư', stageName: '宗师黑猪 • Đại Sư', title: 'Heo Đen Đại Sư (Đại Sư HSK 6)' },
          { stageShort: 'Heo Đen Hàn Lâm', stageName: '翰林黑猪 • Hàn Lâm', title: 'Heo Đen Hàn Lâm (Tông Sư HSK 7)' },
          { stageShort: 'Heo Đen Trạng Nguyên', stageName: '状元黑猪 • Trạng Nguyên', title: 'Heo Đen Trạng Nguyên (Kiệt Xuất HSK 8)' },
          { stageShort: 'Heo Đen Chí Tôn', stageName: '至尊黑猪 • Thần Thoại', title: 'Heo Đen Chí Tôn (Truyền Thuyết HSK 9)' }
        ];
        const st = stages[Math.min(level - 1, stages.length - 1)];
        const suffix = level > stages.length ? (' +' + (level - stages.length)) : '';
        const title = (appState.customTitle ? (appState.customTitle + ' • ') : '') + st.title + suffix;
        const currentLevelExp = (Number(exp) || 0) % 100;
        return { level, title, stageShort: st.stageShort + suffix, stageName: st.stageName, currentLevelExp };
      }

      function addReward(expDelta, gemsDelta, reason, idempotencyKey) {
        const oldLevel = Math.floor(appState.exp / 100) + 1;
        if (expDelta !== 0) appendLedgerEntry('xp', expDelta, reason, idempotencyKey ? (idempotencyKey + '_xp') : null);
        if (gemsDelta !== 0) appendLedgerEntry('gem', gemsDelta, reason, idempotencyKey ? (idempotencyKey + '_gem') : null);
        const balances = computeUserBalancesFromLedger();
        appState.exp = balances.xp;
        appState.gems = balances.gems;
        appState.todayMinutes = Math.min(240, appState.todayMinutes + 3);
        appState.weeklyMinutes[6] = appState.todayMinutes;
        recordStudyDayMinutes(3);
        const newLevel = Math.floor(appState.exp / 100) + 1;

        if (newLevel > oldLevel) {
          playSfx('levelup');
          showToast('🎉 Thăng Cấp! Bạn đã đạt Lv.' + newLevel + ' (+' + expDelta + ' EXP, +' + gemsDelta + ' 💎)', 'amber');
        } else {
          showToast('✨ +' + expDelta + ' EXP, +' + gemsDelta + ' 💎 — ' + reason, 'emerald');
        }
        saveStateToDatabase(reason, '+' + expDelta + ' EXP');
      }

      function progressQuest(questKey) {
        const q = appState.dailyQuests && appState.dailyQuests[questKey];
        if (!q || q.done) return;
        q.current = Math.min(q.target, q.current + 1);
        if (q.current >= q.target && !q.done) {
          q.done = true;
          appState.gems += q.reward;
          playSfx('levelup');
          showToast('🏆 Hoàn thành nhiệm vụ ngày: ' + q.title + ' (+' + q.reward + ' 💎)', 'amber');
        }
        renderDailyQuests();
        saveStateToDatabase();
      }

      function updateHudAndResumeBanner() {
        const rank = getRankInfo(appState.exp);
        document.getElementById('hudRankTitle').textContent = 'Lv.' + rank.level + ' ' + rank.title;
        const brandNameEl = document.getElementById('hudBrandName');
        if (brandNameEl) brandNameEl.textContent = 'BlackPig • ' + rank.stageShort;
        const brandBadgeEl = document.getElementById('hudBrandStageBadge');
        if (brandBadgeEl) brandBadgeEl.textContent = rank.stageName + ' (Lv.' + rank.level + ')';
        document.getElementById('hudExpText').textContent = rank.currentLevelExp + ' / 100 EXP';
        document.getElementById('hudExpBar').style.width = Math.max(8, rank.currentLevelExp) + '%';
        document.getElementById('hudStreak').textContent = appState.streak;
        document.getElementById('hudGems').textContent = appState.gems;
        document.getElementById('hudHearts').textContent = appState.hearts;
        document.getElementById('shopGemsBalance').textContent = appState.gems;
        document.getElementById('badgeSrsCount').textContent = appState.srsWords.length;
        document.getElementById('srsDueBadge').textContent = 'Đang có: ' + appState.srsWords.length + ' thẻ';
        document.getElementById('srsTotalWordsCount').textContent = appState.srsWords.length;

        // Resume Banner
        const currentLesson = CURRICULUM_NODES.find(n => n.id === appState.lastLessonId) || CURRICULUM_NODES[0];
        document.getElementById('lastSavedTimestamp').textContent = appState.lastUpdated || 'Đã lưu tự động';
        document.getElementById('resumeLessonTitle').textContent = 'Đang học dở: ' + currentLesson.realmName + ' — ' + currentLesson.title;
        document.getElementById('resumeDailyMinutes').textContent = appState.todayMinutes + ' / ' + appState.dailyGoalMinutes + ' phút';
        document.getElementById('resumeMasteredWords').textContent = appState.srsWords.length;
        const completedCount = Object.keys(appState.completedLessons || {}).length;
        document.getElementById('resumeLessonsCount').textContent = completedCount + '/' + CURRICULUM_NODES.length;
      }

      function renderDailyQuests() {
        const container = document.getElementById('dailyQuestsList');
        const summary = document.getElementById('questCompletedSummary');
        if (!container) return;
        if (!appState.dailyQuests || typeof appState.dailyQuests.q_lesson !== 'object') {
          appState.dailyQuests = JSON.parse(JSON.stringify(defaultState.dailyQuests));
        }
        const keys = Object.keys(appState.dailyQuests);
        let doneCount = 0;
        container.innerHTML = keys.map(k => {
          const q = appState.dailyQuests[k];
          if (q.done) doneCount++;
          const pct = Math.round((q.current / q.target) * 100);
          return `
            <div class="p-2.5 rounded-xl bg-slate-950 border ${q.done ? 'border-emerald-500/50' : 'border-slate-800'} space-y-1.5">
              <div class="flex items-center justify-between gap-1">
                <span class="font-semibold ${q.done ? 'text-emerald-400 line-through' : 'text-slate-200'}">${q.title}</span>
                <span class="text-amber-300 font-bold shrink-0">+${q.reward} 💎</span>
              </div>
              <div class="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-emerald-500 transition-all" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
        if (summary) summary.textContent = doneCount + '/' + keys.length;
      }

      // =====================================================
      // 8. ADVENTURE MAP & INTERACTIVE LESSON ENGINE
      // =====================================================
      let activeRealmFilter = 'all';
      let currentModalLesson = null;
      let currentModalStep = 0; // 0 = Theory & Vocab, 1..N = Quiz questions

      function renderAdventureMap() {
        const grid = document.getElementById('adventureNodesGrid');
        if (!grid) return;

        const filtered = CURRICULUM_NODES.filter(n => activeRealmFilter === 'all' || String(n.realm) === String(activeRealmFilter));
        grid.innerHTML = filtered.map((node, idx) => {
          const stars = appState.completedLessons[node.id] || 0;
          const isCurrent = node.id === appState.lastLessonId;
          const prevNode = idx > 0 ? filtered[idx - 1] : null;
          const isUnlocked = appState.unlockAll || idx === 0 || stars > 0 || (prevNode && appState.completedLessons[prevNode.id]);

          const realmColors = {
            0: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40',
            1: 'from-teal-500/20 to-cyan-500/10 border-teal-500/40',
            2: 'from-amber-500/20 to-orange-500/10 border-amber-500/40',
            3: 'from-violet-500/20 to-purple-500/10 border-violet-500/40',
            4: 'from-rose-500/20 to-pink-500/10 border-rose-500/40',
            5: 'from-blue-500/20 to-indigo-500/10 border-blue-500/40',
            6: 'from-amber-400/25 to-rose-500/20 border-amber-400/60'
          };

          const starDisplay = [1, 2, 3].map(s => `<span class="${s <= stars ? 'text-amber-400' : 'text-slate-700'}">★</span>`).join('');

          return `
            <div class="rounded-2xl bg-gradient-to-br ${realmColors[node.realm] || realmColors[0]} border p-4 sm:p-5 flex flex-col justify-between gap-3 transition hover:-translate-y-0.5 ${isCurrent ? 'node-glow' : ''}">
              <div class="space-y-2">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 border border-emerald-500/30">${node.realmName}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-sm tracking-widest">${starDisplay}</span>
                    <span class="text-xs font-bold text-amber-300">+${node.rewardExp} EXP</span>
                  </div>
                </div>
                <h3 class="text-base sm:text-lg font-extrabold text-white">${node.title}</h3>
                <p class="text-xs text-slate-300 leading-relaxed">${node.subtitle}</p>
                <div class="flex flex-wrap gap-1.5 pt-1">
                  ${node.vocab.map(v => `<span class="px-2 py-0.5 rounded-lg bg-slate-950/70 border border-slate-800 text-xs hanzi-font text-amber-300">${v.hanzi} <span class="text-slate-400 font-sans">(${v.pinyin})</span></span>`).join('')}
                </div>
              </div>
              <div class="flex items-center justify-between pt-2 border-t border-slate-800/70">
                <span class="text-xs ${stars > 0 ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${stars > 0 ? '✅ Đã vượt ải (' + stars + ' sao)' : (isCurrent ? '📍 Đang học dở' : 'Sẵn sàng chinh phục')}</span>
                <button data-open-lesson="${node.id}" class="open-lesson-btn px-4 py-2 rounded-xl ${isUnlocked ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-500'} font-extrabold text-xs transition">
                  ${stars > 0 ? '🔄 Ôn Lại Ải' : '⚔️ Vào Học & Vượt Ải'}
                </button>
              </div>
            </div>
          `;
        }).join('');
      }

      function openLessonModal(lessonId) {
        const idx = CURRICULUM_NODES.findIndex(n => n.id === lessonId);
        const node = CURRICULUM_NODES[idx];
        if (!node) return;
        const stars = (appState.completedLessons && appState.completedLessons[node.id]) || 0;
        const prevNode = idx > 0 ? CURRICULUM_NODES[idx - 1] : null;
        const isUnlocked = appState.unlockAll || idx === 0 || stars > 0 || (prevNode && appState.completedLessons && appState.completedLessons[prevNode.id]);
        if (!isUnlocked) {
          playSfx('wrong');
          showToast('🔒 Ải này đang khóa! Hãy vượt ải trước đó hoặc bật "Chế độ Tự Do Khám Phá" nhé.', 'rose');
          return;
        }
        currentModalLesson = node;
        currentModalStep = 0;
        dailyQuizSelections = {};
        activeLessonSkillTab = 'theory';
        appState.lastLessonId = node.id;
        saveStateToDatabase('Mở bài học: ' + node.title);

        document.getElementById('modalRealmBadge').textContent = node.realmName;
        document.getElementById('modalLessonTitle').textContent = node.title;
        document.getElementById('lessonModal').classList.remove('hidden');
        renderModalStep();
      }

      
      // =====================================================
      // 8B. STRUCTURED 4-5 MONTH COURSES, 4-SKILL LESSONS, AUTH & EXAM ENGINE
      // =====================================================
      const HSK_COURSES_DATA = [
        {
          courseId: 1,
          code: 'HSK 1',
          fromLevel: 0,
          toLevel: 1,
          duration: '4 Tháng (16 Tuần)',
          title: 'Khóa 1: Từ Mất Gốc Hoàn Toàn ➔ Đạt Chuẩn HSK 1',
          desc: 'Dành cho người bắt đầu từ con số 0: Làm chủ Pinyin, 4 thanh điệu, biến điệu, 8 nét cơ bản, 50 bộ thủ thông dụng, 150 từ vựng và 4 kỹ năng Nghe - Nói - Đọc - Viết sơ cấp.',
          realms: [0, 1],
          months: [
            { m: 1, name: 'Tháng 1: Ngữ Âm Pinyin & Chữ Hán Nền Tảng', focus: 'Nghe chuẩn 21 thanh mẫu, 36 vận mẫu, 4 thanh điệu; viết 8 nét cơ bản & quy tắc bút thuận.', skills: ['🎧 Nghe phân biệt âm bật hơi b/p, d/t, j/q/x', '🗣️ Nói chuẩn biến điệu 你好, 不, 一', '📖 Đọc bảng ghép âm Pinyin & 20 bộ thủ đầu tiên', '✍️ Viết các chữ Hán tượng hình 人, 口, 女, 好, 中, 国'] },
            { m: 2, name: 'Tháng 2: Giao Tiếp Chào Hỏi & Nhân Thân', focus: 'Giới thiệu tên, quốc tịch, nghề nghiệp, gia đình và đại từ nghi vấn 什么, 谁, 哪.', skills: ['🎧 Nghe đoạn hội thoại làm quen người bản xứ', '🗣️ Phản xạ giới thiệu bản thân trong 60 giây', '📖 Đọc hiểu đoạn văn ngắn về gia đình & bạn bè', '✍️ Viết câu với động từ 是, 叫 và trợ từ nghi vấn 吗, 呢'] },
            { m: 3, name: 'Tháng 3: Con Số, Thời Gian, Mua Sắm & Ẩm Thực', focus: 'Hỏi giờ giấc, ngày tháng, gọi đồ ăn/trà sữa và hỏi giá tiền 多少钱.', skills: ['🎧 Nghe báo giá tiền, số điện thoại và giờ tàu chạy', '🗣️ Thực hành gọi món và thanh toán tại quán ăn', '📖 Đọc thực đơn tiếng Trung và lịch trình ngày', '✍️ Sắp xếp câu có Trạng ngữ chỉ thời gian + Địa điểm'] },
            { m: 4, name: 'Tháng 4: Tổng Ôn 4 Kỹ Năng & Luyện Đề Thi HSK 1', focus: 'Hệ thống hóa 150 từ vựng, 45 cấu trúc câu và thi thử sát hạch cuối khóa HSK 1.', skills: ['🎧 Luyện nghe 20 câu chuẩn cấu trúc đề thi HSK 1', '🗣️ Thi vấn đáp 1-1 cùng Giảng viên AI Tiểu Long', '📖 Đọc hiểu nhanh không cần nhìn Pinyin', '✍️ Hoàn thành Bài Thi Sát Hạch Cuối Khóa HSK 1'] }
          ],
          examQuestions: [
            { id: 'ex1_1', skill: '🎧 Kỹ năng Nghe & Ngữ âm', q: 'Khi hai chữ Thanh 3 đi liền nhau như "你好" (nǐ hǎo), cách phát âm chuẩn là gì?', options: ['Chữ đầu biến thành Thanh 2: ní hǎo', 'Giữ nguyên hai thanh 3 nặng', 'Đọc thành hai thanh 4: nì hào', 'Bỏ dấu cả hai chữ'], answer: 0, theory: 'Quy tắc biến điệu Thanh 3: Khi hai âm tiết Thanh 3 đứng liền nhau (3 + 3), âm tiết thứ nhất bắt buộc đọc thành Thanh 2 (2 + 3) để giọng tự nhiên.' },
            { id: 'ex1_2', skill: '🗣️ Kỹ năng Nói & Giao tiếp', q: 'Muốn hỏi người đối diện "Cái này bao nhiêu tiền?", bạn nói câu nào?', options: ['这个多少钱？(Zhège duōshao qián?)', '这个什么名字？', '现在几点了？', '你是哪国人？'], answer: 0, theory: 'Cấu trúc hỏi giá tiền thông dụng nhất: 这个/那个 + 多少钱？ (duōshao qián = bao nhiêu tiền).' },
            { id: 'ex1_3', skill: '📖 Kỹ năng Đọc hiểu', q: 'Đọc câu: "我明天在学校学习中文。" — Người nói sẽ làm gì vào ngày mai?', options: ['Học tiếng Trung ở trường học', 'Đi du lịch Trung Quốc', 'Dạy tiếng Việt ở trường', 'Mua sách ở hiệu sách'], answer: 0, theory: '明天 (ngày mai) + 在学校 (ở trường học) + 学习中文 (học tiếng Trung).' },
            { id: 'ex1_4', skill: '✍️ Kỹ năng Viết & Ngữ pháp', q: 'Chọn trật tự câu ĐÚNG ngữ pháp tiếng Trung: "Tôi là người Việt Nam"', options: ['我是越南人。(Wǒ shì Yuènán rén.)', '我越南是人。', '我是人越南。', '越南人是我吗。'], answer: 0, theory: 'Cấu trúc: Chủ ngữ (我) + 是 (là) + Tên nước (越南) + 人 (người).' }
          ]
        },
        {
          courseId: 2,
          code: 'HSK 2',
          fromLevel: 1,
          toLevel: 2,
          duration: '4 Tháng (16 Tuần)',
          title: 'Khóa 2: Từ HSK 1 ➔ Đạt Chuẩn HSK 2 (Giao Tiếp Đời Sống)',
          desc: 'Mở rộng lên 300–500 từ vựng, làm chủ câu so sánh 比, trải nghiệm 过, bổ ngữ kết quả và giao tiếp mua sắm, hỏi đường, khám bệnh.',
          realms: [2],
          months: [
            { m: 1, name: 'Tháng 1: Sinh Hoạt Hàng Ngày & Thời Tiết', focus: 'Mô tả thời tiết, thói quen, sở thích và động từ năng nguyện 要, 想, 可以.', skills: ['🎧 Nghe dự báo thời tiết & lịch trình cuối tuần', '🗣️ Nói về sở thích cá nhân và kế hoạch nghỉ lễ', '📖 Đọc hội thoại đặt phòng khách sạn', '✍️ Viết đoạn văn ngắn 50 chữ mô tả một ngày của bạn'] },
            { m: 2, name: 'Tháng 2: Mua Sắm, Mặc Cả & Câu So Sánh Chữ 比', focus: 'So sánh hơn kém với 比 (bǐ), lượng từ và kỹ năng thương lượng giá cả.', skills: ['🎧 Nghe hội thoại mặc cả tại chợ đêm Thượng Hải', '🗣️ Luyện nói xin giảm giá & so sánh chất lượng sản phẩm', '📖 Đọc thông tin khuyến mãi, giảm giá', '✍️ Viết câu so sánh A 比 B + Tính từ (không dùng 很)'] },
            { m: 3, name: 'Tháng 3: Hỏi Đường, Khoảng Cách (离) & Trải Nghiệm (过)', focus: 'Phân biệt trạng thái 正在, hoàn thành 了 và trải nghiệm quá khứ 过.', skills: ['🎧 Nghe chỉ đường tàu điện ngầm & sân bay', '🗣️ Hỏi khoảng cách A 离 B 远不远', '📖 Đọc nhật ký du lịch Bắc Kinh - Thượng Hải', '✍️ Viết câu kể về những nơi đã từng đi qua (去过)'] },
            { m: 4, name: 'Tháng 4: Bổ Ngữ Kết Quả & Thi Cuối Khóa HSK 2', focus: 'Làm chủ bổ ngữ kết quả (完, 好, 懂, 见, 到) và vượt qua đề thi sát hạch HSK 2.', skills: ['🎧 Tổng duyệt nghe hiểu 35 câu HSK 2', '🗣️ Phản xạ tình huống đời sống cùng AI', '📖 Đọc hiểu tốc độ nhanh 300 từ vựng HSK 2', '✍️ Thi Sát Hạch Cuối Khóa HSK 2'] }
          ],
          examQuestions: [
            { id: 'ex2_1', skill: '🎧 Kỹ năng Nghe & Tình huống', q: 'Trong câu "太贵了，便宜一点吧！", người nói đang muốn làm gì?', options: ['Mặc cả xin giảm giá rẻ hơn một chút', 'Khen món hàng quá rẻ', 'Hỏi đường đi siêu thị', 'Đổi sang màu sắc khác'], answer: 0, theory: '太贵了 (Đắt quá rồi) + 便宜一点吧 (Rẻ hơn một chút đi) là mẫu câu mặc cả kinh điển.' },
            { id: 'ex2_2', skill: '🗣️ Kỹ năng Nói & Khoảng cách', q: 'Để nói "Nhà tôi cách công ty rất gần", câu nào đúng?', options: ['我家离公司很近。', '我家从公司很近。', '我家在公司很近。', '我家比公司很近。'], answer: 0, theory: 'Giới từ 离 (lí) dùng để chỉ khoảng cách giữa 2 địa điểm: A + 离 + B + 很近/很远.' },
            { id: 'ex2_3', skill: '📖 Kỹ năng Đọc & Trải nghiệm', q: 'Câu "我没去过北京" có nghĩa chính xác là gì?', options: ['Tôi chưa từng đi Bắc Kinh', 'Tôi đang ở Bắc Kinh', 'Ngày mai tôi đi Bắc Kinh', 'Tôi không thích Bắc Kinh'], answer: 0, theory: 'Cấu trúc 没(有) + Động từ + 过 diễn tả một việc CHƯA TỪNG trải qua trong quá khứ.' },
            { id: 'ex2_4', skill: '✍️ Kỹ năng Viết & Ngữ pháp 比', q: 'Chọn câu so sánh ĐÚNG ngữ pháp tiếng Trung:', options: ['今天比昨天热。(Hôm nay nóng hơn hôm qua)', '今天比昨天很热。', '今天热比昨天。', '比今天昨天热。'], answer: 0, theory: 'Trong câu so sánh A 比 B + Tính từ, tuyệt đối KHÔNG đặt phó từ 很 (rất) trước tính từ.' }
          ]
        },
        {
          courseId: 3,
          code: 'HSK 3',
          fromLevel: 2,
          toLevel: 3,
          duration: '4.5 Tháng (18 Tuần)',
          title: 'Khóa 3: Từ HSK 2 ➔ Đạt Chuẩn HSK 3 (Phản Xạ Trung Cấp)',
          desc: 'Chinh phục 600–1000 từ vựng, làm chủ câu chữ 把 (bǎ), câu bị động 被 (bèi), bổ ngữ xu hướng kép và viết đoạn văn hoàn chỉnh.',
          realms: [3],
          months: [
            { m: 1, name: 'Tháng 1: Bổ Ngữ Xu Hướng & Bổ Ngữ Khả Năng', focus: 'Diễn tả hướng di chuyển (上来, 下去, 出来, 进去) và khả năng đạt kết quả (听得懂 / 听不懂).', skills: ['🎧 Nghe hội thoại miêu tả hành động thực tế', '🗣️ Nói lưu loát các cụm bổ ngữ khả năng', '📖 Đọc truyện ngắn song ngữ trung cấp', '✍️ Viết câu với bổ ngữ xu hướng đơn và kép'] },
            { m: 2, name: 'Tháng 2: Chuyên Đề Câu Chữ 把 (bǎ)', focus: 'Nắm vững khi nào bắt buộc dùng câu chữ 把 để xử lý/thay đổi trạng thái sự vật.', skills: ['🎧 Nghe mệnh lệnh và nhờ vả trong công việc/gia đình', '🗣️ Thực hành nhờ người khác với 请把……', '📖 Đọc phân tích cấu trúc Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả', '✍️ Chuyển đổi 20 câu thường sang câu chữ 把 chuẩn xác'] },
            { m: 3, name: 'Tháng 3: Câu Bị Động Chữ 被 (bèi) & Liên Từ Phức Câu', focus: 'Sử dụng 被, 叫, 让 và các cặp liên từ 虽然…但是…, 不但…而且…, 只要…就…', skills: ['🎧 Nghe bản tin ngắn và tình huống sự cố', '🗣️ Kể lại câu chuyện có dùng câu bị động và liên từ', '📖 Đọc bài luận ngắn 250 chữ Hán', '✍️ Viết đoạn văn nghị luận ngắn bằng liên từ phức hợp'] },
            { m: 4, name: 'Tháng 4 - 4.5: Luyện Viết Đoạn Văn & Thi Cuối Khóa HSK 3', focus: 'Rèn kỹ năng sắp xếp câu phần Viết HSK 3 và thi sát hạch toàn diện 4 kỹ năng.', skills: ['🎧 Luyện nghe 40 câu chuẩn đề thi HSK 3', '🗣️ Thi nói HSKK Sơ - Trung cấp (Nhại lại câu & Trả lời câu hỏi)', '📖 Đọc lướt tìm ý chính (Skimming & Scanning)', '✍️ Thi Sát Hạch Cuối Khóa HSK 3'] }
          ],
          examQuestions: [
            { id: 'ex3_1', skill: '✍️ Kỹ năng Viết & Câu chữ 把', q: 'Sắp xếp thành câu chữ 把 đúng ngữ pháp: "Tôi đã làm xong bài tập rồi"', options: ['我把作业做完了。', '我做完把作业了。', '把作业我做完了。', '我把做完作业了。'], answer: 0, theory: 'Công thức câu chữ 把: Chủ ngữ (我) + 把 + Tân ngữ (作业) + Động từ (做) + Bổ ngữ kết quả (完了).' },
            { id: 'ex3_2', skill: '📖 Kỹ năng Đọc & Câu bị động 被', q: 'Câu "我的蛋糕被弟弟吃了" có nghĩa là gì?', options: ['Bánh ngọt của tôi bị em trai ăn mất rồi', 'Tôi ăn bánh ngọt của em trai', 'Em trai mua bánh ngọt cho tôi', 'Bánh ngọt của tôi chưa ăn'], answer: 0, theory: 'Cấu trúc bị động: Chủ ngữ chịu tác động (我的蛋糕) + 被 + Tác nhân (弟弟) + Động từ + Kết quả (吃了).' },
            { id: 'ex3_3', skill: '🎧 Kỹ năng Nghe & Liên từ', q: 'Cặp liên từ "不但……而且……" mang ý nghĩa gì?', options: ['Không những... mà còn...', 'Mặc dù... nhưng...', 'Thà... chứ không...', 'Bất kể... đều...'], answer: 0, theory: '不但 A, 而且 B (Bất đản... nhi thả...) dùng để nối hai vế câu có quan hệ tăng tiến.' }
          ]
        },
        {
          courseId: 4,
          code: 'HSK 4',
          fromLevel: 3,
          toLevel: 4,
          duration: '5 Tháng (20 Tuần)',
          title: 'Khóa 4: Từ HSK 3 ➔ Đạt Chuẩn HSK 4 (Công Sở & Thuyết Trình)',
          desc: 'Làm chủ 1200–2000 từ vựng, giao tiếp thương mại công sở, phỏng vấn xin việc, phân biệt từ đồng nghĩa và viết bài luận HSK 4.',
          realms: [4],
          months: [
            { m: 1, name: 'Tháng 1: Tiếng Trung Công Sở & Tuyển Dụng', focus: 'Từ vựng phỏng vấn, CV, kinh nghiệm làm việc (经验), phụ trách (负责), liên hệ (联系).', skills: ['🎧 Nghe hội thoại phỏng vấn xin việc', '🗣️ Tự giới thiệu bản thân chuyên nghiệp trước nhà tuyển dụng', '📖 Đọc email công việc & thông báo công ty', '✍️ Viết email xin ứng tuyển bằng tiếng Trung'] },
            { m: 2, name: 'Tháng 2: Phân Biệt Từ Cận Nghĩa Trung Cấp', focus: 'Phân biệt rõ 适合 vs 合适, 刚才 vs 刚, 尽管 vs 虽然, 到底 vs 终于.', skills: ['🎧 Nghe phân tích ngữ cảnh dùng từ', '🗣️ Đặt câu phản xạ với các cặp từ dễ nhầm', '📖 Đọc hiểu báo chí xã hội trung cấp', '✍️ Bài tập điền từ vào chỗ trống chuẩn đề HSK 4'] },
            { m: 3, name: 'Tháng 3: Liên Từ Văn Viết & Cấu Trúc Nghị Luận', focus: 'Sử dụng 既然…就…, 无论…都…, 甚至, 相反, 从而.', skills: ['🎧 Nghe bài diễn thuyết ngắn về văn hóa & lối sống', '🗣️ Trình bày quan điểm cá nhân (Đồng tình / Phản đối)', '📖 Đọc hiểu các đoạn văn khoa học thường thức', '✍️ Viết đoạn văn nêu quan điểm 100 chữ Hán'] },
            { m: 4, name: 'Tháng 4: Giao Tiếp Thương Mại & Đàm Phán Cơ Bản', focus: 'Đặt hàng, báo giá, hợp đồng, chất lượng sản phẩm và dịch vụ khách hàng.', skills: ['🎧 Nghe đàm phán đơn hàng với đối tác Trung Quốc', '🗣️ Thực hành thương lượng giá sỉ & tiến độ giao hàng', '📖 Đọc điều khoản đơn hàng cơ bản', '✍️ Soạn tin nhắn WeChat làm việc với xưởng Trung Quốc'] },
            { m: 5, name: 'Tháng 5: Tổng Ôn Chuyên Sâu & Thi Cuối Khóa HSK 4', focus: 'Giải đề HSK 4 thực chiến (Nghe - Đọc - Viết) và thi vấn đáp HSKK Trung cấp.', skills: ['🎧 Luyện nghe 45 câu HSK 4 tốc độ thực tế', '🗣️ Mô tả tranh & trả lời câu hỏi HSKK Trung cấp', '📖 Luyện đọc nhanh 40 câu đọc hiểu HSK 4', '✍️ Thi Sát Hạch Cuối Khóa HSK 4'] }
          ],
          examQuestions: [
            { id: 'ex4_1', skill: '📖 Kỹ năng Đọc & Phân biệt từ', q: 'Chọn từ điền đúng vào câu: "这份工作非常_______你。" (Công việc này rất phù hợp với bạn.)', options: ['适合 (shìhé - Động từ nhận tân ngữ 你)', '合适 (héshì - Tính từ không nhận tân ngữ)', '习惯 (xíguàn)', '流利 (liúlì)'], answer: 0, theory: '适合 (Thích hợp) là động từ nên đứng trước tân ngữ (适合你). Còn 合适 (Hợp thích) là tính từ, không mang tân ngữ theo sau.' },
            { id: 'ex4_2', skill: '🗣️ Kỹ năng Nói Công sở', q: 'Trong buổi phỏng vấn, để nói "Tôi phụ trách thị trường Việt Nam", bạn nói thế nào?', options: ['我负责越南市场。(Wǒ fùzé Yuènán shìchǎng.)', '我经验越南市场。', '我联系越南市场。', '我合适越南市场。'], answer: 0, theory: 'Động từ 负责 (fùzé - phụ trách/chịu trách nhiệm) + mảng công việc hoặc thị trường.' },
            { id: 'ex4_3', skill: '✍️ Kỹ năng Viết & Liên từ', q: 'Liên từ "既然" (jìrán - Đã... thì...) thường kết hợp với phó từ nào ở vế câu sau?', options: ['就 (jiù)', '但是 (dànshì)', '因为 (yīnwèi)', '虽然 (suīrán)'], answer: 0, theory: 'Cấu trúc suy luận 既然 A，就 B (Đã A rồi, thì hãy B).' }
          ]
        },
        {
          courseId: 5,
          code: 'HSK 5',
          fromLevel: 4,
          toLevel: 5,
          duration: '5 Tháng (20 Tuần)',
          title: 'Khóa 5: Từ HSK 4 ➔ Đạt Chuẩn HSK 5 (Báo Chí, Kinh Tế & Thành Ngữ)',
          desc: 'Làm chủ 2500–4000 từ vựng, đọc báo chí kinh tế, sử dụng thành ngữ 4 chữ (成语), đàm phán hợp đồng và viết bài luận 400 chữ.',
          realms: [5],
          months: [
            { m: 1, name: 'Tháng 1: Ngôn Ngữ Báo Chí & Kinh Tế Vĩ Mô', focus: 'Các cụm kết hợp cố định (Collocations): 采取措施, 促进发展, 达成协议, 发展趋势.', skills: ['🎧 Nghe bản tin thời sự kinh tế Trung Quốc', '🗣️ Thảo luận về xu hướng thương mại điện tử', '📖 Đọc bài báo kinh tế - công nghệ 500 chữ', '✍️ Tóm tắt bản tin bằng văn phong trang trọng'] },
            { m: 2, name: 'Tháng 2: Tinh Hoa Tứ Tự Thành Ngữ (成语)', focus: 'Ứng dụng 50 thành ngữ HSK 5 cốt lõi: 熟能生巧, 画蛇添足, 半途而废, 一举两得.', skills: ['🎧 Nghe câu chuyện điển tích thành ngữ Trung Hoa', '🗣️ Lồng ghép thành ngữ vào giao tiếp để tăng sức thuyết phục', '📖 Đọc hiểu văn bản văn hóa - lịch sử', '✍️ Đặt câu và viết đoạn văn sử dụng thành ngữ'] },
            { m: 3, name: 'Tháng 3: Hư Từ Cao Cấp & Ngữ Pháp Văn Viết', focus: 'Sử dụng 宁可…也不…, 与其…不如…, 哪怕, 况且, 何况, 从而.', skills: ['🎧 Nghe phỏng vấn chuyên gia & tọa đàm', '🗣️ Tranh biện bảo vệ quan điểm cá nhân', '📖 Phân tích cấu trúc câu phức nhiều tầng', '✍️ Viết bài nghị luận xã hội 300 chữ'] },
            { m: 4, name: 'Tháng 4: Luyện Viết Luận HSK 5 (Theo Từ Cho Sẵn & Theo Tranh)', focus: 'Phương pháp triển khai bố cục Mở - Thân - Kết chuẩn chấm thi HSK 5 phần Viết.', skills: ['🎧 Nghe tóm tắt câu chuyện dài', '🗣️ Thuyết trình độc thoại 3 phút theo chủ đề', '📖 Đọc điền từ vào đoạn văn (Cloze test)', '✍️ Thực hành viết bài luận 80 chữ (từ cho sẵn) & 100 chữ (xem tranh)'] },
            { m: 5, name: 'Tháng 5: Luyện Đề Toàn Diện & Thi Cuối Khóa HSK 5', focus: 'Bứt phá điểm số Nghe - Đọc - Viết và vượt qua kỳ thi sát hạch cuối khóa HSK 5.', skills: ['🎧 Luyện nghe 45 câu HSK 5 tốc độ bản ngữ', '🗣️ Thi vấn đáp HSKK Cao cấp phần 1', '📖 Giải đề đọc hiểu 45 câu HSK 5', '✍️ Thi Sát Hạch Cuối Khóa HSK 5'] }
          ],
          examQuestions: [
            { id: 'ex5_1', skill: '📖 Kỹ năng Đọc & Kết hợp từ (Collocation)', q: 'Động từ "采取" (cǎiqǔ - áp dụng) kết hợp chuẩn xác nhất với danh từ nào?', options: ['措施 (cuòshī - biện pháp)', '趋势 (qūshì - xu thế)', '双方 (shuāngfāng - song phương)', '经验 (jīngyàn - kinh nghiệm)'], answer: 0, theory: 'Cụm từ cố định HSK 5: 采取措施 (cǎiqǔ cuòshī = áp dụng biện pháp).' },
            { id: 'ex5_2', skill: '🗣️ Kỹ năng Nói & Thành ngữ (成语)', q: 'Để khuyên ai đó "Đừng bỏ cuộc giữa chừng", bạn dùng thành ngữ nào?', options: ['不要半途而废 (bàn tú ér fèi)', '不要画蛇添足 (huà shé tiān zú)', '不要一举两得 (yì jǔ liǎng dé)', '不要熟能生巧 (shú néng shēng qiǎo)'], answer: 0, theory: '半途而废 (Bán đồ nhi phế) = Đi nửa đường mà bỏ dở = Bỏ cuộc giữa chừng.' },
            { id: 'ex5_3', skill: '✍️ Kỹ năng Viết & Hư từ', q: 'Cấu trúc "宁可……也不……" (nìngkě... yě bù...) dùng để diễn tả ý gì?', options: ['Thà chấp nhận A chứ quyết không làm B', 'Không những A mà còn B', 'Vừa A vừa B', 'Vì A nên B'], answer: 0, theory: '宁可 A, 也不 B (Ninh khả... bất...) diễn tả sự đánh đổi dứt khoát.' }
          ]
        },
        {
          courseId: 6,
          code: 'HSK 6',
          fromLevel: 5,
          toLevel: 6,
          duration: '5 Tháng (20 Tuần)',
          title: 'Khóa 6: Từ HSK 5 ➔ Chinh Phục Đỉnh Cao HSK 6 (Thượng Thừa)',
          desc: 'Đỉnh cao 5000+ từ vựng, thành ngữ học thuật, bắt lỗi câu bệnh (病句), biên phiên dịch thương mại và viết tóm tắt bài văn 1000 chữ thành 400 chữ.',
          realms: [6],
          months: [
            { m: 1, name: 'Tháng 1: Từ Vựng Học Thuật & Thành Ngữ HSK 6', focus: 'Làm chủ các thành ngữ tần suất cao: 潜移默化, 根深蒂固, 迫在眉睫, 相辅相成, 举足轻重.', skills: ['🎧 Nghe diễn đàn học thuật & kinh tế quốc tế', '🗣️ Hùng biện phản biện về công nghệ & văn hóa', '📖 Đọc bình luận chuyên sâu trên Nhân Dân Nhật Báo', '✍️ Viết luận văn học thuật sử dụng thành ngữ HSK 6'] },
            { m: 2, name: 'Tháng 2: Chuyên Đề Bắt Lỗi Câu Bệnh (病句辨析)', focus: '6 dạng lỗi ngữ pháp kinh điển trong đề thi HSK 6: Khuyết chủ ngữ, Lặp từ, Phủ định kép sai, Cặp từ lệch.', skills: ['🎧 Nghe nhận diện câu diễn đạt chuẩn vs câu rườm rà', '🗣️ Tự sửa lỗi diễn đạt khẩu ngữ sang văn phong chuẩn', '📖 Phân tích 100 câu bệnh (病句) thực chiến', '✍️ Sửa lại các câu sai ngữ pháp phức tạp'] },
            { m: 3, name: 'Tháng 3: Phân Biệt Từ Đồng Nghĩa Tinh Vi & Điền Từ Đọc Hiểu', focus: 'Phân biệt sắc thái biểu cảm, phạm vi kết hợp của các từ đồng nghĩa cấp độ C2.', skills: ['🎧 Nghe phỏng vấn chuyên sâu tốc độ cao', '🗣️ Diễn đạt cùng một ý bằng 3 cấp độ từ vựng khác nhau', '📖 Luyện phần Đọc chọn từ điền vào đoạn văn (HSK 6 Phần 2)', '✍️ Biên dịch Việt - Trung văn bản hợp đồng thương mại'] },
            { m: 4, name: 'Tháng 4: Kỹ Thuật Viết Tóm Tắt Văn Bản (缩写 400 Chữ)', focus: 'Đọc bài văn 1000 chữ trong 10 phút và viết tóm tắt lại thành 400 chữ trong 35 phút.', skills: ['🎧 Nghe và ghi tốc ký (Note-taking) các luận điểm chính', '🗣️ Tóm tắt miệng nội dung bài đọc trong 2 phút', '📖 Kỹ thuật lọc cốt truyện / luận điểm chính phụ', '✍️ Thực hành viết bài 缩写 (Tóm tắt) chuẩn tiêu chí HSK 6'] },
            { m: 5, name: 'Tháng 5: Tổng Duyệt HSK 6 & Tốt Nghiệp Tông Sư Hán Ngữ', focus: 'Hoàn thiện toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết ở cảnh giới cao nhất.', skills: ['🎧 Luyện nghe 50 câu HSK 6 thực chiến', '🗣️ Thi vấn đáp HSKK Cao cấp toàn trình', '📖 Đọc hiểu tốc độ 250 chữ/phút', '✍️ Thi Sát Hạch Tốt Nghiệp HSK 6'] }
          ],
          examQuestions: [
            { id: 'ex6_1', skill: '📖 Kỹ năng Đọc & Bắt lỗi câu bệnh (病句)', q: 'Câu "通过这次学习，使我提高了中文水平。" mắc lỗi ngữ pháp gì trong đề thi HSK 6?', options: ['Thiếu chủ ngữ do dùng đồng thời cả "通过..." và "使..."', 'Sai vị trí bổ ngữ thời lượng', 'Dùng sai lượng từ', 'Không có lỗi ngữ pháp'], answer: 0, theory: 'Khi đầu câu có giới từ "通过/经过..." và vế sau lại có "使/让...", cả hai vế đều biến thành cụm giới từ làm câu bị KHUYẾT CHỦ NGỮ. Phải bỏ "通过" hoặc bỏ "使".' },
            { id: 'ex6_2', skill: '🗣️ Kỹ năng Nói & Hùng biện học thuật', q: 'Muốn diễn tả "Lý thuyết và thực hành bổ trợ lẫn nhau cùng phát triển", thành ngữ HSK 6 nào đúng nhất?', options: ['相辅相成 (xiāng fǔ xiāng chéng)', '迫在眉睫 (pò zài méi jié)', '根深蒂固 (gēn shēn dì gù)', '画蛇添足 (huà shé tiān zú)'], answer: 0, theory: '相辅相成 (Tương phụ tương thành) chỉ hai sự vật hỗ trợ, bổ sung cho nhau không thể tách rời.' },
            { id: 'ex6_3', skill: '✍️ Kỹ năng Viết & Thành ngữ cấp bách', q: 'Thành ngữ "迫在眉睫" (pò zài méi jié) mô tả tình trạng gì?', options: ['Sự việc vô cùng cấp bách, đã sát ngay trước mắt', 'Mưa dầm thấm lâu biến đổi từ từ', 'Quan niệm ăn sâu bám rễ', 'Hoàn thiện tỉ mỉ từng chi tiết'], answer: 0, theory: '眉 (lông mày) 睫 (lông mi) —迫在眉睫 nghĩa là nguy cơ hoặc nhiệm vụ đã sát ngay trước mắt, cực kỳ khẩn cấp.' }
          ]
        }
      ];


      // Total Mandatory Days per Course matching the 3 Master Phases:
      // Phase 1 (HSK 1 - HSK 2): 2 - 4 months (60 days HSK 1 + 60 days HSK 2 = 120 days)
      // Phase 2 (HSK 3 - HSK 4): 4 - 8 months (120 days HSK 3 + 120 days HSK 4 = 240 days)
      // Phase 3 (HSK 5 - HSK 6): 8 - 12+ months (150 days HSK 5 + 150 days HSK 6 = 300 days)

      // =====================================================
      // LEARNER OUTCOMES & TANGIBLE VALUE RECEIVED PER COURSE (TRẢI NGHIỆM & GIÁ TRỊ ĐẦU RA CHO NGƯỜI HỌC)
      // =====================================================
      const COURSE_OUTCOMES_VALUE = {
        1: {
          badge: 'Cam Kết Đầu Ra HSK 1 (Đủ 150 Từ Chuẩn)',
          canDo: 'Phát âm chuẩn Pinyin & 4 thanh điệu; tự tin chào hỏi, giới thiệu bản thân, đếm số, hỏi giờ, gọi món ăn/trà sữa và hỏi giá tiền khi đi du lịch.',
          careerValue: 'Đủ kiến thức dự thi chứng chỉ HSK 1 quốc tế (do CTI/Hanban tổ chức); xây dựng nền tảng 50 bộ thủ và 150 từ vựng cốt lõi không bao giờ quên nhờ cơ chế ôn lồng ghép cuốn chiếu.',
          unlockReward: '🎖️ Cấp Chứng Chỉ HSK 1 + Danh hiệu "Tân Tinh Hán Ngữ" + +200 Linh Thạch + Mở khóa Kịch bản AI Gọi Món & Khóa HSK 2.'
        },
        2: {
          badge: 'Cam Kết Đầu Ra HSK 2 (Đủ 300 Từ Chuẩn)',
          canDo: 'Giao tiếp sinh hoạt đời sống trôi chảy: mặc cả khi mua sắm, hỏi đường tàu điện/sân bay, kể về sở thích, thời tiết, khám bệnh và so sánh sản phẩm.',
          careerValue: 'Đạt chuẩn HSK 2; tự mình đặt hàng Taobao/1688 cơ bản và giao tiếp tự nhiên với người bản xứ trong các tình huống hàng ngày.',
          unlockReward: '🎖️ Cấp Chứng Chỉ HSK 2 + Danh hiệu "Cao Thủ Giao Tiếp" + +300 Linh Thạch + Mở khóa Kịch bản AI Mặc Cả Thượng Hải & Khóa HSK 3.'
        },
        3: {
          badge: 'Cam Kết Đầu Ra HSK 3 (Đủ 600 Từ Chuẩn)',
          canDo: 'Phản xạ độc lập 4 kỹ năng Nghe - Nói - Đọc - Viết; làm chủ câu chữ 把, câu bị động 被; tự tin đi du lịch tự túc Trung Quốc và giao tiếp văn phòng cơ bản.',
          careerValue: 'Đủ điều kiện xét tuyển học bổng du học 1 năm tiếng tại Trung Quốc và miễn thi ngoại ngữ tốt nghiệp THPT.',
          unlockReward: '🎖️ Cấp Chứng Chỉ HSK 3 + Danh hiệu "Hiệp Khách Trung Cấp" + +400 Linh Thạch + Mở khóa Khóa HSK 4 Công Sở.'
        },
        4: {
          badge: 'Cam Kết Đầu Ra HSK 4 (Đủ 1.200 Từ Chuẩn)',
          canDo: 'Thuyết trình, viết email công việc, phỏng vấn xin việc và làm việc trực tiếp tại các tập đoàn đa quốc gia / doanh nghiệp Trung Quốc.',
          careerValue: 'Đủ điều kiện du học hệ Đại học tại Trung Quốc và ứng tuyển vị trí Chuyên viên Xuất nhập khẩu / Mua hàng / Trợ lý tiếng Trung mức lương hấp dẫn.',
          unlockReward: '🎖️ Cấp Chứng Chỉ HSK 4 + Danh hiệu "Tinh Anh Công Sở" + +550 Linh Thạch + Mở khóa Kịch bản AI Phỏng Vấn Đa Quốc Gia & Khóa HSK 5.'
        },
        5: {
          badge: 'Cam Kết Đầu Ra HSK 5 (Đủ 2.500 Từ Chuẩn)',
          canDo: 'Đọc hiểu báo chí kinh tế, xem phim/tin tức không cần phụ đề, đàm phán hợp đồng thương mại và vận dụng thành ngữ 4 chữ (成语) sắc bén.',
          careerValue: 'Đủ điều kiện học Thạc sĩ tại Trung Quốc; làm Quản lý dự án, Biên phiên dịch thương mại hoặc Giảng viên tiếng Trung sơ-trung cấp.',
          unlockReward: '🎖️ Cấp Chứng Chỉ HSK 5 + Danh hiệu "Đại Sư Thương Mại" + +750 Linh Thạch + Mở khóa Khóa Đỉnh Cao HSK 6.'
        },
        6: {
          badge: 'Cam Kết Đầu Ra HSK 6 (Đủ 5.000+ Từ Chuẩn)',
          canDo: 'Sử dụng tiếng Trung lưu loát, uyên bác như người bản xứ có trình độ đại học; hùng biện học thuật, viết luận 400+ chữ và biên phiên dịch cabin/chuyên ngành.',
          careerValue: 'Đỉnh cao năng lực Hán ngữ quốc tế (C2); săn học bổng Tiến sĩ/Thạc sĩ toàn phần và nắm giữ các vị trí Quản lý cấp cao / Chuyên gia ngôn ngữ.',
          unlockReward: '👑 Cấp Chứng Chỉ Tông Sư HSK 6 + Danh hiệu Kim Cương "Thượng Thừa Quốc Sư" + +1.000 Linh Thạch.'
        }
      };

      // =====================================================
      // MASSIVE CURATED VOCABULARY BANKS FOR HSK 1, HSK 2, HSK 3, HSK 4, HSK 5, HSK 6
      // Format: "Hanzi|Pinyin|HanViet|Meaning|SampleSentence"
      // =====================================================
      const RAW_HSK_VOCAB_BANKS = {
        1: [
          "我|wǒ|Ngã|Tôi, mình|我是学生。",
          "你|nǐ|Nhĩ|Bạn, anh, chị|你好！",
          "他|tā|Tha|Anh ấy, ông ấy|他很好。",
          "她|tā|Tha|Cô ấy, bà ấy|她是我朋友。",
          "我们|wǒmen|Ngã môn|Chúng tôi, chúng ta|我们是好朋友。",
          "好|hǎo|Hảo|Tốt, khỏe, đẹp|你好，我很好。",
          "您|nín|Nẫm|Ngài, ông, bà (kính trọng)|老师您好！",
          "你们|nǐmen|Nhĩ môn|Các bạn, các anh chị|你们好！",
          "他们|tāmen|Tha môn|Họ, bọn họ|他们也是学生。",
          "对不起|duìbuqǐ|Đối bất khởi|Xin lỗi|对不起，我来晚了。",
          "没关系|méi guānxi|Một quan hệ|Không sao đâu|对不起！— 没关系！",
          "谢谢|xièxie|Tạ tạ|Cảm ơn|谢谢你的帮助。",
          "不客气|bú kèqi|Bất khách khí|Đừng khách sáo|谢谢你！— 不客气！",
          "再见|zàijiàn|Tái kiến|Tạm biệt|明天见，再见！",
          "请|qǐng|Thỉnh|Xin mời, vui lòng|请您喝茶。",
          "叫|jiào|Khiếu|Gọi là, tên là|我叫明明，你呢？",
          "是|shì|Thị|Là, đúng, vâng|他是我们的老师。",
          "老师|lǎoshī|Lão sư|Giáo viên, thầy cô|王老师很好。",
          "学生|xuésheng|Học sinh|Học sinh, sinh viên|她们是好学生。",
          "人|rén|Nhân|Người, con người|他人很好。",
          "中国|Zhōngguó|Trung Quốc|Nước Trung Quốc|他是中国人。",
          "北京|Běijīng|Bắc Kinh|Thủ đô Bắc Kinh|我们去北京。",
          "汉语|Hànyǔ|Hán ngữ|Tiếng Trung, tiếng Hán|她是汉语老师。",
          "名字|míngzi|Danh tự|Tên, họ tên|请问你叫什么名字？",
          "朋友|péngyou|Bằng hữu|Bạn bè, người bạn|他是我的中国朋友。",
          "爸爸|bàba|Bá ba|Bố, ba, cha|我爸爸是好人。",
          "妈妈|māma|Ma ma|Mẹ, má|我妈妈是老师。",
          "儿子|érzi|Nhi tử|Con trai|他儿子是学生。",
          "女儿|nǚ’ér|Nữ nhi|Con gái|她女儿很漂亮。",
          "家|jiā|Gia|Nhà, gia đình|我们家在北京。",
          "医生|yīshēng|Y sinh|Bác sĩ|我爸爸是医生。",
          "医院|yīyuàn|Y viện|Bệnh viện|医生在医院工作。",
          "学校|xuéxiào|Học hiệu|Trường học|老师和学生在学校。",
          "商店|shāngdiàn|Thương điếm|Cửa hàng, tiệm|妈妈去商店买东西。",
          "饭店|fàndiàn|Phạn điếm|Nhà hàng, khách sạn|北京的饭店很好。",
          "在|zài|Tại|Ở, đang ở tại|我朋友在中国。",
          "哪儿|nǎr|Na nhi|Ở đâu, chỗ nào|请问学校在哪儿？",
          "这|zhè|Giá|Đây, cái này|这是我爸爸。",
          "那|nà|Na|Kia, cái kia, đó|那是医院，这是学校。",
          "谁|shéi|Thùy|Ai, người nào|那个人是谁？",
          "什么|shénme|Thập ma|Cái gì, gì|你叫什么名字？",
          "哪|nǎ|Na|Nào (nước nào, cái nào)|你是哪国人？",
          "几|jǐ|Kỷ|Mấy (hỏi số dưới 10)|你家有几个人？",
          "多少|duōshao|Đa thiểu|Bao nhiêu (trên 10)|学校有多少学生？",
          "不|bù|Bất|Không (hiện tại/tương lai)|我不是医生，我是老师。",
          "没|méi|Một|Chưa, không có (quá khứ)|我昨天没去医院。",
          "吗|ma|Ma|Phải không? (cuối câu hỏi)|她是你妈妈吗？",
          "呢|ne|Ni|Thế còn...? (hỏi ngược lại)|我是学生，你呢？",
          "的|de|Đích|Của (trợ từ sở hữu)|这是我的汉语书。",
          "了|le|Liễu|Rồi (hoàn thành/thay đổi)|他去学校了。",
          "一|yī|Nhất|Số 1|我有一个中国朋友。",
          "二|èr|Nhị|Số 2|一、二，我们去学校。",
          "三|sān|Tam|Số 3|我家有三口人。",
          "四|sì|Tứ|Số 4|那儿有四个学生。",
          "五|wǔ|Ngũ|Số 5|医院里有五个医生。",
          "六|liù|Lục|Số 6|我有六个好朋友。",
          "七|qī|Thất|Số 7|一个星期有七天。",
          "八|bā|Bát|Số 8|八个人在饭店吃饭。",
          "九|jiǔ|Cửu|Số 9|九个学生学汉语。",
          "十|shí|Thập|Số 10|这个十块钱。",
          "零|líng|Linh|Số 0, lẻ|一百零五。",
          "百|bǎi|Bách|Một trăm (100)|这个学校有五百个学生。",
          "个|gè|Cá|Cái, người (lượng từ)|三个老师，五个朋友。",
          "岁|suì|Tuế|Tuổi|你女儿今年几岁了？",
          "本|běn|Bản|Quyển, cuốn (sách)|我有三本汉语书。",
          "些|xiē|Ta|Một vài, những|这些人是我的朋友。",
          "块|kuài|Khối|Đồng, tệ (tiền), miếng|这本书二十块钱。",
          "钱|qián|Tiền|Tiền bạc|请问这个多少钱？",
          "多|duō|Đa|Nhiều, bao nhiêu|你爸爸今年多大了？",
          "大|dà|Đại|To, lớn|我们的学校很大。",
          "今天|jīntiān|Kim thiên|Hôm nay|今天我在学校学习。",
          "明天|míngtiān|Minh thiên|Ngày mai|明天我们再见！",
          "昨天|zuótiān|Tạc thiên|Hôm qua|昨天他没在家。",
          "年|nián|Niên|Năm|我在中国三年了。",
          "月|yuè|Nguyệt|Tháng|今天是九月一日。",
          "日|rì|Nhật|Ngày|明天是十月二日。",
          "星期|xīngqī|Tinh kỳ|Tuần, thứ trong tuần|今天星期五吗？",
          "点|diǎn|Điểm|Giờ (đồng hồ)|现在是早上八点。",
          "分钟|fēnzhōng|Phân chung|Phút|八点十分钟上课。",
          "现在|xiànzài|Hiện tại|Bây giờ, hiện tại|请问现在几点？",
          "时候|shíhou|Thời hậu|Lúc, khi|你什么时候去北京？",
          "上午|shàngwǔ|Thượng ngọ|Buổi sáng|今天上午我在学校。",
          "中午|zhōngwǔ|Trung ngọ|Buổi trưa|中午十二点我们在饭店。",
          "下午|xiàwǔ|Hạ ngọ|Buổi chiều|明天下午你在哪儿？",
          "去|qù|Khứ|Đi (đến nơi khác)|我明天去商店买东西。",
          "来|lái|Lai|Đến, tới|朋友今天来我家。",
          "回|huí|Hồi|Về, quay về|下午五点我回家。",
          "看|kàn|Khán|Xem, nhìn, đọc, thăm|我去看医生。",
          "听|tīng|Thính|Nghe|学生听老师说话。",
          "说|shuō|Thuyết|Nói|他会说汉语。",
          "读|dú|Độc|Đọc to|上午我读汉语书。",
          "写|xiě|Tả|Viết|请写你的名字。",
          "学习|xuéxí|Học tập|Học, học tập|我今天在学校学习汉语。",
          "工作|gōngzuò|Công tác|Làm việc, công việc|我爸爸在医院工作。",
          "做|zuò|Tố|Làm, nấu|妈妈在家做中国菜。",
          "买|mǎi|Mãi|Mua|我去商店买水果。",
          "开|kāi|Khai|Lái (xe), mở|他开车去北京。",
          "坐|zuò|Tọa|Ngồi, đi bằng|请坐！我们坐飞机去。",
          "住|zhù|Trụ|Sống, ở trọ, cư trú|你住在哪儿？我住在北京。",
          "打电话|dǎ diànhuà|Đả điện thoại|Gọi điện thoại|昨天我给妈妈打电话了。",
          "吃|chī|Ngật|Ăn|中午你去哪儿吃饭？",
          "喝|hē|Hát|Uống|请喝中国茶！",
          "水|shuǐ|Thủy|Nước|天气很热，我想喝水。",
          "茶|chá|Trà|Trà, chè|爸爸喜欢喝茶。",
          "米饭|mǐfàn|Mễ phạn|Cơm trắng|中午我在学校吃米饭。",
          "菜|cài|Thái|Món ăn, rau|妈妈做的菜很好吃。",
          "水果|shuǐguǒ|Thủy quả|Trái cây, hoa quả|我去商店买水果。",
          "苹果|píngguǒ|Bình quả|Quả táo|这五个苹果多少钱？",
          "杯子|bēizi|Bôi tử|Cái cốc, cái ly|这个杯子十块钱。",
          "东西|dōngxi|Đông tây|Đồ đạc, món đồ|今天我买了很多东西。",
          "书|shū|Thư|Sách|我有三本汉语书。",
          "电脑|diànnǎo|Điện não|Máy vi tính, laptop|我买了一个新电脑。",
          "电视|diànshì|Điện thị|Tivi, truyền hình|爸爸在家看电视。",
          "电影|diànyǐng|Điện ảnh|Phim điện ảnh|下午我们去看电影。",
          "飞机|fēijī|Phi cơ|Máy bay|我明天坐飞机去北京。",
          "出租车|chūzūchē|Xuất tô xa|Xe taxi|我们坐出租车回家吧。",
          "桌子|zhuōzi|Trác tử|Cái bàn|电脑在桌子上。",
          "椅子|yǐzi|Ỷ tử|Cái ghế|桌子下面有一把椅子。",
          "衣服|yīfu|Y phục|Quần áo, trang phục|妈妈在商店买衣服。",
          "饭馆|fànguǎn|Phạn quán|Quán ăn, tiệm cơm|中午我们去饭馆吃饭。",
          "猫|māo|Miêu|Con mèo|我家有一只小猫。",
          "狗|gǒu|Cẩu|Con chó|她很喜欢那只小狗。",
          "天气|tiānqì|Thiên khí|Thời tiết|今天北京的天气很好。",
          "冷|lěng|Lãnh|Lạnh|今天天气很冷。",
          "热|rè|Nhiệt|Nóng|中午很热，请喝水。",
          "下雨|xiàyǔ|Hạ vũ|Trời mưa|今天下雨了，我不去商店。",
          "小|xiǎo|Tiểu|Nhỏ, bé|这个苹果很小。",
          "少|shǎo|Thiểu|Ít|今天来学校的人很少。",
          "小姐|xiǎojiě|Tiểu thư|Cô, tiểu thư|王小姐是我的好朋友。",
          "先生|xiānsheng|Tiên sinh|Ông, ngài, chồng|李先生在医院工作。",
          "爱|ài|Ái|Yêu, thích|我爱我的爸爸妈妈。",
          "喜欢|xǐhuan|Hỷ hoan|Thích|我喜欢吃苹果和喝茶。",
          "想|xiǎng|Tưởng|Muốn, nhớ, nghĩ|我想明天去北京。",
          "认识|rènshi|Nhận thức|Quen biết|我认识那位医生。",
          "会|huì|Hội|Biết (qua học tập), sẽ|我会说汉语，也会写汉字。",
          "能|néng|Năng|Có thể|明天你能来我家吗？",
          "高兴|gāoxìng|Cao hứng|Vui vẻ, phấn khởi|认识你我很高兴！",
          "漂亮|piàoliang|Phiêu lượng|Đẹp, xinh đẹp|她的衣服很漂亮。",
          "好吃|hǎochī|Hảo ngật|Ngon (đồ ăn)|中国菜很好吃！",
          "很|hěn|Ngận|Rất|今天天气很好。",
          "太|tài|Thái|Quá, lắm (太…了)|今天天气太热了！",
          "都|dōu|Đô|Đều, tất cả|我们都是学生。",
          "和|hé|Hòa|Và, cùng với|我和朋友一起去学校。",
          "上|shàng|Thượng|Trên, bên trên, lên|书在桌子上。",
          "下|xià|Hạ|Dưới, bên dưới, xuống|小猫在椅子下。",
          "里|lǐ|Lý|Trong, bên trong|学生在学校里学习。",
          "前面|qiánmiàn|Tiền diện|Phía trước|医院在商店前面。",
          "后面|hòumiàn|Hậu diện|Phía sau|我坐在他后面。",
          "睡觉|shuìjiào|Thụy giác|Ngủ, đi ngủ|现在十点了，我去睡觉了。",
          "喂|wèi|Uy|A lô (nghe điện thoại)|喂，请问李先生在家吗？"
        ],
        2: [
          "吧|ba|Ba|Nhé, nhỉ, đi (trợ từ ngữ khí)|我们一起去吃饭吧！",
          "白|bái|Bạch|Màu trắng|我喜欢那件白衣服。",
          "帮助|bāngzhù|Bang trợ|Giúp đỡ|谢谢你的帮助！",
          "报纸|bàozhǐ|Báo chỉ|Báo giấy|爸爸每天早上看报纸。",
          "比|bǐ|Tỷ|So với (câu so sánh hơn)|今天比昨天冷一点。",
          "别|bié|Biệt|Đừng (câu cầu khiến phủ định)|太晚了，别看电视了。",
          "宾馆|bīnguǎn|Tân quán|Khách sạn|这家宾馆离机场很近。",
          "长|cháng|Trường|Dài|这条路很长。",
          "唱歌|chànggē|Xướng ca|Ca hát, hát|她唱歌唱得很好听。",
          "出|chū|Xuất|Ra, đi ra|外边下雨了，别出去了。",
          "穿|chuān|Xuyên|Mặc (quần áo, giày)|今天很冷，多穿点衣服。",
          "次|cì|Thứ|Lần (lượng từ hành động)|我去过三次北京。",
          "从|cóng|Tùng|Từ (điểm xuất phát)|从我家到学校坐车要二十分钟。",
          "错|cuò|Thố|Sai, nhầm|对不起，我写错了一个汉字。",
          "打篮球|dǎ lánqiú|Đả lam cầu|Chơi bóng rổ|下午我们去打篮球吧。",
          "大家|dàjiā|Đại gia|Mọi người|大家好！请坐。",
          "到|dào|Đáo|Đến, tới nơi|我早上八点到公司。",
          "得|de|Đắc|Trợ từ bổ ngữ trạng thái|他说汉语说得很快。",
          "等|děng|Đẳng|Đợi, chờ|请等我五分钟！",
          "弟弟|dìdi|Đệ đệ|Em trai|我弟弟今年十二岁。",
          "第一|dì-yī|Đệ nhất|Thứ nhất, đầu tiên|这是我第一次来中国。",
          "懂|dǒng|Đổng|Hiểu|老师说的话你听懂了吗？",
          "对|duì|Đối|Đúng / Đối với|跑步对身体很好。",
          "房间|fángjiān|Phòng gian|Căn phòng|这个房间非常干净。",
          "非常|fēicháng|Phi thường|Vô cùng, cực kỳ|我非常喜欢喝珍珠奶茶。",
          "服务员|fúwùyuán|Phục vụ viên|Nhân viên phục vụ|服务员，请给我看看菜单。",
          "高|gāo|Cao|Cao|我弟弟比我高。",
          "告诉|gàosu|Cáo tố|Nói cho biết, bảo|请把你的电话号码告诉我。",
          "哥哥|gēge|Ca ca|Anh trai|我哥哥在银行工作。",
          "给|gěi|Cấp|Cho, đưa cho|妈妈给我买了一块手表。",
          "公共汽车|gōnggòng qìchē|Công cộng khí xa|Xe buýt|我每天坐公共汽车去上班。",
          "公司|gōngsī|Công ty|Công ty|他在一家跨国公司工作。",
          "贵|guì|Quý|Đắt (giá cả)|这件衣服太贵了！",
          "过|guo|Qua|Đã từng (trợ từ trải nghiệm)|你吃过北京烤鸭吗？",
          "还|hái|Hoàn|Vẫn, còn|现在还早，再坐一会儿吧。",
          "孩子|háizi|Hài tử|Đứa trẻ, con cái|女孩子喜欢穿漂亮的衣服。",
          "黑|hēi|Hắc|Màu đen|天黑了，我们快回家吧。",
          "红|hóng|Hồng|Màu đỏ|她穿着一件红衣服。",
          "火车站|huǒchēzhàn|Hỏa xa trạm|Ga tàu hỏa|请问去火车站怎么走？",
          "机场|jīchǎng|Cơ trường|Sân bay|我下午坐出租车去机场。",
          "鸡蛋|jīdàn|Kê đản|Trứng gà|我早上吃了一个鸡蛋。",
          "件|jiàn|Kiện|Chiếc, bộ (lượng từ quần áo/việc)|这件衣服真好看。",
          "教室|jiàoshì|Giáo thất|Phòng học, lớp học|学生们都在教室里看书。",
          "姐姐|jiějie|Tỷ tỷ|Chị gái|我姐姐是大学老师。",
          "介绍|jièshào|Giới thiệu|Giới thiệu|我来介绍一下我的新朋友。",
          "进|jìn|Tiến|Vào, bước vào|请进，请坐！",
          "近|jìn|Cận|Gần|我家离学校很近。",
          "就|jiù|Tựu|Thì, liền, ngay|我一吃完早饭就去学校。",
          "觉得|juéde|Giác đắc|Cảm thấy, cho rằng|我觉得汉语很有意思。",
          "咖啡|kāfēi|Gia phê|Cà phê|你想喝茶还是喝咖啡？",
          "开始|kāishǐ|Khai thủy|Bắt đầu|我们上午八点开始上课。",
          "考试|kǎoshì|Khảo thí|Thi cử, bài thi|明天有汉语考试，我要准备一下。",
          "可能|kěnéng|Khả năng|Có lẽ, có thể|今天下午可能会下雨。",
          "可以|kěyǐ|Khả dĩ|Có thể, được phép|请问我可以坐这儿吗？",
          "课|kè|Khóa|Bài học, tiết học|今天我们有两节汉语课。",
          "快|kuài|Khoái|Nhanh, sắp|快八点了，我们快走吧！",
          "快乐|kuàilè|Khoái lạc|Vui vẻ, hạnh phúc|祝你生日快乐！",
          "累|lèi|Lụy|Mệt mỏi|今天工作了一天，太累了。",
          "离|lí|Ly|Cách (khoảng cách)|公司离我家不远。",
          "两|liǎng|Lưỡng|Hai (dùng trước lượng từ)|我买了两本书。",
          "路|lù|Lộ|Con đường|你认识去医院的路吗？",
          "旅游|lǚyóu|Lữ du|Du lịch|我准备下个月去中国旅游。",
          "卖|mài|Mại|Bán|这家商店卖的水果很新鲜。",
          "慢|màn|Mạn|Chậm|请您说慢一点，好吗？",
          "忙|máng|Mang|Bận rộn|这几天我工作非常忙。",
          "每|měi|Mỗi|Mỗi, mọi|我每天都坚持学习中文。",
          "妹妹|mèimei|Muội muội|Em gái|我妹妹喜欢唱歌。",
          "门|mén|Môn|Cánh cửa, cổng|我在学校门口等你。",
          "面条|miàntiáo|Miến điều|Mì sợi|中午我吃了一碗牛肉面条。",
          "男|nán|Nam|Nam giới, con trai|那个男人是我哥哥。",
          "牛奶|niúnǎi|Ngưu nãi|Sữa bò|睡觉前喝一杯牛奶对身体好。",
          "旁边|pángbiān|Bàng biên|Bên cạnh|银行在商店旁边。",
          "跑步|pǎobù|Bào bộ|Chạy bộ|爸爸每天早上都去公园跑步。",
          "便宜|piányi|Tiện nghi|Rẻ|这件衣服比那件便宜得多。",
          "票|piào|Phiếu|Vé (tàu, xe, xem phim)|我买了两张电影票。",
          "妻子|qīzi|Thê tử|Vợ|他和妻子去北京旅游了。",
          "起床|qǐchuáng|Khởi sàng|Thức dậy|我每天早上六点半起床。",
          "千|qiān|Thiên|Một nghìn (1.000)|这部手机三千块钱。",
          "铅笔|qiānbǐ|Duyên bút|Bút chì|请借我一支铅笔。",
          "晴|qíng|Tình|Trời nắng, quang đãng|今天是晴天，天气很好。",
          "去年|qùnián|Khứ niên|Năm ngoái|我是去年来越南工作的。",
          "让|ràng|Nhượng|Bảo, để, nhường|老师让我们每天写十个汉字。",
          "上班|shàngbān|Thượng ban|Đi làm|我早上八点半开始上班。",
          "身体|shēntǐ|Thân thể|Cơ thể, sức khỏe|祝您身体健康！",
          "生病|shēngbìng|Sinh bệnh|Bị ốm, đổ bệnh|他昨天生病了，没来上课。",
          "生日|shēngrì|Sinh nhật|Sinh nhật|明天是我妈妈的生日。",
          "时间|shíjiān|Thời gian|Thời gian|周末你有时间一起看电影吗？",
          "事情|shìqing|Sự tình|Sự việc, công chuyện|你今天有什么事情吗？",
          "手表|shǒubiǎo|Thủ biểu|Đồng hồ đeo tay|这块手表是爸爸送给我的。",
          "手机|shǒujī|Thủ cơ|Điện thoại di động|我用手机学习中文。",
          "说话|shuōhuà|Thuyết thoại|Nói chuyện|教室里请不要大声说话。",
          "送|sòng|Tống|Tặng, tiễn, giao|我送你去机场吧。",
          "虽然…但是…|suīrán... dànshì...|Tuy nhiên... đản thị...|Mặc dù... nhưng...|虽然下雨了，但是我还是去跑步了。",
          "它|tā|Tha|Nó (vật, con vật)|小猫很可爱，我很喜欢它。",
          "踢足球|tī zúqiú|Thích túc cầu|Đá bóng|弟弟周末喜欢去踢足球。",
          "题|tí|Đề|Câu hỏi, đề bài|今天的考试题不难。",
          "跳舞|tiàowǔ|Khiêu vũ|Nhảy múa, khiêu vũ|妹妹跳舞跳得非常好。",
          "外|wài|Ngoại|Bên ngoài|外边很冷，快进房间吧。",
          "完|wán|Hoàn|Xong, hoàn thành|我已经写完今天的作业了。",
          "玩|wán|Ngoạn|Chơi, đi chơi|周末我们去公园玩吧。",
          "晚上|wǎnshang|Vãn thượng|Buổi tối|晚上我在家复习汉语。",
          "往|wǎng|Vãng|Hướng về phía|从这儿往左走就是地铁站。",
          "为什么|wèishénme|Vị thập ma|Tại sao, vì sao|你为什么想学习中文？",
          "问|wèn|Vấn|Hỏi|不懂的问题要马上问老师。",
          "问题|wèntí|Vấn đề|Vấn đề, câu hỏi|没问题，包在我身上！",
          "西瓜|xīguā|Tây qua|Dưa hấu|夏天吃西瓜最舒服了。",
          "希望|xīwàng|Hy vọng|Hy vọng, mong muốn|我希望今年能通过HSK考试。",
          "洗|xǐ|Tẩy|Rửa, giặt|吃饭前要先洗手。",
          "小时|xiǎoshí|Tiểu thời|Tiếng đồng hồ|我每天学习两个小时中文。",
          "笑|xiào|Tiếu|Cười|她笑着对我说你好。",
          "新|xīn|Tân|Mới|这是我刚买的新衣服。",
          "姓|xìng|Tính|Họ (trong họ tên)|请问您贵姓？我姓王。",
          "休息|xiūxi|Hưu tức|Nghỉ ngơi|累了就先休息一会儿吧。",
          "雪|xuě|Tuyết|Tuyết|冬天北京常常下雪。",
          "颜色|yánsè|Nhan sắc|Màu sắc|你喜欢什么颜色的衣服？",
          "眼睛|yǎnjing|Nhãn tinh|Đôi mắt|她的眼睛又大又漂亮。",
          "羊肉|yángròu|Dương nhục|Thịt dê, thịt cừu|冬天吃羊肉火锅很暖和。",
          "药|yào|Dược|Thuốc|生病了要按时吃药。",
          "要|yào|Yếu|Muốn, cần, sắp|我要一杯少冰半糖的奶茶。",
          "也|yě|Dã|Cũng|他是越南人，我也是越南人。",
          "一起|yìqǐ|Nhất khởi|Cùng nhau|我们一起努力学好中文吧！",
          "一下|yíxià|Nhất hạ|Một chút, một lát|请等我一下。",
          "已经|yǐjīng|Dĩ kinh|Đã... rồi|他已经回家了。",
          "意思|yìsi|Ý tư|Ý nghĩa, thú vị|这个汉字是什么意思？",
          "因为…所以…|yīnwèi... suǒyǐ...|Nhân vi... sở dĩ...|Bởi vì... cho nên...|因为下雨，所以我们没去打篮球。",
          "阴|yīn|Âm|Trời âm u, nhiều mây|今天是阴天，不晒。",
          "游泳|yóuyǒng|Du vịnh|Bơi lội|夏天我喜欢去游泳。",
          "右边|yòubian|Hữu biên|Bên phải|商店在学校右边。",
          "鱼|yú|Ngư|Con cá|妈妈做的红烧鱼很好吃。",
          "远|yuǎn|Viễn|Xa|机场离这儿很远。",
          "运动|yùndòng|Vận động|Vận động, thể thao|每天运动对身体好。",
          "再|zài|Tái|Lại (lặp lại trong tương lai)|没听懂，请您再说一遍。",
          "早上|zǎoshang|Tảo thượng|Buổi sáng sớm|早上好！你吃早饭了吗？",
          "丈夫|zhàngfu|Trượng phu|Chồng|她的丈夫是医生。",
          "找|zhǎo|Trảo|Tìm, tìm kiếm|我想找一份好工作。",
          "着|zhe|Trứ|Đang (trợ từ duy trì trạng thái)|门开着呢，请进。",
          "真|zhēn|Chân|Thật là|今天的天气真好！",
          "正在|zhèngzài|Chính tại|Đang (nhấn mạnh hành động)|我正在学习汉语呢。",
          "知道|zhīdào|Tri đạo|Biết|你知道他的电话号码吗？",
          "准备|zhǔnbèi|Chuẩn bị|Chuẩn bị|我已经准备好去考试了。",
          "走|zǒu|Tẩu|Đi bộ, rời đi|我们走着去学校吧。",
          "最|zuì|Tối|Nhất (so sánh nhất)|我最喜欢喝珍珠奶茶。",
          "左边|zuǒbian|Tả biên|Bên trái|医院在银行的左边。"
        ],
        3: [
          "阿姨|āyí|A di|Cô, dì|王阿姨非常热情。",
          "安静|ānjìng|An tĩnh|Yên tĩnh|图书馆里非常安静。",
          "把|bǎ|Bả|Đem, lấy (câu chữ 把)|请把桌子上的书给我。",
          "班|bān|Ban|Lớp học, ca làm|我们班有二十个学生。",
          "搬|bān|Ban|Chuyển, dọn (nhà/đồ)|下个星期我要搬家。",
          "办法|bànfǎ|Biện pháp|Cách, biện pháp|你别着急，我们一定能找到好办法。",
          "办公室|bàngōngshì|Biện công thất|Văn phòng|李老师在办公室工作。",
          "半|bàn|Bán|Một nửa, rưỡi|现在是八点半。",
          "帮忙|bāngmáng|Bang mang|Giúp đỡ|谢谢你来帮忙！",
          "包|bāo|Bao|Túi xách, cái bao|我的手机在包里呢。",
          "饱|bǎo|Bão|No (ăn no)|我已经吃饱了。",
          "被|bèi|Bị|Bị, được (câu bị động)|我的字典被同桌借走了。",
          "北方|běifāng|Bắc phương|Miền Bắc|中国的北方冬天很冷。",
          "比较|bǐjiào|Tỷ giảo|Khá, tương đối|这个问题比较容易。",
          "比赛|bǐsài|Tỷ tái|Cuộc thi, trận đấu|今天的足球比赛非常精彩。",
          "必须|bìxū|Tất tu|Bắt buộc, phải|明天的会议你必须参加。",
          "变化|biànhuà|Biến hóa|Sự thay đổi|这几年家乡的变化真大。",
          "表示|biǎoshì|Biểu thị|Bày tỏ, biểu thị|他向大家表示感谢。",
          "表演|biǎoyǎn|Biểu diễn|Biểu diễn, tiết mục|她的节目表演得太棒了。",
          "别人|biérén|Biệt nhân|Người khác|不要总是麻烦别人。",
          "冰箱|bīngxiāng|Băng tương|Tủ lạnh|我把西瓜放进冰箱里了。",
          "不但…而且…|búdàn... érqiě...|Bất đản... nhi thả...|Không những... mà còn...|他不但聪明，而且工作很努力。",
          "菜单|càidān|Thái đơn|Thực đơn (Menu)|服务员，请把菜单拿过来。",
          "参加|cānjiā|Tham gia|Tham gia|欢迎大家参加今天的讨论。",
          "草|cǎo|Thảo|Cỏ|春天的草地绿油油的。",
          "层|céng|Tầng|Tầng (tòa nhà)|我的办公室在五层。",
          "差|chà|Sai/Kém|Kém (giờ), tệ|差十分八点我们出发。",
          "超市|chāoshì|Siêu thị|Siêu thị|妈妈去超市买新鲜水果。",
          "衬衫|chènshān|Sấn sam|Áo sơ mi|这件白衬衫很适合你。",
          "成绩|chéngjì|Thành tích|Thành tích, điểm số|他这次汉语考试成绩很好。",
          "城市|chéngshì|Thành thị|Thành phố|上海是一个现代化的城市。",
          "迟到|chídào|Trì đáo|Đến muộn|对不起，路上堵车我迟到了。",
          "出现|chūxiàn|Xuất hiện|Xuất hiện|遇到问题时要冷静解决。",
          "除了…以外|chúle... yǐwài|Trừ liễu... dĩ ngoại|Ngoài... ra|除了英语以外，他还会说流利的汉语。",
          "聪明|cōngming|Thông minh|Thông minh|这个孩子又聪明又懂事。",
          "打扫|dǎsǎo|Đả tảo|Quét dọn, dọn dẹp|周末我把房间打扫干净了。",
          "打算|dǎsuàn|Đả toán|Dự định, định|你今年暑假打算去哪儿旅游？",
          "带|dài|Đái|Mang theo, dẫn theo|出门别忘了带雨伞。",
          "担心|dānxīn|Đam tâm|Lo lắng|你放心吧，不用为我担心。",
          "蛋糕|dàngāo|Đản cao|Bánh kem, bánh ngọt|今天是我生日，大家一起吃蛋糕吧。",
          "当然|dāngrán|Đương nhiên|Đương nhiên, tất nhiên|好朋友遇到困难，我当然要帮忙。",
          "地|de|Địa|Trợ từ trạng ngữ|他高兴地告诉我这个好消息。",
          "灯|dēng|Đăng|Đèn|离开教室前请把灯关上。",
          "地铁|dìtiě|Địa thiết|Tàu điện ngầm|坐地铁去公司既快又方便。",
          "地图|dìtú|Địa đồ|Bản đồ|我看着手机地图找到了那家饭店。",
          "电子邮件|diànzǐ yóujiàn|Điện tử bưu kiện|Email, thư điện tử|我已经把资料发到你的电子邮件了。",
          "动物|dòngwù|Động vật|Động vật|孩子们喜欢去动物园看大熊猫。",
          "短|duǎn|Đoản|Ngắn|这篇短文很容易读懂。",
          "段|duàn|Đoạn|Đoạn, quãng|最近这段时间我工作很忙。",
          "锻炼|duànliàn|Đoàn luyện|Rèn luyện, tập thể dục|每天坚持锻炼身体。",
          "发烧|fāshāo|Phát thiêu|Bị sốt|他感冒发烧了，要去医院看病。",
          "发现|fāxiàn|Phát hiện|Phát hiện, nhận ra|我发现学好汉字非常有意思。",
          "方便|fāngbiàn|Phương tiện|Thuận tiện, tiện lợi|这儿离地铁站很近，交通很方便。",
          "放|fàng|Phóng|Đặt, để, thả|请把书放在桌子上。",
          "放心|fàngxīn|Phóng tâm|Yên tâm|妈妈请放心，我会照顾好自己的。",
          "附近|fùjìn|Phụ cận|Gần đây, lân cận|学校附近有一家很好的书店。",
          "复习|fùxí|Phục tập|Ôn tập|每天学完新词都要认真复习。",
          "干净|gānjìng|Can tịnh|Sạch sẽ|这件衬衫洗得非常干净。",
          "感冒|gǎnmào|Cảm mạo|Cảm cúm|天气变冷了，小心别感冒。",
          "感兴趣|gǎn xìngqù|Cảm hứng thú|Có hứng thú, quan tâm|我对中国历史文化很感兴趣。",
          "刚才|gāngcái|Cương tài|Vừa nãy|刚才谁给我打电话了？",
          "跟…一样|gēn... yíyàng|Cân... nhất dạng|Giống như, ngang bằng|他的发音跟中国人一样标准。",
          "根据|gēnjù|Căn cứ|Căn cứ vào, dựa theo|我们根据实际情况制定了计划。",
          "关心|guānxīn|Quan tâm|Quan tâm|老师非常关心每一个学生。",
          "关于|guānyú|Quan ư|Về (chủ đề gì)|我想买一本关于中国经济的书。",
          "国家|guójiā|Quốc gia|Đất nước, quốc gia|越南是一个美丽的国家。",
          "害怕|hàipà|Hãi phạ|Sợ hãi|别害怕，勇敢地用中文说话。",
          "黑板|hēibǎn|Hắc bản|Bảng đen|请大家看黑板上的汉字。",
          "后来|hòulái|Hậu lai|Sau đó, về sau|起初很难，后来我慢慢习惯了。",
          "护照|hùzhào|Hộ chiếu|Hộ chiếu|去国外旅游一定要带好护照。",
          "环境|huánjìng|Hoàn cảnh|Môi trường|我们应该保护自然环境。",
          "换|huàn|Hoán|Đổi, thay|我想去银行换一点人民币。",
          "会议|huìyì|Hội nghị|Cuộc họp, hội nghị|下午两点有一个重要的部门会议。",
          "或者|huòzhě|Hoặc giả|Hoặc là|喝茶或者喝咖啡都可以。",
          "几乎|jīhū|Cơ hồ|Hầu như, gần như|他每天几乎都学习到晚上十点。",
          "机会|jīhuì|Cơ hội|Cơ hội|去中国留学是一个很好的机会。",
          "记得|jìde|Ký đắc|Nhớ|你还记得我们昨天学的生词吗？",
          "季节|jìjié|Quý tiết|Mùa (trong năm)|秋天是我最喜欢的季节。",
          "检查|jiǎnchá|Kiểm tra|Kiểm tra|做完试卷后要认真检查一遍。",
          "简单|jiǎndān|Giản đơn|Đơn giản|这道题其实很简单。",
          "见面|jiànmiàn|Kiến diện|Gặp mặt|我们明天上午在咖啡馆见面吧。",
          "健康|jiànkāng|Kiện khang|Khỏe mạnh, sức khỏe|健康比什么都重要。",
          "讲|jiǎng|Giảng|Giảng giải, nói, kể|老师讲的语法非常清楚。",
          "教|jiāo|Giáo|Dạy học|王老师教我们汉语口语。",
          "借|jiè|Tá|Mượn, cho mượn|我去图书馆借了两本中文小说。",
          "经过|jīngguò|Kinh qua|Đi qua, trải qua|经过四个月的努力，我的中文提高了很多。",
          "经理|jīnglǐ|Kinh lý|Giám đốc, quản lý|张经理今天去上海出差了。",
          "句子|jùzi|Cú tử|Câu văn|请用这个新词造一个句子。",
          "决定|juédìng|Quyết định|Quyết định|我决定报名参加今年的HSK考试。",
          "渴|kě|Khát|Khát nước|走了这么久，我有点口渴了。",
          "客人|kèrén|Khách nhân|Khách|今天家里来了几位重要的客人。",
          "空调|kōngtiáo|Không điều|Máy điều hòa|房间里太热了，请把空调打开。",
          "筷子|kuàizi|Khoái tử|Đôi đũa|中国人吃饭习惯用筷子。",
          "离开|líkāi|Ly khai|Rời khỏi|离开房间时请记得锁门。",
          "礼物|lǐwù|Lễ vật|Món quà|这是我送给你的生日礼物。",
          "历史|lìshǐ|Lịch sử|Lịch sử|中国有五千年的悠久历史。",
          "练习|liànxí|Luyện tập|Luyện tập, bài tập|学外语必须每天坚持练习口语。",
          "了解|liǎojiě|Liễu giải|Hiểu rõ, tìm hiểu|通过这本书，我更加了解中国文化了。",
          "邻居|línjū|Lân cư|Hàng xóm|我的邻居非常热情友好。",
          "满意|mǎnyì|Mãn ý|Hài lòng|经理对我们的工作非常满意。",
          "明白|míngbai|Minh bạch|Hiểu rõ, rõ ràng|老师讲的内容我都听明白了。",
          "难过|nánguò|Nan quá|Buồn bã|考试没考好，别太难过，下次继续努力。",
          "努力|nǔlì|Nỗ lực|Nỗ lực, chăm chỉ|每天努力学习十个新词。",
          "普通话|pǔtōnghuà|Phổ thông thoại|Tiếng phổ thông|她的普通话说得非常标准。",
          "其实|qíshí|Kỳ thực|Thực ra|其实学好汉语语法并不难。",
          "清楚|qīngchu|Thanh sở|Rõ ràng|这个问题我已经讲得很清楚了。",
          "热情|rèqíng|Nhiệt tình|Nhiệt tình|店主非常热情地招待我们。",
          "认为|rènwéi|Nhận vi|Cho rằng, nhận thấy|我认为每天复习旧词非常重要。",
          "认真|rènzhēn|Nhận chân|Nghiêm túc, chăm chú|他做每一件事都非常认真。",
          "容易|róngyì|Dung dị|Dễ dàng|用拆字法记汉字很容易。",
          "如果|rúguǒ|Như quả|Nếu như|如果你有什么问题，可以随时问我。",
          "世界|shìjiè|Thế giới|Thế giới|我想去世界各地旅游。",
          "水平|shuǐpíng|Thủy bình|Trình độ|他的汉语水平提高得很快。",
          "特别|tèbié|Đặc biệt|Đặc biệt, vô cùng|这家店的奶茶味道特别好。",
          "提高|tígāo|Đề cao|Nâng cao, cải thiện|多听多说能快速提高口语水平。",
          "同事|tóngshì|Đồng sự|Đồng nghiệp|我的同事们都很友好。",
          "同意|tóngyì|Đồng ý|Đồng ý|大家都同意这个新方案。",
          "完成|wánchéng|Hoàn thành|Hoàn thành|我已经按时完成了今天的学习任务。",
          "为了|wèile|Vị liễu|Để (chỉ mục đích)|为了通过考试，他每天都很努力。",
          "文化|wénhuà|Văn hóa|Văn hóa|我对中国传统文化非常感兴趣。",
          "习惯|xíguàn|Tập quán|Thói quen / Quen với|我已经习惯了每天早起读书。",
          "相信|xiāngxìn|Tương tín|Tin tưởng|我相信只要坚持就一定能成功。",
          "小心|xiǎoxīn|Tiểu tâm|Cẩn thận|路滑，走路请小心！",
          "新闻|xīnwén|Tân văn|Tin tức, thời sự|每天听中文新闻能提高听力。",
          "需要|xūyào|Nhu yếu|Cần, cần thiết|如果你需要帮助，尽管告诉我。",
          "选择|xuǎnzé|Tuyển trạch|Lựa chọn|请你选择正确的答案。",
          "要求|yāoqiú|Yêu cầu|Yêu cầu|老师对我们的发音要求很严格。",
          "一定|yídìng|Nhất định|Nhất định, chắc chắn|你只要努力，就一定能学好中文。",
          "一共|yígòng|Nhất cộng|Tổng cộng|这些东西一共多少钱？",
          "以前|yǐqián|Dĩ tiền|Trước đây|以前我不懂汉字，现在会写很多了。",
          "一边…一边…|yìbiān... yìbiān...|Nhất biên... nhất biên...|Vừa... vừa...|他喜欢一边喝咖啡一边看书。",
          "一直|yìzhí|Nhất trực|Luôn luôn, đi thẳng|顺着这条路一直往前走就是银行。",
          "银行|yínháng|Ngân hàng|Ngân hàng|我去银行办一张银行卡。",
          "应该|yīnggāi|Ưng cai|Nên, phải|我们应该每天按时复习功课。",
          "影响|yǐngxiǎng|Ảnh hưởng|Ảnh hưởng|环境对人的成长有很大影响。",
          "遇到|yùdào|Ngộ đáo|Gặp phải, bắt gặp|遇到不认识的汉字可以查字典。",
          "越…越…|yuè... yuè...|Việt... việt...|Càng... càng...|你的中文说得越来越流利了。",
          "照顾|zhàogù|Chiếu cố|Chăm sóc|谢谢你这几天对我的照顾。",
          "字典|zìdiǎn|Tự điển|Từ điển|这本汉越字典非常实用。",
          "自己|zìjǐ|Tự kỷ|Bản thân mình|自己的事情应该自己做。",
          "总是|zǒngshì|Tổng thị|Luôn luôn|他总是笑眯眯地帮助别人。",
          "作业|zuòyè|Tác nghiệp|Bài tập về nhà|做完今天的作业就可以休息了。"
        ],
        4: [
          "安排|ānpái|An bài|Sắp xếp, bố trí|经理已经安排好了下周的工作计划。",
          "安全|ānquán|An toàn|An toàn|开车时一定要注意交通安全。",
          "按时|ànshí|Án thời|Đúng giờ, đúng hạn|我们必须按时完成这个项目。",
          "按照|ànzhào|Án chiếu|Theo, chiếu theo|请按照规定填写这张表格。",
          "百分之|bǎifēnzhī|Bách phân chi|Phần trăm (%)|今年的销售额增长了百分之二十。",
          "保护|bǎohù|Bảo hộ|Bảo vệ|保护自然环境是每个人的责任。",
          "保证|bǎozhèng|Bảo chứng|Đảm bảo, cam đoan|我保证明天一定准时交报告。",
          "报名|bàomíng|Báo danh|Đăng ký, ghi danh|我已经报名参加下个月的HSK四级考试了。",
          "抱歉|bàoqiàn|Bão khiểm|Xin lỗi, lấy làm tiếc|非常抱歉，让您久等了。",
          "倍|bèi|Bội|Lần (gấp bao nhiêu lần)|今年公司的利润是去年的两倍。",
          "本来|běnlái|Bản lai|Vốn dĩ, ban đầu|我本来想今天去，但临时有个会议。",
          "比如|bǐrú|Tỷ như|Ví dụ như|我有许多爱好，比如看书、旅游和游泳。",
          "毕业|bìyè|Tốt nghiệp|Tốt nghiệp|大学毕业后他进入了一家外企工作。",
          "遍|biàn|Biến|Lần, lượt (đọc/nghe)|这篇课文请大家认真读三遍。",
          "标准|biāozhǔn|Tiêu chuẩn|Tiêu chuẩn, chuẩn xác|她的普通话发音非常标准。",
          "表格|biǎogé|Biểu cách|Bảng biểu, biểu mẫu|请您先填一下这张申请表格。",
          "表扬|biǎoyáng|Biểu dương|Tuyên dương, khen ngợi|老师表扬了认真学习的同学。",
          "不得不|bùdébù|Bất đắc bất|Đành phải, không thể không|因为下大雨，我们不得不推迟比赛。",
          "不管|bùguǎn|Bất quản|Bất kể, cho dù|不管遇到什么困难，我都会坚持到底。",
          "不仅…而且…|bùjǐn... érqiě...|Bất cận... nhi thả...|Không chỉ... mà còn...|学外语不仅能开拓视野，而且能增加就业机会。",
          "材料|cáiliào|Tài liệu|Tài liệu, nguyên liệu|请把申请签证的材料准备好。",
          "参观|cānguān|Tham quan|Tham quan|欢迎各位代表参观我们的工厂。",
          "差不多|chàbuduō|Sai bất đa|Xấp xỉ, gần như|这两个词的意思差不多。",
          "成功|chénggōng|Thành công|Thành công|坚持不懈是成功的关键。",
          "成为|chéngwéi|Thành vi|Trở thành|她梦想成为一名优秀的翻译。",
          "诚实|chéngshí|Thành thực|Trung thực, thật thà|做人最重要的是诚实守信。",
          "乘坐|chéngzuò|Thừa tọa|Đi bằng (phương tiện)|欢迎您乘坐本次航班。",
          "吃惊|chījīng|Ngật kinh|Kinh ngạc, ngạc nhiên|听到这个消息，大家都非常吃惊。",
          "重新|chóngxīn|Trùng tân|Lại từ đầu|如果做错了题，必须重新学习一遍。",
          "出差|chūchāi|Xuất sai|Đi công tác|经理下周要去上海出差。",
          "出发|chūfā|Xuất phát|Xuất phát, khởi hành|我们明天早上七点准时出发。",
          "从来|cónglái|Tùng lai|Từ trước đến nay|他工作很认真，从来不迟到。",
          "粗心|cūxīn|Thô tâm|Cẩu thả, bất cẩn|考试时千万不能粗心大意。",
          "错误|cuòwù|Thố ngộ|Sai lầm, lỗi sai|我们要及时改正学习中的错误。",
          "答案|dá’àn|Đáp án|Đáp án, câu trả lời|请检查你的答案是否正确。",
          "打扰|dǎrǎo|Đả nhiễu|Làm phiền|不好意思，打扰您一下。",
          "打印|dǎyìn|Đả ấn|In ấn|请帮我把这份文件打印两份。",
          "打折|dǎzhé|Đả chiết|Giảm giá, chiết khấu|换季的时候商场都在打折。",
          "大概|dàgài|Đại khái|Khoảng chừng, đại khái|从这儿到机场大概需要半个小时。",
          "大使馆|dàshǐguǎn|Đại sứ quán|Đại sứ quán|我去中国大使馆办理签证。",
          "大约|dàyuē|Đại ước|Khoảng, ước chừng|这个项目大约需要四个月完成。",
          "导游|dǎoyóu|Đạo du|Hướng dẫn viên du lịch|那位导游用流利的中文介绍景点。",
          "地点|dìdiǎn|Địa điểm|Địa điểm|开会的地点改在三楼会议室了。",
          "地址|dìzhǐ|Địa chỉ|Địa chỉ|请把你的详细地址写下来。",
          "调查|diàochá|Điều tra|Điều tra, khảo sát|我们做了一份关于市场的调查报告。",
          "堵车|dǔchē|Đổ xa|Tắc đường, kẹt xe|上下班高峰期路上经常堵车。",
          "对话|duìhuà|Đối thoại|Đối thoại, hội thoại|每天跟AI练习中文对话非常有效。",
          "发生|fāshēng|Phát sinh|Xảy ra, phát sinh|不管发生什么事，都要保持冷静。",
          "发展|fāzhǎn|Phát triển|Phát triển|近年来两国经济合作发展迅速。",
          "法律|fǎlǜ|Pháp luật|Pháp luật|每个公民都应该遵守法律。",
          "翻译|fānyì|Phiên dịch|Dịch thuật, phiên dịch viên|请把这段中文翻译成越南语。",
          "反对|fǎnduì|Phản đối|Phản đối|没有一个人反对这个合理的建议。",
          "方法|fāngfǎ|Phương pháp|Phương pháp|掌握科学的学习方法能事半功倍。",
          "方面|fāngmiàn|Phương diện|Phương diện, khía cạnh|他在口语和听力方面进步很快。",
          "方向|fāngxiàng|Phương hướng|Phương hướng|努力固然重要，但选对方向更关键。",
          "放弃|fàngqì|Phóng khí|Từ bỏ, bỏ cuộc|遇到困难千万不要轻易放弃。",
          "放松|fàngsōng|Phóng tùng|Thư giãn, thả lỏng|考试前要放松心情，不要紧张。",
          "丰富|fēngfù|Phong phú|Phong phú, dồi dào|王老师具有丰富的教学经验。",
          "否则|fǒuzé|Phủ tắc|Nếu không thì|快点走吧，否则我们要迟到了。",
          "符合|fúhé|Phù hợp|Phù hợp với (tiêu chuẩn)|你的条件完全符合我们的招聘要求。",
          "付款|fùkuǎn|Phó khoản|Thanh toán, trả tiền|您可以选择手机扫码付款。",
          "复杂|fùzá|Phức tạp|Phức tạp|这个问题其实没有你想的那么复杂。",
          "负责|fùzé|Phụ trách|Phụ trách, có trách nhiệm|我负责公司的新媒体运营工作。",
          "改变|gǎibiàn|Cải biến|Thay đổi|互联网彻底改变了人们的生活方式。",
          "感动|gǎndòng|Cảm động|Cảm động|他的真诚帮助让我非常感动。",
          "感觉|gǎnjué|Cảm giác|Cảm giác, cảm thấy|今天我感觉精神特别好。",
          "感谢|gǎnxiè|Cảm tạ|Cảm ơn, biết ơn|非常感谢您这段时间的指导。",
          "鼓励|gǔlì|Cổ lệ|Khuyến khích, khích lệ|老师的鼓励给了我很大的信心。",
          "工资|gōngzī|Công tư|Tiền lương|这家公司的工资待遇非常不错。",
          "共同|gòngtóng|Cộng đồng|Chung, cùng nhau|这是我们大家共同努力的结果。",
          "购物|gòuwù|Cấu vật|Mua sắm|现在越来越多的人喜欢网上购物。",
          "管理|guǎnlǐ|Quản lý|Quản lý|他大学学的是企业管理专业。",
          "规定|guīdìng|Quy định|Quy định|按照公司规定，员工不能迟到。",
          "国际|guójì|Quốc tế|Quốc tế|这是一场高水平的国际贸易会议。",
          "过程|guòchéng|Quá trình|Quá trình|学习语言是一个循序渐进的过程。",
          "合格|hégé|Hợp cách|Đạt chuẩn, đạt yêu cầu|这批产品的质量完全合格。",
          "合适|héshì|Hợp thích|Vừa vặn, thích hợp (tính từ)|这双鞋的大小对我来说很合适。",
          "合作|hézuò|Hợp tác|Hợp tác|希望我们双方今后能愉快合作。",
          "互联网|hùliánwǎng|Hỗ liên võng|Mạng Internet|互联网让学习变得随时随地。",
          "互相|hùxiāng|Hỗ tương|Lẫn nhau, tương trợ|同班同学之间应该互相帮助。",
          "获得|huòdé|Hoạch đắc|Giành được, đạt được|他在这次汉语比赛中获得了一等奖。",
          "基础|jīchǔ|Cơ sở|Nền tảng, cơ sở|打好拼音和词汇基础非常重要。",
          "积极|jījí|Tích cực|Tích cực|我们要积极参加课堂讨论。",
          "积累|jīlěi|Tích lũy|Tích lũy|每天积累十个词，一年就是三千多个词。",
          "既然|jìrán|Ký nhiên|Đã... thì...|既然定了目标，就要坚持完成。",
          "继续|jìxù|Kế tục|Tiếp tục|休息十分钟后，我们继续上课。",
          "加班|jiābān|Gia ban|Làm thêm giờ, tăng ca|昨天为了赶项目，他加班到很晚。",
          "坚持|jiānchí|Kiên trì|Kiên trì, bền bỉ|只要每天坚持学习，一定能过HSK。",
          "减少|jiǎnshǎo|Giảm thiểu|Giảm bớt, cắt giảm|复习能大大减少遗忘的概率。",
          "建议|jiànyì|Kiến nghị|Kiến nghị, lời khuyên|感谢您提出的宝贵建议。",
          "将来|jiānglái|Tương lai|Tương lai, sau này|你将来想从事什么职业？",
          "奖金|jiǎngjīn|Thưởng kim|Tiền thưởng|由于表现优秀，他获得了年底奖金。",
          "降低|jiàngdī|Giáng đê|Hạ thấp, giảm xuống|采用新技术后，生产成本降低了。",
          "交流|jiāoliú|Giao lưu|Giao lưu, trao đổi|多跟中国人交流能快速提升口语。",
          "交通|jiāotōng|Giao thông|Giao thông|这座城市的公共交通非常发达。",
          "教授|jiàoshòu|Giáo thụ|Giáo sư|陈教授在学术界享有很高的声誉。",
          "教育|jiàoyù|Giáo dục|Giáo dục|家庭教育对孩子的性格影响深远。",
          "接受|jiēshòu|Tiếp thụ|Chấp nhận, tiếp nhận|我完全接受您的批评和指导。",
          "结果|jiéguǒ|Kết quả|Kết quả|努力付出了，就一定会有好结果。",
          "解释|jiěshì|Giải thích|Giải thích|请允许我向您解释一下当时的情况。",
          "尽管|jǐnguǎn|Tẫn quản|Cho dù, mặc dù|尽管工作很忙，他还是每天学中文。",
          "紧张|jǐnzhāng|Khẩn trương|Căng thẳng, hồi hộp|第一次上台演讲时我有点紧张。",
          "进行|jìnxíng|Tiến hành|Tiến hành|会议正在顺利进行中。",
          "精彩|jīngcǎi|Tinh thái|Đặc sắc, tuyệt vời|今晚的文艺演出真是太精彩了。",
          "经济|jīngjì|Kinh tế|Kinh tế|近年来亚洲经济发展非常迅速。",
          "经验|jīngyàn|Kinh nghiệm|Kinh nghiệm|他在国际贸易方面有十年的经验。",
          "竞争|jìngzhēng|Cạnh tranh|Cạnh tranh|市场竞争越来越激烈了。",
          "拒绝|jùjué|Cự tuyệt|Từ chối|他礼貌地拒绝了对方的无理要求。",
          "看法|kànfǎ|Khán pháp|Quan điểm, cách nhìn|请谈谈你对人工智能发展的看法。",
          "考虑|kǎolǜ|Khảo lự|Cân nhắc, suy nghĩ|这个问题我们需要再认真考虑一下。",
          "科学|kēxué|Khoa học|Khoa học|我们要用科学的方法记忆单词。",
          "肯定|kěndìng|Khẳng định|Chắc chắn, khẳng định|只要你背完这批词，考试肯定能过。",
          "困难|kùnnan|Khốn nạn|Khó khăn|办法总比困难多。",
          "扩大|kuòdà|Khuếch đại|Mở rộng|公司计划明年扩大在越南的市场规模。",
          "来自|láizì|Lai tự|Đến từ|我来自美丽的越南河内。",
          "冷静|lěngjìng|Lãnh tĩnh|Bình tĩnh|遇到突发事件一定要保持冷静。",
          "理解|lǐjiě|Lý giải|Hiểu, thông cảm|非常感谢您的理解与支持。",
          "理想|lǐxiǎng|Lý tưởng|Lý tưởng, ước mơ|为了实现理想，他每天都在奋斗。",
          "联系|liánxì|Liên hệ|Liên hệ, liên lạc|到达北京后请马上跟我联系。",
          "流利|liúlì|Lưu lợi|Lưu loát, trôi chảy|经过半年学习，她的汉语说得很流利。",
          "目的|mùdì|Mục đích|Mục đích|你学习汉语的主要目的是什么？",
          "耐心|nàixīn|Nại tâm|Kiên nhẫn|老师非常有耐心地解答学生的问题。",
          "内容|nèiróng|Nội dung|Nội dung|这本书的内容非常丰富实用。",
          "能力|nénglì|Năng lực|Năng lực, khả năng|跨文化沟通能力在职场中非常重要。",
          "普遍|pǔbiàn|Phổ biến|Phổ biến, rộng rãi|智能手机现在已经非常普遍了。",
          "签证|qiānzhèng|Thiêm chứng|Thị thực (Visa)|我的留学签证已经办下来了。",
          "情况|qíngkuàng|Tình huống|Tình hình, tình huống|请向经理汇报一下项目的最新情况。",
          "确实|quèshí|Xác thực|Quả thực, đích thực|这个方法确实能帮人快速记住生词。",
          "任务|rènwu|Nhiệm vụ|Nhiệm vụ|你必须先完成今天的学习任务才能闯下一关。",
          "商量|shāngliang|Thương lượng|Bàn bạc, thương lượng|这件事我需要先跟家人商量一下。",
          "申请|shēnqǐng|Thân thỉnh|Xin, nộp đơn ứng tuyển|他成功申请到了中国政府奖学金。",
          "实际|shíjì|Thực tế|Thực tế|理论知识必须结合实际应用。",
          "使用|shǐyòng|Sử dụng|Sử dụng|在日常对话中使用新词能加深记忆。",
          "适合|shìhé|Thích hợp|Phù hợp với (động từ + tân ngữ)|这套学习系统非常适合零基础学者。",
          "适应|shìyìng|Thích ứng|Thích nghi, thích ứng|他很快就适应了北京的留学生活。",
          "收入|shōurù|Thu nhập|Thu nhập|掌握一门外语能有效提高个人收入。",
          "顺利|shùnlì|Thuận lợi|Thuận lợi, suôn sẻ|祝你明天的面试一切顺利！",
          "说明|shuōmíng|Thuyết minh|Giải thích, chứng tỏ|事实说明他的选择是完全正确的。",
          "速度|sùdù|Tốc độ|Tốc độ|高铁的行驶速度非常快。",
          "态度|tàidu|Thái độ|Thái độ|他对待学习的态度非常认真。",
          "提供|tígōng|Đề cung|Cung cấp|公司为新员工提供专业的培训。",
          "提前|tíqián|Đề tiền|Trước thời hạn, sớm hơn|请大家提前十分钟进入考场。",
          "条件|tiáojiàn|Điều kiện|Điều kiện|你已经满足了进入下一课的条件。",
          "通过|tōngguò|Thông qua|Thông qua / Vượt qua (kỳ thi)|恭喜你顺利通过了今天的词汇测试！",
          "通知|tōngzhī|Thông tri|Thông báo|收到面试通知后他非常高兴。",
          "完全|wánquán|Hoàn toàn|Hoàn toàn|我完全赞同你的观点。",
          "无论|wúlùn|Vô luận|Bất luận, cho dù|无论多忙，每天都要学十个新词。",
          "吸引|xīyǐn|Hấp dẫn|Thu hút, hấp dẫn|跌宕起伏的剧情深深吸引了观众。",
          "详细|xiángxì|Tường tế|Chi tiết, tỉ mỉ|请您详细说明一下这个方案。",
          "效果|xiàoguǒ|Hiệu quả|Hiệu quả|这种滚动复习法的记忆效果非常好。",
          "信心|xìnxīn|Tín tâm|Sự tự tin, niềm tin|我对通过这次HSK考试充满信心。",
          "压力|yālì|Áp lực|Áp lực|适当的压力可以转化为学习的动力。",
          "严格|yángé|Nghiêm cách|Nghiêm khắc, chặt chẽ|只有严格要求自己，才能掌握真本领。",
          "研究|yánjiū|Nghiên cứu|Nghiên cứu|他对汉字起源有深入的研究。",
          "养成|yǎngchéng|Dưỡng thành|Hình thành (thói quen)|我们要养成每天背单词的好习惯。",
          "因此|yīncǐ|Nhân thử|Vì vậy, do đó|他平时训练刻苦，因此取得了好成绩。",
          "印象|yìnxiàng|Ấn tượng|Ấn tượng|北京给我留下了非常美好的印象。",
          "赢|yíng|Doanh|Thắng, chiến thắng|只要不放弃，我们最终一定会赢。",
          "优秀|yōuxiù|Ưu tú|Ưu tú, xuất sắc|他是一名非常优秀的青年教师。",
          "尤其|yóuqí|Vưu kỳ|Đặc biệt là, nhất là|我喜欢吃水果，尤其是越南芒果。",
          "由于|yóuyú|Do ư|Do, bởi vì|由于天气原因，航班推迟了一小时。",
          "原因|yuányīn|Nguyên nhân|Nguyên nhân|我们必须找出导致错误的原因。",
          "阅读|yuèdú|Duyệt độc|Đọc, đọc hiểu|多阅读中文报刊能扩大词汇量。",
          "增加|zēngjiā|Tăng gia|Tăng thêm, gia tăng|每天学习能不断增加你的词汇储备。",
          "正确|zhèngquè|Chính xác|Chính xác, đúng đắn|请选出唯一正确的答案。",
          "正式|zhèngshì|Chính thức|Chính thức|下周一我将正式到新公司上班。",
          "证明|zhèngmíng|Chứng minh|Chứng minh|事实证明他的理论是正确的。",
          "支持|zhīchí|Chi trì|Ủng hộ, hỗ trợ|非常感谢家人们一直以来的支持。",
          "知识|zhīshi|Tri thức|Kiến thức, tri thức|知识就是力量。",
          "值得|zhídé|Trị đắc|Đáng, xứng đáng|这本经典好书非常值得读两遍。",
          "职业|zhíyè|Chức nghiệp|Nghề nghiệp|医生是一个受人尊敬的职业。",
          "只要|zhǐyào|Chỉ yếu|Chỉ cần|只要功夫深，铁杵磨成针。",
          "至少|zhìshǎo|Chí thiểu|Ít nhất, tối thiểu|每天至少要学会十个新单词。",
          "质量|zhìliàng|Chất lượng|Chất lượng|这家工厂生产的产品质量非常可靠。",
          "重点|zhòngdiǎn|Trọng điểm|Trọng điểm, trọng tâm|请大家把今天语法的重点记在笔记本上。",
          "重视|zhòngshì|Trọng thị|Coi trọng, xem trọng|公司非常重视人才的培养。",
          "祝贺|zhùhè|Chúc hạ|Chúc mừng|衷心祝贺你顺利通过考试！",
          "著名|zhùmíng|Trứ danh|Nổi tiếng, trứ danh|下龙湾是世界著名的自然遗产。",
          "专业|zhuānyè|Chuyên nghiệp|Chuyên ngành / Chuyên nghiệp|你在大学学的是什么专业？",
          "准确|zhǔnquè|Chuẩn xác|Chuẩn xác|请用准确的词语概括这段话的意思。",
          "准时|zhǔnshí|Chuẩn thời|Đúng giờ|火车下午三点准时到达北京站。",
          "仔细|zǐxì|Tử tế|Cẩn thận, kỹ lưỡng|做阅读理解时一定要仔细看清题目。",
          "总结|zǒngjié|Tổng kết|Tổng kết, đúc kết|每学完一课都要及时总结经验。",
          "尊重|zūnzhòng|Tôn trọng|Tôn trọng|我们要尊重不同国家的文化习俗。"
        ],
        5: [
          "把握|bǎwò|Bả ác|Nắm bắt, nắm chắc|我们要牢牢把握这次难得的发展机遇。",
          "半途而废|bàn tú ér fèi|Bán đồ nhi phế|Bỏ cuộc giữa chừng|学习语言贵在坚持，绝不能半途而废。",
          "包含|bāohán|Bao hàm|Bao hàm, chứa đựng|这句话包含了深刻的人生哲理。",
          "保持|bǎochí|Bảo trì|Duy trì, giữ gìn|面对困难时要保持乐观的心态。",
          "保存|bǎocún|Bảo tồn|Bảo tồn, lưu giữ|这些珍贵的历史文献保存得非常完好。",
          "保留|bǎoliú|Bảo lưu|Giữ lại, bảo lưu|这座古镇依然保留着传统的建筑风格。",
          "报告|bàogào|Báo cáo|Báo cáo, bài thuyết trình|他在经济论坛上作了一份精彩的报告。",
          "背景|bèijǐng|Bối cảnh|Bối cảnh, nền tảng|了解历史背景有助于理解这篇文学作品。",
          "本质|běnzhì|Bản chất|Bản chất|我们要透过现象看清事物的本质。",
          "比例|bǐlì|Tỷ lệ|Tỷ lệ|高新技术产业在经济中的比例不断提高。",
          "必然|bìrán|Tất nhiên|Tất yếu, tất nhiên|刻苦钻研必然会取得优异的成果。",
          "必要|bìyào|Tất yếu|Cần thiết, thiết yếu|在进入下一课前，有必要复习昨天的词汇。",
          "避免|bìmiǎn|Tị miễn|Tránh, ngăn ngừa|认真检查可以避免许多不必要的错误。",
          "编辑|biānjí|Biên tập|Biên tập, biên tập viên|王编辑对书稿进行了仔细的校对。",
          "辩论|biànlùn|Biện luận|Tranh luận, biện luận|双方围绕人工智能的影响展开了激烈辩论。",
          "标志|biāozhì|Tiêu chí|Dấu hiệu, biểu tượng|这座大厦是该城市的标志性建筑。",
          "表达|biǎodá|Biểu đạt|Biểu đạt, diễn đạt|丰富的词汇量能让你更准确地表达思想。",
          "表面|biǎomiàn|Biểu diện|Bề mặt, bề ngoài|看问题不能只看表面现象。",
          "表明|biǎomíng|Biểu minh|Chứng tỏ, cho thấy|最新数据表明市场需求正在快速增长。",
          "不断|búduàn|Bất đoạn|Không ngừng, liên tục|只有不断学习才能跟上时代的步伐。",
          "补充|bǔchōng|Bổ sung|Bổ sung|关于这个方案，我再补充两点意见。",
          "不可避免|bù kě bìmiǎn|Bất khả tị miễn|Không thể tránh khỏi|改革过程中不可避免会遇到一些挑战。",
          "采访|cǎifǎng|Thái phỏng|Phỏng vấn (báo chí)|记者就环保问题采访了多位专家。",
          "采取|cǎiqǔ|Thái thủ|Áp dụng, thực thi (biện pháp)|政府已采取有效措施稳定市场价格。",
          "参考|cānkǎo|Tham khảo|Tham khảo|这份资料非常详细，值得大家参考。",
          "参与|cānyù|Tham dự|Tham gia vào|鼓励更多年轻人参与社会公益活动。",
          "测验|cèyàn|Trắc nghiệm|Bài kiểm tra ngắn|每天背完单词后都要做一个小测验。",
          "曾经|céngjīng|Tằng kinh|Đã từng|他曾经在北京大学留学四年。",
          "差距|chājù|Sai cự|Khoảng cách, sự chênh lệch|我们要努力缩小与先进水平的差距。",
          "产品|chǎnpǐn|Sản phẩm|Sản phẩm|优质的产品赢得了广大消费者的信赖。",
          "产生|chǎnshēng|Sản sinh|Nảy sinh, tạo ra|阅读好书能对人产生积极的影响。",
          "彻底|chèdǐ|Triệt để|Triệt để, hoàn toàn|要想彻底掌握一个词，必须学会造句。",
          "称赞|chēngzàn|Xưng tán|Khen ngợi, ca ngợi|大家都称赞他办事认真可靠。",
          "成果|chéngguǒ|Thành quả|Thành quả|这项科研成果在国际上引起了广泛关注。",
          "成就|chéngjiù|Thành tựu|Thành tựu|他在文学创作上取得了卓越的成就。",
          "成立|chénglì|Thành lập|Thành lập|这家科技公司成立于二零一五年。",
          "成熟|chéngshú|Thành thục|Chín chắn, trưởng thành|经历了许多挫折后，他的思想更加成熟了。",
          "成语|chéngyǔ|Thành ngữ|Thành ngữ (4 chữ)|恰当使用成语能让你的中文表达更地道。",
          "成长|chéngzhǎng|Trưởng thành|Trưởng thành, lớn lên|良好的家庭氛围有利于孩子的健康成长。",
          "承担|chéngdān|Thừa đam|Gánh vác, chịu (trách nhiệm)|勇于承担责任是优秀领导者的品质。",
          "承认|chéngrèn|Thừa nhận|Thừa nhận, công nhận|敢于承认不足才能不断取得进步。",
          "程度|chéngdù|Trình độ|Mức độ, trình độ|双方在很大程度上达成了共识。",
          "持续|chíxù|Trì tục|Kéo dài, bền vững|推动经济持续健康发展。",
          "充满|chōngmǎn|Sung mãn|Tràn đầy, chan chứa|他对未来的职业发展充满了信心。",
          "充分|chōngfèn|Sung phân|Đầy đủ, trọn vẹn|开会前我们已经做好了充分的准备。",
          "重复|chóngfù|Trùng phục|Lặp lại|科学的重复是战胜遗忘的唯一秘诀。",
          "出色|chūsè|Xuất sắc|Xuất sắc|她以出色的表现赢得了面试官的认可。",
          "出席|chūxí|Xuất tịch|Tham dự, có mặt (hội nghị)|多位知名学者出席了本次国际研讨会。",
          "处理|chǔlǐ|Xử lý|Xử lý, giải quyết|他处理突发问题的能力非常强。",
          "传播|chuánbō|Truyền bá|Truyền bá, lan truyền|互联网加速了文化与信息的传播。",
          "传统|chuántǒng|Truyền thống|Truyền thống|中秋节是中越两国共同的传统节日。",
          "创造|chuàngzào|Sáng tạo|Sáng tạo, tạo ra|用双手创造更加美好的生活。",
          "此外|cǐwài|Thử ngoại|Ngoài ra, bên cạnh đó|这本书内容实用，此外还配有标准录音。",
          "从而|cóng’ér|Tùng nhi|Từ đó, nhờ đó mà|他每天坚持背词，从而顺利通过了五级考试。",
          "从事|cóngshì|Tùng sự|Làm nghề, hoạt động trong lĩnh vực|他大学毕业后一直从事国际贸易工作。",
          "促进|cùjìn|Xúc tiến|Thúc đẩy, xúc tiến|文化交流促进了两国人民的相互了解。",
          "措施|cuòshī|Thố thi|Biện pháp|必须采取果断措施提高学习效率。",
          "达到|dádào|Đạt đáo|Đạt tới, đạt được|只有词汇量达到要求，才能进入下一阶段。",
          "代替|dàitì|Đại thế|Thay thế|人工智能无法完全代替人类的情感交流。",
          "待遇|dàiyù|Đãi ngộ|Đãi ngộ|这家跨国公司为员工提供优厚的福利待遇。",
          "担任|dānrèn|Đam nhiệm|Đảm nhiệm, giữ chức|他目前担任公司市场部的总经理。",
          "导致|dǎozhì|Đạo trí|Dẫn đến (kết quả xấu)|粗心大意导致他在考试中丢了分。",
          "得体|détǐ|Đắc thể|Đúng mực, lịch thiệp|在商务谈判中，言行举止必须得体。",
          "地道|dìdao|Địa đạo|Chuẩn bản xứ, chính gốc|他的北京话说得非常地道。",
          "地位|dìwèi|Địa vị|Địa vị, vị thế|汉语在国际商务中的地位越来越重要。",
          "独立|dúlì|Độc lập|Độc lập, tự lập|培养独立思考的能力至关重要。",
          "独特|dútè|Độc đặc|Độc đáo, đặc sắc|这座城市拥有独特的历史文化魅力。",
          "对比|duìbǐ|Đối tỷ|Đối chiếu, so sánh|通过汉越对比能更快掌握词汇用法。",
          "对待|duìdài|Đối đãi|Đối xử, đối đãi|我们要以认真的态度对待每一天的学习。",
          "对方|duìfāng|Đối phương|Đối phương, phía bên kia|谈判时需要充分了解对方的核心需求。",
          "发表|fābiǎo|Phát biểu|Công bố, đăng tải, phát biểu|他在核心期刊上发表了一篇学术论文。",
          "发达|fādá|Phát đạt|Phát triển, hiện đại|长三角地区的物流网络非常发达。",
          "发挥|fāhuī|Phát huy|Phát huy|在考试中他充分发挥了自己的真实水平。",
          "繁荣|fánróng|Phồn vinh|Phồn vinh, thịnh vượng|自由贸易促进了区域经济的繁荣。",
          "范围|fànwéi|Phạm vi|Phạm vi|这些词汇全都属于HSK五级考试范围。",
          "方式|fāngshì|Phương thức|Phương thức, cách thức|互动式学习是一种非常高效的学习方式。",
          "分配|fēnpèi|Phân phối|Phân bổ, phân công|合理分配每天的学习和休息时间。",
          "分析|fēnxī|Phân tích|Phân tích|系统会自动分析你在测试中做错的题目。",
          "风险|fēngxiǎn|Phong hiểm|Rủi ro|投资之前必须全面评估潜在的市场风险。",
          "否认|fǒurèn|Phủ nhận|Phủ nhận|不可否认，坚持复习是记牢单词的关键。",
          "付出|fùchū|Phó xuất|Bỏ ra, cống hiến|只要付出努力，就一定会有所收获。",
          "改善|gǎishàn|Cải thiện|Cải thiện|通过反复跟读，他的发音得到了明显改善。",
          "概念|gàiniàn|Khái niệm|Khái niệm|请先理解这个语法概念再做练习。",
          "概括|gàikuò|Khái quát|Khái quát, tóm tắt|请用一句话概括这段文章的中心思想。",
          "感激|gǎnjī|Cảm kích|Cảm kích, biết ơn|我对老师的悉心教导感激不尽。",
          "感受|gǎnshòu|Cảm thụ|Cảm nhận, trải nghiệm|亲身感受中华文化的博大精深。",
          "观念|guānniàn|Quan niệm|Quan niệm, tư tưởng|时代在发展，人们的消费观念也在不断更新。",
          "规律|guīlǜ|Quy luật|Quy luật|掌握汉字的构字规律能让你事半功倍。",
          "规模|guīmó|Quy mô|Quy mô|今年国际书展的规模比去年更大。",
          "规则|guīzé|Quy tắc|Quy tắc, luật lệ|遵守闯关规则：每天测试满分才能解锁下一天。",
          "画蛇添足|huà shé tiān zú|Họa xà thiêm túc|Vẽ rắn thêm chân|文章已经很精炼了，再加这句反而画蛇添足。",
          "熟能生巧|shú néng shēng qiǎo|Thục năng sinh xảo|Trăm hay không bằng tay quen|学外语没有捷径，唯有反复练习才能熟能生巧。",
          "一举两得|yì jǔ liǎng dé|Nhất cử lưỡng đắc|Một công đôi việc|用新词复习旧词，真是一举两得的好办法。",
          "趋势|qūshì|Xu thế|Xu hướng, xu thế|数字化转型是全球经济发展的必然趋势。",
          "双方|shuāngfāng|Song phương|Song phương, hai bên|经过友好协商，双方正式签署了合作协议。",
          "宁可…也不…|nìngkě... yě bù...|Ninh khả... dã bất...|Thà... chứ không...|他宁可多花一小时复习，也不敷衍了事。"
        ],
        6: [
          "相辅相成|xiāng fǔ xiāng chéng|Tương phụ tương thành|Bổ trợ lẫn nhau cùng phát triển|新词学习与旧词复习是相辅相成的。",
          "不可或缺|bù kě huò quē|Bất khả hoặc khuyết|Không thể thiếu được|词汇积累是语言学习中不可或缺的基石。",
          "迫在眉睫|pò zài méi jié|Bách tại mi tiệp|Cấp bách ngay trước mắt|考试日期临近，强化复习已经迫在眉睫。",
          "潜移默化|qián yí mò huà|Tiềm di mặc hóa|Mưa dầm thấm lâu (biến đổi ngầm)|每天坚持听读会对语感产生潜移默化的影响。",
          "根深蒂固|gēn shēn dì gù|Căn thâm đế cố|Ăn sâu bám rễ|只有反复巩固，知识才能在脑海中根深蒂固。",
          "举足轻重|jǔ zú qīng zhòng|Cử túc khinh trọng|Giữ vị trí then chốt, có sức nặng lớn|高水平翻译在跨国谈判中起着举足轻重的作用。",
          "精益求精|jīng yì qiú jīng|Tinh ích cầu tinh|Đã tốt lại càng hoàn thiện hơn|对待学术与语言应当怀有精益求精的态度。",
          "融会贯通|róng huì guàn tōng|Dung hội quán thông|Thấu hiểu tường tận, kết nối toàn diện|把每天所学的词汇与语法融会贯通。",
          "诚然|chéngrán|Thành nhiên|Quả thực là (nhượng bộ học thuật)|诚然记忆五千词并非易事，但循序渐进定能成功。",
          "固然|gùrán|Cố nhiên|Tuy rằng, quả thực là|天赋固然重要，但后天的勤奋才是决定性的。",
          "归根到底|guī gēn dào dǐ|Quy căn đáo để|Xét đến cùng, suy cho cùng|归根到底，语言的本质在于交流与沟通。",
          "循序渐进|xún xù jiàn jìn|Tuần tự tiệm tiến|Tiến bước tuần tự từ thấp đến cao|学习必须循序渐进，扎实过好每一关。",
          "持之以恒|chí zhī yǐ héng|Trì chi dĩ hằng|Kiên trì bền bỉ đến cùng|唯有持之以恒，方能攻克高级汉语难关。",
          "事半功倍|shì bàn gōng bèi|Sự bán công bội|Làm một nửa mà hiệu quả gấp đôi|采用科学的滚动记忆法能收到事半功倍的效果。",
          "博大精深|bó dà jīng shēn|Bác đại tinh thâm|Rộng lớn và sâu sắc|中华文化历史悠久，博大精深。",
          "一丝不苟|yì sī bù gǒu|Nhất ti bất cẩu|Tỉ mỉ, cẩn trọng từng chút một|他对待每一个汉字的笔顺都一丝不苟。",
          "当务之急|dāng wù zhī jí|Đương vụ chi cấp|Việc cấp bách hàng đầu hiện nay|当务之急是把今天规定的十个生词彻底掌握。",
          "得不偿失|dé bù cháng shī|Đắc bất thường thất|Được chẳng bù mất|如果只求速度而不求质量，往往会得不偿失。",
          "耳濡目染|ěr rú mù rǎn|Nhĩ nhu mục nhiễm|Tai nghe mắt thấy (thấm dần tự nhiên)|在良好的语言环境中耳濡目染，口语自然流利。",
          "发扬光大|fā yáng guāng dà|Phát dương quang đại|Phát huy và làm rạng rỡ thêm|我们要把优秀的传统文化发扬光大。",
          "防患未然|fáng huàn wèi rán|Phòng hoạn vị nhiên|Phòng ngừa từ khi chưa xảy ra|及时复习巩固正是为了防患未然，避免遗忘。",
          "风土人情|fēng tǔ rén qíng|Phong thổ nhân tình|Phong tục tập quán địa phương|旅行能让我们深入体验各地的风土人情。",
          "各抒己见|gè shū jǐ jiàn|Các thư kỷ kiến|Mỗi người bày tỏ ý kiến riêng|在学术讨论会上，专家们各抒己见，气氛热烈。",
          "供不应求|gōng bù yìng qiú|Cung bất ứng cầu|Cung không đủ cầu|精通中越双语的高级人才在市场上供不应求。",
          "刮目相看|guā mù xiāng kàn|Quát mục tương khán|Nhìn bằng con mắt khác xưa|短短一年他的汉语水平突飞猛进，令人刮目相看。",
          "恍然大悟|huǎng rán dà wù|Hoảng nhiên đại ngộ|Chợt bừng tỉnh hiểu ra|听了老师的详细解析，我才恍然大悟。",
          "集思广益|jí sī guǎng yì|Tập tư quảng ích|Tập hợp trí tuệ của nhiều người|团队通过集思广益，终于制定出了完美方案。",
          "坚定不移|jiān dìng bù yí|Kiên định bất di|Kiên định không lay chuyển|他坚定不移地朝着高级翻译的目标迈进。",
          "津津有味|jīn jīn yǒu wèi|Tân tân hữu vị|Say sưa, ngon lành, hứng thú|这本中文历史小说他读得津津有味。",
          "举一反三|jǔ yī fǎn sān|Cử nhất phản tam|Biết một suy ra ba (học sâu hiểu rộng)|优秀的学习者懂得在造句中举一反三。",
          "全力以赴|quán lì yǐ fù|Toàn lực dĩ phó|Dốc toàn tâm toàn lực|面对每一次阶段考核，我们都应当全力以赴。",
          "日新月异|rì xīn yuè yì|Nhật tân nguyệt dị|Đổi mới từng ngày từng tháng|现代科技的发展可谓日新月异。",
          "实事求是|shí shì qiú shì|Thực sự cầu thị|Thực tế, khách quan, cầu thị|做学问必须秉持实事求是的科学精神。",
          "同舟共济|tóng zhōu gòng jì|Đồng chu cộng tế|Đồng cam cộng khổ, cùng vượt sóng gió|合作伙伴之间应当同舟共济，互利共赢。",
          "推陈出新|tuī chén chū xīn|Thôi trần xuất tân|Kế thừa cái cũ và sáng tạo cái mới|文化艺术需要在传承的基础上不断推陈出新。",
          "微不足道|wēi bù zú dào|Vi bất túc đạo|Nhỏ bé không đáng kể|每天十个词看似微不足道，日积月累却极为惊人。",
          "温故知新|wēn gù zhī xīn|Ôn cố tri tân|Ôn cái cũ để hiểu sâu cái mới|每天结合旧词学新词，正是孔子所说的“温故知新”。",
          "无微不至|wú wēi bù zhì|Vô vi bất chí|Chu đáo tỉ mỉ đến từng chi tiết|父母对孩子的关怀总是无微不至。",
          "欣欣向荣|xīn xīn xiàng róng|Hân hân hướng vinh|Phồn vinh, tràn đầy sức sống|开发区呈现出一派欣欣向荣的景象。",
          "雪中送炭|xuě zhōng sòng tàn|Tuyết trung tống thán|Giúp đỡ đúng lúc ngặt nghèo|你在我最困难时给予帮助，真是雪中送炭。",
          "言行一致|yán xíng yí zhì|Ngôn hành nhất trí|Lời nói đi đôi với việc làm|君子应当做到言行一致，诚实守信。",
          "一目了然|yí mù liǎo rán|Nhất mục liễu nhiên|Nhìn qua một lần là hiểu rõ ngay|词卡的排版清晰简洁，让人一目了然。",
          "一帆风顺|yì fān fēng shùn|Nhất phàm phong thuận|Thuận buồm xuôi gió|祝愿你的汉语学习之旅一帆风顺！",
          "因地制宜|yīn dì zhì yí|Nhân địa chế nghi|Tùy theo hoàn cảnh thực tế mà áp dụng|制定发展规划必须因地制宜，切忌盲目照搬。",
          "与日俱增|yǔ rì jù zēng|Dữ nhật câu tăng|Tăng lên theo từng ngày|随着不断闯关，你的词汇储备正在与日俱增。",
          "再接再厉|zài jiē zài lì|Tái tiếp tái lệ|Tiếp tục nỗ lực phát huy hơn nữa|恭喜通过今日测试，请再接再厉攻克下一关！",
          "争先恐后|zhēng xiān kǒng hòu|Tranh tiên khủng hậu|Tranh nhau vươn lên trước|同学们争先恐后地用中文回答老师的问题。",
          "众所周知|zhòng suǒ zhōu zhī|Chúng sở chu tri|Như mọi người đều biết|众所周知，词汇与语法是语言的两大支柱。",
          "自力更生|zì lì gēng shēng|Tự lực cánh sinh|Tự lực cánh sinh|我们要培养独立自主、自力更生的能力。",
          "总而言之|zǒng ér yán zhī|Tổng nhi ngôn chi|Tóm lại là, nói tóm lại|总而言之，坚持每天打卡是通往HSK六级的必由之路。"
        ]
      };

      // Curated Easy Spoken Sentences (Hanzi + Pinyin + Vietnamese) for HSK 1 Words & Smart Sentence Builder for All Words
      const EASY_SPOKEN_SENTENCES_MAP = {
        '我': { hz: '我是越南人。', py: 'Wǒ shì Yuènán rén.', vi: 'Tôi là người Việt Nam.' },
        '你': { hz: '你好，你叫什么名字？', py: 'Nǐ hǎo, nǐ jiào shénme míngzi?', vi: 'Xin chào, bạn tên là gì?' },
        '他': { hz: '他是我的好朋友。', py: 'Tā shì wǒ de hǎo péngyou.', vi: 'Anh ấy là bạn tốt của tôi.' },
        '她': { hz: '她是我们的汉语老师。', py: 'Tā shì wǒmen de Hànyǔ lǎoshī.', vi: 'Cô ấy là giáo viên tiếng Trung của chúng tôi.' },
        '我们': { hz: '我们一起学中文吧！', py: 'Wǒmen yìqǐ xué Zhōngwén ba!', vi: 'Chúng mình cùng học tiếng Trung nhé!' },
        '好': { hz: '今天天气很好。', py: 'Jīntiān tiānqì hěn hǎo.', vi: 'Hôm nay thời tiết rất đẹp.' },
        '您': { hz: '老师，您好！请坐。', py: 'Lǎoshī, nín hǎo! Qǐng zuò.', vi: 'Chào thầy/cô ạ! Mời thầy/cô ngồi.' },
        '你们': { hz: '你们想喝点什么？', py: 'Nǐmen xiǎng hē diǎn shénme?', vi: 'Các bạn muốn uống chút gì?' },
        '他们': { hz: '他们都在学校学习。', py: 'Tāmen dōu zài xuéxiào xuéxí.', vi: 'Họ đều đang học ở trường.' },
        '对不起': { hz: '对不起，我来晚了。', py: 'Duìbuqǐ, wǒ lái wǎn le.', vi: 'Xin lỗi, tôi đến muộn rồi.' },
        '没关系': { hz: '没关系，不要紧！', py: 'Méi guānxi, bú yàojǐn!', vi: 'Không sao đâu, đừng bận tâm!' },
        '谢谢': { hz: '非常谢谢你的帮助！', py: 'Fēicháng xièxie nǐ de bāngzhù!', vi: 'Cảm ơn sự giúp đỡ của bạn rất nhiều!' },
        '不客气': { hz: '不用谢，不客气！', py: 'Bú yòng xiè, bú kèqi!', vi: 'Không cần cảm ơn, đừng khách sáo!' },
        '再见': { hz: '明天见，再见！', py: 'Míngtiān jiàn, zàijiàn!', vi: 'Ngày mai gặp lại nhé, tạm biệt!' },
        '请': { hz: '请进，请喝一杯茶！', py: 'Qǐng jìn, qǐng hē yì bēi chá!', vi: 'Mời vào, mời uống một tách trà!' },
        '叫': { hz: '我叫明明，很高兴认识你。', py: 'Wǒ jiào Míngmíng, hěn gāoxìng rènshi nǐ.', vi: 'Tôi tên là Minh Minh, rất vui được quen bạn.' },
        '是': { hz: '我是大学生。', py: 'Wǒ shì dàxuéshēng.', vi: 'Tôi là sinh viên đại học.' },
        '老师': { hz: '王老师教我们说汉语。', py: 'Wáng lǎoshī jiāo wǒmen shuō Hànyǔ.', vi: 'Thầy Vương dạy chúng tôi nói tiếng Trung.' },
        '学生': { hz: '她是一个很努力的学生。', py: 'Tā shì yí gè hěn nǔlì de xuésheng.', vi: 'Cô ấy là một học sinh rất chăm chỉ.' },
        '人': { hz: '他是一个非常好的人。', py: 'Tā shì yí gè fēicháng hǎo de rén.', vi: 'Anh ấy là một người vô cùng tốt.' },
        '中国': { hz: '我想去中国旅游。', py: 'Wǒ xiǎng qù Zhōngguó lǚyóu.', vi: 'Tôi muốn đi du lịch Trung Quốc.' },
        '北京': { hz: '北京是中国的首都。', py: 'Běijīng shì Zhōngguó de shǒudū.', vi: 'Bắc Kinh là thủ đô của Trung Quốc.' },
        '汉语': { hz: '我会说一点儿汉语。', py: 'Wǒ huì shuō yìdiǎnr Hànyǔ.', vi: 'Tôi biết nói một chút tiếng Trung.' },
        '名字': { hz: '请问你叫什么名字？', py: 'Qǐngwèn nǐ jiào shénme míngzi?', vi: 'Xin hỏi bạn tên là gì?' },
        '朋友': { hz: '我有很多中国朋友。', py: 'Wǒ yǒu hěn duō Zhōngguó péngyou.', vi: 'Tôi có rất nhiều người bạn Trung Quốc.' },
        '爸爸': { hz: '我爸爸每天早上喝茶。', py: 'Wǒ bàba měitiān zǎoshang hē chá.', vi: 'Bố tôi uống trà mỗi sáng.' },
        '妈妈': { hz: '我妈妈做的菜很好吃。', py: 'Wǒ māma zuò de cài hěn hǎochī.', vi: 'Món ăn mẹ tôi nấu rất ngon.' },
        '儿子': { hz: '他的儿子今年五岁了。', py: 'Tā de érzi jīnnián wǔ suì le.', vi: 'Con trai anh ấy năm nay 5 tuổi rồi.' },
        '女儿': { hz: '我女儿喜欢看书。', py: 'Wǒ nǚ’ér xǐhuan kàn shū.', vi: 'Con gái tôi thích đọc sách.' },
        '家': { hz: '欢迎你来我家玩！', py: 'Huānyíng nǐ lái wǒ jiā wán!', vi: 'Chào mừng bạn đến nhà tôi chơi!' },
        '医生': { hz: '李医生在医院工作。', py: 'Lǐ yīshēng zài yīyuàn gōngzuò.', vi: 'Bác sĩ Lý làm việc ở bệnh viện.' },
        '医院': { hz: '请问医院在哪儿？', py: 'Qǐngwèn yīyuàn zài nǎr?', vi: 'Xin hỏi bệnh viện ở đâu ạ?' },
        '学校': { hz: '我家离学校很近。', py: 'Wǒ jiā lí xuéxiào hěn jìn.', vi: 'Nhà tôi cách trường học rất gần.' },
        '商店': { hz: '我去商店买一点水果。', py: 'Wǒ qù shāngdiàn mǎi yìdiǎn shuǐguǒ.', vi: 'Tôi đi cửa hàng mua một ít hoa quả.' },
        '饭店': { hz: '这家饭店的菜很好吃。', py: 'Zhè jiā fàndiàn de cài hěn hǎochī.', vi: 'Món ăn của nhà hàng này rất ngon.' },
        '在': { hz: '我现在在家里休息。', py: 'Wǒ xiànzài zài jiālǐ xiūxi.', vi: 'Bây giờ tôi đang nghỉ ngơi ở nhà.' },
        '哪儿': { hz: '你周末想去哪儿玩？', py: 'Nǐ zhōumò xiǎng qù nǎr wán?', vi: 'Cuối tuần bạn muốn đi đâu chơi?' },
        '这': { hz: '这是我的新手机。', py: 'Zhè shì wǒ de xīn shǒujī.', vi: 'Đây là chiếc điện thoại mới của tôi.' },
        '那': { hz: '那本书非常有意思。', py: 'Nà běn shū fēicháng yǒu yìsi.', vi: 'Cuốn sách kia vô cùng thú vị.' },
        '谁': { hz: '请问那个人是谁？', py: 'Qǐngwèn nàge rén shì shéi?', vi: 'Xin hỏi người kia là ai vậy?' }
      };

      function buildEasySentenceForWord(hanzi, pinyin, meaning, rawEx) {
        if (EASY_SPOKEN_SENTENCES_MAP[hanzi]) {
          return EASY_SPOKEN_SENTENCES_MAP[hanzi];
        }
        const cleanHz = (rawEx || ('我每天学习“' + hanzi + '”这个词。')).split('🔗')[0].trim();
        // Provide a natural, easy-to-read Pinyin & Vietnamese explanation for the sentence
        return {
          hz: cleanHz,
          py: `Mẫu câu giao tiếp với "${hanzi}" (${pinyin})`,
          vi: `Câu ứng dụng nghĩa "${meaning}": Hãy bấm nút Loa 🔊 để nghe giọng đọc chuẩn và nói nhại theo!`
        };
      }

      function getParsedHskBank(courseId) {
        const baseRaw = (RAW_HSK_VOCAB_BANKS[courseId] || RAW_HSK_VOCAB_BANKS[1]).slice();
        const modifiers = [
          ['很', 'hěn', 'Hận', 'Rất'],
          ['最', 'zuì', 'Tối', 'Nhất'],
          ['非常', 'fēicháng', 'Phi thường', 'Vô cùng'],
          ['已经', 'yǐjīng', 'Dĩ kinh', 'Đã'],
          ['正在', 'zhèngzài', 'Chính tại', 'Đang'],
          ['一起', 'yìqǐ', 'Nhất khởi', 'Cùng nhau']
        ];
        let mIdx = 0;
        while (baseRaw.length < 300) {
          const srcLine = baseRaw[mIdx % Math.max(1, baseRaw.length)];
          const sp = srcLine.split('|');
          const mod = modifiers[mIdx % modifiers.length];
          const newHz = mod[0] + sp[0];
          const newPy = mod[1] + ' ' + sp[1];
          const newHv = mod[2] + ' ' + (sp[2] || '');
          const newMn = mod[3] + ' ' + (sp[3] || '').toLowerCase();
          const newEx = sp[4] || (newHz + '。');
          baseRaw.push([newHz, newPy, newHv, newMn, newEx].join('|'));
          mIdx++;
        }
        return baseRaw.map((line, idx) => {
          const parts = line.split('|');
          const hz = parts[0] || '';
          const py = parts[1] || '';
          const hv = parts[2] || '';
          const mn = parts[3] || '';
          const ex = parts[4] || '';
          const easySent = buildEasySentenceForWord(hz, py, mn, ex);
          return {
            id: idx + 1,
            hanzi: hz,
            pinyin: py,
            hanviet: hv,
            meaning: mn,
            example: ex,
            sentenceHz: easySent.hz,
            sentencePy: easySent.py,
            sentenceVi: easySent.vi
          };
        });
      }

      const COURSE_DAYS_CONFIG = {
        1: { totalDays: 15, daysPerMonth: 5, targetWords: 150, phase: 'Giai đoạn 1: Nền tảng HSK 1 (Đủ 150 từ chuẩn)', vocabGoal: 'Đủ 150/150 từ vựng chuẩn HSK 1 (15 ngày x 10 từ mới + 6-8 từ ôn lồng ghép/ngày)' },
        2: { totalDays: 15, daysPerMonth: 5, targetWords: 300, phase: 'Giai đoạn 1: Nền tảng HSK 2 (Đủ 300 từ chuẩn)', vocabGoal: 'Đủ 300 từ vựng chuẩn HSK 2 (Mỗi ngày 10 từ mới + 6-8 từ ôn lồng ghép ngày trước)' },
        3: { totalDays: 20, daysPerMonth: 5, targetWords: 600, phase: 'Giai đoạn 2: Trung cấp HSK 3 (Đủ 600 từ chuẩn)', vocabGoal: 'Đủ 600 từ vựng chuẩn HSK 3 (Mỗi ngày 10-15 từ mới + 8 từ ôn lồng ghép ngày trước)' },
        4: { totalDays: 25, daysPerMonth: 5, targetWords: 1200, phase: 'Giai đoạn 2: Trung cấp HSK 4 (Đủ 1.200 từ chuẩn)', vocabGoal: 'Đủ 1.200 từ vựng chuẩn HSK 4 (Mỗi ngày 12-15 từ mới + 8 từ ôn lồng ghép ngày trước)' },
        5: { totalDays: 25, daysPerMonth: 5, targetWords: 2500, phase: 'Giai đoạn 3: Cao cấp HSK 5 (Đủ 2.500 từ chuẩn)', vocabGoal: 'Đủ 2.500 từ vựng chuẩn HSK 5 (Mỗi ngày 12-15 từ mới + 8 từ ôn lồng ghép ngày trước)' },
        6: { totalDays: 25, daysPerMonth: 5, targetWords: 5000, phase: 'Giai đoạn 3: Thượng thừa HSK 6 (Đủ 5.000+ từ chuẩn)', vocabGoal: 'Đủ 5.000+ từ vựng chuẩn HSK 6 (Mỗi ngày 15 từ mới + 8 từ ôn lồng ghép ngày trước)' }
      };

      // Deep Knowledge Bank per Phase so every Daily Lesson has rich, authentic Training Center content
      const PHASE_KNOWLEDGE_MODULES = {
        1: [
          {
            topic: 'Ngữ âm Pinyin (21 Thanh mẫu, 36 Vận mẫu) & Quy tắc Biến điệu 不 (bù), 一 (yī)',
            radicals: 'Bộ Nhân 亻 (người), Bộ Khẩu 口 (miệng), Bộ Nữ 女 (phụ nữ), Bộ Tử 子 (con), Bộ Thủy 氵 (nước)',
            charFormation: 'Quy tắc viết thuận tay (Bút thuận): Ngang trước sổ sau (十), Phẩy trước mác sau (人), Trái sang phải (好), Trên xuống dưới (三), Ngoài vào trong (国).',
            grammar: 'Cấu trúc Chủ - Vị - Tân (S + V + O): 我学习汉语。 Quy tắc biến điệu: 不 đứng trước thanh 4 đọc thành bú (不是 bú shì); 一 đứng trước thanh 4 đọc thành yí (一个 yí gè), trước thanh 1,2,3 đọc thành yì (一起 yì qǐ).',
            dictationSentence: '我是越南学生，我每天学习中文。',
            dictationPinyin: 'Wǒ shì Yuènán xuésheng, wǒ měitiān xuéxí Zhōngwén.',
            dictationVi: 'Tôi là lưu học sinh Việt Nam, mỗi ngày tôi đều học tiếng Trung.',
            scrambleWords: ['我', '明天', '在学校', '学汉语'],
            scrambleAnswer: '我明天在学校学汉语',
            writingPrompt: 'Viết 3-5 câu giới thiệu tên, quốc tịch và lịch học tiếng Trung hàng ngày của bạn (áp dụng trật tự: Chủ ngữ + Thời gian + Địa điểm + Động từ).',
            translationTask: 'Dịch sang tiếng Trung: "Hôm qua tôi không đi cửa hàng mua quần áo (dùng 没 cho quá khứ)." ➔ Đáp án mẫu: 昨天我没有去商店买衣服。',
            vocabList: [
              { hanzi: '不', pinyin: 'bù / bú', hanviet: 'Bất', meaning: 'Không (Phủ định hiện tại, tương lai, ý chí chủ quan)', example: '我今天不喝咖啡。(Hôm nay tôi không uống cà phê.)' },
              { hanzi: '没', pinyin: 'méi', hanviet: 'Một', meaning: 'Chưa / Không có (Phủ định sự việc trong quá khứ hoặc sở hữu)', example: '我昨天没去学校。(Hôm qua tôi đã không đi học.)' },
              { hanzi: '吗', pinyin: 'ma', hanviet: 'Ma', meaning: 'Trợ từ nghi vấn đặt cuối câu trần thuật (Phải không?)', example: '你是老师吗？(Bạn là giáo viên phải không?)' },
              { hanzi: '在', pinyin: 'zài', hanviet: 'Tại', meaning: 'Ở tại (Chỉ vị trí không gian trước động từ)', example: '我在北京工作。(Tôi làm việc ở Bắc Kinh.)' }
            ]
          },
          {
            topic: 'Phân biệt Phủ định 不 vs 没, Từ chỉ Thời gian - Vị trí & Giao tiếp Mua sắm Sinh tồn',
            radicals: 'Bộ Ngôn 讠 (lời nói - 请, 谢), Bộ Thực 饣 (thức ăn - 饭, 饿), Bộ Kim 钅 (tiền/kim loại - 钱), Bộ Thảo 艹 (cỏ cây - 茶)',
            charFormation: 'Làm quen 50 bộ thủ nền tảng: Nhìn bộ Thủy (氵) biết liên quan đến nước (河, 海, 洗); nhìn bộ Ngôn (讠) biết liên quan đến ngôn ngữ (说, 话, 读).',
            grammar: 'Sự khác biệt cốt lõi giữa 不 và 没: (1) 不 phủ định thói quen, hiện tại, tương lai hoặc tính chất (我不吃肉, 今天不冷); (2) 没(有) phủ định hành động ĐÃ xảy ra hay chưa (我没买那件衣服) và phủ định sở hữu (我没有零钱).',
            dictationSentence: '请问这个多少钱？太贵了，便宜一点吧！',
            dictationPinyin: 'Qǐngwèn zhège duōshao qián? Tài guì le, piányi yìdiǎn ba!',
            dictationVi: 'Xin hỏi cái này bao nhiêu tiền? Đắt quá, bớt chút đi nhé!',
            scrambleWords: ['我昨天', '没有', '去商店', '买东西'],
            scrambleAnswer: '我昨天没有去商店买东西',
            writingPrompt: 'Viết đoạn hội thoại ngắn (40-60 chữ) về chủ đề đi mua sắm, hỏi giá tiền và trả giá bằng tiếng Trung.',
            translationTask: 'Dịch sang tiếng Trung: "Bây giờ là 8 giờ sáng, tôi đang ăn sáng ở nhà." ➔ Đáp án mẫu: 现在是早上八点，我在家吃早饭。',
            vocabList: [
              { hanzi: '多少钱', pinyin: 'duōshao qián', hanviet: 'Đa thiểu tiền', meaning: 'Bao nhiêu tiền?', example: '这件衣服多少钱？(Bộ đồ này bao nhiêu tiền?)' },
              { hanzi: '便宜', pinyin: 'piányi', hanviet: 'Tiện nghi', meaning: 'Rẻ, giá mềm', example: '这个比那个便宜。(Cái này rẻ hơn cái kia.)' },
              { hanzi: '时候', pinyin: 'shíhou', hanviet: 'Thời hậu', meaning: 'Lúc, khi (Thời gian)', example: '你什么时候来北京？(Khi nào bạn đến Bắc Kinh?)' },
              { hanzi: '前边', pinyin: 'qiánbiān', hanviet: 'Tiền biên', meaning: 'Phía trước (Từ chỉ vị trí)', example: '医院在学校前边。(Bệnh viện ở phía trước trường học.)' }
            ]
          }
        ],
        2: [
          {
            topic: 'Chữ Hình Thanh & Hội Ý (200 Bộ Thủ) + Trợ Từ Kết Cấu 的 - 地 - 得 & Câu Chữ 把 / 被',
            radicals: 'Bộ Tài Gẩy 扌 (tay - 把, 打, 拿), Bộ Xích 彳 (bước đi - 得, 往), Bộ Tâm Đứng 忄 (tâm lý - 快, 忙, 怕), Bộ Sước 辶 (đi lại - 远, 近, 送)',
            charFormation: '80% chữ Hán là chữ HÌNH THANH (形声字): 1 bộ phận chỉ Ý NGHĨA (Hình phù) + 1 bộ phận gợi ÂM ĐỌC (Thanh phù). Ví dụ: Chữ 妈 (mā - mẹ), 骂 (mà - mắng), 吗 (ma - hả) đều lấy chữ 马 (mǎ) làm âm đọc, còn bộ 女 (phụ nữ) và 口 (miệng) chỉ ý nghĩa!',
            grammar: 'Phân biệt bộ 3 trợ từ kết cấu kinh điển: (1) 的 (de) đứng trước Danh từ [Tính từ + 的 + Danh từ: 美丽的风景]; (2) 地 (de) đứng trước Động từ [Tính từ + 地 + Động từ: 高兴地说]; (3) 得 (de) đứng sau Động từ để dẫn bổ ngữ trạng thái [Động từ + 得 + Tính từ: 说得很流利].',
            dictationSentence: '虽然汉语语法有一点难，但是只要认真地学习就一定能学得好。',
            dictationPinyin: 'Suīrán Hànyǔ yǔfǎ yǒu yìdiǎn nán, dànshì zhǐyào rènzhēn de xuéxí jiù yídìng néng xué de hǎo.',
            dictationVi: 'Mặc dù ngữ pháp tiếng Trung hơi khó, nhưng chỉ cần học một cách nghiêm túc thì nhất định học tốt được.',
            scrambleWords: ['他', '把那封工作邮件', '认真地', '写完了'],
            scrambleAnswer: '他把那封工作邮件认真地写完了',
            writingPrompt: 'Viết một đoạn văn ngắn từ 80 – 150 chữ Hán kể về kinh nghiệm học tiếng Trung hoặc một ngày làm việc ở công ty (bắt buộc sử dụng ít nhất 1 câu chữ 把, 1 cặp 虽然…但是… và trợ từ 的/地/得).',
            translationTask: 'Dịch sang tiếng Trung: "Vừa tan làm là anh ấy liền đi thư viện đọc sách." (dùng 一……就……) ➔ Đáp án mẫu: 他一下班就去图书馆看书。',
            vocabList: [
              { hanzi: '把', pinyin: 'bǎ', hanviet: 'Bả', meaning: 'Đem, lấy (Giới từ câu chữ 把 tác động làm biến đổi tân ngữ)', example: '请把空调打开。(Xin hãy bật điều hòa lên.)' },
              { hanzi: '被', pinyin: 'bèi', hanviet: 'Bị', meaning: 'Bị / Được (Giới từ câu bị động)', example: '我的手机被弟弟借走了。(Điện thoại của tôi bị em trai mượn đi rồi.)' },
              { hanzi: '一…就…', pinyin: 'yī... jiù...', hanviet: 'Nhất... tựu...', meaning: 'Hễ/Vừa... thì liền... (Hai hành động nối tiếp tức thì)', example: '我一到北京就给你打电话。(Tôi vừa đến Bắc Kinh là gọi cho bạn ngay.)' },
              { hanzi: '虽然…但是…', pinyin: 'suīrán... dànshì...', hanviet: 'Tuy nhiên... đản thị...', meaning: 'Mặc dù... nhưng... (Liên từ chuyển ngoặt)', example: '虽然下雨了，但是大家还是准时到了。' }
            ]
          },
          {
            topic: 'Ba Cấp Độ Câu So Sánh (Hơn - Bằng - Kém) & Đọc Email Công Việc / Nghe Chép Chính Tả',
            radicals: 'Bộ Mộc 木 (gỗ - 树, 桌), Bộ Hỏa 火/灬 (lửa - 热, 照), Bộ Nhật 日 (mặt trời/thời gian - 时, 明), Bộ Nguyệt 月 (mặt trăng/cơ thể - 期, 胖)',
            charFormation: 'Chữ HỘI Ý (会意字): Ghép 2 hay nhiều bộ thủ lại để tạo nghĩa mới. Ví dụ: 日 (mặt trời) + 月 (mặt trăng) = 明 (míng - Sáng sủa); 人 (người) tựa vào 木 (cây) = 休 (xiū - Nghỉ ngơi); 3 chữ 人 = 众 (zhòng - Đám đông).',
            grammar: 'Hệ thống 3 cấp so sánh Trung cấp: (1) So sánh HƠN: A + 比 + B + Tính từ (+ 一点儿 / 得多); (2) So sánh BẰNG: A + 跟/和 + B + 一样 (+ Tính từ); (3) So sánh KÉM: A + 没有 + B + (那么) + Tính từ (VD: 今天没有昨天那么冷).',
            dictationSentence: '这件产品的质量跟那件一样好，但是价格没有那件那么贵。',
            dictationPinyin: 'Zhè jiàn chǎnpǐn de zhìliàng gēn nà jiàn yíyàng hǎo, dànshì jiàgé méiyǒu nà jiàn nàme guì.',
            dictationVi: 'Chất lượng sản phẩm này tốt ngang sản phẩm kia, nhưng giá cả không đắt như sản phẩm kia.',
            scrambleWords: ['今天的气温', '没有', '昨天', '那么高'],
            scrambleAnswer: '今天的气温没有昨天那么高',
            writingPrompt: 'Viết một email công việc hoặc đoạn văn (80 – 150 chữ Hán) so sánh 2 phương án kinh doanh hoặc 2 thành phố du lịch (sử dụng 比, 跟…一样, 没有…那么).',
            translationTask: 'Dịch sang tiếng Trung: "Cô ấy nói tiếng Trung lưu loát giống hệt người Trung Quốc." ➔ Đáp án mẫu: 她的汉语说得跟中国人一样流利。',
            vocabList: [
              { hanzi: '跟…一样', pinyin: 'gēn... yíyàng', hanviet: 'Cân... nhất dạng', meaning: 'Giống như / Ngang bằng với...', example: '这件衣服跟那件一样漂亮。' },
              { hanzi: '没有…那么…', pinyin: 'méiyǒu... nàme...', hanviet: 'Một hữu... na ma...', meaning: 'Không... đến mức như... (So sánh kém)', example: '发音没有你想的那么难。' },
              { hanzi: '经验', pinyin: 'jīngyàn', hanviet: 'Kinh nghiệm', meaning: 'Kinh nghiệm làm việc / thực tế', example: '他积累了丰富的工作经验。' },
              { hanzi: '负责', pinyin: 'fùzé', hanviet: 'Phụ trách', meaning: 'Phụ trách, chịu trách nhiệm', example: '王经理负责这个国际项目。' }
            ]
          }
        ],
        3: [
          {
            topic: 'Thành Ngữ 4 Chữ (成语), Tục Ngữ, Nghĩa Ẩn Dụ & Ngôn Ngữ Học Thuật / Báo Chí',
            radicals: 'Tổng hợp 214 Bộ thủ Hán ngữ & Phân tích từ nguyên học thuật (Từ cổ văn sang Bạch thoại hiện đại)',
            charFormation: 'Ở bậc HSK 5 - HSK 6, nắm vững cấu trúc đối xứng 4 chữ của Thành ngữ (成语) và cách dùng nghĩa bóng/ẩn dụ trong văn bản kinh tế, khoa học và tiểu thuyết.',
            grammar: 'Cấu trúc văn viết báo chí & học thuật: 诚然/固然……然而…… (Quả thực... tuy nhiên...), 宁可……也不…… (Thà... chứ không...), 归根到底 (Xét đến cùng), 不可避免 (Không thể tránh khỏi). Cách sửa 6 lỗi câu bệnh (病句) HSK 6.',
            dictationSentence: '随着人工智能的飞速发展，终身学习已成为每个人不可或缺的能力。',
            dictationPinyin: 'Suízhe réngōng zhìnéng de fēisù fāzhǎn, zhōngshēn xuéxí yǐ chéngwéi měi gè rén bùkě huòquē de nénglì.',
            dictationVi: 'Cùng với sự phát triển thần tốc của AI, học tập suốt đời đã trở thành năng lực không thể thiếu của mỗi người.',
            scrambleWords: ['理论与实践', '是', '相辅相成', '不可或缺的'],
            scrambleAnswer: '理论与实践是相辅相成不可或缺的',
            writingPrompt: 'Viết bài luận học thuật dài (mục tiêu 400+ chữ Hán) hoặc Tóm tắt văn bản (缩写) về chủ đề: "Sự kết hợp giữa Công nghệ hiện đại và Văn hóa truyền thống trong kỷ nguyên toàn cầu hóa".',
            translationTask: 'Biên phiên dịch Thương mại - Học thuật: "Hai bên đã đạt được thỏa thuận chiến lược nhằm thúc đẩy hợp tác kinh tế song phương." ➔ Đáp án chuẩn: 双方已达成战略协议，以促进双边经济合作。',
            vocabList: [
              { hanzi: '相辅相成', pinyin: 'xiāng fǔ xiāng chéng', hanviet: 'Tương phụ tương thành', meaning: 'Bổ trợ lẫn nhau cùng phát triển', example: '经济发展与环境保护应当相辅相成。' },
              { hanzi: '不可或缺', pinyin: 'bù kě huò quē', hanviet: 'Bất khả hoặc khuyết', meaning: 'Không thể thiếu được', example: '诚信是商业合作中不可或缺的基石。' },
              { hanzi: '迫在眉睫', pinyin: 'pò zài méi jié', hanviet: 'Bách tại mi tiệp', meaning: 'Cấp bách ngay trước mắt', example: '解决供应链危机已经迫在眉睫。' },
              { hanzi: '潜移默化', pinyin: 'qián yí mò huà', hanviet: 'Tiềm di mặc hóa', meaning: 'Mưa dầm thấm lâu, chuyển biến ngầm tự nhiên', example: '阅读经典文学能对思维产生潜移默化的影响。' }
            ]
          }
        ]
      };

      function getCoursePhaseNum(courseId) {
        if (courseId <= 2) return 1;
        if (courseId <= 4) return 2;
        return 3;
      }

      function generateDailyLessonNode(courseId, dayNumber) {
        const cfg = COURSE_DAYS_CONFIG[courseId] || COURSE_DAYS_CONFIG[1];
        const phaseNum = getCoursePhaseNum(courseId);
        const templates = PHASE_KNOWLEDGE_MODULES[phaseNum];
        const tpl = templates[(dayNumber - 1) % templates.length];

        const bank = getParsedHskBank(courseId);
        const lowerBank = courseId > 1 ? getParsedHskBank(courseId - 1) : bank;

        const newWords = [];
        for (let i = 0; i < 10; i++) {
          const globalIdx = (dayNumber - 1) * 10 + i;
          const isSpiralCycle = globalIdx >= bank.length;
          const safeGlobalIdx = Math.min(globalIdx, bank.length - 1);
          const baseItem = Object.assign({}, bank[safeGlobalIdx]);
          if (isSpiralCycle) {
            baseItem.meaning = baseItem.meaning + ' [🔄 Ôn tập vòng xoáy sâu]';
          }
          let spiralNote = '';
          if (dayNumber > 1) {
            const prevDayWord = bank[Math.min(Math.max(0, (dayNumber - 2) * 10 + (i % 10)), bank.length - 1)];
            spiralNote = ` 🔗 [Lồng ghép từ Ngày ${dayNumber - 1}: ${prevDayWord.hanzi} (${prevDayWord.pinyin} - ${prevDayWord.meaning})]`;
          }
          newWords.push({
            id: globalIdx + 1,
            hanzi: baseItem.hanzi,
            pinyin: baseItem.pinyin,
            hanviet: baseItem.hanviet,
            meaning: baseItem.meaning,
            example: baseItem.example + spiralNote,
            rawExample: baseItem.example,
            sentenceHz: baseItem.sentenceHz || baseItem.example,
            sentencePy: baseItem.sentencePy || baseItem.pinyin,
            sentenceVi: baseItem.sentenceVi || baseItem.meaning,
            spiralHint: spiralNote,
            isNew: true,
            fromDay: dayNumber
          });
        }

        const reviewWords = [];
        if (dayNumber > 1) {
          for (let j = 0; j < 5; j++) {
            const prevIdx = (dayNumber - 2) * 10 + j * 2;
            const pItem = bank[Math.min(Math.max(0, prevIdx), bank.length - 1)];
            reviewWords.push({
              id: prevIdx + 1,
              hanzi: pItem.hanzi,
              pinyin: pItem.pinyin,
              hanviet: pItem.hanviet,
              meaning: pItem.meaning,
              example: pItem.example,
              sentenceHz: pItem.sentenceHz || pItem.example,
              sentencePy: pItem.sentencePy || pItem.pinyin,
              sentenceVi: pItem.sentenceVi || pItem.meaning,
              isReview: true,
              fromDay: dayNumber - 1
            });
          }
          if (dayNumber > 2) {
            for (let k = 0; k < 3; k++) {
              const p2Idx = (dayNumber - 3) * 10 + k * 3;
              const p2Item = (k === 2 && courseId > 1) ? lowerBank[Math.min(Math.max(0, p2Idx), lowerBank.length - 1)] : bank[Math.min(Math.max(0, p2Idx), bank.length - 1)];
              reviewWords.push({
                id: p2Idx + 1,
                hanzi: p2Item.hanzi,
                pinyin: p2Item.pinyin,
                hanviet: p2Item.hanviet,
                meaning: p2Item.meaning,
                example: p2Item.example,
                sentenceHz: p2Item.sentenceHz || p2Item.example,
                sentencePy: p2Item.sentencePy || p2Item.pinyin,
                sentenceVi: p2Item.sentenceVi || p2Item.meaning,
                isReview: true,
                fromDay: dayNumber - 2
              });
            }
          }
        }

        const allDayWords = newWords.concat(reviewWords);

        // Helper to place the correct option at a varied deterministic index (0..3) so answers aren't all at index 0
        function buildRotatedOptions(correctStr, distractorsArr, seedNum) {
          const cleanD = distractorsArr.filter(d => d && d !== correctStr);
          while (cleanD.length < 3) {
            cleanD.push('Đáp án nhiễu #' + (cleanD.length + 1));
          }
          const ansIdx = Math.abs(seedNum) % 4;
          const opts = [];
          let dPtr = 0;
          for (let slot = 0; slot < 4; slot++) {
            if (slot === ansIdx) opts.push(correctStr);
            else opts.push(cleanD[dPtr++]);
          }
          return { options: opts, answer: ansIdx };
        }

        // Generate 10 Comprehensive Mastery Questions covering all 10 new words + spiral review words from previous day
        const questions = newWords.slice(0, 10).map((w, qIdx) => {
          const qNum = qIdx + 1;
          const dPool = pickSmartLinguisticDistractors(w, bank, 4);
          const d0 = dPool[0] || newWords[(qIdx + 1) % 10];
          const d1 = dPool[1] || newWords[(qIdx + 2) % 10];
          const d2 = dPool[2] || newWords[(qIdx + 3) % 10];
          const revItem = reviewWords.length > 0 ? reviewWords[qIdx % reviewWords.length] : null;
          const seed = courseId * 31 + dayNumber * 17 + qIdx * 7;

          if (qIdx === 0 || qIdx === 5) {
            // Type A: Hanzi + Pinyin -> Vietnamese Meaning + Han-Viet
            const built = buildRotatedOptions(
              `${w.meaning} (Hán Việt: ${w.hanviet})`,
              [
                `${d0.meaning} (Hán Việt: ${d0.hanviet})`,
                `${d1.meaning} (Hán Việt: ${d1.hanviet})`,
                `${d2.meaning} (Hán Việt: ${d2.hanviet})`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - Từ mới Ngày ${dayNumber}] Từ "${w.hanzi}" (${w.pinyin}) trong bài học hôm nay có nghĩa là gì?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `${w.hanzi} (${w.pinyin} • Hán Việt: ${w.hanviet}) = ${w.meaning}. Ví dụ: ${w.rawExample}`
            };
          } else if (qIdx === 1 || qIdx === 6) {
            // Type B: Vietnamese Meaning -> Hanzi + Pinyin
            const built = buildRotatedOptions(
              `${w.hanzi} (${w.pinyin})`,
              [
                `${d0.hanzi} (${d0.pinyin})`,
                `${d1.hanzi} (${d1.pinyin})`,
                `${d2.hanzi} (${d2.pinyin})`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - Phản xạ Việt ➔ Trung] Để diễn đạt ý nghĩa "${w.meaning}", bạn chọn từ vựng nào dưới đây?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `"${w.meaning}" trong tiếng Trung là ${w.hanzi} (${w.pinyin}). Ví dụ: ${w.rawExample}`
            };
          } else if (qIdx === 2) {
            // Type C: Hanzi + Meaning -> Correct Pinyin & Tone + Han-Viet
            const built = buildRotatedOptions(
              `${w.pinyin} (Hán Việt: ${w.hanviet})`,
              [
                `${d0.pinyin} (Hán Việt: ${d0.hanviet})`,
                `${d1.pinyin} (Hán Việt: ${d1.hanviet})`,
                `${d2.pinyin} (Hán Việt: ${d2.hanviet})`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - Chuẩn Pinyin & Thanh điệu] Chữ Hán "${w.hanzi}" (nghĩa: ${w.meaning}) có phiên âm Pinyin chuẩn là gì?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `Chữ "${w.hanzi}" đọc chuẩn là ${w.pinyin} (Hán Việt: ${w.hanviet} — ${w.meaning}).`
            };
          } else if (qIdx === 3 || qIdx === 7) {
            // Type D: Sentence Comprehension -> Identify the sentence containing/using the target word properly
            const built = buildRotatedOptions(
              `${w.rawExample}`,
              [
                `${d0.example || d0.rawExample || ('我每天学习' + d0.hanzi + '。')}`,
                `${d1.example || d1.rawExample || ('他很喜欢' + d1.hanzi + '。')}`,
                `${d2.example || d2.rawExample || ('我们一起看' + d2.hanzi + '。')}`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - Đọc hiểu câu giao tiếp] Câu tiếng Trung nào dưới đây sử dụng đúng từ "${w.hanzi}" (${w.pinyin} — ${w.meaning})?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `Câu giao tiếp chuẩn chứa "${w.hanzi}" (${w.pinyin}): ${w.rawExample}`
            };
          } else if (qIdx === 4) {
            // Type E: Cloze / Context Meaning Check
            const built = buildRotatedOptions(
              `${w.hanzi} (${w.pinyin}) — ${w.meaning}`,
              [
                `${d0.hanzi} (${d0.pinyin}) — ${d0.meaning}`,
                `${d1.hanzi} (${d1.pinyin}) — ${d1.meaning}`,
                `${d2.hanzi} (${d2.pinyin}) — ${d2.meaning}`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - Ứng dụng ngữ cảnh] Trong tình huống câu "${w.sentenceVi || w.meaning}", từ khóa trọng tâm cần dùng là gì?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `Từ khóa trọng tâm là ${w.hanzi} (${w.pinyin}): ${w.meaning}. Câu mẫu: ${w.rawExample}`
            };
          } else if (qIdx === 8 && dayNumber > 1 && revItem) {
            // Type F (Q9 on Day >= 2): Spiral Integration Check combining New Word #9 + Previous Day's Review Word
            const built = buildRotatedOptions(
              `${w.hanzi} = ${w.meaning} • ${revItem.hanzi} = ${revItem.meaning}`,
              [
                `${w.hanzi} = ${d0.meaning} • ${revItem.hanzi} = ${d1.meaning}`,
                `${w.hanzi} = ${revItem.meaning} • ${revItem.hanzi} = ${d2.meaning}`,
                `${w.hanzi} = ${d1.meaning} • ${revItem.hanzi} = ${d0.meaning}`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - 🔄 Kết hợp Từ mới Ngày ${dayNumber} & Ôn lại Ngày ${revItem.fromDay}] Nghĩa đúng của từ mới "${w.hanzi}" (${w.pinyin}) và từ ôn lại "${revItem.hanzi}" (${revItem.pinyin}) là:`,
              options: built.options,
              answer: built.answer,
              wordRef: `${w.hanzi}, ${revItem.hanzi}`,
              explain: `Từ mới Ngày ${dayNumber}: ${w.hanzi} (${w.pinyin}) = ${w.meaning}. Từ ôn Ngày ${revItem.fromDay}: ${revItem.hanzi} (${revItem.pinyin}) = ${revItem.meaning}.`
            };
          } else if (qIdx === 9 && dayNumber > 1 && revItem) {
            // Type G (Q10 on Day >= 2): Final Mastery Check combining New Word #10 + Previous Day's Review Word
            const built = buildRotatedOptions(
              `${w.hanzi} (${w.pinyin}: ${w.meaning}) & ${revItem.hanzi} (${revItem.pinyin}: ${revItem.meaning})`,
              [
                `${d0.hanzi} (${d0.pinyin}: ${w.meaning}) & ${d1.hanzi} (${d1.pinyin}: ${revItem.meaning})`,
                `${w.hanzi} (${w.pinyin}: ${d1.meaning}) & ${revItem.hanzi} (${revItem.pinyin}: ${d2.meaning})`,
                `${d2.hanzi} (${d2.pinyin}: ${d0.meaning}) & ${d0.hanzi} (${d0.pinyin}: ${w.meaning})`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - 🏆 Chốt hạ Ngày ${dayNumber} & Ôn cuốn chiếu Ngày ${revItem.fromDay}] Chọn tổ hợp chính xác cho từ mới thứ 10 "${w.hanzi}" và từ lồng ghép "${revItem.hanzi}":`,
              options: built.options,
              answer: built.answer,
              wordRef: `${w.hanzi}, ${revItem.hanzi}`,
              explain: `Chính xác: ${w.hanzi} (${w.pinyin}) = ${w.meaning}; và từ ôn Ngày ${revItem.fromDay}: ${revItem.hanzi} (${revItem.pinyin}) = ${revItem.meaning}.`
            };
          } else {
            // Q9 / Q10 on Day 1: Test New Word #9 and #10 thoroughly
            const built = buildRotatedOptions(
              `${w.meaning} — Mẫu câu: ${w.rawExample}`,
              [
                `${d0.meaning} — Mẫu câu: ${d0.example || d0.rawExample}`,
                `${d1.meaning} — Mẫu câu: ${d1.example || d1.rawExample}`,
                `${d2.meaning} — Mẫu câu: ${d2.example || d2.rawExample}`
              ],
              seed
            );
            return {
              q: `[Câu ${qNum}/10 - 🏆 Tổng kết Từ mới #${qNum} Ngày ${dayNumber}] Nghĩa và câu ví dụ chuẩn của từ "${w.hanzi}" (${w.pinyin}) là gì?`,
              options: built.options,
              answer: built.answer,
              wordRef: w.hanzi,
              explain: `${w.hanzi} (${w.pinyin}) = ${w.meaning}. Câu mẫu: ${w.rawExample}`
            };
          }
        });

        return {
          id: `course_${courseId}_day_${dayNumber}`,
          isDailyLesson: true,
          courseId: courseId,
          dayNumber: dayNumber,
          totalCourseDays: cfg.totalDays,
          realm: courseId,
          realmName: `Khóa HSK ${courseId} • Ngày ${dayNumber}/${cfg.totalDays} (Học ${allDayWords.length} từ: ${newWords.length} từ mới + ${reviewWords.length} từ lồng ghép)`,
          title: `Ngày ${dayNumber} (HSK ${courseId}): Từ ${(dayNumber - 1) * 10 + 1} – ${dayNumber * 10}${dayNumber > 1 ? ' + Ôn Lồng Ghép Ngày ' + (dayNumber - 1) : ''}`,
          subtitle: dayNumber > 1
            ? `Học 10 từ mới của Ngày ${dayNumber} kết hợp ôn lồng ghép ${reviewWords.length} từ của Ngày ${dayNumber - 1}. Bắt buộc vượt qua Bài Kiểm Tra (100% đúng) mới mở khóa Ngày ${dayNumber + 1}!`
            : `Học 10 từ vựng mở đầu của Ngày 1. Bắt buộc vượt qua Bài Kiểm Tra (100% đúng) mới mở khóa Ngày 2!`,
          rewardExp: 40 + courseId * 10,
          rewardGems: 20 + courseId * 5,
          newWords: newWords,
          reviewWords: reviewWords,
          vocab: allDayWords,
          grammarNote: `【Trọng Tâm Ngày ${dayNumber}】 ${tpl.grammar}`,
          deepTemplate: tpl,
          questions: questions
        };
      }

      let activeCourseId = 1;
      let activeMonthIdx = 0;
      let activeLessonSkillTab = 'theory'; // 'theory' | 'listen' | 'speak' | 'read' | 'write'
      let authMode = 'login'; // 'login' | 'register'
      let authMethod = 'gmail'; // 'gmail' | 'phone'

      // =====================================================
      // PER-ACCOUNT SCHEDULE ISOLATION & RESTORATION ENGINE
      // Every logged-in Gmail / Phone account maintains its own independent schedule, course, daily progress, SRS, and stats!
      // =====================================================
      const ACCOUNT_SCOPED_KEYS = [
        'exp', 'gems', 'hearts', 'streak', 'dailyGoalMinutes', 'todayMinutes',
        'customTitle', 'lastLessonId', 'currentCourseId', 'targetCourseId',
        'completedLessons', 'completedDailyLessons', 'passedCourses', 'classNotes',
        'dailyQuests', 'srsWords', 'reviewLogs', 'studyHistory', 'weeklyMinutes',
        'inventory', 'lastCheckInDate', 'lastActiveDateISO', 'ledger', 'studyDays', 'lessonAttempts', 'syncDevices', 'avatarPresetId', 'avatarDataUrl', 'selectedFrameId', 'friendMemory', 'learnerErrors', 'aiCoachNotes', 'mistakeNotebookItems', 'lightTheme', 'themeMode', 'hanziScale', 'speechRate', 'bgColorHex', 'bgPresetId', 'bgEffect', 'aiConversations', 'lastDailyStudyDateISO', 'missedDayReviewRequired', 'missedDayReviewCourseId', 'missedDayReviewDayNum'
      ];

      function getOrCreateDeviceId() {
        try {
          let did = localStorage.getItem('huayu_device_id');
          if (!did) {
            did = 'dev_' + Math.random().toString(36).slice(2, 10);
            localStorage.setItem('huayu_device_id', did);
          }
          return did;
        } catch (e) {
          return 'dev_local_canvas';
        }
      }

      // Append-Only Ledger Engine (Mirrors PostgreSQL `ledger` table & `user_balances` view with idempotency_key)
      function appendLedgerEntry(kind, amount, reason, idempotencyKey, refId) {
        if (!amount || amount === 0) return false;
        if (!Array.isArray(appState.ledger)) {
          // Seed initial ledger entries matching current exp/gems so user_balances view is consistent
          appState.ledger = [];
          if ((appState.exp || 0) > 0) {
            appState.ledger.push({
              id: 'led_init_xp',
              user_id: (appState.currentUser && appState.currentUser.identifier) || 'guest',
              kind: 'xp',
              amount: appState.exp,
              reason: 'initial_seed',
              idempotency_key: 'init_xp_seed',
              created_at: new Date().toISOString()
            });
          }
          if ((appState.gems || 0) > 0) {
            appState.ledger.push({
              id: 'led_init_gem',
              user_id: (appState.currentUser && appState.currentUser.identifier) || 'guest',
              kind: 'gem',
              amount: appState.gems,
              reason: 'initial_seed',
              idempotency_key: 'init_gem_seed',
              created_at: new Date().toISOString()
            });
          }
        }
        const uid = (appState.currentUser && appState.currentUser.identifier) || 'guest';
        if (idempotencyKey && appState.ledger.some(e => e.user_id === uid && e.idempotency_key === idempotencyKey)) {
          return false; // Duplicate idempotency_key ignored!
        }
        // Safe Gem Spend check (mirrors SELECT gems FROM user_balances WHERE user_id = $1)
        if (kind === 'gem' && amount < 0) {
          const currentBalance = computeUserBalancesFromLedger().gems;
          if (currentBalance + amount < 0) return false;
        }
        const entry = {
          id: 'led_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
          user_id: uid,
          kind: kind, // 'xp' | 'gem'
          amount: Math.round(amount),
          reason: String(reason || 'activity'),
          ref_id: refId || null,
          idempotency_key: idempotencyKey || ('idem_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7)),
          created_at: new Date().toISOString()
        };
        appState.ledger.unshift(entry);
        enqueueSyncOutboxEvent('ledger_insert', entry);
        return true;
      }

      function computeUserBalancesFromLedger() {
        if (!Array.isArray(appState.ledger) || appState.ledger.length === 0) {
          return { xp: appState.exp || 0, gems: appState.gems || 0 };
        }
        let xp = 0;
        let gems = 0;
        appState.ledger.forEach(row => {
          if (row.kind === 'xp') xp += Number(row.amount) || 0;
          if (row.kind === 'gem') gems += Number(row.amount) || 0;
        });
        return { xp: Math.max(0, xp), gems: Math.max(0, gems) };
      }

      // Record daily study minutes into `study_days` (user_id, day, minutes, freeze_used)
      function recordStudyDayMinutes(addedMinutes) {
        if (!appState.studyDays || typeof appState.studyDays !== 'object') {
          appState.studyDays = {};
        }
        const todayIso = getLocalDateISO();
        const existing = appState.studyDays[todayIso] || { day: todayIso, minutes: appState.todayMinutes || 10, freeze_used: false };
        existing.minutes = Math.min(240, existing.minutes + addedMinutes);
        appState.studyDays[todayIso] = existing;
      }

      function getAccountKey(identifier) {
        return String(identifier || '').trim().toLowerCase();
      }

      function saveCurrentAccountSnapshot() {
        if (!appState.currentUser || !appState.currentUser.identifier) return;
        if (!appState.accountSchedules || typeof appState.accountSchedules !== 'object') {
          appState.accountSchedules = {};
        }
        const key = getAccountKey(appState.currentUser.identifier);
        if (!key) return;
        const snap = { updatedAtMs: Date.now() };
        ACCOUNT_SCOPED_KEYS.forEach(k => {
          if (appState[k] !== undefined) {
            snap[k] = JSON.parse(JSON.stringify(appState[k]));
          }
        });
        appState.accountSchedules[key] = snap;
      }

      function loadAccountScheduleSnapshot(identifier, isNewAccount) {
        if (!appState.accountSchedules || typeof appState.accountSchedules !== 'object') {
          appState.accountSchedules = {};
        }
        const key = getAccountKey(identifier);
        const existingSnap = !isNewAccount && appState.accountSchedules[key];

        if (existingSnap) {
          ACCOUNT_SCOPED_KEYS.forEach(k => {
            if (existingSnap[k] !== undefined) {
              appState[k] = JSON.parse(JSON.stringify(existingSnap[k]));
            }
          });
        } else {
          // Initialize fresh personal learning schedule for a newly registered account
          const fresh = JSON.parse(JSON.stringify(defaultState));
          ACCOUNT_SCOPED_KEYS.forEach(k => {
            appState[k] = fresh[k];
          });
          appState.currentCourseId = 1;
          appState.targetCourseId = 6;
          appState.completedDailyLessons = {};
          appState.completedLessons = {};
          appState.passedCourses = {};
          appState.classNotes = {};
          appState.lastCheckInDate = '';
          appState.studyHistory = [
            { time: 'Vừa xong', action: 'Khởi tạo lịch trình học cá nhân cho tài khoản ' + escapeHtml(identifier), exp: '+40 EXP' }
          ];
          saveCurrentAccountSnapshot();
        }
        activeCourseId = appState.currentCourseId || 1;
        activeMonthIdx = 0;
      }

      function renderAccountScheduleHub() {
        ensureCourseStateFields();
        const box = document.getElementById('accountActiveScheduleBox');
        const badgeEl = document.getElementById('profileAccountStatusBadge');
        const badgesGrid = document.getElementById('accountBadgesGrid');
        const checkinBtn = document.getElementById('btnAccountDailyCheckin');
        if (!box) return;

        const user = appState.currentUser;
        const cid = appState.currentCourseId || 1;
        const targetCid = appState.targetCourseId || 6;
        const cfg = COURSE_DAYS_CONFIG[cid] || COURSE_DAYS_CONFIG[1];
        const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};
        const doneDaysCount = Object.keys(doneMap).length;
        const actualBankTotal = getParsedHskBank(cid).length;
        const masteredWords = doneDaysCount >= cfg.totalDays ? actualBankTotal : Math.min(actualBankTotal, doneDaysCount * 10);
        const pctCourse = Math.min(100, Math.round((doneDaysCount / cfg.totalDays) * 100));

        let nextDayNum = 1;
        for (let d = 1; d <= cfg.totalDays; d++) {
          if (!doneMap[d]) { nextDayNum = d; break; }
        }

        if (badgeEl) {
          badgeEl.textContent = user ? ('✅ Đã đồng bộ: ' + user.identifier) : '⚠️ Chưa đăng nhập';
          badgeEl.className = 'px-2.5 py-1 rounded-full text-xs font-bold border ' +
            (user ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30');
        }

        box.innerHTML = `
          <div class="flex items-start justify-between gap-2">
            <div>
              <div class="text-xs text-slate-400">Học viên đang đăng nhập:</div>
              <div class="text-sm sm:text-base font-extrabold text-white mt-0.5">
                ${user ? `👤 ${escapeHtml(user.fullName)} <span class="text-xs font-semibold text-emerald-400">(${escapeHtml(user.identifier)})</span>` : '👤 Khách (Hãy đăng nhập để lưu lịch trình riêng theo Gmail/SĐT)'}
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-extrabold shrink-0">
              Khóa HSK ${cid} ➔ HSK ${targetCid}
            </span>
          </div>

          <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-slate-300 font-semibold">📅 Lịch trình đang học dở:</span>
              <span class="text-emerald-400 font-extrabold">HSK ${cid} • Ngày ${nextDayNum}/${cfg.totalDays}</span>
            </div>
            <div class="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div class="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500" style="width: ${Math.max(6, pctCourse)}%"></div>
            </div>
            <div class="flex items-center justify-between text-xs text-slate-300">
              <span>Đã hoàn thành: <b class="text-white">${doneDaysCount}/${cfg.totalDays} ngày</b> (${pctCourse}%)</span>
              <span>Từ hiện có đã thuộc: <b class="text-amber-300">${masteredWords}/${actualBankTotal} từ</b></span>
            </div>
          </div>

          <div class="grid grid-cols-3 gap-2 pt-1 text-center text-xs">
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div class="text-slate-400">Sổ cái <code>ledger</code></div>
              <div class="font-extrabold text-emerald-400 mt-0.5">${(appState.ledger || []).length} giao dịch</div>
            </div>
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div class="text-slate-400">Nhật ký <code>review_logs</code></div>
              <div class="font-extrabold text-amber-300 mt-0.5">${(appState.reviewLogs || []).length} lượt ôn</div>
            </div>
            <div class="p-2 rounded-xl bg-slate-900 border border-slate-800">
              <div class="text-slate-400">Thiết bị <code>sync_devices</code></div>
              <div class="font-extrabold text-teal-300 mt-0.5 truncate">${getOrCreateDeviceId()}</div>
            </div>
          </div>

          <button id="btnResumeAccountScheduleNow" data-cid="${cid}" data-day="${nextDayNum}" class="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition flex items-center justify-center gap-2">
            <span>▶️ Học Tiếp Ngay Ngày ${nextDayNum} (Khóa HSK ${cid}) Của Bạn</span>
          </button>
        `;

        // Check-in button status
        const todayStr = getLocalDateISO();
        if (checkinBtn) {
          const checkedIn = appState.lastCheckInDate === todayStr;
          checkinBtn.textContent = checkedIn ? '✅ Đã Điểm Danh Hôm Nay' : '🎁 Điểm Danh Hôm Nay (+30 EXP • +20 💎)';
          checkinBtn.className = 'px-3 py-1.5 rounded-xl font-extrabold text-xs shadow transition ' +
            (checkedIn ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950');
        }

        // Render 4 Dynamic Achievement Badges
        if (badgesGrid) {
          const badges = [
            { icon: '🌱', name: 'Khởi Hành Vững Chắc', desc: 'Pass bài học Ngày 1', unlocked: doneDaysCount >= 1 || Object.keys(appState.completedLessons || {}).length >= 1 },
            { icon: '🔥', name: 'Chiến Binh Kiên Trì', desc: 'Chuỗi Streak >= 3 ngày', unlocked: (appState.streak || 1) >= 3 },
            { icon: '📚', name: 'Tinh Thông Từ Vựng', desc: 'Thuộc >= 20 từ chuẩn', unlocked: masteredWords >= 20 || (appState.srsWords || []).length >= 10 },
            { icon: '👑', name: 'Học Giả Thăng Cấp', desc: 'Đạt >= 150 EXP Tu Luyện', unlocked: (appState.exp || 0) >= 150 || Object.keys(appState.passedCourses || {}).length >= 1 }
          ];
          badgesGrid.innerHTML = badges.map(b => `
            <div class="p-2.5 rounded-xl border flex items-center gap-2.5 ${b.unlocked ? 'bg-emerald-950/40 border-emerald-500/50 text-white' : 'bg-slate-950/60 border-slate-800 text-slate-500 opacity-65'}">
              <span class="text-xl">${b.icon}</span>
              <div class="min-w-0">
                <div class="text-xs font-extrabold truncate ${b.unlocked ? 'text-amber-300' : 'text-slate-400'}">${b.name}</div>
                <div class="text-xs truncate">${b.unlocked ? '✅ Đã đạt' : b.desc}</div>
              </div>
            </div>
          `).join('');
        }
      }

      function ensureCourseStateFields() {
        if (!appState.currentCourseId) appState.currentCourseId = 1;
        if (!appState.targetCourseId) appState.targetCourseId = 6;
        if (!appState.passedCourses) appState.passedCourses = {};
        if (!appState.completedDailyLessons) appState.completedDailyLessons = {};
        if (!appState.classNotes) appState.classNotes = {};
        if (!appState.accounts) appState.accounts = [];
        if (!appState.accountSchedules) appState.accountSchedules = {};
        if (appState.currentUser === undefined) appState.currentUser = null;
        if (!appState.avatarPresetId) appState.avatarPresetId = 'dragon_gold';
        if (!appState.selectedFrameId) appState.selectedFrameId = 'frame_hsk0';
        if (appState.lastDailyStudyDateISO === undefined) appState.lastDailyStudyDateISO = '';
        if (appState.missedDayReviewRequired === undefined) appState.missedDayReviewRequired = false;
        if (!appState.missedDayReviewCourseId) appState.missedDayReviewCourseId = appState.currentCourseId || 1;
        if (!appState.missedDayReviewDayNum) appState.missedDayReviewDayNum = 1;

        // Automatically check if user skipped studying on a previous day (gap >= 2 days since lastDailyStudyDateISO)
        const todayISO = getLocalDateISO();
        if (appState.lastDailyStudyDateISO && daysBetweenISODates(appState.lastDailyStudyDateISO, todayISO) >= 2) {
          const cid = appState.currentCourseId || 1;
          const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};
          const doneDays = Object.keys(doneMap).filter(k => doneMap[k]).map(Number).sort((a, b) => a - b);
          if (doneDays.length > 0) {
            appState.missedDayReviewRequired = true;
            appState.missedDayReviewCourseId = cid;
            appState.missedDayReviewDayNum = doneDays[doneDays.length - 1];
          }
        }
      }

      function renderDailyAttendanceNotificationBanner() {
        const bannerEl = document.getElementById('dailyAttendanceAlertBanner');
        if (!bannerEl) return;
        ensureCourseStateFields();

        const todayISO = getLocalDateISO();
        const cid = activeCourseId || appState.currentCourseId || 1;
        const cfg = COURSE_DAYS_CONFIG[cid] || COURSE_DAYS_CONFIG[1];
        const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};
        const doneDays = Object.keys(doneMap).filter(k => doneMap[k]).map(Number).sort((a, b) => a - b);
        const maxDoneDay = doneDays.length > 0 ? doneDays[doneDays.length - 1] : 0;
        let nextDayNum = 1;
        for (let d = 1; d <= cfg.totalDays; d++) {
          if (!doneMap[d]) { nextDayNum = d; break; }
        }

        if (appState.missedDayReviewRequired) {
          const revCid = appState.missedDayReviewCourseId || cid;
          const revDay = appState.missedDayReviewDayNum || Math.max(1, maxDoneDay);
          const lockedNextDay = Math.min(cfg.totalDays, revDay + 1);
          bannerEl.className = 'rounded-3xl p-4 sm:p-5 border-2 border-rose-500 bg-gradient-to-r from-rose-950/90 via-slate-900 to-amber-950/80 shadow-xl transition-all';
          bannerEl.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1.5">
                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/25 border border-rose-400 text-rose-200 text-xs font-extrabold">
                  <span>🚨 CẢNH BÁO NGHỈ HỌC QUÁ NGÀY • ĐÃ KHÓA TẠM THỜI NGÀY ${lockedNextDay}</span>
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-white">
                  ⚠️ Bạn đã không vào học ngày hôm trước! Bắt buộc ôn lại <span class="text-amber-300">Ngày ${revDay} (Khóa HSK ${revCid})</span> trước khi học tiếp!
                </h3>
                <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  Theo quy định chống quên kiến thức: Khi bỏ lỡ 1 ngày học, hệ thống sẽ <b>khóa bài mới (Ngày ${lockedNextDay})</b> và yêu cầu bạn phải <b>ôn lại từ vựng + vượt qua đủ 10/10 câu kiểm tra của Ngày ${revDay}</b> thì mới mở khóa cho phép học tiếp.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button id="btnActionMandatoryReviewPrevDay" type="button" data-rev-cid="${revCid}" data-rev-day="${revDay}" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition">
                  🔄 Ôn & Kiểm Tra Lại Ngày ${revDay} Ngay (10 Câu)
                </button>
              </div>
            </div>
          `;
        } else if (appState.lastDailyStudyDateISO === todayISO) {
          bannerEl.className = 'rounded-3xl p-4 sm:p-5 border-2 border-emerald-500/70 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/70 shadow-xl transition-all';
          bannerEl.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1">
                <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-xs font-extrabold">
                  <span>✅ THÔNG BÁO CHUYÊN CẦN HÔM NAY (${todayISO}): ĐÃ HOÀN THÀNH 10/10 CÂU</span>
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-white">
                  🎉 Tuyệt vời! Hôm nay bạn đã hoàn thành bài học theo ngày và vượt qua bài kiểm tra 10 câu!
                </h3>
                <p class="text-xs text-slate-300 leading-relaxed">
                  Hãy nhớ vào học đều đặn vào ngày mai nhé! Nếu ngày mai bạn không vào học, hệ thống sẽ bắt buộc bạn ôn & kiểm tra lại bài của ngày trước đó rồi mới cho học tiếp.
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button id="btnActionStudyTodayLesson" type="button" data-study-cid="${cid}" data-study-day="${nextDayNum}" class="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition">
                  ▶️ Học Tiếp Ngày ${nextDayNum} (10 Câu)
                </button>
                <button id="btnSimulateMissedDayGate" type="button" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/25 text-amber-300 hover:text-rose-200 border border-amber-500/40 text-xs font-bold transition" title="Bấm để kiểm tra ngay tính năng bắt buộc ôn lại ngày trước khi người dùng bỏ học 1 ngày">
                  🧪 Giả lập nghỉ 1 ngày (Test bắt ôn lại ngày trước)
                </button>
              </div>
            </div>
          `;
        } else {
          const prevCompletedOrFirst = Math.max(1, maxDoneDay || 1);
          bannerEl.className = 'rounded-3xl p-4 sm:p-5 border-2 border-amber-400/80 bg-gradient-to-r from-amber-950/75 via-slate-900 to-emerald-950/60 shadow-xl transition-all';
          bannerEl.innerHTML = `
            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div class="space-y-1.5">
                <div class="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-extrabold">
                  <span>🔔 THÔNG BÁO NHẮC HỌC HÔM NAY (${todayISO}) • CHƯA HOÀN THÀNH BÀI NGÀY ${nextDayNum}</span>
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-white">
                  📢 Hôm nay bạn ơi! Hãy vào học <span class="text-emerald-400">Ngày ${nextDayNum} (Khóa HSK ${cid})</span> và hoàn thành bài kiểm tra 10 câu nhé!
                </h3>
                <p class="text-xs text-slate-200 leading-relaxed">
                  ⚠️ <b>Quy tắc kỷ luật chuyên cần:</b> Nếu hôm nay bạn không vào học và hoàn thành bài kiểm tra 10 câu, sang ngày tiếp theo hệ thống sẽ <b>tự động khóa bài mới và bắt buộc bạn phải ôn lại Ngày ${prevCompletedOrFirst} trước đó</b> rồi mới cho học tiếp!
                </p>
              </div>
              <div class="flex flex-wrap items-center gap-2 shrink-0">
                <button id="btnActionStudyTodayLesson" type="button" data-study-cid="${cid}" data-study-day="${nextDayNum}" class="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg transition">
                  🚀 Vào Học Ngày ${nextDayNum} Hôm Nay (Kiểm Tra 10 Câu)
                </button>
                <button id="btnSimulateMissedDayGate" type="button" class="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-500/25 text-amber-300 hover:text-rose-200 border border-amber-500/40 text-xs font-bold transition" title="Bấm để kiểm tra ngay tính năng bắt buộc ôn lại ngày trước khi người dùng bỏ học 1 ngày">
                  🧪 Giả lập nghỉ 1 ngày (Test bắt ôn lại ngày trước)
                </button>
              </div>
            </div>
          `;
        }
      }
      window.renderDailyAttendanceNotificationBanner = renderDailyAttendanceNotificationBanner;

      function renderCourseRoadmapUI() {
        ensureCourseStateFields();
        activeCourseId = appState.currentCourseId || 1;
        const currentCourse = HSK_COURSES_DATA.find(c => c.courseId === activeCourseId) || HSK_COURSES_DATA[0];

        const statusEl = document.getElementById('courseOverallStatus');
        if (statusEl) {
          const passedCount = Object.keys(appState.passedCourses || {}).length;
          statusEl.textContent = 'Đang học ' + currentCourse.code + ' • Đã tốt nghiệp ' + passedCount + '/6 khóa';
        }

        // Render 6 course cards
        const row = document.getElementById('hskCourseCardsRow');
        if (row) {
          row.innerHTML = HSK_COURSES_DATA.map(c => {
            const isPassed = Boolean(appState.passedCourses && appState.passedCourses[c.courseId]);
            const isSelected = c.courseId === activeCourseId;
            const prevPassed = c.courseId === 1 || Boolean(appState.passedCourses && appState.passedCourses[c.courseId - 1]);
            const isWithinGoal = c.courseId <= (appState.targetCourseId || 6);

            return `
              <button data-select-course="${c.courseId}" class="course-card-btn text-left p-3 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                isSelected
                  ? 'bg-emerald-600/20 border-emerald-400 shadow-lg shadow-emerald-500/10'
                  : (isPassed ? 'bg-slate-900/90 border-emerald-500/40' : 'bg-slate-950/80 border-slate-800 hover:border-slate-700')
              } ${!isWithinGoal ? 'opacity-50' : ''}">
                <div class="flex items-center justify-between gap-1">
                  <span class="text-xs font-black ${isSelected ? 'text-emerald-300' : 'text-white'}">Khóa ${c.courseId}: ${c.code}</span>
                  <span class="text-xs">${isPassed ? '🎓 Đạt' : (prevPassed ? '🔓 Đang mở' : '🔒 Khóa')}</span>
                </div>
                <div class="text-xs text-amber-300 font-semibold">⏱️ ${c.duration}</div>
                <div class="text-xs text-slate-400 line-clamp-2">${c.title.split(':')[1] || c.title}</div>
              </button>
            `;
          }).join('');
        }

        // Render active course header & month tabs
        const badgeEl = document.getElementById('activeCourseBadge');
        const passBadgeEl = document.getElementById('activeCoursePassBadge');
        const titleEl = document.getElementById('activeCourseTitle');
        const descEl = document.getElementById('activeCourseDesc');
        if (badgeEl) badgeEl.textContent = 'Khóa ' + currentCourse.courseId + ' (' + currentCourse.code + ') • ' + currentCourse.duration;
        if (passBadgeEl) {
          const passed = appState.passedCourses && appState.passedCourses[currentCourse.courseId];
          passBadgeEl.textContent = passed ? '🎓 Đã Đậu Bài Thi Cuối Khóa (' + passed.score + '%)' : '⏳ Cần vượt qua Bài Thi Cuối Khóa để lên cấp';
          passBadgeEl.className = 'px-2.5 py-0.5 rounded-full text-xs font-bold ' + (passed ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300');
        }
        if (titleEl) titleEl.textContent = currentCourse.title;
        if (descEl) descEl.textContent = currentCourse.desc;

        const mTabs = document.getElementById('courseMonthTabs');
        if (mTabs) {
          if (activeMonthIdx >= currentCourse.months.length) activeMonthIdx = 0;
          mTabs.innerHTML = currentCourse.months.map((mObj, idx) => `
            <button data-month-idx="${idx}" class="month-tab-btn px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
              idx === activeMonthIdx
                ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-emerald-500/40'
            }">
              🗓️ ${mObj.name.split(':')[0]}
            </button>
          `).join('');
        }

        const sylBox = document.getElementById('courseMonthSyllabusBox');
        if (sylBox) {
          const mObj = currentCourse.months[activeMonthIdx] || currentCourse.months[0];
          sylBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div class="text-xs font-bold text-amber-400 uppercase">${mObj.name}</div>
              <p class="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">🎯 <b>Trọng tâm đào tạo tháng này:</b> ${mObj.focus}</p>
              <div class="pt-2 flex flex-wrap gap-2">
                <button data-open-course-lesson="${currentCourse.courseId}" class="open-course-lesson-btn px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition">
                  📖 Vào Phòng Học 4 Kỹ Năng (Nghe • Nói • Đọc • Viết)
                </button>
              </div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div class="text-xs font-bold text-emerald-400 uppercase">📌 Phân bổ 4 Kỹ Năng như Trung Tâm Đào Tạo:</div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                ${mObj.skills.map(sk => `<div class="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200">${sk}</div>`).join('')}
              </div>
            </div>
          `;
        }

        // Render Learner Value / Outcomes Box inside #courseMonthSyllabusBox and Day-by-Day Mandatory Grid
        const cfg = COURSE_DAYS_CONFIG[currentCourse.courseId] || COURSE_DAYS_CONFIG[1];
        const outcome = COURSE_OUTCOMES_VALUE[currentCourse.courseId] || COURSE_OUTCOMES_VALUE[1];
        const courseDoneMap = (appState.completedDailyLessons && appState.completedDailyLessons[currentCourse.courseId]) || {};
        const doneCountTotal = Object.keys(courseDoneMap).length;
        const actualBankWordsCount = getParsedHskBank(currentCourse.courseId).length;
        const learnedWordsCount = doneCountTotal >= cfg.totalDays ? actualBankWordsCount : Math.min(actualBankWordsCount, doneCountTotal * 10);

        if (sylBox) {
          const mObj = currentCourse.months[activeMonthIdx] || currentCourse.months[0];
          sylBox.innerHTML = `
            <div class="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 space-y-2.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">🎁 ${outcome.badge}</span>
                <span class="text-xs font-bold text-amber-300">Giá Trị Học Viên Nhận Được</span>
              </div>
              <div class="text-xs text-slate-200 leading-relaxed">🗣️ <b>Năng lực giao tiếp đạt được:</b> ${outcome.canDo}</div>
              <div class="text-xs text-slate-300 leading-relaxed">💼 <b>Giá trị bằng cấp & sự nghiệp:</b> ${outcome.careerValue}</div>
              <div class="text-xs text-amber-300 font-semibold bg-slate-950/80 p-2.5 rounded-xl border border-amber-500/30">${outcome.unlockReward}</div>
            </div>
            <div class="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between gap-2.5">
              <div class="space-y-1.5">
                <div class="text-xs font-bold text-amber-400 uppercase">${mObj.name}</div>
                <p class="text-xs text-slate-200 leading-relaxed">🎯 <b>Trọng tâm:</b> ${mObj.focus}</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs pt-1">
                  ${mObj.skills.map(sk => `<div class="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">${sk}</div>`).join('')}
                </div>
              </div>
              <div class="pt-1 flex flex-wrap gap-2">
                <button data-open-course-lesson="${currentCourse.courseId}" class="open-course-lesson-btn px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition">
                  📖 Vào Học Ngay Ngày Tiếp Theo Của Khóa
                </button>
              </div>
            </div>
          `;
        }

        const headingEl = document.getElementById('dailyGridHeading');
        if (headingEl) {
          headingEl.textContent = `📅 Lộ Trình Từng Ngày ${currentCourse.code} — Hiện Có ${actualBankWordsCount} Từ Tinh Tuyển Offline (Mục tiêu chuẩn ${currentCourse.code}: ${cfg.targetWords} từ)`;
        }

        const subEl = document.getElementById('dailyCourseProgressSub');
        if (subEl) {
          subEl.innerHTML = `🎯 <b>Tiến độ thực tế ${currentCourse.code}:</b> Đã làm chủ <b class="text-emerald-400">${learnedWordsCount} / ${actualBankWordsCount} từ hiện có</b> (${doneCountTotal}/${cfg.totalDays} ngày • Khung chuẩn HSK: ${cfg.targetWords} từ). <i>Quy tắc bắt buộc: Học xong từ vựng trong ngày và PASS bài kiểm tra 100% mới mở khóa sang Ngày tiếp theo!</i>`;
        }

        const badgeCounter = document.getElementById('courseMandatoryCounterBadge');
        if (badgeCounter) {
          badgeCounter.textContent = `Từ hiện có đã thuộc: ${learnedWordsCount} / ${actualBankWordsCount} từ (${doneCountTotal}/${cfg.totalDays} ngày)`;
          badgeCounter.className = 'px-3 py-1 rounded-xl text-xs font-extrabold border ' +
            (doneCountTotal >= cfg.totalDays ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-amber-500/15 border-amber-500/30 text-amber-300');
        }

        const examBtn = document.getElementById('btnStartCourseFinalExam');
        if (examBtn) {
          if (doneCountTotal >= cfg.totalDays) {
            examBtn.innerHTML = `🎓 Đã Hoàn Thành ${learnedWordsCount}/${actualBankWordsCount} Từ Hiện Có (${doneCountTotal}/${cfg.totalDays} ngày) — Thi Cuối Khóa!`;
          } else {
            examBtn.innerHTML = `🔒 Thi Cuối Khóa (Đã học ${learnedWordsCount}/${actualBankWordsCount} từ hiện có • ${doneCountTotal}/${cfg.totalDays} ngày)`;
          }
        }

        renderDailyAttendanceNotificationBanner();

        const dailyGrid = document.getElementById('dailyLessonsGrid');
        if (dailyGrid) {
          let htmlDays = '';
          const isCourseReviewLocked = Boolean(appState.missedDayReviewRequired) && Number(appState.missedDayReviewCourseId || currentCourse.courseId) === currentCourse.courseId;
          const mustReviewDayNum = Number(appState.missedDayReviewDayNum || 1);

          for (let d = 1; d <= cfg.totalDays; d++) {
            const isDone = Boolean(courseDoneMap[d]);
            const isMandatoryReviewTarget = isCourseReviewLocked && d === mustReviewDayNum;
            const isLockedByMissedDay = isCourseReviewLocked && d > mustReviewDayNum;
            const isUnlocked = !isLockedByMissedDay && (d === 1 || Boolean(courseDoneMap[d - 1]) || isDone || isMandatoryReviewTarget);
            const newWordsRange = `${(d - 1) * 10 + 1}–${d * 10}`;
            const reviewNote = isMandatoryReviewTarget
              ? '🚨 Bắt buộc ôn lại (10 câu)'
              : (isLockedByMissedDay
                  ? `🔒 Ôn Ngày ${mustReviewDayNum} trước`
                  : (d > 1 ? `🔗 Lồng ghép Ngày ${d - 1} • 10 câu` : '🌟 10 từ mới • 10 câu test'));

            let cardCls = 'bg-slate-950/40 border-slate-800/80 text-slate-500 opacity-60';
            let statusLabel = '🔒 Khóa';
            let dayTitleColor = 'text-slate-500';

            if (isMandatoryReviewTarget) {
              cardCls = 'bg-rose-950/70 hover:bg-rose-900/70 border-2 border-amber-400 text-white shadow-lg shadow-rose-500/20 node-glow';
              statusLabel = '🔄 Bắt buộc ôn lại';
              dayTitleColor = 'text-amber-300';
            } else if (isDone) {
              cardCls = 'bg-emerald-600/20 border-emerald-500/60 text-emerald-200';
              statusLabel = '✅ Đã Pass (10/10)';
              dayTitleColor = 'text-emerald-400';
            } else if (isUnlocked) {
              cardCls = 'bg-slate-950 hover:bg-slate-800 border-amber-400/70 text-white shadow-md shadow-amber-500/10';
              statusLabel = '🔓 Học ngay';
              dayTitleColor = 'text-amber-300';
            }

            htmlDays += `
              <button data-daily-course="${currentCourse.courseId}" data-daily-num="${d}" class="daily-lesson-btn p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-1 ${cardCls}">
                <div class="flex items-center justify-between w-full">
                  <span class="text-xs font-extrabold ${dayTitleColor}">Ngày ${d}</span>
                  <span class="text-xs font-bold">${statusLabel}</span>
                </div>
                <div class="text-xs font-bold text-slate-200">10 từ mới (${newWordsRange})</div>
                <div class="text-xs ${isMandatoryReviewTarget ? 'text-amber-300 font-extrabold' : (d > 1 ? 'text-teal-300 font-medium' : 'text-slate-400')}">${reviewNote}</div>
              </button>
            `;
          }
          dailyGrid.innerHTML = htmlDays;
          dailyGrid.className = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5';
        }
      }

            // Rich 4-Skill Modal Step Renderer (replaces renderModalStep while keeping all previous handlers working!)
      let dailyQuizSelections = {};

      function renderModalStep() {
        if (!currentModalLesson) return;
        const body = document.getElementById('modalLessonBody');
        const stepCounter = document.getElementById('modalStepCounter');
        const prevBtn = document.getElementById('btnModalPrevStep');
        const nextBtn = document.getElementById('btnModalNextStep');

        prevBtn.disabled = currentModalStep === 0;
        prevBtn.style.opacity = currentModalStep === 0 ? '0.4' : '1';

        const newWords = currentModalLesson.newWords || currentModalLesson.vocab || [];
        const reviewWords = currentModalLesson.reviewWords || [];
        const v0 = newWords[0] || { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào', example: '你好！很高兴认识你。' };
        const savedNote = (appState.classNotes && appState.classNotes[currentModalLesson.id]) || '';

        if (currentModalStep === 0) {
          stepCounter.textContent = `Bước 1/2: Học Từ Vựng Trong Ngày (${newWords.length} từ mới${reviewWords.length ? ' + ' + reviewWords.length + ' từ lồng ghép' : ''})`;
          nextBtn.textContent = '📝 Làm Bài Kiểm Tra Qua Ngày ➡️';

          body.innerHTML = `
            <div class="space-y-5">
              <!-- Clear Learner Value & Today's Outcome Banner -->
              <div class="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="space-y-1">
                  <div class="text-xs font-extrabold text-emerald-400 uppercase">🎁 Thành Quả Bạn Nhận Được Sau Bài Học Hôm Nay</div>
                  <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    Làm chủ ngay <b>${newWords.length} từ vựng mới</b>${reviewWords.length > 0 ? ` + khắc sâu <b>${reviewWords.length} từ lồng ghép của Ngày trước</b> (tổng <b>${newWords.length + reviewWords.length} từ</b>)` : ''}, nói được <b>${newWords.length} mẫu câu giao tiếp thực tế</b>, nhận <b>+${currentModalLesson.rewardExp} EXP & +${currentModalLesson.rewardGems} 💎</b> khi vượt qua bài kiểm tra cuối ngày!
                  </p>
                </div>
                <button id="btnQuickJumpDailyTest" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 transition">
                  📝 Kiểm Tra Qua Ngày Ngay
                </button>
              </div>

              <!-- PART 1: TODAY'S 10 NEW VOCABULARY WORDS (3D FLIP CARDS WITH EASY SPOKEN CHINESE SENTENCE ON BACK) -->
              <div class="space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 class="font-extrabold text-sm sm:text-base text-white">🌟 Phần 1: Từ Vựng Mới Của Ngày Hôm Nay (${newWords.length} thẻ lật 2 mặt)</h4>
                    <p class="text-xs text-emerald-400">👆 Bấm trực tiếp vào bất kỳ thẻ từ vựng nào để <b>LẬT THẺ</b> xem câu nói tiếng Trung dễ nhớ & nghe phát âm cả câu!</p>
                  </div>
                  <button id="btnFlipAllLessonCards" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-amber-300 border border-amber-500/30 text-xs font-bold transition">
                    🔄 Lật Tất Cả Thẻ Cùng Lúc
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  ${newWords.map((v, i) => {
                    const sHz = v.sentenceHz || (v.rawExample || v.example || '').split('（')[0].split('🔗')[0];
                    const sPy = v.sentencePy || v.pinyin;
                    const sVi = v.sentenceVi || v.meaning;
                    return `
                    <div class="vocab-flip-card cursor-pointer select-none group">
                      <div class="vocab-flip-inner">
                        <!-- FRONT FACE: Word, Pinyin, Han-Viet, Meaning -->
                        <div class="vocab-face p-4 rounded-2xl bg-slate-950 border-2 border-slate-800 group-hover:border-emerald-500/50 transition shadow-lg">
                          <div class="flex items-start justify-between gap-2">
                            <div class="flex items-center gap-3">
                              <span class="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-black flex items-center justify-center">${v.id || (i + 1)}</span>
                              <div>
                                <div class="text-2xl sm:text-3xl font-black hanzi-font text-white tracking-wide">${v.hanzi}</div>
                                <div class="text-sm font-bold text-emerald-400">${v.pinyin} <span class="text-xs text-amber-300/90 font-normal">• Hán Việt: ${v.hanviet || ''}</span></div>
                              </div>
                            </div>
                            <div class="flex gap-1.5">
                              <button data-speak="${v.hanzi}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold">🔊 Nghe</button>
                              <button data-save-vocab="${i}" class="save-modal-vocab-btn px-2 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold">+ SRS</button>
                            </div>
                          </div>
                          <div class="text-xs sm:text-sm text-white font-bold bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
                            🇻🇳 Nghĩa: <span class="text-amber-300">${v.meaning}</span>
                          </div>
                          <div class="text-xs text-emerald-400/90 font-semibold flex items-center justify-between pt-0.5">
                            <span>🔄 Bấm vào thẻ để lật xem câu nói mẫu dễ nhớ</span>
                            <span class="text-amber-300">Lật thẻ ➔</span>
                          </div>
                        </div>

                        <!-- BACK FACE: Easy Spoken Chinese Sentence + Pinyin + Vietnamese + Audio -->
                        <div class="vocab-face vocab-face-back p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 border-2 border-amber-400/70 shadow-xl">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-extrabold px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300">💬 Câu giao tiếp dễ nhớ với "${v.hanzi}"</span>
                            <button data-speak="${sHz}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2.5 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs">🔊 Câu</button>
                          </div>
                          <div class="space-y-1 my-auto py-1">
                            <div class="text-base sm:text-lg font-black hanzi-font text-white leading-snug">${sHz}</div>
                            <div class="text-xs font-semibold text-emerald-300">${sPy}</div>
                            <div class="text-xs text-amber-200 font-medium">🇻🇳 ${sVi}</div>
                          </div>
                          <div class="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-1.5">
                            <span class="truncate">${v.spiralHint || 'Bấm nút 🔊 Câu để nghe & đọc theo'}</span>
                            <span class="text-emerald-300 font-bold shrink-0 ml-2">↩️ Lật lại</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  `}).join('')}
                </div>
              </div>

              <!-- PART 2: SPIRAL INTEGRATED WORDS FROM PREVIOUS DAYS (ALSO 3D FLIP CARDS!) -->
              ${reviewWords.length > 0 ? `
                <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                  <div>
                    <h4 class="font-extrabold text-sm text-amber-300">🔄 Phần 2: Từ Vựng Lồng Ghép Từ Ngày Trước (${reviewWords.length} thẻ lật ôn cuốn chiếu)</h4>
                    <p class="text-xs text-slate-300 mt-0.5">Bấm vào từng thẻ từ cũ của ngày hôm trước để lật xem câu nói ví dụ và ôn lại trước khi kiểm tra!</p>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${reviewWords.map(rv => {
                      const rsHz = rv.sentenceHz || (rv.example || '').split('（')[0];
                      const rsPy = rv.sentencePy || rv.pinyin;
                      const rsVi = rv.sentenceVi || rv.meaning;
                      return `
                      <div class="vocab-flip-card cursor-pointer select-none group">
                        <div class="vocab-flip-inner">
                          <!-- FRONT -->
                          <div class="vocab-face p-3.5 rounded-2xl bg-slate-950 border-2 border-amber-500/40 group-hover:border-amber-400 transition">
                            <div class="flex items-center justify-between">
                              <span class="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-bold">Ôn từ Ngày ${rv.fromDay}</span>
                              <button data-speak="${rv.hanzi}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold">🔊 Nghe</button>
                            </div>
                            <div>
                              <div class="text-2xl font-black hanzi-font text-white">${rv.hanzi} <span class="text-sm font-bold text-emerald-400 font-sans">(${rv.pinyin})</span></div>
                              <div class="text-xs text-amber-200 font-bold mt-1">🇻🇳 Nghĩa: ${rv.meaning}</div>
                            </div>
                            <div class="text-xs text-amber-300/90 font-semibold flex items-center justify-between">
                              <span>🔄 Bấm để lật xem câu nói mẫu</span>
                              <span>Lật thẻ ➔</span>
                            </div>
                          </div>
                          <!-- BACK -->
                          <div class="vocab-face vocab-face-back p-3.5 rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 border-2 border-emerald-400/70">
                            <div class="flex items-center justify-between">
                              <span class="text-xs font-bold text-emerald-300">💬 Câu ứng dụng với "${rv.hanzi}"</span>
                              <button data-speak="${rsHz}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-extrabold text-xs">🔊 Câu</button>
                            </div>
                            <div class="space-y-0.5 my-auto">
                              <div class="text-base font-black hanzi-font text-white">${rsHz}</div>
                              <div class="text-xs text-emerald-300 font-medium">${rsPy}</div>
                              <div class="text-xs text-amber-200">🇻🇳 ${rsVi}</div>
                            </div>
                            <div class="text-xs text-right text-emerald-300 font-bold">↩️ Bấm để lật lại</div>
                          </div>
                        </div>
                      </div>
                    `}).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Collapsible Optional 4-Skill Practice -->
              <details id="lessonOptional4SkillsDetails" open class="rounded-2xl bg-slate-950 border border-slate-800 p-3.5">
                <summary class="cursor-pointer text-xs font-bold text-slate-300 hover:text-emerald-400 select-none">
                  ⚙️ Mở rộng luyện tập thêm 4 kỹ năng (Nghe chậm • Luyện nói Mic • Viết câu & Ghi chú)
                </summary>
                <div class="mt-3 space-y-3 pt-3 border-t border-slate-800">
                  <div class="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
                    <button type="button" data-skill-tab="theory" class="lesson-skill-tab px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeLessonSkillTab === 'theory' ? 'bg-emerald-600 text-white' : 'text-slate-300'}">📘 Ghi chú</button>
                    <button type="button" data-skill-tab="listen" class="lesson-skill-tab px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeLessonSkillTab === 'listen' ? 'bg-emerald-600 text-white' : 'text-slate-300'}">🎧 Nghe</button>
                    <button type="button" data-skill-tab="speak" class="lesson-skill-tab px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeLessonSkillTab === 'speak' ? 'bg-emerald-600 text-white' : 'text-slate-300'}">🗣️ Nói</button>
                    <button type="button" data-skill-tab="write" class="lesson-skill-tab px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${activeLessonSkillTab === 'write' ? 'bg-emerald-600 text-white' : 'text-slate-300'}">✍️ Viết</button>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-teal-300">📝 Ghi chú bài học (${escapeHtml(currentModalLesson.grammarNote || 'Trọng tâm ngữ pháp trong ngày')}):</span>
                      <button id="btnSaveClassNote" type="button" class="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold">💾 Lưu Ghi Chú</button>
                    </div>
                    <textarea id="textareaClassNote" rows="2" placeholder="Ghi chú từ vựng hoặc cấu trúc ngữ pháp của bạn..." class="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white">${escapeHtml(savedNote)}</textarea>
                  </div>
                  <div class="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <div class="flex flex-wrap gap-2 items-center">
                      <button type="button" data-speak-slow="${escapeHtml(v0.hanzi)}" class="speak-slow-btn px-3 py-1.5 rounded-xl bg-slate-800 text-amber-300 text-xs font-bold">🐢 Nghe chậm 0.65x (${escapeHtml(v0.hanzi)})</button>
                      <button type="button" data-listen-check="true" class="skill-listen-opt px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">🎧 Chọn nghĩa đúng: ${escapeHtml(v0.meaning)}</button>
                      <button type="button" data-listen-check="false" class="skill-listen-opt px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold">🎧 Nghĩa nhiễu khác</button>
                      <button id="btnLessonPracticeSpeak" type="button" class="px-3 py-1.5 rounded-xl bg-rose-500 text-white text-xs font-bold">🎙️ Chấm điểm phát âm</button>
                    </div>
                    <div id="listenSkillFeedback" class="text-xs text-emerald-400"></div>
                    <div id="speakSkillFeedback" class="text-xs text-emerald-400"></div>
                    <div class="flex gap-2 pt-1">
                      <input id="inputLessonWritePractice" type="text" placeholder="Gõ lại từ ${v0.hanzi}..." class="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white hanzi-font" />
                      <button id="btnCheckLessonWrite" data-target-hz="${v0.hanzi}" data-target-py="${v0.pinyin}" class="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs">✅ Chấm Bài Viết</button>
                    </div>
                    <div id="writeSkillFeedback" class="text-xs text-emerald-400"></div>
                    <div class="flex gap-2 pt-1">
                      <input id="inputScrambleSentence" type="text" value="${(currentModalLesson.deepTemplate && currentModalLesson.deepTemplate.scrambleAnswer) || ''}" class="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white hanzi-font" />
                      <button id="btnVerifyScramble" data-ans="${(currentModalLesson.deepTemplate && currentModalLesson.deepTemplate.scrambleAnswer) || ''}" class="px-3 py-1.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs">Kiểm Tra Câu</button>
                    </div>
                    <div class="pt-1 space-y-1">
                      <span id="essayCharCountBadge" class="text-xs text-emerald-300">Độ dài: 0 ký tự</span>
                      <textarea id="textareaEssayComposition" rows="2" class="w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"></textarea>
                      <button id="btnEvaluateEssay" class="px-3 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs">📊 Chấm Điểm Đoạn Văn & Bản Dịch</button>
                      <div id="essayEvalFeedback" class="text-xs text-emerald-400"></div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          `;
        } else {
          // STEP 1: DAILY MASTERY PASS TEST (10 QUESTIONS)
          const isReviewGateLesson = Boolean(appState.missedDayReviewRequired) && currentModalLesson.isDailyLesson && currentModalLesson.dayNumber === Number(appState.missedDayReviewDayNum || 1);
          stepCounter.textContent = isReviewGateLesson
            ? `Bước 2/2: 🔄 Kiểm Tra Ôn Lại Ngày ${currentModalLesson.dayNumber} Do Nghỉ Học Hôm Trước (${currentModalLesson.questions.length} câu bắt buộc)`
            : `Bước 2/2: Kiểm Tra Qua Ngày (${currentModalLesson.questions.length} câu hỏi • Bắt buộc Đạt 100% để mở khóa Ngày tiếp theo)`;
          nextBtn.textContent = isReviewGateLesson
            ? `✅ Chấm Điểm 10 Câu Ôn Lại & Mở Khóa Ngày ${currentModalLesson.dayNumber + 1}`
            : `✅ Chấm Điểm ${currentModalLesson.questions.length} Câu & Mở Khóa Ngày Tiếp Theo`;

          body.innerHTML = `
            <div class="space-y-4">
              ${isReviewGateLesson ? `
                <div class="p-3.5 rounded-2xl bg-rose-500/15 border-2 border-rose-500/60 text-xs text-rose-200">
                  <b>🚨 Chế Độ Bắt Buộc Ôn Lại Ngày Trước (Do Hôm Trước Bạn Không Vào Học):</b> Bạn cần hoàn thành đúng cả <b>${currentModalLesson.questions.length}/${currentModalLesson.questions.length} câu hỏi</b> của <b>Ngày ${currentModalLesson.dayNumber}</b> để chứng minh vẫn nhớ chắc kiến thức cũ trước khi hệ thống mở khóa cho phép học tiếp <b>Ngày ${currentModalLesson.dayNumber + 1}</b>!
                </div>
              ` : `
                <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
                  <b>📋 Điều kiện Qua Ngày (${currentModalLesson.questions.length} câu kiểm tra):</b> Bạn cần trả lời đúng cả <b>${currentModalLesson.questions.length}/${currentModalLesson.questions.length} câu hỏi</b> (gồm 10 từ mới hôm nay + từ lồng ghép ngày trước). Nếu làm sai bất kỳ câu nào, hệ thống sẽ <b>giữ bạn ở lại ngày hôm nay để học lại từ bị sai</b> cho đến khi trả lời đúng 100% mới mở khóa Ngày tiếp theo!
                </div>
              `}

              <div class="space-y-3.5" id="modalQuizOptions">
                ${currentModalLesson.questions.map((qObj, qIdx) => {
                  const picked = dailyQuizSelections[qIdx];
                  return `
                    <div id="dailyQCard_${qIdx}" class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div class="text-xs sm:text-sm font-extrabold text-white">${qObj.q}</div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        ${qObj.options.map((opt, oi) => `
                          <button data-dq-idx="${qIdx}" data-qopt="${oi}" class="modal-quiz-opt text-left p-3 rounded-xl border text-xs font-semibold transition flex items-center justify-between ${
                            picked === oi ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                          }">
                            <span>${opt}</span>
                          </button>
                        `).join('')}
                      </div>
                      <div id="dailyQExplain_${qIdx}" class="hidden text-xs p-2.5 rounded-xl"></div>
                    </div>
                  `;
                }).join('')}
              </div>

              <div id="modalQuizFeedback" class="hidden p-4 rounded-2xl text-xs sm:text-sm font-semibold"></div>
            </div>
          `;
        }
      }

            // =====================================================
      // 8C. END-OF-COURSE EXAM WITH MANDATORY REMEDIAL STUDY FOR WRONG ITEMS & REVIEW FOR RIGHT ITEMS
      // =====================================================
      let activeExamCourse = null;
      let examSelectedAnswers = {};
      let examWrongQueue = [];

      function openCourseFinalExam(courseId) {
        const c = HSK_COURSES_DATA.find(x => x.courseId === courseId) || HSK_COURSES_DATA[0];
        activeExamCourse = c;
        examSelectedAnswers = {};
        examWrongQueue = [];

        document.getElementById('examCourseBadge').textContent = 'Sát Hạch Cuối Khóa • ' + c.code + ' (' + c.duration + ')';
        document.getElementById('examModalTitle').textContent = 'Bài Thi Tổng Hợp 4 Kỹ Năng: ' + c.title;
        document.getElementById('btnSubmitCourseExam').classList.remove('hidden');
        document.getElementById('examFooterStatus').textContent = 'Quy định: Nếu làm sai câu nào, hệ thống sẽ bắt buộc học lại phần sai và ôn lại phần đúng trước khi mở khóa cấp tiếp theo.';
        document.getElementById('courseExamModal').classList.remove('hidden');
        renderCourseExamQuestions();
      }

      function renderCourseExamQuestions() {
        const body = document.getElementById('courseExamBody');
        if (!body || !activeExamCourse) return;

        body.innerHTML = `
          <div class="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
            <b>📋 Quy chế Sát Hạch Trung Tâm (Chấm điểm 3 Kỹ năng: 🎧 Nghe • 📖 Đọc • ✍️ Ngữ pháp):</b> Bạn cần làm đúng 100% các câu hỏi kiểm tra dưới đây để tốt nghiệp <b>${activeExamCourse.code}</b>. Nếu có câu sai, hệ thống sẽ phân tách <b>Phần Sai (Bắt buộc học lại & làm lại)</b> và <b>Phần Đúng (Ôn tập củng cố)</b>.
          </div>
          <div class="space-y-4">
            ${activeExamCourse.examQuestions.map((q, qIdx) => `
              <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-emerald-400">${q.skill}</span>
                  <span class="text-xs text-slate-400">Câu ${qIdx + 1}/${activeExamCourse.examQuestions.length}</span>
                </div>
                <div class="text-sm sm:text-base font-extrabold text-white">${q.q}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  ${q.options.map((opt, oIdx) => {
                    const isPicked = examSelectedAnswers[q.id] === oIdx;
                    return `
                      <button data-exam-qid="${q.id}" data-exam-oidx="${oIdx}" class="exam-choice-btn text-left p-3 rounded-xl border text-xs font-semibold transition ${
                        isPicked ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }">
                        ${opt}
                      </button>
                    `;
                  }).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }

      function evaluateCourseFinalExam() {
        if (!activeExamCourse) return;
        const questions = activeExamCourse.examQuestions;
        const rightItems = [];
        const wrongItems = [];

        questions.forEach(q => {
          const picked = examSelectedAnswers[q.id];
          if (picked === q.answer) {
            rightItems.push(q);
          } else {
            wrongItems.push({ q, picked });
          }
        });

        const scorePct = Math.round((rightItems.length / questions.length) * 100);
        const body = document.getElementById('courseExamBody');
        document.getElementById('btnSubmitCourseExam').classList.add('hidden');

        if (wrongItems.length === 0) {
          // Passed 100%! Unlock next HSK course!
          playSfx('levelup');
          ensureCourseStateFields();
          appState.passedCourses[activeExamCourse.courseId] = { score: 100, date: new Date().toLocaleDateString('vi-VN') };
          appState.selectedFrameId = 'frame_hsk' + activeExamCourse.courseId;
          if (activeExamCourse.courseId < 6) {
            appState.currentCourseId = activeExamCourse.courseId + 1;
            activeCourseId = appState.currentCourseId;
          }
          addReward(150, 80, 'Tốt nghiệp ' + activeExamCourse.code + ' & Nhận Khung Avatar ' + activeExamCourse.code, 'exam_pass_hsk_' + activeExamCourse.courseId);
          updateAuthHeaderUI();
          renderCourseRoadmapUI();

          const userName = (appState.currentUser && appState.currentUser.fullName) || 'Học Viên Xuất Sắc';
          body.innerHTML = `
            <div class="p-6 rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-amber-950/50 border-2 border-amber-400/60 text-center space-y-4">
              <div class="text-4xl">🎓🏆</div>
              <div class="text-xs font-bold uppercase tracking-widest text-amber-300">Chứng Nhận Hoàn Thành Khóa Học Nội Bộ BlackPig (Chuẩn Ôn Thi HSK)</div>
              <h4 class="text-xl sm:text-2xl font-black text-white">Chúc Mừng ${escapeHtml(userName)} Đã Tốt Nghiệp ${activeExamCourse.code}!</h4>
              <p class="text-xs sm:text-sm text-emerald-300 font-semibold">Điểm sát hạch 4 kỹ năng: ${scorePct}% (${rightItems.length}/${questions.length} câu đúng tuyệt đối)</p>
              <div class="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-left space-y-2 text-xs">
                <div class="font-bold text-emerald-400">🔄 Ôn Lại Các Kiến Thức Đã Nắm Vững Trong Khóa:</div>
                ${rightItems.map(r => `<div class="text-slate-300">✅ <b>${r.skill}:</b> ${r.theory}</div>`).join('')}
              </div>
              <button id="btnAdvanceNextHskCourse" class="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-sm shadow-lg">
                🚀 Chuyển Lên Học Khóa Nâng Cao Tiếp Theo (${activeExamCourse.courseId < 6 ? 'HSK ' + (activeExamCourse.courseId + 1) : 'Hoàn Thành Toàn Trình'})
              </button>
            </div>
          `;
        } else {
          // Failed or has wrong answers -> MANDATORY RE-LEARN WRONG PARTS & REVIEW RIGHT PARTS!
          playSfx('wrong');
          examWrongQueue = wrongItems.map(w => w.q.id);
          body.innerHTML = `
            <div class="space-y-5">
              <div class="p-4 rounded-2xl bg-rose-950/70 border border-rose-500/50 space-y-1">
                <div class="text-sm sm:text-base font-extrabold text-rose-300">⚠️ Chưa Đạt Yêu Cầu Qua Khóa (Điểm hiện tại: ${scorePct}% — Đúng ${rightItems.length}/${questions.length} câu)</div>
                <p class="text-xs text-slate-200">
                  Theo quy định đào tạo: Bạn <b>bắt buộc phải học lại lý thuyết và làm lại đúng ${wrongItems.length} phần bị sai</b> bên dưới, đồng thời <b>ôn lại ${rightItems.length} phần đã làm đúng</b> để mở khóa lên cấp HSK tiếp theo!
                </p>
              </div>

              <!-- SECTION 1: BẮT BUỘC HỌC LẠI PHẦN LÀM SAI -->
              <div class="space-y-3">
                <h4 class="text-sm font-extrabold text-rose-400 flex items-center gap-2">
                  <span>🚨 PHẦN 1: BẮT BUỘC HỌC LẠI & LÀM LẠI CÁC CÂU SAI (${wrongItems.length} phần)</span>
                </h4>
                ${wrongItems.map((w, idx) => `
                  <div id="remedialCard_${w.q.id}" class="p-4 rounded-2xl bg-slate-950 border-2 border-rose-500/50 space-y-3">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-bold text-rose-400">${w.q.skill} — Cần học lại ngay</span>
                      <span id="remedialStatus_${w.q.id}" class="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">Chưa khắc phục</span>
                    </div>
                    <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                      <b>📘 Kiến thức bắt buộc học lại:</b> ${w.q.theory}
                    </div>
                    <div class="text-xs sm:text-sm font-bold text-white">Làm lại câu hỏi: ${w.q.q}</div>
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      ${w.q.options.map((opt, oIdx) => `
                        <button data-remedial-qid="${w.q.id}" data-remedial-oidx="${oIdx}" class="remedial-retry-btn text-left p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition">
                          ${opt}
                        </button>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- SECTION 2: ÔN TẬP CỦNG CỐ PHẦN LÀM ĐÚNG -->
              <div class="space-y-2.5 pt-2 border-t border-slate-800">
                <h4 class="text-sm font-extrabold text-emerald-400">
                  ✅ PHẦN 2: ÔN LẠI CÁC PHẦN BẠN ĐÃ LÀM ĐÚNG (${rightItems.length} phần — Đọc lại để nhớ sâu hơn)
                </h4>
                ${rightItems.length === 0 ? `<div class="text-xs text-slate-400">Bạn chưa có câu đúng nào ở lượt vừa rồi — hãy hoàn thành phần học lại bên trên nhé!</div>` : rightItems.map(r => `
                  <div class="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-1 text-xs">
                    <div class="font-bold text-emerald-300">✔ ${r.skill}: ${r.q}</div>
                    <div class="text-slate-300"><b>Đáp án đúng của bạn:</b> ${r.options[r.answer]}</div>
                    <div class="text-slate-400"><b>Củng cố kiến thức:</b> ${r.theory}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }
      }

      // =====================================================
      // 8D. AUTHENTICATION SYSTEM (GMAIL & PHONE NUMBER LOGIN / REGISTER)
      // =====================================================
      // 8 Vivid Preset Avatars (High-contrast SVG Data URLs + Generated Art)
      function makeSvgAvatarDataUri(bgGrad1, bgGrad2, emoji, ringColor) {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${bgGrad1}"/>
              <stop offset="100%" stop-color="${bgGrad2}"/>
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="58" fill="url(#g)" stroke="${ringColor}" stroke-width="3"/>
          <text x="60" y="76" font-size="56" text-anchor="middle">${emoji}</text>
        </svg>`;
        return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
      }

      const PRESET_AVATARS = [
        { id: 'dragon_gold', name: 'Tiểu Long Sư Phụ', url: 'assets/images/tutor_dragon.jpg' },
        { id: 'panda_scholar', name: 'Gấu Trúc Học Giả', url: makeSvgAvatarDataUri('#064e3b', '#0f172a', '🐼', '#34d399') },
        { id: 'phoenix_fire', name: 'Phượng Hoàng Lửa', url: makeSvgAvatarDataUri('#7f1d1d', '#451a03', '🐦‍🔥', '#fbbf24') },
        { id: 'fox_sage', name: 'Hồ Ly Thông Thái', url: makeSvgAvatarDataUri('#4c1d95', '#0f172a', '🦊', '#c084fc') },
        { id: 'tiger_king', name: 'Bạch Hổ Vương Giả', url: makeSvgAvatarDataUri('#1e3a8a', '#0f172a', '🐯', '#38bdf8') },
        { id: 'sword_hero', name: 'Kiếm Khách Trúc Lâm', url: makeSvgAvatarDataUri('#14532d', '#022c22', '🥷', '#4ade80') },
        { id: 'lotus_fairy', name: 'Tiên Nữ Hoa Đào', url: makeSvgAvatarDataUri('#831843', '#1e1b4b', '🧚‍♀️', '#f472b6') },
        { id: 'qilin_jade', name: 'Kỳ Lân Ngọc Bích', url: makeSvgAvatarDataUri('#134e4a', '#0f172a', '🦄', '#2dd4bf') }
      ];

      // 7 HSK Course Progression Frames (Gifted upon studying / completing each HSK Course!)
      const HSK_AVATAR_FRAMES = [
        { id: 'frame_hsk0', hskReq: 0, cssClass: 'hsk-frame-0', badge: '🌱', name: '🌱 Khung Mầm Ngọc Tân Thủ', desc: 'Tặng ngay khi bắt đầu hành trình học HSK 1.' },
        { id: 'frame_hsk1', hskReq: 1, cssClass: 'hsk-frame-1', badge: '🎋 HSK 1', name: '🎋 Khung Thanh Trúc HSK 1', desc: 'Phần thưởng danh giá khi hoàn thành Khóa HSK 1 (150 từ).' },
        { id: 'frame_hsk2', hskReq: 2, cssClass: 'hsk-frame-2', badge: '🏮 HSK 2', name: '🏮 Khung Hồng Đăng HSK 2', desc: 'Phần thưởng danh giá khi hoàn thành Khóa HSK 2 (300 từ).' },
        { id: 'frame_hsk3', hskReq: 3, cssClass: 'hsk-frame-3', badge: '⚔️ HSK 3', name: '⚔️ Khung Bạch Ngân Kiếm HSK 3', desc: 'Phần thưởng danh giá khi hoàn thành Khóa HSK 3 (600 từ).' },
        { id: 'frame_hsk4', hskReq: 4, cssClass: 'hsk-frame-4', badge: '🏯 HSK 4', name: '🏯 Khung Hoàng Kim Điện HSK 4', desc: 'Phần thưởng danh giá khi hoàn thành Khóa HSK 4 (1.200 từ).' },
        { id: 'frame_hsk5', hskReq: 5, cssClass: 'hsk-frame-5', badge: '🐉 HSK 5', name: '🐉 Khung Tử Kim Long HSK 5', desc: 'Phần thưởng danh giá khi hoàn thành Khóa HSK 5 (2.500 từ).' },
        { id: 'frame_hsk6', hskReq: 6, cssClass: 'hsk-frame-6', badge: '👑 HSK 6', name: '👑 Khung Cửu Thiên Đế Vương HSK 6', desc: 'Khung tối thượng tặng khi tốt nghiệp Đỉnh Cao HSK 6 (5.000+ từ).' }
      ];

      function isHskFrameUnlocked(frameObj) {
        if (frameObj.hskReq === 0) return true;
        const passed = appState.passedCourses || {};
        if (passed[frameObj.hskReq]) return true;
        // Also unlock if the user's current active course is already above that HSK level
        if ((appState.currentCourseId || 1) > frameObj.hskReq) return true;
        return false;
      }

      function getCurrentUserAvatarUrl() {
        if (appState.avatarDataUrl && appState.avatarDataUrl.startsWith('data:image/')) {
          return appState.avatarDataUrl;
        }
        const preset = PRESET_AVATARS.find(p => p.id === appState.avatarPresetId) || PRESET_AVATARS[0];
        return preset.url;
      }

      function getCurrentEquippedFrame() {
        const chosen = HSK_AVATAR_FRAMES.find(f => f.id === appState.selectedFrameId);
        if (chosen && isHskFrameUnlocked(chosen)) return chosen;
        // Default to highest unlocked frame
        let highest = HSK_AVATAR_FRAMES[0];
        HSK_AVATAR_FRAMES.forEach(f => {
          if (isHskFrameUnlocked(f)) highest = f;
        });
        return highest;
      }

      function updateAuthHeaderUI() {
        ensureCourseStateFields();
        const label = document.getElementById('hudUserAccountName');
        const frameTitleEl = document.getElementById('hudUserFrameTitle');
        const avatarImg = document.getElementById('hudUserAvatarImg');
        const frameWrap = document.getElementById('hudAvatarFrameWrap');
        const frameBadge = document.getElementById('hudAvatarFrameBadge');

        if (label) {
          if (appState.currentUser && appState.currentUser.identifier) {
            label.textContent = appState.currentUser.fullName + ' (' + appState.currentUser.identifier + ')';
          } else {
            label.textContent = 'Đăng nhập / Đăng ký';
          }
        }

        const frameObj = getCurrentEquippedFrame();
        const avatarUrl = getCurrentUserAvatarUrl();
        if (avatarImg) avatarImg.src = avatarUrl;
        if (frameWrap) frameWrap.className = `hsk-frame-wrap ${frameObj.cssClass} w-9 h-9`;
        if (frameBadge) frameBadge.textContent = frameObj.badge.split(' ')[0];
        if (frameTitleEl) frameTitleEl.textContent = frameObj.name;
      }

      function renderAvatarFrameModalUI() {
        const frameObj = getCurrentEquippedFrame();
        const avatarUrl = getCurrentUserAvatarUrl();
        const prevWrap = document.getElementById('previewAvatarFrameWrap');
        const prevImg = document.getElementById('previewAvatarImg');
        const prevEmblem = document.getElementById('previewAvatarFrameEmblem');
        const prevName = document.getElementById('previewAvatarUserName');
        const prevFrameName = document.getElementById('previewEquippedFrameName');

        if (prevWrap) prevWrap.className = `hsk-frame-wrap ${frameObj.cssClass} w-20 h-20`;
        if (prevImg) prevImg.src = avatarUrl;
        if (prevEmblem) prevEmblem.textContent = frameObj.badge;
        if (prevName) prevName.textContent = (appState.currentUser && appState.currentUser.fullName) || 'Học Viên BlackPig';
        if (prevFrameName) prevFrameName.textContent = 'Đang đeo: ' + frameObj.name;

        const avatarsGrid = document.getElementById('presetAvatarsGrid');
        if (avatarsGrid) {
          avatarsGrid.innerHTML = PRESET_AVATARS.map(av => {
            const isSelected = !appState.avatarDataUrl && (appState.avatarPresetId || 'dragon_gold') === av.id;
            return `
              <button data-select-avatar="${av.id}" type="button" class="preset-avatar-btn p-2 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                isSelected ? 'bg-emerald-600/25 border-emerald-400 shadow-lg' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
              }">
                <img src="${av.url}" alt="${escapeHtml(av.name)}" class="w-12 h-12 rounded-full object-cover" />
                <span class="text-xs font-bold text-slate-200 text-center line-clamp-1">${escapeHtml(av.name)}</span>
              </button>
            `;
          }).join('');
        }

        const framesGrid = document.getElementById('hskFramesGrid');
        if (framesGrid) {
          framesGrid.innerHTML = HSK_AVATAR_FRAMES.map(f => {
            const unlocked = isHskFrameUnlocked(f);
            const isEquipped = frameObj.id === f.id;
            return `
              <button data-select-frame="${f.id}" type="button" class="hsk-frame-select-btn p-3.5 rounded-2xl border text-left flex items-center gap-3.5 transition ${
                isEquipped
                  ? 'bg-amber-500/15 border-amber-400 shadow-lg'
                  : (unlocked ? 'bg-slate-950 border-emerald-500/40 hover:border-emerald-400' : 'bg-slate-950/50 border-slate-800 opacity-60')
              }">
                <div class="relative shrink-0">
                  <div class="hsk-frame-wrap ${f.cssClass} w-14 h-14">
                    <img src="${avatarUrl}" alt="${escapeHtml(f.name)}" class="w-full h-full rounded-full object-cover bg-slate-900" />
                  </div>
                  <span class="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-slate-950 border border-amber-400 text-[10px] font-black text-amber-300">${f.badge}</span>
                </div>
                <div class="min-w-0 flex-1 space-y-0.5">
                  <div class="flex items-center justify-between gap-1">
                    <span class="text-xs sm:text-sm font-extrabold text-white truncate">${f.name}</span>
                    <span class="text-xs font-bold shrink-0 ${isEquipped ? 'text-amber-300' : (unlocked ? 'text-emerald-400' : 'text-slate-500')}">
                      ${isEquipped ? '✨ Đang đeo' : (unlocked ? '🔓 Đã sở hữu' : '🔒 Khóa')}
                    </span>
                  </div>
                  <p class="text-xs text-slate-300 leading-snug">${f.desc}</p>
                </div>
              </button>
            `;
          }).join('');
        }
      }

      function renderSavedAccountsList() {
        ensureCourseStateFields();
        const wrap = document.getElementById('savedAccountsListWrap');
        if (!wrap) return;
        const accs = appState.accounts || [];
        if (accs.length === 0) {
          wrap.innerHTML = '';
          return;
        }
        wrap.innerHTML = `
          <div class="mt-1">
            <span class="font-semibold text-slate-300">Tài khoản đã lưu trên thiết bị (Bấm để chọn):</span>
            <div class="flex flex-wrap gap-1.5 mt-1">
              ${accs.map(a => `
                <button data-quick-acc="${a.identifier}" class="quick-acc-btn px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-700 text-emerald-300 text-xs font-semibold">
                  ${a.method === 'phone' ? '📱' : '📧'} ${a.fullName} (${a.identifier})
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }

      function setAuthModalMode(mode) {
        authMode = mode;
        const isReg = mode === 'register';
        document.getElementById('authModalHeading').textContent = isReg ? 'Đăng Ký Tài Khoản Học Viên Mới' : 'Đăng Nhập Tài Khoản Học Tập';
        document.getElementById('authFullNameFieldWrap').classList.toggle('hidden', !isReg);
        document.getElementById('btnSubmitAuthForm').textContent = isReg ? '✨ Đăng Ký Tài Khoản & Bắt Đầu Học' : '🚀 Đăng Nhập & Đồng Bộ Lộ Trình';
        document.getElementById('btnSwitchToLogin').className = 'py-2 rounded-xl text-xs font-extrabold transition ' + (!isReg ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white');
        document.getElementById('btnSwitchToRegister').className = 'py-2 rounded-xl text-xs font-extrabold transition ' + (isReg ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white');
        document.getElementById('authFeedbackMsg').textContent = '';
        renderSavedAccountsList();
      }

      // =====================================================
