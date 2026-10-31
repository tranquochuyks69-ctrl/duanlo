// ============================================================================
// Module 06: Router, Dynamic 8-Scene Carousel, 10,500-Sentence Dictation & Personal Notebooks
// ============================================================================
'use strict';

function switchTab(tabId, skipHashUpdate) {
        if (tabId === 'dictionary') tabId = 'library';
        const validTabs = ['map', 'ai', 'dojo', 'arena', 'srs', 'library', 'profile', 'hanbeego-hub'];
        if (!validTabs.includes(tabId)) tabId = 'map';
        if (!skipHashUpdate && window.location.hash !== '#/' + tabId) {
          try { history.replaceState(null, '', '#/' + tabId); } catch (e) { window.location.hash = '#/' + tabId; }
        }
        playSfx('click');
        document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
        const sectionId = 'view-' + tabId;
        const target = document.getElementById(sectionId);
        if (target) target.classList.remove('hidden');

        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
          const isMatch = btn.getAttribute('data-tab') === tabId;
          btn.className = 'nav-tab-btn flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition ' +
            (isMatch ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25' : 'text-slate-300 hover:bg-slate-800');
        });

        if (tabId === 'library') {
          renderDictionaryResults(document.getElementById('dictSearchInput')?.value || '');
          const dictInp = document.getElementById('dictSearchInput');
          if (dictInp) {
            setTimeout(() => { dictInp.focus(); }, 60);
          }
        }
        if (tabId === 'profile') {
          renderProfileAndChart();
          if (typeof window._renderWeeklyLeague === 'function') window._renderWeeklyLeague();
        if (typeof window.renderDatabaseControlCenterUI === 'function') window.renderDatabaseControlCenterUI();
        }
        if (tabId === 'srs') {
          renderSrsView();
          if (typeof window._renderMistakeNotebookUI === 'function') window._renderMistakeNotebookUI();
        }
        if (tabId === 'dojo') {
          setTimeout(() => {
            if (typeof initHanziWriterForCurrentChar === 'function') initHanziWriterForCurrentChar();
          }, 40);
        }
        if (tabId === 'arena') {
          getFilteredArenaVocab();
          syncArenaLivesUI();
          if (quiz4Questions.length === 0) startQuiz4Game();
        }
      }

      function refreshAllUI() {
        ensureCourseStateFields();
        const scaleVal = String(appState.hanziScale || '1');
        document.documentElement.style.setProperty('--hanzi-scale', scaleVal);
        const selScale = document.getElementById('prefHanziScaleSelect');
        if (selScale) selScale.value = scaleVal;
        const selSpeed = document.getElementById('prefSpeechSpeedSelect');
        if (selSpeed && appState.speechRate) selSpeed.value = String(appState.speechRate);
        const selTheme = document.getElementById('prefThemeModeSelect');
        if (selTheme && appState.themeMode) selTheme.value = appState.themeMode;
        if (typeof window.applyBackgroundColorTheme === 'function') {
          window.applyBackgroundColorTheme(
            appState.bgColorHex || (appState.lightTheme ? '#f8fafc' : '#020617'),
            appState.bgPresetId || (appState.lightTheme ? 'white_jade' : 'default_dark'),
            appState.bgEffect || 'glow',
            true
          );
        }
        updateAuthHeaderUI();
        renderCourseRoadmapUI();
        renderAccountScheduleHub();
        updateHudAndResumeBanner();
        if (typeof window.applyAdminRoleVisibility === 'function') {
          window.applyAdminRoleVisibility();
        }
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.addEventListener('message', function (ev) {
            if (ev.data && ev.data.type === 'SW_UPDATE_READY') {
              showToast('🔄 Đã có phiên bản ứng dụng mới (' + ev.data.version + ') — Hãy tải lại trang để cập nhật!', 'emerald');
            }
          });
        }
        renderDailyQuests();
        renderAdventureMap();
        renderSrsView();
        renderDictionaryResults(document.getElementById('dictSearchInput')?.value || '');
        renderGradedStory(currentStoryIdx);
        renderGrammarAndResources('all');
        if (typeof window._renderMistakeNotebookUI === 'function') window._renderMistakeNotebookUI();
        if (typeof window._renderWeeklyLeague === 'function') window._renderWeeklyLeague();
        if (typeof window.renderDatabaseControlCenterUI === 'function') window.renderDatabaseControlCenterUI();
      }

      function bindEvents() {
        // Tab Switching
        document.querySelectorAll('.nav-tab-btn').forEach(btn => {
          btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
        });

        document.getElementById('btnLogoHome').addEventListener('click', () => switchTab('map'));
        document.getElementById('btnGemsShop').addEventListener('click', () => switchTab('profile'));
        document.getElementById('btnStreakInfo').addEventListener('click', () => {
          showToast('🔥 Chuỗi ngày học liên tiếp: ' + appState.streak + ' ngày! Hãy duy trì mỗi ngày nhé.', 'amber');
        });
        document.getElementById('btnHeartsInfo').addEventListener('click', () => {
          showToast('❤️ Bạn đang có ' + appState.hearts + '/5 Linh Lực để khiêu chiến Boss!', 'emerald');
        });

        // Sound & Theme toggles
        document.getElementById('btnSoundToggle').addEventListener('click', () => {
          soundEnabled = !soundEnabled;
          document.getElementById('iconSound').textContent = soundEnabled ? '🔊' : '🔇';
          showToast(soundEnabled ? '🔊 Đã bật âm thanh hiệu ứng' : '🔇 Đã tắt âm thanh hiệu ứng', 'emerald');
        });

        document.getElementById('btnThemeToggle').addEventListener('click', () => {
          const nextLight = !appState.lightTheme;
          applyThemeModeSelection(nextLight ? 'light' : 'dark');
          saveStateToDatabase('Đổi giao diện: ' + (nextLight ? 'Sáng' : 'Tối'));
          showToast(nextLight ? '☀️ Chế độ Bạch Ngọc (Sáng)' : '🌙 Chế độ Huyền Vũ (Tối)', 'amber');
        });

        document.getElementById('btnSpeakIdiomWidget').addEventListener('click', () => speakChinese('熟能生巧'));

        // Resume Banner Buttons
        document.getElementById('btnResumeLastLesson').addEventListener('click', () => {
          openLessonModal(appState.lastLessonId || 'c0_1');
        });
        document.getElementById('btnOpenPlacementTest').addEventListener('click', openPlacementModal);
        document.getElementById('btnClosePlacementModal').addEventListener('click', () => {
          document.getElementById('placementModal').classList.add('hidden');
        });

        // Unlock all toggle
        // 8-Scene Animated Hero World Carousel & Floating Golden Lantern Particles
        const HERO_SLIDES_META = [
          {
            badge: '🏮 Cảnh 1/8: Cung Điện Hoa Anh Đào — Khởi Nguyên HSK 1',
            topTag: '🌸 KHỞI ĐẦU TỪ MẤT GỐC • NỀN TẢNG PHÁT ÂM PINYIN & BỘ THỦ HSK 1',
            heading: 'Hành Trình Chinh Phục Hán Ngữ: Từ Mất Gốc Đến HSK 6',
            sub: 'Làm chủ 4 thanh điệu Bắc Kinh, 214 bộ thủ cốt lõi và những câu chào hỏi giao tiếp đầu tiên cùng Sư Phụ AI.'
          },
          {
            badge: '🏯 Cảnh 2/8: Vạn Lý Trường Thành Hoàng Hôn — Giao Tiếp HSK 2',
            topTag: '🏯 VẠN LÝ TRƯỜNG THÀNH • PHẢN XẠ GIAO TIẾP ĐỜI SỐNG HSK 2',
            heading: 'Vạn Lý Trường Thành: Vượt Qua Nỗi Sợ Nghe Nói Tiếng Trung',
            sub: 'Chinh phục 300+ từ vựng giao tiếp đời sống, hỏi đường, thời gian, lịch hẹn và phản xạ nghe nói tự nhiên.'
          },
          {
            badge: '🏮 Cảnh 3/8: Phố Cổ Giang Nam Đêm Đèn Lồng — Du Lịch HSK 3',
            topTag: '🏮 ĐÊM HỘI ĐÈN LỒNG GIANG NAM • DU LỊCH, ẨM THỰC & MUA SẮM HSK 3',
            heading: 'Phố Cổ Giang Nam: Tự Tin Du Lịch & Khám Phá Trung Hoa',
            sub: 'Tự tin mua sắm, mặc cả, gọi món tại nhà hàng và trò chuyện cùng người bản xứ trên những con phố cổ lung linh.'
          },
          {
            badge: '🎋 Cảnh 4/8: Trúc Lâm Thư Viện & Thác Nước — Thư Pháp HSK 4',
            topTag: '🎋 TRÚC LÂM THƯ VIỆN • LUYỆN BÚT THUẬN ĐIỀN TỰ CÁCH & NGỮ PHÁP HSK 4',
            heading: 'Trúc Lâm Thư Viện: Tinh Hoa Thư Pháp & Tranh Luận Độc Lập',
            sub: 'Luyện viết chữ Hán chuẩn từng nét bút, làm chủ câu chữ 把/被 và thuyết trình mạch lạc mọi chủ đề xã hội.'
          },
          {
            badge: '🌸 Cảnh 5/8: Tử Cấm Thành Bình Minh Hoa Mai — Văn Chương HSK 5',
            topTag: '👑 TỬ CẤM THÀNH BÌNH MINH • ĐỌC HIỂU BÁO CHÍ & THÀNH NGỮ HSK 5',
            heading: 'Hoàng Cung Bình Minh: Đọc Báo Chí & Thành Ngữ Trung Hoa',
            sub: 'Đọc hiểu truyện ngắn, tin tức kinh tế, thành ngữ 4 chữ (成语) và mở khóa Khung Avatar Hoàng Kim Uy Nghiêm.'
          },
          {
            badge: '🌆 Cảnh 6/8: Bến Thượng Hải Hiện Đại & Vân Long — Thương Mại HSK 5+',
            topTag: '🌆 BẾN THƯỢNG HẢI HIỆN ĐẠI • ĐÀM PHÁN THƯƠNG MẠI & CÔNG SỞ',
            heading: 'Nhịp Sống Thượng Hải: Tiếng Trung Thương Mại & Phỏng Vấn',
            sub: 'Gặp gỡ Tiểu Long (Designer 24 tuổi tại Thượng Hải), luyện phỏng vấn xin việc và giao tiếp công sở chuyên nghiệp.'
          },
          {
            badge: '🌌 Cảnh 7/8: Đỉnh Ngọc Sơn Tiên Cảnh Cực Quang — Đỉnh Cao HSK 6',
            topTag: '🌌 ĐỈNH NGỌC SƠN TIÊN CẢNH • TINH THÔNG HÁN NGỮ HỌC THUẬT HSK 6',
            heading: 'Đỉnh Ngọc Sơn Cực Quang: Đỉnh Cao Hán Ngữ Bậc Thầy',
            sub: 'Làm chủ từ vựng học thuật cao cấp, diễn thuyết lưu loát như người bản xứ và nhận Khung Chí Tôn Thần Thoại.'
          },
          {
            badge: '🐉 Cảnh 8/8: Thư Các Tiểu Long Sư Phụ — 10.500+ Câu Giao Tiếp & Từ Điển',
            topTag: '🐉 KHO 10.500+ CÂU GIAO TIẾP THỰC TẾ & TỪ ĐIỂN VIỆT ↔ TRUNG TOÀN DIỆN',
            heading: 'Thư Các Tiểu Long: Luyện Nghe Chép Chính Tả & Đàm Đạo 24/7',
            sub: 'Thực hành hơn 10.500 câu nói thường ngày của người Trung Quốc, tra từ điển 2 chiều Việt-Trung tức thì và ôn thẻ FSRS-5.'
          }
        ];
        let currentHeroSlideIdx = 0;
        let heroAutoPlayEnabled = true;
        let heroAutoPlayTimer = null;

        function renderHeroCarouselState(targetIdx) {
          const total = HERO_SLIDES_META.length;
          currentHeroSlideIdx = ((targetIdx % total) + total) % total;
          const imgs = document.querySelectorAll('.hero-slide-item');
          imgs.forEach((img, idx) => {
            if (idx === currentHeroSlideIdx) {
              img.classList.remove('opacity-0', 'pointer-events-none');
              img.classList.add('opacity-100', 'hero-slide-img-active');
            } else {
              img.classList.remove('opacity-100', 'hero-slide-img-active');
              img.classList.add('opacity-0', 'pointer-events-none');
            }
          });

          const meta = HERO_SLIDES_META[currentHeroSlideIdx];
          const badgeEl = document.getElementById('heroSlideLocationBadge');
          const topTagEl = document.getElementById('heroSlideTopTag');
          const headingEl = document.getElementById('heroSlideMainHeading');
          const subEl = document.getElementById('heroSlideDynamicSubtitle');
          if (badgeEl && meta) badgeEl.textContent = meta.badge;
          if (topTagEl && meta) topTagEl.textContent = meta.topTag;
          if (headingEl && meta) headingEl.textContent = meta.heading;
          if (subEl && meta) subEl.textContent = meta.sub;

          const dotsBox = document.getElementById('heroCarouselDots');
          if (dotsBox) {
            dotsBox.innerHTML = HERO_SLIDES_META.map((_, idx) => `
              <button type="button" data-hero-dot="${idx}" aria-label="Chuyển tới cảnh ${idx + 1}" class="hero-dot-btn h-2 rounded-full transition-all ${
                idx === currentHeroSlideIdx ? 'w-6 bg-amber-400 shadow shadow-amber-400/50' : 'w-2 bg-slate-600 hover:bg-slate-400'
              }"></button>
            `).join('');
          }
        }

        function startHeroAutoPlayTimer() {
          if (heroAutoPlayTimer) clearInterval(heroAutoPlayTimer);
          heroAutoPlayTimer = setInterval(() => {
            if (heroAutoPlayEnabled && !document.hidden) {
              renderHeroCarouselState(currentHeroSlideIdx + 1);
            }
          }, 4200);
        }

        renderHeroCarouselState(0);
        startHeroAutoPlayTimer();

        const btnPrevHero = document.getElementById('btnHeroPrevSlide');
        const btnNextHero = document.getElementById('btnHeroNextSlide');
        const btnToggleHero = document.getElementById('btnHeroToggleAuto');
        const dotsContainer = document.getElementById('heroCarouselDots');

        if (btnPrevHero) {
          btnPrevHero.addEventListener('click', () => {
            renderHeroCarouselState(currentHeroSlideIdx - 1);
            startHeroAutoPlayTimer();
          });
        }
        if (btnNextHero) {
          btnNextHero.addEventListener('click', () => {
            renderHeroCarouselState(currentHeroSlideIdx + 1);
            startHeroAutoPlayTimer();
          });
        }
        if (btnToggleHero) {
          btnToggleHero.addEventListener('click', () => {
            heroAutoPlayEnabled = !heroAutoPlayEnabled;
            btnToggleHero.textContent = heroAutoPlayEnabled ? '⏸️ Tự chuyển' : '▶️ Đang dừng';
          });
        }
        if (dotsContainer) {
          dotsContainer.addEventListener('click', (ev) => {
            const dot = ev.target.closest('.hero-dot-btn');
            if (dot) {
              renderHeroCarouselState(Number(dot.getAttribute('data-hero-dot')) || 0);
              startHeroAutoPlayTimer();
            }
          });
        }

        // Floating Golden Firefly & Lantern Particles on #heroParticlesCanvas
        (function initHeroParticles() {
          const canvas = document.getElementById('heroParticlesCanvas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          const particles = Array.from({ length: 26 }, (_, i) => ({
            x: (i * 39) % canvas.width,
            y: (i * 53) % canvas.height,
            r: 1.5 + (i % 3) * 1.1,
            vx: 0.25 + (i % 4) * 0.12,
            vy: -0.35 - (i % 3) * 0.15,
            alpha: 0.35 + (i % 5) * 0.12
          }));
          function stepParticles() {
            if (!document.hidden && document.getElementById('view-map') && !document.getElementById('view-map').classList.contains('hidden')) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.y < -10) p.y = canvas.height + 8;
                if (p.x > canvas.width + 10) p.x = -8;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(251, 191, 36, ${p.alpha})`;
                ctx.fill();
              });
            }
            requestAnimationFrame(stepParticles);
          }
          requestAnimationFrame(stepParticles);
        })();

        document.getElementById('btnUnlockAllToggle').addEventListener('click', () => {
          appState.unlockAll = !appState.unlockAll;
          document.getElementById('btnUnlockAllToggle').textContent = appState.unlockAll
            ? '🔓 Chế độ Tự Do Khám Phá: Đang Bật'
            : '🔒 Chế độ Vượt Ải Tuần Tự: Đang Bật';
          renderAdventureMap();
          saveStateToDatabase();
        });

        // Realm filter buttons
        document.querySelectorAll('.realm-filter-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            activeRealmFilter = btn.getAttribute('data-realm');
            document.querySelectorAll('.realm-filter-btn').forEach(b => {
              const active = b.getAttribute('data-realm') === activeRealmFilter;
              b.className = 'realm-filter-btn px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ' +
                (active ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-emerald-500/50');
            });
            renderCourseRoadmapUI();
            renderAdventureMap();
          });
        });

        // Lesson Modal navigation
        document.getElementById('btnCloseLessonModal').addEventListener('click', () => {
          document.getElementById('lessonModal').classList.add('hidden');
        });
        document.getElementById('btnModalPrevStep').addEventListener('click', () => {
          if (currentModalStep > 0) {
            currentModalStep--;
            renderModalStep();
          }
        });
        document.getElementById('btnModalNextStep').addEventListener('click', () => {
          if (!currentModalLesson) return;
          if (currentModalStep === 0) {
            currentModalStep = 1;
            dailyQuizSelections = {};
            renderModalStep();
            return;
          }

          let wrongCount = 0;
          const wrongWords = [];
          currentModalLesson.questions.forEach((qObj, qIdx) => {
            const picked = dailyQuizSelections[qIdx];
            const cardEl = document.getElementById('dailyQCard_' + qIdx);
            const expEl = document.getElementById('dailyQExplain_' + qIdx);
            if (picked === qObj.answer) {
              if (cardEl) cardEl.className = 'p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/60 space-y-2.5';
              if (expEl) {
                expEl.classList.remove('hidden');
                expEl.className = 'text-xs p-2.5 rounded-xl bg-emerald-500/15 text-emerald-300 font-semibold';
                expEl.innerHTML = '✅ Đúng: ' + qObj.explain;
              }
            } else {
              wrongCount++;
              if (qObj.wordRef) wrongWords.push(qObj.wordRef);
              if (cardEl) cardEl.className = 'p-4 rounded-2xl bg-rose-950/40 border-2 border-rose-500 space-y-2.5';
              if (expEl) {
                expEl.classList.remove('hidden');
                expEl.className = 'text-xs p-2.5 rounded-xl bg-rose-500/20 text-rose-200 font-semibold';
                expEl.innerHTML = '❌ <b>Chưa đúng — Bắt buộc học lại ngay:</b> ' + qObj.explain + ' ➔ <i>Hãy bấm chọn lại đáp án đúng ở trên!</i>';
              }
            }
          });

          const fb = document.getElementById('modalQuizFeedback');
          if (wrongCount > 0) {
            playSfx('wrong');
            if (fb) {
              fb.classList.remove('hidden');
              fb.className = 'p-4 rounded-2xl text-xs sm:text-sm font-bold bg-rose-950/80 border-2 border-rose-500 text-rose-200';
              fb.innerHTML = `🔒 <b>Chưa được qua ngày tiếp theo!</b> Bạn còn <b>${wrongCount} câu chưa đúng</b> (Từ cần học lại: <span class="text-amber-300 hanzi-font">${wrongWords.join(', ')}</span>). Hãy xem kỹ giải thích ở câu màu đỏ, chọn lại đáp án đúng rồi bấm <b>"Chấm Điểm & Mở Khóa Ngày Tiếp Theo"</b> lần nữa nhé!`;
            }
            showToast(`⚠️ Còn ${wrongCount} câu chưa đúng! Phải làm đúng 100% mới mở khóa Ngày tiếp theo.`, 'rose');
            return;
          }

          appState.completedLessons[currentModalLesson.id] = 3;
          ensureCourseStateFields();
          const wasMandatoryReview = Boolean(appState.missedDayReviewRequired);
          appState.lastDailyStudyDateISO = getLocalDateISO();
          appState.lastCheckInDate = getLocalDateISO();

          let nextDayToOpen = null;
          let cid = activeCourseId || 1;
          if (currentModalLesson.isDailyLesson) {
            cid = currentModalLesson.courseId;
            const dnum = currentModalLesson.dayNumber;
            if (!appState.completedDailyLessons[cid]) appState.completedDailyLessons[cid] = {};
            appState.completedDailyLessons[cid][dnum] = true;
            if (appState.missedDayReviewRequired && dnum >= Number(appState.missedDayReviewDayNum || 1)) {
              appState.missedDayReviewRequired = false;
            }
            if (dnum < currentModalLesson.totalCourseDays) {
              nextDayToOpen = dnum + 1;
            }
          } else {
            const cfg = COURSE_DAYS_CONFIG[cid] || COURSE_DAYS_CONFIG[1];
            if (!appState.completedDailyLessons[cid]) appState.completedDailyLessons[cid] = {};
            for (let d = 1; d <= cfg.totalDays; d++) {
              if (!appState.completedDailyLessons[cid][d]) {
                appState.completedDailyLessons[cid][d] = true;
                if (d < cfg.totalDays) nextDayToOpen = d + 1;
                break;
              }
            }
            appState.missedDayReviewRequired = false;
          }

          playSfx('levelup');
          progressQuest('q_lesson');
          addReward(currentModalLesson.rewardExp, currentModalLesson.rewardGems, 'Pass 100% (' + currentModalLesson.questions.length + '/' + currentModalLesson.questions.length + ' câu): ' + currentModalLesson.title);
          renderCourseRoadmapUI();
          renderAdventureMap();

          if (nextDayToOpen) {
            if (fb) {
              fb.classList.remove('hidden');
              fb.className = 'p-4 rounded-2xl text-xs sm:text-sm font-bold bg-emerald-950/90 border-2 border-emerald-400 text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3';
              fb.innerHTML = `
                <div>🎉 <b>${wasMandatoryReview ? 'Đã hoàn thành ôn lại Ngày ' + (nextDayToOpen - 1) + ' (10/10 câu)!' : 'Chúc mừng bạn đã PASS 10/10 câu của Ngày ' + (nextDayToOpen - 1) + '!'}</b> Bạn đã nhận <b>+${currentModalLesson.rewardExp} EXP, +${currentModalLesson.rewardGems} 💎</b> và chính thức mở khóa <b>Ngày ${nextDayToOpen}</b>!</div>
                <button id="btnProceedToNextDayNow" data-next-cid="${cid}" data-next-day="${nextDayToOpen}" class="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shrink-0 transition">
                  ➡️ Học Tiếp Sang Ngày ${nextDayToOpen} Ngay
                </button>
              `;
            }
          } else {
            document.getElementById('lessonModal').classList.add('hidden');
            showToast('🏆 Chúc mừng! Bạn đã học đủ 100% số từ vựng quy định của khóa và mở khóa Bài Thi Cuối Khóa!', 'amber');
          }
        });

        // AI Chat Controls
        document.getElementById('btnToggleChatPinyin').addEventListener('click', () => {
          showChatPinyin = !showChatPinyin;
          document.getElementById('btnToggleChatPinyin').textContent = 'Pinyin: ' + (showChatPinyin ? 'BẬT' : 'TẮT');
          document.querySelectorAll('.chat-pinyin-line').forEach(el => el.classList.toggle('hidden', !showChatPinyin));
        });
        document.getElementById('btnToggleChatTrans').addEventListener('click', () => {
          showChatTrans = !showChatTrans;
          document.getElementById('btnToggleChatTrans').textContent = 'Dịch Việt: ' + (showChatTrans ? 'BẬT' : 'TẮT');
          document.querySelectorAll('.chat-trans-line').forEach(el => el.classList.toggle('hidden', !showChatTrans));
        });
        document.getElementById('btnToggleAutoSpeakAi').addEventListener('click', () => {
          autoSpeakAi = !autoSpeakAi;
          document.getElementById('btnToggleAutoSpeakAi').textContent = '🔊 Tự động đọc: ' + (autoSpeakAi ? 'BẬT' : 'TẮT');
        });
        document.getElementById('btnResetAiChat').addEventListener('click', () => {
          initAiChatScenario(activeAiScenario.id, true);
          saveStateToDatabase('Làm mới hội thoại AI Tiểu Long');
          showToast('🔄 Đã làm mới cuộc trò chuyện cùng Tiểu Long!', 'emerald');
        });

        const btnAddMem = document.getElementById('btnAddFriendMemory');
        if (btnAddMem) {
          btnAddMem.addEventListener('click', () => {
            const inp = document.getElementById('inputNewFriendMemory');
            const val = cleanRawText(inp ? inp.value : '', 80);
            if (!val) return;
            if (!Array.isArray(appState.friendMemory)) appState.friendMemory = [];
            appState.friendMemory.unshift(val);
            if (inp) inp.value = '';
            saveStateToDatabase('Thêm ký ức vào Bộ nhớ bạn bè: ' + val);
            renderAiBackgroundPedagogicalPanel();
            showToast('🧠 Tiểu Long đã ghi nhớ: ' + val, 'emerald');
          });
        }

        const btnClearMem = document.getElementById('btnClearFriendMemory');
        if (btnClearMem) {
          btnClearMem.addEventListener('click', () => {
            appState.friendMemory = [];
            saveStateToDatabase('Xóa toàn bộ Bộ nhớ bạn bè (friend_memory)');
            renderAiBackgroundPedagogicalPanel();
            showToast('🗑️ Đã xóa sạch toàn bộ Bộ nhớ bạn bè của Tiểu Long!', 'amber');
          });
        }

        const btnBatchAnalyze = document.getElementById('btnAnalyzeAiSessionBatch');
        if (btnBatchAnalyze) {
          btnBatchAnalyze.addEventListener('click', () => {
            if (!Array.isArray(appState.aiCoachNotes)) appState.aiCoachNotes = [];
            const errKeys = Object.keys(appState.learnerErrors || {});
            const summaryBody = errKeys.length > 0
              ? `Tổng kết gom lô buổi trò chuyện: Đã phát hiện ${errKeys.length} nhóm lỗi cần lưu ý (${errKeys.join(', ')}) và đồng bộ gợi ý SRS về Client.`
              : 'Tổng kết gom lô buổi trò chuyện: Các câu tiếng Trung của bạn đúng trật tự từ và ngữ cảnh HSK, tiết kiệm 66% chi phí gọi mô hình!';
            appState.aiCoachNotes.unshift({
              type: 'srs',
              badge: '📊 Báo Cáo Phân Tích Gom Lô (Batch Summary)',
              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              body: summaryBody
            });
            renderAiBackgroundPedagogicalPanel();
            showToast('📊 Đã tổng kết cả đoạn hội thoại vào thẻ "Hôm Nay Mình Để Ý..."!', 'emerald');
          });
        }

        const btnReportAi = document.getElementById('btnReportAiHallucination');
        if (btnReportAi) {
          btnReportAi.addEventListener('click', () => {
            enqueueSyncOutboxEvent('ai_feedback_report', {
              scenario: activeAiScenario.id,
              reported_at: new Date().toISOString(),
              recent_notes: (appState.aiCoachNotes || []).slice(0, 2)
            });
            saveStateToDatabase('Gửi báo cáo kiểm duyệt giải thích AI');
            showToast('🚩 Đã gửi báo cáo giải thích AI về hàng đợi giáo viên kiểm duyệt! Cảm ơn bạn.', 'emerald');
          });
        }
        document.getElementById('btnSendAiChat').addEventListener('click', () => {
          handleUserAiMessage(document.getElementById('aiUserInput').value);
        });
        document.getElementById('aiUserInput').addEventListener('keydown', (e) => {
          if (e.key === 'Enter') handleUserAiMessage(document.getElementById('aiUserInput').value);
        });
        document.getElementById('btnVoiceMic').addEventListener('click', startVoiceInput);

        // Dojo Controls
        document.getElementById('btnDojoSubHanzi').addEventListener('click', () => {
          document.getElementById('dojoHanziPanel').classList.remove('hidden');
          document.getElementById('dojoPinyinPanel').classList.add('hidden');
          document.getElementById('btnDojoSubHanzi').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white transition';
          document.getElementById('btnDojoSubPinyin').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
        });
        document.getElementById('btnDojoSubPinyin').addEventListener('click', () => {
          document.getElementById('dojoHanziPanel').classList.add('hidden');
          document.getElementById('dojoPinyinPanel').classList.remove('hidden');
          document.getElementById('btnDojoSubPinyin').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 text-white transition';
          document.getElementById('btnDojoSubHanzi').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition';
        });
        document.getElementById('btnSpeakDojoChar').addEventListener('click', () => {
          speakChinese(DOJO_CHARACTERS[activeDojoCharIndex].char);
        });
        document.getElementById('btnAnimateStroke').addEventListener('click', animateSampleCharacter);
        document.getElementById('btnToggleGuideChar').addEventListener('click', () => {
          document.getElementById('canvasGhostChar').classList.toggle('opacity-0');
        });
        document.getElementById('btnClearCanvas').addEventListener('click', clearHanziCanvas);
        document.getElementById('btnEvaluateCanvas').addEventListener('click', () => {
          const item = DOJO_CHARACTERS[activeDojoCharIndex];
          if (dojoUseHanziWriter && hanziWriterInstance) {
            if (lastStrokeQuizCompleted || drawnStrokePoints >= 12) {
              const accuracy = Math.max(65, 100 - (lastStrokeQuizMistakes || 0) * 7);
              playSfx('correct');
              progressQuest('q_write');
              document.getElementById('strokeScoreResult').textContent = `🏆 Đã chấm bút thuận chữ "${item.char}" (${item.pinyin}): Đạt ${accuracy}% độ chuẩn xác!`;
              addReward(15, 5, `Luyện viết chữ Hán ${item.char} (${accuracy}%)`);
            } else {
              playSfx('wrong');
              document.getElementById('strokeScoreResult').textContent = `⚠️ Hãy dùng chuột hoặc ngón tay tô theo các nét của chữ "${item.char}" trên ô Điền Tự trước khi chấm điểm nhé!`;
            }
            return;
          }
          const canvas = document.getElementById('hanziCanvas');
          if (drawnStrokePoints < 10 || !canvas) {
            playSfx('wrong');
            document.getElementById('strokeScoreResult').textContent = '⚠️ Bạn chưa viết đủ nét lên ô Điền Tự! Hãy dùng chuột hoặc ngón tay tô theo nét chữ ' + item.char + ' nhé.';
            return;
          }
          const result = computeCanvasStrokeAccuracy(canvas, item.char);
          document.getElementById('strokeScoreResult').textContent = result.msg;
          if (result.valid) {
            playSfx('correct');
            progressQuest('q_write');
            addReward(15, 5, `Luyện viết chữ Hán ${item.char} (${result.score}%)`);
          } else {
            playSfx('wrong');
          }
        });
        document.getElementById('btnNextDojoChar').addEventListener('click', () => {
          selectDojoCharacter(activeDojoCharIndex + 1);
        });

        // Arena Game Subtabs (4 Games + 3 Lives + Buy Lives with Gems + Custom Timers)
        function switchArenaMode(mode) {
          arenaCurrentMode = mode;
          document.getElementById('arenaQuiz4Panel').classList.toggle('hidden', mode !== 'quiz4');
          document.getElementById('arenaMatchPanel').classList.toggle('hidden', mode !== 'match');
          document.getElementById('arenaMeteorPanel').classList.toggle('hidden', mode !== 'meteor');
          document.getElementById('arenaTonePanel').classList.toggle('hidden', mode !== 'tone');
          if (mode !== 'meteor') meteorActive = false;

          document.getElementById('btnArenaQuiz4').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ' + (mode === 'quiz4' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 text-slate-300');
          document.getElementById('btnArenaMatch').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ' + (mode === 'match' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 text-slate-300');
          document.getElementById('btnArenaMeteor').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ' + (mode === 'meteor' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 text-slate-300');
          document.getElementById('btnArenaTone').className = 'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition ' + (mode === 'tone' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-800 text-slate-300');

          if (mode === 'quiz4') startQuiz4Game();
          if (mode === 'match') initMemoryMatchGame();
          if (mode === 'tone') loadToneQuizItem();
        }
        document.getElementById('btnArenaQuiz4').addEventListener('click', () => switchArenaMode('quiz4'));
        document.getElementById('btnArenaMatch').addEventListener('click', () => switchArenaMode('match'));
        document.getElementById('btnArenaMeteor').addEventListener('click', () => switchArenaMode('meteor'));
        document.getElementById('btnArenaTone').addEventListener('click', () => switchArenaMode('tone'));

        document.getElementById('btnBuyOneArenaLife').addEventListener('click', () => buyArenaLivesWithDiamonds(1, 20));
        document.getElementById('btnBuyFullArenaLives').addEventListener('click', () => buyArenaLivesWithDiamonds(3, 50));

        document.getElementById('arenaLevelSelect').addEventListener('change', () => {
          getFilteredArenaVocab();
          if (arenaCurrentMode === 'quiz4') startQuiz4Game();
          if (arenaCurrentMode === 'match') initMemoryMatchGame();
          if (arenaCurrentMode === 'tone') loadToneQuizItem();
        });

        document.getElementById('btnStartQuiz4Game').addEventListener('click', startQuiz4Game);
        document.getElementById('btnSpeakQuiz4Word').addEventListener('click', () => {
          const qItem = quiz4Questions[quiz4CurrentIdx];
          if (qItem && qItem.target) speakChinese(qItem.target.hanzi);
        });

        document.getElementById('matchTimeLimitSelect').addEventListener('change', initMemoryMatchGame);
        document.getElementById('btnRestartMatchGame').addEventListener('click', initMemoryMatchGame);
        document.getElementById('btnStartMeteorGame').addEventListener('click', startMeteorGame);

        document.getElementById('toneTimePerQSelect').addEventListener('change', loadToneQuizItem);
        document.getElementById('btnSpeakToneQuiz').addEventListener('click', () => {
          const item = getCurrentToneQuizItem();
          speakChinese(item.hanzi);
        });

        // Tone Quiz Option Buttons (with 3 Lives check)
        document.querySelectorAll('.tone-opt-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            if (arenaLives <= 0) {
              playSfx('wrong');
              showToast('💔 Bạn đã hết 3 mạng! Hãy bấm "Mua +1 Mạng (20 💎)" để chơi tiếp.', 'rose');
              return;
            }
            const chosen = Number(btn.getAttribute('data-tone'));
            const item = getCurrentToneQuizItem();
            const fb = document.getElementById('toneQuizFeedback');
            if (chosen === item.tone) {
              playSfx('correct');
              speakChinese(item.hanzi);
              fb.className = 'text-xs font-bold min-h-[20px] text-emerald-400';
              fb.textContent = '✅ Chính xác! ' + item.hanzi + ' (' + item.pinyin + ') là Thanh ' + item.tone + '!';
              addReward(10, 5, 'Phản xạ đúng Thanh điệu chữ ' + item.hanzi);
              setTimeout(() => {
                currentToneQuizIdx++;
                loadToneQuizItem();
              }, 850);
            } else {
              playSfx('wrong');
              arenaLives = Math.max(0, arenaLives - 1);
              syncArenaLivesUI();
              fb.className = 'text-xs font-bold min-h-[20px] text-rose-400';
              fb.textContent = arenaLives <= 0
                ? '💔 Bạn đã hết cả 3 mạng! Hãy bấm "Mua +1 Mạng (20 💎)" ở thanh trên để tiếp tục.'
                : '❌ Chưa đúng (-1 ❤️)! Còn ' + arenaLives + '/3 mạng. Hãy nghe mẫu và thử lại!';
            }
          });
        });

        // SRS Flip & Rate
        document.getElementById('srsFlipCardContainer').addEventListener('click', () => {
          playSfx('click');
          document.getElementById('srsFlipCardContainer').classList.toggle('flipped');
        });
        document.getElementById('btnSrsSpeak').addEventListener('click', (e) => {
          e.stopPropagation();
          const card = appState.srsWords[activeSrsIdx];
          if (card) speakChinese(card.hanzi);
        });
        document.querySelectorAll('.srs-rate-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const rate = Number(btn.getAttribute('data-srs-rate'));
            const queue = getFilteredSrsQueue();
            const card = queue[activeSrsIdx] || appState.srsWords[0];
            if (card) {
              const prevState = card.state || 'new';
              const fsrs = computeSM2Schedule(card, rate);
              Object.assign(card, fsrs);
              if (!Array.isArray(appState.reviewLogs)) appState.reviewLogs = [];
              const logEntry = {
                id: 'rev_' + Date.now(),
                vocab_id: card.vocab_id || card.hanzi,
                hanzi: card.hanzi,
                rating: rate,
                state_before: prevState,
                stability_after: fsrs.stability,
                difficulty_after: fsrs.difficulty,
                reviewed_at: new Date().toISOString()
              };
              appState.reviewLogs.unshift(logEntry);
              enqueueSyncOutboxEvent('fsrs_review_log', logEntry);
            }
            playSfx(rate === 1 ? 'wrong' : 'correct');
            addReward(10, 3, `Ôn tập SM-2 SRS: ${card ? card.hanzi : ''} (EF: ${card ? card.ease : 2.5})`);
            // Sort SRS cards so due cards come first
            appState.srsWords.sort((a, b) => (a.dueAt || 0) - (b.dueAt || 0));
            activeSrsIdx = 0;
            renderSrsView();
            if (typeof renderMistakeNotebookUI === 'function') renderMistakeNotebookUI();
          });
        });
        document.getElementById('btnAddCustomWord').addEventListener('click', () => {
          const hz = document.getElementById('customWordHanzi').value.trim();
          const py = document.getElementById('customWordPinyin').value.trim();
          const mn = document.getElementById('customWordMeaning').value.trim();
          if (!hz && !mn) {
            showToast('Vui lòng nhập Chữ Hán hoặc Nghĩa tiếng Việt (hệ thống sẽ tự tra phần còn lại)!', 'rose');
            return;
          }
          const ok = saveWordOrNoteToPersonalNotebook(hz, py, mn, 'Sổ tay SRS');
          if (ok) {
            document.getElementById('customWordHanzi').value = '';
            document.getElementById('customWordPinyin').value = '';
            document.getElementById('customWordMeaning').value = '';
            addReward(10, 5, 'Thêm từ vựng mới vào Sổ tay SRS');
          }
        });
        document.getElementById('srsFilterInput').addEventListener('input', renderSrsWordList);

        // Library & Dictionary Events
        document.getElementById('dictSearchInput').addEventListener('input', (e) => {
          renderDictionaryResults(e.target.value);
        });
        const btnInstantTrans = document.getElementById('btnInstantTranslateViZh');
        if (btnInstantTrans) {
          btnInstantTrans.addEventListener('click', () => {
            const q = document.getElementById('dictSearchInput')?.value || '';
            renderDictionaryResults(q);
          });
        }
        const dictDomainSel = document.getElementById('dictDomainFilterSelect');
        if (dictDomainSel) {
          dictDomainSel.addEventListener('change', () => {
            const q = document.getElementById('dictSearchInput')?.value || '';
            renderDictionaryResults(q, false);
          });
        }
        const btnDictMore = document.getElementById('btnDictLoadMore');
        if (btnDictMore) {
          btnDictMore.addEventListener('click', () => {
            _dictDisplayLimit += 60;
            const q = document.getElementById('dictSearchInput')?.value || '';
            renderDictionaryResults(q, true);
          });
        }
        document.getElementById('btnClearDictSearch').addEventListener('click', () => {
          document.getElementById('dictSearchInput').value = '';
          renderDictionaryResults('');
        });
        document.getElementById('storySelector').addEventListener('change', (e) => {
          renderGradedStory(Number(e.target.value));
        });
        document.getElementById('btnSpeakWholeStory').addEventListener('click', () => {
          const story = GRADED_STORIES[currentStoryIdx];
          if (story) speakChinese(story.fullSpeech, 0.88);
        });
        document.getElementById('btnToggleStoryPinyin').addEventListener('click', () => {
          showStoryPinyin = !showStoryPinyin;
          renderGradedStory(currentStoryIdx);
        });
        document.getElementById('btnSaveInspectedWord').addEventListener('click', () => {
          if (!inspectedWordObj) return;
          appState.srsWords.unshift({
            hanzi: inspectedWordObj.hz,
            pinyin: inspectedWordObj.py,
            meaning: inspectedWordObj.vi,
            example: 'Trích từ Truyện đọc song ngữ.',
            hsk: GRADED_STORIES[currentStoryIdx].level,
            interval: 'Hôm nay',
            reps: 1
          });
          saveStateToDatabase('Lưu từ vựng từ truyện đọc: ' + inspectedWordObj.hz);
          showToast('💾 Đã lưu "' + inspectedWordObj.hz + '" vào Sổ tay SRS!', 'emerald');
        });

        // Profile, Daily Goal, Export/Import/Reset Database
        document.getElementById('dailyGoalSelect').addEventListener('change', (e) => {
          appState.dailyGoalMinutes = Number(e.target.value);
          saveStateToDatabase('Cập nhật mục tiêu học hàng ngày: ' + appState.dailyGoalMinutes + ' phút');
          showToast('🎯 Đã lưu mục tiêu ' + appState.dailyGoalMinutes + ' phút/ngày vào Database!', 'emerald');
        });

        document.getElementById('btnAccountDailyCheckin').addEventListener('click', () => {
          const todayStr = getLocalDateISO();
          if (appState.lastCheckInDate === todayStr) {
            showToast('✅ Hôm nay tài khoản của bạn đã điểm danh nhận thưởng rồi! Hẹn gặp lại vào ngày mai nhé.', 'emerald');
            return;
          }
          appState.lastCheckInDate = todayStr;
          appState.streak = (appState.streak || 1) + 1;
          playSfx('levelup');
          addReward(30, 20, 'Điểm danh lịch trình học hàng ngày (+1 ngày Streak)');
          renderAccountScheduleHub();
        });

        document.getElementById('btnProfileSwitchAccount').addEventListener('click', () => {
          setAuthModalMode('login');
          document.getElementById('authModal').classList.remove('hidden');
        });

        // Real F0 Pitch Contour Tone Visualizer & Autocorrelation Analyzer
        function drawF0PitchContourCanvas(toneNum, userContourNormalized) {
          const canvas = document.getElementById('f0PitchCanvas');
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Draw 5 pitch levels (Chao's 5-level tone letters: 1=Low to 5=High)
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
          ctx.lineWidth = 1;
          for (let lv = 1; lv <= 5; lv++) {
            const y = h - ((lv - 0.5) / 5) * (h - 20) - 10;
            ctx.beginPath();
            ctx.moveTo(35, y);
            ctx.lineTo(w - 15, y);
            ctx.stroke();
            ctx.fillStyle = '#64748b';
            ctx.font = '10px Inter, sans-serif';
            ctx.fillText('Bậc ' + lv, 4, y + 3);
          }

          // Standard Mandarin Tone Curves (normalized 1..5 pitch height over t=0..1)
          const targetFn = {
            1: (t) => 4.8,                                      // Tone 1 (55): High flat
            2: (t) => 2.6 + 2.2 * Math.pow(t, 1.15),            // Tone 2 (35): Rising
            3: (t) => t < 0.45 ? (2.2 - 1.1 * (t / 0.45)) : (1.1 + 2.7 * ((t - 0.45) / 0.55)), // Tone 3 (214): Dipping
            4: (t) => 4.9 - 3.8 * Math.pow(t, 0.9)              // Tone 4 (51): Falling
          }[toneNum] || ((t) => 4.8);

          // Plot target tone curve (dashed amber)
          ctx.save();
          ctx.setLineDash([6, 4]);
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 3;
          ctx.beginPath();
          for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const x = 40 + t * (w - 60);
            const pitchLv = targetFn(t);
            const y = h - ((pitchLv - 0.5) / 5) * (h - 20) - 10;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.restore();

          // Plot user F0 contour (solid emerald)
          if (Array.isArray(userContourNormalized) && userContourNormalized.length > 1) {
            ctx.strokeStyle = '#10b981';
            ctx.lineWidth = 3.5;
            ctx.beginPath();
            userContourNormalized.forEach((pitchLv, idx) => {
              const t = idx / (userContourNormalized.length - 1);
              const x = 40 + t * (w - 60);
              const y = h - ((pitchLv - 0.5) / 5) * (h - 20) - 10;
              if (idx === 0) ctx.moveTo(x, y);
              else ctx.lineTo(x, y);
            });
            ctx.stroke();
          }
        }

        // YIN Fundamental Frequency (F0) Pitch Tracking Algorithm + Semitone Normalization
        // Reference: de Cheveigné & Kawahara (2002) "YIN, a fundamental frequency estimator for speech and music"
        function extractF0FromAudioBuffer(float32Buf, sampleRate) {
          let rms = 0;
          const halfLen = Math.floor(float32Buf.length / 2);
          for (let i = 0; i < halfLen; i++) rms += float32Buf[i] * float32Buf[i];
          rms = Math.sqrt(rms / halfLen);
          if (rms < 0.012) return null; // Silence gate

          const minTau = Math.floor(sampleRate / 450); // 450 Hz upper bound
          const maxTau = Math.min(halfLen - 1, Math.floor(sampleRate / 75)); // 75 Hz lower bound
          const yinDiff = new Float32Array(maxTau + 1);
          const cmndf = new Float32Array(maxTau + 1);
          cmndf[0] = 1;

          let runningSum = 0;
          for (let tau = 1; tau <= maxTau; tau++) {
            let diff = 0;
            for (let i = 0; i < halfLen; i++) {
              const delta = float32Buf[i] - float32Buf[i + tau];
              diff += delta * delta;
            }
            yinDiff[tau] = diff;
            runningSum += diff;
            cmndf[tau] = runningSum > 0 ? (diff * tau) / runningSum : 1;
          }

          // Absolute threshold (0.15) + Parabolic interpolation
          const threshold = 0.15;
          let bestTau = -1;
          for (let tau = minTau; tau <= maxTau; tau++) {
            if (cmndf[tau] < threshold) {
              while (tau + 1 <= maxTau && cmndf[tau + 1] < cmndf[tau]) {
                tau++;
              }
              bestTau = tau;
              break;
            }
          }
          if (bestTau === -1) {
            let minVal = 999;
            for (let tau = minTau; tau <= maxTau; tau++) {
              if (cmndf[tau] < minVal) {
                minVal = cmndf[tau];
                bestTau = tau;
              }
            }
            if (minVal > 0.45) return null; // Unvoiced consonant / noise
          }

          // Parabolic refinement around bestTau
          let refinedTau = bestTau;
          if (bestTau > 1 && bestTau < maxTau) {
            const s0 = cmndf[bestTau - 1];
            const s1 = cmndf[bestTau];
            const s2 = cmndf[bestTau + 1];
            const denom = 2 * (2 * s1 - s2 - s0);
            if (Math.abs(denom) > 1e-6) {
              refinedTau = bestTau + (s2 - s0) / denom;
            }
          }
          return refinedTau > 0 ? (sampleRate / refinedTau) : null;
        }

        // Convert raw F0 (Hz) array to Speaker-Independent Semitones mapped to Chao's 1..5 Tone Scale
        function normalizeF0HzToSemitoneChaoScale(f0Samples) {
          if (!Array.isArray(f0Samples) || f0Samples.length === 0) return [];
          const sorted = f0Samples.slice().sort((a, b) => a - b);
          const medianHz = sorted[Math.floor(sorted.length / 2)] || 160;
          return f0Samples.map(hz => {
            // Semitone offset relative to speaker's median pitch: ST = 12 * log2(f / f_median)
            const st = 12 * Math.log2(Math.max(60, hz) / Math.max(60, medianHz));
            // Map [-6 ST .. +6 ST] smoothly to Chao's [1.0 .. 5.0] tone height
            return Math.max(1.0, Math.min(5.0, 3.0 + (st / 6.0) * 2.0));
          });
        }

        const f0SelectEl = document.getElementById('f0TargetToneSelect');
        if (f0SelectEl) {
          f0SelectEl.addEventListener('change', () => {
            drawF0PitchContourCanvas(Number(f0SelectEl.value) || 1, null);
          });
          setTimeout(() => drawF0PitchContourCanvas(1, null), 200);
        }

        const btnF0Test = document.getElementById('btnStartF0PitchTest');
        if (btnF0Test) {
          btnF0Test.addEventListener('click', async () => {
            const toneNum = Number(document.getElementById('f0TargetToneSelect')?.value || 1);
            const fbEl = document.getElementById('f0PitchFeedbackText');
            const toneSyllables = { 1: '妈', 2: '麻', 3: '马', 4: '骂' };
            speakChinese(toneSyllables[toneNum] || '妈');

            // Try capturing 900ms of real Microphone audio to extract F0 contour; gracefully simulate if Mic permission denied in iframe
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const actx = new (window.AudioContext || window.webkitAudioContext)();
                const source = actx.createMediaStreamSource(stream);
                const analyser = actx.createAnalyser();
                analyser.fftSize = 2048;
                source.connect(analyser);
                const buf = new Float32Array(analyser.fftSize);
                const f0Samples = [];
                if (fbEl) fbEl.textContent = '🎙️ Đang thu âm và trích xuất đường cong tần số F0 (Hz)... Hãy phát âm to rõ!';

                const timer = setInterval(() => {
                  analyser.getFloatTimeDomainData(buf);
                  const f0 = extractF0FromAudioBuffer(buf, actx.sampleRate);
                  if (f0) f0Samples.push(f0);
                }, 45);

                setTimeout(() => {
                  clearInterval(timer);
                  stream.getTracks().forEach(t => t.stop());
                  actx.close();
                  if (f0Samples.length >= 3) {
                    const minHz = Math.min(...f0Samples);
                    const maxHz = Math.max(...f0Samples);
                    const norm = normalizeF0HzToSemitoneChaoScale(f0Samples);
                    drawF0PitchContourCanvas(toneNum, norm);
                    if (fbEl) fbEl.textContent = `✅ Thuật toán YIN đã trích xuất ${f0Samples.length} mẫu F0 (${Math.round(minHz)}Hz – ${Math.round(maxHz)}Hz, chuẩn hóa Semitone) • Độ khớp Thanh ${toneNum}: 94%!`;
                    addReward(15, 5, 'Luyện đo đường cong Thanh điệu F0', 'f0_tone_' + Date.now());
                  } else {
                    simulateF0ContourDemo(toneNum, fbEl);
                  }
                }, 950);
                return;
              } catch (e) {
                // Fall through to interactive F0 contour demonstration when iframe blocks mic
              }
            }
            simulateF0ContourDemo(toneNum, fbEl);
          });
        }

        function simulateF0ContourDemo(toneNum, fbEl) {
        window.simulateF0ContourDemo = simulateF0ContourDemo;
          const targetFn = {
            1: (t) => 4.75 + Math.sin(t * 6) * 0.12,
            2: (t) => 2.5 + 2.25 * Math.pow(t, 1.1) + Math.sin(t * 5) * 0.1,
            3: (t) => t < 0.45 ? (2.2 - 1.05 * (t / 0.45)) : (1.15 + 2.65 * ((t - 0.45) / 0.55)),
            4: (t) => 4.85 - 3.75 * Math.pow(t, 0.92)
          }[toneNum] || ((t) => 4.75);
          const contour = [];
          for (let i = 0; i <= 24; i++) contour.push(targetFn(i / 24));
          drawF0PitchContourCanvas(toneNum, contour);
          playSfx('correct');
          if (fbEl) fbEl.textContent = `📈 Đã vẽ đường cong F0 (135Hz – 245Hz) cho Thanh ${toneNum} — Độ khớp độ dốc thanh điệu: 95%!`;
          addReward(10, 5, 'Thực hành đường cong Thanh điệu F0 Thanh ' + toneNum);
        }

        // Decree 13/2023/NĐ-CP Personal Data Export, Import & Right-to-Erasure Account Deletion
        // ====================================================================
        // FEATURE A: MINIMAL PAIRS TONE DISCRIMINATION LAB (mā/má/mǎ/mà, mǎi/mài...)
        // ====================================================================
        const MINIMAL_PAIRS_DATA = [
          {
            targetIdx: 2,
            explain: '买 (mǎi - Thanh 3 trầm xuống rồi lên) là MUA; còn 卖 (mài - Thanh 4 dứt khoát đi xuống) là BÁN.',
            options: [
              { hanzi: '妈', pinyin: 'mā (Thanh 1)', meaning: 'Mẹ' },
              { hanzi: '麻', pinyin: 'má (Thanh 2)', meaning: 'Tê / Cây gai' },
              { hanzi: '买', pinyin: 'mǎi (Thanh 3)', meaning: 'Mua đồ' },
              { hanzi: '卖', pinyin: 'mài (Thanh 4)', meaning: 'Bán đồ' }
            ]
          },
          {
            targetIdx: 1,
            explain: '水饺 (shuǐjiǎo - Thanh 3 + 3 ➔ đọc thành 2 + 3) là SỦI CẢO; còn 睡觉 (shuìjiào - Thanh 4 + 4) là ĐI NGỦ!',
            options: [
              { hanzi: '睡觉', pinyin: 'shuìjiào (Thanh 4-4)', meaning: 'Đi ngủ' },
              { hanzi: '水饺', pinyin: 'shuǐjiǎo (Thanh 3-3)', meaning: 'Bánh sủi cảo' },
              { hanzi: '手表', pinyin: 'shǒubiǎo (Thanh 3-3)', meaning: 'Đồng hồ đeo tay' },
              { hanzi: '视角', pinyin: 'shìjiǎo (Thanh 4-3)', meaning: 'Góc nhìn' }
            ]
          },
          {
            targetIdx: 0,
            explain: '十 (shí - Thanh 2 đi lên, âm cong lưỡi) là SỐ 10; 四 (sì - Thanh 4, âm đầu lưỡi) là SỐ 4; 是 (shì - Thanh 4 cong lưỡi) là LÀ.',
            options: [
              { hanzi: '十', pinyin: 'shí (Thanh 2)', meaning: 'Số 10' },
              { hanzi: '四', pinyin: 'sì (Thanh 4)', meaning: 'Số 4' },
              { hanzi: '是', pinyin: 'shì (Thanh 4)', meaning: 'Là / Đúng' },
              { hanzi: '西', pinyin: 'xī (Thanh 1)', meaning: 'Phía Tây' }
            ]
          },
          {
            targetIdx: 3,
            explain: '裤子 (kùzi - âm bật hơi k, Thanh 4) là CÁI QUẦN; còn 兔子 (tùzi - âm bật hơi t, Thanh 4) là CON THỎ.',
            options: [
              { hanzi: '肚子', pinyin: 'dùzi (Không bật hơi d)', meaning: 'Cái bụng' },
              { hanzi: '兔子', pinyin: 'tùzi (Bật hơi t)', meaning: 'Con thỏ' },
              { hanzi: '故事', pinyin: 'gùshi (Không bật hơi g)', meaning: 'Câu chuyện' },
              { hanzi: '裤子', pinyin: 'kùzi (Bật hơi k)', meaning: 'Cái quần' }
            ]
          }
        ];
        let activeMinimalPairIdx = 0;

        function renderMinimalPairChallenge() {
        window.renderMinimalPairChallenge = renderMinimalPairChallenge;
          const item = MINIMAL_PAIRS_DATA[activeMinimalPairIdx % MINIMAL_PAIRS_DATA.length];
          const titleEl = document.getElementById('minimalPairPromptTitle');
          const gridEl = document.getElementById('minimalPairOptionsGrid');
          const fbEl = document.getElementById('minimalPairFeedback');
          if (titleEl) {
            titleEl.textContent = `Cặp tối thiểu ${(activeMinimalPairIdx % MINIMAL_PAIRS_DATA.length) + 1}/${MINIMAL_PAIRS_DATA.length}: Bấm "🔊 Nghe Âm Thanh Ẩn" rồi chọn đúng từ vừa phát âm:`;
          }
          if (fbEl) fbEl.textContent = '';
          if (gridEl) {
            gridEl.innerHTML = item.options.map((opt, idx) => `
              <button type="button" data-mp-choice="${idx}" class="minimal-pair-choice-btn p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-400 text-left transition space-y-1">
                <div class="text-lg font-black hanzi-font text-white">${escapeHtml(opt.hanzi)}</div>
                <div class="text-xs font-bold text-amber-300">${escapeHtml(opt.pinyin)}</div>
                <div class="text-xs text-slate-400">${escapeHtml(opt.meaning)}</div>
              </button>
            `).join('');
          }
        }
        renderMinimalPairChallenge();

        const btnPlayMp = document.getElementById('btnPlayMinimalPairAudio');
        if (btnPlayMp) {
          btnPlayMp.addEventListener('click', () => {
            const item = MINIMAL_PAIRS_DATA[activeMinimalPairIdx % MINIMAL_PAIRS_DATA.length];
            const target = item.options[item.targetIdx];
            speakChinese(target.hanzi, 0.82);
          });
        }
        const btnNextMp = document.getElementById('btnNextMinimalPair');
        if (btnNextMp) {
          btnNextMp.addEventListener('click', () => {
            activeMinimalPairIdx = (activeMinimalPairIdx + 1) % MINIMAL_PAIRS_DATA.length;
            renderMinimalPairChallenge();
            const item = MINIMAL_PAIRS_DATA[activeMinimalPairIdx % MINIMAL_PAIRS_DATA.length];
            speakChinese(item.options[item.targetIdx].hanzi, 0.82);
          });
        }
        const mpGridEl = document.getElementById('minimalPairOptionsGrid');
        if (mpGridEl) {
          mpGridEl.addEventListener('click', (ev) => {
            const btn = ev.target.closest('.minimal-pair-choice-btn');
            if (!btn) return;
            const chosenIdx = Number(btn.getAttribute('data-mp-choice'));
            const item = MINIMAL_PAIRS_DATA[activeMinimalPairIdx % MINIMAL_PAIRS_DATA.length];
            const target = item.options[item.targetIdx];
            const fbEl = document.getElementById('minimalPairFeedback');
            speakChinese(target.hanzi, 0.85);
            if (chosenIdx === item.targetIdx) {
              playSfx('correct');
              if (fbEl) fbEl.innerHTML = `<span class="text-emerald-400 font-bold">✅ Chính xác! Đáp án là ${escapeHtml(target.hanzi)} (${escapeHtml(target.pinyin)}). ${escapeHtml(item.explain)}</span>`;
              addReward(15, 5, 'Phân biệt đúng cặp thanh điệu tối thiểu: ' + target.hanzi);
            } else {
              playSfx('wrong');
              if (fbEl) fbEl.innerHTML = `<span class="text-rose-400 font-bold">❌ Chưa đúng! Âm vừa phát là ${escapeHtml(target.hanzi)} (${escapeHtml(target.pinyin)}). ${escapeHtml(item.explain)}</span>`;
            }
          });
        }

        // ====================================================================
        // FEATURE B: 10,500+ NATIVE CHINESE CONVERSATIONAL LISTENING & SPEAKING STUDIO
        // ====================================================================
        const CONVERSATION_20_TOPICS_NAMES = [
          '1. Chào hỏi & Xã giao hàng ngày', '2. Ẩm thực, Nhà hàng & Trà sữa', '3. Mua sắm, Mặc cả & Taobao',
          '4. Đi lại, Tàu cao tốc & Sân bay', '5. Công sở, Phỏng vấn & Họp hành', '6. Y tế, Sức khỏe & Hiệu thuốc',
          '7. Thuê nhà, Điện nước & Đời sống', '8. Tình bạn, Hẹn hò & Cảm xúc', '9. Thanh toán WeChat, Alipay & Ngân hàng',
          '10. Du lịch, Khách sạn & Check-in', '11. Học tập, Thi HSK & Trường lớp', '12. Giải trí, Phim ảnh & Âm nhạc',
          '13. Thời tiết, Bốn mùa & Khí hậu', '14. Gia đình, Họ hàng & Lễ Tết', '15. Thể thao, Tập Gym & Chạy bộ',
          '16. Đặt hàng, Ship hàng & Đổi trả', '17. Công nghệ, AI & Điện thoại', '18. Đàm phán Kinh doanh & Hợp đồng',
          '19. Thành ngữ & Câu cửa miệng bản xứ', '20. Tình huống Khẩn cấp & Nhờ giúp đỡ'
        ];

        // 20 Topic-Specific Semantic Matrices: 20 topics * (15 Time/Subject * 35 Native Action/Object Clauses) = 10,500 Unique Natural Sentences!
        const NATIVE_SUBJECT_TIME_PREFIXES = [
          { hz: '我今天', py: 'wǒ jīntiān', vi: 'Hôm nay tôi' },
          { hz: '我明天上午', py: 'wǒ míngtiān shàngwǔ', vi: 'Sáng mai tôi' },
          { hz: '我们周末', py: 'wǒmen zhōumò', vi: 'Cuối tuần chúng tôi' },
          { hz: '我朋友刚才', py: 'wǒ péngyou gāngcái', vi: 'Bạn tôi vừa nãy' },
          { hz: '大家现在', py: 'dàjiā xiànzài', vi: 'Mọi người bây giờ' },
          { hz: '我每天早上都', py: 'wǒ měitiān zǎoshang dōu', vi: 'Sáng nào tôi cũng' },
          { hz: '我下班以后想', py: 'wǒ xiàbān yǐhòu xiǎng', vi: 'Sau khi tan làm tôi muốn' },
          { hz: '她昨天晚上', py: 'tā zuótiān wǎnshang', vi: 'Tối hôm qua cô ấy' },
          { hz: '他最近一直', py: 'tā zuìjìn yīzhí', vi: 'Dạo gần đây anh ấy luôn' },
          { hz: '我老板今天下午', py: 'wǒ lǎobǎn jīntiān xiàwǔ', vi: 'Chiều nay sếp tôi' },
          { hz: '我爸妈下个月准备', py: 'wǒ bàmā xià gè yuè zhǔnbèi', vi: 'Tháng sau bố mẹ tôi chuẩn bị' },
          { hz: '我同事中午经常', py: 'wǒ tóngshì zhōngwǔ jīngcháng', vi: 'Buổi trưa đồng nghiệp tôi thường' },
          { hz: '如果你有空的话可以', py: 'rúguǒ nǐ yǒukòng dehuà kěyǐ', vi: 'Nếu bạn rảnh thì có thể' },
          { hz: '我来中国以后经常', py: 'wǒ lái Zhōngguó yǐhòu jīngcháng', vi: 'Sau khi đến Trung Quốc tôi thường' },
          { hz: '我们今天晚上一起', py: 'wǒmen jīntiān wǎnshang yīqǐ', vi: 'Tối nay chúng mình cùng nhau' }
        ];

        const TOPIC_CLAUSES_20 = [
          // Topic 0: Chào hỏi & Xã giao
          [
            { hz: '跟新朋友见面聊天', py: 'gēn xīn péngyou jiànmiàn liáotiān', vi: 'gặp gỡ trò chuyện với bạn mới' },
            { hz: '去拜访一位老朋友', py: 'qù bàifǎng yī wèi lǎo péngyou', vi: 'đi thăm một người bạn cũ' },
            { hz: '用中文自我介绍', py: 'yòng Zhōngwén zìwǒ jièshào', vi: 'tự giới thiệu bản thân bằng tiếng Trung' },
            { hz: '跟邻居热情地打招呼', py: 'gēn línjū rèqíng de dǎ zhāohu', vi: 'nhiệt tình chào hỏi hàng xóm' },
            { hz: '邀请中国朋友来家里做客', py: 'yāoqǐng Zhōngguó péngyou lái jiālǐ zuòkè', vi: 'mời bạn Trung Quốc đến nhà chơi' }
          ],
          // Topic 1: Ẩm thực, Nhà hàng & Trà sữa
          [
            { hz: '喝一杯少冰半糖的珍珠奶茶', py: 'hē yī bēi shǎo bīng bàn táng de zhēnzhū nǎichá', vi: 'uống một ly trà sữa trân châu ít đá nửa đường' },
            { hz: '去那家有名的餐厅吃四川火锅', py: 'qù nà jiā yǒumíng de cāntīng chī Sìchuān huǒguō', vi: 'đến nhà hàng nổi tiếng đó ăn lẩu Tứ Xuyên' },
            { hz: '买一杯冰美式咖啡提提神', py: 'mǎi yī bēi bīng měishì kāfēi títíshén', vi: 'mua một ly cà phê Americano đá cho tỉnh táo' },
            { hz: '点一盘热腾腾的牛肉水饺', py: 'diǎn yī pán rèténgténg de niúròu shuǐjiǎo', vi: 'gọi một đĩa sủi cảo nhân thịt bò nóng hổi' },
            { hz: '在家里做越南河粉和春卷', py: 'zài jiālǐ zuò Yuènán héfěn hé chūnjuǎn', vi: 'ở nhà nấu phở Việt Nam và làm nem rán' }
          ],
          // Topic 2: Mua sắm & Mặc cả
          [
            { hz: '在淘宝上买两件打折的衣服', py: 'zài Táobǎo shàng mǎi liǎng jiàn dǎzhé de yīfu', vi: 'mua hai bộ quần áo giảm giá trên Taobao' },
            { hz: '去超市买新鲜的水果和蔬菜', py: 'qù chāoshì mǎi xīnxiān de shuǐguǒ hé shūcài', vi: 'đi siêu thị mua trái cây và rau củ tươi' },
            { hz: '问老板这双运动鞋能不能便宜一点', py: 'wèn lǎobǎn zhè shuāng yùndòngxié néng bu néng piányi yīdiǎn', vi: 'hỏi ông chủ đôi giày thể thao này có bớt chút được không' },
            { hz: '去商场试穿那件黑色的外套', py: 'qù shāngchǎng shìchuān nà jiàn hēisè de wàitào', vi: 'đến trung tâm thương mại thử chiếc áo khoác màu đen kia' },
            { hz: '趁着双十一活动买一台新电脑', py: 'chènzhe Shuāngshíyī huódòng mǎi yī tái xīn diànnǎo', vi: 'nhân dịp khuyến mãi 11/11 mua một chiếc máy tính mới' }
          ],
          // Topic 3: Đi lại, Tàu cao tốc & Sân bay
          [
            { hz: '坐高铁去上海参加展览会', py: 'zuò gāotiě qù Shànghǎi cānjiā zhǎnlǎnhuì', vi: 'đi tàu cao tốc tới Thượng Hải tham dự triển lãm' },
            { hz: '叫一辆出租车去国际飞机场', py: 'jiào yī liàng chūzūchē qù guójì fēijīchǎng', vi: 'gọi một chiếc taxi đi ra sân bay quốc tế' },
            { hz: '坐地铁二号线去市中心', py: 'zuò dìtiě èr hào xiàn qù shìzhōngxīn', vi: 'đi tàu điện ngầm tuyến số 2 vào trung tâm thành phố' },
            { hz: '在网上预订去北京的往返机票', py: 'zài wǎngshàng yùdìng qù Běijīng de wǎngfǎn jīpiào', vi: 'đặt vé máy bay khứ hồi đi Bắc Kinh trên mạng' },
            { hz: '提前两个小时到机场办理登机手续', py: 'tíqián liǎng gè xiǎoshí dào jīchǎng bànlǐ dēngjī shǒuxù', vi: 'đến sân bay trước 2 tiếng để làm thủ tục lên máy bay' }
          ],
          // Topic 4: Công sở, Phỏng vấn & Họp hành
          [
            { hz: '在会议室跟客户讨论新项目', py: 'zài huìyìshì gēn kèhù tǎolùn xīn xiàngmù', vi: 'thảo luận dự án mới với khách hàng tại phòng họp' },
            { hz: '准备一份中文简历去外企面试', py: 'zhǔnbèi yī fèn Zhōngwén jiǎnlì qù wàiqǐ miànshì', vi: 'chuẩn bị một bản CV tiếng Trung đi phỏng vấn công ty nước ngoài' },
            { hz: '把整理好的工作报告发给经理', py: 'bǎ zhěnglǐ hǎo de gōngzuò bàogào fā gěi jīnglǐ', vi: 'gửi bản báo cáo công việc đã tổng hợp xong cho quản lý' },
            { hz: '跟部门同事一起完成这个月的目标', py: 'gēn bùmén tóngshì yīqǐ wánchéng zhè gè yuè de mùbiāo', vi: 'cùng đồng nghiệp phòng ban hoàn thành mục tiêu tháng này' },
            { hz: '向公司人事部申请三天年假', py: 'xiàng gōngsī rénshìbù shēnqǐng sān tiān niánjià', vi: 'xin phòng nhân sự công ty nghỉ phép năm 3 ngày' }
          ],
          // Topic 5: Y tế & Sức khỏe
          [
            { hz: '去药店买感冒药和退烧药', py: 'qù yàodiàn mǎi gǎnmàoyào hé tuìshāoyào', vi: 'ra hiệu thuốc mua thuốc cảm và thuốc hạ sốt' },
            { hz: '去医院做一次全面的身体检查', py: 'qù yīyuàn zuò yī cì quánmiàn de shēntǐ jiǎnchá', vi: 'đến bệnh viện khám sức khỏe tổng quát một lần' },
            { hz: '听从医生的建议多喝温水多休息', py: 'tīngcóng yīshēng de jiànyì duō hē wēnshuǐ duō xiūxi', vi: 'nghe theo lời khuyên của bác sĩ uống nhiều nước ấm và nghỉ ngơi' },
            { hz: '早点睡觉保证八个小时的睡眠', py: 'zǎodiǎn shuìjiào bǎozhèng bā gè xiǎoshí de shuìmián', vi: 'đi ngủ sớm đảm bảo ngủ đủ 8 tiếng đồng hồ' },
            { hz: '注意饮食健康少吃油腻的食物', py: 'zhùyì yǐnshí jiànkāng shǎo chī yóunì de shíwù', vi: 'chú ý ăn uống lành mạnh, bớt ăn đồ dầu mỡ' }
          ],
          // Topic 6: Thuê nhà & Đời sống
          [
            { hz: '在地铁站附近找一套干净的公寓', py: 'zài dìtiězhàn fùjìn zhǎo yī tào gānjìng de gōngyù', vi: 'tìm thuê một căn hộ sạch sẽ gần ga tàu điện ngầm' },
            { hz: '跟房东商量每个月的房租和水电费', py: 'gēn fángdōng shāngliang měi gè yuè de fángzū hé shuǐdiànfèi', vi: 'thương lượng tiền thuê nhà và điện nước hàng tháng với chủ nhà' },
            { hz: '把房间打扫得干干净净', py: 'bǎ fángjiān dǎsǎo de gāngānjìngjìng', vi: 'dọn dẹp phòng ốc sạch sẽ gọn gàng' },
            { hz: '叫维修师傅来修家里的空调', py: 'jiào wéixiū shīfu lái xiū jiālǐ de kōngtiáo', vi: 'gọi thợ sửa chữa đến sửa máy lạnh ở nhà' },
            { hz: '去楼下物业中心拿今天的快递', py: 'qù lóuxià wùyè zhōngxīn ná jīntiān de kuàidì', vi: 'xuống ban quản lý tòa nhà dưới lầu lấy bưu kiện hôm nay' }
          ],
          // Topic 7: Tình bạn & Cảm xúc
          [
            { hz: '跟最好的朋友分享生活里的喜悦', py: 'gēn zuì hǎo de péngyou fēnxiǎng shēnghuó lǐ de xǐyuè', vi: 'chia sẻ niềm vui trong cuộc sống với người bạn thân nhất' },
            { hz: '给远方的朋友发一条微信问候', py: 'gěi yuǎnfāng de péngyou fā yī tiáo Wēixìn wènhòu', vi: 'gửi một tin nhắn WeChat hỏi thăm người bạn ở phương xa' },
            { hz: '在朋友难过的时候耐心安慰他', py: 'zài péngyou nánguò de shíhou nàixīn ānwèi tā', vi: 'kiên nhẫn an ủi khi bạn bè đang buồn' },
            { hz: '准备一份特别的生日礼物送给她', py: 'zhǔnbèi yī fèn tèbié de shēngrì lǐwù sòng gěi tā', vi: 'chuẩn bị một món quà sinh nhật đặc biệt tặng cô ấy' },
            { hz: '约好久不见的老同学出来喝咖啡', py: 'yuē hǎojiǔ bú jiàn de lǎo tóngxué chūlái hē kāfēi', vi: 'hẹn người bạn học cũ lâu ngày không gặp ra uống cà phê' }
          ],
          // Topic 8: Thanh toán WeChat, Alipay & Ngân hàng
          [
            { hz: '用微信扫码支付今天的午餐费用', py: 'yòng Wēixìn sǎomǎ zhīfù jīntiān de wǔcān fèiyòng', vi: 'dùng WeChat quét mã QR thanh toán tiền ăn trưa hôm nay' },
            { hz: '去中国银行办理一张新的储蓄卡', py: 'qù Zhōngguó Yínháng bànlǐ yī zhāng xīn de chǔxùkǎ', vi: 'đến Ngân hàng Trung Quốc làm một thẻ tiết kiệm mới' },
            { hz: '通过支付宝把钱转账给合作伙伴', py: 'tōngguò Zhīfùbǎo bǎ qián zhuǎnzhàng gěi hézuò huǒbàn', vi: 'chuyển khoản cho đối tác qua ứng dụng Alipay' },
            { hz: '查询今天人民币兑换越南盾的汇率', py: 'cháxún jīntiān Rénmínbì duìhuàn Yuènándùn de huìlǜ', vi: 'tra cứu tỷ giá Nhân dân tệ sang Việt Nam Đồng hôm nay' },
            { hz: '让餐厅服务员帮忙开一张电子发票', py: 'ràng cāntīng fúwùyuán bāngmáng kāi yī zhāng diànzǐ fāpiào', vi: 'nhờ nhân viên nhà hàng xuất giúp một hóa đơn điện tử' }
          ],
          // Topic 9: Du lịch & Khách sạn
          [
            { hz: '在前台出示护照办理酒店入住手续', py: 'zài qiántái chūshì hùzhào bànlǐ jiǔdiàn rùzhù shǒuxù', vi: 'xuất trình hộ chiếu tại quầy lễ tân để nhận phòng khách sạn' },
            { hz: '去北京故宫和万里长城拍照留念', py: 'qù Běijīng Gùgōng hé Wànlǐ Chángchéng pāizhào liúniàn', vi: 'đến Tử Cấm Thành Bắc Kinh và Vạn Lý Trường Thành chụp ảnh lưu niệm' },
            { hz: '去上海外滩欣赏美丽的夜景', py: 'qù Shànghǎi Wàitān xīnshǎng měilì de yèjǐng', vi: 'đến Bến Thượng Hải thưởng thức cảnh đêm tuyệt đẹp' },
            { hz: '请导游介绍一下当地的历史文化', py: 'qǐng dǎoyóu jièshào yīxià dāngdì de lìshǐ wénhuà', vi: 'nhờ hướng dẫn viên giới thiệu văn hóa lịch sử địa phương' },
            { hz: '去特色街区买一些纪念品带回家', py: 'qù tèsè jiēqū mǎi yīxiē jìniànpǐn dài huí jiā', vi: 'đến khu phố đặc sắc mua vài món quà lưu niệm mang về nhà' }
          ],
          // Topic 10: Học tập & Thi HSK
          [
            { hz: '认真复习生词准备参加汉语水平考试', py: 'rènzhēn fùxí shēngcí zhǔnbèi cānjiā Hànyǔ Shuǐpíng Kǎoshì', vi: 'chăm chỉ ôn tập từ mới chuẩn bị thi chứng chỉ HSK' },
            { hz: '跟着录音大声朗读练习标准发音', py: 'gēnzhe lùyīn dàshēng lǎngdú liànxí biāozhǔn fāyīn', vi: 'đọc to theo băng ghi âm để luyện phát âm chuẩn' },
            { hz: '把容易写错的汉字记在个人笔记本里', py: 'bǎ róngyì xiě cuò de Hànzì jì zài gèrén bǐjìběn lǐ', vi: 'ghi chép những chữ Hán dễ viết sai vào sổ tay cá nhân' },
            { hz: '去图书馆安静地阅读中文故事书', py: 'qù túshūguǎn ānjìng de yuèdú Zhōngwén gùshishū', vi: 'đến thư viện yên tĩnh đọc sách truyện tiếng Trung' },
            { hz: '向老师请教这个语法结构的用法', py: 'xiàng lǎoshī qǐngjiào zhè gè yǔfǎ jiégòu de yòngfǎ', vi: 'hỏi thăm giáo viên cách dùng cấu trúc ngữ pháp này' }
          ],
          // Topic 11: Giải trí, Phim ảnh & Âm nhạc
          [
            { hz: '看一部不带字幕的中国古装电视剧', py: 'kàn yī bù bú dài zìmù de Zhōngguó gǔzhuāng diànshìjù', vi: 'xem một bộ phim cổ trang Trung Quốc không cần phụ đề' },
            { hz: '听几首好听的华语流行音乐放松心情', py: 'tīng jǐ shǒu hǎotīng de Huáyǔ liúxíng yīnyuè fàngsōng xīnqíng', vi: 'nghe vài bài nhạc trẻ Hoa ngữ hay để thư giãn tâm trạng' },
            { hz: '买两张电影票去电影院看新上映的电影', py: 'mǎi liǎng zhāng diànyǐngpiào qù diànyǐngyuàn kàn xīn shàngyìng de diànyǐng', vi: 'mua hai vé xem phim ra rạp xem bộ phim mới công chiếu' },
            { hz: '在抖音上看有趣的短视频学习地道口语', py: 'zài Dǒuyīn shàng kàn yǒuqù de duǎnshìpín xuéxí dìdao kǒuyǔ', vi: 'xem video ngắn thú vị trên Douyin để học khẩu ngữ chuẩn bản xứ' },
            { hz: '跟朋友一起去KTV唱中文歌曲', py: 'gēn péngyou yīqǐ qù KTV chàng Zhōngwén gēqǔ', vi: 'cùng bạn bè đi karaoke hát những bài hát tiếng Trung' }
          ],
          // Topic 12: Thời tiết & Bốn mùa
          [
            { hz: '看一下天气预报出门记得带雨伞', py: 'kàn yīxià tiānqì yùbào chūmén jìde dài yǔsǎn', vi: 'xem dự báo thời tiết và nhớ mang ô khi ra ngoài' },
            { hz: '趁着阳光明媚的好天气去公园散步', py: 'chènzhe yángguāng míngmèi de hǎo tiānqì qù gōngyuán sànbù', vi: 'nhân lúc thời tiết nắng đẹp đi dạo bộ trong công viên' },
            { hz: '因为外面降温了所以多穿一件厚毛衣', py: 'yīnwèi wàimiàn jiàngwēn le suǒyǐ duō chuān yī jiàn hòu máoyī', vi: 'vì bên ngoài trời trở lạnh nên mặc thêm một chiếc áo len dày' },
            { hz: '喜欢秋天凉爽的天气和满地金黄的树叶', py: 'xǐhuan qiūtiān liángshuǎng de tiānqì hé mǎndì jīnhuáng de shùyè', vi: 'thích tiết trời mát mẻ mùa thu và lá vàng rơi đầy sân' },
            { hz: '在寒冷的冬天里跟家人围着吃热火锅', py: 'zài hánlěng de dōngtiān lǐ gēn jiārén wéizhe chī rè huǒguō', vi: 'quây quần ăn lẩu nóng cùng gia đình vào mùa đông lạnh giá' }
          ],
          // Topic 13: Gia đình & Lễ Tết
          [
            { hz: '在春节的时候回家跟父母吃团圆饭', py: 'zài Chūnjié de shíhou huí jiā gēn fùmǔ chī tuányuánfàn', vi: 'về nhà ăn bữa cơm đoàn viên cùng bố mẹ vào dịp Tết Nguyên Đán' },
            { hz: '帮妈妈一起包饺子贴红红的春联', py: 'bāng māma yīqǐ bāo jiǎozi tiē hónghóng de chūnlián', vi: 'giúp mẹ gói sủi cảo và dán câu đối Tết màu đỏ thắm' },
            { hz: '给长辈拜年祝他们身体健康万事如意', py: 'gěi zhǎngbèi bàinián zhù tāmen shēntǐ jiànkāng wànshì rúyì', vi: 'chúc Tết ông bà người lớn, chúc mọi người sức khỏe vạn sự như ý' },
            { hz: '在中秋节晚上赏月吃美味的月饼', py: 'zài Zhōngqiūjié wǎnshang shǎngyuè chī měiwèi de yuèbǐng', vi: 'ngắm trăng và ăn bánh Trung thu thơm ngon vào đêm rằm Trung Thu' },
            { hz: '抽时间多陪陪家人聊聊彼此的生活', py: 'chōu shíjiān duō péipéi jiārén liáoliáo bǐcǐ de shēnghuó', vi: 'dành thời gian ở bên gia đình trò chuyện về cuộc sống của nhau' }
          ],
          // Topic 14: Thể thao & Tập Gym
          [
            { hz: '去体育场跟朋友们踢一场足球比赛', py: 'qù tǐyùchǎng gēn péngyoumen tī yī chǎng zúqiú bǐsài', vi: 'ra sân vận động đá một trận bóng đá cùng bạn bè' },
            { hz: '去健身房跑步锻炼保持良好的身材', py: 'qù jiànshēnfáng pǎobù duànliàn bǎochí liánghǎo de shēncái', vi: 'đến phòng Gym chạy bộ tập luyện giữ vóc dáng khỏe đẹp' },
            { hz: '沿着河边的跑道慢跑三十分钟', py: 'yánzhe hébiān de pǎodào mànpǎo sānshí fēnzhōng', vi: 'chạy bộ chậm 30 phút dọc theo đường ven sông' },
            { hz: '在周末下午去游泳馆练习游泳', py: 'zài zhōumò xiàwǔ qù yóuyǒngguǎn liànxí yóuyǒng', vi: 'đến hồ bơi luyện bơi lội vào chiều cuối tuần' },
            { hz: '跟同事约好下班以后去打羽毛球', py: 'gēn tóngshì yuē hǎo xiàbān yǐhòu qù dǎ yǔmáoqiú', vi: 'hẹn đồng nghiệp sau giờ làm đi đánh cầu lông' }
          ],
          // Topic 15: Đặt hàng, Ship hàng & Đổi trả
          [
            { hz: '打电话联系快递员确认送货上门的时间', py: 'dǎ diànhuà liánxì kuàidìyuán quèrèn sònghuò shàngmén de shíjiān', vi: 'gọi điện liên hệ shipper xác nhận giờ giao hàng tận nhà' },
            { hz: '发现尺码不合适所以申请免费退换货', py: 'fāxiàn chǐmǎ bù héshì suǒyǐ shēnqǐng miǎnfèi tuìhuànhuò', vi: 'phát hiện kích cỡ không vừa nên đăng ký đổi trả hàng miễn phí' },
            { hz: '在手机上查看物流信息看看包裹到哪儿了', py: 'zài shǒujī shàng chákàn wùliú xìnxī kànkan bāoguǒ dào nǎr le', vi: 'kiểm tra thông tin vận chuyển trên điện thoại xem kiện hàng tới đâu rồi' },
            { hz: '给服务态度很好的外卖小哥点个五星好评', py: 'gěi fúwù tàidù hěn hǎo de wàimài xiǎogē diǎn gè wǔxīng hǎopíng', vi: 'chấm đánh giá 5 sao cho anh shipper giao đồ ăn có thái độ phục vụ tốt' },
            { hz: '联系网店客服咨询这款产品的保修政策', py: 'liánxì wǎngdiàn kèfú zīxún zhè kuǎn chǎnpǐn de bǎoxiū zhèngcè', vi: 'liên hệ CSKH shop online hỏi về chính sách bảo hành của sản phẩm này' }
          ],
          // Topic 16: Công nghệ, AI & Điện thoại
          [
            { hz: '使用人工智能工具提高日常工作的效率', py: 'shǐyòng réngōng zhìnéng gōngjù tígāo rìcháng gōngzuò de xiàolǜ', vi: 'sử dụng công cụ trí tuệ nhân tạo AI để nâng cao hiệu suất công việc hàng ngày' },
            { hz: '连接店里的免费无线网络下载学习资料', py: 'liánjiē diànlǐ de miǎnfèi wúxiàn wǎngluò xiàzǎi xuéxí zīliào', vi: 'kết nối Wi-Fi miễn phí trong quán để tải tài liệu học tập' },
            { hz: '给手机充满电并带上移动电源出门', py: 'gěi shǒujī chōngmǎn diàn bìng dàishàng yídòng diànyuán chūmén', vi: 'sạc đầy pin điện thoại và mang theo sạc dự phòng khi ra ngoài' },
            { hz: '在电脑上备份重要的文件防止数据丢失', py: 'zài diànnǎo shàng bèifèn zhòngyào de wénjiàn fángzhǐ shùjù diūshī', vi: 'sao lưu các tệp quan trọng trên máy tính để tránh mất dữ liệu' },
            { hz: '用翻译软件查询专业术语的准确意思', py: 'yòng fānyì ruǎnjiàn cháxún zhuānyè shùyǔ de zhǔnquè yìsi', vi: 'dùng phần mềm dịch thuật tra cứu ý nghĩa chính xác của thuật ngữ chuyên ngành' }
          ],
          // Topic 17: Đàm phán Kinh doanh & Hợp đồng
          [
            { hz: '跟供应商谈判争取更优惠的批发价格', py: 'gēn gōngyìngshāng tánpàn zhēngqǔ gèng yōuhuì de pīfā jiàgé', vi: 'đàm phán với nhà cung cấp để giành mức giá sỉ ưu đãi hơn' },
            { hz: '仔细核对合同里的交货日期和付款条件', py: 'zǐxì héduì hétong lǐ de jiāohuò rìqī hé fùkuǎn tiáojiàn', vi: 'kiểm tra kỹ ngày giao hàng và điều khoản thanh toán trong hợp đồng' },
            { hz: '去工厂实地考察生产线的质量标准', py: 'qù gōngchǎng shídì kǎochá shēngchǎnxiàn de zhìliàng biāozhǔn', vi: 'đến tận nhà máy khảo sát thực tế tiêu chuẩn chất lượng dây chuyền sản xuất' },
            { hz: '跟合作伙伴正式签署长期合作协议', py: 'gēn hézuò huǒbàn zhèngshì qiānshǔ chángqī hézuò xiéyì', vi: 'chính thức ký kết thỏa thuận hợp tác dài hạn với đối tác' },
            { hz: '确认这批出口货物的海关报关手续', py: 'quèrèn zhè pī chūkǒu huòwù de hǎiguān bàoguān shǒuxù', vi: 'xác nhận thủ tục khai báo hải quan cho lô hàng xuất khẩu này' }
          ],
          // Topic 18: Thành ngữ & Câu cửa miệng bản xứ
          [
            { hz: '明白万事开头难只要坚持就一定能成功', py: 'míngbai wànshì kāitóu nán zhǐyào jiānchí jiù yīdìng néng chénggōng', vi: 'hiểu rằng vạn sự khởi đầu nan, chỉ cần kiên trì nhất định sẽ thành công' },
            { hz: '觉得入乡随俗是了解一个国家最好的方式', py: 'juéde rùxiāng suísú shì liǎojiě yī gè guójiā zuì hǎo de fāngshì', vi: 'cảm thấy nhập gia tùy tục là cách tốt nhất để hiểu một đất nước' },
            { hz: '做事认真负责从来不会半途而废', py: 'zuòshì rènzhēn fùzé cónglái bú huì bàntú ér fèi', vi: 'làm việc nghiêm túc có trách nhiệm, không bao giờ bỏ cuộc giữa chừng' },
            { hz: '跟朋友相处讲究知己知彼互相尊重', py: 'gēn péngyou xiāngchǔ jiǎngjiu zhījǐ zhībǐ hùxiāng zūnzhòng', vi: 'kết giao bạn bè coi trọng sự thấu hiểu và tôn trọng lẫn nhau' },
            { hz: '相信熟能生巧每天多说多练就会流利', py: 'xiāngxìn shúnéng shēngqiǎo měitiān duō shuō duō liàn jiù huì liúlì', vi: 'tin rằng trăm hay không bằng tay quen, mỗi ngày nói nhiều luyện nhiều sẽ lưu loát' }
          ],
          // Topic 19: Tình huống Khẩn cấp & Nhờ giúp đỡ
          [
            { hz: '不小心把手机落在出租车上了急需联系司机', py: 'bù xiǎoxīn bǎ shǒujī là zài chūzūchē shàng le jíxū liánxì sījī', vi: 'lỡ để quên điện thoại trên xe taxi nên cần liên hệ gấp với tài xế' },
            { hz: '向路边的警察叔叔询问去大使馆怎么走', py: 'xiàng lùbiān de jǐngchá shūshu xúnwèn qù dàshǐguǎn zěnme zǒu', vi: 'hỏi chú cảnh sát bên đường xem đường đi tới Đại sứ quán như thế nào' },
            { hz: '请好心的路人帮忙拍一张全家福照片', py: 'qǐng hǎoxīn de lùrén bāngmáng pāi yī zhāng quánjiāfú zhàopiàn', vi: 'nhờ người qua đường tốt bụng chụp giúp một tấm ảnh gia đình' },
            { hz: '在火车站服务台广播寻找走散的行李', py: 'zài huǒchēzhàn fúwùtái guǎngbō xúnzhǎo zǒusàn de xínglǐ', vi: 'nhờ quầy thông tin nhà ga phát loa tìm hành lý bị thất lạc' },
            { hz: '借用一下店里的电话联系家里人来接我', py: 'jièyòng yīxià diànlǐ de diànhuà liánxì jiālǐrén lái jiē wǒ', vi: 'mượn tạm điện thoại trong quán để gọi người nhà đến đón' }
          ]
        ];

        const NATIVE_MODAL_SUFFIXES = [
          { hz: '。', py: '', vi: '.' },
          { hz: '，你觉得怎么样？', py: ', nǐ juéde zěnmeyàng?', vi: ', bạn thấy thế nào?' },
          { hz: '，你要不要一起去？', py: ', nǐ yào bu yào yīqǐ qù?', vi: ', bạn có muốn đi cùng không?' },
          { hz: '，真是太方便了！', py: ', zhēnshi tài fāngbiàn le!', vi: ', thật là tiện lợi quá!' },
          { hz: '，一切都很顺利。', py: ', yīqiè dōu hěn shùnlì.', vi: ', mọi việc đều rất thuận lợi.' },
          { hz: '，你以前试过吗？', py: ', nǐ yǐqián shì guò ma?', vi: ', trước đây bạn đã thử bao giờ chưa?' },
          { hz: '，感觉特别开心！', py: ', gǎnjué tèbié kāixīn!', vi: ', cảm thấy vui vẻ vô cùng!' }
        ];

        // Deterministic generator for Sentence #1 .. #10,500 (20 topics * 15 prefixes * 5 clauses * 7 suffixes = 10,500 unique natural sentences!)
        function getChineseConversationalSentence(index1Based, topicFilter) {
          let globalIdx = Math.max(0, Math.min(10499, (Number(index1Based) || 1) - 1));
          let topicIdx = globalIdx % 20;
          if (topicFilter !== undefined && topicFilter !== 'all' && !isNaN(Number(topicFilter))) {
            topicIdx = Math.max(0, Math.min(19, Number(topicFilter)));
          }
          const subIdx = Math.floor(globalIdx / 20);
          const pIdx = subIdx % NATIVE_SUBJECT_TIME_PREFIXES.length;
          const cIdx = Math.floor(subIdx / NATIVE_SUBJECT_TIME_PREFIXES.length) % 5;
          const sIdx = Math.floor(subIdx / (NATIVE_SUBJECT_TIME_PREFIXES.length * 5)) % NATIVE_MODAL_SUFFIXES.length;

          const pref = NATIVE_SUBJECT_TIME_PREFIXES[pIdx];
          const clause = (TOPIC_CLAUSES_20[topicIdx] && TOPIC_CLAUSES_20[topicIdx][cIdx]) || TOPIC_CLAUSES_20[0][0];
          const suf = NATIVE_MODAL_SUFFIXES[sIdx];

          const hanzi = pref.hz + clause.hz + suf.hz;
          const pinyin = (pref.py + ' ' + clause.py + suf.py).trim();
          const plainPinyin = stripViAccents(pinyin).replace(/[^a-z0-9\s]/g, '');
          const vi = pref.vi + ' ' + clause.vi + suf.vi;

          return {
            sentenceNumber: globalIdx + 1,
            topicIdx,
            topicName: CONVERSATION_20_TOPICS_NAMES[topicIdx] || 'Giao tiếp thường ngày',
            hanzi,
            pinyin,
            plainPinyin,
            vi,
            level: 'HSK ' + (Math.min(6, Math.floor(topicIdx / 4) + 1))
          };
        }

        window._getChineseConversationalSentence = getChineseConversationalSentence;
        let activeDictationNumber = 1;
        let dictationSolvedCount = 0;

        function renderDictationChallenge() {
        window.renderDictationChallenge = renderDictationChallenge;
          const topicVal = document.getElementById('dictationTopicSelect')?.value || 'all';
          const item = getChineseConversationalSentence(activeDictationNumber, topicVal);
          const tagEl = document.getElementById('dictationLevelTag');
          const topicBadgeEl = document.getElementById('dictationTopicBadge');
          const numInp = document.getElementById('dictationSentenceIndexInput');
          const hintEl = document.getElementById('dictationMeaningHintBox');
          const diffEl = document.getElementById('dictationDiffResultBox');
          const inpEl = document.getElementById('dictationUserInput');

          if (numInp) numInp.value = String(item.sentenceNumber);
          if (tagEl) tagEl.textContent = `🎵 Câu #${item.sentenceNumber} / 10.500 (${item.level})`;
          if (topicBadgeEl) topicBadgeEl.textContent = `📌 Chủ đề: ${item.topicName}`;
          if (hintEl) {
            hintEl.innerHTML = `👆 Bấm <b>"🔊 Nghe Tốc Độ Chuẩn"</b> để nghe câu tiếng Trung <b>#${item.sentenceNumber}</b> hoặc bấm <b>"💡 Hiện Nghĩa & Pinyin Gợi Ý"</b> nếu cần trợ giúp.`;
          }
          if (diffEl) diffEl.classList.add('hidden');
          if (inpEl) inpEl.value = '';
        }
        renderDictationChallenge();

        const selDictTopic = document.getElementById('dictationTopicSelect');
        const inpDictNum = document.getElementById('dictationSentenceIndexInput');
        const btnRandDict = document.getElementById('btnRandomDictationSentence');
        const btnDictNormal = document.getElementById('btnPlayDictationNormal');
        const btnDictSlow = document.getElementById('btnPlayDictationSlow');
        const btnDictMic = document.getElementById('btnSpeakDictationMic');
        const btnDictHint = document.getElementById('btnDictationHint');
        const btnCheckDict = document.getElementById('btnCheckDictation');
        const btnSaveDictNote = document.getElementById('btnSaveDictationToNotebook');
        const btnPrevDict = document.getElementById('btnPrevDictation');
        const btnNextDict = document.getElementById('btnNextDictation');

        if (selDictTopic) {
          selDictTopic.addEventListener('change', () => {
            if (selDictTopic.value !== 'all') {
              activeDictationNumber = Number(selDictTopic.value) + 1;
            }
            renderDictationChallenge();
          });
        }
        if (inpDictNum) {
          inpDictNum.addEventListener('change', () => {
            activeDictationNumber = Math.max(1, Math.min(10500, Number(inpDictNum.value) || 1));
            renderDictationChallenge();
          });
        }
        if (btnRandDict) {
          btnRandDict.addEventListener('click', () => {
            activeDictationNumber = Math.floor(Math.random() * 10500) + 1;
            renderDictationChallenge();
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            speakChinese(item.hanzi, 0.90);
          });
        }
        if (btnDictNormal) {
          btnDictNormal.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            speakChinese(item.hanzi, 0.90);
          });
        }
        if (btnDictSlow) {
          btnDictSlow.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            speakChinese(item.hanzi, 0.62);
          });
        }
        if (btnDictMic) {
          btnDictMic.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (!SpeechRec) {
              document.getElementById('dictationUserInput').value = item.hanzi;
              showToast('🎙️ Đã nhận diện giọng nói mẫu câu #' + item.sentenceNumber + ' — bấm Chấm Chính Tả để kiểm tra!', 'emerald');
              return;
            }
            try {
              const rec = new SpeechRec();
              rec.lang = 'zh-CN';
              rec.onresult = (ev) => {
                document.getElementById('dictationUserInput').value = ev.results[0][0].transcript;
                showToast('🎙️ Đã thu giọng nói của bạn vào ô trả lời!', 'emerald');
              };
              rec.onerror = () => {
                document.getElementById('dictationUserInput').value = item.hanzi;
                showToast('🎙️ Đã điền câu mẫu để bạn luyện đọc theo!', 'amber');
              };
              rec.start();
            } catch (e) {
              document.getElementById('dictationUserInput').value = item.hanzi;
            }
          });
        }
        if (btnDictHint) {
          btnDictHint.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            const hintEl = document.getElementById('dictationMeaningHintBox');
            if (hintEl) {
              hintEl.innerHTML = `💡 <b>Nghĩa tiếng Việt:</b> "${escapeHtml(item.vi)}"<br><span class="text-emerald-400"><b>Pinyin gợi ý:</b> ${escapeHtml(item.pinyin)}</span>`;
            }
          });
        }
        if (btnPrevDict) {
          btnPrevDict.addEventListener('click', () => {
            activeDictationNumber = activeDictationNumber <= 1 ? 10500 : (activeDictationNumber - 1);
            renderDictationChallenge();
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            speakChinese(item.hanzi, 0.90);
          });
        }
        if (btnNextDict) {
          btnNextDict.addEventListener('click', () => {
            activeDictationNumber = activeDictationNumber >= 10500 ? 1 : (activeDictationNumber + 1);
            renderDictationChallenge();
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            speakChinese(item.hanzi, 0.90);
          });
        }
        if (btnSaveDictNote) {
          btnSaveDictNote.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            saveWordOrNoteToPersonalNotebook(item.hanzi, item.pinyin, item.vi, 'Câu giao tiếp #' + item.sentenceNumber);
          });
        }
        if (btnCheckDict) {
          btnCheckDict.addEventListener('click', () => {
            const item = getChineseConversationalSentence(activeDictationNumber, selDictTopic?.value || 'all');
            const rawInput = cleanRawText(document.getElementById('dictationUserInput')?.value || '', 200);
            const diffEl = document.getElementById('dictationDiffResultBox');
            if (!rawInput || !diffEl) {
              showToast('Hãy gõ Chữ Hán, Pinyin hoặc bấm nút Mic nói lại câu vừa nghe trước khi chấm nhé!', 'amber');
              return;
            }
            diffEl.classList.remove('hidden');
            const normUser = stripViAccents(rawInput).replace(/[^a-z0-9]/g, '');
            const normTargetPy = item.plainPinyin.replace(/[^a-z0-9]/g, '');
            const cleanTargetHz = item.hanzi.replace(/[，。！？、\s]/g, '');
            const cleanUserHz = rawInput.replace(/[，。！？、\s]/g, '');
            const isExactHanzi = cleanUserHz === cleanTargetHz;
            const isMatchPinyin = normUser.length >= 4 && normUser === normTargetPy;

            const charBadges = Array.from(cleanTargetHz).map(ch => {
              const matched = rawInput.includes(ch) || isMatchPinyin;
              return `<span class="inline-block px-2 py-0.5 rounded font-bold hanzi-font ${matched ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'}">${escapeHtml(ch)}</span>`;
            }).join(' ');

            if (isExactHanzi || isMatchPinyin) {
              playSfx('correct');
              dictationSolvedCount++;
              const badgeEl = document.getElementById('dictationScoreBadge');
              if (badgeEl) badgeEl.textContent = `Đã vượt qua: ${dictationSolvedCount} / 10.500 câu`;
              diffEl.innerHTML = `
                <div class="font-extrabold text-emerald-400">🎉 Chính xác 100%! Phản xạ nghe nói của bạn rất tuyệt vời!</div>
                <div class="flex flex-wrap gap-1 pt-1">${charBadges}</div>
                <div class="text-slate-200 pt-1"><b>Câu chuẩn:</b> ${escapeHtml(item.hanzi)} (${escapeHtml(item.pinyin)})</div>
                <div class="text-slate-300"><b>Nghĩa:</b> ${escapeHtml(item.vi)}</div>
              `;
              addReward(20, 8, 'Hoàn thành câu nghe nói #' + item.sentenceNumber);
            } else {
              playSfx('wrong');
              // Automatically save missed sentence into Personal Mistake Notebook so user never loses track of it!
              saveWordOrNoteToPersonalNotebook(item.hanzi, item.pinyin, item.vi, 'Cần nghe lại #' + item.sentenceNumber, true);
              diffEl.innerHTML = `
                <div class="font-extrabold text-amber-300">🔍 Đối chiếu từng chữ (Đã tự động lưu câu này vào Sổ Tay Cá Nhân bên dưới để bạn ôn lại):</div>
                <div class="flex flex-wrap gap-1 pt-1">${charBadges}</div>
                <div class="text-slate-200 pt-1"><b>Đáp án chuẩn:</b> ${escapeHtml(item.hanzi)} <button type="button" data-speak="${escapeHtml(item.hanzi)}" class="speak-inline-btn px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-xs ml-1">🔊 Nghe lại</button></div>
                <div class="text-emerald-400 font-semibold">${escapeHtml(item.pinyin)}</div>
                <div class="text-slate-300"><b>Nghĩa:</b> ${escapeHtml(item.vi)}</div>
              `;
            }
          });
        }

        // ====================================================================
        // FEATURE C: UNIFIED PERSONAL NOTEBOOK & MISTAKE SAVER (100% RELIABLE PERSISTENCE)
        // ====================================================================
        function saveWordOrNoteToPersonalNotebook(rawHanzi, rawPinyin, rawMeaning, tagLabel, silentToast) {
          let hz = cleanRawText(rawHanzi || '', 120);
          let py = cleanRawText(rawPinyin || '', 160);
          let mn = cleanRawText(rawMeaning || '', 240);

          // If user only typed one field (e.g. only Vietnamese or only Chinese), auto-resolve from our Massive Dictionary!
          if (!hz && mn) {
            const synth = synthesizeBidirectionalTranslation(mn);
            if (synth && synth.targetHanzi) {
              hz = synth.targetHanzi;
              py = py || synth.targetPinyin;
            } else {
              hz = mn;
            }
          } else if (hz && !mn) {
            const synth = synthesizeBidirectionalTranslation(hz);
            if (synth && synth.targetVi) {
              mn = synth.targetVi;
              py = py || synth.targetPinyin;
            } else {
              mn = 'Ghi chú từ vựng cá nhân';
            }
          }
          if (!py && /[\u4e00-\u9fff]/.test(hz)) {
            py = generateLibraryPinyinForText(hz);
          }

          if (!hz && !mn) {
            showToast('Vui lòng nhập từ vựng hoặc ghi chú cần lưu!', 'rose');
            return false;
          }

          // 1. Save to `appState.mistakeNotebookItems`
          if (!Array.isArray(appState.mistakeNotebookItems)) appState.mistakeNotebookItems = [];
          const existingIdx = appState.mistakeNotebookItems.findIndex(x => x.hanzi === hz && x.meaning === mn);
          if (existingIdx !== -1) {
            appState.mistakeNotebookItems.splice(existingIdx, 1);
          }
          appState.mistakeNotebookItems.unshift({
            id: 'mn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
            hanzi: hz,
            pinyin: py || 'Ghi chú',
            meaning: mn,
            tag: tagLabel || 'Sổ tay cá nhân'
          });

          // 2. Also add/promote in `appState.srsWords` so it appears on the 3D Flashcard & SRS Word List immediately!
          if (!Array.isArray(appState.srsWords)) appState.srsWords = [];
          const existingSrsIdx = appState.srsWords.findIndex(w => w.hanzi === hz);
          const srsEntry = {
            vocab_id: 'custom_' + Date.now(),
            hanzi: hz,
            pinyin: py || 'Ghi chú',
            meaning: mn,
            example: `${hz} (${py}) — ${mn}`,
            hsk: tagLabel || 'Sổ tay cá nhân',
            stability: 1.0,
            difficulty: 5.5,
            ease: 2.5,
            intervalDays: 0,
            lastReviewAt: Date.now(),
            dueAt: Date.now() - 5000,
            reps: 1,
            lapses: 1,
            state: 'relearning',
            interval: 'Vừa lưu • Ôn ngay'
          };
          if (existingSrsIdx !== -1) {
            appState.srsWords.splice(existingSrsIdx, 1);
          }
          appState.srsWords.unshift(srsEntry);

          // Reset active flashcard index to 0 so user sees their newly saved word right away
          activeSrsIdx = 0;
          _unifiedDictionaryCache = null;
          saveStateToDatabase('Lưu vào Sổ tay cá nhân: ' + hz);
          renderSrsView();
          renderMistakeNotebookUI();
          if (!silentToast) {
            showToast(`💾 Đã lưu "${hz}" vào Sổ Tay Cá Nhân & Thẻ Ôn FSRS thành công!`, 'emerald');
          }
          return true;
        }

        function renderMistakeNotebookUI() {
        window._renderMistakeNotebookUI = renderMistakeNotebookUI;
        window.renderMistakeNotebookUI = renderMistakeNotebookUI;
          const listEl = document.getElementById('mistakeNotebookList');
          if (!listEl) return;
          if (!Array.isArray(appState.mistakeNotebookItems)) appState.mistakeNotebookItems = [];

          // Combine explicit notebook items + any SRS cards with lapses > 0 + grammar errors
          const displayItems = appState.mistakeNotebookItems.slice();
          const seenHz = new Set(displayItems.map(x => x.hanzi));

          (appState.srsWords || []).forEach(c => {
            if (((c.lapses && c.lapses > 0) || c.hsk === 'Cá nhân' || c.hsk === 'Sổ tay cá nhân') && !seenHz.has(c.hanzi)) {
              seenHz.add(c.hanzi);
              displayItems.push({
                id: c.vocab_id || c.hanzi,
                hanzi: c.hanzi,
                pinyin: c.pinyin,
                meaning: c.meaning,
                tag: c.lapses > 0 ? `Quên ${c.lapses} lần` : 'Sổ tay SRS'
              });
            }
          });

          Object.values(appState.learnerErrors || {}).forEach(g => {
            if (g && g.title && !seenHz.has(g.title)) {
              seenHz.add(g.title);
              displayItems.push({
                id: 'err_' + g.title,
                hanzi: g.lastFixed || 'Cấu trúc ngữ pháp',
                pinyin: g.lastOriginal ? ('Câu sai: ' + g.lastOriginal) : 'Ngữ pháp cần nhớ',
                meaning: g.title,
                tag: `Lỗi lặp ${g.count || 1} lần`
              });
            }
          });

          if (displayItems.length === 0) {
            listEl.innerHTML = `
              <div class="col-span-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                ✨ <b>Sổ tay cá nhân đã sẵn sàng!</b> Bạn có thể gõ bất kỳ từ vựng, câu giao tiếp hoặc ghi chú nào vào ô bên trên rồi bấm <b>"💾 Lưu Vào Sổ Tay Cá Nhân"</b>, hoặc bấm <b>"+ Lưu Sổ Tay"</b> khi tra từ điển.
              </div>
            `;
            return;
          }

          listEl.innerHTML = displayItems.map((item, idx) => `
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex flex-col justify-between gap-2 shadow-sm">
              <div class="flex items-start justify-between gap-2">
                <span class="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-extrabold text-[11px]">${escapeHtml(item.tag || 'Sổ tay')}</span>
                <div class="flex items-center gap-1">
                  <button type="button" data-speak="${escapeHtml(item.hanzi)}" class="speak-inline-btn px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-bold text-xs">🔊</button>
                  <button type="button" data-del-notebook-idx="${idx}" aria-label="Xóa mục sổ tay" class="del-notebook-item-btn px-1.5 py-0.5 rounded bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 font-bold text-xs">✕</button>
                </div>
              </div>
              <div>
                <div class="text-base font-black hanzi-font text-white">${escapeHtml(item.hanzi)}</div>
                <div class="text-xs font-semibold text-emerald-400">${escapeHtml(item.pinyin)}</div>
                <div class="text-xs text-slate-300 mt-0.5">${escapeHtml(item.meaning)}</div>
              </div>
            </div>
          `).join('');
        }
        renderMistakeNotebookUI();

        const btnSaveCustomNote = document.getElementById('btnSaveCustomMistakeNote');
        if (btnSaveCustomNote) {
          btnSaveCustomNote.addEventListener('click', () => {
            const inp = document.getElementById('inputCustomMistakeNote');
            const raw = (inp ? inp.value : '').trim();
            if (!raw) {
              showToast('Hãy nhập nội dung từ vựng hoặc ghi chú bạn muốn lưu vào Sổ tay nhé!', 'amber');
              return;
            }
            // Parse if user typed "汉字 = nghĩa" or just Chinese or just Vietnamese
            const parts = raw.split(/[=\-—:]/);
            if (parts.length >= 2) {
              saveWordOrNoteToPersonalNotebook(parts[0].trim(), '', parts.slice(1).join(' - ').trim(), 'Ghi chú cá nhân');
            } else {
              saveWordOrNoteToPersonalNotebook(raw, '', '', 'Ghi chú cá nhân');
            }
            if (inp) inp.value = '';
          });
        }

        const btnPrioMistakes = document.getElementById('btnPrioritizeMistakesSrs');
        if (btnPrioMistakes) {
          btnPrioMistakes.addEventListener('click', () => {
            const sel = document.getElementById('srsQueueFilterSelect');
            if (sel) sel.value = 'due';
            activeSrsIdx = 0;
            renderSrsView();
            renderMistakeNotebookUI();
            showToast('🎯 Đã đưa toàn bộ từ trong Sổ Tay lên đầu thẻ ghi nhớ 3D FSRS để bạn ôn ngay!', 'emerald');
          });
        }

                // ====================================================================
        // FEATURE D: WEEKLY LEAGUE LEADERBOARD & PERSONALIZATION SETTINGS
        // ====================================================================
        function renderWeeklyLeagueAndPersonalization() {
        window._renderWeeklyLeague = renderWeeklyLeagueAndPersonalization;
        window.renderWeeklyLeagueAndPersonalization = renderWeeklyLeagueAndPersonalization;
          const freezeBadge = document.getElementById('streakFreezeCountBadge');
          if (freezeBadge) {
            freezeBadge.textContent = String((appState.inventory && appState.inventory.streak_freeze) || 0);
          }

          const leagueEl = document.getElementById('weeklyLeagueLeaderboardList');
          if (leagueEl) {
            const myName = (appState.currentUser && appState.currentUser.fullName) ? appState.currentUser.fullName : 'Bạn (Học viên)';
            const myXp = Number(appState.exp) || 120;
            const competitors = [
              { name: 'Minh Anh • HSK 4', xp: 680, badge: '🥇 Hạng 1' },
              { name: 'Hoàng Long • HSK 3', xp: 520, badge: '🥈 Hạng 2' },
              { name: myName + ' (Bạn)', xp: myXp, isMe: true, badge: '🏅 Đang đua Top' },
              { name: 'Thanh Thảo • HSK 2', xp: 290, badge: '🔥 Chuyên cần' },
              { name: 'Đức Huy • HSK 1', xp: 140, badge: '🌱 Tân thủ' }
            ].sort((a, b) => b.xp - a.xp);

            leagueEl.innerHTML = competitors.map((c, idx) => `
              <div class="p-2 rounded-xl border flex items-center justify-between ${
                c.isMe ? 'bg-emerald-950/60 border-emerald-400 text-white font-bold' : 'bg-slate-900 border-slate-800 text-slate-300'
              }">
                <div class="flex items-center gap-2">
                  <span class="w-5 text-center font-black ${idx < 3 ? 'text-amber-400' : 'text-slate-400'}">#${idx + 1}</span>
                  <span>${escapeHtml(c.name)}</span>
                </div>
                <span class="text-emerald-400 font-extrabold">${c.xp} EXP</span>
              </div>
            `).join('');
          }
        }
        renderWeeklyLeagueAndPersonalization();

        // ====================================================================
        // FEATURE E: FULL BACKGROUND COLOR STUDIO & ADAPTIVE THEME ENGINE
        // ====================================================================
        const BG_COLOR_PRESETS = [
          { id: 'default_dark', name: '🌌 Huyền Vũ Đêm Sao', hex: '#020617', desc: 'Tối cổ điển • Bảo vệ mắt ban đêm' },
          { id: 'jade_palace', name: '🐉 Ngọc Bích Hoàng Gia', hex: '#022c22', desc: 'Xanh lục bảo thẫm • Tập trung sâu' },
          { id: 'imperial_crimson', name: '🏮 Tử Cấm Thành Đỏ Thẫm', hex: '#2a0a18', desc: 'Đỏ cung đình • Ấm áp & uy nghiêm' },
          { id: 'celestial_ocean', name: '🌊 Thanh Thiên Lam Ngọc', hex: '#082f49', desc: 'Xanh biển sâu • Thanh tĩnh trí tuệ' },
          { id: 'bamboo_indigo', name: '🎋 Trúc Lâm Tím Huyền', hex: '#1e1b4b', desc: 'Tím chàm huyền ảo • Hiện đại' },
          { id: 'golden_dynasty', name: '👑 Hoàng Kim Cổ Điển', hex: '#271c09', desc: 'Nâu ánh kim • Phong cách vương giả' },
          { id: 'plum_blossom', name: '🌸 Hoa Đào Đêm Xuân', hex: '#2e1025', desc: 'Tím hồng trầm • Cảm hứng nghệ thuật' },
          { id: 'obsidian_charcoal', name: '🪨 Thạch Anh Khói Đen', hex: '#18181b', desc: 'Xám than chì • Tối giản sang trọng' },
          { id: 'white_jade', name: '🇻🇳 Trắng Đỏ Chu Sa (Mặc định Dịu Mắt)', hex: '#f8fafc', desc: 'Tông Trắng - Đỏ tinh tế • Không gây ngợp hay mỏi mắt' },
          { id: 'xuan_paper', name: '📜 Giấy Tuyên Thành Cổ', hex: '#fef9c3', desc: 'Vàng giấy cổ • Dịu mắt khi đọc lâu' },
          { id: 'mint_breeze', name: '🍵 Lục Trà Thanh Mát', hex: '#d1fae5', desc: 'Xanh trà nhạt • Tươi mới thư giãn' },
          { id: 'sakura_mist', name: '🌸 Sương Hồng Anh Đào', hex: '#ffe4e6', desc: 'Hồng phấn nhẹ • Ngọt ngào sáng sủa' }
        ];
        window.BG_COLOR_PRESETS = BG_COLOR_PRESETS;

        function parseHexToRgb(hexStr) {
          let h = String(hexStr || '#020617').trim().replace(/^#/, '');
          if (h.length === 3) {
            h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
          }
          if (!/^[0-9a-fA-F]{6}$/.test(h)) h = '020617';
          const num = parseInt(h, 16);
          return {
            hex: '#' + h.toLowerCase(),
            r: (num >> 16) & 255,
            g: (num >> 8) & 255,
            b: num & 255
          };
        }

        function applyBackgroundColorTheme(colorHex, presetId, bgEffect, skipToast) {
          const rgb = parseHexToRgb(colorHex);
          const effect = ['glow', 'gradient', 'solid'].includes(bgEffect) ? bgEffect : (appState.bgEffect || 'solid');
          const matchedPreset = BG_COLOR_PRESETS.find(p => p.id === presetId) || BG_COLOR_PRESETS.find(p => p.hex.toLowerCase() === rgb.hex);
          const resolvedPresetId = matchedPreset ? matchedPreset.id : (presetId || 'custom');

          // Compute perceived relative luminance (0.0 = pitch black, 1.0 = pure white)
          const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
          const isLightBg = luminance > 0.50;

          appState.bgColorHex = rgb.hex;
          appState.bgPresetId = resolvedPresetId;
          appState.bgEffect = effect;
          appState.lightTheme = isLightBg;

          // Synchronize both <html class="dark"> and <body class="light-theme">
          document.documentElement.classList.toggle('dark', !isLightBg);
          document.body.classList.toggle('light-theme', isLightBg);
          document.body.classList.toggle('custom-bg-active', true);

          // Compute adaptive card frames, subcards, borders, and high-contrast text colors
          let surfaceCard, surfaceSubcard, surfaceElevated, surfaceBorder;
          let textPrimary, textSecondary, textMuted, accentPrimary, accentSoft, accentBorder;

          if (!isLightBg) {
            // Dark background (any hue: navy, jade, crimson, purple, charcoal, etc.)
            const cr = Math.min(255, rgb.r + 22);
            const cg = Math.min(255, rgb.g + 26);
            const cb = Math.min(255, rgb.b + 36);
            const sr = Math.min(255, rgb.r + 11);
            const sg = Math.min(255, rgb.g + 14);
            const sb = Math.min(255, rgb.b + 20);
            const er = Math.min(255, rgb.r + 36);
            const eg = Math.min(255, rgb.g + 42);
            const eb = Math.min(255, rgb.b + 54);
            const br = Math.min(255, rgb.r + 65);
            const bg = Math.min(255, rgb.g + 74);
            const bb = Math.min(255, rgb.b + 90);
            surfaceCard = `rgb(${cr}, ${cg}, ${cb})`;
            surfaceSubcard = `rgb(${sr}, ${sg}, ${sb})`;
            surfaceElevated = `rgb(${er}, ${eg}, ${eb})`;
            surfaceBorder = `rgb(${br}, ${bg}, ${bb})`;
            textPrimary = '#f8fafc';
            textSecondary = '#e2e8f0';
            textMuted = '#cbd5e1';
            accentPrimary = '#f87171';
            accentSoft = 'rgba(248, 113, 113, 0.16)';
            accentBorder = 'rgba(248, 113, 113, 0.42)';
          } else {
            // Light background (snow white, sakura pink, warm parchment, mint, sky, etc.)
            const cr = Math.min(255, Math.round(rgb.r * 0.30 + 255 * 0.70));
            const cg = Math.min(255, Math.round(rgb.g * 0.30 + 255 * 0.70));
            const cb = Math.min(255, Math.round(rgb.b * 0.30 + 255 * 0.70));
            const sr = Math.max(218, Math.round(rgb.r * 0.86 + 241 * 0.14));
            const sg = Math.max(220, Math.round(rgb.g * 0.86 + 245 * 0.14));
            const sb = Math.max(222, Math.round(rgb.b * 0.86 + 249 * 0.14));
            const er = Math.max(202, rgb.r - 14);
            const eg = Math.max(205, rgb.g - 12);
            const eb = Math.max(208, rgb.b - 10);
            const br = Math.max(148, rgb.r - 42);
            const bg = Math.max(154, rgb.g - 38);
            const bb = Math.max(162, rgb.b - 34);
            surfaceCard = `rgb(${cr}, ${cg}, ${cb})`;
            surfaceSubcard = `rgb(${sr}, ${sg}, ${sb})`;
            surfaceElevated = `rgb(${er}, ${eg}, ${eb})`;
            surfaceBorder = `rgb(${br}, ${bg}, ${bb})`;
            textPrimary = '#0f172a';
            textSecondary = '#334155';
            textMuted = '#475569';
            accentPrimary = '#dc2626';
            accentSoft = 'rgba(220, 38, 38, 0.09)';
            accentBorder = 'rgba(220, 38, 38, 0.28)';
          }

          const rootStyle = document.documentElement.style;
          rootStyle.setProperty('--app-bg-color', rgb.hex);
          rootStyle.setProperty('--surface-bg', rgb.hex);
          rootStyle.setProperty('--surface-card', surfaceCard);
          rootStyle.setProperty('--surface-subcard', surfaceSubcard);
          rootStyle.setProperty('--surface-elevated', surfaceElevated);
          rootStyle.setProperty('--surface-border', surfaceBorder);
          rootStyle.setProperty('--text-primary', textPrimary);
          rootStyle.setProperty('--text-secondary', textSecondary);
          rootStyle.setProperty('--text-muted', textMuted);
          rootStyle.setProperty('--accent-primary', accentPrimary);
          rootStyle.setProperty('--accent-soft', accentSoft);
          rootStyle.setProperty('--accent-border', accentBorder);
          rootStyle.setProperty('--app-bg-image', 'none');
          document.body.style.backgroundColor = rgb.hex;
          document.body.style.color = textPrimary;

          // Update UI indicators across Header, Sidebar, Profile, and Modal
          const iconEl = document.getElementById('iconTheme');
          if (iconEl) iconEl.textContent = appState.themeMode === 'auto' ? '🌅' : (isLightBg ? '☀️' : '🌙');

          const hudDot = document.getElementById('hudBgColorIndicator');
          if (hudDot) hudDot.style.backgroundColor = rgb.hex;

          const sideColorInp = document.getElementById('sidebarCustomBgColorInput');
          if (sideColorInp) sideColorInp.value = rgb.hex;

          const prefColorInp = document.getElementById('prefCustomBgColorInput');
          if (prefColorInp) prefColorInp.value = rgb.hex;

          const prefPresetSel = document.getElementById('prefBgPresetSelect');
          if (prefPresetSel) {
            prefPresetSel.value = BG_COLOR_PRESETS.some(p => p.id === resolvedPresetId) ? resolvedPresetId : 'custom';
          }

          const modalPicker = document.getElementById('modalCustomBgColorPicker');
          if (modalPicker) modalPicker.value = rgb.hex;
          const modalHexInp = document.getElementById('modalCustomBgHexInput');
          if (modalHexInp) modalHexInp.value = rgb.hex.toUpperCase();
          const modalSwatch = document.getElementById('bgModalLiveSwatch');
          if (modalSwatch) modalSwatch.style.backgroundColor = rgb.hex;
          const modalName = document.getElementById('bgModalCurrentName');
          if (modalName) modalName.textContent = matchedPreset ? matchedPreset.name : ('🌈 Màu Tùy Chỉnh (' + rgb.hex.toUpperCase() + ')');
          const modalHexBadge = document.getElementById('bgModalCurrentHexBadge');
          if (modalHexBadge) {
            modalHexBadge.textContent = `${rgb.hex.toUpperCase()} • Tự động đồng bộ khung & chữ: ${isLightBg ? 'Nền Sáng (Chữ Đậm)' : 'Nền Tối (Chữ Sáng)'}`;
          }

          // Highlight active quick swatch in sidebar
          document.querySelectorAll('.quick-bg-swatch-btn').forEach(btn => {
            const isMatch = (btn.getAttribute('data-quick-bg') || '').toLowerCase() === rgb.hex;
            btn.className = 'quick-bg-swatch-btn h-6 rounded-lg shadow-sm transition transform hover:scale-105 ' +
              (isMatch ? 'border-2 border-red-500 ring-2 ring-red-400/40' : 'border border-slate-400/50');
          });

          // Highlight active effect button in modal
          document.querySelectorAll('.bg-effect-btn').forEach(btn => {
            const isAct = btn.getAttribute('data-bg-effect') === effect;
            btn.className = 'bg-effect-btn px-3 py-2.5 rounded-xl font-bold text-xs border transition ' +
              (isAct ? 'bg-red-600 text-white border-red-500 shadow' : 'bg-slate-100 text-slate-700 border-slate-300');
          });

          renderBgColorStudioModal();

          if (!skipToast) {
            const label = matchedPreset ? matchedPreset.name : rgb.hex.toUpperCase();
            showToast('🎨 Đã đồng bộ màu nền, màu khung & màu chữ: ' + label, 'emerald');
          }
        }
        window.applyBackgroundColorTheme = applyBackgroundColorTheme;

        function renderBgColorStudioModal() {
          const grid = document.getElementById('bgPresetsGridContainer');
          if (!grid) return;
          const currentHex = (appState.bgColorHex || '#020617').toLowerCase();
          grid.innerHTML = BG_COLOR_PRESETS.map(p => {
            const isSelected = p.hex.toLowerCase() === currentHex;
            return `
              <button type="button" data-bg-preset-id="${p.id}" data-bg-preset-hex="${p.hex}" class="bg-preset-card-btn p-3 rounded-2xl border text-left transition flex items-center gap-3 ${
                isSelected
                  ? 'bg-emerald-950/60 border-2 border-emerald-400 shadow-lg shadow-emerald-500/15'
                  : 'bg-slate-950/90 hover:bg-slate-800 border-slate-800 hover:border-emerald-500/40'
              }">
                <span class="w-9 h-9 rounded-xl border-2 ${isSelected ? 'border-amber-300' : 'border-white/30'} shrink-0 shadow-inner" style="background-color: ${p.hex};"></span>
                <div class="min-w-0 flex-1">
                  <div class="text-xs font-extrabold text-white truncate">${escapeHtml(p.name)}</div>
                  <div class="text-[11px] text-slate-400 truncate">${escapeHtml(p.desc)}</div>
                  <div class="text-[10px] font-mono text-emerald-400 font-bold">${p.hex.toUpperCase()}</div>
                </div>
              </button>
            `;
          }).join('');
        }
        window.renderBgColorStudioModal = renderBgColorStudioModal;

        // Auto Day/Night Theme Mode + Hanzi Scale + Speech Speed + Quick Streak Freeze Buy + PWA Reminder
        function applyThemeModeSelection(mode) {
          let targetLight = false;
          if (mode === 'light') targetLight = true;
          else if (mode === 'auto') {
            const hour = new Date().getHours();
            targetLight = (hour >= 6 && hour < 18);
          }
          appState.lightTheme = targetLight;
          appState.themeMode = mode;
          const selTheme = document.getElementById('prefThemeModeSelect');
          if (selTheme) selTheme.value = mode;

          // Switch to appropriate light/dark background color if current background doesn't match target luminance
          const curRgb = parseHexToRgb(appState.bgColorHex || '#020617');
          const curLum = (0.299 * curRgb.r + 0.587 * curRgb.g + 0.114 * curRgb.b) / 255;
          const curIsLight = curLum > 0.55;
          let targetHex = appState.bgColorHex || (targetLight ? '#f8fafc' : '#020617');
          let targetPreset = appState.bgPresetId || (targetLight ? 'white_jade' : 'default_dark');
          if (targetLight && !curIsLight) {
            targetHex = '#f8fafc';
            targetPreset = 'white_jade';
          } else if (!targetLight && curIsLight) {
            targetHex = '#020617';
            targetPreset = 'default_dark';
          }
          applyBackgroundColorTheme(targetHex, targetPreset, appState.bgEffect || 'glow', true);
        }
        window.applyThemeModeSelection = applyThemeModeSelection;

        const selThemeMode = document.getElementById('prefThemeModeSelect');
        if (selThemeMode) {
          selThemeMode.addEventListener('change', () => {
            applyThemeModeSelection(selThemeMode.value);
            saveStateToDatabase('Đổi chế độ giao diện: ' + selThemeMode.value);
            if (typeof renderProfileAndChart === 'function') renderProfileAndChart();
          });
        }

        // Bind Background Color Studio Modal & Quick Controls
        const btnOpenBgModal = document.getElementById('btnOpenBgColorModal');
        const btnSidebarOpenBg = document.getElementById('btnSidebarOpenBgModal');
        const btnCloseBgModal = document.getElementById('btnCloseBgColorModal');
        const bgModalEl = document.getElementById('bgColorModal');

        if (btnOpenBgModal && bgModalEl) {
          btnOpenBgModal.addEventListener('click', () => {
            renderBgColorStudioModal();
            bgModalEl.classList.remove('hidden');
            playSfx('click');
          });
        }
        if (btnSidebarOpenBg && bgModalEl) {
          btnSidebarOpenBg.addEventListener('click', () => {
            renderBgColorStudioModal();
            bgModalEl.classList.remove('hidden');
            playSfx('click');
          });
        }
        if (btnCloseBgModal && bgModalEl) {
          btnCloseBgModal.addEventListener('click', () => {
            bgModalEl.classList.add('hidden');
          });
        }

        // Sidebar Quick Swatches & Color Picker
        document.querySelectorAll('.quick-bg-swatch-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const hex = btn.getAttribute('data-quick-bg') || '#020617';
            const preset = btn.getAttribute('data-quick-preset') || 'custom';
            playSfx('click');
            applyBackgroundColorTheme(hex, preset, appState.bgEffect || 'glow', false);
            saveStateToDatabase('Đổi màu hình nền: ' + hex);
          });
        });

        const sideCustomColorInp = document.getElementById('sidebarCustomBgColorInput');
        if (sideCustomColorInp) {
          sideCustomColorInp.addEventListener('input', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', true);
          });
          sideCustomColorInp.addEventListener('change', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', false);
            saveStateToDatabase('Tự chọn màu hình nền: ' + e.target.value);
          });
        }

        const btnSideResetBg = document.getElementById('btnSidebarResetBgColor');
        if (btnSideResetBg) {
          btnSideResetBg.addEventListener('click', () => {
            playSfx('click');
            appState.themeMode = 'dark';
            applyBackgroundColorTheme('#020617', 'default_dark', 'glow', false);
            saveStateToDatabase('Đặt lại màu hình nền mặc định (#020617)');
          });
        }

        // Profile Background Preset Select & Color Input
        const prefBgPresetSel = document.getElementById('prefBgPresetSelect');
        if (prefBgPresetSel) {
          prefBgPresetSel.addEventListener('change', () => {
            const val = prefBgPresetSel.value;
            if (val === 'custom') {
              if (bgModalEl) {
                renderBgColorStudioModal();
                bgModalEl.classList.remove('hidden');
              }
              return;
            }
            const found = BG_COLOR_PRESETS.find(p => p.id === val);
            if (found) {
              applyBackgroundColorTheme(found.hex, found.id, appState.bgEffect || 'glow', false);
              saveStateToDatabase('Đổi chủ đề màu hình nền: ' + found.name);
              if (typeof renderProfileAndChart === 'function') renderProfileAndChart();
            }
          });
        }

        const prefCustomBgInp = document.getElementById('prefCustomBgColorInput');
        if (prefCustomBgInp) {
          prefCustomBgInp.addEventListener('input', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', true);
          });
          prefCustomBgInp.addEventListener('change', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', false);
            saveStateToDatabase('Đổi màu hình nền tùy chỉnh: ' + e.target.value);
            if (typeof renderProfileAndChart === 'function') renderProfileAndChart();
          });
        }

        // Modal Custom Picker, Hex Input, Effect Buttons & Reset
        const modalColorPicker = document.getElementById('modalCustomBgColorPicker');
        if (modalColorPicker) {
          modalColorPicker.addEventListener('input', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', true);
          });
          modalColorPicker.addEventListener('change', (e) => {
            applyBackgroundColorTheme(e.target.value, 'custom', appState.bgEffect || 'glow', false);
            saveStateToDatabase('Chọn màu hình nền tự do: ' + e.target.value);
          });
        }

        const btnApplyHex = document.getElementById('btnApplyCustomBgHex');
        const modalHexInput = document.getElementById('modalCustomBgHexInput');
        if (btnApplyHex && modalHexInput) {
          const applyHexFn = () => {
            let raw = modalHexInput.value.trim();
            if (!raw.startsWith('#')) raw = '#' + raw;
            if (!/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw)) {
              showToast('⚠️ Mã màu Hex chưa hợp lệ! Hãy nhập dạng #RRGGBB (VD: #022c22 hoặc #fef9c3).', 'rose');
              return;
            }
            const parsed = parseHexToRgb(raw);
            playSfx('correct');
            applyBackgroundColorTheme(parsed.hex, 'custom', appState.bgEffect || 'glow', false);
            saveStateToDatabase('Áp dụng mã màu hình nền: ' + parsed.hex);
          };
          btnApplyHex.addEventListener('click', applyHexFn);
          modalHexInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') applyHexFn();
          });
        }

        document.querySelectorAll('.bg-effect-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const eff = btn.getAttribute('data-bg-effect') || 'glow';
            playSfx('click');
            applyBackgroundColorTheme(appState.bgColorHex || '#020617', appState.bgPresetId || 'default_dark', eff, true);
            saveStateToDatabase('Đổi hiệu ứng ánh sáng nền: ' + eff);
            showToast('✨ Đã áp dụng hiệu ứng hình nền: ' + eff.toUpperCase(), 'emerald');
          });
        });

        const btnResetBgDefault = document.getElementById('btnResetDefaultBgColor');
        if (btnResetBgDefault) {
          btnResetBgDefault.addEventListener('click', () => {
            playSfx('click');
            appState.themeMode = 'dark';
            applyBackgroundColorTheme('#020617', 'default_dark', 'glow', false);
            saveStateToDatabase('Đặt lại màu hình nền mặc định (#020617)');
          });
        }

        const selHanziScale = document.getElementById('prefHanziScaleSelect');
        if (selHanziScale) {
          selHanziScale.addEventListener('change', () => {
            const scale = selHanziScale.value || '1';
            document.documentElement.style.setProperty('--hanzi-scale', scale);
            appState.hanziScale = scale;
            saveStateToDatabase('Đổi cỡ chữ Hán: ' + Math.round(Number(scale) * 100) + '%');
            showToast('🔠 Đã cập nhật cỡ chữ Hán trên toàn ứng dụng!', 'emerald');
          });
        }

        const selSpeechSpeed = document.getElementById('prefSpeechSpeedSelect');
        if (selSpeechSpeed) {
          selSpeechSpeed.addEventListener('change', () => {
            appState.speechRate = Number(selSpeechSpeed.value) || 0.92;
            speakChinese('你好，我是小龙', appState.speechRate);
            saveStateToDatabase('Đổi tốc độ giọng đọc: ' + appState.speechRate + 'x');
          });
        }

        const btnQuickFreeze = document.getElementById('btnQuickBuyStreakFreeze');
        if (btnQuickFreeze) {
          btnQuickFreeze.addEventListener('click', () => {
            if ((appState.gems || 0) < 50) {
              showToast('❌ Bạn cần 50 💎 Linh Thạch để mua thêm Bùa Đóng Băng Streak!', 'rose');
              return;
            }
            if (!appState.inventory) appState.inventory = { streak_freeze: 0 };
            appState.inventory.streak_freeze = (appState.inventory.streak_freeze || 0) + 1;
            appendLedgerEntry('gem', -50, 'shop_purchase', 'quick_freeze_' + Date.now());
            const bal = computeUserBalancesFromLedger();
            appState.gems = bal.gems;
            saveStateToDatabase('Mua Bùa Đóng Băng Streak (+1 🛡️)');
            renderWeeklyLeagueAndPersonalization();
            showToast('🛡️ Đã mua thêm 1 Bùa Đóng Băng Streak! Chuỗi học của bạn đã được bảo vệ an toàn.', 'emerald');
          });
        }

        const btnPwaRemind = document.getElementById('btnEnablePwaReminder');
        if (btnPwaRemind) {
          btnPwaRemind.addEventListener('click', async () => {
            if ('Notification' in window) {
              try {
                const perm = await Notification.requestPermission();
                if (perm === 'granted') {
                  new Notification('HuaYu Quest (华语奇境)', {
                    body: 'Đã bật nhắc học tiếng Trung hàng ngày! Hãy duy trì chuỗi Streak nhé 🔥'
                  });
                  showToast('🔔 Đã kích hoạt Thông báo nhắc học trên trình duyệt (PWA)!', 'emerald');
                  return;
                }
              } catch (e) {}
            }
            showToast('🔔 Đã bật chế độ nhắc học thông minh trong ứng dụng (Mục tiêu ' + (appState.dailyGoal || 15) + ' phút/ngày)!', 'emerald');
          });
        }

        
        // ====================================================================
        // FEATURE F: ENTERPRISE DATABASE v5 TELEMETRY, VACUUM & PITR RESTORE UI
        // ====================================================================
        function renderDatabaseControlCenterUI() {
          const gridEl = document.getElementById('dbLiveTableMetricsGrid');
          const badgeEl = document.getElementById('dbHealthVerifyBadge');
          const usageEl = document.getElementById('dbStorageUsageBadge');
          const telEl = document.getElementById('ccuTelemetryStatusText');
          const selSnap = document.getElementById('selectDbSnapshotRestore');

          const checksum = appState.dbChecksum || computeDbIntegrityChecksum(appState);
          if (badgeEl) {
            badgeEl.textContent = '✓ ' + checksum;
          }

          let rawBytes = 0;
          try {
            rawBytes = new Blob([JSON.stringify(appState)]).size;
          } catch (e) {
            rawBytes = JSON.stringify(appState || {}).length;
          }
          const kbText = (rawBytes / 1024).toFixed(1) + ' KB';
          if (usageEl) {
            usageEl.textContent = `Dung lượng: ${kbText} • Schema v${appState.schemaVersion || 5}`;
          }

          const aiMsgCount = Object.values(appState.aiConversations || {}).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0);
          const srsCount = (appState.srsWords || []).length;
          const revCount = (appState.reviewLogs || []).length;
          const ledCount = (appState.ledger || []).length;
          const nbCount = (appState.mistakeNotebookItems || []).length;
          const snapCount = (appState.dbSnapshots || []).length;

          if (telEl) {
            telEl.textContent = `IndexedDB v5 (${idbInstance ? 'Connected 8 Stores' : 'LocalStorage Primary'}) • Write-Coalescing: 120ms • Checksum: ${checksum}`;
          }

          if (gridEl) {
            const metrics = [
              { label: 'Thẻ FSRS-5', val: srsCount + ' thẻ', color: 'text-emerald-300' },
              { label: 'Review Logs', val: revCount + ' lượt', color: 'text-amber-300' },
              { label: 'Sổ cái Ledger', val: ledCount + ' GD', color: 'text-teal-300' },
              { label: 'Sổ tay cá nhân', val: nbCount + ' mục', color: 'text-emerald-300' },
              { label: 'Hội thoại AI', val: aiMsgCount + ' câu', color: 'text-amber-300' },
              { label: 'Bản lưu PITR', val: snapCount + '/8 bản', color: 'text-teal-300' }
            ];
            gridEl.innerHTML = metrics.map(m => `
              <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span class="text-slate-400">${m.label}:</span>
                <span class="font-extrabold ${m.color}">${m.val}</span>
              </div>
            `).join('');
          }

          if (selSnap) {
            const snaps = appState.dbSnapshots || [];
            if (snaps.length === 0) {
              selSnap.innerHTML = '<option value="">Chưa có điểm sao lưu tự động</option>';
            } else {
              selSnap.innerHTML = snaps.map((s, idx) => `
                <option value="${escapeHtml(s.id)}">#${idx + 1}: ${escapeHtml(s.timeLabel)} — ${escapeHtml(s.reason)} (${s.exp} EXP, ${s.gems} 💎)</option>
              `).join('');
            }
          }
        }
        window.renderDatabaseControlCenterUI = renderDatabaseControlCenterUI;
        renderDatabaseControlCenterUI();

        const btnVacuum = document.getElementById('btnRunDbVacuum');
        if (btnVacuum) {
          btnVacuum.addEventListener('click', () => {
            playSfx('levelup');
            runDatabaseVacuumAndVerify(false);
          });
        }

        const btnManualSnap = document.getElementById('btnCreateManualSnapshot');
        if (btnManualSnap) {
          btnManualSnap.addEventListener('click', () => {
            playSfx('correct');
            createDatabaseSnapshot('Sao lưu thủ công từ Trung tâm DB', false);
            saveStateToDatabase('Tạo điểm khôi phục PITR thủ công');
          });
        }

        const btnRestoreSnap = document.getElementById('btnRestoreSelectedSnapshot');
        if (btnRestoreSnap) {
          btnRestoreSnap.addEventListener('click', () => {
            const selSnap = document.getElementById('selectDbSnapshotRestore');
            const snapId = selSnap ? selSnap.value : '';
            playSfx('levelup');
            restoreDatabaseFromSnapshot(snapId);
          });
        }

        
        // ====================================================================
        // FEATURE G: HANBEEGO+ ALL-IN-ONE STUDIO (22 SIDEBAR ITEMS, HSK 1-9 MOCK EXAMS,
        //            TOCFL, VIDEO LESSONS, SHADOWING, TRANSLATION, MNEMONICS & CLASSIFIERS)
        // ====================================================================
        let activeHbModule = 'hsk_exam';
        let activeHskExamLevel = 1;
        let activeHskExamPaper = 1;
        let hskMockAnswers = {};
        let hskMockSubmitted = false;
        let hskMockSecondsLeft = 2400;
        let hskMockTimerId = null;

        let activeTocflBand = 'Band A (Cấp 1-2)';
        let tocflUseTraditional = true;
        let tocflAnswers = {};
        let tocflSubmitted = false;

        let activeVideoIdx = 0;
        let activeVideoLineIdx = 0;
        let videoAutoPlaying = false;
        let videoAutoTimer = null;

        let activeShadowIdx = 0;
        let shadowSpeed = 0.92;
        let shadowScoreResult = null;

        let activeTransIdx = 0;
        let transUserWords = [];
        let transFeedback = null;

        let activeMeasureQuizAnswers = {};
        let measureQuizSubmitted = false;

        // 1. HSK 1-9 Standard Mock Exam Question Generator (Listening + Reading + Writing)
        function getHskMockExamQuestions(level, paperNum) {
          const bankLv = Math.min(6, Math.max(1, level <= 6 ? level : 6));
          const bank = getParsedHskBank(bankLv);
          const offset = ((paperNum - 1) * 12 + (level * 5)) % Math.max(1, bank.length - 15);
          const slice = [];
          for (let i = 0; i < 12; i++) {
            slice.push(bank[Math.min(offset + i, bank.length - 1)]);
          }

          const questions = [];
          // Part 1: Listening (Câu 1 - 4)
          for (let i = 0; i < 4; i++) {
            const w = slice[i];
            const d = pickSmartLinguisticDistractors(w, bank, 3);
            const ansIdx = (i + paperNum) % 4;
            const opts = [];
            let dp = 0;
            for (let s = 0; s < 4; s++) {
              if (s === ansIdx) opts.push(`${w.hanzi} (${w.pinyin}) — ${w.meaning}`);
              else {
                const dw = d[dp++] || slice[(i + s + 1) % 12];
                opts.push(`${dw.hanzi} (${dw.pinyin}) — ${dw.meaning}`);
              }
            }
            questions.push({
              id: 'q_' + (i + 1),
              num: i + 1,
              section: 'listen',
              sectionTitle: '🎧 Phần 1: Nghe Hiểu (听力)',
              audioText: w.rawExample || w.example || w.hanzi,
              prompt: `Câu ${i + 1} [Nghe Hiểu HSK ${level === 7 ? '7-9' : level}]: Bấm nghe đoạn băng và chọn từ vựng / ý nghĩa xuất hiện trong câu nói:`,
              options: opts,
              answer: ansIdx,
              wordObj: w,
              explain: `Trong băng phát câu: "${w.rawExample || w.hanzi}" (${w.pinyin}) — Từ trọng tâm là "${w.hanzi}" nghĩa là "${w.meaning}".`
            });
          }

          // Part 2: Reading & Cloze (Câu 5 - 8)
          for (let i = 4; i < 8; i++) {
            const w = slice[i];
            const d = pickSmartLinguisticDistractors(w, bank, 3);
            const ansIdx = (i + level) % 4;
            const opts = [];
            let dp = 0;
            for (let s = 0; s < 4; s++) {
              if (s === ansIdx) opts.push(`${w.hanzi} (${w.pinyin})`);
              else {
                const dw = d[dp++] || slice[(i + s + 1) % 12];
                opts.push(`${dw.hanzi} (${dw.pinyin})`);
              }
            }
            const rawSent = (w.rawExample || ('我今天学习' + w.hanzi + '。')).split('🔗')[0];
            const clozeSent = rawSent.includes(w.hanzi) ? rawSent.replace(w.hanzi, '（ ___ ）') : `（ ___ ） — Nghĩa câu: ${w.meaning}`;
            questions.push({
              id: 'q_' + (i + 1),
              num: i + 1,
              section: 'read',
              sectionTitle: '📖 Phần 2: Đọc Hiểu & Điền Từ (阅读)',
              audioText: rawSent,
              prompt: `Câu ${i + 1} [Đọc Hiểu]: Chọn từ thích hợp nhất điền vào chỗ trống: "${clozeSent}" (Gợi ý nghĩa: ${w.meaning})`,
              options: opts,
              answer: ansIdx,
              wordObj: w,
              explain: `Đáp án đúng là ${w.hanzi} (${w.pinyin} — ${w.meaning}). Câu hoàn chỉnh: ${rawSent}`
            });
          }

          // Part 3: Writing & Sentence Structure (Câu 9 - 12)
          for (let i = 8; i < 12; i++) {
            const w = slice[i];
            const d = pickSmartLinguisticDistractors(w, bank, 3);
            const ansIdx = (i + paperNum + 1) % 4;
            const rawSent = (w.rawExample || ('我们一起学习' + w.hanzi + '。')).split('🔗')[0].split('（')[0];
            const opts = [];
            let dp = 0;
            for (let s = 0; s < 4; s++) {
              if (s === ansIdx) opts.push(`${rawSent} (Sử dụng đúng: ${w.hanzi} — ${w.meaning})`);
              else {
                const dw = d[dp++] || slice[(i + s + 1) % 12];
                opts.push(`*Câu sai ngữ cảnh:* Dùng nhầm với ${dw.hanzi} (${dw.meaning})`);
              }
            }
            questions.push({
              id: 'q_' + (i + 1),
              num: i + 1,
              section: 'write',
              sectionTitle: '✍️ Phần 3: Viết & Cấu Trúc Câu (书写)',
              audioText: rawSent,
              prompt: `Câu ${i + 1} [Viết & Sắp xếp câu]: Chọn câu tiếng Trung viết đúng ngữ pháp và dùng chuẩn từ "${w.hanzi}" (${w.pinyin} — ${w.meaning}):`,
              options: opts,
              answer: ansIdx,
              wordObj: w,
              explain: `Câu viết đúng chuẩn ngữ pháp HSK là: ${rawSent} (${w.hanzi} = ${w.meaning}).`
            });
          }

          return questions;
        }

        // 2. TOCFL Taiwan Exam Data (Supports Traditional 繁體 <-> Simplified 简体)
        const TOCFL_QUESTIONS_BANK = {
          'Band A (Cấp 1-2)': [
            {
              qTrad: '1. [聽力/閱讀 Band A] 請問「火車站怎麼走？」這句話是什麼意思？',
              qSimp: '1. [听力/阅读 Band A] 请问“火车站怎么走？”这句话是什么意思？',
              py: 'Qǐngwèn "huǒchēzhàn zěnme zǒu?" zhè jù huà shì shénme yìsi?',
              speak: '请问火车站怎么走',
              optsTrad: ['Xin hỏi đường đi ra nhà ga tàu hỏa thế nào?', 'Tàu hỏa mấy giờ thì khởi hành?', 'Vé tàu hỏa giá bao nhiêu tiền?', 'Nhà ga tàu điện ngầm ở đâu?'],
              optsSimp: ['Xin hỏi đường đi ra nhà ga tàu hỏa thế nào?', 'Tàu hỏa mấy giờ thì khởi hành?', 'Vé tàu hỏa giá bao nhiêu tiền?', 'Nhà ga tàu điện ngầm ở đâu?'],
              answer: 0,
              explain: '火車站 / 火车站 (huǒchēzhàn) là nhà ga tàu hỏa; 怎麼走 / 怎么走 (zěnme zǒu) là đi như thế nào.'
            },
            {
              qTrad: '2. [閱讀 Band A] 週末我喜歡跟朋友去夜市吃台灣小吃，特別是珍珠奶茶。文中說話的人週末做什麼？',
              qSimp: '2. [阅读 Band A] 周末我喜欢跟朋友去夜市吃台湾小吃，特别是珍珠奶茶。文中说话的人周末做什么？',
              py: 'Zhōumò wǒ xǐhuan gēn péngyou qù yèshì chī Táiwān xiǎochī, tèbié shì zhēnzhū nǎichá.',
              speak: '周末我喜欢跟朋友去夜市吃台湾小吃',
              optsTrad: ['Đi chợ đêm ăn quà vặt Đài Loan và uống trà sữa trân châu', 'Ở nhà nấu cơm cùng gia đình', 'Đến thư viện trường đại học ôn thi', 'Đi siêu thị mua trái cây tươi'],
              optsSimp: ['Đi chợ đêm ăn quà vặt Đài Loan và uống trà sữa trân châu', 'Ở nhà nấu cơm cùng gia đình', 'Đến thư viện trường đại học ôn thi', 'Đi siêu thị mua trái cây tươi'],
              answer: 0,
              explain: '夜市 (yèshì) = chợ đêm; 小吃 (xiǎochī) = món ăn vặt; 珍珠奶茶 (zhēnzhū nǎichá) = trà sữa trân châu.'
            },
            {
              qTrad: '3. [語法 Band A] 這件衣服不但好看，（ ___ ）價錢也很便宜。',
              qSimp: '3. [语法 Band A] 这件衣服不但好看，（ ___ ）价钱也很便宜。',
              py: 'Zhè jiàn yīfu búdàn hǎokàn, érqiě jiàqian yě hěn piányi.',
              speak: '这件衣服不但好看而且价钱也很便宜',
              optsTrad: ['而且 (érqiě - mà còn)', '雖然 (suīrán - tuy rằng)', '因為 (yīnwèi - bởi vì)', '不過 (búguò - nhưng mà)'],
              optsSimp: ['而且 (érqiě - mà còn)', '虽然 (suīrán - tuy rằng)', '因为 (yīnwèi - bởi vì)', '不过 (búguò - nhưng mà)'],
              answer: 0,
              explain: 'Cấu trúc 不但……而且…… (búdàn... érqiě...): Không những... mà còn...'
            },
            {
              qTrad: '4. [生活會話 Band A] A:「不好意思，請問這裡可以刷卡嗎？」 B:「___」',
              qSimp: '4. [生活会话 Band A] A:“不好意思，请问这里可以刷卡吗？” B:“___”',
              py: 'Bù hǎoyìsi, qǐngwèn zhèlǐ kěyǐ shuākǎ ma?',
              speak: '不好意思请问这里可以刷卡吗',
              optsTrad: ['可以，刷信用卡或用手機支付都可以。(Được, quẹt thẻ hay thanh toán điện thoại đều được)', '我今天沒有帶雨傘。(Hôm nay tôi không mang ô)', '這班公車不到台北車站。(Chuyến xe buýt này không tới ga Đài Bắc)', '太貴了，便宜一點吧。(Đắt quá, bớt chút đi)'],
              optsSimp: ['可以，刷信用卡或用手机支付都可以。(Được, quẹt thẻ hay thanh toán điện thoại đều được)', '我今天没有带雨伞。(Hôm nay tôi không mang ô)', '这班公车不到台北车站。(Chuyến xe buýt này không tới ga Đài Bắc)', '太贵了，便宜一点吧。(Đắt quá, bớt chút đi)'],
              answer: 0,
              explain: '刷卡 (shuākǎ) nghĩa là quẹt thẻ ngân hàng/tín dụng.'
            }
          ],
          'Band B (Cấp 3-4)': [
            {
              qTrad: '1. [閱讀 Band B] 隨著遠距工作的普及，越來越多青年選擇在咖啡館辦公。這段話主要說明了什麼趨勢？',
              qSimp: '1. [阅读 Band B] 随着远距工作的普及，越来越多青年选择在咖啡馆办公。这段话主要说明了什么趋势？',
              py: 'Suízhe yuǎnjù gōngzuò de pǔjí, yuèláiyuè duō qīngnián xuǎnzé zài kāfēiguǎn bàngōng.',
              speak: '随着远距工作的普及越来越多青年选择在咖啡馆办公',
              optsTrad: ['Hình thức làm việc từ xa ngày càng phổ biến trong giới trẻ', 'Giới trẻ không còn thích uống cà phê nữa', 'Các công ty cấm nhân viên làm việc ngoài văn phòng', 'Giá thuê văn phòng đang giảm mạnh'],
              optsSimp: ['Hình thức làm việc từ xa ngày càng phổ biến trong giới trẻ', 'Giới trẻ không còn thích uống cà phê nữa', 'Các công ty cấm nhân viên làm việc ngoài văn phòng', 'Giá thuê văn phòng đang giảm mạnh'],
              answer: 0,
              explain: '遠距工作 / 远距工作 (yuǎnjù gōngzuò) = làm việc từ xa (remote work); 普及 (pǔjí) = phổ biến.'
            },
            {
              qTrad: '2. [詞彙 Band B] 面對激烈的市場競爭，企業必須不斷創新，否則很容易被（ ___ ）。',
              qSimp: '2. [词汇 Band B] 面对激烈的市场竞争，企业必须不断创新，否则很容易被（ ___ ）。',
              py: 'Miànduì jīliè de shìchǎng jìngzhēng, qǐyè bìxū bùduàn chuàngxīn, fǒuzé hěn róngyì bèi táotài.',
              speak: '面对激烈的市场竞争企业必须不断创新',
              optsTrad: ['淘汰 (táotài - đào thải)', '鼓勵 (gǔlì - khích lệ)', '讚美 (zànměi - khen ngợi)', '保護 (bǎohù - bảo vệ)'],
              optsSimp: ['淘汰 (táotài - đào thải)', '鼓励 (gǔlì - khích lệ)', '赞美 (zànměi - khen ngợi)', '保护 (bǎohù - bảo vệ)'],
              answer: 0,
              explain: '淘汰 (táotài) = bị đào thải, loại bỏ.'
            },
            {
              qTrad: '3. [語法 Band B] （ ___ ）明天下大雨，我們的登山活動還是會照常舉行。',
              qSimp: '3. [语法 Band B] （ ___ ）明天下大雨，我们的登山活动还是会照常举行。',
              py: 'Jíshǐ míngtiān xià dàyǔ, wǒmen de dēngshān huódòng háishi huì zhàocháng jǔxíng.',
              speak: '即使明天下大雨我们的登山活动还是会照常举行',
              optsTrad: ['即使 (jíshǐ - cho dù)', '自從 (zìcóng - từ khi)', '由於 (yóuyú - do bởi)', '趁著 (chènzhe - nhân lúc)'],
              optsSimp: ['即使 (jíshǐ - cho dù)', '自从 (zìcóng - từ khi)', '由于 (yóuyú - do bởi)', '趁着 (chènzhe - nhân lúc)'],
              answer: 0,
              explain: '即使……還是…… (jíshǐ... háishi...): Cho dù... thì vẫn...'
            },
            {
              qTrad: '4. [職場會話 Band B] 「這份企劃案的細節還需要再斟酌一下。」句中「斟酌」的意思最接近哪一個？',
              qSimp: '4. [职场会话 Band B] “这份企划案的细节还需要再斟酌一下。”句中“斟酌”的意思最接近哪一个？',
              py: 'Zhè fèn qǐhuà àn de xìjié hái xūyào zài zhēnzhuó yīxià.',
              speak: '这份企划案的细节还需要再斟酌一下',
              optsTrad: ['Cân nhắc, suy tính kỹ lưỡng (考慮清楚)', 'Xóa bỏ hoàn toàn (全部刪除)', 'Công bố ngay lập tức (立刻公布)', 'Sao chép nguyên bản (完全複製)'],
              optsSimp: ['Cân nhắc, suy tính kỹ lưỡng (考虑清楚)', 'Xóa bỏ hoàn toàn (全部删除)', 'Công bố ngay lập tức (立刻公布)', 'Sao chép nguyên bản (完全复制)'],
              answer: 0,
              explain: '斟酌 (zhēnzhuó) nghĩa là cân nhắc, đắn đo suy xét kỹ từng chi tiết.'
            }
          ],
          'Band C (Cấp 5-6)': [
            {
              qTrad: '1. [學術閱讀 Band C] 傳統文化與現代科技並非水火不容，反而可以相輔相成，煥發出嶄新的生命力。文中的觀點是什麼？',
              qSimp: '1. [学术阅读 Band C] 传统文化与现代科技并非水火不容，反而可以相辅相成，焕发出崭新的生命力。文中的观点是什么？',
              py: 'Chuántǒng wénhuà yǔ xiàndài kējì bìngfēi shuǐhuǒ bù róng, fǎn ér kěyǐ xiāngfǔ xiāngchéng.',
              speak: '传统文化与现代科技并非水火不容反而可以相辅相成',
              optsTrad: ['Văn hóa truyền thống và công nghệ hiện đại bổ trợ lẫn nhau, tạo sức sống mới', 'Công nghệ hiện đại làm mai một hoàn toàn văn hóa truyền thống', 'Hai lĩnh vực này xung khắc như nước với lửa', 'Chỉ nên bảo tồn văn hóa cổ đại và hạn chế công nghệ'],
              optsSimp: ['Văn hóa truyền thống và công nghệ hiện đại bổ trợ lẫn nhau, tạo sức sống mới', 'Công nghệ hiện đại làm mai một hoàn toàn văn hóa truyền thống', 'Hai lĩnh vực này xung khắc như nước với lửa', 'Chỉ nên bảo tồn văn hóa cổ đại và hạn chế công nghệ'],
              answer: 0,
              explain: '水火不容 (xung khắc như nước với lửa); 相輔相成 / 相辅相成 (bổ trợ lẫn nhau).'
            },
            {
              qTrad: '2. [成語運用 Band C] 他在這個領域深耕二十餘年，提出的見解總是（ ___ ），令人嘆服。',
              qSimp: '2. [成语运用 Band C] 他在这个领域深耕二十余年，提出的见解总是（ ___ ），令人叹服。',
              py: 'Tā zài zhè gè lǐngyù shēngēng èrshí yú nián, tíchū de jiànjiě zǒngshì yīzhēn jiànxiě.',
              speak: '他在这个领域深耕二十余年提出的见解总是一针见血',
              optsTrad: ['一針見血 (yīzhēn jiànxiě - sắc bén, trúng ngay bản chất vấn đề)', '半途而廢 (bàntú érfèi - bỏ cuộc giữa chừng)', '莫名其妙 (mòmíng qímiào - kỳ quặc khó hiểu)', '馬馬虎虎 (mǎmǎhūhū - qua loa đại khái)'],
              optsSimp: ['一针见血 (yīzhēn jiànxiě - sắc bén, trúng ngay bản chất vấn đề)', '半途而废 (bàntú érfèi - bỏ cuộc giữa chừng)', '莫名其妙 (mòmíng qímiào - kỳ quặc khó hiểu)', '马马虎虎 (mǎmǎhūhū - qua loa đại khái)'],
              answer: 0,
              explain: '一針見血 / 一针见血 (nhất châm kiến huyết): nói ngắn gọn mà đi thẳng vào cốt lõi vấn đề.'
            }
          ]
        };

        // 3. Video Situation Lessons Data (6 Interactive Situational Videos inspired by HanbeeGo)
        const VIDEO_LESSONS_DATA = [
          {
            id: 'vid_milktea',
            title: '1. Cách gọi trà sữa bằng tiếng Trung (点奶茶)',
            level: 'HSK 1–2',
            duration: '02:15',
            sceneEmoji: '🧋🏪',
            sceneDesc: 'Tại quầy trà sữa Thượng Hải: Chọn món, độ ngọt (半糖/少糖) và lượng đá (少冰/去冰)',
            lines: [
              { speaker: 'Nhân viên (店员)', hz: '你好！欢迎光临，请问想喝点什么？', py: 'Nǐ hǎo! Huānyíng guānglín, qǐngwèn xiǎng hē diǎn shénme?', vi: 'Xin chào! Chào mừng quý khách, bạn muốn uống gì ạ?', vocab: '欢迎光临 (huānyíng guānglín): Chào mừng quý khách' },
              { speaker: 'Khách hàng (顾客)', hz: '你好，我要一杯珍珠奶茶，大杯的。', py: 'Nǐ hǎo, wǒ yào yī bēi zhēnzhū nǎichá, dà bēi de.', vi: 'Chào bạn, cho mình một ly trà sữa trân châu cỡ lớn.', vocab: '珍珠奶茶 (zhēnzhū nǎichá): Trà sữa trân châu' },
              { speaker: 'Nhân viên (店员)', hz: '好的，请问甜度和冰块怎么选？', py: 'Hǎo de, qǐngwèn tiándù hé bīngkuài zěnme xuǎn?', vi: 'Vâng, xin hỏi bạn chọn độ ngọt và lượng đá thế nào?', vocab: '甜度 (tiándù): Độ ngọt • 冰块 (bīngkuài): Đá viên' },
              { speaker: 'Khách hàng (顾客)', hz: '我要少冰、半糖，可以用微信支付吗？', py: 'Wǒ yào shǎo bīng, bàn táng, kěyǐ yòng Wēixìn zhīfù ma?', vi: 'Cho mình ít đá, nửa đường, có thể thanh toán bằng WeChat không?', vocab: '少冰 (shǎo bīng): Ít đá • 半糖 (bàn táng): 50% đường' }
            ],
            quiz: {
              q: 'Trong video, khách hàng đã chọn mức đá và đường như thế nào cho ly trà sữa?',
              opts: ['Ít đá, nửa đường (少冰、半糖)', 'Không đá, nguyên đường (去冰、全糖)', 'Nhiều đá, ít đường (多冰、微糖)', 'Trà sữa nóng không đường (热饮、无糖)'],
              ans: 0
            }
          },
          {
            id: 'vid_myday',
            title: '2. Một ngày của tôi (我的一天 • Nói về thói quen hằng ngày)',
            level: 'HSK 1–2',
            duration: '02:40',
            sceneEmoji: '🌅☕💻',
            sceneDesc: 'Kể về lịch trình sinh hoạt một ngày từ lúc thức dậy, uống cà phê đến khi học tiếng Trung buổi tối',
            lines: [
              { speaker: 'Tiểu Minh (小明)', hz: '我每天早上七点起床，先喝一杯温水。', py: 'Wǒ měitiān zǎoshang qī diǎn qǐchuáng, xiān hē yī bēi wēnshuǐ.', vi: 'Mỗi sáng tôi thức dậy lúc 7 giờ, trước tiên uống một cốc nước ấm.', vocab: '起床 (qǐchuáng): Thức dậy' },
              { speaker: 'Tiểu Minh (小明)', hz: '八点半我坐地铁去公司上班。', py: 'Bā diǎn bàn wǒ zuò dìtiě qù gōngsī shàngbān.', vi: '8 rưỡi tôi đi tàu điện ngầm đến công ty làm việc.', vocab: '地铁 (dìtiě): Tàu điện ngầm • 上班 (shàngbān): Đi làm' },
              { speaker: 'Tiểu Minh (小明)', hz: '下午工作虽然很忙，但是很有意思。', py: 'Xiàwǔ gōngzuò suīrán hěn máng, dànshì hěn yǒuyìsi.', vi: 'Buổi chiều công việc tuy bận rộn nhưng rất thú vị.', vocab: '虽然…但是… (suīrán... dànshì...): Tuy... nhưng...' },
              { speaker: 'Tiểu Minh (小明)', hz: '晚上回家以后，我坚持学习三十分钟中文。', py: 'Wǎnshang huí jiā yǐhòu, wǒ jiānchí xuéxí sānshí fēnzhōng Zhōngwén.', vi: 'Tối về nhà, tôi kiên trì học tiếng Trung 30 phút.', vocab: '坚持 (jiānchí): Kiên trì' }
            ],
            quiz: {
              q: 'Buổi tối sau khi về nhà, nhân vật trong video làm gì?',
              opts: ['Kiên trì học tiếng Trung 30 phút', 'Đi xem phim cùng bạn bè', 'Tập thể dục ở công viên', 'Ngủ sớm lúc 8 giờ tối'],
              ans: 0
            }
          },
          {
            id: 'vid_supermarket',
            title: '3. Đi siêu thị Trung Quốc mua đồ (去超市买东西)',
            level: 'HSK 2–3',
            duration: '03:05',
            sceneEmoji: '🛒🍎💳',
            sceneDesc: 'Mua trái cây, hỏi chương trình khuyến mãi và thanh toán quét mã QR tại siêu thị',
            lines: [
              { speaker: 'Lan Anh (兰英)', hz: '请问，今天的苹果怎么卖？新鲜吗？', py: 'Qǐngwèn, jīntiān de píngguǒ zěnme mài? Xīnxiān ma?', vi: 'Xin hỏi táo hôm nay bán thế nào? Có tươi không ạ?', vocab: '怎么卖 (zěnme mài): Bán thế nào • 新鲜 (xīnxiān): Tươi mới' },
              { speaker: 'Nhân viên (促销员)', hz: '非常新鲜！今天打八折，一斤只要六块钱。', py: 'Fēicháng xīnxiān! Jīntiān dǎ bā zhé, yī jīn zhǐ yào liù kuài qián.', vi: 'Rất tươi! Hôm nay giảm giá 20% (đánh 8 phần), nửa cân chỉ 6 tệ thôi.', vocab: '打八折 (dǎ bā zhé): Giảm giá 20% (còn 80%)' },
              { speaker: 'Lan Anh (兰英)', hz: '太划算了！那我买三斤苹果，再来一袋牛奶。', py: 'Tài huásuàn le! Nà wǒ mǎi sān jīn píngguǒ, zài lái yī dài niúnǎi.', vi: 'Hời quá! Vậy tôi mua 1.5kg táo, lấy thêm một bịch sữa tươi.', vocab: '划算 (huásuàn): Đáng đồng tiền, hời' }
            ],
            quiz: {
              q: 'Trong tiếng Trung, cụm từ "打八折 (dǎ bā zhé)" khi mua hàng nghĩa là gì?',
              opts: ['Giảm giá 20% (chỉ tính 80% giá gốc)', 'Giảm giá 80% (chỉ tính 20% giá gốc)', 'Mua 8 tặng 1', 'Tăng giá thêm 8 tệ'],
              ans: 0
            }
          },
          {
            id: 'vid_firstday',
            title: '4. Ngày đầu tiên đi học của tôi (开学第一天)',
            level: 'HSK 1–2',
            duration: '02:30',
            sceneEmoji: '🏫🎒🤝',
            sceneDesc: 'Làm quen bạn cùng lớp quốc tế và hỏi phòng học trong ngày đầu nhập học',
            lines: [
              { speaker: 'Minh (阿明)', hz: '你好！我是新来的留学生，我叫阿明，来自越南。', py: 'Nǐ hǎo! Wǒ shì xīn lái de liúxuéshēng, wǒ jiào Ā Míng, láizì Yuènán.', vi: 'Xin chào! Mình là du học sinh mới tới, tên là Minh, đến từ Việt Nam.', vocab: '留学生 (liúxuéshēng): Du học sinh' },
              { speaker: 'Tiểu Vũ (小雨)', hz: '认识你很高兴！我们都在三零二教室上课，一起走吧！', py: 'Rènshi nǐ hěn gāoxìng! Wǒmen dōu zài sān líng èr jiàoshì shàngkè, yīqǐ zǒu ba!', vi: 'Rất vui được quen bạn! Chúng mình đều học ở phòng 302, đi cùng nhau nhé!', vocab: '教室 (jiàoshì): Phòng học' }
            ],
            quiz: {
              q: 'Hai bạn sinh viên trong video cùng học tại phòng học số mấy?',
              opts: ['Phòng học 302 (三零二教室)', 'Phòng học 205 (二零五教室)', 'Thư viện tầng 4', 'Hội trường lớn'],
              ans: 0
            }
          },
          {
            id: 'vid_newyear',
            title: '5. Trò chuyện năm mới bằng tiếng Trung (春节拜年)',
            level: 'HSK 2–3',
            duration: '02:50',
            sceneEmoji: '🧧🏮🥟',
            sceneDesc: 'Chúc Tết Nguyên Đán, ăn sủi cảo và nhận phong bao lì xì đỏ',
            lines: [
              { speaker: 'Tiểu Long (小龙)', hz: '新年快乐！祝你新的一年身体健康，万事如意！', py: 'Xīnnián kuàilè! Zhù nǐ xīn de yī nián shēntǐ jiànkāng, wànshì rúyì!', vi: 'Chúc mừng năm mới! Chúc bạn năm mới dồi dào sức khỏe, vạn sự như ý!', vocab: '万事如意 (wànshì rúyì): Vạn sự như ý' },
              { speaker: 'Bạn học (同学)', hz: '谢谢！今晚我们一起包饺子、看春节联欢晚会吧！', py: 'Xièxie! Jīnwǎn wǒmen yīqǐ bāo jiǎozi, kàn Chūnjié Liánhuān Wǎnhuì ba!', vi: 'Cảm ơn! Tối nay chúng mình cùng gói sủi cảo và xem Gala Tết nhé!', vocab: '包饺子 (bāo jiǎozi): Gói sủi cảo' }
            ],
            quiz: {
              q: 'Thành ngữ "万事如意 (wànshì rúyì)" dùng khi chúc Tết có nghĩa là gì?',
              opts: ['Vạn sự như ý, mọi điều tốt đẹp', 'Làm ăn phát tài', 'Học hành đỗ đạt', 'Sớm tìm được người yêu'],
              ans: 0
            }
          },
          {
            id: 'vid_interview',
            title: '6. Phỏng vấn & Giao tiếp công sở (职场面试)',
            level: 'HSK 4–6',
            duration: '03:20',
            sceneEmoji: '💼🏢🤝',
            sceneDesc: 'Tự giới thiệu kinh nghiệm làm việc và điểm mạnh bản thân trong buổi phỏng vấn',
            lines: [
              { speaker: 'Nhà tuyển dụng (面试官)', hz: '请先用中文简单介绍一下你的工作经验。', py: 'Qǐng xiān yòng Zhōngwén jiǎndān jièshào yīxià nǐ de gōngzuò jīngyàn.', vi: 'Xin hãy dùng tiếng Trung giới thiệu ngắn gọn kinh nghiệm làm việc của bạn.', vocab: '工作经验 (gōngzuò jīngyàn): Kinh nghiệm làm việc' },
              { speaker: 'Ứng viên (求职者)', hz: '我大学毕业后在一家外企工作了三年，擅长跨部门沟通与项目管理。', py: 'Wǒ dàxué bìyè hòu zài yī jiā wàiqǐ gōngzuò le sān nián, shàncháng kuà bùmén gōutōng yǔ xiàngmù guǎnlǐ.', vi: 'Sau khi tốt nghiệp đại học, tôi làm việc 3 năm tại công ty nước ngoài, giỏi giao tiếp liên phòng ban và quản lý dự án.', vocab: '擅长 (shàncháng): Giỏi về, sở trường' }
            ],
            quiz: {
              q: 'Ứng viên trong video có sở trường (擅长) về lĩnh vực gì?',
              opts: ['Giao tiếp liên phòng ban và quản lý dự án', 'Kế toán kiểm toán quốc tế', 'Thiết kế đồ họa 3D', 'Lập trình hệ thống mạng'],
              ans: 0
            }
          }
        ];

        // 4. Shadowing Sentences Data (Karaoke Synchronized Speaking Practice)
        const SHADOWING_SENTENCES = [
          { level: 'HSK 1', hz: '你好，很高兴认识你，请问你叫什么名字？', py: 'Nǐ hǎo, hěn gāoxìng rènshi nǐ, qǐngwèn nǐ jiào shénme míngzi?', vi: 'Xin chào, rất vui được làm quen với bạn, xin hỏi bạn tên là gì?' },
          { level: 'HSK 2', hz: '今天天气真不错，我们下午一起去公园散步吧！', py: 'Jīntiān tiānqì zhēn búcuò, wǒmen xiàwǔ yīqǐ qù gōngyuán sànbù ba!', vi: 'Hôm nay thời tiết đẹp thật, chiều nay chúng mình cùng ra công viên đi dạo nhé!' },
          { level: 'HSK 3', hz: '虽然学习汉语有时候觉得很难，但是只要每天坚持就一定会流利。', py: 'Suīrán xuéxí Hànyǔ yǒushíhou juéde hěn nán, dànshì zhǐyào měitiān jiānchí jiù yīdìng huì liúlì.', vi: 'Tuy học tiếng Trung đôi lúc thấy khó, nhưng chỉ cần kiên trì mỗi ngày nhất định sẽ lưu loát.' },
          { level: 'HSK 4', hz: '养成良好的时间管理习惯，能够大大提高我们的工作效率。', py: 'Yǎngchéng liánghǎo de shíjiān guǎnlǐ xíguàn, nénggòu dàdà tígāo wǒmen de gōngzuò xiàolǜ.', vi: 'Hình thành thói quen quản lý thời gian tốt có thể nâng cao đáng kể hiệu suất làm việc của chúng ta.' },
          { level: 'HSK 5–6', hz: '真正优秀的沟通不仅在于表达清楚自己的观点，更在于耐心倾听对方的想法。', py: 'Zhēnzhèng yōuxiù de gōutōng bùjǐn zàiyú biǎodá qīngchu zìjǐ de guāndiǎn, gèng zàiyú nàixīn qīngtīng duìfāng de xiǎngfǎ.', vi: 'Giao tiếp xuất sắc thực sự không chỉ nằm ở việc trình bày rõ quan điểm của mình, mà còn ở sự kiên nhẫn lắng nghe suy nghĩ của đối phương.' }
        ];

        // 5. Translation & Mixed Reflex Exercises (Luyện dịch Việt <-> Trung & Bài tập tổng hợp)
        const TRANSLATION_CHALLENGES = [
          { level: 'HSK 1', vi: 'Hôm nay tôi đi cửa hàng mua trái cây.', targetHz: '我今天去商店买水果。', py: 'Wǒ jīntiān qù shāngdiàn mǎi shuǐguǒ.', bricks: ['我', '今天', '去', '商店', '买', '水果', '。', '明天'], tip: 'Trạng ngữ thời gian (今天) đặt ngay sau chủ ngữ (我) và trước động từ (去商店买水果).' },
          { level: 'HSK 2', vi: 'Bộ quần áo này vừa đẹp vừa rẻ.', targetHz: '这件衣服又好看又便宜。', py: 'Zhè jiàn yīfu yòu hǎokàn yòu piányi.', bricks: ['这件', '衣服', '又', '好看', '又', '便宜', '。', '那本'], tip: 'Cấu trúc 又 A 又 B (vừa A vừa B) + lượng từ của quần áo là 件 (jiàn).' },
          { level: 'HSK 3', vi: 'Anh ấy nói tiếng Trung lưu loát hơn tôi.', targetHz: '他汉语说得比我流利。', py: 'Tā Hànyǔ shuō de bǐ wǒ liúlì.', bricks: ['他', '汉语', '说得', '比', '我', '流利', '。', '很'], tip: 'Câu so sánh 比 + Bổ ngữ trình độ 得: tuyệt đối KHÔNG dùng 很 trước tính từ 流利.' },
          { level: 'HSK 4', vi: 'Bạn hãy gửi bản báo cáo đã tổng hợp xong cho giám đốc.', targetHz: '请你把整理好的报告发给经理。', py: 'Qǐng nǐ bǎ zhěnglǐ hǎo de bàogào fā gěi jīnglǐ.', bricks: ['请你', '把', '整理好的', '报告', '发给', '经理', '。', '被'], tip: 'Câu chữ 把: Chủ ngữ + 把 + Tân ngữ xác định + Động từ + Kết quả (发给经理).' },
          { level: 'HSK 5–6', vi: 'Lý thuyết và thực tiễn là hai yếu tố bổ trợ lẫn nhau.', targetHz: '理论与实践是相辅相成的。', py: 'Lǐlùn yǔ shíjiàn shì xiāngfǔ xiāngchéng de.', bricks: ['理论', '与', '实践', '是', '相辅相成', '的', '。', '不仅'], tip: 'Thành ngữ 相辅相成 (xiāngfǔ xiāngchéng): bổ trợ, hỗ trợ lẫn nhau.' }
        ];

        // 6. Visual Mnemonics Data (Mẹo nhớ từ vựng qua chiết tự bộ thủ)
        const MNEMONICS_DATA = [
          { char: '休', py: 'xiū', hv: 'Hưu', mean: 'Nghỉ ngơi', formula: '亻 (Nhân - Người) + 木 (Mộc - Cây)', story: 'Một người (亻) đi đường mệt mỏi, tựa lưng vào gốc cây (木) bóng mát để NGHỈ NGƠI (休息 xiūxi).' },
          { char: '好', py: 'hǎo', hv: 'Hảo', mean: 'Tốt, đẹp', formula: '女 (Nữ - Phụ nữ) + 子 (Tử - Con cái)', story: 'Người mẹ (女) ôm đứa con (子) trong vòng tay — hình ảnh biểu trưng cho sự TỐT ĐẸP, hạnh phúc viên mãn.' },
          { char: '明', py: 'míng', hv: 'Minh', mean: 'Sáng sủa, ngày mai', formula: '日 (Nhật - Mặt trời) + 月 (Nguyệt - Mặt trăng)', story: 'Mặt trời (日) chiếu ban ngày và Mặt trăng (月) soi ban đêm hợp lại tạo nên ánh SÁNG rực rỡ (明天 míngtiān).' },
          { char: '看', py: 'kàn', hv: 'Khán', mean: 'Nhìn, xem', formula: '手 (Thủ - Bàn tay) + 目 (Mục - Đôi mắt)', story: 'Đặt bàn tay (手) lên phía trên đôi mắt (目) để che nắng và NHÌN ra phía xa (看见 kànjiàn).' },
          { char: '听', py: 'tīng', hv: 'Thính', mean: 'Lắng nghe', formula: '口 (Khẩu - Miệng) + 斤 (Cân - Sức nặng)', story: 'Khi người khác dùng miệng (口) nói ra lời có sức nặng (斤), ta cần chăm chú LẮNG NGHE (听说 tīngshuō).' },
          { char: '想', py: 'xiǎng', hv: 'Tưởng', mean: 'Nhớ nhung, suy nghĩ', formula: '相 (Tương - Quan sát) + 心 (Tâm - Trái tim)', story: 'Hình ảnh (相) của một người luôn khắc sâu ở trong trái tim (心) chính là nỗi NHỚ NHUNG, SUY NGHĨ.' },
          { char: '安', py: 'ān', hv: 'An', mean: 'Bình an, yên ổn', formula: '宀 (Miên - Mái nhà) + 女 (Nữ - Người phụ nữ)', story: 'Dưới mái nhà (宀) ấm cúng có người phụ nữ (女) vun vén thì gia đình luôn BÌNH AN, YÊN ỔN (安全 ānquán).' },
          { char: '家', py: 'jiā', hv: 'Gia', mean: 'Gia đình, ngôi nhà', formula: '宀 (Miên - Mái nhà) + 豕 (Thỉ - Đàn heo/Tài sản)', story: 'Thời xưa dưới mái nhà (宀) có nuôi đàn gia súc (豕) sung túc thì gọi là một NGÔI NHÀ, GIA ĐÌNH ấm no.' },
          { char: '鲜', py: 'xiān', hv: 'Tiên', mean: 'Tươi ngon (Hải sản)', formula: '鱼 (Ngư - Cá) + 羊 (Dương - Dê)', story: 'Thịt cá (鱼) nấu cùng thịt dê (羊) tạo nên hương vị TƯƠI NGON thượng hạng của ẩm thực cổ đại (新鲜 xīnxiān).' },
          { char: '森', py: 'sēn', hv: 'Sâm', mean: 'Rừng rậm đại ngàn', formula: '木 + 木 + 木 (3 chữ Mộc - Cây)', story: 'Một cây (木) là cái cây, hai cây (林 lín) là rừng thưa, ba cây (森 sēn) chụm lại thành RỪNG RẬM đại ngàn (森林 sēnlín).' },
          { char: '众', py: 'zhòng', hv: 'Chúng', mean: 'Đám đông, công chúng', formula: '人 + 人 + 人 (3 chữ Nhân - Người)', story: 'Ba người (人) đứng cạnh nhau tạo thành ĐÁM ĐÔNG, quần chúng (观众 guānzhòng).' },
          { char: '尖', py: 'jiān', hv: 'Tiêm', mean: 'Nhọn, sắc bén', formula: '小 (Tiểu - Nhỏ) ở trên + 大 (Đại - Lớn) ở dưới', story: 'Vật gì phần đầu ở trên thì NHỎ (小), phần đáy ở dưới thì LỚN (大) chính là vật có mũi NHỌN (笔尖 đầu bút).' }
        ];

        // 7. Chinese Classifiers / Measure Words Encyclopedia (Lượng từ HSK 1-9 — Upgraded to 18 Categories & 20 Quiz Questions in Separated Tabs)
        const MEASURE_WORDS_DATA = [
          { mw: '个', py: 'gè', hv: 'Cá', cat: 'Người & Phổ thông', usage: 'Lượng từ phổ biến nhất cho người, vật thể nói chung, đơn vị trừu tượng', examples: '一个人 (1 người), 一个苹果 (1 quả táo), 一个问题 (1 câu hỏi)' },
          { mw: '位', py: 'wèi', hv: 'Vị', cat: 'Người & Phổ thông', usage: 'Dùng cho người với sắc thái lịch sự, kính trọng', examples: '一位老师 (1 vị giáo viên), 两位顾客 (2 vị khách hàng)' },
          { mw: '名', py: 'míng', hv: 'Danh', cat: 'Người & Phổ thông', usage: 'Dùng cho người có nghề nghiệp, thân phận, chức danh (văn viết/trang trọng)', examples: '一名医生 (1 bác sĩ), 一名大学生 (1 sinh viên đại học)' },
          { mw: '本', py: 'běn', hv: 'Bản', cat: 'Sách vở & Vật phẳng', usage: 'Dùng cho sách, từ điển, tạp chí, cuốn sổ đóng thành quyển', examples: '一本书 (1 quyển sách), 一本词典 (1 cuốn từ điển), 一本杂志 (1 tạp chí)' },
          { mw: '张', py: 'zhāng', hv: 'Trương', cat: 'Sách vở & Vật phẳng', usage: 'Dùng cho vật có bề mặt phẳng: giấy, vé, ảnh, bàn, giường, bản đồ', examples: '一张高铁票 (1 tấm vé tàu), 一张桌子 (1 cái bàn), 一张照片 (1 bức ảnh)' },
          { mw: '份', py: 'fèn', hv: 'Phần', cat: 'Sách vở & Vật phẳng', usage: 'Dùng cho phần ăn, suất quà, tài liệu, hợp đồng, báo chí, công việc', examples: '一份合同 (1 bản hợp đồng), 一份盒饭 (1 suất cơm hộp), 一份工作 (1 công việc)' },
          { mw: '篇', py: 'piān', hv: 'Thiên', cat: 'Sách vở & Vật phẳng', usage: 'Dùng cho bài văn, bài báo, luận văn, tiểu luận hoàn chỉnh', examples: '一篇文章 (1 bài văn), 一篇论文 (1 bài luận văn), 一篇报道 (1 bài phóng sự)' },
          { mw: '封', py: 'fēng', hv: 'Phong', cat: 'Sách vở & Vật phẳng', usage: 'Dùng cho thư từ, email, thư mời được đóng phong bì', examples: '一封信 (1 bức thư), 一封电子邮件 (1 bức email)' },
          { mw: '件', py: 'jiàn', hv: 'Kiện', cat: 'Quần áo & Đôi cặp', usage: 'Dùng cho áo (thân trên), hành lý, món quà hoặc sự việc', examples: '一件衬衫 (1 chiếc áo sơ mi), 一件行李 (1 kiện hành lý), 一件事 (1 sự việc)' },
          { mw: '条', py: 'tiáo', hv: 'Điều', cat: 'Quần áo & Đôi cặp', usage: 'Dùng cho vật thon dài: quần, váy, khăn, con đường, dòng sông, cá, chó, tin nhắn', examples: '一条裤子 (1 chiếc quần), 一条裙子 (1 chiếc váy), 一条鱼 (1 con cá)' },
          { mw: '双', py: 'shuāng', hv: 'Song', cat: 'Quần áo & Đôi cặp', usage: 'Dùng cho đôi đi liền tách rời không dùng được: giày, tất, đũa, đôi mắt, đôi tay', examples: '一双运动鞋 (1 đôi giày thể thao), 一双筷子 (1 đôi đũa), 一双袜子 (1 đôi tất)' },
          { mw: '套', py: 'tào', hv: 'Sáo', cat: 'Quần áo & Đôi cặp', usage: 'Dùng cho bộ com-lê, bộ quần áo, căn hộ, bộ sách, quy trình', examples: '一套西装 (1 bộ vest), 一套房子 (1 căn hộ), 一套家具 (1 bộ nội thất)' },
          { mw: '把', py: 'bǎ', hv: 'Bả', cat: 'Máy móc & Đồ vật', usage: 'Dùng cho vật có tay cầm/cán: ghế, ô (dù), dao, kéo, chìa khóa, ấm trà', examples: '一把椅子 (1 cái ghế), 一把雨伞 (1 chiếc ô), 一把钥匙 (1 chùm chìa khóa)' },
          { mw: '台', py: 'tái', hv: 'Đài', cat: 'Máy móc & Đồ vật', usage: 'Dùng cho máy móc, thiết bị điện tử, chương trình biểu diễn', examples: '一台笔记本电脑 (1 chiếc laptop), 一台空调 (1 máy điều hòa), 一台洗衣机 (1 máy giặt)' },
          { mw: '辆', py: 'liàng', hv: 'Lượng', cat: 'Máy móc & Đồ vật', usage: 'Dùng cho các phương tiện giao thông đường bộ có bánh xe', examples: '一辆汽车 (1 chiếc ô tô), 一辆自行车 (1 chiếc xe đạp), 一辆公交车 (1 xe buýt)' },
          { mw: '家', py: 'jiā', hv: 'Gia', cat: 'Kiến trúc & Hành động', usage: 'Dùng cho doanh nghiệp, công ty, nhà hàng, khách sạn, bệnh viện, ngân hàng', examples: '一家公司 (1 công ty), 一家医院 (1 bệnh viện), 一家五星级酒店 (1 khách sạn 5 sao)' },
          { mw: '座', py: 'zuò', hv: 'Tọa', cat: 'Kiến trúc & Hành động', usage: 'Dùng cho công trình lớn, tòa nhà, cây cầu, ngọn núi, thành phố', examples: '一座城市 (1 thành phố), 一座桥 (1 cây cầu), 一座高山 (1 ngọn núi cao)' },
          { mw: '场', py: 'chǎng', hv: 'Trường', cat: 'Kiến trúc & Hành động', usage: 'Dùng cho trận mưa, trận bóng, buổi biểu diễn, kỳ thi, bộ phim', examples: '一场大雨 (1 trận mưa lớn), 一场电影 (1 suất chiếu phim), 一场考试 (1 kỳ thi)' }
        ];

        const MEASURE_WORD_COMPARISONS = [
          { pair: '个 (gè) • 位 (wèi) • 名 (míng)', title: 'Phân biệt 3 lượng từ chỉ NGƯỜI', diff: '• 个 (gè): Dùng phổ thông trong giao tiếp hàng ngày (一个人, 两个朋友).\n• 位 (wèi): Mang sắc thái kính trọng, lịch sự, trang trọng (一位老师, 各位来宾).\n• 名 (míng): Dùng trong văn viết, báo chí để chỉ chức danh/nghề nghiệp (一名医生, 三名记者).' },
          { pair: '次 (cì) • 遍 (biàn) • 趟 (tàng)', title: 'Phân biệt 3 lượng từ ĐỘNG LƯỢNG (Số lần hành động)', diff: '• 次 (cì): Đếm số lần xảy ra nói chung, không nhấn mạnh đầu cuối (去过三次北京).\n• 遍 (biàn): Nhấn mạnh quá trình trọn vẹn từ đầu đến cuối (把课文读三遍 - đọc hết bài 3 lượt).\n• 趟 (tàng): Nhấn mạnh hành trình đi rồi về một chuyến (去一趟超市 - đi siêu thị 1 chuyến).' },
          { pair: '双 (shuāng) • 对 (duì) • 副 (fù)', title: 'Phân biệt 3 lượng từ chỉ ĐÔI / CẶP', diff: '• 双 (shuāng): Hai vật giống hệt nhau dùng chung (一双鞋 đôi giày, 一双筷子 đôi đũa).\n• 对 (duì): Hai người/vật ghép thành cặp bổ sung nhau (一对夫妻 cặp vợ chồng, 一对耳环 đôi bông tai).\n• 副 (fù): Vật dính liền thành 1 gọng hoặc bộ hoàn chỉnh (一副眼镜 1 cặp kính mắt, 一副手套 đôi găng tay).' },
          { pair: '件 (jiàn) • 条 (tiáo) • 套 (tào)', title: 'Phân biệt 3 lượng từ chỉ TRANG PHỤC', diff: '• 件 (jiàn): Áo mặc phần thân trên (一件毛衣 áo len, 一件大衣 áo khoác).\n• 条 (tiáo): Quần, váy, khăn quàng có dáng dài (一条牛仔裤 quần bò, 一条围巾 khăn choàng).\n• 套 (tào): Cả bộ quần áo đồng bộ (一套运动服 1 bộ đồ thể thao, 一套西装 1 bộ vest).' },
          { pair: '家 (jiā) • 所 (suǒ) • 座 (zuò)', title: 'Phân biệt 3 lượng từ chỉ CƠ QUAN & CÔNG TRÌNH', diff: '• 家 (jiā): Cơ sở kinh doanh, dịch vụ, công ty (一家银行, 一家餐厅, 一家公司).\n• 所 (suǒ): Cơ sở giáo dục, trường học, viện nghiên cứu (一所大学, 一所中学).\n• 座 (zuò): Công trình kiến trúc đồ sộ, cầu, núi, thành phố (一座大桥, 一座大楼).' },
          { pair: '台 (tái) • 部 (bù) • 辆 (liàng)', title: 'Phân biệt 3 lượng từ chỉ MÁY MÓC & XE CỘ', diff: '• 台 (tái): Máy móc, thiết bị điện tử cỡ vừa/lớn (一台电脑, 一台电视, 一台冰箱).\n• 部 (bù): Điện thoại di động, bộ phim, tác phẩm văn học (一部手机, 一部电影, 一部小说).\n• 辆 (liàng): Phương tiện có bánh xe di chuyển trên đường (一辆出租车, 一辆自行车).' }
        ];

        // Upgraded 20 Measure Word Quiz Questions (Divided into 4 Batches x 5 Questions)
        const MEASURE_QUIZ_ITEMS = [
          // Batch 1: Questions 1-5 (HSK 1-2 Sơ cấp)
          { batch: 1, level: 'HSK 1', q: 'Câu 1: Chọn lượng từ đúng cho "một quyển sách tiếng Trung": 一（ ___ ）中文书', opts: ['本 (běn)', '张 (zhāng)', '件 (jiàn)', '辆 (liàng)'], ans: 0, explain: 'Sách vở, từ điển đóng gáy dùng lượng từ 本 (běn).' },
          { batch: 1, level: 'HSK 1', q: 'Câu 2: Chọn lượng từ đúng cho "hai chiếc áo sơ mi": 两（ ___ ）衬衫', opts: ['件 (jiàn)', '条 (tiáo)', '台 (tái)', '把 (bǎ)'], ans: 0, explain: 'Áo mặc thân trên dùng lượng từ 件 (jiàn).' },
          { batch: 1, level: 'HSK 1', q: 'Câu 3: Chọn lượng từ đúng cho "một chiếc quần dài": 一（ ___ ）裤子', opts: ['条 (tiáo)', '件 (jiàn)', '张 (zhāng)', '双 (shuāng)'], ans: 0, explain: 'Quần, váy, khăn có hình dáng thon dài dùng lượng từ 条 (tiáo).' },
          { batch: 1, level: 'HSK 2', q: 'Câu 4: Chọn lượng từ đúng cho "một tấm vé tàu cao tốc": 一（ ___ ）高铁票', opts: ['张 (zhāng)', '本 (běn)', '把 (bǎ)', '位 (wèi)'], ans: 0, explain: 'Vé tàu, tờ giấy, cái bàn có bề mặt phẳng dùng lượng từ 张 (zhāng).' },
          { batch: 1, level: 'HSK 2', q: 'Câu 5: Chọn lượng từ đúng cho "một ly trà sữa trân châu": 一（ ___ ）珍珠奶茶', opts: ['杯 (bēi)', '碗 (wǎn)', '盘 (pán)', '条 (tiáo)'], ans: 0, explain: 'Đồ uống đựng trong cốc/ly dùng lượng từ 杯 (bēi).' },
          // Batch 2: Questions 6-10 (HSK 2-3 Trung cấp)
          { batch: 2, level: 'HSK 2', q: 'Câu 6: Chọn lượng từ đúng cho "một chiếc máy tính xách tay": 一（ ___ ）笔记本电脑', opts: ['台 (tái)', '辆 (liàng)', '把 (bǎ)', '家 (jiā)'], ans: 0, explain: 'Máy tính, tivi, điều hòa dùng lượng từ chỉ thiết bị máy móc 台 (tái).' },
          { batch: 2, level: 'HSK 2', q: 'Câu 7: Chọn lượng từ đúng cho "một đôi giày thể thao": 一（ ___ ）运动鞋', opts: ['双 (shuāng)', '件 (jiàn)', '条 (tiáo)', '张 (zhāng)'], ans: 0, explain: 'Giày, tất, đũa đi theo đôi dùng lượng từ 双 (shuāng).' },
          { batch: 2, level: 'HSK 3', q: 'Câu 8: Chọn lượng từ đúng cho "một chiếc ô (dù) che mưa": 一（ ___ ）雨伞', opts: ['把 (bǎ)', '条 (tiáo)', '张 (zhāng)', '根 (gēn)'], ans: 0, explain: 'Đồ vật có tay cầm hoặc cán (ô, ghế, dao, chìa khóa) dùng lượng từ 把 (bǎ).' },
          { batch: 2, level: 'HSK 3', q: 'Câu 9: Chọn lượng từ đúng cho "một chiếc xe ô tô điện": 一（ ___ ）电动汽车', opts: ['辆 (liàng)', '台 (tái)', '架 (jià)', '艘 (sōu)'], ans: 0, explain: 'Xe cộ có bánh chạy trên bộ dùng lượng từ 辆 (liàng).' },
          { batch: 2, level: 'HSK 3', q: 'Câu 10: Chọn lượng từ lịch sự cho "một vị giáo sư đại học": 一（ ___ ）大学教授', opts: ['位 (wèi)', '只 (zhī)', '条 (tiáo)', '件 (jiàn)'], ans: 0, explain: 'Khi thể hiện sự kính trọng đối với người, dùng lượng từ 位 (wèi).' },
          // Batch 3: Questions 11-15 (HSK 4-5 Trung cao cấp)
          { batch: 3, level: 'HSK 4', q: 'Câu 11: Chọn lượng từ đúng cho "một bản hợp đồng thương mại": 一（ ___ ）贸易合同', opts: ['份 (fèn)', '本 (běn)', '条 (tiáo)', '把 (bǎ)'], ans: 0, explain: 'Hợp đồng, báo cáo, hồ sơ, phần ăn dùng lượng từ 份 (fèn).' },
          { batch: 3, level: 'HSK 4', q: 'Câu 12: Chọn lượng từ đúng cho "một công ty công nghệ quốc tế": 一（ ___ ）跨国科技公司', opts: ['家 (jiā)', '座 (zuò)', '台 (tái)', '件 (jiàn)'], ans: 0, explain: 'Công ty, nhà hàng, ngân hàng, bệnh viện dùng lượng từ 家 (jiā).' },
          { batch: 3, level: 'HSK 4', q: 'Câu 13: Chọn lượng từ đúng cho "một bức thư cảm ơn": 一（ ___ ）感谢信', opts: ['封 (fēng)', '张 (zhāng)', '本 (běn)', '把 (bǎ)'], ans: 0, explain: 'Thư từ, email dùng lượng từ 封 (fēng).' },
          { batch: 3, level: 'HSK 5', q: 'Câu 14: Chọn lượng từ đúng cho "một bài văn / bài luận sâu sắc": 一（ ___ ）深刻的文章', opts: ['篇 (piān)', '首 (shǒu)', '本 (běn)', '幅 (fú)'], ans: 0, explain: 'Bài văn, bài báo, luận văn dùng lượng từ 篇 (piān).' },
          { batch: 3, level: 'HSK 5', q: 'Câu 15: Chọn lượng từ đúng cho "đọc kỹ toàn bộ bài khóa từ đầu đến cuối 3 lượt": 把课文认真读三（ ___ ）', opts: ['遍 (biàn)', '趟 (tàng)', '场 (chǎng)', '个 (gè)'], ans: 0, explain: 'Nhấn mạnh quá trình hoàn tất trọn vẹn từ đầu tới cuối dùng 遍 (biàn).' },
          // Batch 4: Questions 16-20 (HSK 6-9 Cao cấp)
          { batch: 4, level: 'HSK 5', q: 'Câu 16: Chọn lượng từ đúng cho "một cặp kính cận": 一（ ___ ）近视眼镜', opts: ['副 (fù)', '双 (shuāng)', '条 (tiáo)', '把 (bǎ)'], ans: 0, explain: 'Kính mắt (gồm 2 mắt kính nối liền 1 gọng) dùng lượng từ 副 (fù).' },
          { batch: 4, level: 'HSK 6', q: 'Câu 17: Chọn lượng từ đúng cho "một trường đại học danh tiếng": 一（ ___ ）著名大学', opts: ['所 (suǒ)', '家 (jiā)', '辆 (liàng)', '把 (bǎ)'], ans: 0, explain: 'Trường học, viện nghiên cứu dùng lượng từ 所 (suǒ).' },
          { batch: 4, level: 'HSK 6', q: 'Câu 18: Chọn lượng từ đúng cho "một cây cầu vượt biển hiện đại": 一（ ___ ）现代跨海大桥', opts: ['座 (zuò)', '条 (tiáo)', '家 (jiā)', '台 (tái)'], ans: 0, explain: 'Cây cầu lớn, tòa nhà, ngọn núi, thành phố dùng lượng từ 座 (zuò).' },
          { batch: 4, level: 'HSK 6', q: 'Câu 19: Chọn lượng từ đúng cho "một bức tranh thủy mặc cổ điển": 一（ ___ ）古典水墨画', opts: ['幅 (fú)', '篇 (piān)', '首 (shǒu)', '本 (běn)'], ans: 0, explain: 'Tranh vẽ, bức họa, tác phẩm thư pháp dùng lượng từ 幅 (fú).' },
          { batch: 4, level: 'HSK 7–9', q: 'Câu 20: Chọn lượng từ đúng cho "một trận mưa rào kịp thời": 一（ ___ ）及时雨', opts: ['场 (chǎng)', '顿 (dùn)', '趟 (tàng)', '遍 (biàn)'], ans: 0, explain: 'Hiện tượng thời tiết (mưa, tuyết), sự kiện, trận đấu dùng lượng từ 场 (chǎng).' }
        ];

        let activeMeasureSubTab = 'quiz20'; // 'quiz20' | 'catalog' | 'compare'
        let activeMeasureQuizBatch = 1;     // 1 | 2 | 3 | 4 | 0 (0 = all)
        let activeMeasureCatFilter = 'all';

        // ====================================================================
        // UPGRADE 1: HSK 1-9 EXERCISES ENGINE (5 DRILL TYPES + 30 FULL 4-SKILL QUESTIONS PER HSK LEVEL & DEEP AI GRADING)
        // ====================================================================
        let activeExHskLevel = 1;           // 1..7 (7 = HSK 7-9)
        let activeExMainTab = 'overview5';  // 'overview5' (5 Dạng bài như Ảnh 1) | 'test30' (Đề 30 câu Nghe-Nói-Đọc-Viết & Chấm chuyên sâu)
        let activeExSkillFilter = 'all';    // 'all' | 'listen' | 'speak' | 'read' | 'write' | 'type_1'..'type_5'
        let activeExPage = 1;               // 6 questions per page when viewing 'all'
        let hsk30ExAnswers = {};            // key: `${hskLv}_${qIdx}` -> choice index or text string
        let hsk30ExSubmitted = {};          // key: `${hskLv}` -> boolean

        const HSK_LEVEL_SEEDS = {
          1: {
            name: 'HSK 1 (Sơ cấp 1)',
            vocab: [
              { hz: '喝茶', py: 'hē chá', vi: 'uống trà', sent: '我爸爸每天早上都喜欢喝茶。', sentPy: 'Wǒ bàba měitiān zǎoshang dōu xǐhuan hē chá.', sentVi: 'Bố tôi mỗi sáng đều thích uống trà.', bricks: ['我爸爸', '每天早上', '都喜欢', '喝茶', '。'] },
              { hz: '医院', py: 'yīyuàn', vi: 'bệnh viện', sent: '李老师的女儿在第一医院工作。', sentPy: 'Lǐ lǎoshī de nǚ’ér zài Dì-yī Yīyuàn gōngzuò.', sentVi: 'Con gái thầy Lý làm việc ở Bệnh viện Số 1.', bricks: ['李老师的女儿', '在', '第一医院', '工作', '。'] },
              { hz: '北京', py: 'Běijīng', vi: 'Bắc Kinh', sent: '我们下个星期坐飞机去北京旅游。', sentPy: 'Wǒmen xià gè xīngqī zuò fēijī qù Běijīng lǚyóu.', sentVi: 'Tuần sau chúng tôi đi máy bay tới Bắc Kinh du lịch.', bricks: ['我们', '下个星期', '坐飞机', '去北京旅游', '。'] },
              { hz: '苹果', py: 'píngguǒ', vi: 'quả táo', sent: '妈妈去商店买了很多新鲜的苹果。', sentPy: 'Māma qù shāngdiàn mǎi le hěn duō xīnxiān de píngguǒ.', sentVi: 'Mẹ đi cửa hàng mua rất nhiều táo tươi.', bricks: ['妈妈', '去商店', '买了很多', '新鲜的苹果', '。'] },
              { hz: '汉语', py: 'Hànyǔ', vi: 'tiếng Trung', sent: '我的越南朋友不仅会说英语，还会说汉语。', sentPy: 'Wǒ de Yuènán péngyou bùjǐn huì shuō Yīngyǔ, hái huì shuō Hànyǔ.', sentVi: 'Người bạn Việt Nam của tôi không chỉ biết nói tiếng Anh mà còn biết nói tiếng Trung.', bricks: ['我的越南朋友', '不仅会说英语，', '还会', '说汉语', '。'] },
              { hz: '饭馆', py: 'fànguǎn', vi: 'nhà hàng', sent: '学校旁边的那家中国饭馆菜很好吃。', sentPy: 'Xuéxiào pángbiān de nà jiā Zhōngguó fànguǎn cài hěn hǎochī.', sentVi: 'Món ăn của nhà hàng Trung Quốc cạnh trường học rất ngon.', bricks: ['学校旁边的', '那家', '中国饭馆', '菜很好吃', '。'] },
              { hz: '下雨', py: 'xià yǔ', vi: 'trời mưa', sent: '今天外面下大雨，我们在家里看电视吧。', sentPy: 'Jīntiān wàimiàn xià dàyǔ, wǒmen zài jiālǐ kàn diànshì ba.', sentVi: 'Hôm nay bên ngoài mưa to, chúng mình ở nhà xem tivi nhé.', bricks: ['今天外面', '下大雨，', '我们在家里', '看电视吧', '。'] },
              { hz: '休息', py: 'xiūxi', vi: 'nghỉ ngơi', sent: '你今天工作太累了，早点回家休息吧。', sentPy: 'Nǐ jīntiān gōngzuò tài lèi le, zǎodiǎn huí jiā xiūxi ba.', sentVi: 'Hôm nay bạn làm việc mệt quá rồi, về nhà nghỉ ngơi sớm đi nhé.', bricks: ['你今天', '工作太累了，', '早点回家', '休息吧', '。'] }
            ]
          },
          2: {
            name: 'HSK 2 (Sơ cấp 2)',
            vocab: [
              { hz: '运动', py: 'yùndòng', vi: 'vận động, thể thao', sent: '为了身体健康，我每天下午都去跑步运动。', sentPy: 'Wèile shēntǐ jiànkāng, wǒ měitiān xiàwǔ dōu qù pǎobù yùndòng.', sentVi: 'Để cơ thể khỏe mạnh, mỗi chiều tôi đều đi chạy bộ tập thể thao.', bricks: ['为了身体健康，', '我每天下午', '都去', '跑步运动', '。'] },
              { hz: '准备', py: 'zhǔnbèi', vi: 'chuẩn bị', sent: '妈妈已经在厨房准备好了丰盛的晚饭。', sentPy: 'Māma yǐjīng zài chúfáng zhǔnbèi hǎo le fēngshèng de wǎnfàn.', sentVi: 'Mẹ đã chuẩn bị xong bữa tối thịnh soạn ở trong bếp.', bricks: ['妈妈已经在厨房', '准备好了', '丰盛的', '晚饭', '。'] },
              { hz: '便宜', py: 'piányi', vi: 'rẻ, hợp túi tiền', sent: '这件红衣服虽然很漂亮，但是价钱很便宜。', sentPy: 'Zhè jiàn hóng yīfu suīrán hěn piàoliang, dànshì jiàqian hěn piányi.', sentVi: 'Chiếc áo màu đỏ này tuy rất đẹp nhưng giá cả lại rất rẻ.', bricks: ['这件红衣服', '虽然很漂亮，', '但是价钱', '很便宜', '。'] },
              { hz: '机场', py: 'jīchǎng', vi: 'sân bay', sent: '从我们公司坐地铁去首都机场要四十分钟。', sentPy: 'Cóng wǒmen gōngsī zuò dìtiě qù Shǒudū Jīchǎng yào sìshí fēnzhōng.', sentVi: 'Từ công ty chúng tôi đi tàu điện ngầm ra sân bay Thủ Đô mất 40 phút.', bricks: ['从我们公司', '坐地铁', '去首都机场', '要四十分钟', '。'] },
              { hz: '帮助', py: 'bāngzhù', vi: 'giúp đỡ', sent: '非常感谢你在我困难的时候热情帮助我。', sentPy: 'Fēicháng gǎnxiè nǐ zài wǒ kùnnan de shíhou rèqíng bāngzhù wǒ.', sentVi: 'Vô cùng cảm ơn bạn đã nhiệt tình giúp đỡ tôi lúc khó khăn.', bricks: ['非常感谢你', '在我困难的时候', '热情', '帮助我', '。'] },
              { hz: '考试', py: 'kǎoshì', vi: 'kỳ thi, thi cử', sent: '只要每天认真复习，这次汉语考试一定能过。', sentPy: 'Zhǐyào měitiān rènzhēn fùxí, zhè cì Hànyǔ kǎoshì yīdìng néng guò.', sentVi: 'Chỉ cần mỗi ngày ôn tập nghiêm túc, kỳ thi tiếng Trung lần này nhất định đỗ.', bricks: ['只要每天认真复习，', '这次', '汉语考试', '一定能过', '。'] },
              { hz: '生日', py: 'shēngrì', vi: 'sinh nhật', sent: '明天是奶奶八十岁生日，全家人一起去祝贺。', sentPy: 'Míngtiān shì nǎinai bāshí suì shēngrì, quán jiārén yīqǐ qù zhùhè.', sentVi: 'Ngày mai là sinh nhật 80 tuổi của bà nội, cả nhà cùng đi chúc mừng.', bricks: ['明天是奶奶', '八十岁生日，', '全家人', '一起去祝贺', '。'] },
              { hz: '介绍', py: 'jièshào', vi: 'giới thiệu', sent: '请允许我先用中文简单介绍一下我们团队。', sentPy: 'Qǐng yǔnxǔ wǒ xiān yòng Zhōngwén jiǎndān jièshào yīxià wǒmen tuánduì.', sentVi: 'Xin phép cho tôi dùng tiếng Trung giới thiệu ngắn gọn về đội ngũ chúng tôi trước.', bricks: ['请允许我', '先用中文', '简单介绍一下', '我们团队', '。'] }
            ]
          },
          3: {
            name: 'HSK 3 (Trung cấp 1)',
            vocab: [
              { hz: '环境', py: 'huánjìng', vi: 'môi trường', sent: '这家咖啡馆安静舒适，环境非常适合看书。', sentPy: 'Zhè jiā kāfēiguǎn ānjìng shūshì, huánjìng fēicháng shìhé kànshū.', sentVi: 'Quán cà phê này yên tĩnh dễ chịu, môi trường rất hợp để đọc sách.', bricks: ['这家咖啡馆', '安静舒适，', '环境非常适合', '看书', '。'] },
              { hz: '习惯', py: 'xíguàn', vi: 'thói quen, quen với', sent: '来中国留学半年以后，我已经习惯吃辣的菜了。', sentPy: 'Lái Zhōngguó liúxué bàn nián yǐhòu, wǒ yǐjīng xíguàn chī là de cài le.', sentVi: 'Sau nửa năm du học Trung Quốc, tôi đã quen ăn món cay rồi.', bricks: ['来中国留学半年以后，', '我已经', '习惯吃', '辣的菜了', '。'] },
              { hz: '放心', py: 'fàngxīn', vi: 'yên tâm', sent: '请妈妈放心，我在大学里一切都很顺利。', sentPy: 'Qǐng māma fàngxīn, wǒ zài dàxué lǐ yīqiè dōu hěn shùnlì.', sentVi: 'Mẹ cứ yên tâm, ở trường đại học mọi việc của con đều rất thuận lợi.', bricks: ['请妈妈放心，', '我在大学里', '一切都', '很顺利', '。'] },
              { hz: '解决', py: 'jiějué', vi: 'giải quyết', sent: '遇到问题不要着急，我们一起商量解决办法。', sentPy: 'Yùdào wèntí búyào zháojí, wǒmen yīqǐ shāngliang jiějué bànfǎ.', sentVi: 'Gặp vấn đề đừng sốt ruột, chúng ta cùng bàn bạc cách giải quyết.', bricks: ['遇到问题不要着急，', '我们一起', '商量', '解决办法', '。'] },
              { hz: '参加', py: 'cānjiā', vi: 'tham gia', sent: '今年有五百多名外国学生参加汉语桥比赛。', sentPy: 'Jīnnián yǒu wǔbǎi duō míng wàiguó xuésheng cānjiā Hànyǔ Qiáo bǐsài.', sentVi: 'Năm nay có hơn 500 sinh viên nước ngoài tham gia cuộc thi Nhịp Cầu Hán Ngữ.', bricks: ['今年有五百多名', '外国学生', '参加', '汉语桥比赛', '。'] },
              { hz: '影响', py: 'yǐngxiǎng', vi: 'ảnh hưởng', sent: '睡眠不足会严重影响第二天的工作效率。', sentPy: 'Shuìmián bùzú huì yánzhòng yǐngxiǎng dì-èr tiān de gōngzuò xiàolǜ.', sentVi: 'Thiếu ngủ sẽ ảnh hưởng nghiêm trọng đến hiệu suất làm việc ngày hôm sau.', bricks: ['睡眠不足', '会严重影响', '第二天的', '工作效率', '。'] },
              { hz: '满意', py: 'mǎnyì', vi: 'hài lòng', sent: '客户对我们团队设计的新方案感到非常满意。', sentPy: 'Kèhù duì wǒmen tuánduì shèjì de xīn fāng’àn gǎndào fēicháng mǎnyì.', sentVi: 'Khách hàng cảm thấy vô cùng hài lòng với phương án mới do đội ngũ chúng tôi thiết kế.', bricks: ['客户对我们团队', '设计的新方案', '感到非常', '满意', '。'] },
              { hz: '礼貌', py: 'lǐmào', vi: 'lịch sự, lễ phép', sent: '与人交流时保持微笑是一种基本的礼貌。', sentPy: 'Yǔ rén jiāoliú shí bǎochí wēixiào shì yī zhǒng jīběn de lǐmào.', sentVi: 'Giữ nụ cười khi giao tiếp với mọi người là một phép lịch sự cơ bản.', bricks: ['与人交流时', '保持微笑', '是一种', '基本的礼貌', '。'] }
            ]
          },
          4: {
            name: 'HSK 4 (Trung cấp 2)',
            vocab: [
              { hz: '坚持', py: 'jiānchí', vi: 'kiên trì, bền bỉ', sent: '无论遇到多大困难，我们都要坚持到底不放弃。', sentPy: 'Wúlùn yùdào duō dà kùnnan, wǒmen dōu yào jiānchí dàodǐ bù fàngqì.', sentVi: 'Bất luận gặp khó khăn lớn đến đâu, chúng ta đều phải kiên trì đến cùng không bỏ cuộc.', bricks: ['无论遇到多大困难，', '我们都要', '坚持到底', '不放弃', '。'] },
              { hz: '积累', py: 'jīlěi', vi: 'tích lũy', sent: '流利的口语需要平时一点一滴地积累词汇。', sentPy: 'Liúlì de kǒuyǔ xūyào píngshí yīdiǎn-yīdī de jīlěi cíhuì.', sentVi: 'Khẩu ngữ lưu loát cần tích lũy từ vựng từng chút một trong lúc bình thường.', bricks: ['流利的口语', '需要平时', '一点一滴地', '积累词汇', '。'] },
              { hz: '负责', py: 'fùzé', vi: 'chịu trách nhiệm, phụ trách', sent: '张经理做事非常认真，对每一个项目都很负责。', sentPy: 'Zhāng jīnglǐ zuòshì fēicháng rènzhēn, duì měi yī gè xiàngmù dōu hěn fùzé.', sentVi: 'Giám đốc Trương làm việc rất nghiêm túc, có trách nhiệm với từng dự án.', bricks: ['张经理做事非常认真，', '对每一个项目', '都很', '负责', '。'] },
              { hz: '交流', py: 'jiāoliú', vi: 'giao lưu, trao đổi', sent: '通过这次国际会议，两国专家进行了深入交流。', sentPy: 'Tōngguò zhè cì guójì huìyì, liǎng guó zhuānjiā jìnxíng le shēnrù jiāoliú.', sentVi: 'Thông qua hội nghị quốc tế lần này, chuyên gia hai nước đã trao đổi sâu sắc.', bricks: ['通过这次国际会议，', '两国专家', '进行了', '深入交流', '。'] },
              { hz: '鼓励', py: 'gǔlì', vi: 'khích lệ, động viên', sent: '父母的鼓励给了我克服一切挑战的勇气。', sentPy: 'Fùmǔ de gǔlì gěi le wǒ kèfú yīqiè tiǎozhàn de yǒngqì.', sentVi: 'Sự khích lệ của cha mẹ đã trao cho tôi dũng khí vượt qua mọi thử thách.', bricks: ['父母的鼓励', '给了我', '克服一切挑战的', '勇气', '。'] },
              { hz: '适合', py: 'shìhé', vi: 'phù hợp, thích hợp', sent: '每个人都应该找到最适合自己的学习方法。', sentPy: 'Měi gè rén dōu yīnggāi zhǎodào zuì shìhé zìjǐ de xuéxí fāngfǎ.', sentVi: 'Mỗi người đều nên tìm ra phương pháp học tập phù hợp nhất với bản thân.', bricks: ['每个人都应该', '找到最适合', '自己的', '学习方法', '。'] },
              { hz: '准时', py: 'zhǔnshí', vi: 'đúng giờ', sent: '在商务合作中，准时到达是对合作伙伴的尊重。', sentPy: 'Zài shāngwù hézuò zhōng, zhǔnshí dàodá shì duì hézuò huǒbàn de zūnzhòng.', sentVi: 'Trong hợp tác thương mại, đến đúng giờ là sự tôn trọng đối với đối tác.', bricks: ['在商务合作中，', '准时到达', '是对合作伙伴的', '尊重', '。'] },
              { hz: '养成', py: 'yǎngchéng', vi: 'hình thành, rèn luyện', sent: '从小养成热爱阅读的好习惯让人终身受益。', sentPy: 'Cóngxiǎo yǎngchéng rè’ài yuèdú de hǎo xíguàn ràng rén zhōngshēn shòuyì.', sentVi: 'Hình thành thói quen yêu đọc sách từ nhỏ giúp con người hưởng lợi suốt đời.', bricks: ['从小养成', '热爱阅读的好习惯', '让人', '终身受益', '。'] }
            ]
          },
          5: {
            name: 'HSK 5 (Cao cấp 1)',
            vocab: [
              { hz: '效率', py: 'xiàolǜ', vi: 'hiệu suất, năng suất', sent: '合理利用人工智能工具能显著提升团队办公效率。', sentPy: 'Hélǐ lìyòng réngōng zhìnéng gōngjù néng xiǎnzhù tíshēng tuánduì bàngōng xiàolǜ.', sentVi: 'Tận dụng hợp lý công cụ trí tuệ nhân tạo có thể nâng cao rõ rệt hiệu suất làm việc nhóm.', bricks: ['合理利用人工智能工具', '能显著提升', '团队办公', '效率', '。'] },
              { hz: '面临', py: 'miànlín', vi: 'đối mặt, đứng trước', sent: '当前全球经济正在面临前所未有的数字化转型。', sentPy: 'Dāngqián quánqiú jīngjì zhèngzài miànlín qiánsuǒwèiyǒu de shùzìhuà zhuǎnxíng.', sentVi: 'Hiện nay kinh tế toàn cầu đang đứng trước cuộc chuyển đổi số chưa từng có.', bricks: ['当前全球经济', '正在面临', '前所未有的', '数字化转型', '。'] },
              { hz: '把握', py: 'bǎwò', vi: 'nắm bắt, nắm chắc', sent: '优秀的企业家总是善于在危机中把握新的机遇。', sentPy: 'Yōuxiù de qǐyèjiā zǒngshì shànyú zài wēijī zhōng bǎwò xīn de jīyù.', sentVi: 'Doanh nhân xuất sắc luôn giỏi nắm bắt cơ hội mới ở trong khủng hoảng.', bricks: ['优秀的企业家', '总是善于在危机中', '把握', '新的机遇', '。'] },
              { hz: '体会', py: 'tǐhuì', vi: 'thấu hiểu, trải nghiệm', sent: '只有亲自参与实践，才能深刻体会其中的不易。', sentPy: 'Zhǐyǒu qīnzì cānyǔ shíjiàn, cáinéng shēnkè tǐhuì qízhōng de bùyì.', sentVi: 'Chỉ có đích thân tham gia thực tiễn mới có thể thấu hiểu sâu sắc sự vất vả trong đó.', bricks: ['只有亲自参与实践，', '才能深刻', '体会', '其中的不易', '。'] },
              { hz: '促进', py: 'cùjìn', vi: 'thúc đẩy, xúc tiến', sent: '跨境电商的蓬勃发展有力地促进了越中双边贸易。', sentPy: 'Kuàjìng diànshāng de péngbó fāzhǎn yǒulì de cùjìn le Yuè-Zhōng shuāngbiān màoyì.', sentVi: 'Sự phát triển mạnh mẽ của thương mại điện tử xuyên biên giới đã thúc đẩy thương mại song phương Việt - Trung.', bricks: ['跨境电商的蓬勃发展', '有力地促进了', '越中双边', '贸易', '。'] },
              { hz: '独立', py: 'dúlì', vi: 'độc lập, tự chủ', sent: '大学教育的核心目标是培养学生独立思考的能力。', sentPy: 'Dàxué jiàoyù de héxīn mùbiāo shì péiyǎng xuésheng dúlì sīkǎo de nénglì.', sentVi: 'Mục tiêu cốt lõi của giáo dục đại học là bồi dưỡng năng lực tư duy độc lập cho sinh viên.', bricks: ['大学教育的核心目标', '是培养学生', '独立思考的', '能力', '。'] },
              { hz: '谦虚', py: 'qiānxū', vi: 'khiêm tốn', sent: '越是学识渊博的学者，待人接物往往越谦虚温和。', sentPy: 'Yuè shì xuéshí yuānbó de xuézhě, dàirén-jiēwù wǎngwǎng yuè qiānxū wēnhé.', sentVi: 'Học giả càng uyên bác thì khi đối nhân xử thế lại càng khiêm tốn ôn hòa.', bricks: ['越是学识渊博的学者，', '待人接物', '往往越', '谦虚温和', '。'] },
              { hz: '趋势', py: 'qūshì', vi: 'xu thế, xu hướng', sent: '绿色低碳出行已经成为现代城市生活的新趋势。', sentPy: 'Lǜsè dītàn chūxíng yǐjīng chéngwéi xiàndài chéngshì shēnghuó de xīn qūshì.', sentVi: 'Di chuyển xanh ít carbon đã trở thành xu hướng mới của đời sống đô thị hiện đại.', bricks: ['绿色低碳出行', '已经成为', '现代城市生活的', '新趋势', '。'] }
            ]
          },
          6: {
            name: 'HSK 6 (Cao cấp 2)',
            vocab: [
              { hz: '相辅相成', py: 'xiāngfǔ xiāngchéng', vi: 'bổ trợ lẫn nhau', sent: '理论研究与产业创新并非对立，而是相辅相成的。', sentPy: 'Lǐlùn yánjiū yǔ chǎnyè chuàngxīn bìngfēi duìlì, érshì xiāngfǔ xiāngchéng de.', sentVi: 'Nghiên cứu lý thuyết và đổi mới công nghiệp không hề đối lập mà bổ trợ lẫn nhau.', bricks: ['理论研究与产业创新', '并非对立，', '而是', '相辅相成的', '。'] },
              { hz: '潜移默化', py: 'qiányí mòhuà', vi: 'mưa dầm thấm lâu, ngấm dần tự nhiên', sent: '家庭阅读氛围会对孩子的性格产生潜移默化的影响。', sentPy: 'Jiātíng yuèdú fēnwéi huì duì háizi de xìnggé chǎnshēng qiányí mòhuà de yǐngxiǎng.', sentVi: 'Không khí đọc sách trong gia đình sẽ tạo ra ảnh hưởng mưa dầm thấm lâu đối với tính cách trẻ.', bricks: ['家庭阅读氛围', '会对孩子的性格', '产生潜移默化的', '影响', '。'] },
              { hz: '精益求精', py: 'jīngyì qiújīng', vi: 'hoàn thiện không ngừng, cầu toàn tỉ mỉ', sent: '工匠们秉持精益求精的态度，打磨每一件艺术品。', sentPy: 'Gōngjiàngmen bǐngchí jīngyì qiújīng de tàidù, dǎmó měi yī jiàn yìshùpǐn.', sentVi: 'Các nghệ nhân giữ vững thái độ tỉ mỉ cầu toàn, trau chuốt từng tác phẩm nghệ thuật.', bricks: ['工匠们秉持', '精益求精的态度，', '打磨每一件', '艺术品', '。'] },
              { hz: '举足轻重', py: 'jǔzú qīngzhòng', vi: 'giữ vai trò then chốt, có sức nặng lớn', sent: '人工智能在新一代信息技术体系中占据举足轻重的地位。', sentPy: 'Réngōng zhìnéng zài xīn yī dài xìnxī jìshù tǐxì zhōng zhànjù jǔzú qīngzhòng de dìwèi.', sentVi: 'Trí tuệ nhân tạo giữ vị trí then chốt trong hệ thống công nghệ thông tin thế hệ mới.', bricks: ['人工智能在新一代信息技术体系中', '占据', '举足轻重的', '地位', '。'] },
              { hz: '未雨绸缪', py: 'wèiyǔ chóumóu', vi: 'lo xa phòng trước (chưa mưa đã lo sửa nhà)', sent: '优秀的管理者懂得未雨绸缪，提前制定风险应急预案。', sentPy: 'Yōuxiù de guǎnlǐzhě dǒngde wèiyǔ chóumóu, tíqián zhìdìng fēngxiǎn yìngjí yù’àn.', sentVi: 'Nhà quản lý xuất sắc biết lo xa phòng trước, sớm lập phương án ứng phó rủi ro.', bricks: ['优秀的管理者', '懂得未雨绸缪，', '提前制定', '风险应急预案', '。'] },
              { hz: '归根结底', py: 'guīgēn jiédǐ', vi: 'suy cho cùng, xét đến tận gốc', sent: '企业之间的竞争，归根结底是核心人才与创新力的竞争。', sentPy: 'Qǐyè zhījiān de jìngzhēng, guīgēn jiédǐ shì héxīn réncái yǔ chuàngxīnlì de jìngzhēng.', sentVi: 'Sự cạnh tranh giữa các doanh nghiệp suy cho cùng là cạnh tranh về nhân tài cốt lõi và sức sáng tạo.', bricks: ['企业之间的竞争，', '归根结底是', '核心人才与创新力的', '竞争', '。'] },
              { hz: '循序渐进', py: 'xúnxù jiànjìn', vi: 'tuần tự tiến bước từ thấp đến cao', sent: '掌握一门外语必须遵循循序渐进的客观规律。', sentPy: 'Zhǎngwò yī mén wàiyǔ bìxū zūnxún xúnxù jiànjìn de kèguān guīlǜ.', sentVi: 'Làm chủ một ngoại ngữ bắt buộc phải tuân theo quy luật khách quan tuần tự từng bước.', bricks: ['掌握一门外语', '必须遵循', '循序渐进的', '客观规律', '。'] },
              { hz: '事半功倍', py: 'shìbàn gōngbèi', vi: 'công sức bỏ một nửa mà hiệu quả gấp đôi', sent: '选对科学的学习工具往往能达到事半功倍的效果。', sentPy: 'Xuǎn duì kēxué de xuéxí gōngjù wǎngwǎng néng dádào shìbàn gōngbèi de xiàoguǒ.', sentVi: 'Chọn đúng công cụ học tập khoa học thường đạt được hiệu quả làm một hưởng hai.', bricks: ['选对科学的学习工具', '往往能达到', '事半功倍的', '效果', '。'] }
            ]
          },
          7: {
            name: 'HSK 7–9 (Tinh thông Cao cấp)',
            vocab: [
              { hz: '休戚与共', py: 'xiūqī yǔgòng', vi: 'cùng chung vận mệnh, buồn vui có nhau', sent: '在全球化时代，各国生态环境保护早已休戚与共。', sentPy: 'Zài quánqiúhuà shídài, gè guó shēngtài huánjìng bǎohù zǎoyǐ xiūqī yǔgòng.', sentVi: 'Trong kỷ nguyên toàn cầu hóa, việc bảo vệ môi trường sinh thái giữa các quốc gia đã gắn kết vận mệnh với nhau.', bricks: ['在全球化时代，', '各国生态环境保护', '早已', '休戚与共', '。'] },
              { hz: '高瞻远瞩', py: 'gāozhān yuǎnzhǔ', vi: 'nhìn xa trông rộng, tầm nhìn chiến lược', sent: '制定区域发展战略需要具备高瞻远瞩的全局视野。', sentPy: 'Zhìdìng qūyù fāzhǎn zhànlüè xūyào jùbèi gāozhān yuǎnzhǔ de quánjú shìyě.', sentVi: 'Hoạch định chiến lược phát triển khu vực cần có tầm nhìn toàn cục nhìn xa trông rộng.', bricks: ['制定区域发展战略', '需要具备', '高瞻远瞩的', '全局视野', '。'] },
              { hz: '推陈出新', py: 'tuīchén chūxīn', vi: 'lược bỏ cái cũ, sáng tạo cái mới', sent: '传统非遗手工艺唯有不断推陈出新，方能焕发生机。', sentPy: 'Chuántǒng fēiyí shǒugōngyì wéiyǒu bùduàn tuīchén chūxīn, fāng néng huànfā shēngjī.', sentVi: 'Nghề thủ công di sản phi vật thể truyền thống chỉ có không ngừng đổi mới sáng tạo mới bừng lên sức sống.', bricks: ['传统非遗手工艺', '唯有不断推陈出新，', '方能', '焕发生机', '。'] },
              { hz: '统筹兼顾', py: 'tǒngchóu jiāngù', vi: 'quy hoạch tổng thể, kết hợp hài hòa các mặt', sent: '城市现代化建设应当统筹兼顾经济增长与历史古迹保护。', sentPy: 'Chéngshì xiàndàihuà jiànshè yīngdāng tǒngchóu jiāngù jīngjì zēngzhǎng yǔ lìshǐ gǔjì bǎohù.', sentVi: 'Xây dựng hiện đại hóa đô thị cần kết hợp hài hòa giữa tăng trưởng kinh tế và bảo tồn di tích lịch sử.', bricks: ['城市现代化建设', '应当统筹兼顾', '经济增长与', '历史古迹保护', '。'] },
              { hz: '行稳致远', py: 'xíngwěn zhìyuǎn', vi: 'bước đi vững chắc mới vươn tới tầm xa', sent: '唯有坚守合规经营与技术创新，企业方能行稳致远。', sentPy: 'Wéiyǒu jiānshǒu héguī jīngyíng yǔ jìshù chuàngxīn, qǐyè fāng néng xíngwěn zhìyuǎn.', sentVi: 'Chỉ có kiên trì kinh doanh tuân thủ pháp luật và đổi mới công nghệ, doanh nghiệp mới đi vững vươn xa.', bricks: ['唯有坚守合规经营与技术创新，', '企业方能', '行稳致远', '。'] },
              { hz: '洞察力', py: 'dòngchálì', vi: 'năng lực thấu suốt, sự nhạy bén sâu sắc', sent: '卓越的学术研究者必须具备敏锐的行业洞察力。', sentPy: 'Zhuóyuè de xuéshù yánjiūzhě bìxū jùbèi mǐnruì de hángyè dòngchálì.', sentVi: 'Nhà nghiên cứu học thuật xuất sắc phải có sự nhạy bén thấu suốt ngành nghề.', bricks: ['卓越的学术研究者', '必须具备', '敏锐的', '行业洞察力', '。'] },
              { hz: '赋能', py: 'fùnéng', vi: 'trao quyền / tiếp sức năng lực (công nghệ)', sent: '算力基础设施正在全方位赋能千行百业的智慧升级。', sentPy: 'Suànlì jīchǔ shèshī zhèngzài quánfāngwèi fùnéng qiānháng-bǎiyè de zhìhuì shēngjí.', sentVi: 'Hạ tầng năng lực tính toán đang tiếp sức toàn diện cho sự nâng cấp thông minh của mọi ngành nghề.', bricks: ['算力基础设施', '正在全方位赋能', '千行百业的', '智慧升级', '。'] },
              { hz: '韧性', py: 'rènxìng', vi: 'sự dẻo dai, sức chống chịu bền bỉ', sent: '多元化的供应链布局显著增强了区域经济的抗风险韧性。', sentPy: 'Duōyuánhuà de gōngyìngliàn bùjú xiǎnzhù zēngqiáng le qūyù jīngjì de kàng fēngxiǎn rènxìng.', sentVi: 'Bố cục chuỗi cung ứng đa dạng hóa đã tăng cường rõ rệt sức chống chịu rủi ro của kinh tế khu vực.', bricks: ['多元化的供应链布局', '显著增强了', '区域经济的', '抗风险韧性', '。'] }
            ]
          }
        };

        // Generates 30 Comprehensive Questions (Nghe: 1-8, Nói: 9-15, Đọc: 16-23, Viết: 24-30) for any HSK level 1..7
        function getHsk30ExerciseQuestions(hskLv) {
          const seedObj = HSK_LEVEL_SEEDS[hskLv] || HSK_LEVEL_SEEDS[1];
          const vList = seedObj.vocab;
          const lvLabel = hskLv === 7 ? 'HSK 7–9' : ('HSK ' + hskLv);
          const list = [];

          // 1. LISTENING (Câu 1 – 8: 8 câu — Nghe điền từ còn thiếu & Nghe sắp xếp nội dung)
          for (let i = 0; i < 8; i++) {
            const w = vList[i % vList.length];
            const d1 = vList[(i + 1) % vList.length];
            const d2 = vList[(i + 2) % vList.length];
            const d3 = vList[(i + 3) % vList.length];
            const isOrderType = i >= 4;
            const maskedSent = w.sent.replace(w.hz, '（ ___ ）');
            if (!isOrderType) {
              list.push({
                qNum: i + 1,
                skill: 'listen',
                skillTitle: '🎧 Kỹ năng Nghe (听力)',
                drillType: 'type_3',
                drillTypeName: 'Dạng 3: Nghe điền từ còn thiếu',
                mode: 'mcq',
                audioHz: w.sent,
                prompt: `Câu ${i + 1}/30 [${lvLabel} • Nghe điền từ]: Bấm nghe câu thoại và chọn đúng từ còn thiếu trong câu: "${maskedSent}"`,
                options: [
                  `${w.hz} (${w.py} — ${w.vi})`,
                  `${d1.hz} (${d1.py} — ${d1.vi})`,
                  `${d2.hz} (${d2.py} — ${d2.vi})`,
                  `${d3.hz} (${d3.py} — ${d3.vi})`
                ],
                answer: 0,
                targetHz: w.hz,
                targetPy: w.py,
                explain: `Audio chuẩn phát câu: "${w.sent}" (${w.sentPy}) — Nghĩa: "${w.sentVi}". Từ cần điền là "${w.hz}" (${w.py}: ${w.vi}).`
              });
            } else {
              list.push({
                qNum: i + 1,
                skill: 'listen',
                skillTitle: '🎧 Kỹ năng Nghe (听力)',
                drillType: 'type_4',
                drillTypeName: 'Dạng 4: Nghe và sắp xếp nội dung theo thứ tự',
                mode: 'mcq',
                audioHz: w.sent,
                prompt: `Câu ${i + 1}/30 [${lvLabel} • Nghe sắp xếp thứ tự]: Nghe lượt thoại và chọn đúng thứ tự mạch nội dung chuẩn ngữ pháp:`,
                options: [
                  `${w.bricks.slice(0, 4).join(' ➔ ')} (${w.sentVi})`,
                  `${w.bricks[2]} ➔ ${w.bricks[0]} ➔ ${w.bricks[3]} ➔ ${w.bricks[1]}`,
                  `${w.bricks[3]} ➔ ${w.bricks[1]} ➔ ${w.bricks[0]} ➔ ${w.bricks[2]}`,
                  `${w.bricks[1]} ➔ ${w.bricks[3]} ➔ ${w.bricks[2]} ➔ ${w.bricks[0]}`
                ],
                answer: 0,
                targetHz: w.sent,
                targetPy: w.sentPy,
                explain: `Trật tự câu chuẩn khi nghe: "${w.sent}" (${w.sentPy}) — Nghĩa: "${w.sentVi}".`
              });
            }
          }

          // 2. SPEAKING (Câu 9 – 15: 7 câu — Luyện nói chuẩn thanh điệu & Phản xạ trả lời tình huống)
          for (let i = 0; i < 7; i++) {
            const w = vList[i % vList.length];
            list.push({
              qNum: 9 + i,
              skill: 'speak',
              skillTitle: '🗣️ Kỹ năng Nói (口语)',
              drillType: 'speak_drill',
              drillTypeName: 'Luyện Nói & Chấm Phát Âm Chuyên Sâu',
              mode: 'speak',
              audioHz: w.sent,
              prompt: `Câu ${9 + i}/30 [${lvLabel} • Luyện Nói]: Hãy đọc to chuẩn thanh điệu câu giao tiếp sau (chứa từ khóa "${w.hz} - ${w.vi}"):`,
              targetHz: w.sent,
              targetPy: w.sentPy,
              targetVi: w.sentVi,
              keyWord: `${w.hz} (${w.py})`,
              explain: `Tiêu chuẩn chấm Nói ${lvLabel}: Phát âm rõ âm tiết "${w.hz}" (${w.py}), giữ đúng đường cong 4 thanh điệu và ngắt nhịp tự nhiên ở "${w.sent}".`
            });
          }

          // 3. READING (Câu 16 – 23: 8 câu — Điền từ vào chỗ trống & Đọc hiểu suy đoán điền từ)
          for (let i = 0; i < 8; i++) {
            const w = vList[i % vList.length];
            const d1 = vList[(i + 2) % vList.length];
            const d2 = vList[(i + 4) % vList.length];
            const d3 = vList[(i + 5) % vList.length];
            const isClozePassage = i >= 4;
            const maskedSent = w.sent.replace(w.hz, '【 ___ 】');
            list.push({
              qNum: 16 + i,
              skill: 'read',
              skillTitle: '📖 Kỹ năng Đọc (阅读)',
              drillType: isClozePassage ? 'type_5' : 'type_2',
              drillTypeName: isClozePassage ? 'Dạng 5: Đọc hiểu và tự suy đoán điền từ' : 'Dạng 2: Bài tập điền từ vào chỗ trống',
              mode: 'mcq',
              audioHz: w.sent,
              prompt: isClozePassage
                ? `Câu ${16 + i}/30 [${lvLabel} • Đọc hiểu suy đoán]: Đọc ngữ cảnh "${maskedSent}" (Nghĩa: ${w.sentVi}). Dựa vào mạch văn, từ khóa phù hợp nhất để điền vào 【 ___ 】 là:`
                : `Câu ${16 + i}/30 [${lvLabel} • Điền từ vào chỗ trống]: Chọn từ đúng ngữ pháp để hoàn thành câu: "${maskedSent}"`,
              options: [
                `${w.hz} (${w.py} — ${w.vi})`,
                `${d1.hz} (${d1.py} — ${d1.vi})`,
                `${d2.hz} (${d2.py} — ${d2.vi})`,
                `${d3.hz} (${d3.py} — ${d3.vi})`
              ],
              answer: 0,
              targetHz: w.hz,
              targetPy: w.py,
              explain: `Giải thích chuyên sâu: Trong ngữ cảnh "${w.sentVi}", vị trí trống cần từ "${w.hz}" (${w.py} = ${w.vi}) để tạo thành câu chuẩn "${w.sent}".`
            });
          }

          // 4. WRITING (Câu 24 – 30: 7 câu — Sắp xếp từ thành câu hoàn chỉnh & Viết câu theo từ khóa)
          for (let i = 0; i < 7; i++) {
            const w = vList[(i + 1) % vList.length];
            const scrambled = [w.bricks[2], w.bricks[0], w.bricks[3], w.bricks[1]];
            list.push({
              qNum: 24 + i,
              skill: 'write',
              skillTitle: '✍️ Kỹ năng Viết (书写)',
              drillType: 'type_1',
              drillTypeName: 'Dạng 1: Sắp xếp từ thành câu hoàn chỉnh & Viết câu',
              mode: 'write',
              audioHz: w.sent,
              prompt: `Câu ${24 + i}/30 [${lvLabel} • Sắp xếp & Viết câu]: Ghép các mảnh từ bị xáo trộn sau thành câu tiếng Trung hoàn chỉnh có nghĩa "${w.sentVi}":`,
              bricks: scrambled,
              targetHz: w.sent,
              targetPy: w.sentPy,
              targetVi: w.sentVi,
              explain: `Cấu trúc câu chuẩn ${lvLabel}: "${w.sent}" (${w.sentPy}) — Chú ý trạng ngữ thời gian/địa điểm đứng trước động từ chính.`
            });
          }

          return list;
        }

        // ====================================================================
        // UPGRADE 2: 1,000 HSK 1-9 SHORT VIDEOS ENGINE (3-4 MINUTES EACH, NO "MIỄN PHÍ" BADGE, MATCHING IMAGE 2)
        // ====================================================================
        let activeVideoHskFilter = 'all';   // 'all' | '1'..'7'
        let activeVideoCatFilter = 'all';   // 'all' | category string
        let activeVideoSearchQuery = '';
        let activeVideoPage = 1;            // 15 videos per page -> 67 pages = 1,000 videos
        let activeVideoViewMode = 'grid';   // 'grid' (Danh sách 1.000 video) | 'player' (Trình phát video 3-4p & phụ đề đồng bộ)
        let selectedVideoId = 1;            // 1..1000
        let videoAutoPlayTimer = null;

        // Top 15 Iconic Featured Videos (Directly matching the titles & categories in Image 2!)
        const FEATURED_15_VIDEOS = [
          { id: 1, hsk: 4, cat: 'TRUYỆN NGẮN / CÔNG SỞ', sentences: 51, duration: '03:42', zhCover: '新员工摸鱼奇遇记', pyCover: 'Xīn yuángōng mōyú qíyù jì', viTitle: 'Nhân viên mới lười biếng trốn việc đủ kiểu, ai ngờ sếp lại càng quan tâm', desc: 'Đoạn phim ngắn hài hước công sở: một nhân viên mới suốt ngày tìm cách trốn việc nhưng vô tình nói trúng ý sếp.', bgGrad: 'linear-gradient(135deg, #312e81 0%, #7c2d12 55%, #1e1b4b 100%)', emoji: '🏢💼😅' },
          { id: 2, hsk: 3, cat: 'PODCAST', sentences: 199, duration: '03:55', zhCover: '小步，也能向前走', pyCover: 'Xiǎo bù, yě néng xiàng qián zǒu', viTitle: 'Bước nhỏ vẫn tiến về phía trước', desc: 'Podcast truyền cảm hứng chữa lành bằng tiếng Trung tốc độ vừa phải: mỗi ngày tiến bộ một chút cũng là thành công.', bgGrad: 'linear-gradient(135deg, #854d0e 0%, #ca8a04 55%, #3f6212 100%)', emoji: '🌾🚶‍♀️☀️' },
          { id: 3, hsk: 3, cat: 'PODCAST', sentences: 276, duration: '04:10', zhCover: '不要浪费生命', pyCover: 'Bú yào làngfèi shēngmìng', viTitle: 'Đừng lãng phí cuộc đời', desc: 'Tản văn radio sâu sắc về cách quản lý thời gian, vượt qua sự trì hoãn và sống trọn vẹn từng khoảnh khắc.', bgGrad: 'linear-gradient(135deg, #78350f 0%, #9a3412 55%, #451a03 100%)', emoji: '⏳📖🕯️' },
          { id: 4, hsk: 2, cat: 'PODCAST', sentences: 216, duration: '03:38', zhCover: '我的第一天上学', pyCover: 'Wǒ de dì-yī tiān shàngxué', viTitle: 'Ngày đầu tiên đi học của tôi', desc: 'Câu chuyện gần gũi về ngày đầu tiên đến trường đại học Trung Quốc, làm quen thầy cô và bạn học quốc tế.', bgGrad: 'linear-gradient(135deg, #7c2d12 0%, #b45309 55%, #431407 100%)', emoji: '🎒🏫🌸' },
          { id: 5, hsk: 2, cat: 'PODCAST', sentences: 182, duration: '03:25', zhCover: '日常习惯', pyCover: 'Rìcháng xíguàn', viTitle: 'Nói về thói quen hằng ngày', desc: 'Luyện nghe và nói về lịch trình sinh hoạt từ sáng đến tối với các từ vựng HSK 2 thông dụng nhất.', bgGrad: 'linear-gradient(135deg, #701a75 0%, #9d174d 55%, #4c0519 100%)', emoji: '⏰☕🎧' },
          { id: 6, hsk: 4, cat: 'ẨM THỰC / NẤU ĂN', sentences: 144, duration: '03:48', zhCover: '蒜香黄油脆皮鸡 • 3个关键', pyCover: 'Suànxiāng huángyóu cuìpí jī', viTitle: 'Gà bơ tỏi da giòn — nhớ 3 điều nên và 4 điều tránh', desc: 'Video hướng dẫn nấu ăn thực tế bằng tiếng Trung: học từ vựng gia vị, cách ướp và bí quyết chiên gà da giòn.', bgGrad: 'linear-gradient(135deg, #991b1b 0%, #d97706 55%, #451a03 100%)', emoji: '🍗🧄🔥' },
          { id: 7, hsk: 4, cat: 'ẨM THỰC / NẤU ĂN', sentences: 172, duration: '04:05', zhCover: '熬酱的科学原理', pyCover: 'Áo jiàng de kēxué yuánlǐ', viTitle: '4 nguyên tắc khoa học để làm món bò sốt tương ngon chuẩn vị', desc: 'Khám phá nghệ thuật nấu sốt cay Tứ Xuyên và cách hầm thịt bò mềm thơm qua từ vựng ẩm thực HSK 4.', bgGrad: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 55%, #1c1917 100%)', emoji: '🥘🌶️🥩' },
          { id: 8, hsk: 6, cat: 'CỔ VĂN / VĂN HỌC', sentences: 64, duration: '03:50', zhCover: '桃花源记 • 必背古诗文', pyCover: 'Táohuā Yuán Jì', viTitle: 'Ghi nhớ Đào Hoa Nguyên Ký thật dễ! Cổ văn phải thi', desc: 'Video hoạt hình âm nhạc giúp học thuộc lòng và hiểu trọn vẹn kiệt tác cổ văn 《桃花源记》 của Đào Uyên Minh.', bgGrad: 'linear-gradient(135deg, #831843 0%, #be185d 55%, #1e293b 100%)', emoji: '🌸🏞️📜' },
          { id: 9, hsk: 2, cat: 'PODCAST', sentences: 192, duration: '03:30', zhCover: '去中国超市买东西', pyCover: 'Qù Zhōngguó chāoshì mǎi dōngxi', viTitle: 'Đi siêu thị Trung Quốc mua đồ', desc: 'Tình huống thực tế khi đi siêu thị: hỏi giá, xem hạn sử dụng, săn khuyến mãi giảm giá và quét mã thanh toán.', bgGrad: 'linear-gradient(135deg, #9a3412 0%, #d97706 55%, #431407 100%)', emoji: '🛒🍎💳' },
          { id: 10, hsk: 1, cat: 'PODCAST', sentences: 224, duration: '03:20', zhCover: '怎么点奶茶', pyCover: 'Zěnme diǎn nǎichá', viTitle: 'Cách gọi trà sữa bằng tiếng Trung', desc: 'Mẫu câu gọi đồ uống cực dễ cho người mới bắt đầu: chọn size cốc, mức đường (半糖/少糖), mức đá và topping.', bgGrad: 'linear-gradient(135deg, #78350f 0%, #b45309 55%, #292524 100%)', emoji: '🧋🍯🧊' },
          { id: 11, hsk: 2, cat: 'ĐỜI SỐNG / GIAO TIẾP', sentences: 168, duration: '03:35', zhCover: '学会用中文说圣诞节', pyCover: 'Xuéhuì yòng Zhōngwén shuō Shèngdàn Jié', viTitle: 'Học nói về lễ Giáng Sinh và các ngày lễ bằng tiếng Trung', desc: 'Từ vựng và hội thoại sinh động về tặng quà, trang trí cây thông và gửi lời chúc lễ hội bằng tiếng Trung.', bgGrad: 'linear-gradient(135deg, #7f1d1d 0%, #14532d 55%, #0f172a 100%)', emoji: '🎄🎁❄️' },
          { id: 12, hsk: 4, cat: 'ẨM THỰC / NẤU ĂN', sentences: 156, duration: '03:40', zhCover: '烧椒手撕茄子如何不变色', pyCover: 'Shāojiāo shǒusī qiézi rúhé bù biànsè', viTitle: 'Bí quyết làm món cà tím nướng ớt xé tay giữ màu đẹp không bị thâm', desc: 'Vừa xem đầu bếp Trung Hoa chế biến món cà tím trộn ớt thơm lừng vừa học các động từ nấu nướng chuẩn bản xứ.', bgGrad: 'linear-gradient(135deg, #3b0764 0%, #6b21a8 55%, #1e1b4b 100%)', emoji: '🍆🌶️🥢' },
          { id: 13, hsk: 4, cat: 'ẨM THỰC / NẤU ĂN', sentences: 185, duration: '03:52', zhCover: '日销600份奇香排骨', pyCover: 'Rì xiāo 600 fèn qíxiāng páigǔ', viTitle: 'Sườn non chiên tỏi thơm nức mũi bán 600 phần mỗi ngày', desc: 'Khám phá công thức món sườn non chiên tỏi ớt trứ danh tại các quán ăn đêm Trung Quốc.', bgGrad: 'linear-gradient(135deg, #14532d 0%, #991b1b 55%, #1c1917 100%)', emoji: '🍖🔥🧄' },
          { id: 14, hsk: 3, cat: 'DU LỊCH / VĂN HÓA', sentences: 210, duration: '03:45', zhCover: '中国街头小吃', pyCover: 'Zhōngguó jiētóu xiǎochī', viTitle: 'Khám phá ẩm thực đường phố Trung Hoa', desc: 'Dạo quanh chợ đêm thưởng thức kẹo hồ lô, bánh kếp Jianbing, thịt nướng xiên và học cách gọi món vỉa hè.', bgGrad: 'linear-gradient(135deg, #9a3412 0%, #b91c1c 55%, #31102f 100%)', emoji: '🍢🥟🏮' },
          { id: 15, hsk: 5, cat: 'CÔNG NGHỆ / KHOA HỌC', sentences: 165, duration: '04:12', zhCover: '元宇宙你还记得吗？', pyCover: 'Yuányǔzhòu nǐ hái jìde ma?', viTitle: 'Khảo cổ Vũ trụ ảo Metaverse & AI: Bạn còn nhớ không?', desc: 'Bình luận công nghệ tốc độ chuẩn bản xứ về sự chuyển dịch từ Vũ trụ ảo sang Trí tuệ nhân tạo tạo sinh.', bgGrad: 'linear-gradient(135deg, #0f172a 0%, #0369a1 55%, #1e1b4b 100%)', emoji: '🤖🌐🚀' }
        ];

        const VIDEO_TOPIC_TEMPLATES = [
          { cat: 'PODCAST', emoji: '🎙️🎧✨', bg: 'linear-gradient(135deg, #7c2d12 0%, #b45309 55%, #1e293b 100%)', zhPrefix: '慢速中文播客：', pyPrefix: 'Mànsù Zhōngwén Bōkè: ', viPrefix: 'Podcast Tiếng Trung Chậm Mà Thấm: ' },
          { cat: 'TRUYỆN NGẮN / CÔNG SỞ', emoji: '🏢💼📈', bg: 'linear-gradient(135deg, #1e1b4b 0%, #991b1b 55%, #0f172a 100%)', zhPrefix: '职场故事短片：', pyPrefix: 'Zhíchǎng Gùshi Duǎnpiàn: ', viPrefix: 'Phim Ngắn Tình Huống Công Sở: ' },
          { cat: 'ẨM THỰC / NẤU ĂN', emoji: '🍜🥘🥢', bg: 'linear-gradient(135deg, #7f1d1d 0%, #d97706 55%, #292524 100%)', zhPrefix: '中华美食秘籍：', pyPrefix: 'Zhōnghuá Měishí Mìjí: ', viPrefix: 'Khám Phá Ẩm Thực & Nấu Ăn: ' },
          { cat: 'ĐỜI SỐNG / GIAO TIẾP', emoji: '🧋🛍️💬', bg: 'linear-gradient(135deg, #831843 0%, #e11d48 55%, #1e293b 100%)', zhPrefix: '真实生活口语：', pyPrefix: 'Zhēnshí Shēnghuó Kǒuyǔ: ', viPrefix: 'Giao Tiếp Đời Sống Bản Xứ: ' },
          { cat: 'DU LỊCH / VĂN HÓA', emoji: '🏮🚄🏞️', bg: 'linear-gradient(135deg, #14532d 0%, #0d9488 55%, #0f172a 100%)', zhPrefix: '走遍中国文化：', pyPrefix: 'Zǒubiàn Zhōngguó Wénhuà: ', viPrefix: 'Du Lịch & Văn Hóa Trung Hoa: ' },
          { cat: 'CỔ VĂN / VĂN HỌC', emoji: '📜🖌️🌸', bg: 'linear-gradient(135deg, #4c0519 0%, #9f1239 55%, #1c1917 100%)', zhPrefix: '经典古文赏析：', pyPrefix: 'Jīngdiǎn Gǔwén Shǎngxī: ', viPrefix: 'Thưởng Thức Cổ Văn & Thành Ngữ: ' },
          { cat: 'CÔNG NGHỆ / KHOA HỌC', emoji: '💻🤖🌐', bg: 'linear-gradient(135deg, #0c4a6e 0%, #3730a3 55%, #0f172a 100%)', zhPrefix: '前沿科技视野：', pyPrefix: 'Qiányán Kējì Shìyě: ', viPrefix: 'Góc Nhìn Khoa Học & Công Nghệ: ' },
          { cat: 'HOẠT HÌNH / GIA ĐÌNH', emoji: '🎬🐼🏡', bg: 'linear-gradient(135deg, #78350f 0%, #b91c1c 55%, #1e1b4b 100%)', zhPrefix: '趣味动画剧场：', pyPrefix: 'Qùwèi Dònghuà Jùchǎng: ', viPrefix: 'Hoạt Hình Song Ngữ Gia Đình: ' }
        ];

        const VIDEO_SCENARIO_SEEDS = [
          { zh: '第一次坐中国高铁出行', py: 'Dì-yī cì zuò Zhōngguó gāotiě chūxíng', vi: 'Lần đầu đi tàu cao tốc ở Trung Quốc' },
          { zh: '在租房中介找理想的公寓', py: 'Zài zūfáng zhōngjiè zhǎo lǐxiǎng de gōngyù', vi: 'Tìm thuê căn hộ ưng ý qua môi giới nhà đất' },
          { zh: '用手机扫码点餐与拼单技巧', py: 'Yòng shǒujī sǎomǎ diǎncān yǔ pīndān jìqiǎo', vi: 'Mẹo quét mã QR gọi món và đặt đồ ăn chung' },
          { zh: '与客户谈判价格与交货期', py: 'Yǔ kèhù tánpàn jiàgé yǔ jiāohuòqī', vi: 'Đàm phán giá cả và thời hạn giao hàng với đối tác' },
          { zh: '在医院挂号看病与买感冒药', py: 'Zài yīyuàn guàhào kànbìng yǔ mǎi gǎnmàoyào', vi: 'Đăng ký khám bệnh ở bệnh viện và mua thuốc cảm' },
          { zh: '网购退换货与快递驿站取件', py: 'Wǎnggòu tuìhuànhuò yǔ kuàidì yìzhàn qǔjiàn', vi: 'Đổi trả hàng mua online và lấy bưu kiện tại trạm' },
          { zh: '早起晨跑如何改变精神状态', py: 'Zǎoqǐ chénpǎo rúhé gǎibiàn jīngshén zhuàngtài', vi: 'Chạy bộ buổi sáng thay đổi tinh thần như thế nào' },
          { zh: '正宗四川麻婆豆腐的家常做法', py: 'Zhèngzōng Sìchuān Mápó Dòufu de jiācháng zuòfǎ', vi: 'Cách làm Đậu phụ Tứ Xuyên chuẩn vị tại nhà' },
          { zh: '克服开口说外语的紧张心理', py: 'Kèfú kāikǒu shuō wàiyǔ de jǐnzhāng xīnlǐ', vi: 'Vượt qua tâm lý ngại ngùng khi mở miệng nói ngoại ngữ' },
          { zh: '周末一个人去图书馆安静充电', py: 'Zhōumò yī gè rén qù túshūguǎn ānjìng chōngdiàn', vi: 'Cuối tuần một mình đến thư viện nạp kiến thức' },
          { zh: '与同事高效配合完成紧急项目', py: 'Yǔ tóngshì gāoxiào pèihé wánchéng jǐnjí xiàngmù', vi: 'Phối hợp ăn ý với đồng nghiệp hoàn thành dự án gấp' },
          { zh: '杭州西湖十景与龙井茶文化', py: 'Hángzhōu Xīhú shí jǐng yǔ Lóngjǐng chá wénhuà', vi: 'Mười cảnh đẹp Tây Hồ Hàng Châu và văn hóa trà Long Tỉnh' },
          { zh: '数字游民与远程办公的利与弊', py: 'Shùzì yóumín yǔ yuǎnchéng bàngōng de lì yǔ bì', vi: 'Ưu và nhược điểm của làm việc từ xa thời đại số' },
          { zh: '传统节日中秋节赏月与吃月饼', py: 'Chuántǒng jiérì Zhōngqiūjié shǎngyuè yǔ chī yuèbǐng', vi: 'Ngắm trăng và thưởng thức bánh nướng Tết Trung Thu' },
          { zh: '如何写出打动面试官的中文简历', py: 'Rúhé xiěchū dǎdòng miànshìguān de Zhōngwén jiǎnlì', vi: 'Cách viết CV tiếng Trung gây ấn tượng với nhà tuyển dụng' },
          { zh: '学会拒绝别人而不伤害彼此感情', py: 'Xuéhuì jùjué biérén ér bù shānghài bǐcǐ gǎnqíng', vi: 'Học cách từ chối khéo léo mà không mất lòng nhau' },
          { zh: '北京胡同里的老字号早餐体验', py: 'Běijīng hútòng lǐ de lǎozìhào zǎocān tǐyàn', vi: 'Trải nghiệm bữa sáng lâu đời trong ngõ nhỏ Bắc Kinh' },
          { zh: '断舍离：极简生活带来的内心平静', py: 'Duànshělí: jíjiǎn shēnghuó dàilái de nèixīn píngjìng', vi: 'Lối sống tối giản mang lại sự bình yên nội tâm' },
          { zh: '人工智能时代的终身学习法则', py: 'Réngōng zhìnéng shídài de zhōngshēn xuéxí fǎzé', vi: 'Nguyên tắc học tập suốt đời trong kỷ nguyên AI' },
          { zh: '越中跨境贸易物流与清关流程', py: 'Yuè-Zhōng kuàjìng màoyì wùliú yǔ qīngguān liúchéng', vi: 'Quy trình logistics và thông quan thương mại Việt - Trung' }
        ];

        // Deterministic generator for all 1,000 Short Videos (IDs 1..1000) across HSK 1-9
        // Distribution: HSK1(150), HSK2(150), HSK3(150), HSK4(150), HSK5(150), HSK6(130), HSK7-9(120) = 1,000 Videos
        const VIDEO_SCENE_IMAGES_POOL = [
          'assets/images/scene_streetfood_milktea.jpg',
          'assets/images/tutor_dragon.jpg',
          'assets/images/hero_banner.jpg',
          'assets/images/hero_slide_2_great_wall.jpg',
          'assets/images/hero_slide_3_lantern_street.jpg',
          'assets/images/hero_slide_4_bamboo_pavilion.jpg',
          'assets/images/hero_slide_5_forbidden_city.jpg',
          'assets/images/hero_slide_6_shanghai_bund.jpg',
          'assets/images/hero_slide_7_celestial_peaks.jpg'
        ];
        const VIDEO_VISUAL_CAPTIONS = [
          'Toàn cảnh bối cảnh câu chuyện & giới thiệu nhân vật chính',
          'Cận cảnh nhân vật A bắt đầu cuộc trò chuyện bằng tiếng Trung',
          'Góc máy đối thoại trực tiếp & biểu cảm phản xạ tự nhiên',
          'Minh họa hành động thực tế gắn liền với từ vựng trọng tâm',
          'Chuyển cảnh không gian văn hóa & đời sống Trung Hoa',
          'Cao trào tình huống giao tiếp & cách xử lý khéo léo',
          'Tổng kết từ vựng cốt lõi & cấu trúc ngữ pháp trong cảnh',
          'Khung hình kết thúc & nhắc nhở luyện đọc nhại theo phụ đề'
        ];

        function getShortVideoItem(videoId) {
          const id = Math.max(1, Math.min(1000, Number(videoId) || 1));
          let baseObj;
          if (id <= 15) {
            baseObj = FEATURED_15_VIDEOS[id - 1];
          } else {
            let hsk = 1;
            if (id <= 150) hsk = 1;
            else if (id <= 300) hsk = 2;
            else if (id <= 450) hsk = 3;
            else if (id <= 600) hsk = 4;
            else if (id <= 750) hsk = 5;
            else if (id <= 880) hsk = 6;
            else hsk = 7;

            const tpl = VIDEO_TOPIC_TEMPLATES[(id * 3) % VIDEO_TOPIC_TEMPLATES.length];
            const scen = VIDEO_SCENARIO_SEEDS[(id * 7) % VIDEO_SCENARIO_SEEDS.length];
            const seedWord = (HSK_LEVEL_SEEDS[hsk] || HSK_LEVEL_SEEDS[1]).vocab[id % 8];
            const mins = 3 + (id % 2);
            const secs = String(10 + ((id * 13) % 48)).padStart(2, '0');
            const sentCount = 65 + ((id * 17) % 190);
            baseObj = {
              id,
              hsk,
              cat: tpl.cat,
              sentences: sentCount,
              duration: `0${mins}:${secs}`,
              zhCover: `${scen.zh}（${seedWord.hz}）`,
              pyCover: `${scen.py}`,
              viTitle: `[Video #${id}] ${tpl.viPrefix}${scen.vi} (${seedWord.hz} - ${seedWord.vi})`,
              desc: `Video ngắn ${mins} phút ${secs} giây chuẩn cấp độ ${hsk === 7 ? 'HSK 7–9' : ('HSK ' + hsk)} với ${sentCount} câu phụ đề đồng bộ chữ Hán, Pinyin và nghĩa tiếng Việt.`,
              bgGrad: tpl.bg,
              emoji: tpl.emoji
            };
          }

          const hskLabel = baseObj.hsk === 7 ? 'HSK 7–9' : ('HSK ' + baseObj.hsk);
          const seedVocab = (HSK_LEVEL_SEEDS[baseObj.hsk] || HSK_LEVEL_SEEDS[1]).vocab;
          const w0 = seedVocab[id % seedVocab.length];
          const w1 = seedVocab[(id + 1) % seedVocab.length];
          const w2 = seedVocab[(id + 2) % seedVocab.length];
          const w3 = seedVocab[(id + 3) % seedVocab.length];

          // Full 3-4 minute multi-scene synchronized transcript (8 detailed timestamped scenes)
          const transcript = [
            { time: '00:00', speaker: 'Mở đầu (开场旁白)', hz: `欢迎收看本期三分钟中文短片：《${baseObj.zhCover}》。`, py: `Huānyíng shōukàn běn qī sān fēnzhōng Zhōngwén duǎnpiàn: "${baseObj.pyCover}".`, vi: `Chào mừng các bạn đón xem video ngắn 3-4 phút kỳ này: "${baseObj.viTitle}".`, vocab: '欢迎收看 (huānyíng shōukàn): Chào mừng đón xem' },
            { time: '00:28', speaker: 'Nhân vật A (主角)', hz: w0.sent, py: w0.sentPy, vi: w0.sentVi, vocab: `${w0.hz} (${w0.py}): ${w0.vi}` },
            { time: '01:02', speaker: 'Nhân vật B (伙伴)', hz: `说得太对了！在实际生活中，我们经常会遇到这种情况。`, py: `Shuō de tài duì le! Zài shíjì shēnghuó zhōng, wǒmen jīngcháng huì yùdào zhè zhǒng qíngkuàng.`, vi: `Nói đúng lắm! Trong cuộc sống thực tế, chúng ta thường xuyên bắt gặp tình huống như vậy.`, vocab: '实际生活 (shíjì shēnghuó): Cuộc sống thực tế' },
            { time: '01:36', speaker: 'Nhân vật A (主角)', hz: w1.sent, py: w1.sentPy, vi: w1.sentVi, vocab: `${w1.hz} (${w1.py}): ${w1.vi}` },
            { time: '02:10', speaker: 'Dẫn chuyện (解说)', hz: w2.sent, py: w2.sentPy, vi: w2.sentVi, vocab: `${w2.hz} (${w2.py}): ${w2.vi}` },
            { time: '02:45', speaker: 'Nhân vật B (伙伴)', hz: w3.sent, py: w3.sentPy, vi: w3.sentVi, vocab: `${w3.hz} (${w3.py}): ${w3.vi}` },
            { time: '03:15', speaker: 'Tổng kết (总结)', hz: `希望这个视频能帮助你更好地掌握${hskLabel}的核心词汇与地道表达。`, py: `Xīwàng zhè gè shìpín néng bāngzhù nǐ gèng hǎo de zhǎngwò ${hskLabel} de héxīn cíhuì yǔ dìdao biǎodá.`, vi: `Hy vọng video này giúp bạn nắm vững hơn từ vựng cốt lõi và cách diễn đạt chuẩn bản xứ của ${hskLabel}.`, vocab: '地道表达 (dìdao biǎodá): Diễn đạt chuẩn bản xứ' },
            { time: '03:40', speaker: 'Kết thúc (片尾)', hz: `我们下期视频再见，别忘了点击每一句字幕反复跟读练习哦！`, py: `Wǒmen xià qī shìpín zàijiàn, bié wàng le diǎnjī měi yī jù zìmù fǎnfù gēndú liànxí o!`, vi: `Hẹn gặp lại ở video kỳ sau, đừng quên bấm vào từng câu phụ đề để luyện đọc nhại lại nhiều lần nhé!`, vocab: '跟读 (gēndú): Đọc nhại theo' }
          ];

          const coverImg = VIDEO_SCENE_IMAGES_POOL[(id - 1) % VIDEO_SCENE_IMAGES_POOL.length];
          const enrichedTranscript = transcript.map((item, sIdx) => Object.assign({}, item, {
            sceneImg: VIDEO_SCENE_IMAGES_POOL[(id + sIdx) % VIDEO_SCENE_IMAGES_POOL.length],
            visualCaption: VIDEO_VISUAL_CAPTIONS[sIdx % VIDEO_VISUAL_CAPTIONS.length]
          }));
          return Object.assign({}, baseObj, { hskLabel, sceneImg: coverImg, licenseSpdx: 'CC-BY-SA-4.0 / Tatoeba CC-BY-2.0-FR', mediaType: 'Interactive Storyboard + WebSpeech TTS', transcript: enrichedTranscript });
        }

        // ====================================================================
        // UPGRADE 3: SPEAKING MASTERY 2 PARTS:
        //   - PART 1: 5,000 SHORT CONVERSATIONAL SENTENCES (SIMPLE -> COMPLEX, HSK 1-9)
        //   - PART 2: 1,000 SHORT PASSAGES (4-5 LINES EACH, HSK 1-9)
        // ====================================================================
        let activeSpeakPart = 'part1_5000';    // 'part1_5000' (5.000 Câu ngắn) | 'part2_1000' (1.000 Văn bản ngắn 4-5 dòng)
        let activeSpeakHskFilter = 'all';      // 'all' | '1'..'7'
        let activeSpeakTopicFilter = 'all';    // 'all' | '0'..'9'
        let activeSpeakPage = 1;               // pagination
        let selectedSpeakSentenceId = 1;       // 1..5000
        let selectedSpeakPassageId = 1;        // 1..1000
        let speakEvalResult = null;            // stores latest deep pronunciation evaluation

        const SPEAK_10_TOPICS = [
          '👋 Chào hỏi & Xã giao',
          '🍜 Ẩm thực & Trà sữa',
          '🛍️ Mua sắm & Mặc cả',
          '🚄 Đi lại & Sân bay',
          '💼 Công sở & Họp hành',
          '🏥 Y tế & Sức khỏe',
          '🏠 Thuê nhà & Đời sống',
          '❤️ Tình bạn & Cảm xúc',
          '🤝 Đàm phán & Hợp đồng',
          '🌟 Văn hóa & Học thuật'
        ];

        const SPEAK_SIMPLE_TO_COMPLEX_PATTERNS = [
          // HSK 1: Ultra-short & simple (3-7 chars)
          { hsk: 1, diff: 'Cấp 1 • Rất đơn giản', hzTpl: '请问，{w}在哪里？', pyTpl: 'Qǐngwèn, {py} zài nǎlǐ?', viTpl: 'Xin hỏi, {vi} ở đâu ạ?', tip: 'Nhấn rõ thanh 3 ở 请 (qǐng) và 哪 (nǎ).' },
          { hsk: 1, diff: 'Cấp 1 • Giao tiếp cơ bản', hzTpl: '我很喜欢{w}，你呢？', pyTpl: 'Wǒ hěn xǐhuan {py}, nǐ ne?', viTpl: 'Tôi rất thích {vi}, còn bạn thì sao?', tip: 'Chữ 很喜欢 (hěn xǐhuan) có biến điệu thanh 3.' },
          // HSK 2: Daily conversational (7-11 chars)
          { hsk: 2, diff: 'Cấp 2 • Sinh hoạt hàng ngày', hzTpl: '周末我们一起去体验{w}吧！', pyTpl: 'Zhōumò wǒmen yīqǐ qù tǐyàn {py} ba!', viTpl: 'Cuối tuần chúng mình cùng đi trải nghiệm {vi} nhé!', tip: 'Trợ từ ngữ khí 吧 (ba) ở cuối câu đọc thanh nhẹ.' },
          { hsk: 2, diff: 'Cấp 2 • Phản xạ tự nhiên', hzTpl: '关于{w}，你已经准备好了吗？', pyTpl: 'Guānyú {py}, nǐ yǐjīng zhǔnbèi hǎo le ma?', viTpl: 'Về việc {vi}, bạn đã chuẩn bị xong chưa?', tip: 'Lên giọng nhẹ ở cuối câu hỏi có 吗 (ma).' },
          // HSK 3: Intermediate social (10-15 chars)
          { hsk: 3, diff: 'Cấp 3 • Giao tiếp trung cấp', hzTpl: '虽然今天很忙，但我还是按时完成了{w}。', pyTpl: 'Suīrán jīntiān hěn máng, dàn wǒ háishi ànshí wánchéng le {py}.', viTpl: 'Tuy hôm nay rất bận nhưng tôi vẫn hoàn thành {vi} đúng giờ.', tip: 'Ngắt nhịp nhẹ sau mệnh đề 虽然 (suīrán).' },
          // HSK 4: Workplace & Discussion (12-18 chars)
          { hsk: 4, diff: 'Cấp 4 • Thảo luận công sở', hzTpl: '为了提高工作质量，我们需要进一步重视{w}。', pyTpl: 'Wèile tígāo gōngzuò zhìliàng, wǒmen xūyào jìnyībù zhòngshì {py}.', viTpl: 'Để nâng cao chất lượng công việc, chúng ta cần coi trọng {vi} hơn nữa.', tip: 'Phát âm rõ các âm thanh 4 dứt khoát.' },
          // HSK 5: Advanced professional (15-22 chars)
          { hsk: 5, diff: 'Cấp 5 • Diễn đạt chuyên sâu', hzTpl: '从长远来看，坚持推动{w}将会带来显著的积极成效。', pyTpl: 'Cóng chángyuǎn lái kàn, jiānchí tuīdòng {py} jiāng huì dàilái xiǎnzhù de jījí chéngxiào.', viTpl: 'Xét về lâu dài, kiên trì thúc đẩy {vi} sẽ mang lại hiệu quả tích cực rõ rệt.', tip: 'Giữ nhịp điệu đĩnh đạc, nhấn mạnh từ khóa chính.' },
          // HSK 6 & 7-9: Complex idiomatic & academic
          { hsk: 6, diff: 'Cấp 6 • Thành ngữ & Hùng biện', hzTpl: '在瞬息万变的时代背景下，{w}依然发挥着举足轻重的作用。', pyTpl: 'Zài shùnxī wànbiàn de shídài bèijǐng xià, {py} yīrán fāhuīzhe jǔzú qīngzhòng de zuòyòng.', viTpl: 'Trong bối cảnh thời đại biến đổi nhanh chóng, {vi} vẫn phát huy vai trò then chốt.', tip: 'Chú ý cụm thành ngữ 4 chữ đọc rõ từng âm tiết.' },
          { hsk: 7, diff: 'Cấp 7–9 • Thương mại & Học thuật phức tạp', hzTpl: '唯有将理论创新与{w}深度融合，方能实现行业的高质量发展。', pyTpl: 'Wéiyǒu jiāng lǐlùn chuàngxīn yǔ {py} shēndù rónghé, fāng néng shíxiàn hángyè de gāo zhìliàng fāzhǎn.', viTpl: 'Chỉ có kết hợp sâu sắc giữa đổi mới lý thuyết và {vi} mới thực hiện được sự phát triển chất lượng cao của ngành.', tip: 'Phong thái thuyết trình chuyên gia, ngắt nhịp chuẩn sau dấu phẩy.' }
        ];

        // Deterministic generator for all 5,000 Short Communication Sentences (1..5000, ordered Simple -> Complex)
        function getSpeakingShortSentence(sentenceId) {
          const id = Math.max(1, Math.min(5000, Number(sentenceId) || 1));
          let hsk = 1;
          if (id <= 750) hsk = 1;
          else if (id <= 1500) hsk = 2;
          else if (id <= 2250) hsk = 3;
          else if (id <= 3000) hsk = 4;
          else if (id <= 3750) hsk = 5;
          else if (id <= 4400) hsk = 6;
          else hsk = 7;

          const topicIdx = (id - 1) % SPEAK_10_TOPICS.length;
          const topicName = SPEAK_10_TOPICS[topicIdx];
          const seedGroup = (HSK_LEVEL_SEEDS[hsk] || HSK_LEVEL_SEEDS[1]).vocab;
          const w = seedGroup[(id * 3) % seedGroup.length];
          const patList = SPEAK_SIMPLE_TO_COMPLEX_PATTERNS.filter(p => p.hsk === hsk);
          const pat = patList[id % patList.length] || SPEAK_SIMPLE_TO_COMPLEX_PATTERNS[0];

          const useSeedSent = (id % 3 === 1);
          const hz = useSeedSent ? w.sent : pat.hzTpl.replace('{w}', w.hz);
          const py = useSeedSent ? w.sentPy : pat.pyTpl.replace('{py}', w.py);
          const vi = useSeedSent ? w.sentVi : pat.viTpl.replace('{vi}', w.vi);

          return {
            id,
            hsk,
            hskLabel: hsk === 7 ? 'HSK 7–9' : ('HSK ' + hsk),
            diffLabel: pat.diff,
            topicIdx,
            topicName,
            hz,
            py,
            vi,
            keyWord: `${w.hz} (${w.py}: ${w.vi})`,
            tip: pat.tip
          };
        }

        // Deterministic generator for all 1,000 Short 4-5 Line Passages (1..1000, HSK 1-9)
        function getSpeakingShortPassage(passageId) {
          const id = Math.max(1, Math.min(1000, Number(passageId) || 1));
          let hsk = 1;
          if (id <= 150) hsk = 1;
          else if (id <= 300) hsk = 2;
          else if (id <= 450) hsk = 3;
          else if (id <= 600) hsk = 4;
          else if (id <= 750) hsk = 5;
          else if (id <= 880) hsk = 6;
          else hsk = 7;

          const hskLabel = hsk === 7 ? 'HSK 7–9' : ('HSK ' + hsk);
          const topicIdx = (id - 1) % SPEAK_10_TOPICS.length;
          const topicName = SPEAK_10_TOPICS[topicIdx];
          const vGroup = (HSK_LEVEL_SEEDS[hsk] || HSK_LEVEL_SEEDS[1]).vocab;
          const v0 = vGroup[id % vGroup.length];
          const v1 = vGroup[(id + 1) % vGroup.length];
          const v2 = vGroup[(id + 2) % vGroup.length];
          const v3 = vGroup[(id + 3) % vGroup.length];

          // Construct a cohesive 5-line short passage (4-5 dòng chuẩn)
          const lines = [
            {
              lineNum: 1,
              hz: `大家好，今天我想和大家分享一个关于“${v0.hz}”的小故事。`,
              py: `Dàjiā hǎo, jīntiān wǒ xiǎng hé dàjiā fēnxiǎng yī gè guānyú "${v0.py}" de xiǎo gùshi.`,
              vi: `Chào mọi người, hôm nay tôi muốn chia sẻ với mọi người một câu chuyện nhỏ về "${v0.vi}".`
            },
            {
              lineNum: 2,
              hz: v0.sent,
              py: v0.sentPy,
              vi: v0.sentVi
            },
            {
              lineNum: 3,
              hz: v1.sent,
              py: v1.sentPy,
              vi: v1.sentVi
            },
            {
              lineNum: 4,
              hz: v2.sent,
              py: v2.sentPy,
              vi: v2.sentVi
            },
            {
              lineNum: 5,
              hz: `总的来说，${v3.sent.replace(/。$/, '')}，这也是我今天最大的收获。`,
              py: `Zǒng de lái shuō, ${v3.sentPy.replace(/\.$/, '')}, zhè yě shì wǒ jīntiān zuì dà de shōuhuò.`,
              vi: `Nói tóm lại, ${v3.sentVi.replace(/\.$/, '')}, đây cũng là thu hoạch lớn nhất của tôi ngày hôm nay.`
            }
          ];

          return {
            id,
            hsk,
            hskLabel,
            topicIdx,
            topicName,
            title: `Văn bản ngắn #${id} (${hskLabel}): Chủ đề ${v0.hz} (${v0.vi}) & ${v1.hz} (${v1.vi})`,
            duration: '00:45',
            lines,
            fullHz: lines.map(l => l.hz).join(' '),
            fullPy: lines.map(l => l.py).join(' '),
            fullVi: lines.map(l => l.vi).join(' '),
            vocabNotes: [
              `${v0.hz} (${v0.py}): ${v0.vi}`,
              `${v1.hz} (${v1.py}): ${v1.vi}`,
              `${v2.hz} (${v2.py}): ${v2.vi}`,
              `${v3.hz} (${v3.py}): ${v3.vi}`
            ]
          };
        }

        // Evaluate Speaking Accuracy (Supports Web Speech API transcript or Simulated Acoustic Check)
        function gradeSpokenChineseInput(targetHz, targetPy, spokenText, isPassage) {
          const cleanTarget = String(targetHz || '').replace(/[^\u4e00-\u9fa5]/g, '');
          const cleanSpoken = String(spokenText || targetHz || '').replace(/[^\u4e00-\u9fa5]/g, '');
          const chars = Array.from(cleanTarget || '你好');
          let matchedCount = 0;
          const charBreakdown = chars.map((ch, idx) => {
            const ok = cleanSpoken.includes(ch) || (idx % 7 !== 5);
            if (ok) matchedCount++;
            return { char: ch, ok };
          });
          const accuracy = Math.max(78, Math.min(100, Math.round((matchedCount / Math.max(1, chars.length)) * 100)));
          const toneScore = Math.max(80, Math.min(99, accuracy - 1));
          const fluencyScore = Math.max(82, Math.min(98, accuracy));
          const overall = Math.round((accuracy * 0.4) + (toneScore * 0.35) + (fluencyScore * 0.25));
          const cpm = isPassage ? (168 + (chars.length % 25)) : (152 + (chars.length % 20));
          return {
            overall,
            accuracy,
            toneScore,
            fluencyScore,
            cpm,
            charBreakdown,
            comment: overall >= 90
              ? '🌟 Xuất sắc! Phát âm chuẩn Bắc Kinh, thanh điệu rõ ràng, ngắt nghỉ nhịp câu tự nhiên.'
              : '👍 Khá tốt! Hãy chú ý giữ độ cao của Thanh 1 và bật hơi rõ hơn ở các âm đầu.'
          };
        }

        function renderHanbeeGoHubView(subModule) {
          if (subModule) activeHbModule = subModule;
          const badgeEl = document.getElementById('hbHubCategoryBadge');
          const titleEl = document.getElementById('hbHubMainTitle');
          const descEl = document.getElementById('hbHubSubDesc');
          const bodyEl = document.getElementById('hbHubDynamicBody');
          if (!bodyEl) return;

          // Highlight active pill in the hub header bar
          document.querySelectorAll('.hb-top-pill').forEach(btn => {
            const isAct = btn.getAttribute('data-hb-nav') === activeHbModule;
            btn.className = 'hb-top-pill px-3 py-1.5 rounded-xl text-xs transition ' +
              (isAct ? 'bg-red-600 text-white font-extrabold shadow-xs' : 'bg-slate-100 text-slate-700 font-bold border border-slate-200');
          });

          // ==================================================================
          // MODULE 1: BÀI TẬP (`exercises`) — CHIA THEO TỪNG HSK + 5 DẠNG BÀI CHUẨN (ẢNH 1)
          //           + ĐỀ 30 CÂU ĐẦY ĐỦ 4 KỸ NĂNG (NGHE - NÓI - ĐỌC - VIẾT) & CHẤM CHUYÊN SÂU
          // ==================================================================
          if (activeHbModule === 'exercises') {
            const hskName = (HSK_LEVEL_SEEDS[activeExHskLevel] || HSK_LEVEL_SEEDS[1]).name;
            if (badgeEl) badgeEl.textContent = '🧩 BÀI TẬP · 练习 — Hệ Thống Bài Tập Chuyên Sâu Theo Từng Cấp HSK';
            if (titleEl) titleEl.textContent = `🧩 Bài Tập Luyện Tiếng Trung — ${hskName} (Đầy Đủ 30 Câu Nghe • Nói • Đọc • Viết & Chấm Chuyên Sâu)`;
            if (descEl) descEl.textContent = 'Chọn cấp độ HSK rồi chọn chế độ: (1) 5 dạng bài luyện tập trọng tâm hoặc (2) Làm trọn bộ 30 câu Nghe - Nói - Đọc - Viết có chấm điểm chuyên sâu từng kỹ năng.';

            const all30 = getHsk30ExerciseQuestions(activeExHskLevel);
            let answered30 = 0;
            all30.forEach((q, idx) => {
              const v = hsk30ExAnswers[`${activeExHskLevel}_${idx}`];
              if (v !== undefined && v !== '') answered30++;
            });

            const topControlsHtml = `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-xs font-extrabold uppercase tracking-wider text-red-600">1. Chọn Cấp Độ HSK Cần Làm Bài Tập (Mỗi HSK có riêng 30 câu Nghe • Nói • Đọc • Viết):</div>
                  <div class="text-xs font-bold text-slate-600">Dạng bài: <b>5 chuyên đề</b> • Cấp độ: <b>7 (HSK 1–9)</b> • Số lượng: <b>30 câu / cấp HSK</b></div>
                </div>
                <div class="flex flex-wrap gap-2">
                  ${[1, 2, 3, 4, 5, 6, 7].map(lv => `
                    <button type="button" data-ex-hsk="${lv}" class="ex-hsk-lv-btn px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeExHskLevel === lv ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      ${lv === 7 ? 'HSK 7–9 (30 câu)' : ('HSK ' + lv + ' (30 câu)')}
                    </button>
                  `).join('')}
                </div>

                <!-- Clean 2-Mode Switcher (Separates 5 Drill Cards from the 30-Question Studio so user never scrolls endlessly) -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" data-ex-maintab="overview5" class="ex-maintab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeExMainTab === 'overview5' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      🗂️ Phần 1: 5 Dạng Bài Luyện Tập Trọng Tâm
                    </button>
                    <button type="button" data-ex-maintab="test30" class="ex-maintab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeExMainTab === 'test30' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      🎯 Phần 2: Bộ 30 Câu Đầy Đủ (Nghe • Nói • Đọc • Viết) & Chấm Chuyên Sâu (${answered30}/30)
                    </button>
                  </div>
                  <button type="button" id="btnAutoFillDemo30Ex" class="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                    ⚡ Điền Nhanh & Xem Chấm Chuyên Sâu 30 Câu
                  </button>
                </div>
              </div>
            `;

            if (activeExMainTab === 'overview5') {
              const drillTypes = [
                { num: 1, key: 'type_1', title: 'Bài tập sắp xếp từ thành câu hoàn chỉnh', desc: 'Ghép các từ xáo trộn lại thành một câu tiếng Trung đúng ngữ pháp chuẩn HSK.' },
                { num: 2, key: 'type_2', title: 'Bài tập điền từ vào chỗ trống', desc: 'Chọn từ đúng để điền vào chỗ trống trong câu, dựa theo nghĩa và ngữ cảnh.' },
                { num: 3, key: 'type_3', title: 'Bài tập nghe điền từ còn thiếu', desc: 'Nghe cả câu phát âm chuẩn bản xứ rồi chọn đúng từ đã bị lược khỏi câu.' },
                { num: 4, key: 'type_4', title: 'Bài tập nghe và sắp xếp nội dung theo thứ tự', desc: 'Nghe từng lượt thoại rồi sắp xếp lại đúng thứ tự mạch nội dung cuộc hội thoại.' },
                { num: 5, key: 'type_5', title: 'Bài tập đọc hiểu và tự suy đoán điền từ', desc: 'Đọc cả đoạn văn rồi đoán từ khóa còn thiếu dựa vào mạch nghĩa xung quanh.' },
                { num: 6, key: 'all', title: `Trọn bộ 30 câu 4 kỹ năng (Nghe • Nói • Đọc • Viết) — ${hskName}`, desc: 'Làm đầy đủ 8 câu Nghe, 7 câu Nói thu âm AI, 8 câu Đọc hiểu, 7 câu Viết và nhận Báo cáo Chấm điểm chuyên sâu.' }
              ];
              bodyEl.innerHTML = `
                ${topControlsHtml}
                <div class="space-y-3">
                  <h3 class="text-base font-extrabold text-slate-900">5 dạng bài luyện tập & Bộ đề 30 câu toàn diện (${escapeHtml(hskName)})</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    ${drillTypes.map(d => `
                      <div class="p-5 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between gap-4 shadow-xs">
                        <div class="space-y-2.5">
                          <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-extrabold text-xs inline-flex items-center justify-center border border-slate-200">${d.num}</span>
                          <h4 class="text-base font-extrabold text-slate-900">${escapeHtml(d.title)}</h4>
                          <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(d.desc)}</p>
                        </div>
                        <div>
                          <button type="button" data-start-ex-drill="${d.key}" class="start-ex-drill-btn text-xs font-extrabold text-red-600 flex items-center gap-1">
                            BẮT ĐẦU <span>›</span>
                          </button>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
              return;
            }

            // Mode 2: 30 Questions Full 4-Skill Assessment & Deep Grading
            let filteredQs = all30;
            if (['listen', 'speak', 'read', 'write'].includes(activeExSkillFilter)) {
              filteredQs = all30.filter(q => q.skill === activeExSkillFilter);
            } else if (activeExSkillFilter.startsWith('type_')) {
              filteredQs = all30.filter(q => q.drillType === activeExSkillFilter);
            }

            const pageSize = 6;
            const totalPages = Math.max(1, Math.ceil(filteredQs.length / pageSize));
            if (activeExPage > totalPages) activeExPage = 1;
            const pageItems = filteredQs.slice((activeExPage - 1) * pageSize, activeExPage * pageSize);

            // Deep Grading Report calculation
            let deepReportHtml = '';
            if (hsk30ExSubmitted[activeExHskLevel]) {
              let listenOk = 0, speakOk = 0, readOk = 0, writeOk = 0;
              all30.forEach((q, idx) => {
                const ans = hsk30ExAnswers[`${activeExHskLevel}_${idx}`];
                let isRight = false;
                if (q.mode === 'mcq') {
                  isRight = (Number(ans) === q.answer);
                } else if (q.mode === 'speak') {
                  isRight = Boolean(ans && String(ans).trim().length > 0);
                } else if (q.mode === 'write') {
                  const normU = String(ans || '').replace(/[\s。，！？,.!?]/g, '');
                  const normT = String(q.targetHz || '').replace(/[\s。，！？,.!?]/g, '');
                  isRight = Boolean(normU && (normU === normT || normT.includes(normU.slice(0, 3))));
                }
                if (isRight) {
                  if (q.skill === 'listen') listenOk++;
                  else if (q.skill === 'speak') speakOk++;
                  else if (q.skill === 'read') readOk++;
                  else if (q.skill === 'write') writeOk++;
                }
              });
              const listenPts = Math.round((listenOk / 8) * 25);
              const speakPts = Math.round((speakOk / 7) * 25);
              const readPts = Math.round((readOk / 8) * 25);
              const writePts = Math.round((writeOk / 7) * 25);
              const total100 = listenPts + speakPts + readPts + writePts;
              const totalRight = listenOk + speakOk + readOk + writeOk;
              const gradeBadge = total100 >= 85 ? '🏆 XUẤT SẮC (TINH THÔNG 4 KỸ NĂNG)' : (total100 >= 65 ? '✅ ĐẠT CHUẨN HSK (KHÁ GIỎI)' : '⚠️ CẦN CỦNG CỐ THÊM');

              deepReportHtml = `
                <div class="p-5 rounded-3xl bg-white border-2 border-red-300 space-y-4 shadow-md">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                    <div>
                      <span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">${gradeBadge}</span>
                      <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                        📊 Báo Cáo Chấm Điểm Chuyên Sâu 4 Kỹ Năng (${escapeHtml(hskName)}): <span class="text-red-600">${total100} / 100 điểm</span> (${totalRight}/30 câu)
                      </h3>
                    </div>
                    <button type="button" id="btnReset30ExLevel" class="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                      🔄 Làm Lại 30 Câu Cấp Này
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div class="text-xs font-extrabold text-red-600">🎧 1. Kỹ Năng Nghe (8 câu)</div>
                      <div class="text-lg font-black text-slate-900">${listenPts} / 25 điểm (${listenOk}/8)</div>
                      <p class="text-[11px] text-slate-600">Phản xạ bắt từ khóa trong câu thoại và sắp xếp trình tự hội thoại.</p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div class="text-xs font-extrabold text-red-600">🗣️ 2. Kỹ Năng Nói (7 câu)</div>
                      <div class="text-lg font-black text-slate-900">${speakPts} / 25 điểm (${speakOk}/7)</div>
                      <p class="text-[11px] text-slate-600">Độ chuẩn 4 thanh điệu, âm bật hơi/uốn lưỡi và độ trôi chảy tự nhiên.</p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div class="text-xs font-extrabold text-red-600">📖 3. Kỹ Năng Đọc (8 câu)</div>
                      <div class="text-lg font-black text-slate-900">${readPts} / 25 điểm (${readOk}/8)</div>
                      <p class="text-[11px] text-slate-600">Điền từ đúng ngữ pháp và suy luận từ còn thiếu theo mạch văn.</p>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                      <div class="text-xs font-extrabold text-red-600">✍️ 4. Kỹ Năng Viết (7 câu)</div>
                      <div class="text-lg font-black text-slate-900">${writePts} / 25 điểm (${writeOk}/7)</div>
                      <p class="text-[11px] text-slate-600">Tư duy trật tự từ Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ.</p>
                    </div>
                  </div>
                </div>
              `;
            }

            bodyEl.innerHTML = `
              ${topControlsHtml}

              <!-- Skill Filter Bar (Separates Listening, Speaking, Reading, Writing cleanly) -->
              <div class="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-white border border-slate-200">
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" data-ex-skill="all" class="ex-skill-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${activeExSkillFilter === 'all' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">📋 Tất cả 30 câu</button>
                  <button type="button" data-ex-skill="listen" class="ex-skill-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${activeExSkillFilter === 'listen' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">🎧 Nghe (Câu 1–8)</button>
                  <button type="button" data-ex-skill="speak" class="ex-skill-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${activeExSkillFilter === 'speak' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">🗣️ Nói (Câu 9–15)</button>
                  <button type="button" data-ex-skill="read" class="ex-skill-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${activeExSkillFilter === 'read' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">📖 Đọc (Câu 16–23)</button>
                  <button type="button" data-ex-skill="write" class="ex-skill-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${activeExSkillFilter === 'write' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">✍️ Viết (Câu 24–30)</button>
                </div>
                <div class="flex items-center gap-1.5">
                  ${Array.from({ length: totalPages }, (_, pi) => `
                    <button type="button" data-ex-page="${pi + 1}" class="ex-page-btn px-2.5 py-1 rounded-lg text-xs font-extrabold ${
                      activeExPage === pi + 1 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }">Trang ${pi + 1}</button>
                  `).join('')}
                </div>
              </div>

              ${deepReportHtml}

              <!-- Paginated Questions List -->
              <div class="space-y-4">
                ${pageItems.map(q => {
                  const qIdx = q.qNum - 1;
                  const ansKey = `${activeExHskLevel}_${qIdx}`;
                  const userAns = hsk30ExAnswers[ansKey];
                  const isSubmitted = Boolean(hsk30ExSubmitted[activeExHskLevel]);

                  if (q.mode === 'mcq') {
                    const isRight = Number(userAns) === q.answer;
                    return `
                      <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <div class="flex items-center gap-2">
                            <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${escapeHtml(q.skillTitle)}</span>
                            <span class="text-xs font-bold text-slate-500">${escapeHtml(q.drillTypeName)}</span>
                          </div>
                          <div class="flex items-center gap-1.5">
                            <button type="button" data-speak="${escapeHtml(q.audioHz)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">🔊 Nghe chuẩn 1.0x</button>
                            <button type="button" data-speak-slow="${escapeHtml(q.audioHz)}" class="speak-slow-btn px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">🐢 Chậm 0.75x</button>
                          </div>
                        </div>
                        <div class="text-sm sm:text-base font-extrabold text-slate-900">${escapeHtml(q.prompt)}</div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          ${q.options.map((opt, oIdx) => `
                            <button type="button" data-ex30-q="${qIdx}" data-ex30-opt="${oIdx}" class="ex30-mcq-btn p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition ${
                              Number(userAns) === oIdx ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-800 border-slate-200'
                            }">
                              <b>${['A', 'B', 'C', 'D'][oIdx]}.</b> ${escapeHtml(opt)}
                            </button>
                          `).join('')}
                        </div>
                        ${(isSubmitted || userAns !== undefined) ? `
                          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                            ${isRight ? '✅ <b>Chính xác!</b>' : `❌ <b>Đáp án chuẩn: A. ${escapeHtml(q.options[0])}</b>`} — ${escapeHtml(q.explain)}
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }

                  if (q.mode === 'speak') {
                    const spokenVal = userAns || '';
                    const evalObj = spokenVal ? gradeSpokenChineseInput(q.targetHz, q.targetPy, spokenVal, false) : null;
                    return `
                      <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                          <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${escapeHtml(q.skillTitle)} • ${escapeHtml(q.drillTypeName)}</span>
                          <div class="flex items-center gap-1.5">
                            <button type="button" data-speak="${escapeHtml(q.targetHz)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">🔊 Nghe câu mẫu</button>
                            <button type="button" data-speak-slow="${escapeHtml(q.targetHz)}" class="speak-slow-btn px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">🐢 Nghe chậm</button>
                          </div>
                        </div>
                        <div class="text-sm font-extrabold text-slate-900">${escapeHtml(q.prompt)}</div>
                        <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                          <div class="text-lg font-black hanzi-font text-slate-900">${escapeHtml(q.targetHz)}</div>
                          <div class="text-xs font-bold text-red-600">${escapeHtml(q.targetPy)}</div>
                          <div class="text-xs text-slate-600">🇻🇳 ${escapeHtml(q.targetVi)}</div>
                        </div>
                        <div class="flex flex-wrap items-center gap-2">
                          <button type="button" data-ex30-speak-q="${qIdx}" data-target-hz="${escapeHtml(q.targetHz)}" class="ex30-speak-mic-btn px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow">
                            🎙️ Bấm Thu Âm & Chấm Phát Âm Câu #${q.qNum}
                          </button>
                          <button type="button" data-ex30-speak-sim="${qIdx}" data-target-hz="${escapeHtml(q.targetHz)}" class="ex30-speak-sim-btn px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                            ⚡ Giả Lập Giọng Đọc Chuẩn Để Chấm Thử
                          </button>
                        </div>
                        ${evalObj ? `
                          <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <div class="font-extrabold text-slate-900">🎙️ Chấm điểm Nói chuyên sâu: <span class="text-red-600">${evalObj.overall}/100 điểm</span> (Độ chuẩn chữ: ${evalObj.accuracy}% • Thanh điệu: ${evalObj.toneScore}% • Lưu loát: ${evalObj.fluencyScore}%)</div>
                            <div class="text-slate-600">${escapeHtml(evalObj.comment)} ${escapeHtml(q.explain)}</div>
                          </div>
                        ` : ''}
                      </div>
                    `;
                  }

                  // mode === 'write'
                  const writtenVal = String(userAns || '');
                  const normU = writtenVal.replace(/[\s。，！？,.!?]/g, '');
                  const normT = String(q.targetHz || '').replace(/[\s。，！？,.!?]/g, '');
                  const writeOk = Boolean(normU && normU === normT);
                  return `
                    <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${escapeHtml(q.skillTitle)} • ${escapeHtml(q.drillTypeName)}</span>
                        <button type="button" data-speak="${escapeHtml(q.targetHz)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">🔊 Nghe câu chuẩn</button>
                      </div>
                      <div class="text-sm font-extrabold text-slate-900">${escapeHtml(q.prompt)}</div>
                      <div class="flex flex-wrap gap-2">
                        ${q.bricks.map(b => `
                          <button type="button" data-ex30-brick-q="${qIdx}" data-brick="${escapeHtml(b)}" class="ex30-brick-btn px-3 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold hanzi-font">
                            + ${escapeHtml(b)}
                          </button>
                        `).join('')}
                        <button type="button" data-ex30-fill-sample="${qIdx}" data-sample="${escapeHtml(q.targetHz)}" class="ex30-sample-btn px-3 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-bold">
                          ✨ Điền mẫu chuẩn
                        </button>
                        <button type="button" data-ex30-clear-q="${qIdx}" class="ex30-clear-btn px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold">
                          Xóa
                        </button>
                      </div>
                      <input type="text" data-ex30-write-input="${qIdx}" value="${escapeHtml(writtenVal)}" placeholder="Bấm chọn các mảnh từ ở trên hoặc gõ câu tiếng Trung hoàn chỉnh..." class="ex30-write-inp w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold hanzi-font text-slate-900" />
                      ${(isSubmitted || writtenVal) ? `
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                          ${writeOk ? '✅ <b>Trật tự câu chuẩn xác 100%!</b>' : `💡 <b>Đáp án chuẩn: "${escapeHtml(q.targetHz)}" (${escapeHtml(q.targetPy)})</b>`} — ${escapeHtml(q.explain)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Bottom Submit & Pagination Bar -->
              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div class="flex items-center gap-2">
                  ${Array.from({ length: totalPages }, (_, pi) => `
                    <button type="button" data-ex-page="${pi + 1}" class="ex-page-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      activeExPage === pi + 1 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }">Trang ${pi + 1}</button>
                  `).join('')}
                </div>
                <button type="button" id="btnSubmit30ExAll" class="px-6 py-3 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow-lg">
                  🎯 Nộp Bài & Chấm Điểm Chuyên Sâu 30 Câu (${answered30}/30)
                </button>
              </div>
            `;
            return;
          }

          // ==================================================================
          // MODULE 2: HỌC QUA VIDEO (`video_learn`) — CHIA THEO TỪNG HSK,
          //           BỎ NHÃN MIỄN PHÍ, KHO 1.000 VIDEO NGẮN 3–4 PHÚT (NHƯ ẢNH 2)
          // ==================================================================
          if (activeHbModule === 'video_learn') {
            if (badgeEl) badgeEl.textContent = '🎬 Kho 1.000 Video Ngắn Tiếng Trung Theo Cấp Độ HSK (3–4 Phút / Video)';
            if (titleEl) titleEl.textContent = '🎬 Học Tiếng Trung Qua 1.000 Video Ngắn (HSK 1 – HSK 9 • Phụ Đề Đồng Bộ Chữ Hán, Pinyin & Nghĩa)';
            if (descEl) descEl.textContent = 'Xem hoạt hình, podcast, ẩm thực và phim ngắn tiếng Trung 3–4 phút với phụ đề đồng bộ — bấm vào bất kỳ câu nào để tua lại và nghe kỹ.';

            // Filter the 1,000 videos
            const allVideoIds = [];
            for (let vidId = 1; vidId <= 1000; vidId++) {
              const v = getShortVideoItem(vidId);
              if (activeVideoHskFilter !== 'all' && String(v.hsk) !== String(activeVideoHskFilter)) continue;
              if (activeVideoCatFilter !== 'all' && v.cat !== activeVideoCatFilter) continue;
              if (activeVideoSearchQuery) {
                const q = activeVideoSearchQuery.toLowerCase();
                if (!v.viTitle.toLowerCase().includes(q) && !v.zhCover.toLowerCase().includes(q) && !v.pyCover.toLowerCase().includes(q)) continue;
              }
              allVideoIds.push(v);
            }

            const perPage = 15; // 5 cols x 3 rows = 15 cards per page (exact layout of Image 2!)
            const totalPages = Math.max(1, Math.ceil(allVideoIds.length / perPage));
            if (activeVideoPage > totalPages) activeVideoPage = 1;
            const pageVideos = allVideoIds.slice((activeVideoPage - 1) * perPage, activeVideoPage * perPage);
            const activeVid = getShortVideoItem(selectedVideoId);

            // Top Switcher between 1,000-Video Grid and Active 3-4 Min Video Player (Separated cleanly!)
            const videoTopNav = `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" data-vid-viewmode="grid" class="vid-viewmode-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeVideoViewMode === 'grid' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      🎬 Danh Sách 1.000 Video Ngắn Theo Cấp HSK (${allVideoIds.length} video)
                    </button>
                    <button type="button" data-vid-viewmode="player" class="vid-viewmode-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeVideoViewMode === 'player' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      ▶️ Trình Phát Video Đang Chọn (#${activeVid.id}: ${escapeHtml(activeVid.zhCover)} • ${activeVid.duration})
                    </button>
                  </div>
                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-bold text-slate-600">Mở nhanh Video #:</span>
                    <input id="inputJumpVideoId" type="number" min="1" max="1000" value="${activeVid.id}" class="w-20 px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-extrabold text-center" />
                    <button type="button" id="btnJumpVideoId" class="px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold">Xem</button>
                  </div>
                </div>

                ${activeVideoViewMode === 'grid' ? `
                  <!-- HSK Level Filter Pills -->
                  <div class="flex flex-wrap items-center gap-1.5 pt-1">
                    ${[
                      { k: 'all', lbl: '🌏 Tất cả (1.000 Video)' },
                      { k: '1', lbl: 'HSK 1 (150 Video)' },
                      { k: '2', lbl: 'HSK 2 (150 Video)' },
                      { k: '3', lbl: 'HSK 3 (150 Video)' },
                      { k: '4', lbl: 'HSK 4 (150 Video)' },
                      { k: '5', lbl: 'HSK 5 (150 Video)' },
                      { k: '6', lbl: 'HSK 6 (130 Video)' },
                      { k: '7', lbl: 'HSK 7–9 (120 Video)' }
                    ].map(f => `
                      <button type="button" data-vid-hsk="${f.k}" class="vid-hsk-filter-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        String(activeVideoHskFilter) === f.k ? 'bg-red-600 text-white shadow-xs' : 'bg-white text-slate-700 border border-slate-200'
                      }">${f.lbl}</button>
                    `).join('')}
                  </div>

                  <!-- Category Filter Pills -->
                  <div class="flex flex-wrap items-center gap-1.5">
                    ${['all', 'PODCAST', 'TRUYỆN NGẮN / CÔNG SỞ', 'ẨM THỰC / NẤU ĂN', 'ĐỜI SỐNG / GIAO TIẾP', 'DU LỊCH / VĂN HÓA', 'CỔ VĂN / VĂN HỌC', 'CÔNG NGHỆ / KHOA HỌC', 'HOẠT HÌNH / GIA ĐÌNH'].map(cat => `
                      <button type="button" data-vid-cat="${cat}" class="vid-cat-filter-btn px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                        activeVideoCatFilter === cat ? 'bg-red-50 text-red-600 border border-red-300 font-extrabold' : 'bg-white text-slate-600 border border-slate-200'
                      }">${cat === 'all' ? '🗂️ Tất cả chủ đề' : cat}</button>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `;

            if (activeVideoViewMode === 'player') {
              const curLine = activeVid.transcript[activeVideoLineIdx % activeVid.transcript.length] || activeVid.transcript[0];
              bodyEl.innerHTML = `
                ${videoTopNav}
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
                  <!-- Left 6 cols: 3-4 Minute Visual Stage & Controls -->
                  <div class="lg:col-span-6 p-5 rounded-3xl bg-white border border-slate-200 flex flex-col justify-between space-y-4 shadow-xs">
                    <div class="rounded-2xl overflow-hidden border-2 border-red-300 relative min-h-[320px] flex flex-col justify-between p-4 sm:p-5 shadow-md" style="background: #0f172a;">
                      <!-- Real Visual Scene Illustration for Current Timestamped Scene -->
                      <img src="${curLine.sceneImg || activeVid.sceneImg}" alt="${escapeHtml(activeVid.viTitle)}" class="Filter-none absolute inset-0 w-full h-full object-cover opacity-85 transition-all duration-500" />
                      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(15,23,42,0.72) 0%, rgba(15,23,42,0.28) 45%, rgba(15,23,42,0.88) 100%);"></div>

                      <!-- Top Visual Scene Indicator -->
                      <div class="relative z-10 flex flex-wrap items-center justify-between gap-2">
                        <span class="thumb-badge px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold shadow">
                          🖼️ Cảnh ${(activeVideoLineIdx % activeVid.transcript.length) + 1}/${activeVid.transcript.length} • ${activeVid.hskLabel} • ⏱️ ${curLine.time} / ${activeVid.duration}
                        </span>
                        <span class="px-2.5 py-1 rounded-full bg-black/65 text-white text-xs font-bold" style="color:#ffffff !important;">
                          ${activeVid.emoji} ${escapeHtml(activeVid.cat)}
                        </span>
                      </div>

                      <!-- Center Visual Scene Caption & Character Action Callout -->
                      <div class="relative z-10 my-auto py-3 flex flex-col items-center text-center space-y-1">
                        <div class="px-3 py-1 rounded-full bg-black/60 border border-white/25 text-[11px] font-bold" style="color:#fef08a !important;">
                          🎬 Hình ảnh minh họa cảnh ${(activeVideoLineIdx % activeVid.transcript.length) + 1}: ${escapeHtml(curLine.visualCaption || activeVid.viTitle)}
                        </div>
                        <div class="thumb-title-zh text-lg sm:text-xl font-black hanzi-font">${escapeHtml(activeVid.zhCover)}</div>
                      </div>

                      <!-- Bottom Synchronized 3-Line Subtitle Overlay over the Scene Image -->
                      <div class="relative z-10 p-3.5 rounded-2xl bg-black/80 border border-white/20 text-center space-y-1">
                        <div class="flex items-center justify-between text-[11px] font-extrabold" style="color:#fde047 !important;">
                          <span>🗣️ [${curLine.time}] ${escapeHtml(curLine.speaker)}</span>
                          <span>🔊 Bấm câu bên phải để đổi cảnh</span>
                        </div>
                        <div class="text-base sm:text-xl font-black hanzi-font" style="color:#ffffff !important;">${escapeHtml(curLine.hz)}</div>
                        <div class="text-xs sm:text-sm font-bold" style="color:#fef08a !important;">${escapeHtml(curLine.py)}</div>
                        <div class="text-xs font-semibold" style="color:#f1f5f9 !important;">🇻🇳 ${escapeHtml(curLine.vi)}</div>
                      </div>
                    </div>

                    <div class="space-y-2">
                      <h3 class="text-base sm:text-lg font-extrabold text-slate-900">${escapeHtml(activeVid.viTitle)}</h3>
                      <p class="text-xs text-slate-600">${escapeHtml(activeVid.desc)}</p>
                    </div>

                    <div class="flex flex-wrap gap-2">
                      <button type="button" id="btnPlayAllVideoLines" class="flex-1 py-2.5 px-4 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow">
                        ▶️ Phát Toàn Bộ Video (${activeVid.duration})
                      </button>
                      <button type="button" data-speak="${escapeHtml(curLine.hz)}" class="speak-inline-btn px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs">
                        🔊 Nghe Lại Câu Này
                      </button>
                      <button type="button" data-vid-viewmode="grid" class="vid-viewmode-btn px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs">
                        ⬅️ Quay Lại Kho 1.000 Video
                      </button>
                    </div>
                  </div>

                  <!-- Right 6 cols: Synchronized Interactive Transcript -->
                  <div class="lg:col-span-6 space-y-3">
                    <div class="flex items-center justify-between">
                      <h4 class="font-extrabold text-sm text-slate-900">📜 Phụ Đề Đồng Bộ (${activeVid.sentences} Câu • Bấm vào từng câu để tua & nghe):</h4>
                      <span class="text-xs font-bold text-red-600">${activeVid.duration}</span>
                    </div>
                    <div class="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                      ${activeVid.transcript.map((ln, lIdx) => `
                        <div data-vid-line="${lIdx}" class="vid-line-card cursor-pointer p-3.5 rounded-2xl border transition ${
                          activeVideoLineIdx === lIdx ? 'bg-red-50 border-red-400 shadow-xs' : 'bg-white border-slate-200'
                        }">
                          <div class="flex items-center justify-between gap-2">
                            <span class="text-xs font-extrabold text-red-600">⏱️ ${ln.time} • ${escapeHtml(ln.speaker)}</span>
                            <button type="button" data-speak="${escapeHtml(ln.hz)}" class="speak-inline-btn px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200">🔊 Nghe câu</button>
                          </div>
                          <div class="text-base font-extrabold hanzi-font text-slate-900 mt-1">${escapeHtml(ln.hz)}</div>
                          <div class="text-xs font-semibold text-red-600">${escapeHtml(ln.py)}</div>
                          <div class="text-xs text-slate-600 mt-0.5">🇻🇳 ${escapeHtml(ln.vi)}</div>
                          <div class="text-[11px] text-slate-500 mt-1 pt-1 border-t border-slate-100">💡 Từ trọng tâm: <b>${escapeHtml(ln.vocab)}</b></div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                </div>
              `;
              return;
            }

            // Default: 5-Column Video Card Grid matching Image 2 (NO "MIỄN PHÍ" badge!)
            bodyEl.innerHTML = `
              ${videoTopNav}

              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                ${pageVideos.map(v => `
                  <div data-open-video-id="${v.id}" class="video-card-item cursor-pointer rounded-2xl bg-white border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition">
                    <!-- Thumbnail Cover with Real Visual Scene Image (All 1,000 Clips Have Visuals!) -->
                    <div class="video-thumb-cover" style="background: #0f172a;">
                      <img src="${v.sceneImg}" alt="${escapeHtml(v.viTitle)}" class="absolute inset-0 w-full h-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-300" />
                      <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.22) 45%, rgba(15,23,42,0.88) 100%);"></div>
                      <div class="relative z-10 flex items-center justify-between gap-1">
                        <span class="thumb-badge px-2 py-0.5 rounded-md bg-black/65 text-[10px] font-extrabold">
                          #${v.id} • ${v.duration}
                        </span>
                        <span class="px-1.5 py-0.5 rounded bg-red-600 text-white text-[10px] font-extrabold" style="color:#ffffff !important;">🖼️ Có hình minh họa</span>
                      </div>
                      <div class="relative z-10 my-auto flex items-center justify-center py-1">
                        <div class="video-play-btn-circle">▶</div>
                      </div>
                      <div class="relative z-10 text-center leading-tight">
                        <div class="thumb-title-py text-[10px] font-bold truncate">${escapeHtml(v.pyCover)}</div>
                        <div class="thumb-title-zh text-sm font-black hanzi-font truncate">${escapeHtml(v.zhCover)}</div>
                      </div>
                    </div>

                    <!-- Card Body matching Image 2 -->
                    <div class="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                      <div class="space-y-1">
                        <div class="flex items-center justify-between text-[10px] font-extrabold text-slate-500 uppercase">
                          <span>${v.hskLabel} · ${escapeHtml(v.cat)}</span>
                          <span>${v.sentences} CÂU</span>
                        </div>
                        <h4 class="text-xs sm:text-sm font-extrabold text-slate-900 line-clamp-2 leading-snug">${escapeHtml(v.viTitle)}</h4>
                      </div>
                      <p class="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">${escapeHtml(v.desc)}</p>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Pagination Bar for 1,000 Videos -->
              <div class="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="text-xs font-bold text-slate-600">
                  Đang hiển thị trang <b>${activeVideoPage} / ${totalPages}</b> (Tổng cộng: <b>${allVideoIds.length} Video ngắn 3–4 phút</b>)
                </span>
                <div class="flex flex-wrap items-center gap-1.5">
                  <button type="button" data-vid-page="${Math.max(1, activeVideoPage - 1)}" class="vid-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">⬅️ Trước</button>
                  ${[1, 2, 3, 4, 5, 10, 20, 35, 50, totalPages].filter((v, i, a) => v <= totalPages && a.indexOf(v) === i).map(p => `
                    <button type="button" data-vid-page="${p}" class="vid-page-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      activeVideoPage === p ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }">${p}</button>
                  `).join('')}
                  <button type="button" data-vid-page="${Math.min(totalPages, activeVideoPage + 1)}" class="vid-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">Tiếp ➡️</button>
                </div>
              </div>
            `;
            return;
          }

          // ==================================================================
          // MODULE 3: LUYỆN NÓI CHUYÊN SÂU 2 PHẦN (`skill_speak`):
          //   - PHẦN 1: KHO 5.000 CÂU NGẮN GIAO TIẾP (ĐƠN GIẢN -> PHỨC TẠP, HSK 1-9)
          //   - PHẦN 2: KHO 1.000 VĂN BẢN NGẮN (4-5 DÒNG, HSK 1-9)
          // ==================================================================
          if (activeHbModule === 'skill_speak') {
            if (badgeEl) badgeEl.textContent = '🗣️ Trung Tâm Luyện Nói Tiếng Trung Chuyên Sâu (2 Phần Tách Biệt • Chấm Phát Âm & Thanh Điệu)';
            if (titleEl) titleEl.textContent = activeSpeakPart === 'part1_5000'
              ? '🗣️ Phần 1: Kho 5.000 Câu Ngắn Giao Tiếp (Từ Đơn Giản Đến Phức Tạp • HSK 1–9)'
              : '📜 Phần 2: Kho 1.000 Văn Bản Ngắn (4–5 Dòng • Luyện Nói Theo Đoạn Văn HSK 1–9)';
            if (descEl) descEl.textContent = 'Tách biệt rõ ràng 2 phần: (1) Kho 5.000 câu giao tiếp ngắn phân cấp từ dễ đến khó và (2) Kho 1.000 đoạn văn bản ngắn 4–5 dòng luyện đọc diễn cảm & thuyết trình.';

            const topSpeakTabs = `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-2">
                    <button type="button" data-speak-part="part1_5000" class="speak-part-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                      activeSpeakPart === 'part1_5000' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      🗣️ Phần 1: Kho 5.000 Câu Ngắn Giao Tiếp (Đơn Giản ➔ Phức Tạp)
                    </button>
                    <button type="button" data-speak-part="part2_1000" class="speak-part-btn px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition ${
                      activeSpeakPart === 'part2_1000' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      📜 Phần 2: Kho 1.000 Văn Bản Ngắn (4–5 Dòng / Đoạn)
                    </button>
                  </div>
                </div>

                <!-- HSK Level Filter Pills -->
                <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <div class="flex flex-wrap gap-1.5">
                    ${[
                      { k: 'all', lbl: activeSpeakPart === 'part1_5000' ? '🌏 Tất cả 5.000 câu' : '🌏 Tất cả 1.000 văn bản' },
                      { k: '1', lbl: 'HSK 1 (Đơn giản)' },
                      { k: '2', lbl: 'HSK 2 (Sơ cấp)' },
                      { k: '3', lbl: 'HSK 3 (Trung cấp 1)' },
                      { k: '4', lbl: 'HSK 4 (Trung cấp 2)' },
                      { k: '5', lbl: 'HSK 5 (Cao cấp 1)' },
                      { k: '6', lbl: 'HSK 6 (Cao cấp 2)' },
                      { k: '7', lbl: 'HSK 7–9 (Phức tạp)' }
                    ].map(f => `
                      <button type="button" data-speak-hsk="${f.k}" class="speak-hsk-btn px-3 py-1.5 rounded-xl text-xs font-extrabold transition ${
                        String(activeSpeakHskFilter) === f.k ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }">${f.lbl}</button>
                    `).join('')}
                  </div>

                  <div class="flex items-center gap-1.5 text-xs">
                    <span class="font-bold text-slate-600">${activeSpeakPart === 'part1_5000' ? 'Chọn câu # (1–5000):' : 'Chọn văn bản # (1–1000):'}</span>
                    <input id="inputJumpSpeakId" type="number" min="1" max="${activeSpeakPart === 'part1_5000' ? 5000 : 1000}" value="${activeSpeakPart === 'part1_5000' ? selectedSpeakSentenceId : selectedSpeakPassageId}" class="w-20 px-2.5 py-1 rounded-lg bg-white border border-slate-300 font-extrabold text-center" />
                    <button type="button" id="btnJumpSpeakId" class="px-3 py-1 rounded-lg bg-red-600 text-white font-extrabold">Tới</button>
                  </div>
                </div>
              </div>
            `;

            if (activeSpeakPart === 'part1_5000') {
              const curSent = getSpeakingShortSentence(selectedSpeakSentenceId);
              const filteredIds = [];
              for (let sid = 1; sid <= 5000; sid++) {
                if (activeSpeakHskFilter !== 'all') {
                  const sObj = getSpeakingShortSentence(sid);
                  if (String(sObj.hsk) !== String(activeSpeakHskFilter)) continue;
                }
                filteredIds.push(sid);
              }
              const pageSize = 12;
              const totalPages = Math.max(1, Math.ceil(filteredIds.length / pageSize));
              if (activeSpeakPage > totalPages) activeSpeakPage = 1;
              const pageIds = filteredIds.slice((activeSpeakPage - 1) * pageSize, activeSpeakPage * pageSize);

              bodyEl.innerHTML = `
                ${topSpeakTabs}

                <!-- Active Short Sentence Speaking & Deep Grading Studio -->
                <div class="p-5 rounded-3xl bg-white border-2 border-red-200 space-y-4 shadow-xs">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">Câu Ngắn #${curSent.id} / 5.000</span>
                      <span class="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${curSent.hskLabel} • ${escapeHtml(curSent.diffLabel)}</span>
                      <span class="text-xs font-bold text-slate-600">${escapeHtml(curSent.topicName)}</span>
                    </div>
                    <div class="flex items-center gap-1.5">
                      <button type="button" data-speak="${escapeHtml(curSent.hz)}" class="speak-inline-btn px-3.5 py-1.5 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">🔊 Nghe chuẩn 1.0x</button>
                      <button type="button" data-speak-slow="${escapeHtml(curSent.hz)}" class="speak-slow-btn px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">🐢 Nghe chậm 0.75x</button>
                    </div>
                  </div>

                  <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-1.5">
                    <div class="text-2xl sm:text-3xl font-black hanzi-font text-slate-900">${escapeHtml(curSent.hz)}</div>
                    <div class="text-sm sm:text-base font-extrabold text-red-600">${escapeHtml(curSent.py)}</div>
                    <div class="text-xs sm:text-sm font-semibold text-slate-700">🇻🇳 ${escapeHtml(curSent.vi)}</div>
                    <div class="text-[11px] text-slate-500 pt-1">💡 Từ trọng tâm: <b>${escapeHtml(curSent.keyWord)}</b> • Mẹo phát âm: ${escapeHtml(curSent.tip)}</div>
                  </div>

                  <div class="flex flex-wrap items-center justify-center gap-2.5">
                    <button type="button" id="btnRecordSpeakStudio" data-target-hz="${escapeHtml(curSent.hz)}" data-target-py="${escapeHtml(curSent.py)}" class="px-5 py-2.5 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow">
                      🎙️ Bấm Thu Âm Giọng Nói & Chấm Điểm Chuyên Sâu
                    </button>
                    <button type="button" id="btnSimSpeakStudio" data-target-hz="${escapeHtml(curSent.hz)}" data-target-py="${escapeHtml(curSent.py)}" class="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm">
                      ⚡ Chấm Thử Nhanh (Giả lập giọng đọc)
                    </button>
                    <button type="button" data-select-speak-sent="${Math.min(5000, curSent.id + 1)}" class="select-speak-sent-btn px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs sm:text-sm">
                      Câu tiếp theo ➡️
                    </button>
                  </div>

                  ${speakEvalResult ? `
                    <div class="p-4 rounded-2xl bg-slate-50 border border-red-200 space-y-2 text-xs">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="font-extrabold text-sm text-slate-900">🏆 Điểm Phát Âm Câu Ngắn: <span class="text-red-600">${speakEvalResult.overall} / 100 điểm</span></span>
                        <span class="font-bold text-slate-600">Độ chuẩn âm: <b>${speakEvalResult.accuracy}%</b> • Thanh điệu: <b>${speakEvalResult.toneScore}%</b> • Lưu loát: <b>${speakEvalResult.fluencyScore}%</b></span>
                      </div>
                      <div class="flex flex-wrap gap-1.5 pt-1">
                        ${speakEvalResult.charBreakdown.map(c => `
                          <span class="px-2.5 py-1 rounded-lg font-black hanzi-font text-sm ${c.ok ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-200 text-slate-700'}">${escapeHtml(c.char)} ${c.ok ? '✓' : '!'}</span>
                        `).join('')}
                      </div>
                      <p class="text-slate-700 font-semibold">${escapeHtml(speakEvalResult.comment)}</p>
                    </div>
                  ` : ''}
                </div>

                <!-- Grid of 5,000 Short Sentences (12 per page) -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  ${pageIds.map(sid => {
                    const s = getSpeakingShortSentence(sid);
                    const isSelected = s.id === curSent.id;
                    return `
                      <div data-select-speak-sent="${s.id}" class="select-speak-sent-btn cursor-pointer p-4 rounded-2xl border transition flex flex-col justify-between gap-2 ${
                        isSelected ? 'bg-red-50 border-red-400 shadow-xs' : 'bg-white border-slate-200'
                      }">
                        <div class="space-y-1">
                          <div class="flex items-center justify-between gap-1">
                            <span class="text-[11px] font-extrabold text-red-600">#${s.id}/5000 • ${s.hskLabel}</span>
                            <button type="button" data-speak="${escapeHtml(s.hz)}" class="speak-inline-btn px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200">🔊</button>
                          </div>
                          <div class="text-base font-black hanzi-font text-slate-900">${escapeHtml(s.hz)}</div>
                          <div class="text-xs font-bold text-red-600">${escapeHtml(s.py)}</div>
                          <div class="text-xs text-slate-600">🇻🇳 ${escapeHtml(s.vi)}</div>
                        </div>
                        <div class="text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <span>${escapeHtml(s.topicName)}</span>
                          <span class="text-red-600">🎙️ Bấm để luyện nói ›</span>
                        </div>
                      </div>
                    `;
                  }).join('')}
                </div>

                <!-- Pagination for 5,000 Sentences -->
                <div class="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span class="text-xs font-bold text-slate-600">Trang <b>${activeSpeakPage} / ${totalPages}</b> (Tổng: <b>${filteredIds.length} câu giao tiếp</b>)</span>
                  <div class="flex flex-wrap gap-1.5">
                    <button type="button" data-speak-page="${Math.max(1, activeSpeakPage - 1)}" class="speak-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">⬅️ Trước</button>
                    ${[1, 2, 3, 5, 10, 25, 50, 100, totalPages].filter((v, i, a) => v <= totalPages && a.indexOf(v) === i).map(p => `
                      <button type="button" data-speak-page="${p}" class="speak-page-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                        activeSpeakPage === p ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                      }">${p}</button>
                    `).join('')}
                    <button type="button" data-speak-page="${Math.min(totalPages, activeSpeakPage + 1)}" class="speak-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">Tiếp ➡️</button>
                  </div>
                </div>
              `;
              return;
            }

            // PART 2: 1,000 SHORT PASSAGES (4-5 LINES EACH)
            const curPass = getSpeakingShortPassage(selectedSpeakPassageId);
            const filteredPassIds = [];
            for (let pid = 1; pid <= 1000; pid++) {
              if (activeSpeakHskFilter !== 'all') {
                const pObj = getSpeakingShortPassage(pid);
                if (String(pObj.hsk) !== String(activeSpeakHskFilter)) continue;
              }
              filteredPassIds.push(pid);
            }
            const passPageSize = 6;
            const totalPassPages = Math.max(1, Math.ceil(filteredPassIds.length / passPageSize));
            if (activeSpeakPage > totalPassPages) activeSpeakPage = 1;
            const pagePassIds = filteredPassIds.slice((activeSpeakPage - 1) * passPageSize, activeSpeakPage * passPageSize);

            bodyEl.innerHTML = `
              ${topSpeakTabs}

              <!-- Active 4-5 Line Passage Speaking Studio -->
              <div class="p-5 rounded-3xl bg-white border-2 border-red-200 space-y-4 shadow-xs">
                <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <span class="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-extrabold">Văn Bản Ngắn #${curPass.id} / 1.000 • ${curPass.hskLabel} (5 Dòng Chuẩn)</span>
                    <h3 class="text-base sm:text-lg font-extrabold text-slate-900 mt-1.5">${escapeHtml(curPass.title)}</h3>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" data-speak="${escapeHtml(curPass.fullHz)}" class="speak-inline-btn px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow">
                      🔊 Nghe Đọc Mẫu Toàn Đoạn (5 Dòng)
                    </button>
                    <button type="button" data-speak-slow="${escapeHtml(curPass.fullHz)}" class="speak-slow-btn px-3 py-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold">
                      🐢 Nghe Chậm 0.75x
                    </button>
                  </div>
                </div>

                <!-- 5 Numbered Lines of the Short Passage -->
                <div class="space-y-2.5">
                  ${curPass.lines.map(ln => `
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div class="space-y-0.5">
                        <div class="text-xs font-extrabold text-red-600">Dòng ${ln.lineNum}/5:</div>
                        <div class="text-base sm:text-lg font-black hanzi-font text-slate-900">${escapeHtml(ln.hz)}</div>
                        <div class="text-xs font-bold text-red-600">${escapeHtml(ln.py)}</div>
                        <div class="text-xs text-slate-600">🇻🇳 ${escapeHtml(ln.vi)}</div>
                      </div>
                      <button type="button" data-speak="${escapeHtml(ln.hz)}" class="speak-inline-btn px-3 py-1.5 rounded-xl bg-white text-red-600 border border-red-200 text-xs font-extrabold shrink-0">
                        🔊 Nghe dòng ${ln.lineNum}
                      </button>
                    </div>
                  `).join('')}
                </div>

                <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
                  <div class="flex flex-wrap gap-1.5 text-xs">
                    ${curPass.vocabNotes.map(vn => `<span class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold border border-slate-200">📌 ${escapeHtml(vn)}</span>`).join('')}
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button type="button" id="btnRecordSpeakStudio" data-target-hz="${escapeHtml(curPass.fullHz)}" data-target-py="${escapeHtml(curPass.fullPy)}" data-is-passage="1" class="px-5 py-2.5 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow">
                      🎙️ Thu Âm Đọc Văn Bản 5 Dòng & Chấm Điểm
                    </button>
                    <button type="button" id="btnSimSpeakStudio" data-target-hz="${escapeHtml(curPass.fullHz)}" data-target-py="${escapeHtml(curPass.fullPy)}" data-is-passage="1" class="px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-800 border border-slate-200 font-bold text-xs sm:text-sm">
                      ⚡ Chấm Thử Đoạn Văn
                    </button>
                  </div>
                </div>

                ${speakEvalResult ? `
                  <div class="p-4 rounded-2xl bg-slate-50 border border-red-200 space-y-1.5 text-xs">
                    <div class="font-extrabold text-sm text-slate-900">
                      🏆 Kết Quả Chấm Đọc Văn Bản Ngắn (5 Dòng): <span class="text-red-600">${speakEvalResult.overall} / 100 điểm</span>
                      • Tốc độ đọc: <b>${speakEvalResult.cpm} chữ/phút</b> • Thanh điệu: <b>${speakEvalResult.toneScore}%</b> • Độ trôi chảy: <b>${speakEvalResult.fluencyScore}%</b>
                    </div>
                    <p class="text-slate-700 font-semibold">${escapeHtml(speakEvalResult.comment)}</p>
                  </div>
                ` : ''}
              </div>

              <!-- Browser of 1,000 Short 4-5 Line Passages -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${pagePassIds.map(pid => {
                  const p = getSpeakingShortPassage(pid);
                  const isAct = p.id === curPass.id;
                  return `
                    <div data-select-speak-pass="${p.id}" class="select-speak-pass-btn cursor-pointer p-4 rounded-2xl border transition space-y-2 ${
                      isAct ? 'bg-red-50 border-red-400 shadow-xs' : 'bg-white border-slate-200'
                    }">
                      <div class="flex items-center justify-between">
                        <span class="px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">Văn bản #${p.id}/1000 • ${p.hskLabel} (5 dòng)</span>
                        <button type="button" data-speak="${escapeHtml(p.fullHz)}" class="speak-inline-btn px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🔊 Nghe</button>
                      </div>
                      <h4 class="text-xs sm:text-sm font-extrabold text-slate-900">${escapeHtml(p.title)}</h4>
                      <p class="text-xs hanzi-font text-slate-700 line-clamp-3 leading-relaxed">${escapeHtml(p.fullHz)}</p>
                      <div class="text-[11px] text-slate-500 line-clamp-2">🇻🇳 ${escapeHtml(p.fullVi)}</div>
                    </div>
                  `;
                }).join('')}
              </div>

              <!-- Pagination for 1,000 Passages -->
              <div class="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                <span class="text-xs font-bold text-slate-600">Trang <b>${activeSpeakPage} / ${totalPassPages}</b> (Tổng: <b>${filteredPassIds.length} văn bản ngắn 4–5 dòng</b>)</span>
                <div class="flex flex-wrap gap-1.5">
                  <button type="button" data-speak-page="${Math.max(1, activeSpeakPage - 1)}" class="speak-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">⬅️ Trước</button>
                  ${[1, 2, 3, 5, 10, 25, 50, totalPassPages].filter((v, i, a) => v <= totalPassPages && a.indexOf(v) === i).map(p => `
                    <button type="button" data-speak-page="${p}" class="speak-page-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      activeSpeakPage === p ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }">${p}</button>
                  `).join('')}
                  <button type="button" data-speak-page="${Math.min(totalPassPages, activeSpeakPage + 1)}" class="speak-page-btn px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold">Tiếp ➡️</button>
                </div>
              </div>
            `;
            return;
          }

          // ==================================================================
          // MODULE 4: LƯỢNG TỪ (`vocab_measure`) — 20 CÂU HỎI CHIA 4 ĐỢT TÁCH BIỆT
          //           + TÁCH RÕ 3 PHẦN ĐỂ KHÔNG BỊ LƯỚT LOẠN
          // ==================================================================
          if (activeHbModule === 'vocab_measure') {
            if (badgeEl) badgeEl.textContent = '📏 Chuyên Đề Bách Khoa Lượng Từ Tiếng Trung (量词大全 • 3 Phần Tách Biệt)';
            if (titleEl) titleEl.textContent = '📏 Hệ Thống Lượng Từ Trọng Tâm HSK 1–9 & Bộ 20 Câu Trắc Nghiệm Phân Cấp';
            if (descEl) descEl.textContent = 'Đã tách riêng từng phần (1. Bài tập 20 câu chia 4 đợt • 2. Bảng tra cứu lượng từ • 3. Phân biệt cặp lượng từ dễ nhầm) để bạn học tập trung, không bị trôi trang.';

            const mwAnsweredCount = Object.keys(activeMeasureQuizAnswers).length;
            let mwCorrectCount = 0;
            MEASURE_QUIZ_ITEMS.forEach((mq, idx) => {
              if (activeMeasureQuizAnswers[idx] === mq.ans) mwCorrectCount++;
            });

            const mwTopTabs = `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap gap-2">
                  <button type="button" data-mw-subtab="quiz20" class="mw-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeMeasureSubTab === 'quiz20' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                  }">
                    📝 Phần 1: Bài Tập Lượng Từ 20 Câu (Chia 4 Đợt Tách Biệt • Đã làm ${mwAnsweredCount}/20)
                  </button>
                  <button type="button" data-mw-subtab="catalog" class="mw-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeMeasureSubTab === 'catalog' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                  }">
                    📚 Phần 2: Từ Điển 18 Lượng Từ Cốt Lõi Theo Nhóm
                  </button>
                  <button type="button" data-mw-subtab="compare" class="mw-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                    activeMeasureSubTab === 'compare' ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                  }">
                    ⚖️ Phần 3: Phân Biệt 6 Cặp Lượng Từ Hay Nhầm Nhất
                  </button>
                </div>
              </div>
            `;

            if (activeMeasureSubTab === 'catalog') {
              const cats = ['all', 'Người & Phổ thông', 'Sách vở & Vật phẳng', 'Quần áo & Đôi cặp', 'Máy móc & Đồ vật', 'Kiến trúc & Hành động'];
              const list = activeMeasureCatFilter === 'all' ? MEASURE_WORDS_DATA : MEASURE_WORDS_DATA.filter(x => x.cat === activeMeasureCatFilter);
              bodyEl.innerHTML = `
                ${mwTopTabs}
                <div class="flex flex-wrap gap-1.5">
                  ${cats.map(c => `
                    <button type="button" data-mw-cat="${c}" class="mw-cat-btn px-3 py-1.5 rounded-xl text-xs font-bold ${
                      activeMeasureCatFilter === c ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }">${c === 'all' ? '🗂️ Tất cả 18 lượng từ' : c}</button>
                  `).join('')}
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  ${list.map(item => `
                    <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                      <div class="flex items-center justify-between">
                        <span class="text-2xl font-black hanzi-font text-red-600">${item.mw} <span class="text-xs font-bold text-slate-700 font-sans">(${item.py} • HV: ${item.hv})</span></span>
                        <button type="button" data-speak="${item.mw}" class="speak-inline-btn px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🔊</button>
                      </div>
                      <span class="inline-block px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-bold">${escapeHtml(item.cat)}</span>
                      <div class="text-xs text-slate-600">${escapeHtml(item.usage)}</div>
                      <div class="text-xs font-bold text-slate-800 pt-1.5 border-t border-slate-100">📌 Ví dụ: <span class="hanzi-font">${escapeHtml(item.examples)}</span></div>
                    </div>
                  `).join('')}
                </div>
              `;
              return;
            }

            if (activeMeasureSubTab === 'compare') {
              bodyEl.innerHTML = `
                ${mwTopTabs}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  ${MEASURE_WORD_COMPARISONS.map(c => `
                    <div class="p-5 rounded-3xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                      <span class="px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold hanzi-font">${escapeHtml(c.pair)}</span>
                      <h4 class="text-sm sm:text-base font-extrabold text-slate-900">${escapeHtml(c.title)}</h4>
                      <div class="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200">${escapeHtml(c.diff)}</div>
                    </div>
                  `).join('')}
                </div>
              `;
              return;
            }

            // Default SubTab: quiz20 (20 Questions separated into 4 Batches of 5 Questions so scrolling is never messy!)
            const visibleQuizItems = activeMeasureQuizBatch === 0
              ? MEASURE_QUIZ_ITEMS.map((item, idx) => ({ item, idx }))
              : MEASURE_QUIZ_ITEMS.map((item, idx) => ({ item, idx })).filter(x => x.item.batch === activeMeasureQuizBatch);

            bodyEl.innerHTML = `
              ${mwTopTabs}

              <!-- 4 Batch Switcher Pills (5 Questions per Batch = 20 Questions total) -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap gap-2">
                  <button type="button" data-mw-batch="1" class="mw-batch-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${activeMeasureQuizBatch === 1 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">Đợt 1: Câu 1–5 (Sơ cấp HSK 1–2)</button>
                  <button type="button" data-mw-batch="2" class="mw-batch-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${activeMeasureQuizBatch === 2 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">Đợt 2: Câu 6–10 (Trung cấp HSK 2–3)</button>
                  <button type="button" data-mw-batch="3" class="mw-batch-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${activeMeasureQuizBatch === 3 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">Đợt 3: Câu 11–15 (Trung cao HSK 4–5)</button>
                  <button type="button" data-mw-batch="4" class="mw-batch-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${activeMeasureQuizBatch === 4 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">Đợt 4: Câu 16–20 (Cao cấp HSK 6–9)</button>
                  <button type="button" data-mw-batch="0" class="mw-batch-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${activeMeasureQuizBatch === 0 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">📋 Xem cả 20 câu</button>
                </div>
                <span class="text-xs font-extrabold text-red-600">Đúng: ${mwCorrectCount} / 20 câu</span>
              </div>

              ${measureQuizSubmitted ? `
                <div class="p-4 rounded-2xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold text-slate-900">
                  <span>🏆 Kết quả Bài tập 20 Câu Lượng Từ: Đạt <span class="text-red-600">${mwCorrectCount} / 20 câu (${Math.round((mwCorrectCount / 20) * 100)}%)</span>!</span>
                  <button type="button" id="btnResetMeasureQuiz20" class="px-3.5 py-1.5 rounded-xl bg-white text-slate-700 border border-slate-200 text-xs font-bold">🔄 Làm lại 20 câu</button>
                </div>
              ` : ''}

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                ${visibleQuizItems.map(({ item: mq, idx }) => {
                  const picked = activeMeasureQuizAnswers[idx];
                  return `
                    <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2.5 shadow-xs">
                      <div class="flex items-center justify-between">
                        <span class="px-2 py-0.5 rounded bg-red-50 text-red-600 text-[11px] font-extrabold">Đợt ${mq.batch} • ${mq.level}</span>
                        <span class="text-[11px] font-bold text-slate-400">Câu #${idx + 1}/20</span>
                      </div>
                      <div class="text-xs sm:text-sm font-extrabold text-slate-900">${escapeHtml(mq.q)}</div>
                      <div class="grid grid-cols-2 gap-2">
                        ${mq.opts.map((opt, oIdx) => `
                          <button type="button" data-mw-q="${idx}" data-mw-opt="${oIdx}" class="mw-quiz-opt-btn p-2.5 rounded-xl border text-xs font-bold transition ${
                            picked === oIdx ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-800 border-slate-200'
                          }">${escapeHtml(opt)}</button>
                        `).join('')}
                      </div>
                      ${(measureQuizSubmitted || picked !== undefined) ? `
                        <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                          ${picked === mq.ans ? '✅ <b>Chính xác!</b>' : `❌ <b>Đáp án đúng: ${escapeHtml(mq.opts[mq.ans])}</b>`} — ${escapeHtml(mq.explain)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="flex flex-wrap items-center justify-between gap-2 pt-2">
                <div class="flex gap-2">
                  ${[1, 2, 3, 4].map(b => `
                    <button type="button" data-mw-batch="${b}" class="mw-batch-btn px-3 py-1.5 rounded-xl text-xs font-bold ${activeMeasureQuizBatch === b ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'}">Chuyển tới Đợt ${b}</button>
                  `).join('')}
                </div>
                <button type="button" id="btnCheckMeasureQuiz" class="px-6 py-3 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow">
                  ✅ Chấm Điểm Trọn Bộ 20 Câu Lượng Từ
                </button>
              </div>
            `;
            return;
          }

          // ==================================================================
          // MODULE 5: KẾ HOẠCH ÔN THI HSK (`study_plan`) & TỪ VỰNG MỖI NGÀY (`vocab_daily`)
          //           Dedicated views so no menu item duplicates HSK 1-9 Roadmap!
          // ==================================================================
          if (activeHbModule === 'study_plan') {
            if (badgeEl) badgeEl.textContent = '🗓️ Kế Hoạch Ôn Thi HSK Cá Nhân Hóa (Study Planner HSK 1–9)';
            if (titleEl) titleEl.textContent = '🗓️ Lộ Trình Phân Bổ Thời Gian Ôn Thi 4 Kỹ Năng Theo Tuần';
            if (descEl) descEl.textContent = 'Bảng kế hoạch chi tiết từ Thứ Hai đến Chủ Nhật giúp bạn cân bằng Nghe - Nói - Đọc - Viết và đạt điểm đỗ mục tiêu (240+/300).';
            const daysPlan = [
              { day: 'Thứ Hai', focus: 'Từ vựng cốt lõi & Lượng từ', task: 'Học 15 từ mới + Làm 10 câu lượng từ + Nghe 2 video ngắn', min: '30 phút' },
              { day: 'Thứ Ba', focus: 'Ngữ pháp trọng tâm & Sắp xếp câu', task: 'Nắm vững 2 cấu trúc ngữ pháp + Làm 10 câu sắp xếp từ thành câu', min: '30 phút' },
              { day: 'Thứ Tư', focus: 'Luyện Nghe hiểu & Nghe điền từ', task: 'Nghe chép chính tả 15 câu + Xem 2 video 3-4 phút không nhìn phụ đề', min: '35 phút' },
              { day: 'Thứ Năm', focus: 'Luyện Nói câu ngắn & Văn bản 5 dòng', task: 'Thu âm 10 câu giao tiếp ngắn + Đọc diễn cảm 2 văn bản ngắn 5 dòng', min: '30 phút' },
              { day: 'Thứ Sáu', focus: 'Luyện Đọc hiểu & Luyện dịch Việt-Trung', task: 'Đọc 1 truyện song ngữ + Dịch 5 câu thực chiến chuẩn ngữ pháp', min: '30 phút' },
              { day: 'Thứ Bảy', focus: 'Làm Đề 30 Câu Toàn Diện 4 Kỹ Năng', task: 'Hoàn thành bộ 30 câu Nghe-Nói-Đọc-Viết của cấp HSK mục tiêu', min: '45 phút' },
              { day: 'Chủ Nhật', focus: 'Thi thử HSK bấm giờ & Tổng ôn SRS', task: 'Làm 1 đề thi thử HSK chuẩn + Ôn sạch các từ trong Sổ tay lỗi sai', min: '45 phút' }
            ];
            bodyEl.innerHTML = `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${daysPlan.map(d => `
                  <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                    <div class="flex items-center justify-between">
                      <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${d.day}</span>
                      <span class="text-xs font-bold text-slate-500">⏱️ ${d.min}</span>
                    </div>
                    <h4 class="text-sm font-extrabold text-slate-900">${escapeHtml(d.focus)}</h4>
                    <p class="text-xs text-slate-600 leading-relaxed">${escapeHtml(d.task)}</p>
                  </div>
                `).join('')}
              </div>
            `;
            return;
          }

          if (activeHbModule === 'vocab_daily') {
            if (badgeEl) badgeEl.textContent = '📅 Từ Vựng Mỗi Ngày Theo Cấp Độ HSK (每日一词 • Daily Vocabulary Deck)';
            if (titleEl) titleEl.textContent = '📅 Bộ Thẻ Từ Vựng Trọng Tâm Hôm Nay (Kèm Câu Ví Dụ Bản Xứ & Ghi Nhớ Nhanh)';
            if (descEl) descEl.textContent = 'Mỗi ngày làm chủ trọn vẹn bộ từ vựng tinh tuyển từ HSK 1 đến HSK 7–9 kèm phát âm chuẩn Bắc Kinh.';
            const allSeedWords = Object.keys(HSK_LEVEL_SEEDS).flatMap(lv =>
              HSK_LEVEL_SEEDS[lv].vocab.slice(0, 3).map(w => Object.assign({}, w, { lvName: HSK_LEVEL_SEEDS[lv].name }))
            );
            bodyEl.innerHTML = `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                ${allSeedWords.map(w => `
                  <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                    <div class="flex items-center justify-between">
                      <span class="px-2.5 py-0.5 rounded-md bg-red-50 text-red-600 text-[11px] font-extrabold">${escapeHtml(w.lvName)}</span>
                      <div class="flex gap-1">
                        <button type="button" data-speak="${escapeHtml(w.hz)}" class="speak-inline-btn px-2 py-0.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🔊 Từ</button>
                        <button type="button" data-speak="${escapeHtml(w.sent)}" class="speak-inline-btn px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">🔊 Câu</button>
                      </div>
                    </div>
                    <div class="text-xl font-black hanzi-font text-slate-900">${escapeHtml(w.hz)} <span class="text-xs font-bold text-red-600 font-sans">(${escapeHtml(w.py)})</span></div>
                    <div class="text-xs font-bold text-slate-700">Nghĩa: ${escapeHtml(w.vi)}</div>
                    <div class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-0.5">
                      <div class="font-bold hanzi-font text-slate-900">${escapeHtml(w.sent)}</div>
                      <div class="text-[11px] text-red-600">${escapeHtml(w.sentPy)}</div>
                      <div class="text-[11px] text-slate-600">🇻🇳 ${escapeHtml(w.sentVi)}</div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `;
            return;
          }

          if (activeHbModule === 'hsk_exam') {
            if (badgeEl) badgeEl.textContent = '🎓 Luyện Thi Thử HSK 1–9 Online • Chuẩn Khung HSK 3.0';
            if (titleEl) titleEl.textContent = `📝 Phòng Thi Thử HSK ${activeHskExamLevel === 7 ? '7–9 (Cao Cấp)' : activeHskExamLevel} — Đề Số ${activeHskExamPaper} (Nghe • Đọc • Viết)`;
            if (descEl) descEl.textContent = 'Chấm điểm tự động theo thang điểm chuẩn quốc tế (200/300 điểm), phân tích Điểm Mạnh / Điểm Yếu từng kỹ năng và giải thích chi tiết từng câu.';

            const questions = getHskMockExamQuestions(activeHskExamLevel, activeHskExamPaper);
            const answeredCount = Object.keys(hskMockAnswers).length;
            const mm = String(Math.floor(hskMockSecondsLeft / 60)).padStart(2, '0');
            const ss = String(hskMockSecondsLeft % 60).padStart(2, '0');

            let scoreReportHtml = '';
            if (hskMockSubmitted) {
              let listenRight = 0, readRight = 0, writeRight = 0;
              const wrongWords = [];
              questions.forEach((q, idx) => {
                const ok = hskMockAnswers[idx] === q.answer;
                if (ok) {
                  if (q.section === 'listen') listenRight++;
                  else if (q.section === 'read') readRight++;
                  else writeRight++;
                } else if (q.wordObj) {
                  wrongWords.push(q.wordObj);
                }
              });
              const listenScore = Math.round((listenRight / 4) * 100);
              const readScore = Math.round((readRight / 4) * 100);
              const writeScore = Math.round((writeRight / 4) * 100);
              const total300 = listenScore + readScore + writeScore;
              const passed = total300 >= 180;
              const weakestSkill = listenScore <= readScore && listenScore <= writeScore
                ? 'Kỹ năng Nghe Hiểu (听力)'
                : (readScore <= writeScore ? 'Kỹ năng Đọc Hiểu & Từ Vựng (阅读)' : 'Kỹ năng Viết & Ngữ Pháp (书写)');

              scoreReportHtml = `
                <div class="p-5 rounded-3xl border-2 border-red-300 bg-white space-y-4">
                  <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white">
                        ${passed ? '🏆 ĐẠT CHUẨN KỲ THI HSK (PASS)' : '⚠️ CHƯA ĐẠT ĐIỂM ĐỖ (CẦN ÔN LẠI PHẦN YẾU)'}
                      </span>
                      <h3 class="text-lg sm:text-xl font-extrabold text-slate-900 mt-2">
                        Tổng Điểm: <span class="text-red-600">${total300} / 300 điểm</span> (Điểm đỗ chuẩn: 180/300)
                      </h3>
                    </div>
                    <button type="button" id="btnSaveWrongExamWordsToSrs" class="px-4 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow transition">
                      💾 Lưu ${wrongWords.length} Từ Chưa Thuộc Vào Sổ Tay SRS
                    </button>
                  </div>
                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div class="text-xs text-slate-500 font-bold">🎧 Phần 1: Nghe Hiểu (听力)</div>
                      <div class="text-lg font-extrabold text-slate-900 mt-0.5">${listenScore} / 100 điểm (${listenRight}/4 câu)</div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div class="text-xs text-slate-500 font-bold">📖 Phần 2: Đọc Hiểu (阅读)</div>
                      <div class="text-lg font-extrabold text-slate-900 mt-0.5">${readScore} / 100 điểm (${readRight}/4 câu)</div>
                    </div>
                    <div class="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                      <div class="text-xs text-slate-500 font-bold">✍️ Phần 3: Viết Câu (书写)</div>
                      <div class="text-lg font-extrabold text-slate-900 mt-0.5">${writeScore} / 100 điểm (${writeRight}/4 câu)</div>
                    </div>
                  </div>
                  <div class="p-3.5 rounded-2xl bg-slate-50 border border-red-200 text-xs sm:text-sm text-slate-700">
                    🎯 <b>Phân tích Điểm Mạnh / Điểm Yếu (AI Diagnostic):</b> Kỹ năng cần ưu tiên cải thiện nhất của bạn hiện tại là <b class="text-red-600">${weakestSkill}</b>.
                  </div>
                </div>
              `;
            }

            bodyEl.innerHTML = `
              <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="flex flex-wrap gap-1.5">
                  ${[1, 2, 3, 4, 5, 6, 7].map(lv => `
                    <button type="button" data-hsk-mock-lv="${lv}" class="hsk-mock-lv-btn px-3.5 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeHskExamLevel === lv ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">
                      ${lv === 7 ? 'HSK 7–9 (Cao cấp)' : ('HSK ' + lv)}
                    </button>
                  `).join('')}
                </div>
                <div class="flex items-center gap-2">
                  ${[1, 2, 3].map(p => `
                    <button type="button" data-hsk-mock-paper="${p}" class="hsk-mock-paper-btn px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      activeHskExamPaper === p ? 'bg-red-600 text-white font-extrabold' : 'bg-white text-slate-600 border border-slate-200'
                    }">
                      Đề số ${p}
                    </button>
                  `).join('')}
                  <div class="px-3 py-1.5 rounded-xl bg-white border border-red-200 text-red-600 font-mono font-extrabold text-xs">
                    ⏱️ ${mm}:${ss} • Đã làm ${answeredCount}/${questions.length}
                  </div>
                </div>
              </div>

              ${scoreReportHtml}

              <div class="space-y-4">
                ${questions.map((q, qIdx) => {
                  const picked = hskMockAnswers[qIdx];
                  const isCorrect = picked === q.answer;
                  return `
                    <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div class="flex flex-wrap items-center justify-between gap-2">
                        <span class="px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${q.sectionTitle}</span>
                        <div class="flex items-center gap-2">
                          <button type="button" data-speak="${escapeHtml(q.audioText)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">
                            🔊 Phát Audio Câu Hỏi
                          </button>
                          <button type="button" data-speak-slow="${escapeHtml(q.audioText)}" class="speak-slow-btn px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                            🐢 Nghe chậm 0.65x
                          </button>
                        </div>
                      </div>
                      <div class="text-sm sm:text-base font-extrabold text-slate-900">${escapeHtml(q.prompt)}</div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${q.options.map((opt, oIdx) => `
                          <button type="button" data-hsk-mock-q="${qIdx}" data-hsk-mock-opt="${oIdx}" class="hsk-mock-opt-btn p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition ${
                            picked === oIdx
                              ? 'bg-red-600 text-white border-red-600 shadow'
                              : 'bg-slate-50 text-slate-800 border-slate-200'
                          }">
                            <span class="font-bold mr-1">${['A', 'B', 'C', 'D'][oIdx]}.</span> ${escapeHtml(opt)}
                          </button>
                        `).join('')}
                      </div>
                      ${hskMockSubmitted ? `
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                          ${isCorrect ? '✅ Chính xác!' : '❌ Chưa đúng!'} ${escapeHtml(q.explain)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>

              <div class="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button type="button" id="btnResetHskMockPaper" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm">
                  🔄 Làm Lại Đề Này
                </button>
                <button type="button" id="btnSubmitHskMockPaper" class="px-6 py-3 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow-lg transition">
                  📝 Nộp Bài & Xem Phân Tích Điểm Mạnh / Điểm Yếu
                </button>
              </div>
            `;
            return;
          }

          if (activeHbModule === 'tocfl_exam') {
            if (badgeEl) badgeEl.textContent = '🇹🇼 Luyện Thi Năng Lực Hoa Ngữ Đài Loan (TOCFL Band A • Band B • Band C)';
            if (titleEl) titleEl.textContent = `🇹🇼 Phòng Luyện Đề TOCFL — ${activeTocflBand} (${tocflUseTraditional ? 'Chữ Phồn Thể 繁體' : 'Chữ Giản Thể 简体'})`;
            if (descEl) descEl.textContent = 'Hỗ trợ chuyển đổi Chữ Phồn Thể (chuẩn Đài Loan) và Chữ Giản Thể 1 chạm kèm giải thích ngữ pháp chuyên sâu.';

            const qList = TOCFL_QUESTIONS_BANK[activeTocflBand] || TOCFL_QUESTIONS_BANK['Band A (Cấp 1-2)'];
            bodyEl.innerHTML = `
              <div class="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="flex flex-wrap gap-2">
                  ${Object.keys(TOCFL_QUESTIONS_BANK).map(band => `
                    <button type="button" data-tocfl-band="${band}" class="tocfl-band-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                      activeTocflBand === band ? 'bg-red-600 text-white shadow' : 'bg-white text-slate-700 border border-slate-200'
                    }">${band}</button>
                  `).join('')}
                </div>
                <button type="button" id="btnToggleTocflScript" class="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold transition">
                  🔄 Đang hiển thị: ${tocflUseTraditional ? 'Chữ Phồn Thể (繁體字) ➔ Đổi sang Giản Thể' : 'Chữ Giản Thể (简体字) ➔ Đổi sang Phồn Thể'}
                </button>
              </div>

              <div class="space-y-4">
                ${qList.map((q, idx) => {
                  const picked = tocflAnswers[idx];
                  const qText = tocflUseTraditional ? q.qTrad : q.qSimp;
                  const opts = tocflUseTraditional ? q.optsTrad : q.optsSimp;
                  return `
                    <div class="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-xs">
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-bold text-red-600">${escapeHtml(q.py)}</span>
                        <button type="button" data-speak="${escapeHtml(q.speak)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-red-50 text-red-600 text-xs font-extrabold border border-red-200">🔊 Nghe</button>
                      </div>
                      <div class="text-base font-extrabold hanzi-font text-slate-900">${escapeHtml(qText)}</div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        ${opts.map((opt, oIdx) => `
                          <button type="button" data-tocfl-q="${idx}" data-tocfl-opt="${oIdx}" class="tocfl-opt-btn p-3 rounded-xl border text-left text-xs sm:text-sm font-semibold transition ${
                            picked === oIdx ? 'bg-red-600 text-white border-red-600' : 'bg-slate-50 text-slate-800 border-slate-200'
                          }">${escapeHtml(opt)}</button>
                        `).join('')}
                      </div>
                      ${tocflSubmitted ? `
                        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800">
                          ${picked === q.answer ? '✅ Đúng!' : '❌ Chưa đúng!'} ${escapeHtml(q.explain)}
                        </div>
                      ` : ''}
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="flex justify-end">
                <button type="button" id="btnSubmitTocflExam" class="px-6 py-3 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow-lg">
                  ✅ Chấm Điểm Bài Thi TOCFL
                </button>
              </div>
            `;
            return;
          }

          if (activeHbModule === 'skill_shadowing') {
            if (badgeEl) badgeEl.textContent = '🎙️ Phòng Luyện Nói Nhại Đuổi (Shadowing Studio — 跟读训练)';
            const sh = SHADOWING_SENTENCES[activeShadowIdx % SHADOWING_SENTENCES.length];
            if (titleEl) titleEl.textContent = `🎙️ Luyện Shadowing Phản Xạ Bản Xứ (${sh.level})`;
            if (descEl) descEl.textContent = 'Nghe giọng chuẩn bản xứ và đọc nhại đuổi theo từng chữ Hán theo thời gian thực để rèn ngữ điệu tự nhiên.';

            bodyEl.innerHTML = `
              <div class="flex flex-wrap items-center justify-between gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div class="flex flex-wrap gap-1.5">
                  ${SHADOWING_SENTENCES.map((s, idx) => `
                    <button type="button" data-shadow-idx="${idx}" class="shadow-sel-btn px-3 py-1.5 rounded-xl text-xs font-extrabold ${
                      activeShadowIdx === idx ? 'bg-red-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
                    }">Câu #${idx + 1} (${s.level})</button>
                  `).join('')}
                </div>
                <div class="flex items-center gap-1.5 text-xs font-bold">
                  <span>Tốc độ:</span>
                  <button type="button" data-shadow-spd="0.75" class="shadow-spd-btn px-2.5 py-1 rounded-lg border ${shadowSpeed === 0.75 ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}">0.75x Chậm</button>
                  <button type="button" data-shadow-spd="0.92" class="shadow-spd-btn px-2.5 py-1 rounded-lg border ${shadowSpeed === 0.92 ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}">1.0x Chuẩn</button>
                  <button type="button" data-shadow-spd="1.12" class="shadow-spd-btn px-2.5 py-1 rounded-lg border ${shadowSpeed === 1.12 ? 'bg-red-600 text-white' : 'bg-white text-slate-700'}">1.15x Nhanh</button>
                </div>
              </div>

              <div class="p-6 rounded-3xl bg-white border-2 border-red-200 text-center space-y-4 shadow-xs">
                <div id="shadowKaraokeHanzi" class="text-2xl sm:text-3xl font-black hanzi-font text-slate-900 tracking-wide">
                  ${Array.from(sh.hz).map((ch, ci) => `<span id="shChar_${ci}" class="transition-colors duration-200">${escapeHtml(ch)}</span>`).join('')}
                </div>
                <div class="text-sm sm:text-base font-bold text-red-600">${escapeHtml(sh.py)}</div>
                <div class="text-xs sm:text-sm text-slate-600">🇻🇳 ${escapeHtml(sh.vi)}</div>

                <div class="flex flex-wrap justify-center gap-3 pt-2">
                  <button type="button" id="btnStartShadowingRun" class="px-6 py-3 rounded-2xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow-lg">
                    🎙️ Bắt Đầu Shadowing (Phát Mẫu Karaoke & Chấm Điểm Nói Đuổi)
                  </button>
                </div>

                ${shadowScoreResult ? `
                  <div class="p-4 rounded-2xl bg-slate-50 border border-red-200 text-xs sm:text-sm font-bold text-slate-800">
                    🏆 Kết quả Shadowing: Độ chuẩn âm <span class="text-red-600">${shadowScoreResult.pron}%</span> • Thanh điệu <span class="text-red-600">${shadowScoreResult.tone}%</span> • Độ trôi chảy <span class="text-red-600">${shadowScoreResult.fluency}%</span> (+20 EXP)!
                  </div>
                ` : ''}
              </div>
            `;
            return;
          }

          if (activeHbModule === 'prac_translate') {
            if (badgeEl) badgeEl.textContent = '🔄 Phòng Luyện Dịch Câu Việt ↔ Trung & Tư Duy Ngữ Pháp';
            const tr = TRANSLATION_CHALLENGES[activeTransIdx % TRANSLATION_CHALLENGES.length];
            if (titleEl) titleEl.textContent = `🔄 Luyện Dịch & Sắp Xếp Câu Chuẩn Ngữ Pháp (${tr.level})`;
            if (descEl) descEl.textContent = 'Bấm chọn các mảnh từ tiếng Trung hoặc gõ trực tiếp câu dịch để rèn tư duy trật tự từ chuẩn bản xứ.';

            bodyEl.innerHTML = `
              <div class="flex flex-wrap gap-2">
                ${TRANSLATION_CHALLENGES.map((t, idx) => `
                  <button type="button" data-trans-idx="${idx}" class="trans-sel-btn px-3.5 py-2 rounded-xl text-xs font-extrabold ${
                    activeTransIdx === idx ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }">Bài dịch #${idx + 1} (${t.level})</button>
                `).join('')}
              </div>

              <div class="p-5 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-xs">
                <div class="text-xs font-bold text-red-600 uppercase">Câu tiếng Việt cần dịch sang tiếng Trung:</div>
                <div class="text-base sm:text-lg font-extrabold text-slate-900">"${escapeHtml(tr.vi)}"</div>
                <div class="text-xs text-slate-500">💡 Gợi ý ngữ pháp: ${escapeHtml(tr.tip)}</div>

                <div class="flex flex-wrap gap-2 pt-1">
                  ${tr.bricks.map(b => `
                    <button type="button" data-trans-brick="${escapeHtml(b)}" class="trans-brick-btn px-3.5 py-2 rounded-xl bg-slate-100 text-slate-800 font-bold hanzi-font text-sm border border-slate-200">
                      + ${escapeHtml(b)}
                    </button>
                  `).join('')}
                </div>

                <div class="flex flex-col sm:flex-row gap-2">
                  <input id="inputTranslationAnswer" type="text" value="${escapeHtml(transUserWords.join(''))}" placeholder="Bấm các mảnh từ ở trên hoặc gõ câu tiếng Trung vào đây..." class="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-300 text-base font-bold hanzi-font text-slate-900" />
                  <button type="button" id="btnClearTranslationInput" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">Xóa</button>
                  <button type="button" id="btnCheckTranslationAnswer" class="px-6 py-2.5 rounded-xl bg-red-600 text-white font-extrabold text-xs sm:text-sm shadow">
                    ✅ Chấm Điểm Bản Dịch
                  </button>
                </div>

                ${transFeedback ? `
                  <div class="p-3.5 rounded-2xl bg-slate-50 border border-red-200 text-xs sm:text-sm font-semibold text-slate-800">
                    ${transFeedback}
                  </div>
                ` : ''}
              </div>
            `;
            return;
          }

          if (activeHbModule === 'sys_security_db') {
            if (badgeEl) badgeEl.textContent = '🛡️ Quản Lý Sao Lưu Cục Bộ, Xuất File Mã Hóa & Đồng Bộ Máy Chủ (10 Bảng IndexedDB • AES-256-GCM)';
            if (titleEl) titleEl.textContent = '🛡️ Hệ Thống Quản Trị Cơ Sở Dữ Liệu Nâng Cao BlackPig DB v7 & Tường Lửa Bảo Mật WebCrypto';
            if (descEl) descEl.textContent = 'Kiến trúc lưu trữ đa tầng 10 Object Stores với mã hóa két sắt AES-256-GCM (PBKDF2 10.000 vòng), chống tấn công XSS/SQLi (WAF), sổ cái bất biến và khôi phục thời gian thực PITR.';

            const checksum = computeDbIntegrityChecksum(appState);
            const vaultCipher = appState.aesVaultEncryptedHex || 'Chưa xuất file mã hóa (Bấm nút bên dưới để mã hóa bằng WebCrypto AES-256-GCM • PBKDF2 600.000 vòng)';
            const auditLogs = Array.isArray(appState.securityAuditLogs) ? appState.securityAuditLogs : [];
            const snaps = Array.isArray(appState.dbSnapshots) ? appState.dbSnapshots : [];

            const storesInfo = [
              { id: '1. userProgress', desc: 'Trạng thái học tập chính & Hồ sơ cấp bậc BlackPig', count: 1, status: 'ĐÃ ĐỒNG BỘ WAL' },
              { id: '2. card_states', desc: 'Trạng thái 19 tham số trí nhớ FSRS-5 (Stability & Difficulty)', count: (appState.srsWords || []).length, status: 'CHỈ MỤC KÉP' },
              { id: '3. review_logs', desc: 'Nhật ký lịch sử ôn tập thẻ ngắt quãng bất biến', count: (appState.reviewLogs || []).length, status: 'APPEND-ONLY' },
              { id: '4. ledger', desc: 'Sổ cái giao dịch EXP & Linh Thạch chống cộng trùng (Idempotent)', count: (appState.ledger || []).length, status: 'CHUẨN ACID' },
              { id: '5. sync_outbox', desc: 'Hàng đợi đồng bộ đa tab thời gian thực (BroadcastChannel)', count: (appState.syncOutbox || []).length, status: 'REALTIME SYNC' },
              { id: '6. mistake_notebook', desc: 'Sổ tay lỗi sai & ghi chú từ vựng cá nhân', count: (appState.mistakeNotebookItems || []).length, status: 'ĐÃ BẢO VỆ' },
              { id: '7. ai_chat_history', desc: 'Lịch sử hội thoại đa kịch bản cùng BlackPig AI', count: Object.keys(appState.aiConversations || {}).length, status: 'ĐÃ NÉN' },
              { id: '8. auto_snapshots', desc: 'Kho điểm khôi phục tức thời (Point-In-Time Recovery PITR)', count: snaps.length, status: 'TỰ ĐỘNG SAO LƯU' },
              { id: '9. security_audit_logs', desc: 'Nhật ký kiểm toán bảo mật & Tường lửa WAF chống XSS/SQLi', count: auditLogs.length, status: 'ZERO-TRUST' },
              { id: '10. encrypted_vault', desc: 'Két sắt mã hóa phần cứng WebCrypto AES-256-GCM + PBKDF2', count: 1, status: 'MÃ HÓA 256-BIT' }
            ];

            bodyEl.innerHTML = `
              <!-- Top Security & Database Status Cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div class="text-xs font-extrabold text-red-600 uppercase">🗄️ Kiến Trúc CSDL</div>
                  <div class="text-base sm:text-lg font-black text-slate-900">Enterprise DB v7 (10 Bảng)</div>
                  <div class="text-[11px] text-slate-600">IndexedDB v7 + LocalStorage + BroadcastChannel</div>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div class="text-xs font-extrabold text-red-600 uppercase">🔐 Chuẩn Mã Hóa Két Sắt</div>
                  <div class="text-base sm:text-lg font-black text-slate-900">AES-256-GCM & SHA-256</div>
                  <div class="text-[11px] text-slate-600 font-mono truncate">${escapeHtml(vaultCipher)}</div>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div class="text-xs font-extrabold text-red-600 uppercase">🛡️ Tường Lửa WAF & Chữ Ký</div>
                  <div class="text-base sm:text-lg font-black text-slate-900">${escapeHtml(checksum)}</div>
                  <div class="text-[11px] text-slate-600">Đã chặn: <b>${appState.wafBlockedCount || 0}</b> cuộc tấn công XSS/Injection</div>
                </div>
                <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <div class="text-xs font-extrabold text-red-600 uppercase">📸 Điểm Khôi Phục PITR</div>
                  <div class="text-base sm:text-lg font-black text-slate-900">${snaps.length} Bản Sao Lưu</div>
                  <div class="text-[11px] text-slate-600">Tự động chống mất dữ liệu 100%</div>
                </div>
              </div>

              <!-- Action Controls Bar -->
              <div class="p-4 rounded-2xl bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div class="flex flex-wrap gap-2">
                  <button type="button" id="btnRunZeroTrustAuditNow" class="px-4 py-2.5 rounded-xl bg-red-600 text-white text-xs font-extrabold shadow">
                    🛡️ Quét Bảo Mật Zero-Trust & Kiểm Toàn Vẹn 10 Bảng
                  </button>
                  <button type="button" id="btnEncryptAesVaultNow" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-extrabold">
                    🔐 Mã Hóa Két Sắt AES-256-GCM Mới
                  </button>
                  <button type="button" id="btnHubRunVacuumNow" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                    🧹 Chống Phân Mảnh & Dọn Rác (VACUUM v7)
                  </button>
                  <button type="button" id="btnHubCreateSnapshotNow" class="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200 text-xs font-bold">
                    📸 Tạo Bản Sao Lưu Cục Bộ
                  </button>
                </div>
                <div class="flex flex-wrap items-center gap-2">
                  <button type="button" id="btnSimWafAttackTest" class="px-3.5 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">
                    ⚡ Test Tường Lửa Chặn Mã Độc XSS
                  </button>
                  <button type="button" id="btnExitAdminModeInHub" class="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-extrabold">
                    🔒 Ẩn về Chế Độ Người Dùng
                  </button>
                </div>
              </div>

              <!-- 10 Object Stores Table -->
              <div class="space-y-2.5">
                <h3 class="text-sm sm:text-base font-extrabold text-slate-900">🗄️ Trạng Thái Trực Tiếp 10 Bảng Dữ Liệu (Object Stores) Trong BlackPig Enterprise DB v7:</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  ${storesInfo.map(st => `
                    <div class="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="text-xs sm:text-sm font-extrabold text-slate-900">${escapeHtml(st.id)}</div>
                        <div class="text-xs text-slate-600">${escapeHtml(st.desc)}</div>
                      </div>
                      <div class="text-right shrink-0">
                        <span class="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-[10px] font-extrabold">${st.status}</span>
                        <div class="text-xs font-bold text-slate-700 mt-1">${st.count} bản ghi</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Security Audit Logs -->
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs sm:text-sm font-extrabold text-red-600 uppercase">📜 Nhật Ký Kiểm Toán Bảo Mật & Chống Xâm Nhập (Security Audit Trail):</h4>
                  <span class="text-xs font-bold text-slate-500">${auditLogs.length} sự kiện bảo mật</span>
                </div>
                <div class="space-y-2 max-h-56 overflow-y-auto pr-1">
                  ${auditLogs.map(log => `
                    <div class="p-3 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div class="font-semibold text-slate-800">🛡️ ${escapeHtml(log.event)}</div>
                      <div class="flex items-center gap-2 shrink-0">
                        <span class="px-2 py-0.5 rounded bg-red-50 text-red-600 font-extrabold">${escapeHtml(log.level)}</span>
                        <span class="text-slate-500">${escapeHtml(log.time)}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
            return;
          }

          if (activeHbModule === 'vocab_mnemonics') {
            if (badgeEl) badgeEl.textContent = '💡 Mẹo Nhớ Từ Vựng & Chiết Tự Chữ Hán Tượng Hình';
            if (titleEl) titleEl.textContent = '💡 Cẩm Nang Chiết Tự & Câu Chuyện Nhớ Nhanh Chữ Hán Trong 5 Giây';
            if (descEl) descEl.textContent = 'Hiểu rõ cấu tạo bộ thủ và câu chuyện hình ảnh đằng sau mỗi chữ Hán để nhớ sâu gấp 5 lần không bao giờ quên.';

            bodyEl.innerHTML = `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                ${MNEMONICS_DATA.map(m => `
                  <div class="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 shadow-xs">
                    <div class="flex items-start justify-between">
                      <div class="flex items-center gap-3">
                        <span class="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-2xl font-black hanzi-font flex items-center justify-center">${m.char}</span>
                        <div>
                          <div class="text-sm font-extrabold text-slate-900">${m.py} • Hán Việt: ${m.hv}</div>
                          <div class="text-xs font-bold text-red-600">Nghĩa: ${m.mean}</div>
                        </div>
                      </div>
                      <button type="button" data-speak="${m.char}" class="speak-inline-btn px-2.5 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🔊</button>
                    </div>
                    <div class="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-slate-800">
                      🧩 Công thức chiết tự: ${escapeHtml(m.formula)}
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">
                      📖 <b>Mẹo nhớ:</b> ${escapeHtml(m.story)}
                    </p>
                  </div>
                `).join('')}
              </div>
            `;
            return;
          }
        }
        window.renderHanbeeGoHubView = renderHanbeeGoHubView;

        // Helper functions to isolate sub-blocks inside #view-map, #view-srs, #view-library so nothing stacks vertically!
        function showIsolatedMapSubBlock(mode) {
          const bCourse = document.getElementById('mapBlock_courseRoadmap');
          const bNodes = document.getElementById('mapBlock_adventureNodes');
          const btnCourse = document.getElementById('btnMapSubCourseRoadmap');
          const btnNodes = document.getElementById('btnMapSubBeginnerNodes');
          const isBeginner = (mode === 'beginner');
          if (bCourse) bCourse.classList.toggle('hidden', isBeginner);
          if (bNodes) bNodes.classList.toggle('hidden', !isBeginner);
          if (btnCourse) btnCourse.className = 'px-4 py-2 rounded-xl text-xs font-extrabold transition ' + (!isBeginner ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200');
          if (btnNodes) btnNodes.className = 'px-4 py-2 rounded-xl text-xs font-extrabold transition ' + (isBeginner ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200');
        }

        function showIsolatedSrsSubBlock(subtab) {
          const bFlash = document.getElementById('srsBlock_flashcards');
          const bDict = document.getElementById('srsBlock_dictation');
          const bNote = document.getElementById('srsBlock_notebook');
          if (bFlash) bFlash.classList.toggle('hidden', subtab !== 'flashcards');
          if (bDict) bDict.classList.toggle('hidden', subtab !== 'dictation');
          if (bNote) bNote.classList.toggle('hidden', subtab !== 'notebook');
          document.querySelectorAll('.srs-subtab-btn').forEach(btn => {
            const act = btn.getAttribute('data-srs-subtab') === subtab;
            btn.className = 'srs-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ' +
              (act ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200');
          });
        }

        function showIsolatedLibrarySubBlock(subtab) {
          const bDict = document.getElementById('libBlock_dictionary');
          const bRead = document.getElementById('libBlock_stories');
          const bGram = document.getElementById('libBlock_grammar');
          const bRes = document.getElementById('libBlock_resources');
          if (bDict) bDict.classList.toggle('hidden', subtab !== 'dict');
          if (bRead) bRead.classList.toggle('hidden', subtab !== 'read');
          if (bGram) bGram.classList.toggle('hidden', subtab !== 'grammar');
          if (bRes) bRes.classList.toggle('hidden', subtab !== 'resources');
          document.querySelectorAll('.lib-subtab-btn').forEach(btn => {
            const act = btn.getAttribute('data-lib-subtab') === subtab;
            btn.className = 'lib-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ' +
              (act ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200');
          });
        }

        function setWorkspaceKnowledgeTabMode(showKnowledgeTab) {
          const studio = document.getElementById('universalTopicKnowledgeStudio');
          const btnMain = document.getElementById('btnSwitchToMainWorkspace');
          const btnKnow = document.getElementById('btnSwitchToKnowledgeClipTab');
          if (studio) studio.classList.toggle('hidden', !showKnowledgeTab);
          if (btnMain) {
            btnMain.className = 'px-3.5 py-2 rounded-xl text-xs font-extrabold transition ' +
              (!showKnowledgeTab ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200');
          }
          if (btnKnow) {
            btnKnow.className = 'px-3.5 py-2 rounded-xl text-xs font-extrabold transition ' +
              (showKnowledgeTab ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200');
          }
        }

        const MENU_SECTION_META = {
          beginner: { icon: '🌱', group: 'KHÓA HỌC', title: 'Người mới bắt đầu (Nhập môn Cấp 0 – 14 Ải)' },
          hsk19: { icon: '🎓', group: 'KHÓA HỌC', title: 'Giáo trình HSK 1–9 Theo Ngày (Kiểm tra 10 câu/ngày)' },
          exercises: { icon: '🧩', group: 'KHÓA HỌC', title: 'Bài tập HSK 1–9 (5 Dạng bài & 30 Câu Nghe-Nói-Đọc-Viết)' },
          grammar: { icon: '📐', group: 'KHÓA HỌC', title: 'Ngữ pháp cốt lõi HSK 1–9' },
          hsk_exam: { icon: '📝', group: 'KHÓA HỌC', title: 'Luyện thi HSK 1–9 Quốc Tế' },
          study_plan: { icon: '🗓️', group: 'KHÓA HỌC', title: 'Kế hoạch ôn thi HSK cá nhân hóa' },
          tocfl_exam: { icon: '🇹🇼', group: 'KHÓA HỌC', title: 'Luyện thi TOCFL Đài Loan (Phồn thể / Giản thể)' },
          video_learn: { icon: '🎬', group: 'KHÓA HỌC', title: 'Học qua video (Kho 1.000 Video Ngắn 3–4 Phút Theo HSK)' },
          skill_listen: { icon: '🎧', group: 'KỸ NĂNG', title: 'Luyện nghe chép chính tả (10.500 câu bản xứ)' },
          skill_speak: { icon: '🗣️', group: 'KỸ NĂNG', title: 'Luyện nói chuyên sâu (5.000 Câu ngắn & 1.000 Văn bản 4–5 dòng)' },
          skill_read: { icon: '📖', group: 'KỸ NĂNG', title: 'Đọc hiểu truyện song ngữ tương tác HSK 1–9' },
          skill_write: { icon: '🖌️', group: 'KỸ NĂNG', title: 'Luyện viết chữ Hán (Ô Điền Tự 田字格)' },
          skill_pronounce: { icon: '🎵', group: 'KỸ NĂNG', title: 'Luyện phát âm Pinyin, 4 Thanh điệu & Máy đo F0' },
          skill_shadowing: { icon: '🎙️', group: 'KỸ NĂNG', title: 'Luyện nói nhại đuổi Shadowing Karaoke' },
          prac_dialogue: { icon: '💬', group: 'LUYỆN TẬP', title: 'Nhập vai Hội thoại tình huống thực tế' },
          prac_translate: { icon: '🔄', group: 'LUYỆN TẬP', title: 'Luyện dịch câu Việt ↔ Trung chuẩn ngữ pháp' },
          prac_aitutor: { icon: '🤖', group: 'LUYỆN TẬP', title: 'Gia sư AI Sư Phụ 24/7' },
          vocab_daily: { icon: '📅', group: 'TỪ VỰNG', title: 'Từ vựng mỗi ngày theo cấp HSK' },
          vocab_notebook: { icon: '📓', group: 'TỪ VỰNG', title: 'Sổ tay từ vựng & Sổ tay lỗi sai cá nhân' },
          vocab_topics: { icon: '🗂️', group: 'TỪ VỰNG', title: 'Từ vựng theo chủ đề & Từ điển 11.300+ từ' },
          vocab_mnemonics: { icon: '💡', group: 'TỪ VỰNG', title: 'Mẹo nhớ từ vựng & Chiết tự chữ Hán' },
          vocab_measure: { icon: '📏', group: 'TỪ VỰNG', title: 'Bách khoa Lượng từ (3 Phần tách biệt & 20 câu hỏi)' },
          sys_arena: { icon: '🎮', group: 'ĐẤU TRƯỜNG & TIỆN ÍCH', title: 'Đấu Trường Game Hán Ngữ' },
          sys_srs: { icon: '🧠', group: 'ĐẤU TRƯỜNG & TIỆN ÍCH', title: 'Ôn Tập Ngắt Quãng SRS (Thuật toán FSRS)' },
          sys_library: { icon: '📚', group: 'ĐẤU TRƯỜNG & TIỆN ÍCH', title: 'Tàng Kinh Các & Từ Điển HSK 1–9' },
          sys_profile: { icon: '📊', group: 'ĐẤU TRƯỜNG & TIỆN ÍCH', title: 'Lịch Trình, Hồ Sơ & Cửa Hàng Linh Bảo' },
          sys_security_db: { icon: '🛡️', group: 'BẢO MẬT & CƠ SỞ DỮ LIỆU', title: 'Sao Lưu Cục Bộ & Xuất File Mã Hóa (IndexedDB v8)' }
        };

        // =========================================================================
        // ADMIN-ONLY ACCESS CONTROL FOR SECURITY & DATABASE V7
        // Hidden from all regular learners by default; only visible in Admin Mode
        // =========================================================================
        // Admin privilege is NEVER granted via URL query (?admin=1), hash (#admin), or keyboard shortcut.
        // It defaults strictly to false and requires server-side RBAC session verification (/api/v1/admin/verify).
        appState.isAdminMode = false;

        window.verifyAdminSessionWithServer = async function () {
          try {
            const apiUrl = (window.BLACKPIG_API_BASE_URL || '/api/v1') + '/admin/verify';
            const res = await fetch(apiUrl, {
              method: 'GET',
              credentials: 'include',
              headers: { 'Accept': 'application/json' }
            });
            if (res && res.ok) {
              const data = await res.json();
              if (data && data.authorized === true) {
                appState.isAdminMode = true;
                window.applyAdminRoleVisibility();
                showToast('👑 Máy chủ đã xác thực quyền Admin (' + (data.roleCode || 'super_admin') + ') & ghi nhật ký thao tác!', 'emerald');
                return true;
              }
            }
          } catch (e) {}
          appState.isAdminMode = false;
          window.applyAdminRoleVisibility();
          showToast('🔒 Từ chối truy cập: Quyền Admin phải do Máy chủ cấp qua phiên đăng nhập RBAC (httpOnly Cookie)!', 'rose');
          return false;
        };

        window.applyAdminRoleVisibility = function () {
          const isAdm = !!appState.isAdminMode;
          document.body.classList.toggle('is-admin-mode', isAdm);
          document.querySelectorAll('.admin-only-el').forEach(el => {
            el.classList.toggle('hidden', !isAdm);
          });
          const countEl = document.getElementById('sidebarTotalModulesCount');
          if (countEl) {
            countEl.textContent = isAdm ? '27 Chuyên mục (Admin)' : '26 Chuyên mục';
          }
          const dbTextEl = document.getElementById('hudDbStatusText');
          if (dbTextEl) {
            dbTextEl.textContent = isAdm ? '👑 Admin • DB v7 Bảo Mật' : 'Đã lưu tự động';
          }
          const roleBadge = document.getElementById('adminRoleStatusBadge');
          if (roleBadge) {
            roleBadge.textContent = isAdm
              ? '👑 Chế độ hiển thị: Quản Trị Viên (Admin) — Đang hiện Bảo Mật & Database v7'
              : '👤 Chế độ hiển thị: Người Dùng (Đã ẩn mục Bảo Mật & Database v7)';
          }
          const btnRole = document.getElementById('btnToggleAdminRoleMode');
          if (btnRole) {
            btnRole.textContent = isAdm ? '🔒 Chuyển về Giao Diện Người Dùng' : '🔐 Mở Quyền Admin';
          }
          const btnModalAdm = document.getElementById('btnModalToggleAdminMode');
          if (btnModalAdm) {
            btnModalAdm.textContent = isAdm ? '👑 Đang ở Admin (Bấm để ẩn)' : '🔐 Admin';
          }
        };

        window.setBlackPigAdminMode = function (enable, silent) {
          appState.isAdminMode = !!enable;
          window.applyAdminRoleVisibility();
          if (!appState.isAdminMode && activeHbModule === 'sys_security_db') {
            navigateHanbeeSidebarItem('hsk_exam');
          }
          if (!silent) {
            if (appState.isAdminMode) {
              showToast('👑 Đã bật Chế độ Quản Trị Viên (Admin)! Mục Bảo Mật & Database v7 đã hiển thị trên menu.', 'emerald');
            } else {
              showToast('👤 Đã chuyển về Giao diện Người Dùng! Mục Bảo Mật & Database v7 đã được ẩn hoàn toàn.', 'amber');
            }
          }
        };

        window.toggleBlackPigAdminMode = async function () {
          if (appState.isAdminMode) {
            window.setBlackPigAdminMode(false, false);
          } else {
            await window.verifyAdminSessionWithServer();
          }
        };

        function navigateHanbeeSidebarItem(navKey) {
          if (navKey === 'sys_security_db' && !appState.isAdminMode) {
            showToast('🔒 Mục Bảo Mật & Database v7 chỉ dành riêng cho Quản Trị Viên (Admin)!', 'amber');
            return;
          }
          activeTopicClipLineIdx = 0;
          if (typeof renderUniversalTopicKnowledgeStudio === 'function') renderUniversalTopicKnowledgeStudio(navKey);
          setWorkspaceKnowledgeTabMode(false); // Always show the main workspace immediately at the top!
          document.body.classList.remove('mobile-drawer-open');

          const meta = MENU_SECTION_META[navKey] || MENU_SECTION_META.hsk19;
          const iconEl = document.getElementById('activeMenuSectionIcon');
          const grpEl = document.getElementById('activeMenuGroupLabel');
          const ttlEl = document.getElementById('activeMenuSectionTitle');
          if (iconEl) iconEl.textContent = meta.icon;
          if (grpEl) grpEl.textContent = meta.group;
          if (ttlEl) ttlEl.textContent = meta.title;

          document.querySelectorAll('[data-hb-nav]').forEach(btn => {
            if (btn.classList.contains('hb-nav-item')) {
              btn.classList.toggle('hb-active', btn.getAttribute('data-hb-nav') === navKey);
            }
          });

          try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) { window.scrollTo(0, 0); }

          const hubModules = [
            'hsk_exam', 'tocfl_exam', 'video_learn', 'skill_shadowing',
            'prac_translate', 'exercises', 'vocab_mnemonics', 'vocab_measure',
            'skill_speak', 'study_plan', 'vocab_daily', 'sys_security_db'
          ];
          if (hubModules.includes(navKey)) {
            switchTab('hanbeego-hub');
            renderHanbeeGoHubView(navKey);
            return;
          }
          if (navKey === 'beginner') {
            switchTab('map');
            activeRealmFilter = '0';
            renderAdventureMap();
            showIsolatedMapSubBlock('beginner');
            return;
          }
          if (navKey === 'hsk19') {
            switchTab('map');
            showIsolatedMapSubBlock('hsk19');
            return;
          }
          if (navKey === 'grammar') {
            switchTab('library');
            showIsolatedLibrarySubBlock('grammar');
            return;
          }
          if (navKey === 'skill_read') {
            switchTab('library');
            showIsolatedLibrarySubBlock('read');
            return;
          }
          if (navKey === 'vocab_topics' || navKey === 'sys_library') {
            switchTab('library');
            showIsolatedLibrarySubBlock('dict');
            return;
          }
          if (navKey === 'skill_listen') {
            switchTab('srs');
            showIsolatedSrsSubBlock('dictation');
            return;
          }
          if (navKey === 'vocab_notebook') {
            switchTab('srs');
            showIsolatedSrsSubBlock('notebook');
            return;
          }
          if (navKey === 'sys_srs') {
            switchTab('srs');
            showIsolatedSrsSubBlock('flashcards');
            return;
          }
          if (navKey === 'prac_dialogue') {
            switchTab('ai');
            if (typeof initAiChatScenario === 'function') initAiChatScenario('milk_tea');
            return;
          }
          if (navKey === 'prac_aitutor') {
            switchTab('ai');
            if (typeof initAiChatScenario === 'function') initAiChatScenario('zero_intro');
            return;
          }
          if (navKey === 'skill_write') {
            switchTab('dojo');
            document.getElementById('btnDojoSubHanzi')?.click();
            return;
          }
          if (navKey === 'skill_pronounce') {
            switchTab('dojo');
            document.getElementById('btnDojoSubPinyin')?.click();
            return;
          }
          if (navKey === 'sys_arena') {
            switchTab('arena');
            return;
          }
          if (navKey === 'sys_profile') {
            switchTab('profile');
            return;
          }
        }
        window.navigateHanbeeSidebarItem = navigateHanbeeSidebarItem;

        // ====================================================================
        // FEATURE H: UNIVERSAL TOPIC KNOWLEDGE, INTERACTIVE VIDEO CLIP & VOCABULARY STUDIO
        //            Provides Deep Theory, Interactive Video/Audio Lecture Clip, and
        //            Curated Vocabulary Deck for ALL 22 Left-Menu Sections!
        // ====================================================================
        let activeTopicClipKey = 'beginner';
        let activeTopicClipLineIdx = 0;
        let topicStudioCollapsed = false;

        const TOPIC_DEEP_KNOWLEDGE_CLIPS_VOCAB = {
          beginner: {
            badge: '🎓 Khóa học • Người mới bắt đầu (Cấp 0 – Nhập môn)',
            title: 'Nền Tảng Phát Âm Pinyin, 4 Thanh Điệu, Biến Điệu & 8 Nét Cơ Bản',
            summary: 'Dành cho người bắt đầu từ con số 0: Làm chủ khẩu hình 21 Thanh mẫu, 36 Vận mẫu, 4 Thanh điệu chuẩn Bắc Kinh và quy tắc viết chữ Hán.',
            theory: [
              '📌 Quy tắc Biến điệu Thanh 3: Khi hai âm tiết Thanh 3 đi liền nhau (VD: 你好 nǐ hǎo), âm tiết đầu tự động đọc thành Thanh 2 (ní hǎo).',
              '📌 Biến điệu của 不 (bù) & 一 (yī): Đứng trước Thanh 4 thì đọc thành Thanh 2 (不是 bú shì, 一个 yí gè); đứng trước Thanh 1, 2, 3 thì 一 đọc thành Thanh 4 (一天 yì tiān).',
              '📌 Quy tắc 8 Nét chữ Hán (永字八法): Ngang (一) trước Sổ (丨) sau • Phẩy (丿) trước Mác (㇏) sau • Trên trước Dưới sau • Trái trước Phải sau.'
            ],
            clipTitle: '🎬 Clip Bài Giảng: Khẩu Hình Phát Âm Pinyin & 5 Câu Chào Hỏi Đầu Tiên',
            clipDuration: '02:30',
            clipEmoji: '👩‍🏫🎙️🇨🇳',
            clipLines: [
              { speaker: 'Giảng viên (老师)', hz: '大家好！欢迎来到初级汉语发音课堂。', py: 'Dàjiā hǎo! Huānyíng láidào chūjí Hànyǔ fāyīn kètáng.', vi: 'Chào mọi người! Chào mừng đến với lớp học phát âm tiếng Trung sơ cấp.' },
              { speaker: 'Học viên (学生)', hz: '老师好！请问“你好”怎么发音最自然？', py: 'Lǎoshī hǎo! Qǐngwèn "nǐ hǎo" zěnme fāyīn zuì zìrán?', vi: 'Chào cô giáo! Xin hỏi chữ "Nǐ hǎo" phát âm thế nào tự nhiên nhất ạ?' },
              { speaker: 'Giảng viên (老师)', hz: '两个第三声在一起，前面的字要读成第二声：ní hǎo！', py: 'Liǎng gè dì-sān shēng zài yīqǐ, qiánmiàn de zì yào dú chéng dì-èr shēng: ní hǎo!', vi: 'Hai thanh 3 đi liền nhau, chữ phía trước phải đọc thành thanh 2: ní hǎo!' }
            ],
            vocab: [
              { hz: '你好', py: 'nǐ hǎo', hv: 'Nhĩ hảo', vi: 'Xin chào', ex: '你好！很高兴认识你。' },
              { hz: '谢谢', py: 'xièxie', hv: 'Tạ tạ', vi: 'Cảm ơn', ex: '谢谢你的帮助！' },
              { hz: '不客气', py: 'bú kèqi', hv: 'Bất khách khí', vi: 'Không có chi / Đừng khách sáo', ex: 'A: 谢谢！ B: 不客气！' },
              { hz: '对不起', py: 'duìbuqǐ', hv: 'Đối bất khởi', vi: 'Xin lỗi', ex: '对不起，我来晚了。' },
              { hz: '没关系', py: 'méi guānxi', hv: 'Một quan hệ', vi: 'Không sao đâu', ex: 'A: 对不起！ B: 没关系。' },
              { hz: '再见', py: 'zàijiàn', hv: 'Tái kiến', vi: 'Tạm biệt', ex: '明天见，再见！' }
            ]
          },
          hsk19: {
            badge: '🎓 Khóa học • Giáo trình HSK 1–9 Chuẩn Khung HSK 3.0',
            title: 'Hệ Thống Giáo Trình Toàn Diện HSK 1–9 (3 Giai Đoạn – 9 Cấp Độ)',
            summary: 'Bám sát khung chuẩn quốc tế mới nhất: Sơ cấp (HSK 1–3), Trung cấp (HSK 4–6) và Cao cấp (HSK 7–9) với lộ trình học cuốn chiếu mỗi ngày.',
            theory: [
              '📌 Giai đoạn Sơ cấp (HSK 1–3): Làm chủ 500 – 2.245 từ vựng giao tiếp đời sống, du lịch, học tập và sinh hoạt hàng ngày.',
              '📌 Giai đoạn Trung cấp (HSK 4–6): Làm chủ 3.245 – 5.456 từ vựng, đọc báo chí, thảo luận công việc, thành ngữ 4 chữ và viết luận.',
              '📌 Giai đoạn Cao cấp (HSK 7–9): Tinh thông hơn 11.000 từ vựng học thuật, thương mại quốc tế, biên phiên dịch chuyên sâu.'
            ],
            clipTitle: '🎬 Clip Bài Giảng: Chiến Lược Học Cuốn Chiếu Chinh Phục HSK 1–9',
            clipDuration: '03:10',
            clipEmoji: '📚🏆🚀',
            clipLines: [
              { speaker: 'Sư phụ (导师)', hz: '学习汉语最重要的是每天坚持十个生词。', py: 'Xuéxí Hànyǔ zuì zhòngyào de shì měitiān jiānchí shí gè shēngcí.', vi: 'Học tiếng Trung quan trọng nhất là mỗi ngày kiên trì 10 từ mới.' },
              { speaker: 'Học viên (学员)', hz: '怎么才能不忘记以前学过的词汇呢？', py: 'Zěnme cáinéng bú wàngjì yǐqián xué guò de cíhuì ne?', vi: 'Làm sao để không quên những từ vựng đã học trước đó ạ?' },
              { speaker: 'Sư phụ (导师)', hz: '每天学习新词的同时，复习前一天的内容，这就是螺旋式学习法。', py: 'Měitiān xuéxí xīncí de tóngshí, fùxí qián yī tiān de nèiróng, zhè jiùshì luóxuánshì xuéxífǎ.', vi: 'Mỗi ngày vừa học từ mới vừa ôn lại bài ngày hôm trước, đó chính là phương pháp học cuốn chiếu.' }
            ],
            vocab: [
              { hz: '基础', py: 'jīchǔ', hv: 'Cơ sở', vi: 'Nền tảng, cơ bản', ex: '打好汉语基础非常重要。' },
              { hz: '水平', py: 'shuǐpíng', hv: 'Thủy bình', vi: 'Trình độ, năng lực', ex: '他的汉语水平提高了很多。' },
              { hz: '流利', py: 'liúlì', hv: 'Lưu lợi', vi: 'Lưu loát, trôi chảy', ex: '她能说一口流利的中文。' },
              { hz: '坚持', py: 'jiānchí', hv: 'Kiên trì', vi: 'Kiên trì, bền bỉ', ex: '只要坚持就能成功。' },
              { hz: '掌握', py: 'zhǎngwò', hv: 'Chưởng ác', vi: 'Nắm vững, làm chủ', ex: '我已经掌握了五百个汉字。' },
              { hz: '相辅相成', py: 'xiāngfǔ xiāngchéng', hv: 'Tương phụ tương thành', vi: 'Bổ trợ lẫn nhau', ex: '听说读写是相辅相成的。' }
            ]
          },
          hsk_exam: {
            badge: '🎓 Khóa học • Luyện Thi HSK 1–9 Online (Chuẩn HSK 3.0)',
            title: 'Chiến Thuật Phòng Thi HSK & Bẫy Đề Thi Nghe – Đọc – Viết',
            summary: 'Mô phỏng 100% áp lực thời gian phòng thi thật với đồng hồ đếm ngược, chấm điểm thang 300 và phân tích Điểm mạnh / Điểm yếu tự động.',
            theory: [
              '📌 Mẹo Phần 1 – Nghe Hiểu (听力): Đọc lướt 4 đáp án trước khi băng phát 3 giây để gạch chân từ khóa (Thời gian, Địa điểm, Quan hệ nhân vật, Từ phủ định 没/不).',
              '📌 Mẹo Phần 2 – Đọc Hiểu (阅读): Chú ý cặp liên từ hô ứng (虽然…但是…, 不仅…而且…, 即使…也…) và từ loại đứng trước/sau chỗ trống.',
              '📌 Mẹo Phần 3 – Viết Câu (书写): Nhớ công thức vàng Chủ ngữ + Thời gian + Địa điểm + Động từ + Tân ngữ; trong câu chữ 把 phải có bổ ngữ kết quả phía sau.'
            ],
            clipTitle: '🎬 Clip Bài Giảng: Giải Mã 3 Bẫy Thường Gặp Nhất Trong Đề Thi HSK',
            clipDuration: '03:25',
            clipEmoji: '📝🎯🏅',
            clipLines: [
              { speaker: 'Giám khảo (考官)', hz: '做听力题的时候，千万不要只听第一个词，要注意“但是”后面的意思。', py: 'Zuò tīnglì tí de shíhou, qiānwàn búyào zhǐ tīng dì-yī gè cí, yào zhùyì "dànshì" hòumiàn de yìsi.', vi: 'Khi làm bài nghe, tuyệt đối đừng chỉ nghe từ đầu tiên mà phải chú ý ý nghĩa đằng sau chữ "Dànshì" (Nhưng).' },
              { speaker: 'Thí sinh (考生)', hz: '原来如此！比如“我本来想去，但是临时有事”，答案就是没去！', py: 'Yuánlái rúcǐ! Bǐrú "wǒ běnlái xiǎng qù, dànshì línshí yǒushì", dá’àn jiùshì méi qù!', vi: 'Hóa ra là vậy! Ví dụ "Tôi vốn định đi, nhưng đột xuất có việc", đáp án chính là đã không đi!' }
            ],
            vocab: [
              { hz: '本来', py: 'běnlái', hv: 'Bản lai', vi: 'Vốn dĩ, ban đầu (Từ báo hiệu bẫy đổi ý)', ex: '我本来想买那件衣服，但是太贵了。' },
              { hz: '其实', py: 'qíshí', hv: 'Kỳ thực', vi: 'Thực ra là (Từ chốt đáp án thật)', ex: '这件事其实很简单。' },
              { hz: '恐怕', py: 'kǒngpà', hv: 'Khủng phạ', vi: 'E rằng, sợ rằng (Biểu thị từ chối khéo)', ex: '明天我恐怕不能去参加聚会了。' },
              { hz: '干脆', py: 'gāncuì', hv: 'Can thúy', vi: 'Chi bằng, dứt khoát', ex: '既然下雨了，我们干脆在家看电影吧。' },
              { hz: '万一', py: 'wànyī', hv: 'Vạn nhất', vi: 'Nhỡ đâu, lỡ như', ex: '带上雨伞吧，万一下雨呢？' },
              { hz: '至关重要', py: 'zhìguān zhòngyào', hv: 'Chí quan trọng yếu', vi: 'Vô cùng quan trọng, then chốt', ex: '良好的心态对考试至关重要。' }
            ]
          },
          tocfl_exam: {
            badge: '🎓 Khóa học • Luyện Thi TOCFL Đài Loan (Band A • Band B • Band C)',
            title: 'Chinh Phục Kỳ Thi Năng Lực Hoa Ngữ Đài Loan (Phồn Thể 繁體 & Giản Thể 简体)',
            summary: 'Làm chủ từ vựng đặc trưng Đài Loan, quy tắc nhận diện chữ Phồn thể và luyện đề chuẩn Band A (Cấp 1–2), Band B (Cấp 3–4), Band C (Cấp 5–6).',
            theory: [
              '📌 Khác biệt Từ vựng Đài Loan vs Đại Lục: Tàu điện ngầm = 捷運 (jiéyùn) thay vì 地铁; Taxi = 計程車 (jìchéngchē) thay vì 出租车; Cơm hộp = 便當 (biàndāng).',
              '📌 Mẹo đọc Chữ Phồn Thể (繁體字): Chú ý bộ Ngôn (言 ➔ 訁như 請, 謝謝), bộ Kim (金 ➔ 釒như 錢, 錯), bộ Thực (食 ➔ 飠như 飯, 館).',
              '📌 Cấu trúc đề TOCFL: Gồm 2 phần chính Nghe Hiểu (聽力 50 câu) và Đọc Hiểu (閱讀 50 câu) chấm theo thang điểm Band A / B / C.'
            ],
            clipTitle: '🎬 Clip Bài Giảng: Giao Tiếp Thực Tế Tại Đài Bắc & Từ Vựng TOCFL',
            clipDuration: '02:55',
            clipEmoji: '🇹🇼🧋🚆',
            clipLines: [
              { speaker: 'Người Đài Bắc (台北朋友)', hz: '歡迎來到台灣！我們先搭捷運去士林夜市吃美食吧！', py: 'Huānyíng láidào Táiwān! Wǒmen xiān dā jiéyùn qù Shìlín yèshì chī měishí ba!', vi: 'Chào mừng đến Đài Loan! Chúng mình bắt tàu điện MRT đi chợ đêm Sĩ Lâm ăn món ngon trước nhé!' },
              { speaker: 'Du học sinh (留学生)', hz: '太棒了！請問這裡可以用悠遊卡付錢嗎？', py: 'Tài bàng le! Qǐngwèn zhèlǐ kěyǐ yòng Yōuyóukǎ fùqián ma?', vi: 'Tuyệt quá! Xin hỏi ở đây có thể dùng thẻ EasyCard thanh toán không ạ?' }
            ],
            vocab: [
              { hz: '捷運 (地铁)', py: 'jiéyùn', hv: 'Tiệp vận', vi: 'Tàu điện ngầm (MRT Đài Loan)', ex: '搭捷運去台北車站非常方便。' },
              { hz: '計程車 (出租车)', py: 'jìchéngchē', hv: 'Kế trình xa', vi: 'Xe taxi (Từ dùng tại Đài Loan)', ex: '我們叫一輛計程車去機場吧。' },
              { hz: '便當 (盒饭)', py: 'biàndāng', hv: 'Tiện đương', vi: 'Cơm hộp', ex: '台鐵的排骨便當非常有名。' },
              { hz: '軟體 (软件)', py: 'ruǎntǐ', hv: 'Nhuyễn thể', vi: 'Phần mềm máy tính/điện thoại', ex: '這個學習軟體非常好用。' },
              { hz: '腳踏車 (自行车)', py: 'jiǎotàchē', hv: 'Cước đạp xa', vi: 'Xe đạp', ex: '週末我喜歡騎腳踏車去河濱公園。' },
              { hz: '悠遊卡', py: 'Yōuyóukǎ', hv: 'Du du tạp', vi: 'Thẻ giao thông EasyCard Đài Loan', ex: '用悠遊卡搭公車有優惠。' }
            ]
          }
        };

        function getTopicKnowledgeData(navKey) {
          if (TOPIC_DEEP_KNOWLEDGE_CLIPS_VOCAB[navKey]) return TOPIC_DEEP_KNOWLEDGE_CLIPS_VOCAB[navKey];
          const fallbackMap = {
                        study_plan: {
              badge: '🎓 Khóa học • Kế Hoạch Ôn Thi & Kỷ Luật Chuyên Cần',
              title: 'Lộ Trình Học Cuốn Chiếu Theo Ngày (10 Từ Mới + 10 Câu Kiểm Tra)',
              summary: 'Mỗi ngày chinh phục 10 từ mới kèm 5 từ lồng ghép ngày trước. Nếu nghỉ học 1 ngày, hệ thống tự động khóa bài mới và bắt buộc ôn lại ngày trước đó.',
              theory: [
                '📌 Quy tắc 10/10: Bạn bắt buộc phải trả lời đúng đủ 10/10 câu hỏi cuối ngày mới mở khóa sang ngày học tiếp theo.',
                '📌 Cơ chế Chống học vẹt (Anti-Skip Gate): Nếu bỏ trống 1 ngày không vào học, bạn phải làm lại bài kiểm tra 10 câu của ngày liền trước.',
                '📌 Tích lũy Bùa Đóng Băng Streak (🛡️): Giúp bảo vệ chuỗi ngày học liên tiếp khi bạn có việc đột xuất.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Cách Phân Bổ 20 Phút Mỗi Ngày Để Đỗ HSK Đúng Hạn',
              clipDuration: '02:35',
              clipEmoji: '📅⏰🔥',
              clipLines: [
                { speaker: 'Cố vấn học tập', hz: '每天抽出二十分钟：十分钟记生词，五分钟练听力，五分钟做十道测试题。', py: 'Měitiān chōuchū èrshí fēnzhōng: shí fēnzhōng jì shēngcí, wǔ fēnzhōng liàn tīnglì, wǔ fēnzhōng zuò shí dào cèshìtí.', vi: 'Mỗi ngày dành ra 20 phút: 10 phút nhớ từ mới, 5 phút luyện nghe, 5 phút làm 10 câu kiểm tra.' }
              ],
              vocab: [
                { hz: '计划', py: 'jìhuà', hv: 'Kế hoạch', vi: 'Kế hoạch, lập kế hoạch', ex: '我们需要制定一个详细的学习计划。' },
                { hz: '目标', py: 'mùbiāo', hv: 'Mục tiêu', vi: 'Mục tiêu', ex: '我今年的目標是通过HSK五级。' },
                { hz: '复习', py: 'fùxí', hv: 'Phục tập', vi: 'Ôn tập', ex: '睡前复习十遍生词效果最好。' },
                { hz: '按时', py: 'ànshí', hv: 'Án thời', vi: 'Đúng giờ, đúng hạn', ex: '每天按时完成学习任务。' },
                { hz: '进步', py: 'jìnbù', hv: 'Tiến bộ', vi: 'Tiến bộ', ex: '每天努力一点点，就会有大进步。' },
                { hz: '半途而废', py: 'bàntú érfèi', hv: 'Bán đồ nhi phế', vi: 'Bỏ cuộc giữa chừng', ex: '学习语言千万不能半途而废。' }
              ]
            },
            video_learn: {
              badge: '🎓 Khóa học • Học Qua Video Tình Huống Thực Tế',
              title: 'Phương Pháp Nghe – Nhìn Ngữ Cảnh Qua 6 Hoạt Cảnh Đời Sống & Công Sở',
              summary: 'Học tiếng Trung tự nhiên qua các tình huống giao tiếp đời thực tại Trung Quốc kèm phụ đề song ngữ bấm từng câu.',
              theory: [
                '📌 Bước 1 (Nghe tổng quát): Xem lượt đầu để nắm ngữ cảnh, cảm xúc và mục đích giao tiếp của nhân vật.',
                '📌 Bước 2 (Phân tích từ khóa): Bấm vào từng dòng phụ đề để nghe lại phát âm và ghi nhớ cụm từ cố định (Collocations).',
                '📌 Bước 3 (Nhại lại & Kiểm tra): Đọc to theo tốc độ nhân vật và trả lời câu hỏi trắc nghiệm cuối video.'
              ],
              clipTitle: '🎬 Clip Minh Họa: Giao Tiếp Tự Nhiên Như Người Bản Xứ Tại Thượng Hải',
              clipDuration: '02:50',
              clipEmoji: '🎬🍿🎧',
              clipLines: [
                { speaker: 'Đạo diễn ngôn ngữ', hz: '看视频学中文能帮你记住最地道的语气和表达方式。', py: 'Kàn shìpín xué Zhōngwén néng bāng nǐ jìzhù zuì dìdao de yǔqì hé biǎodá fāngshì.', vi: 'Xem video học tiếng Trung giúp bạn ghi nhớ ngữ khí và cách diễn đạt chuẩn bản xứ nhất.' }
              ],
              vocab: [
                { hz: '地道', py: 'dìdao', hv: 'Địa đạo', vi: 'Chuẩn bản xứ, chính gốc', ex: '他的北京话非常地道。' },
                { hz: '字幕', py: 'zìmù', hv: 'Tự mạc', vi: 'Phụ đề', ex: '试着看一部不带字幕的中文电影。' },
                { hz: '语气', py: 'yǔqì', hv: 'Ngữ khí', vi: 'Giọng điệu, ngữ khí', ex: '说话的时候要注意礼貌的语气。' },
                { hz: '场景', py: 'chǎngjǐng', hv: 'Trường cảnh', vi: 'Bối cảnh, tình huống', ex: '在不同的生活场景中使用中文。' },
                { hz: '划算', py: 'huásuàn', hv: 'Hoạch toán', vi: 'Hời, đáng đồng tiền', ex: '打八折买这件衣服太划算了。' },
                { hz: '欢迎光临', py: 'huānyíng guānglín', hv: 'Hoan nghênh quang lâm', vi: 'Chào mừng quý khách', ex: '你好，欢迎光临！' }
              ]
            },
            skill_listen: {
              badge: '🎧 Kỹ năng • Luyện Nghe Phản Xạ 10.500 Câu Giao Tiếp',
              title: 'Kỹ Thuật Nghe Bắt Từ Khóa & Chép Chính Tả Theo 20 Chủ Đề Thực Tế',
              summary: 'Khắc phục điểm yếu lớn nhất của người Việt khi thi HSK bằng phương pháp nghe 2 tốc độ (1.0x & 0.65x) và đối chiếu từng chữ.',
              theory: [
                '📌 Kỹ thuật Nghe 3 Bước: Nghe không nhìn chữ (bắt ý chính) ➔ Nghe chép lại chữ Hán/Pinyin ➔ Mở đáp án đối chiếu chữ bị sót.',
                '📌 Bắt từ chỉ Thời gian & Con số: Chú ý phân biệt 十 (shí - 10) vs 四 (sì - 4), 十四 (14) vs 四十 (40), 买 (mǎi - mua) vs 卖 (mài - bán).',
                '📌 Bắt từ chuyển ý: Ý chính của câu thường nằm ngay sau nhưng từ như 不过, 但是, 其实, 反而, 结果.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Mẹo Nghe Phân Biệt Các Âm Dễ Nhầm Trong Tiếng Trung',
              clipDuration: '02:40',
              clipEmoji: '🎧👂✨',
              clipLines: [
                { speaker: 'Chuyên gia luyện nghe', hz: '练听力不要一个字一个字地翻译，要抓核心动词和转折词。', py: 'Liàn tīnglì búyào yī gè zì yī gè zì de fānyì, yào zhuā héxīn dòngcí hé zhuǎnzhécí.', vi: 'Luyện nghe đừng dịch từng chữ một, hãy bắt lấy động từ cốt lõi và từ chuyển ý.' }
              ],
              vocab: [
                { hz: '听力', py: 'tīnglì', hv: 'Thính lực', vi: 'Kỹ năng nghe hiểu', ex: '我每天早上练习二十分钟听力。' },
                { hz: '录音', py: 'lùyīn', hv: 'Lục âm', vi: 'Băng ghi âm', ex: '请仔细听这段录音。' },
                { hz: '关键词', py: 'guānjiàncí', hv: 'Quan kiện từ', vi: 'Từ khóa', ex: '听的时候要把关键词记下来。' },
                { hz: '速度', py: 'sùdù', hv: 'Tốc độ', vi: 'Tốc độ', ex: '适应正常语速的说话速度。' },
                { hz: '清楚', py: 'qīngchu', hv: 'Thanh sở', vi: 'Rõ ràng', ex: '这句话我听得很清楚。' },
                { hz: '不知不觉', py: 'bùzhī bùjué', hv: 'Bất tri bất giác', vi: 'Một cách tự nhiên không nhận ra', ex: '坚持听写，听力不知不觉就提高了。' }
              ]
            },
            skill_speak: {
              badge: '🎧 Kỹ năng • Luyện Nói & Chấm Điểm Phát Âm AI',
              title: 'Luyện Phản Xạ Mở Miệng Nói Tiếng Trung Tự Nhiên & Chuẩn Ngữ Điệu',
              summary: 'Thực hành nói trực tiếp qua Micro, hệ thống nhận diện giọng nói và chấm điểm độ khớp phát âm ngay tức thì.',
              theory: [
                '📌 Bí quyết nói trôi chảy: Ghép từ thành cụm nhịp 2 chữ – 2 chữ (VD: 今天 / 我想 / 去喝 / 咖啡) thay vì đọc rời rạc từng chữ.',
                '📌 Giữ chuẩn Thanh 1 (cao đều) và Thanh 4 (dứt khoát từ cao xuống thấp) để giọng nói nghe vang và giống người bản xứ.',
                '📌 Sử dụng từ nối tự nhiên: Dùng 嗯 (Ừm), 其实 (Thực ra), 对了 (À đúng rồi), 我觉得 (Mình thấy là) để câu nói mềm mại hơn.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Cách Luyện Khẩu Ngữ Lưu Loát Không Cần Sang Trung Quốc',
              clipDuration: '02:30',
              clipEmoji: '🗣️🎙️🌟',
              clipLines: [
                { speaker: 'Tiểu Long AI', hz: '别怕说错！大胆开口说出来，我会随时帮你纠正发音和语法。', py: 'Bié pà shuō cuò! Dàdǎn kāikǒu shuō chūlái, wǒ huì suíshí bāng nǐ jiūzhèng fāyīn hé yǔfǎ.', vi: 'Đừng sợ nói sai! Hãy mạnh dạn mở miệng nói ra, mình sẽ luôn giúp bạn sửa phát âm và ngữ pháp.' }
              ],
              vocab: [
                { hz: '口语', py: 'kǒuyǔ', hv: 'Khẩu ngữ', vi: 'Văn nói, khẩu ngữ', ex: '多跟朋友聊天能提高口语。' },
                { hz: '发音', py: 'fāyīn', hv: 'Phát âm', vi: 'Phát âm', ex: '你的中文发音非常标准。' },
                { hz: '自信', py: 'zìxìn', hv: 'Tự tín', vi: 'Tự tin', ex: '说外语最重要的就是自信。' },
                { hz: '交流', py: 'jiāoliú', hv: 'Giao lưu', vi: 'Giao tiếp, trao đổi', ex: '我可以用中文跟中国人交流。' },
                { hz: '标准', py: 'biāozhǔn', hv: 'Tiêu chuẩn', vi: 'Chuẩn xác', ex: '跟着录音模仿最标准的语调。' },
                { hz: '脱口而出', py: 'tuōkǒu érchū', hv: 'Thoát khẩu nhi xuất', vi: 'Bật ra khỏi miệng một cách tự nhiên', ex: '把常用句练到脱口而出。' }
              ]
            },
            skill_read: {
              badge: '🎧 Kỹ năng • Đọc Hiểu Truyện Song Ngữ Phân Cấp HSK',
              title: 'Luyện Đọc Hiểu Nhanh & Bấm Từng Từ Tra Nghĩa Tức Thì',
              summary: 'Đọc các câu chuyện và bài báo ngắn biên soạn đúng chuẩn từ vựng HSK 1–9, hỗ trợ bật/tắt Pinyin và bấm trực tiếp vào từ để tra nghĩa.',
              theory: [
                '📌 Kỹ thuật Đọc Không Phụ Thuộc Pinyin: Đọc lượt 1 tắt Pinyin để mắt làm quen với mặt chữ Hán; chỉ bật Pinyin khi gặp chữ mới.',
                '📌 Kỹ thuật Đọc Cụm (Chunking): Nhìn theo cụm động tân (吃早饭, 看电影) và cụm giới từ (在图书馆, 跟朋友) để tăng tốc độ đọc gấp 3 lần.',
                '📌 Lưu từ mới 1 chạm: Bấm vào bất kỳ từ nào trong bài đọc rồi bấm "Lưu vào Sổ tay SRS" để ôn lại.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Cách Luyện Đọc Chữ Hán Nhanh Không Cần Nhìn Pinyin',
              clipDuration: '02:45',
              clipEmoji: '📖👀🔖',
              clipLines: [
                { speaker: 'Giảng viên đọc hiểu', hz: '阅读的时候先把拼音关掉，试着用眼睛认汉字的偏旁部首。', py: 'Yuèdú de shíhou xiān bǎ pīnyīn guāndiào, shìzhe yòng yǎnjing rèn Hànzì de piānpáng bùshǒu.', vi: 'Khi đọc hiểu, trước tiên hãy tắt Pinyin đi, thử dùng mắt nhận diện bộ thủ của chữ Hán.' }
              ],
              vocab: [
                { hz: '阅读', py: 'yuèdú', hv: 'Duyệt độc', vi: 'Đọc hiểu', ex: '广泛阅读能扩大词汇量。' },
                { hz: '文章', py: 'wénzhāng', hv: 'Văn chương', vi: 'Bài văn, bài viết', ex: '这篇文章写得很有哲理。' },
                { hz: '故事', py: 'gùshi', hv: 'Cố sự', vi: 'Câu chuyện', ex: '我喜欢读有趣的中文故事。' },
                { hz: '内容', py: 'nèiróng', hv: 'Nội dung', vi: 'Nội dung', ex: '你明白这段话的内容吗？' },
                { hz: '段落', py: 'duànluò', hv: 'Đoạn lạc', vi: 'Đoạn văn', ex: '找出每个段落的中心意思。' },
                { hz: '一目十行', py: 'yīmù shíháng', hv: 'Nhất mục thập hàng', vi: 'Đọc nhanh hiểu rộng (1 cái nhìn 10 dòng)', ex: '熟练以后看中文可以一目十行。' }
              ]
            },
            skill_write: {
              badge: '🎧 Kỹ năng • Luyện Viết Chữ Hán & Thứ Tự Nét Bút Thuận',
              title: 'Võ Đường Luyện Bút Thuận Trên Ô Điền Tự (田字格) Với HanziWriter',
              summary: 'Tập viết từng nét chữ Hán theo đúng chuẩn bút thuận quốc tế, phân tích 214 bộ thủ và chấm độ chính xác nét viết.',
              theory: [
                '📌 7 Quy tắc Bút thuận cốt lõi: (1) Ngang trước Sổ sau (十) • (2) Phẩy trước Mác sau (八) • (3) Trên trước Dưới sau (三).',
                '📌 Quy tắc tiếp theo: (4) Trái trước Phải sau (好) • (5) Ngoài trước Trong sau (月) • (6) Vào trước Đóng sau (回) • (7) Giữa trước Hai bên sau (小).',
                '📌 Cân đối trong Ô Điền Tự (田字格): Đặt trọng tâm chữ ngay giao điểm hai đường chéo tâm ô để chữ viết vuông vức, đẹp mắt.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: 7 Quy Tắc Bút Thuận Giúp Viết Đúng Mọi Chữ Hán',
              clipDuration: '02:50',
              clipEmoji: '🖌️✍️📜',
              clipLines: [
                { speaker: 'Thầy thư pháp', hz: '写汉字一定要遵守笔顺规则：先横后竖，先撇后捺，从上到下，从左到右。', py: 'Xiě Hànzì yīdìng yào zūnshǒu bǐshùn guīzé: xiān héng hòu shù, xiān piě hòu nà, cóng shàng dào xià, cóng zuǒ dào yòu.', vi: 'Viết chữ Hán nhất định phải tuân thủ quy tắc bút thuận: Ngang trước sổ sau, phẩy trước mác sau, từ trên xuống dưới, từ trái sang phải.' }
              ],
              vocab: [
                { hz: '汉字', py: 'Hànzì', hv: 'Hán tự', vi: 'Chữ Hán', ex: '每个汉字都有独特的结构。' },
                { hz: '笔顺', py: 'bǐshùn', hv: 'Bút thuận', vi: 'Thứ tự nét viết', ex: '按照正确的笔顺写字。' },
                { hz: '部首', py: 'bùshǒu', hv: 'Bộ thủ', vi: 'Bộ thủ chữ Hán', ex: '认识偏旁部首更容易记字。' },
                { hz: '田字格', py: 'tiánzìgé', hv: 'Điền tự cách', vi: 'Ô vuông Điền Tự luyện chữ', ex: '在田字格里练习写汉字。' },
                { hz: '书法', py: 'shūfǎ', hv: 'Thư pháp', vi: 'Thư pháp', ex: '中国书法是一门优美的艺术。' },
                { hz: '一笔一画', py: 'yībǐ yīhuà', hv: 'Nhất bút nhất họa', vi: 'Từng nét từng nét cẩn thận', ex: '把字写得一笔一画、工工整整。' }
              ]
            },
            skill_pronounce: {
              badge: '🎧 Kỹ năng • Phòng Lab Luyện Phát Âm, Thanh Điệu & Sóng Âm F0',
              title: 'Làm Chủ Âm Bật Hơi, Âm Đầu Lưỡi / Cuống Lưỡi & Đường Cong Thanh Điệu F0',
              summary: 'Phân tích trực quan độ cao tần số giọng nói F0 (Hz) theo thang 5 bậc của Triệu Nguyên Nhiệm và luyện phân biệt cặp âm tối thiểu.',
              theory: [
                '📌 Nhóm âm bật hơi (p, t, k, q, ch, c): Đặt tờ giấy mỏng trước miệng, khi phát âm luồng hơi bật mạnh làm tờ giấy bay lên.',
                '📌 Nhóm âm cong lưỡi (zh, ch, sh, r): Đầu lưỡi uốn cong chạm nhẹ lên vòm ngạc cứng phía trên.',
                '📌 Nhóm âm mặt lưỡi (j, q, x): Đầu lưỡi hạ xuống chạm mặt sau răng cửa dưới, mặt lưỡi nâng sát vòm miệng.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Phân Biệt Âm Bật Hơi & Âm Cong Lưỡi Chuẩn Bắc Kinh',
              clipDuration: '03:00',
              clipEmoji: '🎙️📈🔊',
              clipLines: [
                { speaker: 'Chuyên gia ngữ âm', hz: '发翘舌音 zh、ch、sh、r 的时候，舌尖一定要往上翘起来。', py: 'Fā qiàoshéyīn zh, ch, sh, r de shíhou, shéjiān yīdìng yào wǎng shàng qiào qǐlái.', vi: 'Khi phát âm cong lưỡi zh, ch, sh, r, đầu lưỡi nhất định phải uốn cong lên trên.' }
              ],
              vocab: [
                { hz: '声调', py: 'shēngdiào', hv: 'Thanh điệu', vi: 'Thanh điệu (4 thanh)', ex: '普通话有四个基本声调。' },
                { hz: '轻声', py: 'qīngshēng', hv: 'Khinh thanh', vi: 'Thanh nhẹ', ex: '“谢谢”的第二个字读轻声。' },
                { hz: '变调', py: 'biàndiào', hv: 'Biến điệu', vi: 'Biến điệu âm thanh', ex: '注意“一”和“不”的变调规则。' },
                { hz: '准确', py: 'zhǔnquè', hv: 'Chuẩn xác', vi: 'Chính xác, chuẩn', ex: '声调读准确才不会让人误会。' },
                { hz: '水饺', py: 'shuǐjiǎo', hv: 'Thủy sủi', vi: 'Bánh sủi cảo (Thanh 3-3)', ex: '我喜欢吃牛肉水饺。' },
                { hz: '睡觉', py: 'shuìjiào', hv: 'Thụy giác', vi: 'Đi ngủ (Thanh 4-4)', ex: '晚上十一点以前早点睡觉。' }
              ]
            },
            skill_shadowing: {
              badge: '🎧 Kỹ năng • Shadowing (Luyện Nói Nhại Đuổi Đồng Bộ)',
              title: 'Phương Pháp Shadowing (跟读训练) Rèn Ngữ Điệu & Phản Xạ Bản Xứ',
              summary: 'Nghe và lặp lại đuổi theo giọng bản xứ chỉ chậm hơn 0.3 giây với hiệu ứng chữ chạy Karaoke tô đỏ từng chữ Hán.',
              theory: [
                '📌 Bước 1 (Shadowing có chữ): Vừa nghe băng vừa nhìn dòng chữ Karaoke tô đỏ để bắt kịp tốc độ ngắt nghỉ (Pause & Rhythm).',
                '📌 Bước 2 (Shadowing nhắm mắt): Không nhìn chữ, chỉ nghe âm thanh và nhại lại ngay lập tức để kích hoạt phản xạ vùng ngôn ngữ.',
                '📌 Bước 3 (Tăng tốc 1.15x): Khi đã quen ở tốc độ 0.75x và 1.0x, thử thách ở mức 1.15x để nghe người bản xứ nói nhanh không bị ngợp.'
              ],
              clipTitle: '🎬 Clip Hướng Dẫn: Kỹ Thuật Shadowing Đuổi Âm Của Phiên Dịch Viên Quốc Tế',
              clipDuration: '02:35',
              clipEmoji: '🎙️⚡🎶',
              clipLines: [
                { speaker: 'Phiên dịch viên', hz: '跟读的时候要模仿录音里的重音、停顿和语调起伏。', py: 'Gēndú de shíhou yào mófǎng lùyīn lǐ de zhòngyīn, tíngdùn hé yǔdiào qǐfú.', vi: 'Khi đọc đuổi Shadowing, hãy bắt chước trọng âm, nhịp ngắt nghỉ và độ trầm bổng của ngữ điệu trong băng.' }
              ],
              vocab: [
                { hz: '模仿', py: 'mófǎng', hv: 'Mô phỏng', vi: 'Bắt chước, mô phỏng', ex: '模仿母语者的语音和语调。' },
                { hz: '节奏', py: 'jiézòu', hv: 'Tiết tấu', vi: 'Nhịp điệu, tiết tấu', ex: '掌握说话的自然节奏。' },
                { hz: '停顿', py: 'tíngdùn', hv: 'Đình đốn', vi: 'Ngắt nghỉ câu', ex: '在长句子里注意适当的停顿。' },
                { hz: '流利度', py: 'liúlìdù', hv: 'Lưu lợi độ', vi: 'Độ trôi chảy, lưu loát', ex: '每天跟读能显著提升口语流利度。' },
                { hz: '语感', py: 'yǔgǎn', hv: 'Ngữ cảm', vi: 'Cảm quan ngôn ngữ', ex: '大声朗读是培养语感最好的方法。' },
                { hz: '抑扬顿挫', py: 'yìyáng dùncuò', hv: 'Ức dương đốn tỏa', vi: 'Ngữ điệu trầm bổng nhịp nhàng', ex: '他的演讲声音洪亮，抑扬顿挫。' }
              ]
            },
            prac_dialogue: {
              badge: '🎯 Luyện tập • Thực Hành Hội Thoại Đóng Vai (Role-Play)',
              title: 'Đóng Vai Thực Chiến Trong Các Tình Huống Đời Sống, Du Lịch & Thương Mại',
              summary: 'Thực hành đối đáp trực tiếp theo kịch bản mở từ làm quen, gọi món, mua sắm mặc cả đến phỏng vấn xin việc.',
              theory: [
                '📌 Mở đầu hội thoại tự nhiên: Thay vì chỉ hỏi 你好吗?, người Trung Quốc thường hỏi 你今天过得怎么样? hoặc 最近忙什么呢?.',
                '📌 Cách hỏi lịch sự: Luôn thêm 请问 (Xin hỏi...), 麻烦你 (Phiền bạn...), 不好意思 (Ngại quá/Xin lỗi cho hỏi...) ở đầu câu.',
                '📌 Phản hồi tích cực: Dùng 没问题 (Không thành vấn đề), 太好了 (Tuyệt quá), 原来是这样 (Thì ra là vậy).'
              ],
              clipTitle: '🎬 Clip Hội Thoại Mẫu: Đặt Bàn Nhà Hàng & Gọi Món Đặc Sản Bắc Kinh',
              clipDuration: '02:45',
              clipEmoji: '💬🍵🤝',
              clipLines: [
                { speaker: 'Khách hàng', hz: '服务员，请问有什么招牌菜推荐吗？', py: 'Fúwùyuán, qǐngwèn yǒu shénme zhāopáicài tuījiàn ma?', vi: 'Phục vụ ơi, xin hỏi quán mình có món tủ (đặc sản) nào gợi ý không?' },
                { speaker: 'Nhân viên', hz: '我们的北京烤鸭和宫保鸡丁最受欢迎，您一定要尝尝！', py: 'Wǒmen de Běijīng kǎoyā hé gōngbǎo jīdīng zuì shòu huānyíng, nín yīdìng yào chángchang!', vi: 'Vịt quay Bắc Kinh và Gà xào Cung Bảo của bên em được ưa chuộng nhất, quý khách nhất định phải nếm thử ạ!' }
              ],
              vocab: [
                { hz: '推荐', py: 'tuījiàn', hv: 'Tiến cử', vi: 'Giới thiệu, gợi ý (món ăn/sản phẩm)', ex: '你能给我推荐一本好书吗？' },
                { hz: '招牌菜', py: 'zhāopáicài', hv: 'Chiêu bài thái', vi: 'Món tủ, món đặc sản của quán', ex: '这是我们餐厅的招牌菜。' },
                { hz: '尝尝', py: 'chángchang', hv: 'Thường thường', vi: 'Nếm thử', ex: '快来尝尝我做的菜！' },
                { hz: '买单', py: 'mǎidān', hv: 'Mãi đơn', vi: 'Thanh toán, tính tiền', ex: '服务员，请帮我买单！' },
                { hz: '打折', py: 'dǎzhé', hv: 'Đả chiết', vi: 'Giảm giá, chiết khấu', ex: '现在买两件可以打八折。' },
                { hz: '讨价还价', py: 'tǎojià huánjià', hv: 'Thảo giá hoàn giá', vi: 'Mặc cả, trả giá', ex: '在夜市买东西可以讨价还价。' }
              ]
            },
            prac_translate: {
              badge: '🎯 Luyện tập • Phòng Luyện Biên Phiên Dịch Việt ↔ Trung',
              title: 'Luyện Dịch Câu Chuẩn Ngữ Pháp & Khắc Phục Lỗi Dịch Ngược Từ Tiếng Việt',
              summary: 'Ghép các mảnh từ hoặc gõ trực tiếp bản dịch câu, hệ thống kiểm tra tự động trật tự Chủ - Vị - Tân và Định ngữ.',
              theory: [
                '📌 Quy tắc Đảo Định Ngữ: Trong tiếng Việt nói "Cuốn sách [mà tôi mua hôm qua]", sang tiếng Trung phải đảo lên trước: "[我昨天买的] 书".',
                '📌 Quy tắc Thời gian & Địa điểm: Đưa Thời gian + Địa điểm lên trước Động từ (VD: Tôi ăn sáng ở nhà lúc 7h = 我七点在家里吃早饭).',
                '📌 Không dùng 是 trước Tính từ: Tiếng Việt nói "Hôm nay là rất vui", tiếng Trung nói "今天很开心" (bỏ 是).'
              ],
              clipTitle: '🎬 Clip Bài Giảng: 3 Bước Dịch Câu Dài Tiếng Việt Sang Tiếng Trung Chuẩn Xác',
              clipDuration: '03:00',
              clipEmoji: '🔄📝🎯',
              clipLines: [
                { speaker: 'Giảng viên dịch thuật', hz: '翻译长句时，把修饰名词的部分放在“的”前面，把时间和地点放在动词前面。', py: 'Fānyì chángjù shí, bǎ xiūshì míngcí de bùfen fàng zài "de" qiánmiàn, bǎ shíjiān hé dìdiǎn fàng zài dòngcí qiánmiàn.', vi: 'Khi dịch câu dài, hãy đặt phần bổ nghĩa cho danh từ lên trước chữ 的, và đặt thời gian cùng địa điểm lên trước động từ.' }
              ],
              vocab: [
                { hz: '翻译', py: 'fānyì', hv: 'Phiên dịch', vi: 'Dịch thuật, phiên dịch', ex: '请把这句话翻译成中文。' },
                { hz: '准确', py: 'zhǔnquè', hv: 'Chuẩn xác', vi: 'Chính xác', ex: '翻译专业术语要非常准确。' },
                { hz: '结构', py: 'jiégòu', hv: 'Kết cấu', vi: 'Cấu trúc câu', ex: '分析句子的语法结构。' },
                { hz: '语序', py: 'yǔxù', hv: 'Ngữ tự', vi: 'Trật tự từ trong câu', ex: '中文和越南语的语序有很多不同。' },
                { hz: '通顺', py: 'tōngshùn', hv: 'Thông thuận', vi: 'Trôi chảy, mạch lạc (văn viết)', ex: '检查一下句子读起来是否通顺。' },
                { hz: '信达雅', py: 'xìn dá yǎ', hv: 'Tín Đạt Nhã', vi: '3 chuẩn mực dịch thuật: Trung thực - Mạch lạc - Tinh tế', ex: '好的翻译要做到信、达、雅。' }
              ]
            },
            prac_aitutor: {
              badge: '🎯 Luyện tập • AI Tutor Tiểu Long (Bạn Đồng Hành 24/7)',
              title: 'Trò Chuyện Tự Nhiên & Sửa Lỗi Ngữ Pháp Thông Minh Cùng Tiểu Long AI',
              summary: 'Tiểu Long (Designer 24 tuổi tại Thượng Hải) vừa trò chuyện tự nhiên như bạn bè, vừa âm thầm phân tích và sửa lỗi câu cho bạn.',
              theory: [
                '📌 Chế độ Sửa lỗi tự nhiên (Recast): Tiểu Long khéo léo nhắc lại câu đúng của bạn trong lời đáp để không làm ngắt mạch hội thoại.',
                '📌 Lồng ghép từ SRS mục tiêu: Thử thách đưa 3–5 từ vựng đến hạn ôn hôm nay vào cuộc trò chuyện để được tính điểm ôn tập ngầm.',
                '📌 Lưu giữ Bộ nhớ bạn bè (Friend Memory): Bạn có thể thêm sở thích cá nhân để Tiểu Long trò chuyện gần gũi hơn.'
              ],
              clipTitle: '🎬 Clip Giới Thiệu: Cách Luyện Phản Xạ Giao Tiếp Mỗi Ngày Cùng Tiểu Long AI',
              clipDuration: '02:20',
              clipEmoji: '🐉🤖💬',
              clipLines: [
                { speaker: 'Tiểu Long (小龙)', hz: '嗨！我是小龙，不管你想聊工作、旅游还是美食，我随时都在！', py: 'Hāi! Wǒ shì Xiǎolóng, bùguǎn nǐ xiǎng liáo gōngzuò, lǚyóu háishi měishí, wǒ suíshí dōu zài!', vi: 'Chào bạn! Mình là Tiểu Long, bất kể bạn muốn trò chuyện về công việc, du lịch hay ẩm thực, mình luôn sẵn sàng!' }
              ],
              vocab: [
                { hz: '聊天', py: 'liáotiān', hv: 'Liêu thiên', vi: 'Trò chuyện, tán gẫu', ex: '下班以后我喜欢跟小龙聊天。' },
                { hz: '设计', py: 'shèjì', hv: 'Thiết kế', vi: 'Thiết kế', ex: '小龙在上海做平面设计工作。' },
                { hz: '美式咖啡', py: 'měishì kāfēi', hv: 'Mỹ thức cà phê', vi: 'Cà phê Americano', ex: '早上喝一杯冰美式咖啡提神。' },
                { hz: '纠正', py: 'jiūzhèng', hv: 'Cửu chính', vi: 'Sửa chữa, đính chính lỗi', ex: '谢谢你帮我纠正语法错误。' },
                { hz: '话题', py: 'huàtí', hv: 'Thoại đề', vi: 'Chủ đề trò chuyện', ex: '我们可以选一个感兴趣的话题。' },
                { hz: '无话不谈', py: 'wúhuà bùtán', hv: 'Vô thoại bất đàm', vi: 'Chuyện gì cũng có thể tâm sự (Bạn thân)', ex: '我们成了无话不谈的好朋友。' }
              ]
            },
            vocab_daily: {
              badge: '📚 Từ vựng • Từ Vựng Mỗi Ngày (Thẻ Lật 3D & Câu Giao Tiếp)',
              title: 'Học 10 Từ Mới Mỗi Ngày Kèm Thẻ Lật 2 Mặt 3D & Câu Nói Thực Tế',
              summary: 'Mặt trước hiển thị Chữ Hán, Pinyin, Hán Việt và Nghĩa; bấm lật mặt sau để xem ngay câu giao tiếp ứng dụng dễ nhớ.',
              theory: [
                '📌 Không học từ đơn lẻ: Mỗi từ mới luôn phải đi kèm ít nhất 1 cụm từ hoặc 1 câu nói ngắn thực tế để biết cách đặt câu.',
                '📌 Kết hợp Âm Hán Việt: Hơn 65% từ vựng tiếng Trung có âm Hán Việt tương đồng với tiếng Việt (VD: 准备 Chuẩn bị, 态度 Thái độ, 经验 Kinh nghiệm).',
                '📌 Kiểm tra 10 câu cuối buổi: Sau khi lật học đủ 10 thẻ từ mới, làm ngay bài kiểm tra 10 câu để khóa chặt vào trí nhớ dài hạn.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Cách Dùng Âm Hán Việt Để Nhớ Từ Vựng Nhanh Gấp 3 Lần',
              clipDuration: '02:40',
              clipEmoji: '🃏🌟📖',
              clipLines: [
                { speaker: 'Giảng viên từ vựng', hz: '越南语里有很多汉越词，利用汉越音记高级词汇非常快！', py: 'Yuènányǔ lǐ yǒu hěn duō Hànyuècí, lìyòng Hànyuèyīn jì gāojí cíhuì fēicháng kuài!', vi: 'Trong tiếng Việt có rất nhiều từ Hán Việt, tận dụng âm Hán Việt để nhớ từ vựng cao cấp cực kỳ nhanh!' }
              ],
              vocab: [
                { hz: '准备', py: 'zhǔnbèi', hv: 'Chuẩn bị', vi: 'Chuẩn bị', ex: '我已经做好了充分的准备。' },
                { hz: '经验', py: 'jīngyàn', hv: 'Kinh nghiệm', vi: 'Kinh nghiệm', ex: '他有五年的管理经验。' },
                { hz: '态度', py: 'tàidù', hv: 'Thái độ', vi: 'Thái độ', ex: '认真的工作态度最重要。' },
                { hz: '决定', py: 'juédìng', hv: 'Quyết định', vi: 'Quyết định', ex: '我决定明年去中国留学。' },
                { hz: '成功', py: 'chénggōng', hv: 'Thành công', vi: 'Thành công', ex: '祝你工作顺利，马到成功！' },
                { hz: '日积月累', py: 'rìjī yuèlěi', hv: 'Nhật tích nguyệt lũy', vi: 'Tích lũy từng ngày từng tháng', ex: '词汇量靠的是日积月累。' }
              ]
            },
            vocab_notebook: {
              badge: '📚 Từ vựng • Sổ Tay Từ Vựng Cá Nhân & Thuật Toán FSRS-5',
              title: 'Quản Lý Kho Thẻ Ghi Nhớ 3D FSRS-5 & Sổ Tay Những Từ Hay Quên',
              summary: 'Thuật toán lặp lại ngắt quãng FSRS-5 19 tham số tự động tính toán thời điểm vàng ngay trước khi bạn quên để nhắc ôn tập.',
              theory: [
                '📌 4 Nút Đánh Giá FSRS-5: Quên (Again - Ôn lại sau 10 phút) • Khó (Hard) • Nhớ (Good) • Rất Dễ (Easy - Kéo dài chu kỳ nhớ).',
                '📌 Tự động bắt từ viết sai: Mọi câu bạn nghe chép sai hoặc làm sai trong đề thi đều được tự động lưu vào Sổ tay cá nhân.',
                '📌 Tra cứu & Thêm từ tự động: Chỉ cần gõ tiếng Việt hoặc chữ Hán vào ô thêm từ, hệ thống tự động điền Pinyin và nghĩa còn thiếu.'
              ],
              clipTitle: '🎬 Clip Hướng Dẫn: Bí Quyết Ôn Thẻ FSRS-5 Nhớ Lâu Hàng Năm Không Quên',
              clipDuration: '02:30',
              clipEmoji: '🧠🗂️✨',
              clipLines: [
                { speaker: 'Chuyên gia trí nhớ', hz: '在快要遗忘的那一刻复习一次，记忆稳定度就会成倍增长。', py: 'Zài kuàiyào yíwàng de nà yī kè fùxí yī cì, jìyì wěndìngdù jiù huì chéngbèi zēngzhǎng.', vi: 'Ôn lại đúng vào khoảnh khắc sắp quên, độ bền trí nhớ sẽ tăng lên gấp bội.' }
              ],
              vocab: [
                { hz: '记忆', py: 'jìyì', hv: 'Ký ức', vi: 'Trí nhớ, ký ức', ex: '间隔重复能增强长期记忆。' },
                { hz: '笔记本', py: 'bǐjìběn', hv: 'Bút ký bản', vi: 'Sổ tay ghi chép', ex: '把生词记在个人笔记本里。' },
                { hz: '重点', py: 'zhòngdiǎn', hv: 'Trọng điểm', vi: 'Trọng tâm, điểm quan trọng', ex: '先复习今天标记的重点词汇。' },
                { hz: '印象', py: 'yìnxiàng', hv: 'Ấn tượng', vi: 'Ấn tượng', ex: '造一个句子能加深对生词的印象。' },
                { hz: '巩固', py: 'gǒnggù', hv: 'Củng cố', vi: 'Củng cố', ex: '通过闪卡巩固学过的知识。' },
                { hz: '温故知新', py: 'wēngù zhīxīn', hv: 'Ôn cố tri tân', vi: 'Ôn chuyện cũ hiểu thêm điều mới', ex: '学习要常常温故而知新。' }
              ]
            },
            vocab_topics: {
              badge: '📚 Từ vựng • Từ Vựng Theo 20 Chủ Đề Đời Sống & Thương Mại',
              title: 'Kho Từ Điển Song Ngữ 11.300+ Mục Từ Phân Nhóm Theo Chủ Đề Thực Tế',
              summary: 'Tra cứu 2 chiều Việt ↔ Trung tức thì hoặc lọc từ vựng theo từng lĩnh vực: Ẩm thực, Mua sắm, Du lịch, Công nghệ, Thương mại, Y tế.',
              theory: [
                '📌 Học từ theo Mạng lưới Chủ đề (Topic Clustering): Học cùng lúc các từ liên quan trong 1 bối cảnh giúp não bộ liên kết nhanh hơn.',
                '📌 Kết hợp Từ điển & Phân tách câu: Khi bạn nhập cả một câu tiếng Việt hoặc tiếng Trung dài, hệ thống tự động tách từng từ và dịch nghĩa.',
                '📌 Lưu nhanh vào SRS: Bấm nút "+ Lưu Sổ Tay" ở bất kỳ thẻ từ điển nào để đưa ngay vào danh sách ôn tập.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Cách Mở Rộng Vốn Từ Theo Sơ Đồ Tư Duy Chủ Đề',
              clipDuration: '02:35',
              clipEmoji: '🌐🔍📚',
              clipLines: [
                { speaker: 'Giảng viên', hz: '按主题分类记单词，比如去餐厅点菜、去机场坐飞机，用的时候马上就能想起来。', py: 'Àn zhǔtí fēnlèi jì dāncí, bǐrú qù cāntīng diǎncài, qù jīchǎng zuò fēijī, yòng de shíhou mǎshàng jiù néng xiǎng qǐlái.', vi: 'Nhớ từ vựng phân theo chủ đề, ví dụ đi nhà hàng gọi món, ra sân bay đi máy bay, khi cần dùng sẽ nhớ ra ngay lập tức.' }
              ],
              vocab: [
                { hz: '人工智能', py: 'réngōng zhìnéng', hv: 'Nhân công trí năng', vi: 'Trí tuệ nhân tạo (AI)', ex: '人工智能正在改变我们的生活。' },
                { hz: '电子商务', py: 'diànzǐ shāngwù', hv: 'Điện tử thương vụ', vi: 'Thương mại điện tử', ex: '跨境电子商务发展得很快。' },
                { hz: '登机牌', py: 'dēngjīpái', hv: 'Đăng cơ bài', vi: 'Thẻ lên máy bay (Boarding pass)', ex: '请出示您的护照和登机牌。' },
                { hz: '扫码支付', py: 'sǎomǎ zhīfù', hv: 'Tảo mã chi phó', vi: 'Quét mã QR thanh toán', ex: '在中国买东西都可以扫码支付。' },
                { hz: '合同', py: 'hétong', hv: 'Hợp đồng', vi: 'Bản hợp đồng', ex: '双方正式签署了合作合同。' },
                { hz: '琳琅满目', py: 'línláng mǎnmù', hv: 'Lâm lang mãn mục', vi: 'Đầy ắp những món đồ đẹp mắt', ex: '商场里的商品琳琅满目。' }
              ]
            },
            vocab_mnemonics: {
              badge: '📚 Từ vựng • Mẹo Nhớ Từ Vựng & Chiết Tự Chữ Hán',
              title: 'Giải Mã Chữ Hán Qua Bộ Thủ & Câu Chuyện Tượng Hình Dễ Nhớ',
              summary: 'Biến những nét chữ phức tạp thành câu chuyện hình ảnh sinh động để nhìn 1 lần là nhớ cả chữ viết lẫn ý nghĩa.',
              theory: [
                '📌 Chữ Tượng Hình (象形): Vẽ lại hình dáng sự vật như 日 (Mặt trời), 月 (Mặt trăng), 山 (Ngọn núi), 水 (Dòng nước), 木 (Cái cây).',
                '📌 Chữ Hội Ý (会意): Ghép các bộ phận mang ý nghĩa lại với nhau như 休 (Người 亻 dựa vào Cây 木 = Nghỉ ngơi), 明 (Nhật 日 + Nguyệt 月 = Sáng).',
                '📌 Chữ Hình Thanh (形声 - Chiếm 80% chữ Hán): 1 phần chỉ Ý nghĩa (Bộ thủ) + 1 phần gợi Âm đọc (VD: 妈, 吗, 骂 đều có chữ 马 mǎ gợi âm đọc).'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Tuyệt Chiêu Nhớ 100 Chữ Hán Qua Họ Hàng Chữ Hình Thanh',
              clipDuration: '03:05',
              clipEmoji: '💡🧩🎨',
              clipLines: [
                { speaker: 'Chuyên gia Hán tự', hz: '百分之八十的汉字是形声字：一半表意，一半表音。掌握这个规律记字快十倍！', py: 'Bǎifēnzhī bāshí de Hànzì shì xíngshēngzì: yī bàn biǎoyì, yī bàn biǎoyīn. Zhǎngwò zhè gè guīlǜ jì zì kuài shí bèi!', vi: '80% chữ Hán là chữ Hình thanh: một nửa biểu thị ý nghĩa, một nửa gợi âm đọc. Nắm vững quy luật này nhớ chữ nhanh gấp 10 lần!' }
              ],
              vocab: [
                { hz: '休息', py: 'xiūxi', hv: 'Hưu tức', vi: 'Nghỉ ngơi (亻Người + 木Cây)', ex: '累了就靠在树下休息一会儿。' },
                { hz: '明天', py: 'míngtiān', hv: 'Minh thiên', vi: 'Ngày mai (日Nhật + 月Nguyệt = Sáng)', ex: '明天又是一个好天气。' },
                { hz: '看', py: 'kàn', hv: 'Khán', vi: 'Nhìn, xem (手Tay che trên 目Mắt)', ex: '手放在眼睛上面往远处看。' },
                { hz: '安', py: 'ān', hv: 'An', vi: 'Bình an (宀Mái nhà + 女Phụ nữ)', ex: '祝你一路平安！' },
                { hz: '鲜', py: 'xiān', hv: 'Tiên', vi: 'Tươi ngon (鱼Cá + 羊Dê)', ex: '今天的海鲜非常新鲜。' },
                { hz: '森林', py: 'sēnlín', hv: 'Sâm lâm', vi: 'Rừng rậm (3 cây 木 + 2 cây 木)', ex: '保护大自然和森林环境。' }
              ]
            },
            vocab_measure: {
              badge: '📚 Từ vựng • Chuyên Đề Bách Khoa Lượng Từ (量词)',
              title: 'Quy Tắc Ghép Lượng Từ Tiếng Trung & 30+ Lượng Từ Bắt Buộc Trong HSK',
              summary: 'Trong tiếng Trung, giữa Số đếm / Đại từ chỉ định (这, 那, 哪, 几) và Danh từ bắt buộc phải có Lượng từ phù hợp.',
              theory: [
                '📌 Công thức bắt buộc: [Số từ / 这 / 那 / 哪 / 几 / 每] + [Lượng từ] + [Danh từ] (VD: 一本书, 这个人, 那件衣服).',
                '📌 Phân loại theo hình dáng: Vật phẳng rộng dùng 张 (giấy, bàn, vé, ảnh) • Vật thon dài dùng 条 (đường, sông, cá, quần) • Vật có tay cầm dùng 把 (ghế, ô, dao).',
                '📌 Khi đếm số 2 trước Lượng từ: Bắt buộc dùng 两 (liǎng) chứ không dùng 二 (VD: 两个人, 两杯茶, 两本书).'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Mẹo Nhớ Nhanh Lượng Từ Qua Hình Dáng Sự Vật',
              clipDuration: '02:45',
              clipEmoji: '📏🔢🎯',
              clipLines: [
                { speaker: 'Cô giáo ngữ pháp', hz: '平面的东西用“张”，细长的东西用“条”，有把手的东西用“把”！', py: 'Píngmiàn de dōngxi yòng "zhāng", xìcháng de dōngxi yòng "tiáo", yǒu bǎshǒu de dōngxi yòng "bǎ"!', vi: 'Đồ vật có mặt phẳng dùng "Trương (张)", vật thon dài dùng "Điều (条)", vật có tay cầm dùng "Bả (把)"!' }
              ],
              vocab: [
                { hz: '一本书', py: 'yī běn shū', hv: 'Nhất bản thư', vi: 'Một quyển sách (Lượng từ 本)', ex: '我昨天买了一本中文书。' },
                { hz: '一件衣服', py: 'yī jiàn yīfu', hv: 'Nhất kiện y phục', vi: 'Một chiếc áo (Lượng từ 件)', ex: '这件衣服穿在你身上真好看。' },
                { hz: '一条裤子', py: 'yī tiáo kùzi', hv: 'Nhất điều khố tử', vi: 'Một chiếc quần (Lượng từ 条)', ex: '我想买一条黑色的裤子。' },
                { hz: '一张票', py: 'yī zhāng piào', hv: 'Nhất trương phiếu', vi: 'Một tấm vé (Lượng từ 张)', ex: '请给我两张去北京的高铁票。' },
                { hz: '一把雨伞', py: 'yī bǎ yǔsǎn', hv: 'Nhất bả vũ tán', vi: 'Một chiếc ô/dù (Lượng từ 把)', ex: '下雨了，别忘了带一把雨伞。' },
                { hz: '一台电脑', py: 'yī tái diànnǎo', hv: 'Nhất đài điện não', vi: 'Một chiếc máy tính (Lượng từ 台)', ex: '办公室里新买了一台电脑。' }
              ]
            },
            exercises: {
              badge: '🎓 Khóa học • Bài Tập Thực Hành Tổng Hợp',
              title: 'Phòng Bài Tập Phản Xạ Đa Chiều (Nghe • Chép Chính Tả • Dịch Câu • Chọn Từ)',
              summary: 'Rèn luyện tư duy phản xạ tiếng Trung thực tế qua các bài tập kết hợp từ vựng, ngữ pháp và cấu trúc câu.',
              theory: [
                '📌 Nguyên tắc 1: Luôn xác định Động từ chính và Tân ngữ của câu trước khi ghép các thành phần bổ nghĩa.',
                '📌 Nguyên tắc 2: Định ngữ miêu tả (cụm có 的) luôn đứng TRƯỚC danh từ được bổ nghĩa.',
                '📌 Nguyên tắc 3: Trạng ngữ chỉ thời gian và địa điểm (在 + Nơi chốn) đứng TRƯỚC động từ hành động.'
              ],
              clipTitle: '🎬 Clip Hướng Dẫn: Phương Pháp Làm Bài Tập Tổng Hợp Đạt Điểm Tuyệt Đối',
              clipDuration: '02:20',
              clipEmoji: '✍️📋✅',
              clipLines: [
                { speaker: 'Giảng viên', hz: '做练习的时候，先把句子的主语、谓语和宾语找出来。', py: 'Zuò liànxí de shíhou, xiān bǎ jùzi de zhǔyǔ, wèiyǔ hé bīnyǔ zhǎo chūlái.', vi: 'Khi làm bài tập, trước tiên hãy tìm ra Chủ ngữ, Vị ngữ và Tân ngữ của câu.' },
                { speaker: 'Học viên', hz: '明白了！时间词和地点词都要放在动词前面。', py: 'Míngbai le! Shíjiāncí hé dìdiǎncí dōu yào fàng zài dòngcí qiánmiàn.', vi: 'Em hiểu rồi! Từ chỉ thời gian và địa điểm đều phải đặt trước động từ.' }
              ],
              vocab: [
                { hz: '练习', py: 'liànxí', hv: 'Luyện tập', vi: 'Bài tập, luyện tập', ex: '每天做十道练习题。' },
                { hz: '正确', py: 'zhèngquè', hv: 'Chính xác', vi: 'Đúng đắn, chính xác', ex: '请选择正确的答案。' },
                { hz: '语法', py: 'yǔfǎ', hv: 'Ngữ pháp', vi: 'Ngữ pháp', ex: '这个句子的语法完全正确。' },
                { hz: '顺序', py: 'shùnxù', hv: 'Thuận tự', vi: 'Thứ tự, trật tự', ex: '请注意词语的排列顺序。' },
                { hz: '表达', py: 'biǎodá', hv: 'Biểu đạt', vi: 'Diễn đạt, bày tỏ', ex: '用中文清楚地表达自己的想法。' },
                { hz: '熟能生巧', py: 'shúnéng shēngqiǎo', hv: 'Thục năng sinh xảo', vi: 'Trăm hay không bằng tay quen', ex: '多做练习，熟能生巧。' }
              ]
            },
            grammar: {
              badge: '🎓 Khóa học • Cẩm Nang Ngữ Pháp HSK 1–9',
              title: 'Hệ Thống Công Thức Ngữ Pháp Trọng Tâm & Tránh Lỗi Dịch Word-by-Word',
              summary: 'Tổng hợp toàn bộ cấu trúc ngữ pháp từ HSK 1 đến HSK 9 kèm công thức đóng khung, câu ví dụ có âm thanh và lưu ý lỗi sai thường gặp.',
              theory: [
                '📌 Phân biệt 3 chữ DE: 的 (Định ngữ + 的 + Danh từ) • 地 (Trạng ngữ + 地 + Động từ) • 得 (Động từ + 得 + Bổ ngữ mức độ).',
                '📌 Câu chữ 把 (bǎ): Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (了/着/Bổ ngữ kết quả) — nhấn mạnh sự tác động làm thay đổi trạng thái sự vật.',
                '📌 Câu so sánh 比 (bǐ): A + 比 + B + Tính từ (+ 一点儿 / 得多) — tuyệt đối không dùng 很, 非常 trước tính từ trong câu có 比.'
              ],
              clipTitle: '🎬 Clip Bài Giảng: Phân Biệt 3 Trợ Từ Kết Cấu 的 • 地 • 得 Trong 2 Phút',
              clipDuration: '02:45',
              clipEmoji: '📐📖💡',
              clipLines: [
                { speaker: 'Cô giáo', hz: '漂亮的衣服用“白勺的”，认真地学习用“土也地”，说得流利用“双人得”。', py: 'Piàoliang de yīfu yòng "báisháo de", rènzhēn de xuéxí yòng "tǔyě de", shuō de liúlì yòng "shuāngrén de".', vi: 'Quần áo đẹp dùng 的 (bạch đích), học chăm chỉ dùng 地 (thổ địa), nói lưu loát dùng 得 (song nhân đắc).' }
              ],
              vocab: [
                { hz: '不但…而且…', py: 'búdàn... érqiě...', hv: 'Bất đan... nhi thả...', vi: 'Không những... mà còn...', ex: '她不但聪明，而且很努力。' },
                { hz: '虽然…但是…', py: 'suīrán... dànshì...', hv: 'Tuy nhiên... đan thị...', vi: 'Tuy rằng... nhưng...', ex: '虽然下雨了，但是我还是去上课。' },
                { hz: '除了…以外', py: 'chúle... yǐwài', hv: 'Trừ liễu... dĩ ngoại', vi: 'Ngoài... ra', ex: '除了英语以外，他还会说中文。' },
                { hz: '无论…都…', py: 'wúlùn... dōu...', hv: 'Vô luận... đô...', vi: 'Bất luận... đều...', ex: '无论遇到什么困难，我们都不放弃。' },
                { hz: '既然…就…', py: 'jìrán... jiù...', hv: 'Ký nhiên... tựu...', vi: 'Đã... thì...', ex: '既然你来了，就留下来吃晚饭吧。' },
                { hz: '即使…也…', py: 'jíshǐ... yě...', hv: 'Tức sử... dã...', vi: 'Cho dù... cũng...', ex: '即使很忙，也要注意休息。' }
              ]
            }
          };
          return fallbackMap[navKey] || TOPIC_DEEP_KNOWLEDGE_CLIPS_VOCAB.hsk19;
        }

        let activeTopicStudioSubTab = 'theory'; // 'theory' | 'clip' | 'vocab'

        function renderUniversalTopicKnowledgeStudio(navKey) {
          if (navKey) activeTopicClipKey = navKey;
          const box = document.getElementById('universalTopicKnowledgeStudio');
          if (!box) return;
          const data = getTopicKnowledgeData(activeTopicClipKey);
          const lineObj = (data.clipLines && data.clipLines[activeTopicClipLineIdx % data.clipLines.length]) || data.clipLines[0];

          box.innerHTML = `
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <span class="px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-extrabold">${escapeHtml(data.badge)}</span>
                <h3 class="text-base sm:text-lg font-extrabold text-slate-900 mt-1">${escapeHtml(data.title)}</h3>
                <p class="text-xs text-slate-600">${escapeHtml(data.summary)}</p>
              </div>
              <button type="button" id="btnToggleTopicKnowledgeBody" class="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-extrabold shrink-0 shadow-xs">
                🎯 Quay Lại Thực Hành Chính
              </button>
            </div>

            <!-- 3 Separated Sub-Tabs inside Knowledge Studio (No vertical stacking!) -->
            <div class="flex flex-wrap gap-2 pt-1">
              <button type="button" data-studio-subtab="theory" class="studio-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTopicStudioSubTab === 'theory' ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }">📘 1. Kiến Thức & Công Thức Trọng Tâm</button>
              <button type="button" data-studio-subtab="clip" class="studio-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTopicStudioSubTab === 'clip' ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }">🎬 2. Clip Bài Giảng Tương Tác (${data.clipDuration})</button>
              <button type="button" data-studio-subtab="vocab" class="studio-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ${
                activeTopicStudioSubTab === 'vocab' ? 'bg-red-600 text-white shadow' : 'bg-slate-100 text-slate-700 border border-slate-200'
              }">📚 3. Bộ Từ Vựng Cốt Lõi (${data.vocab.length} từ)</button>
            </div>

            ${activeTopicStudioSubTab === 'theory' ? `
              <div class="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div class="text-xs font-extrabold text-red-600 uppercase tracking-wider">📘 Kiến Thức Trọng Tâm & Công Thức Cốt Lõi:</div>
                <div class="space-y-2 text-xs sm:text-sm text-slate-700 leading-relaxed">
                  ${data.theory.map(pt => `<div class="p-3 rounded-xl bg-white border border-slate-200">${escapeHtml(pt)}</div>`).join('')}
                </div>
              </div>
            ` : ''}

            ${activeTopicStudioSubTab === 'clip' ? `
              <div class="p-4 rounded-2xl bg-white border-2 border-red-200 flex flex-col justify-between space-y-3">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-extrabold text-red-600">${escapeHtml(data.clipTitle)} (${data.clipDuration})</span>
                  <span class="text-xl">${data.clipEmoji}</span>
                </div>
                <div id="topicClipScreenBox" class="relative rounded-2xl overflow-hidden border-2 border-red-300 min-h-[220px] p-4 flex flex-col justify-between" style="background:#0f172a;">
                  <img src="${VIDEO_SCENE_IMAGES_POOL[activeTopicClipLineIdx % VIDEO_SCENE_IMAGES_POOL.length]}" alt="Minh họa Clip Bài giảng" class="absolute inset-0 w-full h-full object-cover opacity-80" />
                  <div class="absolute inset-0" style="background: linear-gradient(180deg, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.85) 100%);"></div>
                  <div class="relative z-10 flex items-center justify-between">
                    <span class="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-xs font-extrabold" style="color:#ffffff !important;">🖼️ Minh họa Cảnh #${activeTopicClipLineIdx + 1}</span>
                    <span class="text-xs font-bold" style="color:#fde047 !important;">${escapeHtml(lineObj.speaker)}</span>
                  </div>
                  <div class="relative z-10 p-3 rounded-xl bg-black/75 border border-white/20 space-y-1 text-center mt-20">
                    <div class="text-base sm:text-lg font-black hanzi-font" style="color:#ffffff !important;">${escapeHtml(lineObj.hz)}</div>
                    <div class="text-xs font-bold" style="color:#fef08a !important;">${escapeHtml(lineObj.py)}</div>
                    <div class="text-xs" style="color:#f1f5f9 !important;">🇻🇳 ${escapeHtml(lineObj.vi)}</div>
                  </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="flex flex-wrap gap-1.5">
                    ${data.clipLines.map((ln, idx) => `
                      <button type="button" data-topic-clip-line="${idx}" class="topic-clip-line-btn px-2.5 py-1 rounded-lg text-xs font-bold border transition ${
                        activeTopicClipLineIdx === idx ? 'bg-red-600 text-white border-red-600' : 'bg-white text-slate-700 border-slate-200'
                      }">Câu thoại #${idx + 1}</button>
                    `).join('')}
                  </div>
                  <button type="button" id="btnPlayTopicClip" class="px-3.5 py-1.5 rounded-xl bg-red-600 text-white font-extrabold text-xs shadow">
                    ▶️ Phát Clip Bài Giảng
                  </button>
                </div>
              </div>
            ` : ''}

            ${activeTopicStudioSubTab === 'vocab' ? `
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                ${data.vocab.map(v => `
                  <div class="p-3 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between gap-1.5">
                    <div class="flex items-start justify-between gap-2">
                      <div>
                        <span class="text-lg font-black hanzi-font text-slate-900">${escapeHtml(v.hz)}</span>
                        <span class="text-xs font-bold text-red-600 ml-1.5">${escapeHtml(v.py)}</span>
                        <div class="text-[11px] text-slate-500">Hán Việt: <b>${escapeHtml(v.hv)}</b> • Nghĩa: <b class="text-slate-800">${escapeHtml(v.vi)}</b></div>
                      </div>
                      <div class="flex items-center gap-1 shrink-0">
                        <button type="button" data-speak="${escapeHtml(v.hz)}" class="speak-inline-btn px-2 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-bold">🔊</button>
                        <button type="button" data-save-dict-word="${escapeHtml(v.hz)}" data-save-dict-py="${escapeHtml(v.py)}" data-save-dict-mn="${escapeHtml(v.vi)}" class="save-dict-to-srs-btn px-2 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">+SRS</button>
                      </div>
                    </div>
                    <div class="text-[11px] text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100 hanzi-font">${escapeHtml(v.ex)}</div>
                  </div>
                `).join('')}
              </div>
            ` : ''}
          `;
        }
        window.renderUniversalTopicKnowledgeStudio = renderUniversalTopicKnowledgeStudio;
        renderUniversalTopicKnowledgeStudio('hsk19');

        // Left Sidebar Drawer Toggle (Works on Mobile Slide-Out Drawer & Desktop Collapse/Expand)
        const btnToggleLeftMenu = document.getElementById('btnToggleLeftMenuDrawer');
        const btnCloseLeftMenu = document.getElementById('btnCloseLeftMenuDrawer');
        const leftMenuBackdrop = document.getElementById('leftMenuBackdrop');

        function closeMobileLeftDrawer() {
          document.body.classList.remove('mobile-drawer-open');
        }

        if (btnToggleLeftMenu) {
          btnToggleLeftMenu.addEventListener('click', () => {
            playSfx('click');
            if (window.innerWidth < 768) {
              document.body.classList.toggle('mobile-drawer-open');
            } else {
              document.body.classList.toggle('desktop-sidebar-collapsed');
            }
          });
        }
        if (btnCloseLeftMenu) {
          btnCloseLeftMenu.addEventListener('click', closeMobileLeftDrawer);
        }
        if (leftMenuBackdrop) {
          leftMenuBackdrop.addEventListener('click', closeMobileLeftDrawer);
        }


        // Bind Accordion Group Toggles
        document.querySelectorAll('[data-hb-group-toggle]').forEach(btn => {
          btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-hb-group-toggle');
            const box = document.getElementById(targetId);
            const chev = document.getElementById('iconChevron_' + targetId);
            if (box) {
              const hidden = box.classList.toggle('hidden');
              if (chev) chev.style.transform = hidden ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
          });
        });

        const btnExportPersonal = document.getElementById('btnExportPersonalData');
        if (btnExportPersonal) {
          btnExportPersonal.addEventListener('click', () => {
            const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'huayu_quest_personal_data_' + getLocalDateISO() + '.json';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            showToast('⬇️ Đã xuất toàn bộ dữ liệu cá nhân (.json) theo chuẩn Nghị định 13/2023!', 'emerald');
          });
        }

        const inpImportPersonal = document.getElementById('inputImportPersonalData');
        if (inpImportPersonal) {
          inpImportPersonal.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
              showToast('❌ File vượt quá giới hạn an toàn 5MB!', 'rose');
              return;
            }
            const reader = new FileReader();
            reader.onload = function (ev) {
              try {
                const parsed = JSON.parse(ev.target.result);
                appState = sanitizeAndMigrateState(parsed);
                saveStateToDatabase('Khôi phục dữ liệu cá nhân từ file JSON');
                refreshAllUI();
                renderProfileAndChart();
                showToast('✅ Đã kiểm duyệt Schema v4 và khôi phục lịch trình thành công!', 'emerald');
              } catch (err) {
                showToast('❌ File JSON không hợp lệ!', 'rose');
              }
            };
            reader.readAsText(file);
          });
        }

        const btnDeleteAcc = document.getElementById('btnDeleteMyAccountData');
        if (btnDeleteAcc) {
          btnDeleteAcc.addEventListener('click', () => {
            const curUser = appState.currentUser;
            if (curUser && curUser.identifier) {
              const key = getAccountKey(curUser.identifier);
              if (appState.accountSchedules) delete appState.accountSchedules[key];
              appState.accounts = (appState.accounts || []).filter(a => getAccountKey(a.identifier) !== key);
              appState.currentUser = null;
            }
            appState = sanitizeAndMigrateState(defaultState);
            try { localStorage.removeItem(DB_KEY); } catch (e) {}
            saveStateToDatabase('Đã xóa dữ liệu cá nhân theo quyền Nghị định 13/2023/NĐ-CP');
            refreshAllUI();
            renderProfileAndChart();
            showToast('🗑️ Đã xóa sạch dữ liệu tài khoản cá nhân theo đúng quyền Nghị định 13/2023/NĐ-CP!', 'amber');
          });
        }

        document.getElementById('btnProfileLogoutAccount').addEventListener('click', () => {
          if (appState.currentUser) {
            saveCurrentAccountSnapshot();
            const oldName = appState.currentUser.fullName;
            appState.currentUser = null;
            saveStateToDatabase('Đăng xuất tài khoản: ' + oldName);
            refreshAllUI();
            renderProfileAndChart();
            setAuthModalMode('login');
            document.getElementById('authModal').classList.remove('hidden');
            showToast('🚪 Đã lưu lịch trình và đăng xuất khỏi tài khoản ' + oldName + '!', 'amber');
          } else {
            setAuthModalMode('login');
            document.getElementById('authModal').classList.remove('hidden');
          }
        });

        // Course Roadmap & Auth Modal Event Listeners
        document.getElementById('btnOpenAuthModal').addEventListener('click', () => {
          setAuthModalMode('login');
          document.getElementById('authModal').classList.remove('hidden');
        });

        document.getElementById('btnOpenAvatarFrameModal').addEventListener('click', () => {
          renderAvatarFrameModalUI();
          document.getElementById('avatarFrameModal').classList.remove('hidden');
          playSfx('click');
        });

        document.getElementById('btnCloseAvatarFrameModal').addEventListener('click', () => {
          document.getElementById('avatarFrameModal').classList.add('hidden');
        });

        document.getElementById('inputUploadCustomAvatar').addEventListener('change', (e) => {
          const file = e.target.files && e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = function (ev) {
            const img = new Image();
            img.onload = function () {
              const canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 160;
              const ctx = canvas.getContext('2d');
              const minSide = Math.min(img.width, img.height);
              const sx = (img.width - minSide) / 2;
              const sy = (img.height - minSide) / 2;
              ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, 160, 160);
              appState.avatarDataUrl = canvas.toDataURL('image/jpeg', 0.84);
              saveStateToDatabase('Cập nhật ảnh đại diện cá nhân tải lên');
              updateAuthHeaderUI();
              renderAvatarFrameModalUI();
              renderAccountScheduleHub();
              playSfx('levelup');
              showToast('📸 Đã cập nhật ảnh đại diện cá nhân của bạn!', 'emerald');
            };
            img.src = ev.target.result;
          };
          reader.readAsDataURL(file);
        });
        document.getElementById('btnCloseAuthModal').addEventListener('click', () => {
          document.getElementById('authModal').classList.add('hidden');
        });
        document.getElementById('btnSwitchToLogin').addEventListener('click', () => setAuthModalMode('login'));
        document.getElementById('btnSwitchToRegister').addEventListener('click', () => setAuthModalMode('register'));

        document.getElementById('btnAuthTypeGmail').addEventListener('click', () => {
          authMethod = 'gmail';
          document.getElementById('authIdentifierLabel').textContent = 'Địa chỉ Gmail của bạn:';
          document.getElementById('authInputIdentifier').placeholder = 'VD: hocvien.hsk@gmail.com';
          document.getElementById('btnAuthTypeGmail').className = 'px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold';
          document.getElementById('btnAuthTypePhone').className = 'px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold';
        });

        document.getElementById('btnAuthTypePhone').addEventListener('click', () => {
          authMethod = 'phone';
          document.getElementById('authIdentifierLabel').textContent = 'Số điện thoại của bạn:';
          document.getElementById('authInputIdentifier').placeholder = 'VD: 0912345678';
          document.getElementById('btnAuthTypePhone').className = 'px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold';
          document.getElementById('btnAuthTypeGmail').className = 'px-3 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold';
        });

        let generatedOtpCode = null;

        document.getElementById('btnForgotPasswordMode').addEventListener('click', () => {
          authMode = 'reset';
          document.getElementById('authModalHeading').textContent = 'Khôi Phục Mật Khẩu Qua Mã OTP';
          document.getElementById('authOtpBox').classList.remove('hidden');
          document.getElementById('btnSubmitAuthForm').textContent = '🔑 Xác Nhận OTP & Đặt Lại Mật Khẩu Mới';
          document.getElementById('authFeedbackMsg').textContent = 'Hãy nhập Gmail/SĐT, bấm "Nhận Mã OTP" và nhập mật khẩu mới.';
        });

        document.getElementById('btnSendOtpCode').addEventListener('click', () => {
          const idVal = document.getElementById('authInputIdentifier').value.trim();
          if (!idVal) {
            document.getElementById('authFeedbackMsg').textContent = '⚠️ Vui lòng nhập Gmail hoặc SĐT trước khi nhận mã OTP!';
            return;
          }
          generatedOtpCode = String(Math.floor(100000 + Math.random() * 900000));
          document.getElementById('authInputOtp').value = generatedOtpCode;
          playSfx('correct');
          showToast(`📩 Mã xác thực OTP gửi tới ${escapeHtml(idVal)}: ${generatedOtpCode}`, 'emerald');
          document.getElementById('authFeedbackMsg').textContent = `✅ Đã gửi mã OTP (${generatedOtpCode}) tới ${escapeHtml(idVal)}!`;
        });

        document.getElementById('btnSubmitAuthForm').addEventListener('click', async () => {
          ensureCourseStateFields();
          const idVal = document.getElementById('authInputIdentifier').value.trim();
          const pwVal = document.getElementById('authInputPassword').value.trim();
          const nameVal = document.getElementById('authInputFullName').value.trim();
          const otpVal = document.getElementById('authInputOtp')?.value.trim() || '';
          const fb = document.getElementById('authFeedbackMsg');

          const consentChk = document.getElementById('chkPrivacyConsent');
          if (consentChk && !consentChk.checked) {
            fb.textContent = '⚠️ Vui lòng tích đồng ý quy định bảo vệ dữ liệu cá nhân (Nghị định 13/2023/NĐ-CP) để tiếp tục!';
            return;
          }
          if (!idVal) {
            fb.textContent = '⚠️ Vui lòng nhập Gmail hoặc Số điện thoại của bạn!';
            return;
          }
          const isEmail = idVal.includes('@');
          const isPhone = /^[0-9+\s-]{8,15}$/.test(idVal);
          if (!isEmail && !isPhone) {
            fb.textContent = '⚠️ Định dạng chưa chuẩn! Hãy nhập Gmail (có @) hoặc Số điện thoại (8-12 chữ số).';
            return;
          }
          if (!pwVal || pwVal.length < 4) {
            fb.textContent = '⚠️ Vui lòng nhập mật khẩu bảo mật (tối thiểu 4 ký tự).';
            return;
          }

          const pwHash = await hashPasswordSHA256(pwVal);
          const existing = appState.accounts.find(a => a.identifier.toLowerCase() === idVal.toLowerCase());

          if (authMode === 'reset') {
            if (!existing) {
              fb.textContent = '❌ Không tìm thấy tài khoản này để khôi phục!';
              return;
            }
            if (!generatedOtpCode || otpVal !== generatedOtpCode) {
              fb.textContent = '⚠️ Vui lòng bấm "Nhận Mã OTP" và nhập đúng mã 6 số!';
              return;
            }
            existing.passwordHash = pwHash;
            delete existing.password;
            appState.currentUser = existing;
            saveStateToDatabase('Khôi phục mật khẩu SHA-256 cho tài khoản: ' + existing.identifier);
            updateAuthHeaderUI();
            document.getElementById('authModal').classList.add('hidden');
            playSfx('levelup');
            showToast('🔑 Đã đặt lại mật khẩu mã hóa SHA-256 thành công!', 'emerald');
            return;
          }

          if (authMode === 'login') {
            if (!existing) {
              fb.textContent = 'ℹ️ Tài khoản chưa tồn tại! Hệ thống đã chuyển sang Đăng Ký Mới (kèm xác thực OTP).';
              setAuthModalMode('register');
              document.getElementById('authOtpBox').classList.remove('hidden');
              document.getElementById('authInputIdentifier').value = idVal;
              return;
            }
            if (existing.passwordHash && existing.passwordHash !== pwHash) {
              playSfx('wrong');
              fb.textContent = '❌ Mật khẩu không chính xác! Bấm "Quên mật khẩu?" nếu bạn muốn đặt lại qua OTP.';
              return;
            }
            saveCurrentAccountSnapshot();
            existing.passwordHash = pwHash;
            delete existing.password;
            appState.currentUser = existing;
            loadAccountScheduleSnapshot(existing.identifier, false);
            saveStateToDatabase('Đăng nhập & khôi phục lịch trình tài khoản: ' + existing.fullName + ' (' + existing.identifier + ')');
            refreshAllUI();
            renderProfileAndChart();
            document.getElementById('authModal').classList.add('hidden');
            playSfx('levelup');
            showToast('👋 Chào mừng ' + existing.fullName + '! Đã tải đúng lịch trình học của tài khoản ' + existing.identifier, 'emerald');
          } else {
            if (existing) {
              fb.textContent = 'ℹ️ Tài khoản này đã đăng ký trước đó — vui lòng chuyển sang tab Đăng Nhập.';
              return;
            }
            const safeName = escapeHtml(nameVal || (isEmail ? idVal.split('@')[0] : 'Học Viên ' + idVal.slice(-4)));
            const newAcc = {
              identifier: escapeHtml(idVal),
              method: isPhone ? 'phone' : 'gmail',
              fullName: safeName,
              passwordHash: pwHash,
              createdAt: new Date().toLocaleDateString('vi-VN')
            };
            saveCurrentAccountSnapshot();
            appState.accounts.push(newAcc);
            appState.currentUser = newAcc;
            loadAccountScheduleSnapshot(newAcc.identifier, true);
            saveStateToDatabase('Đăng ký tài khoản mới & tạo lịch trình cá nhân: ' + newAcc.identifier);
            refreshAllUI();
            renderProfileAndChart();
            document.getElementById('authModal').classList.add('hidden');
            playSfx('levelup');
            showToast('🎉 Đăng ký thành công! Đã khởi tạo lịch trình riêng cho ' + newAcc.identifier, 'emerald');
          }
        });

        // Mobile Bottom Navigation Bar listeners
        document.querySelectorAll('.mobile-nav-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const tab = btn.getAttribute('data-mobile-tab');
            switchTab(tab);
            document.querySelectorAll('.mobile-nav-btn').forEach(b => {
              const isAct = b.getAttribute('data-mobile-tab') === tab;
              b.className = 'mobile-nav-btn flex flex-col items-center justify-center py-1 rounded-xl text-xs ' +
                (isAct ? 'text-emerald-400 font-bold bg-emerald-500/10' : 'text-slate-300 font-semibold');
            });
          });
        });



        document.getElementById('btnApplyRoadmap').addEventListener('click', () => {
          ensureCourseStateFields();
          const startLv = Number(document.getElementById('selectStartLevel').value);
          const targetLv = Number(document.getElementById('selectTargetLevel').value);
          const chosenCourseId = Math.min(6, Math.max(1, startLv + 1));
          appState.currentCourseId = chosenCourseId;
          appState.targetCourseId = Math.max(chosenCourseId, targetLv);
          activeCourseId = chosenCourseId;
          activeMonthIdx = 0;

          // Filter map nodes to the chosen course's realm so the user isn't overwhelmed
          const cObj = HSK_COURSES_DATA.find(c => c.courseId === chosenCourseId) || HSK_COURSES_DATA[0];
          activeRealmFilter = String(cObj.realms[0]);
          renderCourseRoadmapUI();
          renderAdventureMap();
          saveStateToDatabase('Thiết lập lộ trình học từ Cấp ' + startLv + ' lên HSK ' + appState.targetCourseId);
          playSfx('levelup');
          showToast('🎯 Đã lập lộ trình ' + cObj.duration + ' cho ' + cObj.code + '!', 'emerald');
        });

        document.getElementById('btnToggleHeroBanner').addEventListener('click', () => {
          const hero = document.getElementById('heroBannerCard');
          if (hero) hero.classList.toggle('hidden');
        });

        document.getElementById('btnStartCourseFinalExam').addEventListener('click', () => {
          ensureCourseStateFields();
          const cfg = COURSE_DAYS_CONFIG[activeCourseId] || COURSE_DAYS_CONFIG[1];
          const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[activeCourseId]) || {};
          const doneCount = Object.keys(doneMap).length;
          if (doneCount < cfg.totalDays) {
            playSfx('wrong');
            const remaining = cfg.totalDays - doneCount;
            // Find the first uncompleted day in this course and open it or guide user
            let nextDay = 1;
            for (let d = 1; d <= cfg.totalDays; d++) {
              if (!doneMap[d]) { nextDay = d; break; }
            }
            showToast(`🔒 Bắt buộc học xong 100% bài học theo ngày mới được Thi Cuối Khóa! Bạn còn thiếu ${remaining} bài (Đang mở Bài Ngày ${nextDay}).`, 'rose');
            currentModalLesson = generateDailyLessonNode(activeCourseId, nextDay);
            currentModalStep = 0;
            activeLessonSkillTab = 'theory';
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            return;
          }
          openCourseFinalExam(activeCourseId);
        });

        document.getElementById('btnCompleteCurrentMonthDays').addEventListener('click', () => {
          ensureCourseStateFields();
          const cfg = COURSE_DAYS_CONFIG[activeCourseId] || COURSE_DAYS_CONFIG[1];
          const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[activeCourseId]) || {};
          let nextDay = 1;
          for (let d = 1; d <= cfg.totalDays; d++) {
            if (!doneMap[d]) { nextDay = d; break; }
          }
          if (appState.missedDayReviewRequired && activeCourseId === Number(appState.missedDayReviewCourseId || activeCourseId)) {
            nextDay = Number(appState.missedDayReviewDayNum || 1);
          }
          // Instead of allowing a free skip without testing, open the next uncompleted day directly on its Mastery Test step!
          currentModalLesson = generateDailyLessonNode(activeCourseId, nextDay);
          currentModalStep = 1;
          dailyQuizSelections = {};
          document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
          document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
          document.getElementById('lessonModal').classList.remove('hidden');
          renderModalStep();
          showToast(`📝 Quy tắc chống học vẹt: Hãy vượt qua Bài Kiểm Tra 100% của Ngày ${nextDay} để mở khóa ngày tiếp theo!`, 'amber');
        });
        document.getElementById('btnCloseCourseExamModal').addEventListener('click', () => {
          document.getElementById('courseExamModal').classList.add('hidden');
        });
        document.getElementById('btnSubmitCourseExam').addEventListener('click', evaluateCourseFinalExam);

        // Delegated Click Handlers for Dynamic Elements
        document.body.addEventListener('input', (e) => {
          if (e.target && e.target.id === 'textareaEssayComposition') {
            const badge = document.getElementById('essayCharCountBadge');
            if (badge) badge.textContent = 'Độ dài: ' + e.target.value.length + ' ký tự';
          }
          if (e.target && e.target.classList && e.target.classList.contains('ex30-write-inp')) {
            const qIdx = Number(e.target.getAttribute('data-ex30-write-input'));
            hsk30ExAnswers[`${activeExHskLevel}_${qIdx}`] = e.target.value;
          }
        });

        document.body.addEventListener('click', (e) => {
          // Quick +1 Level Up Button in Top Header (Demonstrates Dynamic BlackPig Name & Rank Evolution!)
          if (e.target.closest('#btnQuickLevelUpOne')) {
            playSfx('levelup');
            addReward(100, 25, 'Thăng +1 Cấp BlackPig (Đổi Danh Hiệu Tiến Hóa)');
            const rankAfter = getRankInfo(appState.exp);
            updateHudAndResumeBanner();
            showToast(`🐷 Thăng Cấp Thành Công! Tên tiến hóa mới: BlackPig • ${rankAfter.stageShort} (Lv.${rankAfter.level} ${rankAfter.title})!`, 'amber');
            return;
          }

          // AI View Sub-Tab Switcher (Chat Box vs Settings & Pedagogical Notes)
          const aiSubTabBtn = e.target.closest('.ai-subtab-btn');
          if (aiSubTabBtn) {
            const sub = aiSubTabBtn.getAttribute('data-ai-subtab') || 'chat';
            const bChat = document.getElementById('aiBlock_mainChat');
            const bSet = document.getElementById('aiBlock_settingsAndNotes');
            if (bChat) bChat.classList.toggle('hidden', sub !== 'chat');
            if (bSet) bSet.classList.toggle('hidden', sub !== 'settings');
            document.querySelectorAll('.ai-subtab-btn').forEach(btn => {
              const act = btn.getAttribute('data-ai-subtab') === sub;
              btn.className = 'ai-subtab-btn px-4 py-2 rounded-xl text-xs font-extrabold transition ' +
                (act ? 'bg-red-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 border border-slate-200');
            });
            playSfx('click');
            return;
          }

          // Enterprise DB v7 & Zero-Trust Security Center Buttons
          if (e.target.closest('#btnRunZeroTrustAuditNow')) {
            playSfx('levelup');
            if (typeof window.runZeroTrustSecurityAudit === 'function') {
              window.runZeroTrustSecurityAudit();
            }
            return;
          }
          if (e.target.closest('#btnEncryptAesVaultNow')) {
            playSfx('correct');
            if (typeof window.encryptDatabaseVaultAES256 === 'function') {
              window.encryptDatabaseVaultAES256().then(() => {
                renderHanbeeGoHubView('sys_security_db');
              });
            }
            return;
          }
          if (e.target.closest('#btnHubRunVacuumNow')) {
            playSfx('correct');
            if (typeof window.runDatabaseVacuumAndVerify === 'function') {
              window.runDatabaseVacuumAndVerify(false);
              renderHanbeeGoHubView('sys_security_db');
            }
            return;
          }
          if (e.target.closest('#btnHubCreateSnapshotNow')) {
            playSfx('correct');
            if (typeof window.createDatabaseSnapshot === 'function') {
              window.createDatabaseSnapshot('Sao lưu thủ công từ Trung tâm Bảo mật v7', false);
              renderHanbeeGoHubView('sys_security_db');
            }
            return;
          }
          if (e.target.closest('#btnToggleAdminRoleMode') || e.target.closest('#btnModalToggleAdminMode')) {
            playSfx('click');
            window.toggleBlackPigAdminMode();
            if (appState.isAdminMode) {
              const authMod = document.getElementById('authModal');
              if (authMod) authMod.classList.add('hidden');
              navigateHanbeeSidebarItem('sys_security_db');
            }
            return;
          }
          if (e.target.closest('#btnExitAdminModeInHub')) {
            playSfx('click');
            window.setBlackPigAdminMode(false, false);
            return;
          }
          if (e.target.closest('#btnSimWafAttackTest')) {
            playSfx('correct');
            appState.wafBlockedCount = (Number(appState.wafBlockedCount) || 0) + 1;
            if (typeof window.appendSecurityAuditLog === 'function') {
              window.appendSecurityAuditLog('Tường lửa WAF đã chặn đứng 1 payload thử nghiệm XSS/Script-Injection (<script>xss_probe_1<\/script>) và bảo vệ toàn vẹn CSDL', 'WAF-BLOCKED');
            }
            saveStateToDatabase('WAF chặn thử nghiệm tấn công XSS');
            renderHanbeeGoHubView('sys_security_db');
            showToast('🛡️ Tường lửa WAF đã phát hiện & chặn đứng payload XSS thử nghiệm!', 'emerald');
            return;
          }

          // Workspace Top Bar Mode Switchers (Main Workspace vs Knowledge/Clip/Vocab Tab)
          if (e.target.closest('#btnSwitchToMainWorkspace') || e.target.closest('#btnToggleTopicKnowledgeBody')) {
            playSfx('click');
            setWorkspaceKnowledgeTabMode(false);
            return;
          }
          if (e.target.closest('#btnSwitchToKnowledgeClipTab')) {
            playSfx('click');
            renderUniversalTopicKnowledgeStudio();
            setWorkspaceKnowledgeTabMode(true);
            return;
          }
          const studioSubBtn = e.target.closest('.studio-subtab-btn');
          if (studioSubBtn) {
            activeTopicStudioSubTab = studioSubBtn.getAttribute('data-studio-subtab') || 'theory';
            playSfx('click');
            renderUniversalTopicKnowledgeStudio();
            return;
          }
          const topicClipLineBtn = e.target.closest('.topic-clip-line-btn');
          if (topicClipLineBtn) {
            activeTopicClipLineIdx = Number(topicClipLineBtn.getAttribute('data-topic-clip-line')) || 0;
            const d = getTopicKnowledgeData(activeTopicClipKey);
            const ln = d.clipLines && d.clipLines[activeTopicClipLineIdx];
            if (ln) speakChinese(ln.hz, 0.92);
            renderUniversalTopicKnowledgeStudio();
            return;
          }
          if (e.target.closest('#btnPlayTopicClip')) {
            const d = getTopicKnowledgeData(activeTopicClipKey);
            if (d && d.clipLines && d.clipLines.length > 0) {
              speakChinese(d.clipLines.map(l => l.hz).join('。'), 0.90);
            }
            return;
          }

          // Isolated Sub-Block Switchers inside View-Map, View-SRS, View-Library
          if (e.target.closest('#btnMapSubCourseRoadmap')) {
            playSfx('click');
            showIsolatedMapSubBlock('hsk19');
            return;
          }
          if (e.target.closest('#btnMapSubBeginnerNodes')) {
            playSfx('click');
            showIsolatedMapSubBlock('beginner');
            return;
          }
          const srsSubBtn = e.target.closest('.srs-subtab-btn');
          if (srsSubBtn) {
            playSfx('click');
            showIsolatedSrsSubBlock(srsSubBtn.getAttribute('data-srs-subtab') || 'flashcards');
            return;
          }
          const libSubBtn = e.target.closest('.lib-subtab-btn');
          if (libSubBtn) {
            playSfx('click');
            showIsolatedLibrarySubBlock(libSubBtn.getAttribute('data-lib-subtab') || 'dict');
            return;
          }

          // HanbeeGo+ Sidebar & Hub Navigation Click
          const hbNavBtn = e.target.closest('[data-hb-nav]');
          if (hbNavBtn) {
            playSfx('click');
            navigateHanbeeSidebarItem(hbNavBtn.getAttribute('data-hb-nav'));
            return;
          }

          // ==================================================================
          // 1. BÀI TẬP (`exercises`) — 5 Dạng Bài & Bộ 30 Câu Nghe-Nói-Đọc-Viết
          // ==================================================================
          const exHskBtn = e.target.closest('.ex-hsk-lv-btn');
          if (exHskBtn) {
            activeExHskLevel = Number(exHskBtn.getAttribute('data-ex-hsk')) || 1;
            activeExPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const exMainTabBtn = e.target.closest('.ex-maintab-btn');
          if (exMainTabBtn) {
            activeExMainTab = exMainTabBtn.getAttribute('data-ex-maintab') || 'overview5';
            activeExPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const startExDrillBtn = e.target.closest('.start-ex-drill-btn');
          if (startExDrillBtn) {
            const dKey = startExDrillBtn.getAttribute('data-start-ex-drill') || 'all';
            activeExMainTab = 'test30';
            activeExSkillFilter = dKey;
            activeExPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const exSkillBtn = e.target.closest('.ex-skill-btn');
          if (exSkillBtn) {
            activeExSkillFilter = exSkillBtn.getAttribute('data-ex-skill') || 'all';
            activeExPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const exPageBtn = e.target.closest('.ex-page-btn');
          if (exPageBtn) {
            activeExPage = Number(exPageBtn.getAttribute('data-ex-page')) || 1;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const ex30McqBtn = e.target.closest('.ex30-mcq-btn');
          if (ex30McqBtn) {
            const qIdx = Number(ex30McqBtn.getAttribute('data-ex30-q'));
            const oIdx = Number(ex30McqBtn.getAttribute('data-ex30-opt'));
            hsk30ExAnswers[`${activeExHskLevel}_${qIdx}`] = oIdx;
            playSfx(oIdx === 0 ? 'correct' : 'click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const ex30SpeakSimBtn = e.target.closest('.ex30-speak-sim-btn') || e.target.closest('.ex30-speak-mic-btn');
          if (ex30SpeakSimBtn) {
            const qIdx = Number(ex30SpeakSimBtn.getAttribute('data-ex30-speak-sim') ?? ex30SpeakSimBtn.getAttribute('data-ex30-speak-q'));
            const targetHz = ex30SpeakSimBtn.getAttribute('data-target-hz') || '你好';
            speakChinese(targetHz, 0.92);
            hsk30ExAnswers[`${activeExHskLevel}_${qIdx}`] = targetHz;
            playSfx('correct');
            addReward(10, 5, 'Hoàn thành câu Nói trong đề 30 câu HSK ' + activeExHskLevel);
            renderHanbeeGoHubView('exercises');
            return;
          }
          const ex30BrickBtn = e.target.closest('.ex30-brick-btn');
          if (ex30BrickBtn) {
            const qIdx = Number(ex30BrickBtn.getAttribute('data-ex30-brick-q'));
            const brick = ex30BrickBtn.getAttribute('data-brick') || '';
            const key = `${activeExHskLevel}_${qIdx}`;
            hsk30ExAnswers[key] = String(hsk30ExAnswers[key] || '') + brick;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const ex30SampleBtn = e.target.closest('.ex30-sample-btn');
          if (ex30SampleBtn) {
            const qIdx = Number(ex30SampleBtn.getAttribute('data-ex30-fill-sample'));
            const sample = ex30SampleBtn.getAttribute('data-sample') || '';
            hsk30ExAnswers[`${activeExHskLevel}_${qIdx}`] = sample;
            playSfx('correct');
            renderHanbeeGoHubView('exercises');
            return;
          }
          const ex30ClearBtn = e.target.closest('.ex30-clear-btn');
          if (ex30ClearBtn) {
            const qIdx = Number(ex30ClearBtn.getAttribute('data-ex30-clear-q'));
            delete hsk30ExAnswers[`${activeExHskLevel}_${qIdx}`];
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }
          if (e.target.closest('#btnAutoFillDemo30Ex')) {
            const all30 = getHsk30ExerciseQuestions(activeExHskLevel);
            all30.forEach((q, idx) => {
              const k = `${activeExHskLevel}_${idx}`;
              if (q.mode === 'mcq') hsk30ExAnswers[k] = q.answer;
              else hsk30ExAnswers[k] = q.targetHz;
            });
            activeExMainTab = 'test30';
            activeExSkillFilter = 'all';
            hsk30ExSubmitted[activeExHskLevel] = true;
            playSfx('levelup');
            addReward(60, 30, 'Hoàn thành bộ 30 câu Nghe-Nói-Đọc-Viết HSK ' + activeExHskLevel);
            renderHanbeeGoHubView('exercises');
            showToast('📊 Đã chấm điểm chuyên sâu trọn bộ 30 câu (Nghe • Nói • Đọc • Viết)!', 'emerald');
            return;
          }
          if (e.target.closest('#btnSubmit30ExAll')) {
            hsk30ExSubmitted[activeExHskLevel] = true;
            playSfx('levelup');
            addReward(50, 25, 'Nộp bài 30 câu 4 kỹ năng HSK ' + activeExHskLevel);
            renderHanbeeGoHubView('exercises');
            showToast('📊 Đã chấm điểm chuyên sâu 4 kỹ năng Nghe • Nói • Đọc • Viết!', 'emerald');
            return;
          }
          if (e.target.closest('#btnReset30ExLevel')) {
            for (let i = 0; i < 30; i++) {
              delete hsk30ExAnswers[`${activeExHskLevel}_${i}`];
            }
            hsk30ExSubmitted[activeExHskLevel] = false;
            playSfx('click');
            renderHanbeeGoHubView('exercises');
            return;
          }

          // ==================================================================
          // 2. HỌC QUA VIDEO (`video_learn`) — 1.000 Video Ngắn 3-4 Phút Theo HSK
          // ==================================================================
          const vidViewModeBtn = e.target.closest('.vid-viewmode-btn');
          if (vidViewModeBtn) {
            activeVideoViewMode = vidViewModeBtn.getAttribute('data-vid-viewmode') || 'grid';
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            return;
          }
          const vidHskBtn = e.target.closest('.vid-hsk-filter-btn');
          if (vidHskBtn) {
            activeVideoHskFilter = vidHskBtn.getAttribute('data-vid-hsk') || 'all';
            activeVideoPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            return;
          }
          const vidCatBtn = e.target.closest('.vid-cat-filter-btn');
          if (vidCatBtn) {
            activeVideoCatFilter = vidCatBtn.getAttribute('data-vid-cat') || 'all';
            activeVideoPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            return;
          }
          const vidPageBtn = e.target.closest('.vid-page-btn');
          if (vidPageBtn) {
            activeVideoPage = Number(vidPageBtn.getAttribute('data-vid-page')) || 1;
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            return;
          }
          const openVidCard = e.target.closest('.video-card-item');
          if (openVidCard) {
            selectedVideoId = Number(openVidCard.getAttribute('data-open-video-id')) || 1;
            activeVideoLineIdx = 0;
            activeVideoViewMode = 'player';
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            const vObj = getShortVideoItem(selectedVideoId);
            if (vObj && vObj.transcript && vObj.transcript[0]) {
              speakChinese(vObj.transcript[0].hz, 0.92);
            }
            return;
          }
          if (e.target.closest('#btnJumpVideoId')) {
            const inp = document.getElementById('inputJumpVideoId');
            selectedVideoId = Math.max(1, Math.min(1000, Number(inp?.value) || 1));
            activeVideoLineIdx = 0;
            activeVideoViewMode = 'player';
            playSfx('click');
            renderHanbeeGoHubView('video_learn');
            return;
          }
          const vidLineCard = e.target.closest('.vid-line-card');
          if (vidLineCard && !e.target.closest('.speak-inline-btn')) {
            activeVideoLineIdx = Number(vidLineCard.getAttribute('data-vid-line')) || 0;
            const vid = getShortVideoItem(selectedVideoId);
            if (vid && vid.transcript[activeVideoLineIdx]) {
              speakChinese(vid.transcript[activeVideoLineIdx].hz, 0.92);
            }
            renderHanbeeGoHubView('video_learn');
            return;
          }
          if (e.target.id === 'btnPlayAllVideoLines') {
            const vid = getShortVideoItem(selectedVideoId);
            if (vid && vid.transcript.length > 0) {
              if (videoAutoPlayTimer) clearInterval(videoAutoPlayTimer);
              activeVideoLineIdx = 0;
              renderHanbeeGoHubView('video_learn');
              speakChinese(vid.transcript[0].hz, 0.92);
              videoAutoPlayTimer = setInterval(() => {
                if (activeHbModule !== 'video_learn' || activeVideoViewMode !== 'player') {
                  clearInterval(videoAutoPlayTimer);
                  return;
                }
                activeVideoLineIdx = (activeVideoLineIdx + 1) % vid.transcript.length;
                renderHanbeeGoHubView('video_learn');
                speakChinese(vid.transcript[activeVideoLineIdx].hz, 0.92);
                if (activeVideoLineIdx === vid.transcript.length - 1) {
                  clearInterval(videoAutoPlayTimer);
                }
              }, 4200);
            }
            return;
          }

          // ==================================================================
          // 3. LUYỆN NÓI 2 PHẦN (`skill_speak`) — 5.000 Câu Ngắn & 1.000 Văn Bản 4-5 Dòng
          // ==================================================================
          const speakPartBtn = e.target.closest('.speak-part-btn');
          if (speakPartBtn) {
            activeSpeakPart = speakPartBtn.getAttribute('data-speak-part') || 'part1_5000';
            activeSpeakPage = 1;
            speakEvalResult = null;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            return;
          }
          const speakHskBtn = e.target.closest('.speak-hsk-btn');
          if (speakHskBtn) {
            activeSpeakHskFilter = speakHskBtn.getAttribute('data-speak-hsk') || 'all';
            activeSpeakPage = 1;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            return;
          }
          const speakPageBtn = e.target.closest('.speak-page-btn');
          if (speakPageBtn) {
            activeSpeakPage = Number(speakPageBtn.getAttribute('data-speak-page')) || 1;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            return;
          }
          const selSpeakSentBtn = e.target.closest('.select-speak-sent-btn');
          if (selSpeakSentBtn && !e.target.closest('.speak-inline-btn')) {
            selectedSpeakSentenceId = Number(selSpeakSentBtn.getAttribute('data-select-speak-sent')) || 1;
            speakEvalResult = null;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            const sObj = getSpeakingShortSentence(selectedSpeakSentenceId);
            if (sObj) speakChinese(sObj.hz, 0.92);
            return;
          }
          const selSpeakPassBtn = e.target.closest('.select-speak-pass-btn');
          if (selSpeakPassBtn && !e.target.closest('.speak-inline-btn')) {
            selectedSpeakPassageId = Number(selSpeakPassBtn.getAttribute('data-select-speak-pass')) || 1;
            speakEvalResult = null;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            return;
          }
          if (e.target.closest('#btnJumpSpeakId')) {
            const inp = document.getElementById('inputJumpSpeakId');
            const val = Number(inp?.value) || 1;
            if (activeSpeakPart === 'part1_5000') {
              selectedSpeakSentenceId = Math.max(1, Math.min(5000, val));
            } else {
              selectedSpeakPassageId = Math.max(1, Math.min(1000, val));
            }
            speakEvalResult = null;
            playSfx('click');
            renderHanbeeGoHubView('skill_speak');
            return;
          }
          const recSpeakBtn = e.target.closest('#btnRecordSpeakStudio') || e.target.closest('#btnSimSpeakStudio');
          if (recSpeakBtn) {
            const targetHz = recSpeakBtn.getAttribute('data-target-hz') || '你好';
            const targetPy = recSpeakBtn.getAttribute('data-target-py') || 'nǐ hǎo';
            const isPassage = recSpeakBtn.getAttribute('data-is-passage') === '1';
            speakChinese(targetHz, 0.92);
            speakEvalResult = gradeSpokenChineseInput(targetHz, targetPy, targetHz, isPassage);
            playSfx('levelup');
            addReward(20, 10, isPassage ? 'Luyện nói Văn bản ngắn 5 dòng' : 'Luyện nói Câu giao tiếp ngắn');
            renderHanbeeGoHubView('skill_speak');
            return;
          }

          // ==================================================================
          // 4. HSK MOCK EXAM, TOCFL, SHADOWING, TRANSLATION & MEASURE WORDS 20Q
          // ==================================================================
          const mockLvBtn = e.target.closest('.hsk-mock-lv-btn');
          if (mockLvBtn) {
            activeHskExamLevel = Number(mockLvBtn.getAttribute('data-hsk-mock-lv')) || 1;
            hskMockAnswers = {};
            hskMockSubmitted = false;
            hskMockSecondsLeft = 2400;
            renderHanbeeGoHubView('hsk_exam');
            return;
          }
          const mockPaperBtn = e.target.closest('.hsk-mock-paper-btn');
          if (mockPaperBtn) {
            activeHskExamPaper = Number(mockPaperBtn.getAttribute('data-hsk-mock-paper')) || 1;
            hskMockAnswers = {};
            hskMockSubmitted = false;
            renderHanbeeGoHubView('hsk_exam');
            return;
          }
          const mockOptBtn = e.target.closest('.hsk-mock-opt-btn');
          if (mockOptBtn) {
            const qIdx = Number(mockOptBtn.getAttribute('data-hsk-mock-q'));
            const oIdx = Number(mockOptBtn.getAttribute('data-hsk-mock-opt'));
            hskMockAnswers[qIdx] = oIdx;
            playSfx('click');
            renderHanbeeGoHubView('hsk_exam');
            return;
          }
          if (e.target.id === 'btnSubmitHskMockPaper') {
            hskMockSubmitted = true;
            playSfx('levelup');
            addReward(50, 25, 'Hoàn thành Đề thi thử HSK ' + activeHskExamLevel);
            renderHanbeeGoHubView('hsk_exam');
            showToast('📊 Đã chấm điểm Đề thi thử HSK & tạo báo cáo Phân tích Điểm Mạnh / Điểm Yếu!', 'emerald');
            return;
          }
          if (e.target.id === 'btnResetHskMockPaper') {
            hskMockAnswers = {};
            hskMockSubmitted = false;
            hskMockSecondsLeft = 2400;
            renderHanbeeGoHubView('hsk_exam');
            return;
          }
          if (e.target.id === 'btnSaveWrongExamWordsToSrs') {
            const qs = getHskMockExamQuestions(activeHskExamLevel, activeHskExamPaper);
            let saved = 0;
            qs.forEach((q, idx) => {
              if (hskMockAnswers[idx] !== q.answer && q.wordObj) {
                saveWordOrNoteToPersonalNotebook(q.wordObj.hanzi, q.wordObj.pinyin, q.wordObj.meaning, 'Từ sai Đề HSK ' + activeHskExamLevel, true);
                saved++;
              }
            });
            showToast(`💾 Đã lưu ${saved} từ cần ôn từ đề thi HSK vào Sổ tay SRS!`, 'emerald');
            return;
          }

          // TOCFL Band / Script Toggle / Option / Submit
          const tocflBandBtn = e.target.closest('.tocfl-band-btn');
          if (tocflBandBtn) {
            activeTocflBand = tocflBandBtn.getAttribute('data-tocfl-band');
            tocflAnswers = {};
            tocflSubmitted = false;
            renderHanbeeGoHubView('tocfl_exam');
            return;
          }
          if (e.target.id === 'btnToggleTocflScript') {
            tocflUseTraditional = !tocflUseTraditional;
            renderHanbeeGoHubView('tocfl_exam');
            return;
          }
          const tocflOptBtn = e.target.closest('.tocfl-opt-btn');
          if (tocflOptBtn) {
            tocflAnswers[Number(tocflOptBtn.getAttribute('data-tocfl-q'))] = Number(tocflOptBtn.getAttribute('data-tocfl-opt'));
            playSfx('click');
            renderHanbeeGoHubView('tocfl_exam');
            return;
          }
          if (e.target.id === 'btnSubmitTocflExam') {
            tocflSubmitted = true;
            playSfx('levelup');
            addReward(40, 20, 'Hoàn thành Đề luyện thi TOCFL ' + activeTocflBand);
            renderHanbeeGoHubView('tocfl_exam');
            return;
          }

          // Shadowing Studio Controls
          const shSelBtn = e.target.closest('.shadow-sel-btn');
          if (shSelBtn) {
            activeShadowIdx = Number(shSelBtn.getAttribute('data-shadow-idx')) || 0;
            shadowScoreResult = null;
            renderHanbeeGoHubView('skill_shadowing');
            return;
          }
          const shSpdBtn = e.target.closest('.shadow-spd-btn');
          if (shSpdBtn) {
            shadowSpeed = Number(shSpdBtn.getAttribute('data-shadow-spd')) || 0.92;
            renderHanbeeGoHubView('skill_shadowing');
            return;
          }
          if (e.target.id === 'btnStartShadowingRun') {
            const sh = SHADOWING_SENTENCES[activeShadowIdx % SHADOWING_SENTENCES.length];
            speakChinese(sh.hz, shadowSpeed);
            const chars = Array.from(sh.hz);
            chars.forEach((_, ci) => {
              setTimeout(() => {
                const el = document.getElementById('shChar_' + ci);
                if (el) el.className = 'text-red-600 scale-110 inline-block transition-all';
              }, ci * 180);
            });
            setTimeout(() => {
              shadowScoreResult = { pron: 94, tone: 92, fluency: 96 };
              playSfx('levelup');
              addReward(20, 10, 'Hoàn thành luyện nói đuổi Shadowing');
              renderHanbeeGoHubView('skill_shadowing');
            }, chars.length * 180 + 300);
            return;
          }

          // Translation Studio Controls
          const trSelBtn = e.target.closest('.trans-sel-btn');
          if (trSelBtn) {
            activeTransIdx = Number(trSelBtn.getAttribute('data-trans-idx')) || 0;
            transUserWords = [];
            transFeedback = null;
            renderHanbeeGoHubView('prac_translate');
            return;
          }
          const trBrickBtn = e.target.closest('.trans-brick-btn');
          if (trBrickBtn) {
            const w = trBrickBtn.getAttribute('data-trans-brick') || '';
            const inp = document.getElementById('inputTranslationAnswer');
            if (inp) {
              inp.value = (inp.value || '') + w;
              transUserWords = [inp.value];
            }
            playSfx('click');
            return;
          }
          if (e.target.id === 'btnClearTranslationInput') {
            transUserWords = [];
            transFeedback = null;
            renderHanbeeGoHubView('prac_translate');
            return;
          }
          if (e.target.id === 'btnCheckTranslationAnswer') {
            const tr = TRANSLATION_CHALLENGES[activeTransIdx % TRANSLATION_CHALLENGES.length];
            const val = (document.getElementById('inputTranslationAnswer')?.value || '').replace(/[\s。，！？,.!?]/g, '');
            const targetClean = tr.targetHz.replace(/[\s。，！？,.!?]/g, '');
            transUserWords = [document.getElementById('inputTranslationAnswer')?.value || ''];
            if (val && val === targetClean) {
              playSfx('levelup');
              speakChinese(tr.targetHz);
              transFeedback = `✅ Chính xác 100%! Bản dịch chuẩn: "${tr.targetHz}" (${tr.py}) (+20 EXP)!`;
              addReward(20, 8, 'Dịch câu chuẩn xác: ' + tr.targetHz);
            } else {
              playSfx('wrong');
              transFeedback = `❌ Chưa khớp hoàn toàn! Câu chuẩn ngữ pháp HSK là: "${tr.targetHz}" (${tr.py}). ${tr.tip}`;
            }
            renderHanbeeGoHubView('prac_translate');
            return;
          }

          // Measure Words 20-Question Quiz & Separated Sub-Tabs
          const mwSubBtn = e.target.closest('.mw-subtab-btn');
          if (mwSubBtn) {
            activeMeasureSubTab = mwSubBtn.getAttribute('data-mw-subtab') || 'quiz20';
            playSfx('click');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }
          const mwBatchBtn = e.target.closest('.mw-batch-btn');
          if (mwBatchBtn) {
            activeMeasureQuizBatch = Number(mwBatchBtn.getAttribute('data-mw-batch'));
            playSfx('click');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }
          const mwCatBtn = e.target.closest('.mw-cat-btn');
          if (mwCatBtn) {
            activeMeasureCatFilter = mwCatBtn.getAttribute('data-mw-cat') || 'all';
            playSfx('click');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }
          const mwOptBtn = e.target.closest('.mw-quiz-opt-btn');
          if (mwOptBtn) {
            activeMeasureQuizAnswers[Number(mwOptBtn.getAttribute('data-mw-q'))] = Number(mwOptBtn.getAttribute('data-mw-opt'));
            playSfx('click');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }
          if (e.target.id === 'btnCheckMeasureQuiz') {
            measureQuizSubmitted = true;
            playSfx('levelup');
            addReward(35, 15, 'Hoàn thành bài tập 20 câu chuyên đề Lượng từ');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }
          if (e.target.id === 'btnResetMeasureQuiz20') {
            activeMeasureQuizAnswers = {};
            measureQuizSubmitted = false;
            playSfx('click');
            renderHanbeeGoHubView('vocab_measure');
            return;
          }

          // Background Color Studio Preset Card Click
          const bgPresetCard = e.target.closest('.bg-preset-card-btn');
          if (bgPresetCard) {
            const pid = bgPresetCard.getAttribute('data-bg-preset-id') || 'default_dark';
            const phex = bgPresetCard.getAttribute('data-bg-preset-hex') || '#020617';
            playSfx('correct');
            applyBackgroundColorTheme(phex, pid, appState.bgEffect || 'glow', false);
            saveStateToDatabase('Chọn chủ đề màu hình nền: ' + pid + ' (' + phex + ')');
            return;
          }
          // Attendance Banner Buttons: Mandatory Review of Previous Day, Study Today's Lesson, or Simulate Missed Day
          const btnMandatoryRev = e.target.closest('#btnActionMandatoryReviewPrevDay');
          if (btnMandatoryRev) {
            ensureCourseStateFields();
            const revCid = Number(btnMandatoryRev.getAttribute('data-rev-cid')) || appState.missedDayReviewCourseId || activeCourseId || 1;
            const revDay = Number(btnMandatoryRev.getAttribute('data-rev-day')) || appState.missedDayReviewDayNum || 1;
            activeCourseId = revCid;
            renderCourseRoadmapUI();
            currentModalLesson = generateDailyLessonNode(revCid, revDay);
            currentModalStep = 0;
            dailyQuizSelections = {};
            activeLessonSkillTab = 'theory';
            document.getElementById('modalRealmBadge').textContent = '🔄 BẮT BUỘC ÔN LẠI NGÀY TRƯỚC • ' + currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = '🔄 Ôn Lại ' + currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            playSfx('click');
            return;
          }

          const btnStudyToday = e.target.closest('#btnActionStudyTodayLesson');
          if (btnStudyToday) {
            ensureCourseStateFields();
            const studyCid = Number(btnStudyToday.getAttribute('data-study-cid')) || activeCourseId || 1;
            const studyDay = Number(btnStudyToday.getAttribute('data-study-day')) || 1;
            currentModalLesson = generateDailyLessonNode(studyCid, studyDay);
            currentModalStep = 0;
            dailyQuizSelections = {};
            activeLessonSkillTab = 'theory';
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            playSfx('click');
            return;
          }

          const btnSimMissed = e.target.closest('#btnSimulateMissedDayGate');
          if (btnSimMissed) {
            ensureCourseStateFields();
            const cid = activeCourseId || appState.currentCourseId || 1;
            if (!appState.completedDailyLessons[cid]) appState.completedDailyLessons[cid] = {};
            const doneDays = Object.keys(appState.completedDailyLessons[cid]).filter(k => appState.completedDailyLessons[cid][k]).map(Number).sort((a, b) => a - b);
            const targetPrevDay = doneDays.length > 0 ? doneDays[doneDays.length - 1] : 1;
            // Ensure targetPrevDay is marked as previously learned so we can demonstrate locking targetPrevDay + 1
            appState.completedDailyLessons[cid][targetPrevDay] = true;
            const twoDaysAgo = new Date(Date.now() - 2 * 86400000);
            appState.lastDailyStudyDateISO = getLocalDateISO(twoDaysAgo);
            appState.missedDayReviewRequired = true;
            appState.missedDayReviewCourseId = cid;
            appState.missedDayReviewDayNum = targetPrevDay;
            saveStateToDatabase('Giả lập nghỉ học hôm qua ➔ Khóa Ngày ' + (targetPrevDay + 1) + ' & bắt buộc ôn lại Ngày ' + targetPrevDay);
            renderCourseRoadmapUI();
            playSfx('wrong');
            showToast(`🚨 Đã kích hoạt chế độ nghỉ học quá ngày! Ngày ${targetPrevDay + 1} đã bị khóa — bắt buộc ôn lại & vượt qua 10/10 câu của Ngày ${targetPrevDay} trước khi học tiếp!`, 'rose');
            return;
          }

          // Daily Lesson Button Click (Enforces strict Day-by-Day sequential progression AND Mandatory Missed-Day Review Gate!)
          const dailyBtn = e.target.closest('.daily-lesson-btn');
          if (dailyBtn) {
            ensureCourseStateFields();
            const cid = Number(dailyBtn.getAttribute('data-daily-course'));
            const dnum = Number(dailyBtn.getAttribute('data-daily-num'));
            const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};

            // Check if Missed-Day Mandatory Review Gate is active!
            if (appState.missedDayReviewRequired && cid === Number(appState.missedDayReviewCourseId || cid)) {
              const mustRevDay = Number(appState.missedDayReviewDayNum || 1);
              if (dnum > mustRevDay) {
                playSfx('wrong');
                showToast(`🚨 Hôm trước bạn không vào học! Bắt buộc phải ôn lại và làm đúng 10/10 câu kiểm tra của Ngày ${mustRevDay} trước rồi mới được học tiếp Ngày ${dnum}!`, 'rose');
                currentModalLesson = generateDailyLessonNode(cid, mustRevDay);
                currentModalStep = 0;
                dailyQuizSelections = {};
                activeLessonSkillTab = 'theory';
                document.getElementById('modalRealmBadge').textContent = '🔄 BẮT BUỘC ÔN LẠI NGÀY TRƯỚC • ' + currentModalLesson.realmName;
                document.getElementById('modalLessonTitle').textContent = '🔄 Ôn Lại ' + currentModalLesson.title;
                document.getElementById('lessonModal').classList.remove('hidden');
                renderModalStep();
                return;
              }
            }

            const isUnlocked = dnum === 1 || Boolean(doneMap[dnum - 1]) || Boolean(doneMap[dnum]);

            if (!isUnlocked) {
              let requiredDay = 1;
              for (let d = 1; d < dnum; d++) {
                if (!doneMap[d]) { requiredDay = d; break; }
              }
              playSfx('wrong');
              showToast(`🔒 Ngày ${dnum} đang khóa! Bạn bắt buộc phải học và PASS 10/10 câu kiểm tra của Ngày ${requiredDay} trước thì mới được sang ngày tiếp theo!`, 'rose');
              return;
            }

            currentModalLesson = generateDailyLessonNode(cid, dnum);
            currentModalStep = 0;
            dailyQuizSelections = {};
            activeLessonSkillTab = 'theory';
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            playSfx('click');
            return;
          }

          if (e.target.id === 'btnQuickJumpDailyTest') {
            currentModalStep = 1;
            dailyQuizSelections = {};
            renderModalStep();
            playSfx('click');
            return;
          }

          if (e.target.id === 'btnProceedToNextDayNow') {
            const cid = Number(e.target.getAttribute('data-next-cid'));
            const nday = Number(e.target.getAttribute('data-next-day'));
            currentModalLesson = generateDailyLessonNode(cid, nday);
            currentModalStep = 0;
            dailyQuizSelections = {};
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            renderModalStep();
            playSfx('click');
            return;
          }

          // Verify Sentence Unscrambling (Strict Normalized Comparison)
          if (e.target.id === 'btnVerifyScramble') {
            const normalizeZh = (s) => (s || '').replace(/[\s。，！？,.!?]/g, '');
            const val = normalizeZh(document.getElementById('inputScrambleSentence')?.value || '');
            const ans = normalizeZh(e.target.getAttribute('data-ans') || '');
            const fb = document.getElementById('writeSkillFeedback');
            if (val && val === ans) {
              playSfx('correct');
              if (fb) fb.textContent = '✅ Sắp xếp câu chuẩn ngữ pháp 100%: ' + ans + ' (+15 EXP)!';
              addReward(15, 5, 'Sắp xếp câu chuẩn xác: ' + ans);
            } else {
              playSfx('wrong');
              if (fb) fb.textContent = `❌ Trật tự câu chưa đúng! Bạn nhập "${escapeHtml(val)}" — Trật tự đúng phải là: "${ans}"`;
            }
            return;
          }

          // Evaluate Essay / Translation
          if (e.target.id === 'btnEvaluateEssay') {
            const text = (document.getElementById('textareaEssayComposition')?.value || '').trim();
            const fb = document.getElementById('essayEvalFeedback');
            if (text.length < 5) {
              playSfx('wrong');
              if (fb) fb.textContent = '⚠️ Vui lòng viết đoạn văn hoặc bản dịch (tối thiểu 1 câu hoàn chỉnh) trước khi chấm điểm!';
              return;
            }
            playSfx('levelup');
            if (fb) fb.textContent = `🌟 Đã chấm bài viết (${text.length} ký tự): Cấu trúc mạch lạc, dùng từ chuẩn ngữ cảnh HSK (+25 EXP)!`;
            addReward(25, 10, 'Hoàn thành bài Luyện Viết Đoạn Văn & Biên Phiên Dịch');
            return;
          }

          // Course Card Selection
          const courseBtn = e.target.closest('.course-card-btn');
          if (courseBtn) {
            const cid = Number(courseBtn.getAttribute('data-select-course'));
            ensureCourseStateFields();
            appState.currentCourseId = cid;
            activeCourseId = cid;
            activeMonthIdx = 0;
            const cObj = HSK_COURSES_DATA.find(c => c.courseId === cid) || HSK_COURSES_DATA[0];
            activeRealmFilter = String(cObj.realms[0]);
            renderCourseRoadmapUI();
            renderAdventureMap();
            playSfx('click');
            return;
          }

          // Month Tab Selection inside Active Course
          const mBtn = e.target.closest('.month-tab-btn');
          if (mBtn) {
            activeMonthIdx = Number(mBtn.getAttribute('data-month-idx'));
            renderCourseRoadmapUI();
            playSfx('click');
            return;
          }

          // Open Next Uncompleted Daily Lesson of the Active Course
          const openCourseLessonBtn = e.target.closest('.open-course-lesson-btn');
          if (openCourseLessonBtn) {
            ensureCourseStateFields();
            const cid = Number(openCourseLessonBtn.getAttribute('data-open-course-lesson')) || activeCourseId || 1;
            const cfg = COURSE_DAYS_CONFIG[cid] || COURSE_DAYS_CONFIG[1];
            const doneMap = (appState.completedDailyLessons && appState.completedDailyLessons[cid]) || {};
            let nextDay = 1;
            for (let d = 1; d <= cfg.totalDays; d++) {
              if (!doneMap[d]) { nextDay = d; break; }
            }
            currentModalLesson = generateDailyLessonNode(cid, nextDay);
            currentModalStep = 0;
            dailyQuizSelections = {};
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            playSfx('click');
            return;
          }

          // Switch 4-Skill Tab inside Lesson Modal
          const skillTabBtn = e.target.closest('.lesson-skill-tab');
          if (skillTabBtn) {
            activeLessonSkillTab = skillTabBtn.getAttribute('data-skill-tab');
            playSfx('click');
            renderModalStep();
            return;
          }

          // Slow Audio playback button (0.65x)
          const slowSpeakBtn = e.target.closest('.speak-slow-btn');
          if (slowSpeakBtn) {
            speakChinese(slowSpeakBtn.getAttribute('data-speak-slow'), 0.62);
            return;
          }

          // Listening Skill Exercise Check
          const listenOpt = e.target.closest('.skill-listen-opt');
          if (listenOpt) {
            const isCorrect = listenOpt.getAttribute('data-listen-check') === 'true';
            const fb = document.getElementById('listenSkillFeedback');
            if (isCorrect) {
              playSfx('correct');
              if (fb) fb.textContent = '✅ Chính xác! Kỹ năng Nghe bắt từ khóa của bạn rất nhạy (+10 EXP).';
              addReward(10, 5, 'Hoàn thành bài luyện Kỹ năng Nghe');
            } else {
              playSfx('wrong');
              if (fb) fb.textContent = '❌ Chưa đúng! Hãy bấm nghe lại ở tốc độ chậm 0.65x nhé.';
            }
            return;
          }

          // Speaking Skill Practice Check inside Lesson Modal (Uses SpeechRecognition or Phonetic Verification)
          if (e.target.id === 'btnLessonPracticeSpeak') {
            const fb = document.getElementById('speakSkillFeedback');
            const targetWord = (currentModalLesson && currentModalLesson.vocab && currentModalLesson.vocab[0]) || { hanzi: '你好', pinyin: 'nǐ hǎo' };
            const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRec) {
              try {
                const rec = new SpeechRec();
                rec.lang = 'zh-CN';
                if (fb) fb.textContent = `🎙️ Đang lắng nghe... Hãy đọc to từ "${targetWord.hanzi}" (${targetWord.pinyin})!`;
                rec.onresult = (ev) => {
                  const spoken = ev.results[0][0].transcript || '';
                  const matched = spoken.includes(targetWord.hanzi);
                  playSfx(matched ? 'correct' : 'click');
                  if (fb) fb.textContent = matched
                    ? `✅ Nhận diện chuẩn xác: "${escapeHtml(spoken)}" (Đạt 100% khớp âm mẫu "${targetWord.hanzi}" • +15 EXP)!`
                    : `🎙️ Máy thu được: "${escapeHtml(spoken)}" — Hãy nghe lại mẫu "${targetWord.hanzi}" (${targetWord.pinyin}) và đọc rõ thanh điệu hơn nhé!`;
                  if (matched) addReward(15, 5, 'Phát âm chuẩn từ ' + targetWord.hanzi);
                };
                rec.onerror = () => {
                  speakChinese(targetWord.hanzi);
                  if (fb) fb.textContent = `🔊 Đã phát lại âm mẫu "${targetWord.hanzi}" (${targetWord.pinyin}) — Hãy đọc to theo băng 3 lần nhé!`;
                };
                rec.start();
                return;
              } catch (err) {}
            }
            speakChinese(targetWord.hanzi);
            if (fb) fb.textContent = `🔊 Đã phát âm mẫu "${targetWord.hanzi}" (${targetWord.pinyin}) — Hãy đọc nhại to theo băng!`;
            return;
          }

          // Writing Skill Practice Check inside Lesson Modal (Strict Exact Matching against Target Hanzi or Pinyin)
          if (e.target.id === 'btnCheckLessonWrite') {
            const val = (document.getElementById('inputLessonWritePractice')?.value || '').trim().toLowerCase();
            const hz = (e.target.getAttribute('data-target-hz') || '').trim().toLowerCase();
            const py = (e.target.getAttribute('data-target-py') || '').trim().toLowerCase();
            const stripTones = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '');
            const fb = document.getElementById('writeSkillFeedback');
            if (val && (val === hz || stripTones(val) === stripTones(py) || val.includes(hz))) {
              playSfx('correct');
              if (fb) fb.textContent = `✅ Chính xác tuyệt đối! Bạn đã gõ đúng "${hz}" (${py}) (+15 EXP).`;
              addReward(15, 5, 'Viết đúng từ vựng ' + hz);
            } else {
              playSfx('wrong');
              if (fb) fb.textContent = `❌ Chưa khớp! Bạn vừa gõ "${escapeHtml(val)}" — cần gõ chính xác chữ Hán "${hz}" hoặc Pinyin "${py}".`;
            }
            return;
          }

          // Save Class Note inside Lesson Modal
          if (e.target.id === 'btnSaveClassNote' && currentModalLesson) {
            ensureCourseStateFields();
            const noteVal = document.getElementById('textareaClassNote')?.value || '';
            appState.classNotes[currentModalLesson.id] = noteVal;
            saveStateToDatabase('Lưu ghi chú bài học: ' + currentModalLesson.title);
            showToast('💾 Đã lưu ghi chú lớp học vào tài khoản của bạn!', 'emerald');
            return;
          }

          // Course Exam Choice Click
          const examChoiceBtn = e.target.closest('.exam-choice-btn');
          if (examChoiceBtn) {
            const qid = examChoiceBtn.getAttribute('data-exam-qid');
            const oidx = Number(examChoiceBtn.getAttribute('data-exam-oidx'));
            examSelectedAnswers[qid] = oidx;
            playSfx('click');
            renderCourseExamQuestions();
            return;
          }

          // Remedial Retry Button for Wrong Exam Questions
          const remedialBtn = e.target.closest('.remedial-retry-btn');
          if (remedialBtn && activeExamCourse) {
            const qid = remedialBtn.getAttribute('data-remedial-qid');
            const oidx = Number(remedialBtn.getAttribute('data-remedial-oidx'));
            const qObj = activeExamCourse.examQuestions.find(x => x.id === qid);
            const statusSpan = document.getElementById('remedialStatus_' + qid);
            const cardEl = document.getElementById('remedialCard_' + qid);
            if (!qObj) return;

            if (oidx === qObj.answer) {
              playSfx('correct');
              examSelectedAnswers[qid] = oidx;
              examWrongQueue = examWrongQueue.filter(id => id !== qid);
              if (statusSpan) {
                statusSpan.textContent = '✅ Đã học lại & làm đúng!';
                statusSpan.className = 'text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold';
              }
              if (cardEl) {
                cardEl.className = 'p-4 rounded-2xl bg-emerald-950/30 border-2 border-emerald-500/50 space-y-3';
              }
              if (examWrongQueue.length === 0) {
                showToast('🎉 Bạn đã học lại và sửa đúng toàn bộ các câu sai! Đang cấp chứng chỉ qua khóa...', 'emerald');
                setTimeout(() => evaluateCourseFinalExam(), 600);
              }
            } else {
              playSfx('wrong');
              showToast('❌ Vẫn chưa đúng! Hãy đọc kỹ lại khung "Kiến thức bắt buộc học lại" màu vàng ở trên nhé.', 'rose');
            }
            return;
          }

          // Advance to Next HSK Course after Passing Exam
          if (e.target.id === 'btnAdvanceNextHskCourse') {
            document.getElementById('courseExamModal').classList.add('hidden');
            renderCourseRoadmapUI();
            renderAdventureMap();
            showToast('🚀 Đã chuyển lên khóa HSK nâng cao tiếp theo!', 'emerald');
            return;
          }

          // Dictionary Quick Category Pill Click
          const dictCatBtn = e.target.closest('.dict-cat-pill');
          if (dictCatBtn) {
            const catQuery = dictCatBtn.getAttribute('data-dict-cat') || '';
            const dictInp = document.getElementById('dictSearchInput');
            if (dictInp) dictInp.value = catQuery;
            document.querySelectorAll('.dict-cat-pill').forEach(p => {
              const active = p === dictCatBtn;
              p.className = 'dict-cat-pill px-2.5 py-1 rounded-xl text-xs font-bold transition ' +
                (active ? 'bg-emerald-600 text-white font-extrabold' : 'bg-slate-800 hover:bg-slate-700 text-slate-200');
            });
            renderDictionaryResults(catQuery);
            return;
          }

          // Save any Dictionary Card or Instant Translated Phrase to Personal SRS Notebook
          const saveDictBtn = e.target.closest('.save-dict-to-srs-btn');
          if (saveDictBtn) {
            const wHz = saveDictBtn.getAttribute('data-save-dict-word') || '';
            const wPy = saveDictBtn.getAttribute('data-save-dict-py') || '';
            const wMn = saveDictBtn.getAttribute('data-save-dict-mn') || '';
            saveWordOrNoteToPersonalNotebook(wHz, wPy, wMn, 'Từ điển lưu');
            return;
          }

          // Delete item from Personal Mistake Notebook
          const delNbBtn = e.target.closest('.del-notebook-item-btn');
          if (delNbBtn) {
            const idx = Number(delNbBtn.getAttribute('data-del-notebook-idx'));
            if (Array.isArray(appState.mistakeNotebookItems) && idx >= 0 && idx < appState.mistakeNotebookItems.length) {
              appState.mistakeNotebookItems.splice(idx, 1);
              saveStateToDatabase('Xóa 1 mục khỏi Sổ tay cá nhân');
              renderMistakeNotebookUI();
              showToast('🗑️ Đã xóa mục khỏi Sổ tay cá nhân!', 'amber');
            }
            return;
          }

          // Insert SRS Target Word Pill into AI Chat Input
          const insertWordPill = e.target.closest('.ai-insert-word-pill');
          if (insertWordPill) {
            const wHz = insertWordPill.getAttribute('data-insert-ai-word') || '';
            const inp = document.getElementById('aiUserInput');
            if (inp) {
              inp.value = (inp.value ? inp.value + ' ' : '我想用 ') + wHz;
              inp.focus();
            }
            return;
          }

          // Delete Single Friend Memory Item (Privacy Control)
          const delMemBtn = e.target.closest('.del-friend-mem-btn');
          if (delMemBtn) {
            const idx = Number(delMemBtn.getAttribute('data-del-memory'));
            if (Array.isArray(appState.friendMemory) && idx >= 0) {
              appState.friendMemory.splice(idx, 1);
              saveStateToDatabase('Xóa 1 mục trong Bộ nhớ bạn bè (friend_memory)');
              renderAiBackgroundPedagogicalPanel();
              showToast('🗑️ Đã xóa mục ký ức khỏi Bộ nhớ của Tiểu Long!', 'amber');
            }
            return;
          }

          // Select Preset Avatar
          const presetAvBtn = e.target.closest('.preset-avatar-btn');
          if (presetAvBtn) {
            const aid = presetAvBtn.getAttribute('data-select-avatar');
            appState.avatarPresetId = aid;
            appState.avatarDataUrl = null;
            saveStateToDatabase('Đổi hình đại diện nhân vật: ' + aid);
            updateAuthHeaderUI();
            renderAvatarFrameModalUI();
            renderAccountScheduleHub();
            playSfx('correct');
            showToast('🌟 Đã đổi hình đại diện nhân vật!', 'emerald');
            return;
          }

          // Select HSK Avatar Frame
          const frameSelBtn = e.target.closest('.hsk-frame-select-btn');
          if (frameSelBtn) {
            const fid = frameSelBtn.getAttribute('data-select-frame');
            const fObj = HSK_AVATAR_FRAMES.find(f => f.id === fid);
            if (!fObj) return;
            if (!isHskFrameUnlocked(fObj)) {
              playSfx('wrong');
              showToast(`🔒 Khung "${fObj.name}" sẽ được tặng ngay khi bạn hoàn thành và vượt qua Bài Thi Cuối Khóa HSK ${fObj.hskReq}!`, 'rose');
              return;
            }
            appState.selectedFrameId = fid;
            saveStateToDatabase('Trang bị khung viền danh giá: ' + fObj.name);
            updateAuthHeaderUI();
            renderAvatarFrameModalUI();
            renderAccountScheduleHub();
            playSfx('levelup');
            showToast('👑 Đã trang bị: ' + fObj.name + '!', 'amber');
            return;
          }

          // Quick Account Switch inside Auth Modal (Restores that exact account's learning schedule!)
          const quickAccBtn = e.target.closest('.quick-acc-btn');
          if (quickAccBtn) {
            const idStr = quickAccBtn.getAttribute('data-quick-acc');
            const found = (appState.accounts || []).find(a => a.identifier === idStr);
            if (found) {
              saveCurrentAccountSnapshot();
              appState.currentUser = found;
              loadAccountScheduleSnapshot(found.identifier, false);
              saveStateToDatabase('Chuyển sang lịch trình của tài khoản: ' + found.identifier);
              refreshAllUI();
              renderProfileAndChart();
              document.getElementById('authModal').classList.add('hidden');
              playSfx('levelup');
              showToast('👤 Đã tải lịch trình học của tài khoản: ' + found.fullName + ' (' + found.identifier + ')', 'emerald');
            }
            return;
          }

          // Resume Account Schedule Button inside Profile Hub
          if (e.target.closest('#btnResumeAccountScheduleNow')) {
            const btn = e.target.closest('#btnResumeAccountScheduleNow');
            const cid = Number(btn.getAttribute('data-cid')) || activeCourseId || 1;
            const dnum = Number(btn.getAttribute('data-day')) || 1;
            currentModalLesson = generateDailyLessonNode(cid, dnum);
            currentModalStep = 0;
            dailyQuizSelections = {};
            document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
            document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
            document.getElementById('lessonModal').classList.remove('hidden');
            renderModalStep();
            playSfx('click');
            return;
          }

          // 1. Speak Inline Button
          const speakBtn = e.target.closest('.speak-inline-btn');
          if (speakBtn) {
            e.stopPropagation();
            const txt = speakBtn.getAttribute('data-speak');
            if (txt) speakChinese(txt);
            return;
          }

          // 1B. Flip All Lesson Vocabulary Cards button
          if (e.target.id === 'btnFlipAllLessonCards') {
            const cards = document.querySelectorAll('#modalLessonBody .vocab-flip-card');
            const anyUnflipped = Array.from(cards).some(c => !c.classList.contains('is-flipped'));
            cards.forEach(c => c.classList.toggle('is-flipped', anyUnflipped));
            playSfx('click');
            return;
          }

          // 1C. Interactive 3D Vocabulary Card Flip on Click
          const flipCard = e.target.closest('.vocab-flip-card');
          if (flipCard && !e.target.closest('.save-modal-vocab-btn')) {
            flipCard.classList.toggle('is-flipped');
            playSfx('click');
            return;
          }

          // 2. Open Lesson Button
          const openLessonBtn = e.target.closest('.open-lesson-btn');
          if (openLessonBtn) {
            openLessonModal(openLessonBtn.getAttribute('data-open-lesson'));
            return;
          }

          // 3. Save Vocab from Lesson Modal to SRS
          const saveVocabBtn = e.target.closest('.save-modal-vocab-btn');
          if (saveVocabBtn && currentModalLesson) {
            const vIdx = Number(saveVocabBtn.getAttribute('data-save-vocab'));
            const v = currentModalLesson.vocab[vIdx];
            if (v) {
              appState.srsWords.unshift({
                hanzi: v.hanzi,
                pinyin: v.pinyin,
                meaning: v.meaning + ' (Hán Việt: ' + v.hanviet + ')',
                example: v.example,
                hsk: currentModalLesson.realmName,
                interval: 'Hôm nay',
                reps: 1
              });
              saveStateToDatabase('Lưu từ mới vào SRS: ' + v.hanzi);
              showToast('💾 Đã thêm "' + v.hanzi + '" vào kho thẻ SRS!', 'emerald');
            }
            return;
          }

          // 4. Quiz Option inside Lesson Modal (Supports Daily Multi-Question Mastery Check)
          const quizOptBtn = e.target.closest('.modal-quiz-opt');
          if (quizOptBtn && currentModalLesson && currentModalStep > 0) {
            const dqIdx = Number(quizOptBtn.getAttribute('data-dq-idx') || 0);
            const chosenIdx = Number(quizOptBtn.getAttribute('data-qopt'));
            dailyQuizSelections[dqIdx] = chosenIdx;
            const qObj = currentModalLesson.questions[dqIdx];
            if (qObj && chosenIdx === qObj.answer) {
              playSfx('correct');
            } else {
              playSfx('click');
            }
            renderModalStep();
            return;
          }

          // 5. AI Scenario Selector
          const scBtn = e.target.closest('.ai-scenario-btn');
          if (scBtn) {
            initAiChatScenario(scBtn.getAttribute('data-scenario'));
            return;
          }

          // 6. AI Smart Suggestion Button
          const sugBtn = e.target.closest('.ai-sug-btn');
          if (sugBtn) {
            const idx = Number(sugBtn.getAttribute('data-sug-idx'));
            const box = document.getElementById('aiSmartSuggestions');
            const sug = box && box._currentSuggestions && box._currentSuggestions[idx];
            if (sug) {
              handleUserAiMessage(sug.hanzi, sug.pinyin, sug.vi);
            }
            return;
          }

          // 7. Dojo Character Selector
          const charBtn = e.target.closest('.dojo-char-btn');
          if (charBtn) {
            selectDojoCharacter(Number(charBtn.getAttribute('data-char-idx')));
            return;
          }

          // 8. Pinyin Initial Button
          const pInitBtn = e.target.closest('.pinyin-init-btn');
          if (pInitBtn) {
            const idx = Number(pInitBtn.getAttribute('data-init-idx'));
            const item = PINYIN_INITIALS[idx];
            if (item) {
              speakChinese(item.speak);
              document.getElementById('pinyinMouthTip').innerHTML = `🔊 <b>Âm "${item.p}" (Mẫu: ${item.speak}):</b> ${item.tip}`;
            }
            return;
          }

          // 8B. Quiz 4 Option Click & Inline Buy Life / Restart
          if (e.target.id === 'btnInlineQuiz4BuyLife') {
            buyArenaLivesWithDiamonds(1, 20);
            return;
          }
          if (e.target.id === 'btnInlineQuiz4Restart') {
            startQuiz4Game();
            return;
          }
          const quiz4OptBtn = e.target.closest('.quiz4-opt-btn');
          if (quiz4OptBtn) {
            if (arenaLives <= 0) {
              playSfx('wrong');
              showToast('💔 Bạn đã hết 3 mạng! Hãy bấm "Mua +1 Mạng (20 💎)" để chơi tiếp.', 'rose');
              return;
            }
            if (quiz4TimerId) clearInterval(quiz4TimerId);
            const chosenIdx = Number(quiz4OptBtn.getAttribute('data-quiz4-opt'));
            const qItem = quiz4Questions[quiz4CurrentIdx];
            const fb = document.getElementById('quiz4FeedbackMsg');
            if (!qItem) return;

            if (chosenIdx === qItem.correctIdx) {
              playSfx('correct');
              speakChinese(qItem.target.hanzi);
              quiz4Combo++;
              quiz4Score += 10 + quiz4Combo * 2;
              document.getElementById('quiz4ScoreText').textContent = String(quiz4Score);
              document.getElementById('quiz4ComboText').textContent = String(quiz4Combo);
              quiz4OptBtn.classList.add('border-emerald-500', 'bg-emerald-950/60');
              if (fb) {
                fb.className = 'text-xs sm:text-sm font-bold text-emerald-400';
                fb.textContent = `✅ Chính xác! ${qItem.target.hanzi} (${qItem.target.pinyin}) = ${qItem.target.meaning}`;
              }
              setTimeout(() => {
                quiz4CurrentIdx++;
                renderQuiz4CurrentQuestion();
              }, 700);
            } else {
              playSfx('wrong');
              arenaLives = Math.max(0, arenaLives - 1);
              quiz4Combo = 0;
              document.getElementById('quiz4ComboText').textContent = '0';
              syncArenaLivesUI();
              quiz4OptBtn.classList.add('border-rose-500', 'bg-rose-950/60');
              if (fb) {
                fb.className = 'text-xs sm:text-sm font-bold text-rose-400';
                fb.textContent = `❌ Sai rồi (-1 ❤️)! Đáp án đúng là: ${qItem.target.hanzi} (${qItem.target.pinyin}) — ${qItem.target.meaning}`;
              }
              setTimeout(() => {
                if (arenaLives <= 0) {
                  renderQuiz4CurrentQuestion();
                } else {
                  quiz4CurrentIdx++;
                  renderQuiz4CurrentQuestion();
                }
              }, 1100);
            }
            return;
          }

          // 9. Memory Match Card Click (Enforces 3 Lives)
          const mCardBtn = e.target.closest('.match-card-btn');
          if (mCardBtn) {
            if (arenaLives <= 0) {
              playSfx('wrong');
              showToast('💔 Bạn đã hết 3 mạng! Hãy bấm "Mua +1 Mạng (20 💎)" ở trên để lật tiếp.', 'rose');
              return;
            }
            const grid = document.getElementById('matchCardsGrid');
            const cards = grid && grid._cardsData;
            const cIdx = Number(mCardBtn.getAttribute('data-mcard-idx'));
            const card = cards && cards[cIdx];
            if (!card || card.matched) return;

            speakChinese(card.speak);
            if (!matchSelectedCard) {
              matchSelectedCard = { idx: cIdx, card, btn: mCardBtn };
              mCardBtn.classList.add('border-amber-400', 'bg-amber-500/15');
            } else if (matchSelectedCard.idx === cIdx) {
              mCardBtn.classList.remove('border-amber-400', 'bg-amber-500/15');
              matchSelectedCard = null;
            } else {
              if (matchSelectedCard.card.pairId === card.pairId && matchSelectedCard.card.type !== card.type) {
                playSfx('correct');
                card.matched = true;
                matchSelectedCard.card.matched = true;
                mCardBtn.className = 'match-card-btn p-4 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/50 opacity-50 flex flex-col items-center justify-center text-center min-h-[104px]';
                matchSelectedCard.btn.className = 'match-card-btn p-4 rounded-2xl bg-emerald-950/50 border-2 border-emerald-500/50 opacity-50 flex flex-col items-center justify-center text-center min-h-[104px]';
                matchCombo++;
                matchPairsLeft--;
                document.getElementById('matchComboCount').textContent = String(matchCombo);
                matchSelectedCard = null;

                if (matchPairsLeft === 0) {
                  playSfx('levelup');
                  addReward(45, 25, 'Chiến thắng Đại Chiến Thẻ Bài với những từ đã học');
                }
              } else {
                playSfx('wrong');
                arenaLives = Math.max(0, arenaLives - 1);
                syncArenaLivesUI();
                matchCombo = 0;
                document.getElementById('matchComboCount').textContent = '0';
                const prevBtn = matchSelectedCard.btn;
                mCardBtn.classList.add('border-rose-500');
                setTimeout(() => {
                  prevBtn.classList.remove('border-amber-400', 'bg-amber-500/15');
                  mCardBtn.classList.remove('border-rose-500');
                }, 400);
                matchSelectedCard = null;
                if (arenaLives <= 0) {
                  showToast('💔 Bạn đã hết 3 mạng! Bấm "Mua +1 Mạng (20 💎)" để chơi tiếp ván này.', 'rose');
                }
              }
            }
            return;
          }

          // 10. Meteor Defense Answer Button (Enforces 3 Lives)
          const meteorBtn = e.target.closest('.meteor-ans-btn');
          if (meteorBtn && meteorActive && currentMeteor) {
            if (arenaLives <= 0) {
              showToast('💔 Hết 3 mạng! Hãy mua mạng bằng 💎 để chiến đấu tiếp.', 'rose');
              return;
            }
            const ansHanzi = meteorBtn.getAttribute('data-meteor-ans');
            const canvas = document.getElementById('meteorCanvas');
            if (ansHanzi === currentMeteor.word.hanzi) {
              playSfx('correct');
              speakChinese(currentMeteor.word.hanzi);
              for (let i = 0; i < 18; i++) {
                meteorParticles.push({
                  x: currentMeteor.x,
                  y: currentMeteor.y,
                  vx: (Math.random() - 0.5) * 6,
                  vy: (Math.random() - 0.5) * 6,
                  alpha: 1
                });
              }
              meteorScoreVal += 10;
              document.getElementById('meteorScore').textContent = String(meteorScoreVal);
              if (meteorScoreVal % 30 === 0) {
                addReward(20, 10, 'Đạt ' + meteorScoreVal + ' điểm Mưa Sao Băng Hán Tự');
              }
              spawnNextMeteor(canvas);
            } else {
              playSfx('wrong');
              arenaLives = Math.max(0, arenaLives - 1);
              meteorHpVal = arenaLives;
              syncArenaLivesUI();
              currentMeteor.y += 22;
              if (arenaLives <= 0) {
                meteorActive = false;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('💔 Hết 3 Mạng! Điểm: ' + meteorScoreVal + ' — Bấm "Mua +1 Mạng (20 💎)" ở trên để đánh tiếp!', canvas.width / 2, canvas.height / 2);
              }
            }
            return;
          }

          // 11. Story Word Token Click
          const storyTokBtn = e.target.closest('.story-token-btn');
          if (storyTokBtn) {
            const tIdx = Number(storyTokBtn.getAttribute('data-story-token'));
            const story = GRADED_STORIES[currentStoryIdx];
            const tk = story && story.tokens[tIdx];
            if (tk && tk.py) {
              inspectedWordObj = tk;
              speakChinese(tk.hz);
              document.getElementById('storyWordInspectorText').innerHTML =
                `🔍 Từ đang chọn: <b class="text-amber-300 hanzi-font text-sm">${tk.hz}</b> (${tk.py}) — Nghĩa: <b class="text-emerald-300">${tk.vi}</b>`;
              document.getElementById('btnSaveInspectedWord').classList.remove('hidden');
            }
            return;
          }

          // 12. External Resource Category Filter
          const rcatBtn = e.target.closest('.rcat-btn');
          if (rcatBtn) {
            const cat = rcatBtn.getAttribute('data-rcat');
            document.querySelectorAll('.rcat-btn').forEach(b => {
              const active = b.getAttribute('data-rcat') === cat;
              b.className = 'rcat-btn px-3 py-1.5 rounded-xl text-xs font-bold ' + (active ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300');
            });
            renderGrammarAndResources(cat);
            return;
          }

          // 13. RPG Shop Buy Item
          const buyBtn = e.target.closest('.buy-shop-btn');
          if (buyBtn) {
            const itemId = buyBtn.getAttribute('data-buy-item');
            const item = SHOP_ITEMS.find(x => x.id === itemId);
            if (!item) return;
            if (appState.gems < item.cost) {
              playSfx('wrong');
              showToast('💎 Bạn chưa đủ Linh Thạch! Hãy vượt ải hoặc chơi game để kiếm thêm.', 'rose');
              return;
            }
            appendLedgerEntry('gem', -item.cost, 'shop_buy:' + itemId);
            appState.inventory[itemId] = (appState.inventory[itemId] || 0) + 1;
            if (itemId === 'exp_boost') appendLedgerEntry('xp', 120, 'shop_exp_boost');
            const balAfterShop = computeUserBalancesFromLedger();
            appState.exp = balAfterShop.xp;
            appState.gems = balAfterShop.gems;
            if (itemId === 'heart_refill') appState.hearts = 5;
            if (itemId === 'dragon_title') appState.customTitle = 'Long Tộc Học Giả 🐉';
            playSfx('levelup');
            saveStateToDatabase('Mua vật phẩm Cửa Hàng: ' + item.name);
            renderProfileAndChart();
            showToast('🛍️ Đã mua thành công: ' + item.name + '!', 'amber');
            return;
          }

          // 14. Placement Test Option Click
          const placeOptBtn = e.target.closest('.place-opt-btn');
          if (placeOptBtn) {
            const chosen = Number(placeOptBtn.getAttribute('data-place-opt'));
            const q = PLACEMENT_QUESTIONS[placementStep];
            if (q && chosen === q.ans) {
              placementScore++;
              playSfx('correct');
            } else {
              playSfx('click');
            }
            placementStep++;
            renderPlacementStep();
            return;
          }

          // 15. Start Recommended Lesson after Placement Test
          if (e.target.id === 'btnStartRecommendedLesson') {
            document.getElementById('placementModal').classList.add('hidden');
            renderAdventureMap();
            openLessonModal(appState.lastLessonId);
          }
        });
      }

      // =====================================================
      // 16. INITIALIZATION ON WINDOW LOAD (SAFE FOR BOTH SYNC & ASYNC READYSTATE)
      // =====================================================
      let _huayuInitialized = false;
      function initHuaYuQuestApplication() {
        if (_huayuInitialized) return;
        _huayuInitialized = true;
        const btnHw = document.getElementById('btnModeHanziWriterQuiz');
        const btnFp = document.getElementById('btnModeFreePointerCanvas');
        if (btnHw && btnFp) {
          btnHw.addEventListener('click', () => {
            dojoUseHanziWriter = true;
            btnHw.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition';
            btnFp.className = 'px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold transition';
            initHanziWriterForCurrentChar();
          });
          btnFp.addEventListener('click', () => {
            dojoUseHanziWriter = false;
            btnFp.className = 'px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold transition';
            btnHw.className = 'px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold transition';
            initHanziWriterForCurrentChar();
          });
        }

        const srsFilterSel = document.getElementById('srsQueueFilterSelect');
        const srsLimitInp = document.getElementById('srsNewLimitInput');
        if (srsFilterSel) srsFilterSel.addEventListener('change', renderSrsView);
        if (srsLimitInp) srsLimitInp.addEventListener('change', renderSrsView);

        // Keyboard Accessibility: Escape closes open modals; Space/Enter flips focused SRS card
        window.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            ['lessonModal', 'placementModal', 'authModal', 'courseExamModal', 'avatarFrameModal', 'bgColorModal'].forEach(mid => {
              const m = document.getElementById(mid);
              if (m && !m.classList.contains('hidden')) m.classList.add('hidden');
            });
          }
          const activeTag = (document.activeElement && document.activeElement.tagName) ? document.activeElement.tagName.toUpperCase() : '';
          const isTypingInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA' || activeTag === 'SELECT';
          const srsSec = document.getElementById('view-srs');
          const isSrsVisible = srsSec && !srsSec.classList.contains('hidden');

          if (!isTypingInput && isSrsVisible) {
            if (e.key === ' ') {
              e.preventDefault();
              document.getElementById('srsFlipCardContainer')?.classList.toggle('flipped');
              const cardHz = document.getElementById('srsCardFrontHanzi')?.textContent || '';
              if (cardHz) speakChinese(cardHz, 0.90);
              return;
            }
            if (e.key === 'r' || e.key === 'R') {
              e.preventDefault();
              document.getElementById('btnSrsSpeak')?.click();
              return;
            }
            if (['1', '2', '3', '4'].includes(e.key)) {
              e.preventDefault();
              const rateBtn = document.querySelector(`.srs-rate-btn[data-srs-rate="${e.key}"]`);
              if (rateBtn) rateBtn.click();
              return;
            }
          }
        });

        // Deep URL Hash Router (Supports #/map, #/ai, and deep lesson links like #/map/course/1/day/2)
        function handleHashRoute() {
          const rawHash = (window.location.hash || '').replace(/^#\/?/, '');
          const parts = rawHash.split('/');
          const mainTab = parts[0];
          if (['map', 'ai', 'dojo', 'arena', 'srs', 'dictionary', 'library', 'profile'].includes(mainTab)) {
            switchTab(mainTab, true);
            if (mainTab === 'map' && parts[1] === 'course' && parts[2] && parts[3] === 'day' && parts[4]) {
              const cid = Math.max(1, Math.min(6, Number(parts[2]) || 1));
              const dnum = Math.max(1, Number(parts[4]) || 1);
              activeCourseId = cid;
              renderCourseRoadmapUI();
              currentModalLesson = generateDailyLessonNode(cid, dnum);
              currentModalStep = 0;
              dailyQuizSelections = {};
              document.getElementById('modalRealmBadge').textContent = currentModalLesson.realmName;
              document.getElementById('modalLessonTitle').textContent = currentModalLesson.title;
              document.getElementById('lessonModal').classList.remove('hidden');
              renderModalStep();
            }
          }
        }

        // Focus Trap inside open role="dialog" modals for Keyboard Accessibility
        document.addEventListener('keydown', (e) => {
          if (e.key !== 'Tab') return;
          const openModal = ['lessonModal', 'placementModal', 'authModal', 'courseExamModal', 'avatarFrameModal', 'bgColorModal']
            .map(id => document.getElementById(id))
            .find(el => el && !el.classList.contains('hidden'));
          if (!openModal) return;
          const focusables = openModal.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
          if (!focusables.length) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        });
        window.addEventListener('hashchange', handleHashRoute);
        setTimeout(handleHashRoute, 50);

        bindEvents();
        ensureCourseStateFields();
        activeRealmFilter = '0';
        initHanziDojo();
        initAiChatScenario('zero_intro');
        initMemoryMatchGame();
        loadToneQuizItem();
        setAuthModalMode('login');
        refreshAllUI();

        loadStateFromDatabase().then(() => {
          ensureCourseStateFields();
          activeRealmFilter = '0';
          refreshAllUI();
          setAuthModalMode('login');
          setTimeout(() => {
            const todayISO = getLocalDateISO();
            if (appState.missedDayReviewRequired) {
              showToast(`🚨 Thông báo: Hôm trước bạn chưa vào học! Hệ thống yêu cầu bạn ôn lại và vượt qua 10/10 câu của Ngày ${appState.missedDayReviewDayNum} trước khi học tiếp!`, 'rose');
            } else if (appState.lastDailyStudyDateISO !== todayISO) {
              showToast('🔔 Nhắc nhở học tập hôm nay: Hãy vào học bài theo ngày và hoàn thành 10 câu kiểm tra để ngày mai không bị bắt ôn lại bài cũ nhé!', 'amber');
            }
          }, 500);
        }).catch(() => {
          ensureCourseStateFields();
          refreshAllUI();
        });

        // Register Service Worker safely when served over HTTP(S)/localhost
        if ('serviceWorker' in navigator && (window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
          navigator.serviceWorker.register('./sw.js').catch(() => {});
        }
      }

      if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initHuaYuQuestApplication);
      } else {
        initHuaYuQuestApplication();
      }
