// ============================================================================
// Module 05: Dual-Layer AI Friend, 11,300+ Vi<->Zh Lexicon, 6 Graded Stories & Priority FSRS-5
// ============================================================================
'use strict';

// 9. DUAL-LAYER 4-ROLE AI FRIEND & PEDAGOGICAL TUTOR ENGINE
      // Layer 1: Xiao Long (24yo Shanghai Designer, Coffee & Football lover) — Natural Friend Chat + Streaming Hanzi + Library Pinyin
      // Layer 2: Background Pedagogical Inspector — Error Taxonomy (`error_code`), Recast vs Explicit Rule, Implicit SRS Review & HSK Level Guard
      // =====================================================
      let activeAiScenario = AI_SCENARIOS[0];
      let aiTurnIndex = 0;
      let showChatPinyin = true;
      let showChatTrans = true;
      let autoSpeakAi = true;
      let aiSessionTurnCount = 0;

      // Strict Prompt Injection & XML Tag Sanitizer (Strips </user_message>, <system>, control chars, caps at 200 chars)
      const MAX_AI_INPUT_CHARS = 200;
      const MAX_DAILY_AI_TOKEN_BUDGET = 8000;
      const BATCH_PEDAGOGICAL_EVERY_N_TURNS = 3;
      let pendingUnanalyzedTurns = [];

      function sanitizePromptInjectionInput(rawText) {
        if (!rawText) return '';
        return String(rawText)
          .replace(/<\/?user_message\b[^>]*>/gi, '')
          .replace(/<\/?system\b[^>]*>/gi, '')
          .replace(/<\/?instruction\b[^>]*>/gi, '')
          .replace(/[<>]/g, '')
          .replace(/ignore\s+(all\s+)?previous\s+instructions/gi, '[filtered]')
          .trim()
          .slice(0, MAX_AI_INPUT_CHARS);
      }

      // Crisis & Self-Harm Detection with Immediate Non-Joking Support & Official Vietnamese Hotlines
      function detectCrisisOrSelfHarmSignal(rawText) {
        const lower = String(rawText || '').toLowerCase();
        const crisisPatterns = [
          'tự tử', 'tự sát', 'tự làm hại', 'không muốn sống', 'muốn chết', 'chết đi cho rồi', 'sống không nổi',
          '自杀', '自残', '不想活', '活不下去', '寻死', '结束生命'
        ];
        return crisisPatterns.some(pat => lower.includes(pat));
      }

      // 16-Code Teacher-Authored Vietnamese Learner Error Catalog (`error_catalog`)
      const VIETNAMESE_ERROR_TAXONOMY = {
        particle_le_misuse: {
          code: 'particle_le_misuse',
          title: 'Dùng thừa trợ từ 了 (le) sau động từ mong muốn',
          teacherRule: 'Trợ từ 了 diễn tả sự thay đổi trạng thái hoặc hành động đã hoàn thành. Không đặt 了 sau 想 (muốn), 喜欢 (thích), 希望 (hy vọng) khi hành động chưa xảy ra.',
          recastTemplate: '哈哈，你是想说「{fixed}」对吧？我刚泡了一杯咖啡 ☕'
        },
        particle_guo_experiential: {
          code: 'particle_guo_experiential',
          title: 'Dùng sai trợ từ trải nghiệm 过 (guò)',
          teacherRule: 'Trợ từ 过 đứng ngay sau động từ (Động từ + 过) để chỉ trải nghiệm đã từng xảy ra trong quá khứ (Ví dụ: 我去过上海 = Tôi từng đi Thượng Hải).',
          recastTemplate: '哇，「{fixed}」啊！那一定很有意思。'
        },
        particle_zhe_continuous: {
          code: 'particle_zhe_continuous',
          title: 'Thiếu hoặc dùng sai trợ từ trạng thái 着 (zhe)',
          teacherRule: 'Trợ từ 着 đứng sau động từ để diễn tả trạng thái đang duy trì tiếp diễn (Ví dụ: 门开着 = Cửa đang mở).',
          recastTemplate: '嗯，「{fixed}」呢！'
        },
        word_order_time_place: {
          code: 'word_order_time_place',
          title: 'Ngược trật tự Thời gian / Địa điểm (Ảnh hưởng tiếng Việt)',
          teacherRule: 'Trong tiếng Trung, trạng ngữ chỉ Thời Gian và Địa Điểm luôn đứng TRƯỚC động từ chính: [Chủ ngữ + Thời gian + Ở đâu + Làm gì].',
          recastTemplate: '嗯，「{fixed}」！听起来很不错啊。'
        },
        word_order_modifier_head: {
          code: 'word_order_modifier_head',
          title: 'Ngược vị trí Định ngữ và Danh từ trung tâm (Cấu trúc 的)',
          teacherRule: 'Tiếng Việt nói "Áo màu đỏ của tôi", nhưng tiếng Trung phải đưa toàn bộ phần bổ nghĩa lên TRƯỚC chữ 的 rồi mới đến Danh từ chính: 我的红衣服.',
          recastTemplate: '哦，你是说「{fixed}」吧！真好看。'
        },
        adjective_shi_error: {
          code: 'adjective_shi_error',
          title: 'Dùng thừa 是 (shì) trước tính từ ("Tôi là khỏe/bận")',
          teacherRule: 'Tính từ làm vị ngữ trong tiếng Trung đi kèm phó từ mức độ (như 很, 非常, 真) chứ KHÔNG dùng động từ 是 (Nói 我很好 / 我很忙, không nói 我是好).',
          recastTemplate: '对啊，「{fixed}」！今天工作有点忙哈哈。'
        },
        missing_measure_word: {
          code: 'missing_measure_word',
          title: 'Thiếu lượng từ giữa Số từ / 这 / 那 và Danh từ',
          teacherRule: 'Khi đếm số lượng hoặc chỉ định (一, 两, 三, 这, 那), bắt buộc phải có Lượng từ ở giữa trước khi đến Danh từ (Ví dụ: 一个人, 一杯咖啡, 三本书).',
          recastTemplate: '哦，「{fixed}」啊！我也很喜欢。'
        },
        wrong_measure_word_ge: {
          code: 'wrong_measure_word_ge',
          title: 'Lạm dụng lượng từ 个 (gè) cho mọi danh từ',
          teacherRule: 'Mặc dù 个 rất phổ biến, nhưng sách phải dùng 本 (一本小说), áo quần dùng 件 (一件衣服), đồ uống trong cốc dùng 杯 (一杯茶).',
          recastTemplate: '哈哈，「{fixed}」确实很棒！'
        },
        de_possessive_adjective: {
          code: 'de_possessive_adjective',
          title: 'Nhầm lẫn trợ từ kết cấu 的 (Đích - Danh từ)',
          teacherRule: 'Chữ 的 (Bộ Bạch) chỉ đứng TRƯỚC Danh từ để nối định ngữ sở hữu hoặc tính chất (Ví dụ: 我的朋友, 漂亮的地方).',
          recastTemplate: '嗯，「{fixed}」说得很对！'
        },
        de_manner_adverbial: {
          code: 'de_manner_adverbial',
          title: 'Nhầm lẫn trợ từ Địa 地 (Trạng ngữ + Động từ)',
          teacherRule: 'Chữ 地 (Bộ Thổ) đứng TRƯỚC Động từ để biến tính từ thành trạng ngữ chỉ cách thức (Ví dụ: 高兴地说 = Nói một cách vui vẻ).',
          recastTemplate: '对，「{fixed}」！'
        },
        de_complement_degree: {
          code: 'de_complement_degree',
          title: 'Nhầm lẫn trợ từ Đắc 得 (Động từ +得 + Bổ ngữ mức độ)',
          teacherRule: 'Chữ 得 (Bộ Xích) đứng SAU Động từ để dẫn ra bổ ngữ đánh giá mức độ (Ví dụ: 你说得很好 = Bạn nói rất hay).',
          recastTemplate: '哈哈，「{fixed}」！你进步真快。'
        },
        ba_construction_missing_result: {
          code: 'ba_construction_missing_result',
          title: 'Câu chữ 把 (bǎ) thiếu thành phần kết quả sau động từ',
          teacherRule: 'Trong câu chữ 把 ([Chủ ngữ + 把 + Tân ngữ + Động từ + Kết quả]), sau động từ bắt buộc phải có bổ ngữ kết quả/xu hướng hoặc 了 (Ví dụ: 我把咖啡喝完了).',
          recastTemplate: '哦，「{fixed}」啦！真快。'
        },
        ma_ne_interrogative_mix: {
          code: 'ma_ne_interrogative_mix',
          title: 'Dùng lẫn trợ từ nghi vấn 吗 (ma) và 呢 (ne)',
          teacherRule: 'Chỉ dùng 吗 ở cuối câu hỏi Có/Không. Khi trong câu đã có từ để hỏi (什么, 哪儿, 怎么) hoặc hỏi ngược lại "Còn bạn thì sao?", phải dùng 呢 (Ví dụ: 你呢？).',
          recastTemplate: '哈哈，你问「{fixed}」呀？挺好的！'
        },
        bu_mei_negation_mix: {
          code: 'bu_mei_negation_mix',
          title: 'Nhầm phó từ phủ định 不 (bù) và 没 (méi)',
          teacherRule: 'Dùng 没 (hoặc 没有) để phủ định chữ 有 và phủ định hành động trong quá khứ (昨天我没去). Dùng 不 cho hiện tại, tương lai và tính chất thường xuyên.',
          recastTemplate: '哦，原来「{fixed}」啊！'
        },
        er_liang_number_confusion: {
          code: 'er_liang_number_confusion',
          title: 'Nhầm số từ 二 (èr) và 两 (liǎng) trước lượng từ',
          teacherRule: 'Khi nói "2 cái gì đó" trước lượng từ, bắt buộc dùng 两 (Ví dụ: 两个人, 两杯水), còn 二 chỉ dùng khi đếm số thứ tự, số điện thoại hoặc toán học.',
          recastTemplate: '嗯，「{fixed}」就够啦！'
        },
        han_viet_false_friend: {
          code: 'han_viet_false_friend',
          title: 'Nhầm từ đồng âm Hán-Việt khác nghĩa',
          teacherRule: 'Cẩn thận bẫy Hán-Việt: chữ 走 (Tẩu) trong tiếng Trung hiện đại là "đi bộ / rời đi" (còn "chạy" là 跑 pǎo); 方便 (Phương tiện) là "tiện lợi".',
          recastTemplate: '哈哈，中文里我们一般说「{fixed}」哦！'
        }
      };

      // Native V8 `Intl.Segmenter('zh-CN', { granularity: 'word' })` Word Segmenter (Unified Browser + Node.js Stack!)
      const zhWordSegmenter = (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function')
        ? new Intl.Segmenter('zh-CN', { granularity: 'word' })
        : null;

      function segmentChineseWordsIntl(hanziStr) {
        const clean = String(hanziStr || '');
        if (!clean) return [];
        if (zhWordSegmenter) {
          const segments = [];
          for (const seg of zhWordSegmenter.segment(clean)) {
            if (seg.isWordLike || /[\u4e00-\u9fa5]/.test(seg.segment)) {
              segments.push(seg.segment);
            }
          }
          if (segments.length > 0) return segments;
        }
        return clean.match(/[\u4e00-\u9fa5]+/g) || [];
      }

      // Library-Style Hanzi -> Pinyin Generator using `Intl.Segmenter('zh-CN')` + Polyphone Dictionary
      let _cachedHanziPinyinMap = null;
      function generateLibraryPinyinForText(hanziStr) {
        if (!hanziStr) return '';
        if (!_cachedHanziPinyinMap) {
          _cachedHanziPinyinMap = {
            '嗨': 'hāi', '哈': 'hā', '嗯': 'ńg', '哦': 'ò', '啊': 'a', '呀': 'ya', '吧': 'ba', '呢': 'ne', '吗': 'ma',
            '我': 'wǒ', '你': 'nǐ', '他': 'tā', '她': 'tā', '们': 'men', '的': 'de', '了': 'le', '是': 'shì', '不': 'bù',
            '在': 'zài', '有': 'yǒu', '很': 'hěn', '也': 'yě', '都': 'dōu', '想': 'xiǎng', '喝': 'hē', '吃': 'chī',
            '咖': 'kā', '啡': 'fēi', '茶': 'chá', '水': 'shuǐ', '刚': 'gāng', '一': 'yī', '杯': 'bēi', '太': 'tài',
            '困': 'kùn', '今': 'jīn', '天': 'tiān', '明': 'míng', '昨': 'zuó', '怎': 'zěn', '么': 'me', '样': 'yàng',
            '高': 'gāo', '兴': 'xìng', '喜': 'xǐ', '欢': 'huan', '爱': 'ài', '去': 'qù', '来': 'lái', '看': 'kàn',
            '踢': 'tī', '足': 'zú', '球': 'qiú', '设': 'shè', '计': 'jì', '上': 'shàng', '海': 'hǎi', '工': 'gōng',
            '作': 'zuò', '忙': 'máng', '累': 'lèi', '休': 'xiū', '息': 'xī', '真': 'zhēn', '棒': 'bàng', '抱': 'bào', '小': 'xiǎo', '龙': 'lóng', '师': 'shī', '傅': 'fu', '欢': 'huān', '迎': 'yíng', '华': 'huá', '语': 'yǔ', '奇': 'qí', '境': 'jìng', '叫': 'jiào', '名': 'míng', '字': 'zì', '哪': 'nǎ', '国': 'guó', '人': 'rén', '冰': 'bīng', '完': 'wán', '图': 'tú', '正': 'zhèng', '着': 'zhe', '过': 'guò', '得': 'de', '拿': 'ná', '铁': 'tiě', '楼': 'lóu', '下': 'xià', '买': 'mǎi'
          };
          [1, 2, 3, 4, 5, 6].forEach(lv => {
            getParsedHskBank(lv).forEach(w => {
              if (w.hanzi && w.pinyin) {
                _cachedHanziPinyinMap[w.hanzi] = w.pinyin;
              }
            });
          });
        }
        const polyphonePhrases = {
          '觉得': 'juéde', '睡觉': 'shuìjiào', '银行': 'yínháng', '行业': 'hángyè', '可以': 'kěyǐ',
          '高兴': 'gāoxìng', '便宜': 'piányi', '东西': 'dōngxi', '喜欢': 'xǐhuan', '漂亮': 'piàoliang',
          '咖啡': 'kāfēi', '美式': 'měishì', '足球': 'zúqiú', '上海': 'Shànghǎi', '设计': 'shèjì',
          '休息': 'xiūxi', '明天': 'míngtiān', '今天': 'jīntiān', '昨天': 'zuótiān', '怎么': 'zěnme', '什么': 'shénme'
        };
        const words = segmentChineseWordsIntl(hanziStr);
        const out = [];
        words.forEach(w => {
          if (polyphonePhrases[w] || _cachedHanziPinyinMap[w]) {
            out.push(polyphonePhrases[w] || _cachedHanziPinyinMap[w]);
          } else {
            const charPy = [];
            for (const ch of w) {
              charPy.push(_cachedHanziPinyinMap[ch] || ch);
            }
            out.push(charPy.join(''));
          }
        });
        return out.join(' ');
      }

      // Segment Chinese text with `Intl.Segmenter('zh-CN')` & check ratio of words within the user's current HSK level
      function evaluateHskVocabularyCoverage(hanziText) {
        const words = segmentChineseWordsIntl(hanziText);
        if (words.length === 0) return { inLevelPct: 100, outOfLevelWords: [] };
        const maxLv = Math.max(2, (appState && appState.currentCourseId) || 1);
        const allowedWords = new Set();
        const allowedChars = new Set(['我', '你', '他', '她', '的', '了', '是', '不', '在', '有', '很', '也', '都', '想', '喝', '吃', '哈', '嗯', '哦', '啊', '呀', '吧', '呢', '吗', '嗨', '咖', '啡', '茶', '杯']);
        for (let lv = 1; lv <= maxLv; lv++) {
          getParsedHskBank(lv).forEach(w => {
            allowedWords.add(w.hanzi);
            for (const c of w.hanzi) allowedChars.add(c);
          });
        }
        let inCount = 0;
        const outWords = [];
        words.forEach(w => {
          if (allowedWords.has(w) || Array.from(w).every(c => allowedChars.has(c))) {
            inCount++;
          } else if (!outWords.includes(w)) {
            outWords.push(w);
          }
        });
        return {
          inLevelPct: Math.round((inCount / words.length) * 100),
          outOfLevelWords: outWords.slice(0, 3)
        };
      }

      // Apply `suggested_srs_events` on the Client through FSRS-5 so Server & Client SRS states never conflict!
      function applyClientSuggestedSrsEvents(suggestedEvents) {
        if (!Array.isArray(suggestedEvents) || suggestedEvents.length === 0) return [];
        const appliedHanzi = [];
        suggestedEvents.forEach(ev => {
          const card = (appState.srsWords || []).find(c => c.vocab_id === ev.vocab_id || c.hanzi === ev.hanzi);
          if (card) {
            // Apply weighted implicit FSRS-5 update on client & push to reviewLogs
            const weight = Number(ev.weight) || 0.5;
            const fullSchedule = computeFSRSSchedule(card, ev.suggested_rating || 3);
            card.stability = Number(((card.stability || 1.2) + (fullSchedule.stability - (card.stability || 1.2)) * weight).toFixed(2));
            card.reps = (card.reps || 0) + 1;
            card.lastReviewAt = Date.now();
            card.interval = `Ôn ngầm AI (0.5x) • S=${card.stability}`;
            appliedHanzi.push(card.hanzi);
          }
        });
        return appliedHanzi;
      }

      // Inspect User Message for the 16 Vietnamese Learner Errors & Emit `suggested_srs_events`
      function inspectUserTurnPedagogically(userText) {
        const raw = sanitizePromptInjectionInput(userText);
        let detectedError = null;

        if (/我(想|喜欢|希望)[^，。！？]{1,8}了$/.test(raw)) {
          detectedError = Object.assign({ original: raw, fixed: raw.replace(/了$/, '') }, VIETNAMESE_ERROR_TAXONOMY.particle_le_misuse);
        } else if (/(去|来|看|吃|喝|学习|工作)[^，。！？]{0,6}(明天|今天|昨天|现在)/.test(raw)) {
          const m = raw.match(/(明天|今天|昨天|现在)/);
          const timeW = m ? m[1] : '明天';
          const fixed = '我' + timeW + raw.replace(/^我/, '').replace(timeW, '');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.word_order_time_place);
        } else if (/(我|你|他|她)是(好|忙|累|高兴|漂亮|饿|困)/.test(raw)) {
          const fixed = raw.replace(/是(好|忙|累|高兴|漂亮|饿|困)/, '很$1');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.adjective_shi_error);
        } else if (/(一|两|三|这|那)(人|书|咖啡|茶|猫|狗|朋友)/.test(raw)) {
          const fixed = raw
            .replace(/(一|两|三|这|那)咖啡/, '$1杯咖啡')
            .replace(/(一|两|三|这|那)茶/, '$1杯茶')
            .replace(/(一|两|三|这|那)书/, '$1本书')
            .replace(/(一|两|三|这|那)(人|朋友)/, '$1个$2');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.missing_measure_word);
        } else if (/二(个|杯|本|件|位|只|条)/.test(raw)) {
          const fixed = raw.replace(/二(个|杯|本|件|位|只|条)/, '两$1');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.er_liang_number_confusion);
        } else if (/昨天[^，。！？]*不(去|来|吃|喝|看|买)/.test(raw)) {
          const fixed = raw.replace(/不(去|来|吃|喝|看|买)/, '没$1');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.bu_mei_negation_mix);
        } else if (/(什么|哪儿|哪里|谁|怎么)[^，。！？]*吗/.test(raw)) {
          const fixed = raw.replace(/吗\??$/, '呢？');
          detectedError = Object.assign({ original: raw, fixed }, VIETNAMESE_ERROR_TAXONOMY.ma_ne_interrogative_mix);
        }

        let repeatCount = 0;
        if (detectedError) {
          if (!appState.learnerErrors || typeof appState.learnerErrors !== 'object') appState.learnerErrors = {};
          const prev = appState.learnerErrors[detectedError.code] || { count: 0, title: detectedError.title };
          prev.count += 1;
          prev.lastSeen = getLocalDateISO();
          prev.lastOriginal = detectedError.original;
          prev.lastFixed = detectedError.fixed;
          appState.learnerErrors[detectedError.code] = prev;
          repeatCount = prev.count;
        }

        // Emit pure `suggested_srs_events` instead of mutating DB directly
        const suggestedSrsEvents = [];
        (appState.srsWords || []).forEach(card => {
          if (card.hanzi && raw.includes(card.hanzi)) {
            suggestedSrsEvents.push({
              vocab_id: card.vocab_id || card.hanzi,
              hanzi: card.hanzi,
              event_kind: 'implicit_chat_use',
              suggested_rating: 3,
              weight: 0.5
            });
          }
        });
        const usedSrsWords = applyClientSuggestedSrsEvents(suggestedSrsEvents);

        // Extract Friend Memory only if not sensitive PII
        if (!Array.isArray(appState.friendMemory)) appState.friendMemory = [];
        if (raw.includes('咖啡') && !appState.friendMemory.some(m => m.includes('cà phê'))) {
          appState.friendMemory.unshift('Thích uống cà phê ☕ (nhắc trong chat)');
        } else if ((raw.includes('足球') || raw.includes('bóng đá')) && !appState.friendMemory.some(m => m.includes('bóng đá'))) {
          appState.friendMemory.unshift('Thích xem bóng đá ⚽');
        } else if ((raw.includes('考试') || raw.includes('thi')) && !appState.friendMemory.some(m => m.includes('thi'))) {
          appState.friendMemory.unshift('Đang chuẩn bị cho kỳ thi quan trọng 📝');
        }

        return {
          has_error: Boolean(detectedError),
          correction: detectedError ? Object.assign({}, detectedError, { repeatCount }) : null,
          suggested_srs_events: suggestedSrsEvents,
          target_words_used: usedSrsWords
        };
      }

            function renderAiTargetSrsWordsPills() {
        const container = document.getElementById('aiTargetSrsWordsPills');
        if (!container) return;
        const targets = (appState.srsWords || []).slice(0, 4);
        container.innerHTML = targets.map(w => `
          <button type="button" data-insert-ai-word="${escapeHtml(w.hanzi)}" class="ai-insert-word-pill px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs transition" title="Bấm để chèn từ này vào ô chat">
            ${escapeHtml(w.hanzi)} <span class="text-slate-400 font-normal">(${escapeHtml(w.pinyin)} - ${escapeHtml(w.meaning.split('(')[0].trim())})</span>
          </button>
        `).join('');
      }

      function renderAiBackgroundPedagogicalPanel() {
        const notesEl = document.getElementById('aiBackgroundCoachNotes');
        const errStatsEl = document.getElementById('aiLearnerErrorStatsList');
        const memEl = document.getElementById('aiFriendMemoryList');

        if (notesEl) {
          const notes = appState.aiCoachNotes || [];
          if (notes.length === 0) {
            notesEl.innerHTML = `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 leading-relaxed">
                ✨ <b>Lớp học tập chạy ngầm đã sẵn sàng!</b> Cứ trò chuyện thoải mái với Tiểu Long ở bên trái — mọi góp ý ngữ pháp, từ vựng SRS dùng tốt và mẹo diễn đạt sẽ được tổng hợp riêng tại đây để không làm đứt mạch nói chuyện của bạn.
              </div>
            `;
          } else {
            notesEl.innerHTML = notes.slice(0, 8).map(n => `
              <div class="p-3 rounded-xl bg-slate-950 border ${n.type === 'error' ? 'border-amber-500/40' : 'border-emerald-500/40'} space-y-1">
                <div class="flex items-center justify-between">
                  <span class="font-extrabold ${n.type === 'error' ? 'text-amber-300' : 'text-emerald-400'}">${escapeHtml(n.badge)}</span>
                  <span class="text-[11px] text-slate-400">${escapeHtml(n.time || 'Vừa xong')}</span>
                </div>
                <div class="text-slate-200 leading-relaxed">${escapeHtml(n.body)}</div>
                ${n.rule ? `<div class="p-2 rounded-lg bg-slate-900 border border-slate-800 text-amber-200 text-[11px] mt-1">📖 <b>Từ điển lỗi giáo viên:</b> ${escapeHtml(n.rule)}</div>` : ''}
              </div>
            `).join('');
          }
        }

        if (errStatsEl) {
          const errMap = appState.learnerErrors || {};
          const keys = Object.keys(errMap);
          if (keys.length === 0) {
            errStatsEl.innerHTML = `<div class="text-slate-400">Chưa ghi nhận lỗi lặp lại nào. Hãy thử nhắn <code>我想喝咖啡了</code> hoặc <code>我是忙</code> để xem cơ chế sửa ngầm (Recast)!</div>`;
          } else {
            errStatsEl.innerHTML = keys.map(k => {
              const item = errMap[k];
              return `
                <div class="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                  <span class="text-slate-200 truncate">• ${escapeHtml(item.title)}</span>
                  <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0">${item.count} lần</span>
                </div>
              `;
            }).join('');
          }
        }

        if (memEl) {
          const mems = appState.friendMemory || [];
          memEl.innerHTML = mems.map((m, idx) => `
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950 border border-teal-500/30 text-teal-200">
              <span>${escapeHtml(m)}</span>
              <button type="button" data-del-memory="${idx}" aria-label="Xóa ký ức này" class="del-friend-mem-btn text-rose-400 hover:text-rose-300 font-bold">✕</button>
            </span>
          `).join('');
        }
      }

      function renderAiScenarioPills() {
        const container = document.getElementById('aiScenarioPills');
        if (!container) return;
        container.innerHTML = AI_SCENARIOS.map(sc => {
          const isSelected = sc.id === activeAiScenario.id;
          return `
            <button data-scenario="${sc.id}" class="ai-scenario-btn px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border ${isSelected ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-600/20' : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-emerald-500/40'}">
              <span>${sc.title}</span>
              <span class="ml-1 opacity-80">(${sc.badge})</span>
            </button>
          `;
        }).join('');
      }

      function initAiChatScenario(scenarioId, forceReset) {
        const found = AI_SCENARIOS.find(s => s.id === scenarioId);
        if (found) activeAiScenario = found;
        aiTurnIndex = 0;
        renderAiScenarioPills();
        renderAiTargetSrsWordsPills();
        renderAiBackgroundPedagogicalPanel();

        document.getElementById('aiMissionText').textContent = activeAiScenario.mission;
        const stream = document.getElementById('aiChatStream');
        if (!stream) return;
        stream.innerHTML = '';

        if (!appState.aiConversations || typeof appState.aiConversations !== 'object') {
          appState.aiConversations = {};
        }
        const scKey = activeAiScenario.id;
        if (forceReset) {
          appState.aiConversations[scKey] = [];
        }

        const savedHistory = appState.aiConversations[scKey];
        if (!forceReset && Array.isArray(savedHistory) && savedHistory.length > 0) {
          savedHistory.forEach(msg => {
            appendChatMessage(msg.sender, msg.hanzi, msg.pinyin, msg.vi, msg.inlineSubtleNote, true);
          });
          renderAiSmartSuggestions(activeAiScenario.suggestions);
          return;
        }

        // Friend-like time-aware & memory-aware greeting from Xiao Long (24yo Shanghai Designer)
        const userName = (appState.currentUser && appState.currentUser.fullName) ? appState.currentUser.fullName : 'bạn';
        const mem0 = (appState.friendMemory && appState.friendMemory[0]) || '';
        const friendlyHanzi = activeAiScenario.id === 'greeting'
          ? '嗨！我是小龙，今天在上海刚做完一个设计图，正喝着冰美式呢 ☕ 你今天过得怎么样？'
          : activeAiScenario.greeting.hanzi;
        const friendlyPinyin = activeAiScenario.id === 'greeting'
          ? 'Hāi! Wǒ shì Xiǎolóng, jīntiān zài Shànghǎi gāng zuò wán yī gè shèjìtú, zhèng hē zhe bīng měishì ne ☕ Nǐ jīntiān guò de zěnmeyàng?'
          : (activeAiScenario.greeting.pinyin || generateLibraryPinyinForText(friendlyHanzi));
        const friendlyVi = activeAiScenario.id === 'greeting'
          ? `Chào ${userName}! Mình là Tiểu Long đây, hôm nay ở Thượng Hải vừa vẽ xong một bản thiết kế, đang nhâm nhi ly Americano đá ☕ Hôm nay của bạn thế nào?${mem0 ? ' (Mình vẫn nhớ: ' + mem0 + ')' : ''}`
          : activeAiScenario.greeting.vi;

        appendChatMessage('ai', friendlyHanzi, friendlyPinyin, friendlyVi, null, false);
        renderAiSmartSuggestions(activeAiScenario.suggestions);
      }

      // Stream Hanzi characters first, then reveal Library-generated Pinyin and Vietnamese meaning!
      function appendChatMessage(sender, hanzi, pinyin, vi, inlineSubtleNote, skipDbRecord) {
        const stream = document.getElementById('aiChatStream');
        if (!stream) return;

        const computedPinyin = pinyin || generateLibraryPinyinForText(hanzi);
        if (!skipDbRecord && activeAiScenario && activeAiScenario.id) {
          if (!appState.aiConversations || typeof appState.aiConversations !== 'object') {
            appState.aiConversations = {};
          }
          if (!Array.isArray(appState.aiConversations[activeAiScenario.id])) {
            appState.aiConversations[activeAiScenario.id] = [];
          }
          appState.aiConversations[activeAiScenario.id].push({
            sender: sender === 'user' ? 'user' : 'ai',
            hanzi: hanzi,
            pinyin: computedPinyin,
            vi: vi || '',
            inlineSubtleNote: inlineSubtleNote || null
          });
          if (appState.aiConversations[activeAiScenario.id].length > 30) {
            appState.aiConversations[activeAiScenario.id].shift();
          }
        }
        const wrapper = document.createElement('div');
        if (sender === 'ai') {
          wrapper.className = 'flex items-start gap-3';
          wrapper.innerHTML = `
            <img src="assets/images/tutor_dragon.jpg" alt="Tiểu Long AI" class="w-9 h-9 rounded-xl object-cover border border-emerald-400 shrink-0 mt-1 max-w-full h-auto" />
            <div class="max-w-xl rounded-2xl rounded-tl-none bg-slate-900 border border-slate-800 p-3.5 space-y-1.5">
              <div class="flex items-center justify-between gap-3">
                <span class="text-xs font-bold text-emerald-400">小龙 • Tiểu Long (Thượng Hải ☕)</span>
                <button data-speak="${escapeHtml(hanzi)}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30">🔊 Nghe</button>
              </div>
              <div class="ai-stream-hanzi text-base font-bold hanzi-font text-white leading-relaxed">${escapeHtml(hanzi)}</div>
              <div class="chat-pinyin-line text-xs text-emerald-300/90 font-medium ${showChatPinyin ? '' : 'hidden'}">${escapeHtml(computedPinyin)}</div>
              <div class="chat-trans-line text-xs text-slate-300 border-t border-slate-800 pt-1.5 ${showChatTrans ? '' : 'hidden'}">${escapeHtml(vi)}</div>
              ${inlineSubtleNote ? `<div class="mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">💡 ${escapeHtml(inlineSubtleNote)}</div>` : ''}
            </div>
          `;
        } else {
          wrapper.className = 'flex justify-end';
          wrapper.innerHTML = `
            <div class="max-w-lg rounded-2xl rounded-tr-none bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-3.5 space-y-1 shadow-lg">
              <div class="flex items-center justify-between gap-3">
                <span class="text-xs font-bold text-emerald-100">Bạn</span>
                <button data-speak="${escapeHtml(hanzi)}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn text-xs px-2 py-0.5 rounded bg-black/20 text-white">🔊</button>
              </div>
              <div class="text-base font-bold hanzi-font">${escapeHtml(hanzi)}</div>
              ${computedPinyin ? `<div class="chat-pinyin-line text-xs text-emerald-100 ${showChatPinyin ? '' : 'hidden'}">${escapeHtml(computedPinyin)}</div>` : ''}
              ${vi ? `<div class="chat-trans-line text-xs text-emerald-50/90 ${showChatTrans ? '' : 'hidden'}">${escapeHtml(vi)}</div>` : ''}
            </div>
          `;
        }

        stream.appendChild(wrapper);
        stream.scrollTop = stream.scrollHeight;
      }

      function renderAiSmartSuggestions(suggestions) {
        const box = document.getElementById('aiSmartSuggestions');
        if (!box) return;
        box.innerHTML = (suggestions || []).map((s, idx) => `
          <button data-sug-idx="${idx}" class="ai-sug-btn text-left p-3.5 rounded-2xl bg-slate-950/90 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between gap-2 shadow-sm">
            <div class="w-full flex items-center justify-between gap-2">
              <span class="text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">${escapeHtml(s.level)}</span>
              <span class="text-xs font-bold text-amber-400 shrink-0">Gửi ngay ➔</span>
            </div>
            <div class="space-y-1 w-full">
              <div class="text-sm sm:text-base font-extrabold hanzi-font text-white leading-snug">${escapeHtml(s.hanzi)}</div>
              <div class="text-xs text-emerald-400 font-medium leading-snug">${escapeHtml(s.pinyin)}</div>
              <div class="text-xs text-slate-300 leading-relaxed pt-0.5">${escapeHtml(s.vi)}</div>
            </div>
          </button>
        `).join('');
        box._currentSuggestions = suggestions || [];
      }

      function handleUserAiMessage(text, knownPinyin, knownVi) {
        const cleaned = sanitizePromptInjectionInput(text || '');
        if (!cleaned) return;

        // Track Daily AI Token Budget & Circuit Breaker
        const estTokens = Math.max(25, cleaned.length * 4);
        appState.dailyAiTokensUsed = (Number(appState.dailyAiTokensUsed) || 0) + estTokens;
        const tokBadge = document.getElementById('aiTokenBudgetBadge');
        if (tokBadge) {
          tokBadge.textContent = `Ngân sách Token hôm nay: ${appState.dailyAiTokensUsed} / ${MAX_DAILY_AI_TOKEN_BUDGET} tokens`;
        }

        // Under-18 Age Gate Session Break Reminder (Prevents emotional over-attachment / fatigue)
        const ageMode = document.getElementById('aiAgeSafetySelect')?.value || 'under_18';
        if (ageMode === 'under_18' && aiSessionTurnCount > 0 && aiSessionTurnCount % 10 === 0) {
          showToast('⏰ Nhắc nhở bảo vệ sức khỏe (Chế độ < 18 tuổi): Bạn đã trò chuyện 10 lượt liên tiếp, hãy nghỉ mắt 5 phút và uống nước nhé!', 'amber');
        }

        appendChatMessage('user', cleaned, knownPinyin || '', knownVi || '');
        document.getElementById('aiUserInput').value = '';
        aiSessionTurnCount++;
        progressQuest('q_ai');

        // Run Layer 2: Background Pedagogical Analysis (4 Roles)
        const pedResult = inspectUserTurnPedagogically(cleaned);
        const correctionMode = document.getElementById('aiCorrectionModeSelect')?.value || 'recast';
        const codeSwitchMode = document.getElementById('aiCodeSwitchSelect')?.value || 'hsk_soft';

        if (!Array.isArray(appState.aiCoachNotes)) appState.aiCoachNotes = [];

        if (pedResult.target_words_used.length > 0) {
          const usedStr = pedResult.target_words_used.join(', ');
          appState.aiCoachNotes.unshift({
            type: 'srs',
            badge: '🎯 Dùng từ SRS tự nhiên (+10 EXP)',
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            body: `Bạn vừa đưa từ mục tiêu "${usedStr}" vào cuộc trò chuyện rất tự nhiên! Đã cộng 1 lượt ôn ngầm (Implicit Review) vào FSRS.`
          });
          addReward(25, 8, 'Vận dụng từ SRS vào hội thoại với Tiểu Long: ' + usedStr);
        } else {
          addReward(15, 5, 'Trò chuyện tiếng Trung cùng Tiểu Long');
        }

        if (pedResult.has_error && pedResult.correction) {
          const c = pedResult.correction;
          appState.aiCoachNotes.unshift({
            type: 'error',
            badge: `🛠️ Góp ý (${c.code} • Lần ${c.repeatCount})`,
            time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            body: `Bạn nói: "${c.original}" ➔ Tự nhiên hơn: "${c.fixed}"`,
            rule: c.teacherRule
          });
        }

        // Generate Layer 1: Natural Friend Response from Xiao Long (Never teacher-like, uses Recast if error detected!)
        setTimeout(() => {
          const reply = generateFriendXiaoLongResponse(cleaned, pedResult, correctionMode, codeSwitchMode);
          const cov = evaluateHskVocabularyCoverage(reply.hanzi);
          const healthEl = document.getElementById('aiConversationHealthBadge');
          if (healthEl) {
            healthEl.textContent = `Từ trong cấp: ${cov.inLevelPct}% • Lượt: ${aiSessionTurnCount}`;
          }

          // Only show inline grammar box inside chat bubble if user explicitly selected "detailed" OR repeated same error >= 2 times
          let inlineNote = null;
          if (pedResult.has_error && pedResult.correction) {
            const c = pedResult.correction;
            if (correctionMode === 'detailed' || (correctionMode === 'recast' && c.repeatCount >= 2)) {
              inlineNote = `Mẹo nhỏ từ Tiểu Long (Lỗi lặp lần ${c.repeatCount}): Câu tự nhiên là 「${c.fixed}」. ${c.teacherRule}`;
            }
          }

          const libPinyin = reply.pinyin || generateLibraryPinyinForText(reply.hanzi);
          appendChatMessage('ai', reply.hanzi, libPinyin, reply.vi, inlineNote);
          if (autoSpeakAi) speakChinese(reply.hanzi, 0.94);
          if (reply.nextSuggestions) {
            renderAiSmartSuggestions(reply.nextSuggestions);
          }
          renderAiBackgroundPedagogicalPanel();
          saveStateToDatabase();
        }, 320);
      }

      function generateFriendXiaoLongResponse(input, pedResult, correctionMode, codeSwitchMode) {
        const lower = input.toLowerCase();

        // Immediate Crisis & Self-Harm Intervention (Exits persona humor, provides official Vietnamese hotlines)
        if (detectCrisisOrSelfHarmSignal(input)) {
          return {
            hanzi: '请先停下来，你的生命和安全最重要。如果你现在非常痛苦，请立刻联系专业人员或身边的亲人寻求帮助。',
            vi: '⚠️ Bạn rất quan trọng và bạn không đơn độc. Xin hãy dừng lại và liên hệ ngay sự hỗ trợ khẩn cấp tại Việt Nam: Tổng đài Quốc gia Bảo vệ Trẻ em 111 (Miễn phí 24/7) • Đường dây nóng hỗ trợ tâm lý Ngày Mai: 096 306 1414 • Cấp cứu Y tế: 115.'
          };
        }

        // General Fatigue / Stress Empathy Guardrail
        if (lower.includes('buồn quá') || lower.includes('mệt mỏi') || lower.includes('难过') || lower.includes('压力太大')) {
          return {
            hanzi: '累了就先停下来休息一会儿吧，不用勉强自己学习。跟身边的家人或朋友聊聊会好很多的。',
            vi: 'Nếu mệt quá thì cứ tạm dừng nghỉ ngơi một chút, đừng ép bản thân học tiếp. Tâm sự với người thân hoặc bạn bè bên cạnh sẽ giúp bạn nhẹ lòng hơn nhiều đấy.'
          };
        }

        // If learner made a specific error and mode is NOT 'none', weave a natural conversational Recast!
        if (pedResult && pedResult.has_error && pedResult.correction && correctionMode !== 'none') {
          const c = pedResult.correction;
          if (c.code === 'particle_le_misuse') {
            return {
              hanzi: `哈哈，你也${c.fixed.replace(/^我/, '')}啊！我刚喝了一杯冰美式，今天画设计图太困了 ☕`,
              vi: `Haha, bạn cũng muốn (${c.fixed}) à! Mình vừa uống một ly Americano đá xong, hôm nay vẽ thiết kế buồn ngủ quá ☕`,
              nextSuggestions: [
                { level: 'Thân mật', hanzi: '我每天早上都喝一杯咖啡', pinyin: 'Wǒ měitiān zǎoshang dōu hē yī bēi kāfēi', vi: 'Sáng nào mình cũng uống 1 ly cà phê' },
                { level: 'Chia sẻ', hanzi: '我不喜欢苦的，我喜欢喝奶茶', pinyin: 'Wǒ bù xǐhuan kǔ de, wǒ xǐhuan hē nǎichá', vi: 'Mình không thích đắng, thích trà sữa hơn' },
                { level: 'Hỏi thăm', hanzi: '你今天工作忙不忙？', pinyin: 'Nǐ jīntiān gōngzuò máng bu máng?', vi: 'Hôm nay công việc của bạn có bận không?' }
              ]
            };
          }
          const recastHz = c.recastTemplate.replace('{fixed}', c.fixed);
          return {
            hanzi: recastHz,
            vi: `Ừa, ý bạn là "${c.fixed}" đúng không! Nghe thú vị đấy 😄`
          };
        }

        // Natural friend responses (Note: intentionally mixed statements/reactions so < 50% end with a question!)
        if (lower.includes('咖啡') || lower.includes('cà phê') || lower.includes('茶')) {
          return {
            hanzi: '哈哈，上海这边的咖啡店特别多！我工作累的时候最喜欢去楼下买一杯拿铁 ☕',
            vi: 'Haha, ở Thượng Hải quán cà phê nhiều cực kỳ! Lúc làm việc mệt mình thích nhất là xuống lầu mua một ly Latte ☕'
          };
        }
        if (lower.includes('累') || lower.includes('mệt') || lower.includes('忙')) {
          return {
            hanzi: '哎呀，辛苦啦！今天先别学太晚，早点休息，听听音乐放松一下吧 🎵',
            vi: 'Ái chà, vất vả cho bạn rồi! Hôm nay đừng học khuya quá, nghỉ sớm nghe nhạc thư giãn chút đi nhé 🎵'
          };
        }

        if (aiTurnIndex < activeAiScenario.turns.length) {
          const t = activeAiScenario.turns[aiTurnIndex];
          aiTurnIndex++;
          return t;
        }

        const viMixSuffix = codeSwitchMode === 'vi_mix' ? ' (Bạn cứ thoải mái chêm tiếng Việt nếu quên từ nhé!)' : '';
        return {
          hanzi: '哈哈，跟你聊天真开心！我刚忙完手头的设计稿，正准备去踢会儿足球呢 ⚽',
          vi: 'Haha, nói chuyện với bạn vui thật đấy! Mình vừa làm xong bản thiết kế, đang chuẩn bị đi đá bóng một lát đây ⚽' + viMixSuffix
        };
      }

      // Web Speech API Microphone Recognition (Shows recognized text in input box FIRST so learner can inspect/edit before sending!)
      let recognition = null;
      function startVoiceInput() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
          showToast('🎙️ Đã điền câu tiếng Trung vào ô nhập — bạn hãy kiểm tra lại chữ rồi bấm Gửi nhé!', 'amber');
          const box = document.getElementById('aiSmartSuggestions');
          const firstSug = box && box._currentSuggestions && box._currentSuggestions[0];
          if (firstSug) {
            document.getElementById('aiUserInput').value = firstSug.hanzi;
            document.getElementById('aiUserInput').focus();
          }
          return;
        }
        try {
          recognition = new SpeechRec();
          recognition.lang = 'zh-CN';
          recognition.interimResults = false;
          document.getElementById('micStatusLabel').textContent = 'Đang nghe tiếng Trung...';
          recognition.onresult = function (event) {
            const transcript = event.results[0][0].transcript;
            document.getElementById('aiUserInput').value = transcript;
            document.getElementById('aiUserInput').focus();
            document.getElementById('micStatusLabel').textContent = 'Nói Tiếng Trung (Mic)';
            showToast('🎙️ Đã chuyển giọng nói thành chữ trong ô nhập — hãy kiểm tra rồi bấm Gửi!', 'emerald');
          };
          recognition.onerror = function () {
            document.getElementById('micStatusLabel').textContent = 'Nói Tiếng Trung (Mic)';
            showToast('Hãy nhập hoặc chọn câu gợi ý bên trên nếu thiết bị chưa cấp quyền Mic!', 'amber');
          };
          recognition.onend = function () {
            document.getElementById('micStatusLabel').textContent = 'Nói Tiếng Trung (Mic)';
          };
          recognition.start();
        } catch (e) {
          showToast('Hãy chọn câu gợi ý hoặc nhập trực tiếp vào ô chat!', 'amber');
        }
      }


            // =====================================================
      // 10. DOJO ENGINE: HANZI STROKE CANVAS & PINYIN LAB
      // =====================================================
      let activeDojoCharIndex = 0;
      let isDrawing = false;
      let drawnStrokePoints = 0;
      let hanziWriterInstance = null;
      let dojoUseHanziWriter = true;
      let lastStrokeQuizMistakes = 0;
      let lastStrokeQuizCompleted = false;

      function initHanziDojo() {
        // Expand DOJO_CHARACTERS with characters from HSK 1-6 Vocabulary Banks so learners have 60+ characters to practice
        if (DOJO_CHARACTERS.length < 30) {
          const existingSet = new Set(DOJO_CHARACTERS.map(c => c.char));
          [1, 2, 3, 4].forEach(lv => {
            getParsedHskBank(lv).slice(0, 15).forEach(w => {
              const singleChar = (w.hanzi || '')[0];
              if (singleChar && /[\u4e00-\u9fa5]/.test(singleChar) && !existingSet.has(singleChar)) {
                existingSet.add(singleChar);
                DOJO_CHARACTERS.push({
                  char: singleChar,
                  pinyin: w.pinyin.split(' ')[0] || w.pinyin,
                  hanviet: w.hanviet.split(' ')[0] || w.hanviet,
                  meaning: w.meaning,
                  hsk: 'HSK ' + lv,
                  strokes: 6,
                  mnemonic: `Chữ "${singleChar}" nằm trong từ "${w.hanzi}" (${w.pinyin} — ${w.meaning}). Câu mẫu: ${w.example}`,
                  rule: 'Viết theo chuẩn bút thuận HanziWriter: Ngang trước sổ sau, trên trước dưới sau, trái trước phải sau.'
                });
              }
            });
          });
        }

        const selector = document.getElementById('hanziPracticeSelector');
        if (!selector) return;
        selector.innerHTML = DOJO_CHARACTERS.slice(0, 36).map((item, idx) => `
          <button data-char-idx="${idx}" class="dojo-char-btn p-2 rounded-xl border text-center transition ${idx === activeDojoCharIndex ? 'bg-emerald-600 text-white border-emerald-400 font-black' : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-400/50'}">
            <div class="text-xl hanzi-font">${item.char}</div>
            <div class="text-xs opacity-80">${item.pinyin}</div>
          </button>
        `).join('');

        setupDrawingCanvas();
        selectDojoCharacter(activeDojoCharIndex);
        renderPinyinAndTonesLab();
      }

      function selectDojoCharacter(idx) {
        activeDojoCharIndex = (idx + DOJO_CHARACTERS.length) % DOJO_CHARACTERS.length;
        const item = DOJO_CHARACTERS[activeDojoCharIndex];
        document.getElementById('dojoCharBadge').textContent = item.hsk + ' • Chuẩn Bút Thuận';
        document.getElementById('dojoCharTitle').textContent = item.char;
        document.getElementById('dojoCharPinyin').textContent = item.pinyin;
        document.getElementById('dojoCharHanViet').textContent = item.hanviet;
        document.getElementById('dojoCharMeaning').textContent = item.meaning;
        document.getElementById('dojoCharMnemonic').textContent = item.mnemonic;
        document.getElementById('dojoCharStrokesDesc').textContent = item.rule;
        document.getElementById('canvasGhostChar').textContent = item.char;

        document.querySelectorAll('.dojo-char-btn').forEach((btn, i) => {
          btn.className = 'dojo-char-btn p-2 rounded-xl border text-center transition ' +
            (i === activeDojoCharIndex ? 'bg-emerald-600 text-white border-emerald-400 font-black' : 'bg-slate-950 text-slate-200 border-slate-800 hover:border-amber-400/50');
        });
        clearHanziCanvas();
        initHanziWriterForCurrentChar();
      }

      function initHanziWriterForCurrentChar() {
        const targetEl = document.getElementById('hanziWriterTarget');
        const canvasEl = document.getElementById('hanziCanvas');
        const ghostEl = document.getElementById('canvasGhostChar');
        const item = DOJO_CHARACTERS[activeDojoCharIndex];
        if (!targetEl || !item) return;

        lastStrokeQuizMistakes = 0;
        lastStrokeQuizCompleted = false;

        if (window.HanziWriter && dojoUseHanziWriter) {
          targetEl.classList.remove('hidden');
          if (canvasEl) canvasEl.classList.add('hidden');
          if (ghostEl) ghostEl.classList.add('hidden');
          targetEl.innerHTML = '';
          try {
            hanziWriterInstance = window.HanziWriter.create(targetEl, item.char, {
              width: 260,
              height: 260,
              padding: 12,
              showOutline: true,
              strokeAnimationSpeed: 1.2,
              delayBetweenStrokes: 180,
              strokeColor: '#10b981',
              radicalColor: '#f59e0b',
              outlineColor: 'rgba(148, 163, 184, 0.28)',
              drawingColor: '#34d399',
              drawingWidth: 18,
              showHintAfterMisses: 2
            });
            startHanziWriterStrokeQuiz();
          } catch (e) {
            hanziWriterInstance = null;
          }
        } else {
          targetEl.classList.add('hidden');
          if (canvasEl) canvasEl.classList.remove('hidden');
          if (ghostEl) ghostEl.classList.remove('hidden');
        }
      }

      function startHanziWriterStrokeQuiz() {
        if (!hanziWriterInstance) return;
        const item = DOJO_CHARACTERS[activeDojoCharIndex];
        lastStrokeQuizMistakes = 0;
        lastStrokeQuizCompleted = false;
        document.getElementById('strokeScoreResult').textContent = `✍️ Hãy tô từng nét chữ "${item.char}" (${item.pinyin}) theo đúng thứ tự bút thuận trên ô Điền Tự!`;
        hanziWriterInstance.quiz({
          onMistake: function (strokeData) {
            lastStrokeQuizMistakes++;
            playSfx('wrong');
            document.getElementById('strokeScoreResult').textContent = `⚠️ Nét số ${strokeData.strokeNum + 1} chưa đúng hướng/thứ tự (Sai ${lastStrokeQuizMistakes} lần) — Hãy nhìn nét gợi ý màu xanh!`;
          },
          onCorrectStroke: function (strokeData) {
            playSfx('click');
            drawnStrokePoints += 12;
            document.getElementById('strokeScoreResult').textContent = `✅ Đúng nét số ${strokeData.strokeNum + 1}! Còn ${strokeData.strokesRemaining} nét nữa...`;
          },
          onComplete: function (summaryData) {
            lastStrokeQuizCompleted = true;
            drawnStrokePoints = 50;
            const accuracy = Math.max(60, 100 - (summaryData.totalMistakes || 0) * 8);
            playSfx('levelup');
            speakChinese(item.char);
            document.getElementById('strokeScoreResult').textContent = `🏆 Hoàn thành đúng 100% thứ tự các nét chữ "${item.char}"! Độ chính xác bút thuận: ${accuracy}%`;
            progressQuest('q_write');
            addReward(20, 8, `Viết chuẩn bút thuận chữ ${item.char} (${accuracy}%)`);
          }
        });
      }

      // High-DPI Pointer Events Canvas fallback
      function setupDrawingCanvas() {
        const canvas = document.getElementById('hanziCanvas');
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        canvas.width = 288 * dpr;
        canvas.height = 288 * dpr;
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 10;
        ctx.strokeStyle = '#34d399';

        function getPos(e) {
          const rect = canvas.getBoundingClientRect();
          return {
            x: (e.clientX - rect.left) * (288 / rect.width),
            y: (e.clientY - rect.top) * (288 / rect.height)
          };
        }

        canvas.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          canvas.setPointerCapture(e.pointerId);
          isDrawing = true;
          const pos = getPos(e);
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
          drawnStrokePoints++;
        });

        canvas.addEventListener('pointermove', (e) => {
          if (!isDrawing) return;
          e.preventDefault();
          const pos = getPos(e);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
          drawnStrokePoints++;
        });

        canvas.addEventListener('pointerup', () => { isDrawing = false; });
        canvas.addEventListener('pointercancel', () => { isDrawing = false; });
      }

      function clearHanziCanvas() {
        const canvas = document.getElementById('hanziCanvas');
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        drawnStrokePoints = 0;
        if (hanziWriterInstance && dojoUseHanziWriter) {
          startHanziWriterStrokeQuiz();
        } else {
          document.getElementById('strokeScoreResult').textContent = 'Hãy viết chữ "' + DOJO_CHARACTERS[activeDojoCharIndex].char + '" lên ô Điền Tự ở trên!';
        }
      }

      function animateSampleCharacter() {
        const item = DOJO_CHARACTERS[activeDojoCharIndex];
        speakChinese(item.char);
        if (hanziWriterInstance && dojoUseHanziWriter) {
          hanziWriterInstance.animateCharacter({
            onComplete: function () {
              setTimeout(() => startHanziWriterStrokeQuiz(), 500);
            }
          });
          return;
        }
        const canvas = document.getElementById('hanziCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 288, 288);
        ctx.save();
        ctx.font = '900 185px "Noto Sans SC", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 5;
        ctx.strokeText(item.char, 144, 152);
        ctx.restore();
        drawnStrokePoints = 35;
      }

            function renderPinyinAndTonesLab() {
        const tonesGrid = document.getElementById('tonesLabGrid');
        if (tonesGrid) {
          tonesGrid.innerHTML = TONES_DATA.map(t => `
            <div data-speak="${t.sample}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn cursor-pointer p-4 rounded-2xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-extrabold text-emerald-400">${t.name}</span>
                <span class="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">🔊 Nghe</span>
              </div>
              <div class="text-2xl font-black text-white hanzi-font">${t.mark} <span class="text-sm font-normal text-slate-400">— ${t.meaning}</span></div>
              <svg viewBox="0 0 120 95" class="w-full h-14 bg-slate-900 rounded-xl p-1 border border-slate-800">
                <line x1="10" y1="20" x2="110" y2="20" stroke="#334155" stroke-dasharray="3,3" />
                <line x1="10" y1="50" x2="110" y2="50" stroke="#334155" stroke-dasharray="3,3" />
                <line x1="10" y1="80" x2="110" y2="80" stroke="#334155" stroke-dasharray="3,3" />
                <path d="${t.svgPath}" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" />
              </svg>
              <div class="text-xs text-amber-300 font-semibold">Cao độ: ${t.pitch}</div>
              <p class="text-xs text-slate-400 leading-relaxed">${t.desc}</p>
            </div>
          `).join('');
        }

        const initGrid = document.getElementById('pinyinInitialsGrid');
        if (initGrid) {
          initGrid.innerHTML = PINYIN_INITIALS.map((item, i) => `
            <button data-init-idx="${i}" class="pinyin-init-btn p-2.5 rounded-xl bg-slate-950 hover:bg-emerald-600 hover:text-white border border-slate-800 font-extrabold text-sm text-emerald-300 transition">
              ${item.p}
            </button>
          `).join('');
        }

        const finalGrid = document.getElementById('pinyinFinalsGrid');
        if (finalGrid) {
          finalGrid.innerHTML = PINYIN_FINALS.map(f => `
            <button data-speak="${f.speak}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn p-2 rounded-xl bg-slate-950 hover:bg-amber-500 hover:text-slate-950 border border-slate-800 font-bold text-xs text-amber-300 transition">
              ${f.p}
            </button>
          `).join('');
        }

        const radGrid = document.getElementById('coreRadicalsGrid');
        if (radGrid) {
          radGrid.innerHTML = CORE_RADICALS.map(r => `
            <div data-speak="${r.sample}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn cursor-pointer p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800">
              <div class="flex items-center justify-between">
                <span class="text-lg font-black hanzi-font text-amber-400">${r.r}</span>
                <span class="text-xs font-bold text-emerald-400">${r.name}</span>
              </div>
              <div class="text-xs text-slate-400 mt-1">${r.mean}</div>
            </div>
          `).join('');
        }
      }

      // =====================================================
      // 11. GAMIFIED MINI-GAMES ARENA (Learned Words Sync, 3 Lives + Buy Lives with Gems, Custom Timers, & 4-Option Speed Quiz)
      // =====================================================
      let arenaCurrentMode = 'quiz4'; // 'quiz4' | 'match' | 'meteor' | 'tone'
      let arenaLives = 3; // Strict 3 lives per game!

      // Collects the exact words the user has learned across Daily Lessons, Map Nodes, and SRS Notebook!
      function getUserLearnedWordsPool() {
        ensureCourseStateFields();
        const mapByHanzi = new Map();

        function addWord(w) {
          if (!w || !w.hanzi) return;
          if (!mapByHanzi.has(w.hanzi)) {
            mapByHanzi.set(w.hanzi, {
              hanzi: w.hanzi,
              pinyin: w.pinyin || '',
              hanviet: w.hanviet || '',
              meaning: w.meaning || ''
            });
          }
        }

        // 1. Words from all completed Daily Lessons across courses
        const completedDaily = appState.completedDailyLessons || {};
        Object.keys(completedDaily).forEach(cidStr => {
          const cid = Number(cidStr);
          const bank = getParsedHskBank(cid);
          const daysMap = completedDaily[cid] || {};
          Object.keys(daysMap).forEach(dStr => {
            if (daysMap[dStr]) {
              const dNum = Number(dStr);
              for (let i = 0; i < 10; i++) {
                const item = bank[Math.min(Math.max(0, (dNum - 1) * 10 + i), bank.length - 1)];
                addWord(item);
              }
            }
          });
        });

        // 2. Words from completed Map Nodes
        const compNodes = appState.completedLessons || {};
        Object.keys(compNodes).forEach(nid => {
          if (compNodes[nid]) {
            const foundNode = CURRICULUM_NODES.find(n => n.id === nid);
            if (foundNode && foundNode.vocab) {
              foundNode.vocab.forEach(addWord);
            }
          }
        });

        // 3. Words in user's personal SRS vocabulary list
        if (Array.isArray(appState.srsWords)) {
          appState.srsWords.forEach(addWord);
        }

        // 4. Also include the words of the current Day the user is actively studying in their current Course (so Day 1 learners immediately practice Day 1's 10 words!)
        const activeCid = appState.currentCourseId || 1;
        const activeBank = getParsedHskBank(activeCid);
        const activeDoneMap = (completedDaily && completedDaily[activeCid]) || {};
        const currentStudyingDay = Object.keys(activeDoneMap).length + 1;
        for (let i = 0; i < 10; i++) {
          addWord(activeBank[Math.min(Math.max(0, (currentStudyingDay - 1) * 10 + i), activeBank.length - 1)]);
        }

        return Array.from(mapByHanzi.values());
      }

      function getFilteredArenaVocab() {
        const levelVal = document.getElementById('arenaLevelSelect') ? document.getElementById('arenaLevelSelect').value : 'learned';
        let pool = [];

        if (levelVal === 'learned') {
          pool = getUserLearnedWordsPool();
        } else if (levelVal === '1') {
          pool = getParsedHskBank(1).concat(getParsedHskBank(2));
        } else if (levelVal === '3') {
          pool = getParsedHskBank(3).concat(getParsedHskBank(4));
        } else if (levelVal === '5') {
          pool = getParsedHskBank(5).concat(getParsedHskBank(6));
        } else {
          [1, 2, 3, 4, 5, 6].forEach(lv => {
            pool.push(...getParsedHskBank(lv));
          });
        }

        if (pool.length < 6) {
          pool = getParsedHskBank(1).slice(0, 10);
        }
        updateArenaLearnedPreviewUI(pool, levelVal);
        return pool;
      }

      function updateArenaLearnedPreviewUI(pool, levelVal) {
        const badge = document.getElementById('arenaLearnedCountBadge');
        const preview = document.getElementById('arenaLearnedWordsPreview');
        if (badge) {
          badge.textContent = levelVal === 'learned'
            ? `Đang dùng ${pool.length} từ vựng bạn đã học`
            : `Đang dùng ${pool.length} từ thuộc bộ lọc đã chọn`;
        }
        if (preview) {
          const sampleStr = pool.slice(0, 12).map(w => `${w.hanzi} (${w.meaning})`).join(' • ');
          preview.innerHTML = `<b>Từ xuất hiện trong Game:</b> <span class="text-amber-300 hanzi-font">${sampleStr}${pool.length > 12 ? ' ...' : ''}</span>`;
        }
      }

      function syncArenaLivesUI() {
        const heartsStr = arenaLives > 0 ? '❤️'.repeat(arenaLives) + '🖤'.repeat(Math.max(0, 3 - arenaLives)) : '💔 Hết mạng';
        const gDisp = document.getElementById('arenaGlobalHeartsDisplay');
        const gNum = document.getElementById('arenaGlobalHeartsNum');
        if (gDisp) gDisp.textContent = heartsStr;
        if (gNum) gNum.textContent = `(${arenaLives}/3)`;

        const q4H = document.getElementById('quiz4HeartsBadge');
        if (q4H) q4H.textContent = `Mạng: ${heartsStr} (${arenaLives}/3)`;
        const mH = document.getElementById('matchLivesCount');
        if (mH) mH.textContent = String(arenaLives);
        const metH = document.getElementById('meteorHp');
        if (metH) metH.textContent = String(arenaLives);
        const tH = document.getElementById('toneLivesDisplay');
        if (tH) tH.textContent = String(arenaLives);

        // Keep Arena Game 3 Lives separate from Character's 5 HUD Hearts!
        const hudH = document.getElementById('hudHearts');
        if (hudH) hudH.textContent = String(appState.hearts || 5);
      }

      function buyArenaLivesWithDiamonds(amount, cost) {
        if (arenaLives >= 3) {
          showToast('❤️ Bạn đang có đầy đủ 3/3 Mạng rồi!', 'emerald');
          return;
        }
        if (appState.gems < cost) {
          playSfx('wrong');
          showToast(`💎 Không đủ Kim Cương (Linh Thạch)! Cần ${cost} 💎 nhưng bạn đang có ${appState.gems} 💎.`, 'rose');
          return;
        }
        appendLedgerEntry('gem', -cost, 'buy_arena_life');
        appState.gems = computeUserBalancesFromLedger().gems;
        arenaLives = Math.min(3, arenaLives + amount);
        playSfx('levelup');
        syncArenaLivesUI();
        saveStateToDatabase(`Mua mạng chơi Game bằng ${cost} 💎`);
        showToast(`💎 Đã mua mạng thành công (-${cost} 💎)! Hiện có ${arenaLives}/3 ❤️ — Tiếp tục chiến đấu!`, 'amber');

        // Resume active game if it was paused due to 0 lives
        if (arenaCurrentMode === 'quiz4' && quiz4GameOverByLives) {
          quiz4GameOverByLives = false;
          renderQuiz4CurrentQuestion();
        } else if (arenaCurrentMode === 'meteor' && !meteorActive && meteorHpVal <= 0) {
          meteorHpVal = arenaLives;
          resumeMeteorAfterBuyLife();
        }
      }

      // =====================================================
      // GAME 4: ĐẤU TRÍ 4 ĐÁP ÁN (4-OPTION SPEED QUIZ WITH CUSTOM QUESTION COUNT & SECONDS/QUESTION)
      // =====================================================
      let quiz4Questions = [];
      let quiz4CurrentIdx = 0;
      let quiz4Score = 0;
      let quiz4Combo = 0;
      let quiz4SecPerQ = 12;
      let quiz4TimeLeft = 12;
      let quiz4TimerId = null;
      let quiz4GameOverByLives = false;

      function startQuiz4Game() {
        if (quiz4TimerId) clearInterval(quiz4TimerId);
        const pool = getFilteredArenaVocab();
        const totalQInput = Number(document.getElementById('quiz4TotalQuestionsInput')?.value || 10);
        const secInput = Number(document.getElementById('quiz4SecondsPerQInput')?.value || 12);
        const modeVal = document.getElementById('quiz4ModeSelect')?.value || 'mixed';

        const totalQ = Math.min(100, Math.max(3, totalQInput));
        quiz4SecPerQ = Math.min(120, Math.max(3, secInput));
        arenaLives = 3;
        quiz4CurrentIdx = 0;
        quiz4Score = 0;
        quiz4Combo = 0;
        quiz4GameOverByLives = false;
        syncArenaLivesUI();

        document.getElementById('quiz4ScoreText').textContent = '0';
        document.getElementById('quiz4ComboText').textContent = '0';

        // Build question list from user's learned vocabulary pool
        quiz4Questions = [];
        for (let i = 0; i < totalQ; i++) {
          const target = pool[(i * 3 + Math.floor(Math.random() * pool.length)) % pool.length];
          const distractors = pool.filter(w => w.hanzi !== target.hanzi).sort(() => Math.random() - 0.5).slice(0, 3);
          while (distractors.length < 3) {
            distractors.push({ hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' });
          }
          const qType = modeVal === 'mixed' ? (i % 2 === 0 ? 'hz2vi' : 'vi2hz') : modeVal;
          const options = [target, ...distractors].sort(() => Math.random() - 0.5);
          quiz4Questions.push({
            target,
            qType,
            options,
            correctIdx: options.findIndex(o => o.hanzi === target.hanzi)
          });
        }

        renderQuiz4CurrentQuestion();
      }

      function renderQuiz4CurrentQuestion() {
        if (quiz4TimerId) clearInterval(quiz4TimerId);

        if (arenaLives <= 0) {
          quiz4GameOverByLives = true;
          document.getElementById('quiz4OptionsGrid').innerHTML = `
            <div class="col-span-full p-5 rounded-2xl bg-rose-950/70 border-2 border-rose-500 text-center space-y-3">
              <div class="text-2xl">💔 Bạn Đã Hết Cả 3 Mạng!</div>
              <p class="text-xs sm:text-sm text-slate-200">Điểm hiện tại của bạn: <b class="text-amber-300">${quiz4Score} điểm</b> (Đang ở Câu ${quiz4CurrentIdx + 1}/${quiz4Questions.length}). Dùng Kim Cương (💎) mua thêm mạng để làm tiếp ngay hoặc chơi lại từ đầu!</p>
              <div class="flex flex-wrap justify-center gap-2.5">
                <button id="btnInlineQuiz4BuyLife" class="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs">💎 Mua +1 Mạng (20 💎) Để Chơi Tiếp</button>
                <button id="btnInlineQuiz4Restart" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs">🔄 Chơi Lại Từ Đầu</button>
              </div>
            </div>
          `;
          return;
        }

        if (quiz4CurrentIdx >= quiz4Questions.length) {
          playSfx('levelup');
          addReward(50, 25, `Hoàn thành ${quiz4Questions.length} câu Đấu Trí 4 Đáp Án (${quiz4Score} điểm)`);
          document.getElementById('quiz4PromptMain').textContent = '🏆 Hoàn Thành!';
          document.getElementById('quiz4PromptSub').textContent = `Chúc mừng bạn đã vượt qua ${quiz4Questions.length}/${quiz4Questions.length} câu hỏi từ vựng đã học với ${quiz4Score} điểm!`;
          document.getElementById('quiz4OptionsGrid').innerHTML = `
            <div class="col-span-full flex justify-center">
              <button id="btnInlineQuiz4Restart" class="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm">🚀 Chơi Ván Mới</button>
            </div>
          `;
          return;
        }

        const qItem = quiz4Questions[quiz4CurrentIdx];
        document.getElementById('quiz4ProgressText').textContent = `Câu: ${quiz4CurrentIdx + 1} / ${quiz4Questions.length}`;
        document.getElementById('quiz4FeedbackMsg').textContent = '';

        if (qItem.qType === 'hz2vi') {
          document.getElementById('quiz4PromptMain').textContent = qItem.target.hanzi;
          document.getElementById('quiz4PromptSub').textContent = `Từ "${qItem.target.hanzi}" bạn đã học có Phiên âm & Nghĩa tiếng Việt là gì?`;
        } else {
          document.getElementById('quiz4PromptMain').textContent = qItem.target.meaning;
          document.getElementById('quiz4PromptSub').textContent = `Nghĩa "${qItem.target.meaning}" tương ứng với Chữ Hán nào dưới đây?`;
        }

        const grid = document.getElementById('quiz4OptionsGrid');
        grid.innerHTML = qItem.options.map((opt, idx) => {
          const labelLetter = ['A', 'B', 'C', 'D'][idx];
          const textDisplay = qItem.qType === 'hz2vi'
            ? `<span class="text-emerald-400 font-bold">${opt.pinyin}</span> — <span class="text-white font-semibold">${opt.meaning}</span>`
            : `<span class="text-2xl font-black hanzi-font text-amber-300 mr-2">${opt.hanzi}</span> <span class="text-xs text-emerald-400">(${opt.pinyin})</span>`;

          return `
            <button data-quiz4-opt="${idx}" class="quiz4-opt-btn p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-2 border-slate-800 hover:border-emerald-500/50 transition flex items-center gap-3">
              <span class="w-8 h-8 rounded-xl bg-slate-950 border border-slate-700 text-amber-300 font-black text-xs flex items-center justify-center shrink-0">${labelLetter}</span>
              <div class="text-xs sm:text-sm">${textDisplay}</div>
            </button>
          `;
        }).join('');

        // Start per-question countdown timer
        quiz4TimeLeft = quiz4SecPerQ;
        const timeTextEl = document.getElementById('quiz4TimeLeftText');
        const barEl = document.getElementById('quiz4TimerBar');
        if (timeTextEl) timeTextEl.textContent = String(quiz4TimeLeft);
        if (barEl) barEl.style.width = '100%';

        quiz4TimerId = setInterval(() => {
          if (arenaCurrentMode !== 'quiz4') return;
          quiz4TimeLeft--;
          if (timeTextEl) timeTextEl.textContent = String(Math.max(0, quiz4TimeLeft));
          if (barEl) barEl.style.width = Math.max(0, Math.round((quiz4TimeLeft / quiz4SecPerQ) * 100)) + '%';

          if (quiz4TimeLeft <= 0) {
            clearInterval(quiz4TimerId);
            playSfx('wrong');
            arenaLives = Math.max(0, arenaLives - 1);
            quiz4Combo = 0;
            document.getElementById('quiz4ComboText').textContent = '0';
            syncArenaLivesUI();
            const fb = document.getElementById('quiz4FeedbackMsg');
            if (fb) {
              fb.className = 'text-xs sm:text-sm font-bold text-rose-400';
              fb.textContent = `⏰ Hết giờ suy nghĩ (-1 ❤️)! Đáp án đúng là: ${qItem.target.hanzi} (${qItem.target.pinyin}) — ${qItem.target.meaning}`;
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
        }, 1000);
      }

      // =====================================================
      // GAME 1: MEMORY MATCH (WITH CUSTOM TIME LIMIT & 3 LIVES)
      // =====================================================
      let matchSelectedCard = null;
      let matchCombo = 0;
      let matchPairsLeft = 0;
      let matchTimerSec = 60;
      let matchIntervalId = null;

      function initMemoryMatchGame() {
        if (matchIntervalId) clearInterval(matchIntervalId);
        const pool = getFilteredArenaVocab().slice().sort(() => Math.random() - 0.5).slice(0, 6);
        const cards = [];
        pool.forEach((v, idx) => {
          cards.push({ id: 'h_' + idx, pairId: idx, type: 'hanzi', text: v.hanzi, sub: 'Chữ Hán đã học', speak: v.hanzi, matched: false });
          cards.push({ id: 'm_' + idx, pairId: idx, type: 'meaning', text: v.pinyin, sub: v.meaning, speak: v.hanzi, matched: false });
        });
        cards.sort(() => Math.random() - 0.5);

        arenaLives = 3;
        syncArenaLivesUI();
        matchSelectedCard = null;
        matchCombo = 0;
        matchPairsLeft = pool.length;

        const limitSetting = Number(document.getElementById('matchTimeLimitSelect')?.value || 60);
        matchTimerSec = limitSetting > 0 ? limitSetting : 0;
        document.getElementById('matchComboCount').textContent = '0';
        document.getElementById('matchTimer').textContent = String(matchTimerSec);

        matchIntervalId = setInterval(() => {
          if (arenaCurrentMode !== 'match' || matchPairsLeft <= 0 || arenaLives <= 0) return;
          if (limitSetting > 0) {
            matchTimerSec--;
            const timerEl = document.getElementById('matchTimer');
            if (timerEl) timerEl.textContent = String(Math.max(0, matchTimerSec));
            if (matchTimerSec <= 0) {
              clearInterval(matchIntervalId);
              playSfx('wrong');
              arenaLives = 0;
              syncArenaLivesUI();
              showToast('⏰ Hết thời gian! Bạn có thể mua thêm mạng bằng 💎 hoặc bấm Ván Mới.', 'rose');
            }
          } else {
            matchTimerSec++;
            const timerEl = document.getElementById('matchTimer');
            if (timerEl) timerEl.textContent = String(matchTimerSec);
          }
        }, 1000);

        const grid = document.getElementById('matchCardsGrid');
        grid.innerHTML = cards.map((c, i) => `
          <button data-mcard-idx="${i}" class="match-card-btn p-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border-2 border-slate-800 transition flex flex-col items-center justify-center text-center min-h-[104px]">
            <div class="${c.type === 'hanzi' ? 'text-2xl font-black hanzi-font text-amber-300' : 'text-sm font-extrabold text-emerald-400'}">${c.text}</div>
            <div class="text-xs text-slate-300 mt-1 line-clamp-2">${c.sub}</div>
          </button>
        `).join('');
        grid._cardsData = cards;
      }

      // =====================================================
      // GAME 2: METEOR HANZI DEFENSE (LEARNED WORDS, CUSTOM SPEED/DURATION & 3 LIVES)
      // =====================================================
      let meteorAnimId = null;
      let meteorTimerIntervalId = null;
      let meteorActive = false;
      let meteorScoreVal = 0;
      let meteorHpVal = 3;
      let meteorRemainingSec = 60;
      let currentMeteor = null;
      let meteorParticles = [];

      function startMeteorGame() {
        const canvas = document.getElementById('meteorCanvas');
        if (!canvas) return;
        if (meteorAnimId) cancelAnimationFrame(meteorAnimId);
        if (meteorTimerIntervalId) clearInterval(meteorTimerIntervalId);

        const rect = canvas.parentElement.getBoundingClientRect();
        canvas.width = Math.max(320, rect.width);
        canvas.height = Math.max(240, rect.height);

        arenaLives = 3;
        meteorHpVal = 3;
        syncArenaLivesUI();

        meteorActive = true;
        meteorScoreVal = 0;
        meteorParticles = [];
        meteorRemainingSec = Number(document.getElementById('meteorDurationSelect')?.value || 60);
        document.getElementById('meteorScore').textContent = '0';
        const timeEl = document.getElementById('meteorTimeLeft');
        if (timeEl) timeEl.textContent = String(meteorRemainingSec);

        meteorTimerIntervalId = setInterval(() => {
          if (!meteorActive || arenaCurrentMode !== 'meteor') return;
          meteorRemainingSec--;
          if (timeEl) timeEl.textContent = String(Math.max(0, meteorRemainingSec));
          if (meteorRemainingSec <= 0) {
            meteorActive = false;
            clearInterval(meteorTimerIntervalId);
            playSfx('levelup');
            addReward(45, 25, `Bảo vệ Hoàng Thành thành công với ${meteorScoreVal} điểm`);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#34d399';
            ctx.font = 'bold 20px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 Chiến Thắng Hiệp Đấu! Điểm: ' + meteorScoreVal, canvas.width / 2, canvas.height / 2);
          }
        }, 1000);

        spawnNextMeteor(canvas);
        runMeteorCanvasLoop(canvas);
      }

      function resumeMeteorAfterBuyLife() {
        const canvas = document.getElementById('meteorCanvas');
        if (!canvas) return;
        meteorActive = true;
        meteorHpVal = arenaLives;
        spawnNextMeteor(canvas);
        runMeteorCanvasLoop(canvas);
      }

      function runMeteorCanvasLoop(canvas) {
        const ctx = canvas.getContext('2d');
        function loop() {
          if (!meteorActive) return;
          ctx.fillStyle = '#020617';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
          for (let i = 0; i < 20; i++) {
            ctx.fillRect((i * 73) % canvas.width, (i * 41) % (canvas.height - 30), 2, 2);
          }

          ctx.fillStyle = '#065f46';
          ctx.fillRect(0, canvas.height - 18, canvas.width, 18);

          if (currentMeteor) {
            currentMeteor.y += currentMeteor.speed;

            const grad = ctx.createRadialGradient(currentMeteor.x, currentMeteor.y, 5, currentMeteor.x, currentMeteor.y, 38);
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.9)');
            grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(currentMeteor.x, currentMeteor.y, 38, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = '900 28px "Noto Sans SC", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(currentMeteor.word.hanzi, currentMeteor.x, currentMeteor.y);

            if (currentMeteor.y >= canvas.height - 28) {
              playSfx('wrong');
              arenaLives = Math.max(0, arenaLives - 1);
              meteorHpVal = arenaLives;
              syncArenaLivesUI();
              if (arenaLives <= 0) {
                meteorActive = false;
                ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = '#fbbf24';
                ctx.font = 'bold 18px Inter, sans-serif';
                ctx.fillText('💔 Hết 3 Mạng! Điểm: ' + meteorScoreVal + ' — Bấm "Mua +1 Mạng (20 💎)" ở trên để đánh tiếp!', canvas.width / 2, canvas.height / 2);
                return;
              } else {
                spawnNextMeteor(canvas);
              }
            }
          }

          for (let i = meteorParticles.length - 1; i >= 0; i--) {
            const p = meteorParticles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= 0.04;
            if (p.alpha <= 0) {
              meteorParticles.splice(i, 1);
            } else {
              ctx.fillStyle = `rgba(52, 211, 153, ${p.alpha})`;
              ctx.beginPath();
              ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
              ctx.fill();
            }
          }

          meteorAnimId = requestAnimationFrame(loop);
        }
        meteorAnimId = requestAnimationFrame(loop);
      }

      function spawnNextMeteor(canvas) {
        const pool = getFilteredArenaVocab();
        const target = pool[Math.floor(Math.random() * pool.length)];
        const wrongPool = pool.filter(w => w.hanzi !== target.hanzi).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [target, ...wrongPool].sort(() => Math.random() - 0.5);
        const baseSpeed = Number(document.getElementById('meteorSpeedSelect')?.value || 0.55);

        currentMeteor = {
          word: target,
          x: 70 + Math.random() * Math.max(100, canvas.width - 140),
          y: 28,
          speed: baseSpeed + Math.min(0.6, meteorScoreVal * 0.015)
        };

        const row = document.getElementById('meteorAnswersRow');
        row.innerHTML = options.map(opt => `
          <button data-meteor-ans="${opt.hanzi}" class="meteor-ans-btn p-3 rounded-xl bg-slate-950 hover:bg-emerald-600 hover:text-white border border-slate-700 font-bold text-xs text-slate-200 transition">
            <div class="text-emerald-400">${opt.pinyin}</div>
            <div class="truncate mt-0.5">${opt.meaning}</div>
          </button>
        `).join('');
      }

      // =====================================================
      // GAME 3: TONE MASTER REFLEX (USES LEARNED WORDS + CUSTOM TIMER & 3 LIVES)
      // =====================================================
      let currentToneQuizIdx = 0;
      let toneTimerId = null;
      let toneTimeLeft = 12;

      function detectToneNumberFromPinyin(py) {
        if (!py) return 1;
        if (/[āēīōūǖ]/.test(py)) return 1;
        if (/[áéíóúǘ]/.test(py)) return 2;
        if (/[ǎěǐǒǔǚ]/.test(py)) return 3;
        if (/[àèìòùǜ]/.test(py)) return 4;
        return 1;
      }

      function getCurrentToneQuizItem() {
        const pool = getFilteredArenaVocab();
        const raw = pool[currentToneQuizIdx % pool.length] || { hanzi: '妈', pinyin: 'mā', meaning: 'Mẹ' };
        return {
          hanzi: raw.hanzi,
          pinyin: raw.pinyin,
          tone: detectToneNumberFromPinyin(raw.pinyin),
          meaning: raw.meaning
        };
      }

      function loadToneQuizItem() {
        if (toneTimerId) clearInterval(toneTimerId);
        const item = getCurrentToneQuizItem();
        document.getElementById('toneQuizHanzi').textContent = item.hanzi;
        document.getElementById('toneQuizMeaning').textContent = 'Nghĩa: ' + item.meaning;
        document.getElementById('toneQuizFeedback').textContent = '';

        const secLimit = Number(document.getElementById('toneTimePerQSelect')?.value || 12);
        toneTimeLeft = secLimit;
        const disp = document.getElementById('toneTimerDisplay');
        if (disp) disp.textContent = secLimit > 0 ? String(toneTimeLeft) : '∞';

        if (secLimit > 0 && arenaCurrentMode === 'tone') {
          toneTimerId = setInterval(() => {
            if (arenaCurrentMode !== 'tone' || arenaLives <= 0) return;
            toneTimeLeft--;
            if (disp) disp.textContent = String(Math.max(0, toneTimeLeft));
            if (toneTimeLeft <= 0) {
              clearInterval(toneTimerId);
              playSfx('wrong');
              arenaLives = Math.max(0, arenaLives - 1);
              syncArenaLivesUI();
              const fb = document.getElementById('toneQuizFeedback');
              if (fb) {
                fb.className = 'text-xs font-bold min-h-[20px] text-rose-400';
                fb.textContent = arenaLives <= 0
                  ? '💔 Hết 3 Mạng! Hãy bấm "Mua +1 Mạng (20 💎)" ở thanh trên để chơi tiếp.'
                  : `⏰ Hết giờ (-1 ❤️)! Đáp án là Thanh ${item.tone} (${item.pinyin}).`;
              }
            }
          }, 1000);
        }
      }

      // =====================================================
      // 12. SRS FLASHCARDS & LIBRARY RENDERERS
      // =====================================================
      let activeSrsIdx = 0;

      function getFilteredSrsQueue() {
        const mode = document.getElementById('srsQueueFilterSelect')?.value || 'due';
        const newLimit = Number(document.getElementById('srsNewLimitInput')?.value || 20);
        const now = Date.now();
        // Priority Rule (Anti-Card-Debt): Sort lapsed/overdue review cards FIRST before unseen new cards!
        const words = (appState.srsWords || []).slice().sort((a, b) => {
          const aLapse = Number(a.lapses) || 0;
          const bLapse = Number(b.lapses) || 0;
          if (aLapse !== bLapse) return bLapse - aLapse;
          return (a.dueAt || 0) - (b.dueAt || 0);
        });
        if (mode === 'due') {
          const dueList = words.filter(w => !w.dueAt || w.dueAt <= now);
          return dueList.length > 0 ? dueList : words;
        }
        if (mode === 'new') {
          const newList = words.filter(w => !w.reps || w.state === 'new').slice(0, newLimit);
          return newList.length > 0 ? newList : words.slice(0, newLimit);
        }
        return words;
      }

      function renderSrsView() {
        if (!appState.srsWords || appState.srsWords.length === 0) return;
        const queue = getFilteredSrsQueue();
        activeSrsIdx = activeSrsIdx % queue.length;
        const card = queue[activeSrsIdx] || appState.srsWords[0];

        const dueCount = (appState.srsWords || []).filter(w => !w.dueAt || w.dueAt <= Date.now()).length;
        const dueBadge = document.getElementById('srsDueBadge');
        if (dueBadge) dueBadge.textContent = `Đến hạn hôm nay: ${dueCount} / ${appState.srsWords.length} thẻ`;

        const logsCount = (appState.reviewLogs || []).length;
        const totalReps = (appState.srsWords || []).reduce((acc, w) => acc + (w.reps || 0), 0);
        const totalLapses = (appState.srsWords || []).reduce((acc, w) => acc + (w.lapses || 0), 0);
        const retentionPct = totalReps > 0 ? Math.max(60, Math.round(((totalReps - totalLapses) / totalReps) * 100)) : 96;
        const statEl = document.getElementById('srsRetentionStatsText');
        if (statEl) statEl.textContent = `${retentionPct}% • ${logsCount} log`;

        // Dynamically preview exact FSRS-5 intervals on the 4 rating buttons for the current card!
        [1, 2, 3, 4].forEach(rating => {
          const preview = computeFSRSSchedule(card, rating);
          const spanEl = document.getElementById('srsBtnInterval' + rating);
          if (spanEl) spanEl.textContent = preview.shortIntervalText;
        });

        document.getElementById('srsFlipCardContainer').classList.remove('flipped');
        document.getElementById('srsCardHskBadge').textContent = card.hsk || 'Sổ tay cá nhân';
        document.getElementById('srsCardFrontHanzi').textContent = card.hanzi;
        document.getElementById('srsCardBackHanzi').textContent = card.hanzi;
        document.getElementById('srsCardBackPinyin').textContent = card.pinyin;
        document.getElementById('srsCardBackMeaning').textContent = card.meaning;
        document.getElementById('srsCardBackExample').textContent = card.example || ('Từ vựng ôn tập: ' + card.hanzi);

        renderSrsWordList();
      }

      function renderSrsWordList() {
        const listEl = document.getElementById('srsWordListContainer');
        const filterVal = (document.getElementById('srsFilterInput')?.value || '').toLowerCase();
        if (!listEl) return;

        const filtered = appState.srsWords.filter(w =>
          w.hanzi.includes(filterVal) ||
          w.pinyin.toLowerCase().includes(filterVal) ||
          w.meaning.toLowerCase().includes(filterVal)
        );

        listEl.innerHTML = filtered.map((w, i) => `
          <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 text-xs">
            <div>
              <span class="font-black hanzi-font text-amber-300 text-sm mr-1.5">${escapeHtml(w.hanzi)}</span>
              <span class="text-emerald-400 font-semibold">${escapeHtml(w.pinyin)}</span>
              <div class="text-slate-300">${escapeHtml(w.meaning)}</div>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <span class="px-2 py-0.5 rounded bg-slate-900 text-emerald-300 text-xs" title="Hệ số nhớ SM-2 Ease: ${w.ease || 2.5}">${escapeHtml(w.interval || 'Đến hạn ôn')}</span>
              <button data-speak="${escapeHtml(w.hanzi)}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">🔊</button>
            </div>
          </div>
        `).join('');
      }

      // Dictionary, Stories, Grammar & External Resources
      let currentStoryIdx = 0;
      let showStoryPinyin = true;
      let inspectedWordObj = null;

      // Helper: Strip Vietnamese accents & Pinyin tone marks for forgiving instant search
      function stripViAccents(str) {
        return String(str || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/đ/g, 'd')
          .replace(/Đ/g, 'D')
          .toLowerCase()
          .trim();
      }

      // Massive Expanded Chinese-Vietnamese Everyday, Business, Travel, Food, Medical & Slang Lexicon
      const MASSIVE_EXTRA_VI_ZH_RAW = [
        // Đại từ, Xưng hô & Gia đình
        '我|wǒ|Ngã|tôi, mình, tớ', '你|nǐ|Nhĩ|bạn, cậu, anh, chị', '您|nín|Nâm|ngài, ông, bà, anh/chị (lịch sự)',
        '他|tā|Tha|anh ấy, ông ấy, nó', '她|tā|Tha|cô ấy, chị ấy, bà ấy', '我们|wǒmen|Ngã môn|chúng tôi, chúng ta, bọn mình',
        '你们|nǐmen|Nhĩ môn|các bạn, các anh chị', '他们|tāmen|Tha môn|họ, bọn họ', '大家|dàjiā|Đại gia|mọi người, cả nhà',
        '自己|zìjǐ|Tự kỷ|bản thân, tự mình', '别人|biérén|Biệt nhân|người khác', '父母|fùmǔ|Phụ mẫu|bố mẹ, cha mẹ',
        '爸爸|bàba|Ba ba|bố, ba, cha', '妈妈|māma|Ma ma|mẹ, má', '哥哥|gēge|Ca ca|anh trai', '姐姐|jiějie|Tỷ tỷ|chị gái',
        '弟弟|dìdi|Đệ đệ|em trai', '妹妹|mèimei|Muội muội|em gái', '老公|lǎogōng|Lão công|chồng, ông xã', '老婆|lǎopó|Lão bà|vợ, bà xã',
        '孩子|háizi|Hài tử|con cái, trẻ em', '男朋友|nánpéngyou|Nam bằng hữu|bạn trai, người yêu', '女朋友|nǚpéngyou|Nữ bằng hữu|bạn gái, người yêu',
        '亲爱的|qīn\'ài de|Thân ái đích|anh yêu, em yêu, cưng ơi', '闺蜜|guīmì|Khuê mật|bạn thân (nữ)', '哥们儿|gēmenr|Ca môn|anh em chí cốt, bạn thân (nam)',
        // Chào hỏi & Câu cửa miệng thông dụng
        '你好|nǐ hǎo|Nhĩ hảo|xin chào, chào bạn', '早上好|zǎoshang hǎo|Tảo thượng hảo|chào buổi sáng', '晚上好|wǎnshang hǎo|Vãn thượng hảo|chào buổi tối',
        '晚安|wǎn\'ān|Vãn an|chúc ngủ ngon', '再见|zàijiàn|Tái kiến|tạm biệt, hẹn gặp lại', '谢谢|xièxie|Tạ tạ|cảm ơn',
        '不客气|bù kèqi|Bất khách khí|không có chi, đừng khách sáo', '对不起|duìbuqǐ|Đối bất khởi|xin lỗi', '没关系|méi guānxi|Một quan hệ|không sao đâu',
        '请问|qǐngwèn|Thỉnh vấn|xin hỏi, cho tôi hỏi', '麻烦你|máfan nǐ|Phiền bạn|làm phiền bạn, nhờ bạn giúp', '辛苦了|xīnkǔ le|Tân khổ liễu|vất vả cho bạn rồi',
        '加油|jiāyóu|Gia du|cố lên, tiếp thêm lửa', '随便|suíbiàn|Tùy tiện|sao cũng được, tùy bạn', '算了吧|suàn le ba|Toán liễu ba|thôi bỏ đi, quên đi',
        '无所谓|wúsuǒwèi|Vô sở vị|sao cũng được, không quan trọng', '怪不得|guàibude|Quái bất đắc|hèn chi, thảo nào', '原来如此|yuánlái rúcǐ|Nguyên lai như thử|thì ra là vậy',
        '开玩笑|kāi wánxiào|Khai ngoạn tiếu|nói đùa, đùa thôi', '真的假的|zhēn de jiǎ de|Chân đích giả đích|thật hay đùa đấy, thật không vậy',
        // Thời gian, Ngày tháng & Phương hướng
        '今天|jīntiān|Kim thiên|hôm nay', '明天|míngtiān|Minh thiên|ngày mai', '后天|hòutiān|Hậu thiên|ngày kia, ngày mốt',
        '昨天|zuótiān|Tạc thiên|hôm qua', '前天|qiántiān|Tiền thiên|hôm kia', '现在|xiànzài|Hiện tại|bây giờ, hiện tại',
        '刚才|gāngcái|Cương tài|vừa nãy, mới lúc nãy', '马上|mǎshàng|Mã thượng|ngay lập tức, liền ngay', '立刻|lìkè|Lập khắc|tức khắc, ngay lập tức',
        '以后|yǐhòu|Dĩ hậu|sau này, về sau', '以前|yǐqián|Dĩ tiền|trước đây, ngày trước', '周末|zhōumò|Chu mạt|cuối tuần',
        '上午|shàngwǔ|Thượng ngọ|buổi sáng', '中午|zhōngwǔ|Trung ngọ|buổi trưa', '下午|xiàwǔ|Hạ ngọ|buổi chiều',
        '这里|zhèlǐ|Giá lý|ở đây, chỗ này', '那里|nàlǐ|Na lý|ở đó, chỗ kia', '左边|zuǒbiān|Tả biên|bên trái',
        '右边|yòubiān|Hữu biên|bên phải', '前面|qiánmiàn|Tiền diện|phía trước', '后面|hòumiàn|Hậu diện|phía sau, đằng sau',
        '对面|duìmiàn|Đối diện|đối diện', '附近|fùjìn|Phụ cận|gần đây, lân cận, quanh đây',
        // Ẩm thực, Nhà hàng, Trà sữa & Đồ uống
        '吃饭|chīfàn|Ngật phạn|ăn cơm', '早餐|zǎocān|Tảo xan|bữa sáng, ăn sáng', '午餐|wǔcān|Ngọ xan|bữa trưa, ăn trưa',
        '晚餐|wǎncān|Vãn xan|bữa tối, ăn tối', '夜宵|yèxiāo|Dạ tiêu|ăn đêm, bữa khuya', '火锅|huǒguō|Hỏa oa|lẩu, ăn lẩu',
        '烤肉|kǎoròu|Khảo nhục|thịt nướng, đồ nướng BBQ', '北京烤鸭|Běijīng kǎoyā|Bắc Kinh khảo áp|vịt quay Bắc Kinh', '小笼包|xiǎolóngbāo|Tiểu lung bao|bánh bao súp Thượng Hải',
        '水饺|shuǐjiǎo|Thủy sủi|sủi cảo, há cảo nước', '牛肉面|niúròumiàn|Ngưu nhục diện|mì bò', '炒饭|chǎofàn|Sao phạn|cơm rang, cơm chiên',
        '米粉|mǐfěn|Mễ phấn|bún, phở', '越南河粉|Yuènán héfěn|Việt Nam hà phấn|phở Việt Nam', '春卷|chūnjuǎn|Xuân quyển|nem rán, chả giò, gỏi cuốn',
        '奶茶|nǎichá|Nãi trà|trà sữa', '珍珠奶茶|zhēnzhū nǎichá|Chân châu nãi trà|trà sữa trân châu', '咖啡|kāfēi|Gia phê|cà phê',
        '冰美式|bīng měishì|Băng mỹ thức|cà phê Americano đá', '拿铁|nátiě|Nã thiết|cà phê Latte', '果汁|guǒzhī|Quả trấp|nước ép trái cây',
        '啤酒|píjiǔ|Bì tửu|bia', '矿泉水|kuàngquánshuǐ|Khoáng tuyền thủy|nước khoáng, nước lọc', '菜单|càidān|Thái đơn|thực đơn, menu',
        '点菜|diǎncài|Điểm thái|gọi món, đặt món', '买单|mǎidān|Mãi đơn|thanh toán tiền ăn, tính tiền', '打包|dǎbāo|Đả bao|gói mang về, đóng gói',
        '好吃|hǎochī|Hảo ngật|ngon (đồ ăn)', '好喝|hǎohē|Hảo hắt|ngon (đồ uống)', '辣|là|Lạt|cay',
        '甜|tián|Điềm|ngọt', '酸|suān|Toan|chua', '苦|kǔ|Khổ|đắng', '咸|xián|Hàm|mặn', '少冰|shǎo bīng|Thiểu băng|ít đá', '半糖|bàn táng|Bán đường|nửa đường, 50% đường',
        // Mua sắm, Mặc cả, Quần áo & Thương mại điện tử (Taobao / Ship hàng)
        '买东西|mǎi dōngxi|Mãi đông tây|mua đồ, mua sắm', '逛街|guàngjiē|Cuống nhai|dạo phố, đi shopping', '多少钱|duōshao qián|Đa thiểu tiền|bao nhiêu tiền',
        '太贵了|tài guì le|Thái quý liễu|đắt quá', '便宜一点|piányi yīdiǎn|Tiện nghi nhất điểm|rẻ hơn một chút, bớt chút đi', '打折|dǎzhé|Đả chiết|giảm giá, chiết khấu',
        '优惠|yōuhuì|Ưu đãi|ưu đãi, khuyến mãi', '包邮|bāoyóu|Bao bưu|miễn phí vận chuyển (freeship)', '快递|kuàidì|Khoái đệ|chuyển phát nhanh, giao hàng',
        '外卖|wàimài|Ngoại mại|đồ ăn giao tận nơi, ship đồ ăn', '退货|tuìhuò|Thoái hóa|trả hàng', '退款|tuìkuǎn|Thoái khoản|hoàn tiền',
        '好评|hǎopíng|Hảo bình|đánh giá tốt (5 sao)', '衣服|yīfu|Y phục|quần áo', '鞋子|xiézi|Hài tử|giày dép',
        '手机|shǒujī|Thủ cơ|điện thoại di động', '电脑|diànnǎo|Điện não|máy tính, laptop', '充电器|chōngdiànqì|Sung điện khí|cục sạc, dây sạc',
        // Thanh toán, Tiền tệ & Ngân hàng
        '微信支付|Wēixìn zhīfù|Vi tín chi phó|thanh toán WeChat Pay', '支付宝|Zhīfùbǎo|Chi phó bảo|Alipay', '扫码|sǎomǎ|Tảo mã|quét mã QR',
        '现金|xiànjīn|Hiện kim|tiền mặt', '信用卡|xìnyòngkǎ|Tín dụng tạp|thẻ tín dụng', '银行卡|yínhángkǎ|Ngân hàng tạp|thẻ ngân hàng',
        '转账|zhuǎnzhàng|Chuyển trướng|chuyển khoản', '人民币|rénmínbì|Nhân dân tệ|Nhân dân tệ (NDT)', '越南盾|Yuènándùn|Việt Nam thuẫn|Việt Nam Đồng (VNĐ)',
        '汇率|huìlǜ|Hối suất|tỷ giá ngoại tệ', '发票|fāpiào|Phát phiếu|hóa đơn đỏ, hóa đơn VAT',
        // Đi lại, Giao thông, Du lịch & Khách sạn
        '出租车|chūzūchē|Xuất tô xa|xe taxi', '网约车|wǎngyuēchē|Vọng ước xa|xe công nghệ (Didi/Grab)', '地铁|dìtiě|Địa thiết|tàu điện ngầm, metro',
        '高铁|gāotiě|Cao thiết|tàu cao tốc', '火车站|huǒchēzhàn|Hỏa xa trạm|ga tàu hỏa', '飞机场|fēijīchǎng|Phi cơ trường|sân bay',
        '机票|jīpiào|Cơ phiếu|vé máy bay', '护照|hùzhào|Hộ chiếu|hộ chiếu, passport', '签证|qiānzhèng|Ký chứng|thị thực, visa',
        '行李箱|xínglǐxiāng|Hành lý tương|vali hành lý', '登机牌|dēngjīpái|Đăng cơ bài|thẻ lên máy bay', '酒店|jiǔdiàn|Tửu điếm|khách sạn',
        '预订|yùdìng|Dự đính|đặt trước, booking', '退房|tuìfáng|Thoái phòng|trả phòng khách sạn (check-out)', '身份证|shēnfènzhèng|Thân phận chứng|căn cước công dân, CMND',
        '迷路|mílù|Mê lộ|lạc đường', '地图|dìtú|Địa đồ|bản đồ', '旅游|lǚyóu|Lữ du|du lịch',
        '中国|Zhōngguó|Trung Quốc|Trung Quốc', '越南|Yuènán|Việt Nam|Việt Nam', '北京|Běijīng|Bắc Kinh|Bắc Kinh',
        '上海|Shànghǎi|Thượng Hải|Thượng Hải', '广州|Guǎngzhōu|Quảng Châu|Quảng Châu', '深圳|Shēnzhèn|Thâm Quyến|Thâm Quyến',
        '河内|Hénèi|Hà Nội|Hà Nội', '胡志明市|Húzhìmíng shì|Hồ Chí Minh thị|Thành phố Hồ Chí Minh',
        // Công sở, Kinh doanh, Hợp đồng & Xuất nhập khẩu
        '工作|gōngzuò|Công tác|công việc, làm việc', '上班|shàngbān|Thượng ban|đi làm', '下班|xiàbān|Hạ ban|tan làm, hết giờ làm',
        '加班|jiābān|Gia ban|tăng ca, làm thêm giờ', '出差|chūchāi|Xuất sai|đi công tác', '请假|qǐngjià|Thỉnh giả|xin nghỉ phép',
        '开会|kāihuì|Khai hội|họp, mở cuộc họp', '面试|miànshì|Diện thí|phỏng vấn xin việc', '简历|jiǎnlì|Giản lịch|hồ sơ xin việc, CV',
        '老板|lǎobǎn|Lão bản|ông chủ, sếp', '同事|tóngshì|Đồng sự|đồng nghiệp', '客户|kèhù|Khách hộ|khách hàng, đối tác',
        '合同|hétong|Hợp đồng|hợp đồng', '签合同|qiān hétong|Ký hợp đồng|ký hợp đồng', '工资|gōngzī|Công tư|tiền lương',
        '奖金|jiǎngjīn|Thưởng kim|tiền thưởng', '合作|hézuò|Hợp tác|hợp tác', '谈判|tánpàn|Đàm phán|đàm phán, thương lượng',
        '报价|bàojià|Báo giá|báo giá', '样品|yàngpǐn|Dạng phẩm|hàng mẫu, sản phẩm mẫu', '工厂|gōngchǎng|Công xưởng|nhà máy, công xưởng',
        '进口|jìnkǒu|Nhập khẩu|nhập khẩu', '出口|chūkǒu|Xuất khẩu|xuất khẩu', '海关|hǎiguān|Hải quan|hải quan',
        // Y tế, Sức khỏe & Cảm xúc
        '医院|yīyuàn|Y viện|bệnh viện', '医生|yīshēng|Y sinh|bác sĩ', '护士|hùshi|Hộ sĩ|y tá, điều dưỡng',
        '药店|yàodiàn|Dược điếm|hiệu thuốc, nhà thuốc', '生病|shēngbìng|Sinh bệnh|bị ốm, đổ bệnh', '感冒|gǎnmào|Cảm mạo|cảm cúm, cảm lạnh',
        '发烧|fāshāo|Phát thiêu|bị sốt', '咳嗽|késou|Khái thấu|ho', '头疼|tóuténg|Đầu đông|đau đầu, nhức đầu',
        '肚子疼|dùzi téng|Đỗ tử đông|đau bụng', '过敏|guòmǐn|Quá mẫn|dị ứng', '休息|xiūxi|Hưu tức|nghỉ ngơi',
        '高兴|gāoxìng|Cao hứng|vui vẻ, mừng rỡ', '开心|kāixīn|Khai tâm|vui vẻ, hạnh phúc', '难过|nánguò|Nan quá|buồn bã, đau lòng',
        '生气|shēngqì|Sinh khí|tức giận, giận dỗi', '担心|dānxīn|Đam tâm|lo lắng', '紧张|jǐnzhāng|Khẩn trương|hồi hộp, căng thẳng',
        '累|lèi|Lụy|mệt, mệt mỏi', '困|kùn|Khốn|buồn ngủ', '饿|è|Ngạ|đói bụng', '渴|kě|Khát|khát nước',
        // Động từ, Tính từ & Cấu trúc cốt lõi
        '喜欢|xǐhuan|Hỷ hoan|thích, yêu thích', '爱|ài|Ái|yêu', '想|xiǎng|Tưởng|muốn, nhớ, nghĩ',
        '需要|xūyào|Nhu yếu|cần, nhu cầu', '应该|yīnggāi|Ưng cai|nên, cần phải', '可以|kěyǐ|Khả dĩ|có thể, được phép',
        '知道|zhīdào|Tri đạo|biết', '认识|rènshi|Nhận thức|quen biết', '觉得|juéde|Giác đắc|cảm thấy, cho rằng',
        '希望|xīwàng|Hy vọng|hy vọng, mong muốn', '帮助|bāngzhù|Bang trợ|giúp đỡ', '准备|zhǔnbèi|Chuẩn bị|chuẩn bị',
        '开始|kāishǐ|Khai thủy|bắt đầu', '结束|jiéshù|Kết thúc|kết thúc', '学习|xuéxí|Học tập|học, học tập',
        '练习|liànxí|Luyện tập|luyện tập, thực hành', '考试|kǎoshì|Khảo thí|thi cử, kiểm tra', '毕业|bìyè|Tốt nghiệp|tốt nghiệp',
        '漂亮|piàoliang|Phiêu lượng|xinh đẹp, đẹp', '帅|shuài|Soái|đẹp trai, phong độ', '聪明|cōngming|Thông minh|thông minh',
        '重要|zhòngyào|Trọng yếu|quan trọng', '容易|róngyì|Dung dị|dễ, dễ dàng', '难|nán|Nan|khó, khó khăn',
        '快|kuài|Khoái|nhanh', '慢|màn|Mạn|chậm', '忙|máng|Mang|bận, bận rộn', '安静|ānjìng|An tĩnh|yên tĩnh',
        '干净|gānjìng|Can tịnh|sạch sẽ', '方便|fāngbiàn|Phương tiện|tiện lợi, thuận tiện', '安全|ānquán|An toàn|an toàn',
        // Số đếm, Thứ tự, Lượng từ & Thời gian chi tiết
        '零|líng|Linh|số 0, lẻ', '一|yī|Nhất|số 1, một', '二|èr|Nhị|số 2, hai', '两|liǎng|Lưỡng|hai (dùng trước lượng từ)',
        '三|sān|Tam|số 3, ba', '四|sì|Tứ|số 4, bốn', '五|wǔ|Ngũ|số 5, năm', '六|liù|Lục|số 6, sáu',
        '七|qī|Thất|số 7, bảy', '八|bā|Bát|số 8, tám', '九|jiǔ|Cửu|số 9, chín', '十|shí|Thập|số 10, mười',
        '百|bǎi|Bách|trăm, một trăm', '千|qiān|Thiên|nghìn, ngàn', '万|wàn|Vạn|mười nghìn, vạn', '亿|yì|Ức|trăm triệu',
        '第一|dì yī|Đệ nhất|thứ nhất, số một, đứng đầu', '一半|yībàn|Nhất bán|một nửa, phân nửa',
        '个|gè|Cá|cái, chiếc, người (lượng từ chung)', '位|wèi|Vị|vị (lượng từ lịch sự cho người)', '本|běn|Bản|quyển, cuốn (sách, vở)',
        '件|jiàn|Kiện|chiếc, bộ (quần áo), sự việc', '杯|bēi|Bôi|cốc, ly, tách', '瓶|píng|Bình|chai, lọ',
        '碗|wǎn|Uyển|bát, chén, tô', '盘|pán|Bàn|đĩa, khay', '双|shuāng|Song|đôi, cặp (giày, đũa)',
        '条|tiáo|Điều|con (cá, chó, đường, sông), chiếc (quần, váy)', '张|zhāng|Trương|tờ (giấy), chiếc (bàn, giường, vé)',
        '把|bǎ|Bả|chiếc (ghế, ô, dao), nắm', '辆|liàng|Lượng|chiếc (xe hơi, xe máy, xe đạp)', '台|tái|Đài|chiếc, cỗ (máy tính, tivi, thiết bị)',
        '家|jiā|Gia|nhà, gia đình, quán, công ty', '所|suǒ|Sở|ngôi, trường, viện', '座|zuò|Tọa|tòa (nhà, núi, cầu)',
        '年|nián|Niên|năm', '月|yuè|Nguyệt|tháng, mặt trăng', '日|rì|Nhật|ngày, mặt trời', '号|hào|Hiệu|ngày (trong tháng), số hiệu',
        '星期|xīngqī|Tinh kỳ|tuần, thứ trong tuần', '星期一|xīngqīyī|Tinh kỳ nhất|thứ hai', '星期二|xīngqī\'èr|Tinh kỳ nhị|thứ ba',
        '星期三|xīngqīsān|Tinh kỳ tam|thứ tư', '星期四|xīngqīsì|Tinh kỳ tứ|thứ năm', '星期五|xīngqīwǔ|Tinh kỳ ngũ|thứ sáu',
        '星期六|xīngqīliù|Tinh kỳ lục|thứ bảy', '星期天|xīngqītiān|Tinh kỳ thiên|chủ nhật', '小时|xiǎoshí|Tiểu thời|tiếng đồng hồ, giờ',
        '分钟|fēnzhōng|Phân chung|phút', '秒|miǎo|Miểu|giây', '春天|chūntiān|Xuân thiên|mùa xuân',
        '夏天|xiàtiān|Hạ thiên|mùa hè, mùa hạ', '秋天|qiūtiān|Thu thiên|mùa thu', '冬天|dōngtiān|Đông thiên|mùa đông',
        // Thiên nhiên, Thời tiết, Động vật & Màu sắc
        '太阳|tàiyáng|Thái dương|mặt trời', '月亮|yuèliang|Nguyệt lượng|mặt trăng', '星星|xīngxing|Tinh tinh|ngôi sao',
        '天空|tiānkōng|Thiên không|bầu trời', '云|yún|Vân|mây, đám mây', '风|fēng|Phong|gió',
        '雨|yǔ|Vũ|mưa', '下雨|xiàyǔ|Hạ vũ|trời mưa, đổ mưa', '雪|xuě|Tuyết|tuyết', '下雪|xiàxuě|Hạ tuyết|tuyết rơi',
        '晴天|qíngtiān|Tình thiên|trời nắng, ngày nắng đẹp', '阴天|yīntiān|Âm thiên|trời âm u, nhiều mây',
        '热|rè|Nhiệt|nóng, ấm áp', '冷|lěng|Lãnh|lạnh', '凉快|liángkuai|Lương khoái|mát mẻ', '暖和|nuǎnhuo|Noãn hòa|ấm áp',
        '山|shān|Sơn|núi, ngọn núi', '河|hé|Hà|sông, dòng sông', '海|hǎi|Hải|biển, đại dương', '湖|hú|Hồ|hồ nước',
        '树|shù|Thụ|cây, cái cây', '花|huā|Hoa|hoa, bông hoa', '草|cǎo|Thảo|cỏ, bãi cỏ', '森林|sēnlín|Sâm lâm|rừng, khu rừng',
        '猫|māo|Miêu|con mèo, mèo', '狗|gǒu|Cẩu|con chó, chó', '鸟|niǎo|Điểu|con chim, chim', '鱼|yú|Ngư|con cá, cá',
        '马|mǎ|Mã|con ngựa, ngựa', '牛|niú|Ngưu|con bò, con trâu', '鸡|jī|Kê|con gà, thịt gà', '猪|zhū|Trư|con lợn, con heo',
        '老虎|lǎohǔ|Lão hổ|con hổ, cọp', '龙|lóng|Long|con rồng', '熊猫|xióngmāo|Hùng miêu|gấu trúc', '兔子|tùzi|Thố tử|con thỏ',
        '颜色|yánsè|Nhan sắc|màu sắc', '红色|hóngsè|Hồng sắc|màu đỏ', '黄色|huángsè|Hoàng sắc|màu vàng',
        '蓝色|lánsè|Lam sắc|màu xanh dương, xanh nước biển', '绿色|lǜsè|Lục sắc|màu xanh lá cây', '白色|báisè|Bạch sắc|màu trắng',
        '黑色|hēisè|Hắc sắc|màu đen', '粉色|fěnsè|Phấn sắc|màu hồng', '紫色|zǐsè|Tử sắc|màu tím', '灰色|huīsè|Hôi sắc|màu xám',
        // Cơ thể người, Trang phục & Đồ dùng gia đình
        '身体|shēntǐ|Thân thể|cơ thể, sức khỏe', '头|tóu|Đầu|cái đầu', '头发|tóufa|Đầu phát|tóc, mái tóc',
        '脸|liǎn|Kiểm|khuôn mặt, mặt', '眼睛|yǎnjing|Nhãn tinh|đôi mắt, mắt', '鼻子|bízi|Tị tử|cái mũi',
        '嘴巴|zuǐba|Chủy ba|cái miệng', '耳朵|ěrduo|Nhĩ đóa|cái tai, đôi tai', '手|shǒu|Thủ|bàn tay, tay',
        '脚|jiǎo|Cước|bàn chân, chân', '腿|tuǐ|Thoái|cái đùi, đôi chân', '心|xīn|Tâm|trái tim, tấm lòng',
        '衬衫|chènshān|Sấn sam|áo sơ mi', 'T恤|T-xù|T-tuất|áo phông, áo thun', '外套|wàitào|Ngoại sáo|áo khoác',
        '毛衣|máoyī|Mao y|áo len', '裤子|kùzi|Khố tử|cái quần', '牛仔裤|niúzǎikù|Ngưu tể khố|quần bò, quần jean',
        '裙子|qúnzi|Quần tử|váy, chân váy, đầm', '运动鞋|yùndòngxié|Vận động hài|giày thể thao', '高跟鞋|gāogēnxié|Cao căn hài|giày cao gót',
        '帽子|màozi|Mạo tử|cái mũ, cái nón', '眼镜|yǎnjìng|Nhãn kính|kính mắt, mắt kính', '手表|shǒubiǎo|Thủ biểu|đồng hồ đeo tay',
        '包|bāo|Bao|túi xách, ba lô, cái bao', '雨伞|yǔsǎn|Vũ tán|cái ô, cây dù', '钥匙|yàoshi|Thược thi|chìa khóa',
        '房子|fángzi|Phòng tử|ngôi nhà, căn hộ', '房间|fángjiān|Phòng gian|căn phòng, phòng', '客厅|kètīng|Khách sảnh|phòng khách',
        '卧室|wòshì|Ngọa thất|phòng ngủ', '厨房|chúfáng|Trù phòng|nhà bếp, phòng bếp', '卫生间|wèishēngjiān|Vệ sinh gian|nhà vệ sinh, toilet',
        '门|mén|Môn|cánh cửa, cổng', '窗户|chuānghu|Song hộ|cửa sổ', '桌子|zhuōzi|Trác tử|cái bàn',
        '椅子|yǐzi|Ỷ tử|cái ghế', '床|chuáng|Sàng|cái giường', '沙发|shāfā|Sa phát|ghế sofa',
        '电视|diànshì|Điện thị|tivi, truyền hình', '冰箱|bīngxiāng|Băng tương|tủ lạnh', '空调|kōngtiáo|Không điều|máy lạnh, điều hòa',
        '洗衣机|xǐyījī|Tẩy y cơ|máy giặt', '灯|dēng|Đăng|cái đèn, bóng đèn',
        // Trái cây, Rau củ & Món ăn phổ biến
        '水果|shuǐguǒ|Thủy quả|trái cây, hoa quả', '苹果|píngguǒ|Bình quả|quả táo', '香蕉|xiāngjiāo|Hương tiêu|quả chuối',
        '西瓜|xīguā|Tây qua|dưa hấu', '草莓|cǎoméi|Thảo mai|dâu tây', '葡萄|pútao|Bồ đào|quả nho',
        '芒果|mángguǒ|Mang quả|quả xoài', '榴莲|liúlián|Lựu liên|sầu riêng', '橘子|júzi|Quất tử|quả quýt, cam',
        '蔬菜|shūcài|Sơ thái|rau củ, rau xanh', '西红柿|xīhóngshì|Tây hồng thị|cà chua', '土豆|tǔdòu|Thổ đậu|khoai tây',
        '鸡蛋|jīdàn|Kê đản|trứng gà', '牛肉|niúròu|Ngưu nhục|thịt bò', '猪肉|zhūròu|Trư nhục|thịt lợn, thịt heo',
        '鸡肉|jīròu|Kê nhục|thịt gà', '海鲜|hǎixiān|Hải tiên|hải sản', '米饭|mǐfàn|Mễ phạn|cơm trắng',
        '面包|miànbāo|Diện bao|bánh mì', '蛋糕|dàngāo|Đản cao|bánh ngọt, bánh kem, bánh sinh nhật', '巧克力|qiǎokèlì|Xảo khắc lực|sô-cô-la',
        '冰淇淋|bīngqílín|Băng kỳ lâm|kem lạnh', '茶|chá|Trà|trà, chè', '绿茶|lǜchá|Lục trà|trà xanh', '牛奶|niúnǎi|Ngưu nãi|sữa bò, sữa tươi',
        // Nghề nghiệp, Trường học, Môn học & Xã hội
        '老师|lǎoshī|Lão sư|giáo viên, thầy giáo, cô giáo', '学生|xuésheng|Học sinh|học sinh, sinh viên', '同学|tóngxué|Đồng học|bạn cùng lớp, bạn học',
        '校长|xiàozhǎng|Hiệu trưởng|hiệu trưởng', '教授|jiàoshòu|Giáo thụ|giáo sư', '工程师|gōngchéngshī|Công trình sư|kỹ sư',
        '设计师|shèjìshī|Thiết kế sư|nhà thiết kế, designer', '程序员|chéngxùyuán|Trình tự viên|lập trình viên, IT',
        '律师|lǜshī|Luật sư|luật sư', '记者|jìzhě|Ký giả|nhà báo, phóng viên', '演员|yǎnyuán|Diễn viên|diễn viên',
        '歌手|gēshǒu|Ca thủ|ca sĩ', '警察|jǐngchá|Cảnh sát|cảnh sát, công an', '司机|sījī|Tư cơ|tài xế, lái xe',
        '服务员|fúwùyuán|Phục vụ viên|nhân viên phục vụ', '导游|dǎoyóu|Đạo du|hướng dẫn viên du lịch', '翻译|fānyì|Phiên dịch|phiên dịch viên, dịch thuật',
        '会计|kuàijì|Kế toán|kế toán', '经理|jīnglǐ|Kinh lý|giám đốc, quản lý', '董事长|dǒngshìzhǎng|Đổng sự trưởng|chủ tịch hội đồng quản trị',
        '学校|xuéxiào|Học hiệu|trường học', '大学|dàxué|Đại học|trường đại học', '图书馆|túshūguǎn|Đồ thư quán|thư viện',
        '教室|jiàoshì|Giáo thất|lớp học, phòng học', '宿舍|sùshè|Túc xá|ký túc xá', '作业|zuòyè|Tác nghiệp|bài tập về nhà',
        '课本|kèběn|Khóa bản|sách giáo khoa', '词典|cídiǎn|Từ điển|từ điển', '笔记本|bǐjìběn|Bút ký bản|sổ tay, vở ghi chép, laptop',
        '铅笔|qiānbǐ|Duyên bút|bút chì', '毛笔|máobǐ|Mao bút|bút lông thư pháp', '历史|lìshǐ|Lịch sử|lịch sử',
        '文化|wénhuà|Văn hóa|văn hóa', '经济|jīngjì|Kinh tế|kinh tế', '政治|zhèngzhì|Chính trị|chính trị',
        '科学|kēxué|Khoa học|khoa học', '数学|shùxué|Số học|toán học', '艺术|yìshù|Nghệ thuật|nghệ thuật',
        '音乐|yīnyuè|Âm nhạc|âm nhạc', '电影|diànyǐng|Điện ảnh|phim, điện ảnh', '体育|tǐyù|Thể dục|thể thao, thể dục',
        // Công nghệ, Internet, Mạng xã hội & Đời sống hiện đại
        '网络|wǎngluò|Vọng lạc|mạng internet', '网站|wǎngzhàn|Vọng trạm|trang web, website', '软件|ruǎnjiàn|Nhuyễn kiện|phần mềm, ứng dụng, app',
        '账号|zhànghào|Trướng hiệu|tài khoản', '密码|mìmǎ|Mật mã|mật khẩu, password', '登录|dēnglù|Đăng lục|đăng nhập',
        '注册|zhùcè|Chú sách|đăng ký tài khoản', '下载|xiàzǎi|Hạ tải|tải xuống, download', '上传|shàngchuán|Thượng truyền|tải lên, upload',
        '搜索|sōusuǒ|Sưu tầm|tìm kiếm', '分享|fēnxiǎng|Phân hưởng|chia sẻ, share', '点赞|diǎnzàn|Điểm tán|thả tim, bấm like',
        '评论|pínglùn|Bình luận|bình luận, comment', '直播|zhíbō|Trực bá|phát trực tiếp, livestream', '视频|shìpín|Thị tần|video, clip',
        '照片|zhàopiàn|Chiếu phiến|bức ảnh, hình ảnh', '人工智能|réngōng zhìnéng|Nhân công trí năng|trí tuệ nhân tạo (AI)',
        '数据|shùjù|Số cứ|dữ liệu, data', '系统|xìtǒng|Hệ thống|hệ thống', '信息|xìnxī|Tín tức|thông tin, tin nhắn',
        // Động từ hành động hàng ngày (Từ cốt lõi để ghép mọi câu!)
        '看|kàn|Khán|nhìn, xem, đọc, thăm', '听|tīng|Thính|nghe', '说|shuō|Thuyết|nói', '读|dú|Độc|đọc to',
        '写|xiě|Tả|viết', '吃|chī|Ngật|ăn', '喝|hē|Hắt|uống', '睡|shuì|Thụy|ngủ', '走|zǒu|Tẩu|đi bộ, rời đi',
        '跑|pǎo|Bào|chạy', '来|lái|Lai|đến, tới', '去|qù|Khứ|đi', '回|huí|Hồi|về, quay về',
        '到|dào|Đáo|đến nơi, tới', '进|jìn|Tiến|vào, đi vào', '出|chū|Xuất|ra, đi ra', '上|shàng|Thượng|lên, đi làm, đi học',
        '下|xià|Hạ|xuống, tan làm, tan học', '买|mǎi|Mãi|mua', '卖|mài|Mại|bán', '给|gěi|Cấp|cho, đưa cho, tặng',
        '送|sòng|Tống|tặng, tiễn, giao hàng', '找|zhǎo|Trảo|tìm, tìm kiếm', '用|yòng|Dụng|dùng, sử dụng',
        '做|zuò|Tố|làm, nấu', '打|dǎ|Đả|đánh, gọi (điện thoại), bắt (xe)', '开|kāi|Khai|mở, lái (xe), tổ chức',
        '关|guān|Quan|đóng, tắt (điện, máy)', '穿|chuān|Xuyên|mặc (quần áo), đi (giày)', '戴|dài|Đái|đội (mũ), đeo (kính, đồng hồ, khẩu trang)',
        '拿|ná|Nã|cầm, lấy', '带|dài|Đới|mang theo, đem theo, dẫn theo', '放|fàng|Phóng|đặt, để, thả',
        '搬|bān|Ban|chuyển, dọn (nhà, đồ)', '洗|xǐ|Tẩy|rửa, giặt, tắm', '打扫|dǎsǎo|Đả tảo|quét dọn, dọn dẹp',
        '做饭|zuòfàn|Tố phạn|nấu cơm, nấu ăn', '刷牙|shuāyá|Soát nha|đánh răng', '洗脸|xǐliǎn|Tẩy kiểm|rửa mặt',
        '洗澡|xǐzǎo|Tẩy tảo|tắm, đi tắm', '起床|qǐchuáng|Khởi sàng|thức dậy, ngủ dậy', '睡觉|shuìjiào|Thụy giác|đi ngủ',
        '散步|sànbù|Tản bộ|đi dạo, tản bộ', '拍照|pāizhào|Phách chiếu|chụp ảnh', '唱歌|chànggē|Xướng ca|hát, ca hát',
        '跳舞|tiàowǔ|Khiêu vũ|nhảy múa, khiêu vũ', '游泳|yóuyǒng|Du vịnh|bơi lội', '踢足球|tī zúqiú|Thích túc cầu|đá bóng',
        '打篮球|dǎ lánqiú|Đả lam cầu|chơi bóng rổ', '问|wèn|Vấn|hỏi', '回答|huídá|Hồi đáp|trả lời, giải đáp',
        '告诉|gàosu|Cáo tố|nói cho biết, bảo', '介绍|jièshào|Giới thiệu|giới thiệu', '解释|jiěshì|Giải thích|giải thích',
        '讨论|tǎolùn|Thảo luận|thảo luận, bàn bạc', '决定|juédìng|Quyết định|quyết định', '选择|xuǎnzé|Tuyển trạch|lựa chọn',
        '同意|tóngyì|Đồng ý|đồng ý, tán thành', '拒绝|jùjué|Cự tuyệt|từ chối', '相信|xiāngxìn|Tương tín|tin tưởng, tin rằng',
        '怀疑|huáiyí|Hoài nghi|nghi ngờ, hoài nghi', '记得|jìde|Ký đắc|nhớ, còn nhớ', '忘记|wàngjì|Vong ký|quên, lãng quên',
        '明白|míngbai|Minh bạch|hiểu, rõ ràng', '懂|dǒng|Đổng|hiểu', '清楚|qīngchu|Thanh sở|rõ ràng',
        '成功|chénggōng|Thành công|thành công', '失败|shībài|Thất bại|thất bại', '进步|jìnbù|Tiến bộ|tiến bộ',
        '努力|nǔlì|Nỗ lực|nỗ lực, cố gắng, chăm chỉ', '坚持|jiānchí|Kiên trì|kiên trì, bền bỉ', '放弃|fàngqì|Phóng khí|từ bỏ, bỏ cuộc',
        '结婚|jiéhūn|Kết hôn|kết hôn, đám cưới', '分手|fēnshǒu|Phân thủ|chia tay', '约会|yuēhuì|Ước hội|hẹn hò, cuộc hẹn',
        '投资|tóuzī|Đầu tư|đầu tư', '创业|chuàngyè|Sáng nghiệp|khởi nghiệp', '发财|fācái|Phát tài|phát tài, làm giàu',
        // Phó từ, Liên từ, Giới từ, Đại từ nghi vấn & Thành ngữ 4 chữ (成语)
        '什么|shénme|Thập ma|cái gì, gì', '谁|shéi|Thùy|ai, người nào', '哪儿|nǎr|Na nhi|ở đâu, chỗ nào',
        '哪里|nǎlǐ|Na lý|ở đâu, đâu có (khiêm tốn)', '怎么|zěnme|Chẩm ma|như thế nào, làm sao', '怎么样|zěnmeyàng|Chẩm ma dạng|thế nào, ra sao',
        '为什么|wèishénme|Vị thập ma|tại sao, vì sao', '多少|duōshao|Đa thiểu|bao nhiêu', '几|jǐ|Kỷ|mấy, vài',
        '很|hěn|Ngận|rất', '非常|fēicháng|Phi thường|vô cùng, cực kỳ, hết sức', '特别|tèbié|Đặc biệt|đặc biệt, cực kỳ',
        '太|tài|Thái|quá, lắm', '真|zhēn|Chân|thật, thật là', '最|zuì|Tối|nhất (so sánh nhất)',
        '更|gèng|Cánh|hơn, càng hơn', '越|yuè|Việt|càng', '已经|yǐjīng|Dĩ kinh|đã, rồi',
        '正在|zhèngzài|Chính tại|đang', '一直|yīzhí|Nhất trực|luôn luôn, suốt, thẳng một mạch', '经常|jīngcháng|Kinh thường|thường xuyên',
        '有时候|yǒushíhou|Hữu thời hậu|có lúc, thỉnh thoảng', '从来|cónglái|Tùng lai|từ trước tới nay', '也许|yěxǔ|Dã hứa|có lẽ, biết đâu',
        '大概|dàgài|Đại khái|khoảng chừng, có lẽ', '一定|yīdìng|Nhất định|nhất định, chắc chắn', '必须|bìxū|Tất tu|bắt buộc phải, nhất thiết phải',
        '因为|yīnwèi|Nhân vị|bởi vì, vì', '所以|suǒyǐ|Sở dĩ|cho nên, vì vậy', '虽然|suīrán|Tuy nhiên|tuy rằng, mặc dù',
        '但是|dànshì|Đãn thị|nhưng, thế nhưng', '如果|rúguǒ|Như quả|nếu, nếu như', '不但|búdàn|Bất đãn|không những',
        '而且|érqiě|Nhi thả|mà còn', '只要|zhǐyào|Chỉ yếu|chỉ cần', '只有|zhǐyǒu|Chỉ hữu|chỉ có',
        '无论|wúlùn|Vô luận|bất luận, cho dù', '除了|chúle|Trừ liễu|ngoài... ra, trừ... ra', '关于|guānyú|Quan ư|về, liên quan đến',
        '半途而废|bàntú ér fèi|Bán đồ nhi phế|bỏ cuộc giữa chừng', '入乡随俗|rùxiāng suísú|Nhập hương tùy tục|nhập gia tùy tục',
        '熟能生巧|shúnéng shēngqiǎo|Thục năng sinh xảo|trăm hay không bằng tay quen', '万事如意|wànshì rúyì|Vạn sự như ý|vạn sự như ý',
        '一见钟情|yījiàn zhōngqíng|Nhất kiến chung tình|yêu từ cái nhìn đầu tiên', '马马虎虎|mǎmǎhūhū|Mã mã hổ hổ|tàm tạm, bình thường, qua loa',
        '乱七八糟|luànqībāzāo|Loạn thất bát tao|lộn xộn, bừa bộn', '莫名其妙|mòmíng qímiào|Mạc danh kỳ diệu|không hiểu ra làm sao, kỳ quặc',
        '全心全意|quánxīn quányì|Toàn tâm toàn ý|toàn tâm toàn ý, hết lòng', '独一无二|dúyī wú\'èr|Độc nhất vô nhị|độc nhất vô nhị'
      ];

      let _unifiedDictionaryCache = null;
      let _dictDisplayLimit = 60;

      function getUnifiedMasterDictionary() {
        if (_unifiedDictionaryCache) return _unifiedDictionaryCache;
        const mapByHanzi = new Map();

        function addLexiconEntry(hz, py, hv, mn, ex, hskTag, domainKey) {
          if (!hz) return;
          if (!mapByHanzi.has(hz)) {
            mapByHanzi.set(hz, {
              hanzi: hz,
              pinyin: py,
              plainPinyin: stripViAccents(py),
              hanviet: hv || 'Giao tiếp',
              meaning: mn,
              plainMeaning: stripViAccents(mn + ' ' + (hv || '')),
              example: ex || `${hz} (${py}) — ${mn}`,
              hsk: hskTag || 'Giao tiếp',
              realmName: hskTag || 'Giao tiếp',
              domain: domainKey || 'core'
            });
          } else {
            const cur = mapByHanzi.get(hz);
            if (mn && !cur.meaning.toLowerCase().includes(mn.toLowerCase())) {
              cur.meaning = cur.meaning + ' • ' + mn;
              cur.plainMeaning = stripViAccents(cur.meaning + ' ' + cur.hanviet);
            }
          }
        }

        // LAYER 1: HSK 1-6 Official Vocabulary Banks (~600 words)
        [1, 2, 3, 4, 5, 6].forEach(lv => {
          getParsedHskBank(lv).forEach(w => {
            if (w && w.hanzi) {
              addLexiconEntry(
                w.hanzi,
                w.pinyin,
                w.hanviet || ('Từ chuẩn HSK ' + lv),
                w.meaning,
                w.rawExample || w.example || (w.hanzi + ' — ' + w.meaning),
                'HSK ' + lv,
                'core'
              );
            }
          });
        });

        // LAYER 2: 30-Domain Everyday, Business, Travel, Food, Medical & Slang Lexicon (~450 words)
        MASSIVE_EXTRA_VI_ZH_RAW.forEach(row => {
          const [hz, py, hv, mn] = row.split('|');
          addLexiconEntry(hz, py, hv || 'Thông dụng', mn, `常用表达：${hz} (${py}) — ${mn}`, 'Thông dụng', 'core');
        });

        // LAYER 3: Custom User SRS Words
        ((appState && appState.srsWords) || []).forEach(w => {
          if (w && w.hanzi) {
            addLexiconEntry(
              w.hanzi,
              w.pinyin || generateLibraryPinyinForText(w.hanzi),
              'Sổ tay',
              w.meaning || '',
              w.example || w.hanzi,
              w.hsk || 'Cá nhân',
              'core'
            );
          }
        });

        // LAYER 4: Verb + Resultative / Directional Complements (45 Action Verbs * 22 Complements = 990 Compound Verbs)
        const BASE_VERBS_45 = [
          ['看', 'kàn', 'Khán', 'xem, nhìn, đọc'], ['听', 'tīng', 'Thính', 'nghe'], ['说', 'shuō', 'Thuyết', 'nói'],
          ['写', 'xiě', 'Tả', 'viết'], ['读', 'dú', 'Độc', 'đọc'], ['吃', 'chī', 'Ngật', 'ăn'],
          ['喝', 'hē', 'Hắt', 'uống'], ['买', 'mǎi', 'Mãi', 'mua'], ['卖', 'mài', 'Mại', 'bán'],
          ['做', 'zuò', 'Tố', 'làm'], ['学', 'xué', 'Học', 'học'], ['找', 'zhǎo', 'Trảo', 'tìm'],
          ['拿', 'ná', 'Nã', 'cầm, lấy'], ['送', 'sòng', 'Tống', 'tặng, giao'], ['搬', 'bān', 'Ban', 'chuyển, dọn'],
          ['洗', 'xǐ', 'Tẩy', 'rửa, giặt'], ['开', 'kāi', 'Khai', 'mở, lái'], ['关', 'guān', 'Quan', 'đóng, tắt'],
          ['穿', 'chuān', 'Xuyên', 'mặc'], ['走', 'zǒu', 'Tẩu', 'đi bộ'], ['跑', 'pǎo', 'Bào', 'chạy'],
          ['记', 'jì', 'Ký', 'nhớ, ghi chép'], ['算', 'suàn', 'Toán', 'tính toán'], ['查', 'chá', 'Tra', 'tra cứu, kiểm tra'],
          ['改', 'gǎi', 'Cải', 'sửa đổi'], ['修', 'xiū', 'Tu', 'sửa chữa'], ['办', 'bàn', 'Biện', 'giải quyết, làm thủ tục'],
          ['谈', 'tán', 'Đàm', 'đàm phán, bàn bạc'], ['签', 'qiān', 'Ký', 'ký kết'], ['发', 'fā', 'Phát', 'gửi đi'],
          ['收', 'shōu', 'Thu', 'nhận được'], ['寄', 'jì', 'Ký', 'gửi bưu phẩm'], ['退', 'tuì', 'Thoái', 'trả lại, hoàn'],
          ['换', 'huàn', 'Hoán', 'đổi'], ['订', 'dìng', 'Đính', 'đặt trước'], ['约', 'yuē', 'Ước', 'hẹn'],
          ['考', 'kǎo', 'Khảo', 'thi'], ['练', 'liàn', 'Luyện', 'luyện tập'], ['教', 'jiāo', 'Giáo', 'dạy'],
          ['帮', 'bāng', 'Bang', 'giúp'], ['救', 'jiù', 'Cứu', 'cứu'], ['治', 'zhì', 'Trị', 'chữa trị'],
          ['聊', 'liáo', 'Liêu', 'trò chuyện'], ['玩', 'wán', 'Ngoạn', 'chơi'], ['用', 'yòng', 'Dụng', 'dùng']
        ];
        const COMPLEMENTS_22 = [
          ['完', 'wán', 'Hoàn', 'xong, hoàn tất'], ['好', 'hǎo', 'Hảo', 'xong xuôi, tốt đẹp'],
          ['懂', 'dǒng', 'Đổng', 'hiểu, hiểu rõ'], ['清楚', 'qīngchu', 'Thanh sở', 'rõ ràng'],
          ['见', 'jiàn', 'Kiến', 'thấy'], ['到', 'dào', 'Đáo', 'được, tới'],
          ['错', 'cuò', 'Thố', 'nhầm, sai'], ['对', 'duì', 'Đối', 'đúng, chuẩn'],
          ['出来', 'chūlái', 'Xuất lai', 'ra, nhận ra'], ['进去', 'jìnqù', 'Tiến khứ', 'vào trong'],
          ['出去', 'chūqù', 'Xuất khứ', 'ra ngoài'], ['回来', 'huílái', 'Hồi lai', 'quay về đây'],
          ['回去', 'huíqù', 'Hồi khứ', 'trở về đó'], ['上来', 'shànglái', 'Thượng lai', 'lên đây'],
          ['下来', 'xiàlái', 'Hạ lai', 'xuống, tiếp tục'], ['起来', 'qǐlái', 'Khởi lai', 'lên, bắt đầu'],
          ['下去', 'xiàqù', 'Hạ khứ', 'tiếp tục xuống'], ['过', 'guò', 'Qua', 'từng qua'],
          ['不了', 'buliǎo', 'Bất liễu', 'không thể hết/được'], ['得及', 'dejí', 'Đắc cập', 'kịp lúc'],
          ['不及', 'bùjí', 'Bất cập', 'không kịp'], ['惯', 'guàn', 'Quán', 'quen với']
        ];
        BASE_VERBS_45.forEach(v => {
          const vShortVi = v[3].split(',')[0].trim();
          COMPLEMENTS_22.forEach(c => {
            const hz = v[0] + c[0];
            const py = v[1] + ' ' + c[1];
            const hv = v[2] + ' ' + c[2].toLowerCase();
            const mn = vShortVi + ' ' + c[3];
            addLexiconEntry(hz, py, hv, mn, `我已经${hz}了 — Tôi đã ${mn} rồi.`, 'Cụm Động-Bổ', 'complement');
          });
        });

        // LAYER 5: Degree/Frequency Adverbs + 80 Everyday Adjectives (24 * 80 = 1,920 Spoken Descriptive Phrases)
        const ADVERBS_24 = [
          ['很', 'hěn', 'rất'], ['非常', 'fēicháng', 'vô cùng, cực kỳ'], ['特别', 'tèbié', 'đặc biệt, cực kỳ'],
          ['真', 'zhēn', 'thật là'], ['最', 'zuì', 'nhất'], ['更', 'gèng', 'càng, hơn'],
          ['有点儿', 'yǒudiǎnr', 'hơi một chút'], ['稍微', 'shāowēi', 'hơi nhẹ'], ['相当', 'xiāngdāng', 'tương đối, khá là'],
          ['极其', 'jíqí', 'cực kỳ'], ['越来越', 'yuèláiyuè', 'ngày càng'], ['不太', 'bútài', 'không... lắm'],
          ['不算', 'búsuàn', 'không tính là'], ['一点也不', 'yīdiǎn yě bù', 'một chút cũng không'], ['比较', 'bǐjiào', 'khá là, tương đối'],
          ['十分', 'shífēn', 'mười phần, hết sức'], ['格外', 'géwài', 'đặc biệt hơn thường'], ['超', 'chāo', 'siêu'],
          ['实在太', 'shízài tài', 'thực sự quá'], ['没那么', 'méi nàme', 'không... đến thế'], ['还算', 'háisuàn', 'vẫn tính là'],
          ['似乎很', 'sìhū hěn', 'dường như rất'], ['确实很', 'quèshí hěn', 'quả thực rất'], ['真的太', 'zhēnde tài', 'thật sự quá']
        ];
        const ADJECTIVES_80 = [
          ['好', 'hǎo', 'tốt, hay, khỏe'], ['快', 'kuài', 'nhanh'], ['慢', 'màn', 'chậm'],
          ['贵', 'guì', 'đắt'], ['便宜', 'piányi', 'rẻ'], ['忙', 'máng', 'bận rộn'],
          ['累', 'lèi', 'mệt mỏi'], ['饿', 'è', 'đói bụng'], ['渴', 'kě', 'khát nước'],
          ['困', 'kùn', 'buồn ngủ'], ['冷', 'lěng', 'lạnh'], ['热', 'rè', 'nóng'],
          ['凉快', 'liángkuai', 'mát mẻ'], ['暖和', 'nuǎnhuo', 'ấm áp'], ['漂亮', 'piàoliang', 'xinh đẹp'],
          ['帅', 'shuài', 'đẹp trai'], ['聪明', 'cōngming', 'thông minh'], ['认真', 'rènzhēn', 'nghiêm túc, chăm chỉ'],
          ['努力', 'nǔlì', 'nỗ lực, cố gắng'], ['热情', 'rèqíng', 'nhiệt tình'], ['客气', 'kèqi', 'khách sáo, lịch sự'],
          ['礼貌', 'lǐmào', 'lễ phép, lịch sự'], ['开心', 'kāixīn', 'vui vẻ'], ['高兴', 'gāoxìng', 'vui mừng'],
          ['难过', 'nánguò', 'buồn bã'], ['伤心', 'shāngxīn', 'đau lòng'], ['生气', 'shēngqì', 'tức giận'],
          ['着急', 'zháojí', 'sốt ruột, vội vàng'], ['紧张', 'jǐnzhāng', 'căng thẳng, hồi hộp'], ['担心', 'dānxīn', 'lo lắng'],
          ['害怕', 'hàipà', 'sợ hãi'], ['满意', 'mǎnyì', 'hài lòng'], ['失望', 'shīwàng', 'thất vọng'],
          ['舒服', 'shūfu', 'thoải mái, dễ chịu'], ['难受', 'nánshòu', 'khó chịu'], ['方便', 'fāngbiàn', 'tiện lợi'],
          ['麻烦', 'máfan', 'phiền phức, rắc rối'], ['安全', 'ānquán', 'an toàn'], ['危险', 'wēixiǎn', 'nguy hiểm'],
          ['干净', 'gānjìng', 'sạch sẽ'], ['脏', 'zāng', 'bẩn'], ['乱', 'luàn', 'lộn xộn'],
          ['安静', 'ānjìng', 'yên tĩnh'], ['吵', 'chǎo', 'ồn ào'], ['热闹', 'rènao', 'náo nhiệt, đông vui'],
          ['清楚', 'qīngchu', 'rõ ràng'], ['模糊', 'móhu', 'mơ hồ, mờ'], ['简单', 'jiǎndān', 'đơn giản'],
          ['复杂', 'fùzá', 'phức tạp'], ['容易', 'róngyì', 'dễ dàng'], ['难', 'nán', 'khó'],
          ['重要', 'zhòngyào', 'quan trọng'], ['必要', 'bìyào', 'cần thiết'], ['合适', 'héshì', 'phù hợp, vừa vặn'],
          ['划算', 'huásuàn', 'đáng tiền, hời'], ['正宗', 'zhèngzōng', 'chuẩn vị, chính gốc'], ['地道', 'dìdao', 'chuẩn bản xứ'],
          ['新鲜', 'xīnxiān', 'tươi mới'], ['好吃', 'hǎochī', 'ăn ngon'], ['好喝', 'hǎohē', 'uống ngon'],
          ['好玩', 'hǎowán', 'vui, thú vị'], ['好看', 'hǎokàn', 'đẹp mắt, hay'], ['好听', 'hǎotīng', 'nghe hay, êm tai'],
          ['有用', 'yǒuyòng', 'hữu ích, có ích'], ['有趣', 'yǒuqù', 'thú vị'], ['无聊', 'wúliáo', 'nhàm chán'],
          ['精彩', 'jīngcǎi', 'đặc sắc, tuyệt vời'], ['优秀', 'yōuxiù', 'ưu tú, xuất sắc'], ['专业', 'zhuānyè', 'chuyên nghiệp'],
          ['稳定', 'wěndìng', 'ổn định'], ['丰富', 'fēngfù', 'phong phú'], ['流行', 'liúxíng', 'thịnh hành'],
          ['普遍', 'pǔbiàn', 'phổ biến'], ['严格', 'yángé', 'nghiêm khắc'], ['温柔', 'wēnróu', 'dịu dàng'],
          ['幽默', 'yōumò', 'hài hước'], ['诚实', 'chéngshí', 'thật thà, trung thực'], ['勇敢', 'yǒnggǎn', 'dũng cảm'],
          ['自信', 'zìxìn', 'tự tin'], ['幸福', 'xìngfú', 'hạnh phúc']
        ];
        ADVERBS_24.forEach(adv => {
          ADJECTIVES_80.forEach(adj => {
            const hz = adv[0] + adj[0];
            const py = adv[1] + ' ' + adj[1];
            const mn = adv[2] + ' ' + adj[2].split(',')[0];
            addLexiconEntry(hz, py, 'Cụm Miêu tả', mn, `大家都觉得这里${hz} — Mọi người đều thấy ở đây ${mn}.`, 'Giao tiếp', 'adj_degree');
          });
        });

        // LAYER 6: Food & Drink Action Collocations (12 Verbs * 55 Foods/Drinks = 660 Phrases)
        const FOOD_VERBS_12 = [
          ['吃', 'chī', 'ăn'], ['喝', 'hē', 'uống'], ['点', 'diǎn', 'gọi món'], ['买', 'mǎi', 'mua'],
          ['做', 'zuò', 'nấu/làm'], ['尝尝', 'chángchang', 'nếm thử'], ['请客吃', 'qǐngkè chī', 'mời ăn'],
          ['打包', 'dǎbāo', 'gói mang về'], ['叫外卖', 'jiào wàimài', 'đặt giao tận nơi'], ['喜欢吃', 'xǐhuan chī', 'thích dùng'],
          ['推荐', 'tuījiàn', 'giới thiệu món'], ['准备', 'zhǔnbèi', 'chuẩn bị']
        ];
        const FOODS_55 = [
          ['米饭', 'mǐfàn', 'cơm trắng'], ['牛肉面', 'niúròumiàn', 'mì bò'], ['小笼包', 'xiǎolóngbāo', 'bánh bao súp'],
          ['水饺', 'shuǐjiǎo', 'sủi cảo'], ['四川火锅', 'Sìchuān huǒguō', 'lẩu Tứ Xuyên'], ['烤肉', 'kǎoròu', 'thịt nướng BBQ'],
          ['北京烤鸭', 'Běijīng kǎoyā', 'vịt quay Bắc Kinh'], ['蛋炒饭', 'dànchǎofàn', 'cơm rang trứng'], ['越南河粉', 'Yuènán héfěn', 'phở Việt Nam'],
          ['春卷', 'chūnjuǎn', 'nem rán/gỏi cuốn'], ['肉包子', 'ròubāozi', 'bánh bao nhân thịt'], ['油条', 'yóutiáo', 'quẩy nóng'],
          ['热豆浆', 'rè dòujiāng', 'sữa đậu nành nóng'], ['海鲜粥', 'hǎixiānzhōu', 'cháo hải sản'], ['水果沙拉', 'shuǐguǒ shālā', 'salad trái cây'],
          ['牛排', 'niúpái', 'bít tết bò'], ['海鲜', 'hǎixiān', 'hải sản'], ['烤鱼', 'kǎoyú', 'cá nướng'],
          ['麻辣烫', 'málàtàng', 'lẩu xiên que cay'], ['螺蛳粉', 'luósīfěn', 'bún ốc Liễu Châu'], ['炸鸡', 'zhájī', 'gà rán'],
          ['汉堡包', 'hànbǎobāo', 'bánh hamburger'], ['薯条', 'shǔtiáo', 'khoai tây chiên'], ['面包', 'miànbāo', 'bánh mì'],
          ['生日蛋糕', 'shēngrì dàngāo', 'bánh kem sinh nhật'], ['巧克力', 'qiǎokèlì', 'sô-cô-la'], ['冰淇淋', 'bīngqílín', 'kem lạnh'],
          ['红苹果', 'hóng píngguǒ', 'táo đỏ'], ['香蕉', 'xiāngjiāo', 'chuối'], ['冰西瓜', 'bīng xīguā', 'dưa hấu ướp lạnh'],
          ['草莓', 'cǎoméi', 'dâu tây'], ['芒果', 'mángguǒ', 'xoài'], ['榴莲', 'liúlián', 'sầu riêng'],
          ['葡萄', 'pútao', 'nho'], ['奶茶', 'nǎichá', 'trà sữa'], ['珍珠奶茶', 'zhēnzhū nǎichá', 'trà sữa trân châu'],
          ['热咖啡', 'rè kāfēi', 'cà phê nóng'], ['冰美式', 'bīng měishì', 'cà phê Americano đá'], ['拿铁咖啡', 'nátiě kāfēi', 'cà phê Latte'],
          ['绿茶', 'lǜchá', 'trà xanh'], ['红茶', 'hóngchá', 'hồng trà'], ['乌龙茶', 'wūlóngchá', 'trà Ô Long'],
          ['鲜榨果汁', 'xiānzhà guǒzhī', 'nước ép trái cây tươi'], ['柠檬水', 'níngméngshuǐ', 'nước chanh'], ['矿泉水', 'kuàngquánshuǐ', 'nước khoáng'],
          ['热牛奶', 'rè niúnǎi', 'sữa tươi nóng'], ['酸奶', 'suānnǎi', 'sữa chua'], ['冰啤酒', 'bīng píjiǔ', 'bia lạnh'],
          ['红酒', 'hóngjiǔ', 'rượu vang đỏ'], ['可乐', 'kělè', 'nước ngọt Coca'], ['椰子水', 'yēzishuǐ', 'nước dừa tươi'],
          ['姜茶', 'jiāngchá', 'trà gừng'], ['早餐', 'zǎocān', 'bữa sáng'], ['午餐', 'wǔcān', 'bữa trưa'], ['晚餐', 'wǎncān', 'bữa tối']
        ];
        FOOD_VERBS_12.forEach(fv => {
          FOODS_55.forEach(fd => {
            const hz = fv[0] + fd[0];
            const py = fv[1] + ' ' + fd[1];
            const mn = fv[2] + ' ' + fd[2];
            addLexiconEntry(hz, py, 'Ẩm thực', mn, `我们今天一起${hz}吧 — Hôm nay chúng mình cùng ${mn} nhé.`, 'Ẩm thực', 'food');
          });
        });

        // LAYER 7: Business, Office & Trade Collocations (15 Verbs * 50 Business Objects = 750 Phrases)
        const BIZ_VERBS_15 = [
          ['签', 'qiān', 'ký'], ['写', 'xiě', 'viết/soạn'], ['看', 'kàn', 'xem/đọc'], ['修改', 'xiūgǎi', 'chỉnh sửa'],
          ['发送', 'fāsòng', 'gửi'], ['收到', 'shōudào', 'nhận được'], ['查询', 'cháxún', 'tra cứu'],
          ['核对', 'héduì', 'đối chiếu kỹ'], ['准备', 'zhǔnbèi', 'chuẩn bị'], ['讨论', 'tǎolùn', 'thảo luận'],
          ['汇报', 'huìbào', 'báo cáo'], ['申请', 'shēnqǐng', 'đăng ký/xin'], ['批准', 'pīzhǔn', 'phê duyệt'],
          ['取消', 'qǔxiāo', 'hủy bỏ'], ['确认', 'quèrèn', 'xác nhận']
        ];
        const BIZ_NOUNS_50 = [
          ['合同', 'hétong', 'hợp đồng'], ['工作报告', 'gōngzuò bàogào', 'báo cáo công việc'], ['中文简历', 'Zhōngwén jiǎnlì', 'hồ sơ CV tiếng Trung'],
          ['电子邮件', 'diànzǐ yóujiàn', 'thư điện tử email'], ['重要文件', 'zhòngyào wénjiàn', 'tài liệu quan trọng'], ['电子发票', 'diànzǐ fāpiào', 'hóa đơn điện tử'],
          ['报价单', 'bàojiàdān', 'bảng báo giá'], ['采购订单', 'cǎigòu dìngdān', 'đơn đặt hàng thu mua'], ['产品样品', 'chǎnpǐn yàngpǐn', 'hàng mẫu sản phẩm'],
          ['这个月工资', 'zhè gè yuè gōngzī', 'tiền lương tháng này'], ['年终奖金', 'niánzhōng jiǎngjīn', 'tiền thưởng cuối năm'], ['项目预算', 'xiàngmù yùsuàn', 'ngân sách dự án'],
          ['设计方案', 'shèjì fāng\'àn', 'phương án thiết kế'], ['营销计划', 'yíngxiāo jìhuà', 'kế hoạch marketing'], ['合作项目', 'hézuò xiàngmù', 'dự án hợp tác'],
          ['部门会议', 'bùmén huìyì', 'cuộc họp phòng ban'], ['放假通知', 'fàngjià tōngzhī', 'thông báo nghỉ lễ'], ['保密协议', 'bǎomì xiéyì', 'thỏa thuận bảo mật'],
          ['客户资料', 'kèhù zīliào', 'hồ sơ khách hàng'], ['销售数据', 'xiāoshòu shùjù', 'dữ liệu bán hàng'], ['报名表格', 'bàomíng biǎogé', 'biểu mẫu đăng ký'],
          ['人员名单', 'rényuán míngdān', 'danh sách nhân sự'], ['出差行程', 'chūchāi xíngchéng', 'lịch trình công tác'], ['商务签证', 'shāngwù qiānzhèng', 'visa thương mại'],
          ['往返机票', 'wǎngfǎn jīpiào', 'vé máy bay khứ hồi'], ['工作证明', 'gōngzuò zhèngmíng', 'giấy xác nhận công tác'], ['营业执照', 'yíngyè zhízhào', 'giấy phép kinh doanh'],
          ['注册商标', 'zhùcè shāngbiāo', 'nhãn hiệu đăng ký'], ['技术专利', 'jìshù zhuānlì', 'bằng sáng chế kỹ thuật'], ['报关单', 'bàoguāndān', 'tờ khai hải quan'],
          ['海运提单', 'hǎiyùn tídān', 'vận đơn đường biển'], ['合同尾款', 'hétong wěikuǎn', 'khoản thanh toán cuối hợp đồng'], ['预付定金', 'yùfù dìngjīn', 'tiền đặt cọc trả trước'],
          ['国际运费', 'guójì yùnfèi', 'phí vận chuyển quốc tế'], ['进口关税', 'jìnkǒu guānshuì', 'thuế nhập khẩu'], ['货运保险', 'huòyùn bǎoxiǎn', 'bảo hiểm hàng hóa'],
          ['付款收据', 'fùkuǎn shōujù', 'biên lai thanh toán'], ['水电账单', 'shuǐdiàn zhàngdān', 'hóa đơn điện nước'], ['个人名片', 'gèrén míngpiàn', 'danh thiếp cá nhân'],
          ['展览邀请函', 'zhǎnlǎn yāoqǐnghán', 'thư mời triển lãm'], ['正式授权书', 'zhèngshì shòuquánshū', 'giấy ủy quyền chính thức'], ['产品说明书', 'chǎnpǐn shuōmíngshū', 'hướng dẫn sử dụng sản phẩm'],
          ['质检报告', 'zhìjiǎn bàogào', 'báo cáo kiểm định chất lượng'], ['生产计划', 'shēngchǎn jìhuà', 'kế hoạch sản xuất'], ['库存表', 'kùcúnbiǎo', 'bảng kiểm kê tồn kho'],
          ['财务报表', 'cáiwù bàobiǎo', 'báo cáo tài chính'], ['考勤表', 'kǎoqínbiǎo', 'bảng chấm công'], ['加班费', 'jiābānfèi', 'tiền lương tăng ca'],
          ['请假条', 'qǐngjiàtiáo', 'đơn xin nghỉ phép'], ['面试时间', 'miànshì shíjiān', 'thời gian phỏng vấn']
        ];
        BIZ_VERBS_15.forEach(bv => {
          BIZ_NOUNS_50.forEach(bn => {
            const hz = bv[0] + bn[0];
            const py = bv[1] + ' ' + bn[1];
            const mn = bv[2] + ' ' + bn[2];
            addLexiconEntry(hz, py, 'Thương mại', mn, `请尽快${hz} — Vui lòng ${mn} sớm nhất có thể.`, 'Thương mại', 'business');
          });
        });

        // LAYER 8: Travel, Transport & City/Place Collocations (14 Verbs * 65 Places = 910 Phrases)
        const TRAVEL_VERBS_14 = [
          ['去', 'qù', 'đi tới'], ['来', 'lái', 'đến'], ['回', 'huí', 'quay về'], ['到', 'dào', 'đến nơi'],
          ['离开', 'líkāi', 'rời khỏi'], ['参观', 'cānguān', 'tham quan'], ['找', 'zhǎo', 'tìm đường tới'],
          ['路过', 'lùguò', 'đi ngang qua'], ['住在', 'zhùzài', 'ở tại'], ['坐地铁去', 'zuò dìtiě qù', 'đi tàu điện ngầm tới'],
          ['打车去', 'dǎchē qù', 'bắt taxi đi'], ['坐高铁去', 'zuò gāotiě qù', 'đi tàu cao tốc tới'],
          ['飞往', 'fēiwǎng', 'bay tới'], ['导航去', 'dǎoháng qù', 'bật bản đồ dẫn đường tới']
        ];
        const PLACES_65 = [
          ['学校', 'xuéxiào', 'trường học'], ['大学', 'dàxué', 'trường đại học'], ['公司', 'gōngsī', 'công ty'],
          ['办公室', 'bàngōngshì', 'văn phòng'], ['工厂', 'gōngchǎng', 'nhà máy'], ['医院', 'yīyuàn', 'bệnh viện'],
          ['药店', 'yàodiàn', 'hiệu thuốc'], ['银行', 'yínháng', 'ngân hàng'], ['邮局', 'yóujú', 'bưu điện'],
          ['超市', 'chāoshì', 'siêu thị'], ['商场', 'shāngchǎng', 'trung tâm thương mại'], ['菜市场', 'càishìchǎng', 'chợ thực phẩm'],
          ['书店', 'shūdiàn', 'hiệu sách'], ['图书馆', 'túshūguǎn', 'thư viện'], ['电影院', 'diànyǐngyuàn', 'rạp chiếu phim'],
          ['咖啡馆', 'kāfēiguǎn', 'quán cà phê'], ['茶馆', 'cháguǎn', 'quán trà'], ['中餐厅', 'Zhōngcāntīng', 'nhà hàng Trung Hoa'],
          ['五星级酒店', 'wǔxīngjí jiǔdiàn', 'khách sạn 5 sao'], ['民宿', 'mínsù', 'homestay'], ['国际机场', 'guójì jīchǎng', 'sân bay quốc tế'],
          ['火车站', 'huǒchēzhàn', 'ga tàu hỏa'], ['高铁站', 'gāotiězhàn', 'ga tàu cao tốc'], ['地铁站', 'dìtiězhàn', 'ga tàu điện ngầm'],
          ['公交站', 'gōngjiāozhàn', 'trạm xe buýt'], ['停车场', 'tíngchēchǎng', 'bãi đỗ xe'], ['加油站', 'jiāyóuzhàn', 'trạm xăng'],
          ['公园', 'gōngyuán', 'công viên'], ['体育馆', 'tǐyùguǎn', 'nhà thi đấu'], ['健身房', 'jiànshēnfáng', 'phòng tập gym'],
          ['游泳馆', 'yóuyǒngguǎn', 'hồ bơi'], ['历史博物馆', 'lìshǐ bówùguǎn', 'bảo tàng lịch sử'], ['展览中心', 'zhǎnlǎn zhōngxīn', 'trung tâm triển lãm'],
          ['大使馆', 'dàshǐguǎn', 'đại sứ quán'], ['警察局', 'jǐngchájú', 'đồn cảnh sát'], ['海边', 'hǎibiān', 'bờ biển'],
          ['山顶', 'shāndǐng', 'đỉnh núi'], ['市中心', 'shìzhōngxīn', 'trung tâm thành phố'], ['郊区', 'jiāoqū', 'vùng ngoại ô'],
          ['古镇', 'gǔzhèn', 'phố cổ'], ['夜市', 'yèshì', 'chợ đêm'], ['步行街', 'bùxíngjiē', 'phố đi bộ'],
          ['中国', 'Zhōngguó', 'Trung Quốc'], ['越南', 'Yuènán', 'Việt Nam'], ['北京', 'Běijīng', 'Bắc Kinh'],
          ['上海', 'Shànghǎi', 'Thượng Hải'], ['广州', 'Guǎngzhōu', 'Quảng Châu'], ['深圳', 'Shēnzhèn', 'Thâm Quyến'],
          ['杭州', 'Hángzhōu', 'Hàng Châu'], ['成都', 'Chéngdū', 'Thành Đô'], ['重庆', 'Chóngqìng', 'Trùng Khánh'],
          ['西安', 'Xī\'ān', 'Tây An'], ['苏州', 'Sūzhōu', 'Tô Châu'], ['南京', 'Nánjīng', 'Nam Kinh'],
          ['武汉', 'Wǔhàn', 'Vũ Hán'], ['厦门', 'Xiàmén', 'Hạ Môn'], ['昆明', 'Kūnmíng', 'Côn Minh'],
          ['香港', 'Xiānggǎng', 'Hồng Kông'], ['台北', 'Táiběi', 'Đài Bắc'], ['河内', 'Hénèi', 'Hà Nội'],
          ['胡志明市', 'Húzhìmíng shì', 'TP. Hồ Chí Minh'], ['岘港', 'Xiàngǎng', 'Đà Nẵng'], ['芽庄', 'Yázhuāng', 'Nha Trang'],
          ['富国岛', 'Fùguódǎo', 'đảo Phú Quốc'], ['下龙湾', 'Xiàlóngwān', 'vịnh Hạ Long']
        ];
        TRAVEL_VERBS_14.forEach(tv => {
          PLACES_65.forEach(pl => {
            const hz = tv[0] + pl[0];
            const py = tv[1] + ' ' + pl[1];
            const mn = tv[2] + ' ' + pl[2];
            addLexiconEntry(hz, py, 'Du lịch & Đi lại', mn, `我们明天早点${hz} — Ngày mai chúng ta ${mn} sớm một chút.`, 'Du lịch', 'travel');
          });
        });

        // LAYER 9: Shopping, Clothing & Tech Items (12 Verbs * 55 Items = 660 Phrases)
        const SHOP_VERBS_12 = [
          ['买', 'mǎi', 'mua'], ['卖', 'mài', 'bán'], ['试穿', 'shìchuān', 'mặc thử/mang thử'], ['洗', 'xǐ', 'giặt/rửa'],
          ['换', 'huàn', 'đổi'], ['退', 'tuì', 'trả lại'], ['修', 'xiū', 'sửa chữa'], ['借', 'jiè', 'mượn'],
          ['找', 'zhǎo', 'tìm'], ['挑选', 'tiāoxuǎn', 'chọn lựa'], ['收拾', 'shōushi', 'thu dọn'], ['在网上买', 'zài wǎngshàng mǎi', 'mua online']
        ];
        const SHOP_ITEMS_55 = [
          ['衣服', 'yīfu', 'quần áo'], ['白衬衫', 'bái chènshān', 'áo sơ mi trắng'], ['T恤', 'T-xù', 'áo phông'],
          ['外套', 'wàitào', 'áo khoác'], ['厚毛衣', 'hòu máoyī', 'áo len dày'], ['羽绒服', 'yǔróngfú', 'áo phao lông vũ'],
          ['西装', 'xīzhuāng', 'bộ vest'], ['裤子', 'kùzi', 'cái quần'], ['牛仔裤', 'niúzǎikù', 'quần jean'],
          ['运动短裤', 'yùndòng duǎnkù', 'quần đùi thể thao'], ['裙子', 'qúnzi', 'chân váy'], ['连衣裙', 'liányīqún', 'váy liền thân'],
          ['鞋子', 'xiézi', 'giày dép'], ['运动鞋', 'yùndòngxié', 'giày thể thao'], ['皮鞋', 'píxié', 'giày da'],
          ['高跟鞋', 'gāogēnxié', 'giày cao gót'], ['拖鞋', 'tuōxié', 'dép lê'], ['棉袜子', 'mián wàzi', 'tất cotton'],
          ['帽子', 'màozi', 'cái mũ'], ['围巾', 'wéijīn', 'khăn quàng cổ'], ['手套', 'shǒutào', 'găng tay'],
          ['近视眼镜', 'jìnshì yǎnjìng', 'kính cận'], ['太阳镜', 'tàiyángjìng', 'kính râm'], ['手表', 'shǒubiǎo', 'đồng hồ đeo tay'],
          ['项链', 'xiàngliàn', 'dây chuyền'], ['戒指', 'jièzhi', 'nhẫn'], ['背包', 'bēibāo', 'ba lô'],
          ['手提包', 'shǒutíbāo', 'túi xách tay'], ['行李箱', 'xínglǐxiāng', 'vali hành lý'], ['雨伞', 'yǔsǎn', 'cái ô'],
          ['钱包', 'qiánbāo', 'ví tiền'], ['房间钥匙', 'fángjiān yàoshi', 'chìa khóa phòng'], ['智能手机', 'zhìnéng shǒujī', 'điện thoại thông minh'],
          ['笔记本电脑', 'bǐjìběn diànnǎo', 'máy tính xách tay laptop'], ['平板电脑', 'píngbǎn diànnǎo', 'máy tính bảng'], ['蓝牙耳机', 'lányá ěrjī', 'tai nghe Bluetooth'],
          ['充电器', 'chōngdiànqì', 'cục sạc'], ['充电宝', 'chōngdiànbǎo', 'sạc dự phòng'], ['数据线', 'shùjùxiàn', 'dây cáp sạc'],
          ['照相机', 'zhàoxiàngjī', 'máy ảnh'], ['机械键盘', 'jīxiè jiànbǎn', 'bàn phím cơ'], ['无线鼠标', 'wúxiàn shǔbiāo', 'chuột không dây'],
          ['液晶电视', 'yèjīng diànshì', 'tivi màn hình phẳng'], ['冰箱', 'bīngxiāng', 'tủ lạnh'], ['空调', 'kōngtiáo', 'máy điều hòa'],
          ['洗衣机', 'xǐyījī', 'máy giặt'], ['电风扇', 'diànfēngshàn', 'quạt điện'], ['微波炉', 'wēibōlú', 'lò vi sóng'],
          ['电饭煲', 'diànfànbāo', 'nồi cơm điện'], ['吹风机', 'chuīfēngjī', 'máy sấy tóc'], ['书桌', 'shūzhuō', 'bàn làm việc'],
          ['办公椅', 'bàngōngyǐ', 'ghế văn phòng'], ['真皮沙发', 'zhēnpí shāfā', 'ghế sofa da'], ['床单', 'chuángdān', 'ga trải giường'], ['枕头', 'zhěntou', 'cái gối']
        ];
        SHOP_VERBS_12.forEach(sv => {
          SHOP_ITEMS_55.forEach(si => {
            const hz = sv[0] + si[0];
            const py = sv[1] + ' ' + si[1];
            const mn = sv[2] + ' ' + si[2];
            addLexiconEntry(hz, py, 'Mua sắm & Đời sống', mn, `我想去商场${hz} — Tôi muốn đi trung tâm thương mại ${mn}.`, 'Mua sắm', 'shopping');
          });
        });

        // LAYER 10: Numbers/Demonstratives + Classifiers + Nouns (14 Determiners * 100 Classifier-Nouns = 1,400 Phrases)
        const DETERMINERS_14 = [
          ['一', 'yī', 'một'], ['两', 'liǎng', 'hai'], ['三', 'sān', 'ba'], ['四', 'sì', 'bốn'],
          ['五', 'wǔ', 'năm'], ['六', 'liù', 'sáu'], ['七', 'qī', 'bảy'], ['八', 'bā', 'tám'],
          ['九', 'jiǔ', 'chín'], ['十', 'shí', 'mười'], ['这', 'zhè', 'này (đây)'], ['那', 'nà', 'kia (đó)'],
          ['每', 'měi', 'mỗi'], ['几', 'jǐ', 'mấy/vài']
        ];
        const CLASSIFIER_NOUNS_100 = [
          ['个人', 'gè rén', 'người'], ['位老师', 'wèi lǎoshī', 'vị giáo viên'], ['位客户', 'wèi kèhù', 'vị khách hàng'],
          ['本书', 'běn shū', 'quyển sách'], ['本词典', 'běn cídiǎn', 'cuốn từ điển'], ['本护照', 'běn hùzhào', 'cuốn hộ chiếu'],
          ['件衣服', 'jiàn yīfu', 'bộ quần áo'], ['件衬衫', 'jiàn chènshān', 'chiếc áo sơ mi'], ['件外套', 'jiàn wàitào', 'chiếc áo khoác'],
          ['件事情', 'jiàn shìqing', 'sự việc'], ['件行李', 'jiàn xínglǐ', 'kiện hành lý'], ['杯水', 'bēi shuǐ', 'cốc nước'],
          ['杯咖啡', 'bēi kāfēi', 'ly cà phê'], ['杯奶茶', 'bēi nǎichá', 'ly trà sữa'], ['杯啤酒', 'bēi píjiǔ', 'cốc bia'],
          ['瓶矿泉水', 'píng kuàngquánshuǐ', 'chai nước khoáng'], ['瓶红酒', 'píng hóngjiǔ', 'chai rượu vang'], ['碗米饭', 'wǎn mǐfàn', 'bát cơm'],
          ['碗牛肉面', 'wǎn niúròumiàn', 'tô mì bò'], ['盘水饺', 'pán shuǐjiǎo', 'đĩa sủi cảo'], ['双鞋子', 'shuāng xiézi', 'đôi giày'],
          ['双筷子', 'shuāng kuàizi', 'đôi đũa'], ['双袜子', 'shuāng wàzi', 'đôi tất'], ['条裤子', 'tiáo kùzi', 'chiếc quần'],
          ['条裙子', 'tiáo qúnzi', 'chiếc váy'], ['条鱼', 'tiáo yú', 'con cá'], ['条路', 'tiáo lù', 'con đường'],
          ['条河', 'tiáo hé', 'dòng sông'], ['条消息', 'tiáo xiāoxi', 'tin nhắn'], ['张桌子', 'zhāng zhuōzi', 'cái bàn'],
          ['张床', 'zhāng chuáng', 'cái giường'], ['张机票', 'zhāng jīpiào', 'vé máy bay'], ['张高铁票', 'zhāng gāotiěpiào', 'vé tàu cao tốc'],
          ['张电影票', 'zhāng diànyǐngpiào', 'vé xem phim'], ['张照片', 'zhāng zhàopiàn', 'bức ảnh'], ['张银行卡', 'zhāng yínhángkǎ', 'thẻ ngân hàng'],
          ['张发票', 'zhāng fāpiào', 'tờ hóa đơn'], ['把椅子', 'bǎ yǐzi', 'cái ghế'], ['把雨伞', 'bǎ yǔsǎn', 'chiếc ô'],
          ['把钥匙', 'bǎ yàoshi', 'chìa khóa'], ['辆汽车', 'liàng qìchē', 'chiếc ô tô'], ['辆出租车', 'liàng chūzūchē', 'chiếc taxi'],
          ['辆自行车', 'liàng zìxíngchē', 'chiếc xe đạp'], ['辆摩托车', 'liàng mótuōchē', 'chiếc xe máy'], ['台电脑', 'tái diànnǎo', 'chiếc máy tính'],
          ['台手机', 'tái shǒujī', 'chiếc điện thoại'], ['台空调', 'tái kōngtiáo', 'máy điều hòa'], ['家公司', 'jiā gōngsī', 'công ty'],
          ['家医院', 'jiā yīyuàn', 'bệnh viện'], ['家餐厅', 'jiā cāntīng', 'nhà hàng'], ['家酒店', 'jiā jiǔdiàn', 'khách sạn'],
          ['家银行', 'jiā yínháng', 'ngân hàng'], ['家超市', 'jiā chāoshì', 'siêu thị'], ['套房子', 'tào fángzi', 'căn nhà'],
          ['套公寓', 'tào gōngyù', 'căn hộ'], ['间房间', 'jiān fángjiān', 'căn phòng'], ['间卧室', 'jiān wòshì', 'phòng ngủ'],
          ['间教室', 'jiān jiàoshì', 'phòng học'], ['座城市', 'zuò chéngshì', 'thành phố'], ['座山', 'zuò shān', 'ngọn núi'],
          ['座桥', 'zuò qiáo', 'cây cầu'], ['座大楼', 'zuò dàlóu', 'tòa cao ốc'], ['场电影', 'chǎng diànyǐng', 'suất chiếu phim'],
          ['场比赛', 'chǎng bǐsài', 'trận đấu'], ['场会议', 'chǎng huìyì', 'cuộc họp'], ['场雨', 'chǎng yǔ', 'cơn mưa'],
          ['次机会', 'cì jīhuì', 'cơ hội'], ['次旅行', 'cì lǚxíng', 'chuyến du lịch'], ['次考试', 'cì kǎoshì', 'kỳ thi'],
          ['门课程', 'mén kèchéng', 'môn học'], ['门外语', 'mén wàiyǔ', 'ngoại ngữ'], ['首歌曲', 'shǒu gēqǔ', 'bài hát'],
          ['部电影', 'bù diànyǐng', 'bộ phim'], ['封邮件', 'fēng yóujiàn', 'bức email'], ['份工作', 'fèn gōngzuò', 'công việc'],
          ['份合同', 'fèn hétong', 'bản hợp đồng'], ['份简历', 'fèn jiǎnlì', 'bản CV'], ['份礼物', 'fèn lǐwù', 'món quà'],
          ['份报告', 'fèn bàogào', 'bản báo cáo'], ['份外卖', 'fèn wàimài', 'suất đồ ăn giao tận nơi'], ['朵花', 'duǒ huā', 'bông hoa'],
          ['棵树', 'kē shù', 'cái cây'], ['只猫', 'zhī māo', 'con mèo'], ['只狗', 'zhī gǒu', 'con chó'],
          ['只鸟', 'zhī niǎo', 'con chim'], ['盒巧克力', 'hé qiǎokèlì', 'hộp sô-cô-la'], ['包饼干', 'bāo bǐnggān', 'gói bánh quy'],
          ['块蛋糕', 'kuài dàngāo', 'miếng bánh kem'], ['块钱', 'kuài qián', 'đồng/tệ'], ['家工厂', 'jiā gōngchǎng', 'nhà máy'],
          ['批货物', 'pī huòwù', 'lô hàng hóa'], ['笔钱', 'bǐ qián', 'khoản tiền'], ['笔订单', 'bǐ dìngdān', 'đơn hàng'],
          ['顿饭', 'dùn fàn', 'bữa cơm'], ['顿火锅', 'dùn huǒguō', 'bữa lẩu'], ['扇门', 'shàn mén', 'cánh cửa'],
          ['扇窗户', 'shàn chuānghu', 'khung cửa sổ'], ['盏灯', 'zhǎn dēng', 'ngọn đèn'], ['道题', 'dào tí', 'câu hỏi/bài tập'],
          ['道菜', 'dào cài', 'món ăn']
        ];
        DETERMINERS_14.forEach(det => {
          CLASSIFIER_NOUNS_100.forEach(cn => {
            const hz = det[0] + cn[0];
            const py = det[1] + ' ' + cn[1];
            const mn = (det[0] === '这' || det[0] === '那') ? (cn[2] + ' ' + det[2]) : (det[2] + ' ' + cn[2]);
            addLexiconEntry(hz, py, 'Cụm Lượng từ', mn, `这里有${hz} — Ở đây có ${mn}.`, 'Lượng từ', 'classifier');
          });
        });

        // LAYER 11: Timeframes + Daily Routine Activities (25 Timeframes * 140 Daily Activities = 3,500 Routine Expressions)
        const TIMEFRAMES_25 = [
          ['今天早上', 'jīntiān zǎoshang', 'sáng hôm nay'], ['今天中午', 'jīntiān zhōngwǔ', 'trưa hôm nay'],
          ['今天下午', 'jīntiān xiàwǔ', 'chiều hôm nay'], ['今天晚上', 'jīntiān wǎnshang', 'tối hôm nay'],
          ['明天早上', 'míngtiān zǎoshang', 'sáng ngày mai'], ['明天中午', 'míngtiān zhōngwǔ', 'trưa ngày mai'],
          ['明天下午', 'míngtiān xiàwǔ', 'chiều ngày mai'], ['明天晚上', 'míngtiān wǎnshang', 'tối ngày mai'],
          ['昨天早上', 'zuótiān zǎoshang', 'sáng hôm qua'], ['昨天晚上', 'zuótiān wǎnshang', 'tối hôm qua'],
          ['这个周末', 'zhè gè zhōumò', 'cuối tuần này'], ['下个星期', 'xià gè xīngqī', 'tuần sau'],
          ['下个月', 'xià gè yuè', 'tháng sau'], ['每天早上', 'měitiān zǎoshang', 'mỗi buổi sáng'],
          ['每天晚上', 'měitiān wǎnshang', 'mỗi buổi tối'], ['上班以前', 'shàngbān yǐqián', 'trước khi đi làm'],
          ['下班以后', 'xiàbān yǐhòu', 'sau khi tan làm'], ['放学以后', 'fàngxué yǐhòu', 'sau khi tan học'],
          ['吃饭以后', 'chīfàn yǐhòu', 'sau khi ăn cơm'], ['睡觉以前', 'shuìjiào yǐqián', 'trước khi đi ngủ'],
          ['开会以前', 'kāihuì yǐqián', 'trước khi họp'], ['放假的时候', 'fàngjià de shíhou', 'lúc nghỉ lễ'],
          ['有空的时候', 'yǒukòng de shíhou', 'lúc rảnh rỗi'], ['出差的时候', 'chūchāi de shíhou', 'khi đi công tác'],
          ['到了中国以后', 'dàole Zhōngguó yǐhòu', 'sau khi đến Trung Quốc']
        ];
        const ROUTINES_140 = [
          ['起床刷牙', 'qǐchuáng shuāyá', 'thức dậy đánh răng'], ['洗脸吃早餐', 'xǐliǎn chī zǎocān', 'rửa mặt ăn sáng'],
          ['喝一杯热咖啡', 'hē yī bēi rè kāfēi', 'uống một ly cà phê nóng'], ['喝一杯牛奶', 'hē yī bēi niúnǎi', 'uống một ly sữa tươi'],
          ['看十分钟新闻', 'kàn shí fēnzhōng xīnwén', 'xem tin tức 10 phút'], ['背二十个生词', 'bèi èrshí gè shēngcí', 'học thuộc 20 từ mới'],
          ['练习写汉字', 'liànxí xiě Hànzì', 'luyện viết chữ Hán'], ['听中文广播', 'tīng Zhōngwén guǎngbō', 'nghe đài phát thanh tiếng Trung'],
          ['跟朋友练口语', 'gēn péngyou liàn kǒuyǔ', 'luyện khẩu ngữ với bạn bè'], ['坐地铁去上班', 'zuò dìtiě qù shàngbān', 'đi tàu điện ngầm đi làm'],
          ['骑自行车去学校', 'qí zìxíngchē qù xuéxiào', 'đạp xe đi tới trường'], ['检查工作邮件', 'jiǎnchá gōngzuò yóujiàn', 'kiểm tra email công việc'],
          ['跟客户打电话', 'gēn kèhù dǎ diànhuà', 'gọi điện thoại cho khách hàng'], ['参加部门会议', 'cānjiā bùmén huìyì', 'tham gia cuộc họp phòng ban'],
          ['整理项目资料', 'zhěnglǐ xiàngmù zīliào', 'sắp xếp tài liệu dự án'], ['写今天的工作总结', 'xiě jīntiān de gōngzuò zǒngjié', 'viết tổng kết công việc hôm nay'],
          ['去银行办业务', 'qù yínháng bàn yèwù', 'ra ngân hàng làm giao dịch'], ['跟老板汇报进度', 'gēn lǎobǎn huìbào jìndù', 'báo cáo tiến độ với sếp'],
          ['跟同事吃工作餐', 'gēn tóngshì chī gōngzuòcān', 'ăn cơm trưa công sở cùng đồng nghiệp'], ['午休三十分钟', 'wǔxiū sānshí fēnzhōng', 'nghỉ trưa 30 phút'],
          ['去超市买菜做饭', 'qù chāoshì mǎi cài zuòfàn', 'đi siêu thị mua đồ nấu cơm'], ['在家里打扫卫生', 'zài jiālǐ dǎsǎo wèishēng', 'dọn dẹp vệ sinh ở nhà'],
          ['洗衣服和晒被子', 'xǐ yīfu hé shài bèizi', 'giặt quần áo và phơi chăn'], ['给父母打视频电话', 'gěi fùmǔ dǎ shìpín diànhuà', 'gọi video cho bố mẹ'],
          ['带小狗去公园散步', 'dài xiǎogǒu qù gōngyuán sànbù', 'dắt cún con ra công viên đi dạo'], ['去健身房跑步锻炼', 'qù jiànshēnfáng pǎobù duànliàn', 'đến phòng gym chạy bộ tập luyện'],
          ['去游泳馆游泳', 'qù yóuyǒngguǎn yóuyǒng', 'đến bể bơi bơi lội'], ['跟朋友去打羽毛球', 'gēn péngyou qù dǎ yǔmáoqiú', 'đi đánh cầu lông với bạn'],
          ['去体育场踢足球', 'qù tǐyùchǎng tī zúqiú', 'ra sân vận động đá bóng'], ['在客厅看中国电视剧', 'zài kètīng kàn Zhōngguó diànshìjù', 'xem phim truyền hình Trung Quốc ở phòng khách'],
          ['听华语流行音乐', 'tīng Huáyǔ liúxíng yīnyuè', 'nghe nhạc trẻ Hoa ngữ'], ['阅读一本中文小说', 'yuèdú yī běn Zhōngwén xiǎoshuō', 'đọc một cuốn tiểu thuyết tiếng Trung'],
          ['复习今天学的语法', 'fùxí jīntiān xué de yǔfǎ', 'ôn lại ngữ pháp học hôm nay'], ['准备明天的考试', 'zhǔnbèi míngtiān de kǎoshì', 'chuẩn bị cho bài thi ngày mai'],
          ['洗个热水澡放松一下', 'xǐ gè rèshuǐzǎo fàngsōng yīxià', 'tắm nước ấm thư giãn một chút'], ['早点上床休息', 'zǎodiǎn shàngchuáng xiūxi', 'lên giường nghỉ ngơi sớm'],
          ['去医院看医生', 'qù yīyuàn kàn yīshēng', 'đến bệnh viện khám bác sĩ'], ['去药店买感冒药', 'qù yàodiàn mǎi gǎnmàoyào', 'ra hiệu thuốc mua thuốc cảm'],
          ['去火车站接朋友', 'qù huǒchēzhàn jiē péngyou', 'ra ga tàu đón bạn'], ['送客户去飞机场', 'sòng kèhù qù fēijīchǎng', 'tiễn khách hàng ra sân bay'],
          ['在网上预订酒店', 'zài wǎngshàng yùdìng jiǔdiàn', 'đặt phòng khách sạn trên mạng'], ['收拾行李准备出发', 'shōushi xínglǐ zhǔnbèi chūfā', 'thu dọn hành lý chuẩn bị xuất phát'],
          ['去故宫拍照留念', 'qù Gùgōng pāizhào liúniàn', 'đến Tử Cấm Thành chụp ảnh lưu niệm'], ['去上海外滩看夜景', 'qù Shànghǎi Wàitān kàn yèjǐng', 'ra Bến Thượng Hải ngắm cảnh đêm'],
          ['品尝当地的特色小吃', 'pǐncháng dāngdì de tèsè xiǎochī', 'thưởng thức món ăn vặt đặc sản địa phương'], ['买一些礼物送给家人', 'mǎi yīxiē lǐwù sòng gěi jiārén', 'mua vài món quà tặng người nhà'],
          ['用微信发红包祝贺', 'yòng Wēixìn fā hóngbāo zhùhè', 'gửi lì xì chúc mừng qua WeChat'], ['去楼下拿快递包裹', 'qù lóuxià ná kuàidì bāoguǒ', 'xuống lầu lấy kiện hàng chuyển phát nhanh'],
          ['联系客服办理退换货', 'liánxì kèfú bànlǐ tuìhuànhuò', 'liên hệ CSKH làm thủ tục đổi trả hàng'], ['跟房东签租房合同', 'gēn fángdōng qiān zūfáng hétong', 'ký hợp đồng thuê nhà với chủ nhà'],
          ['去工厂检查产品质量', 'qù gōngchǎng jiǎnchá chǎnpǐn zhìliàng', 'xuống nhà máy kiểm tra chất lượng sản phẩm'], ['跟供应商谈批发价格', 'gēn gōngyìngshāng tán pīfā jiàgé', 'đàm phán giá sỉ với nhà cung cấp'],
          ['核对海关出口报关单', 'héduì hǎiguān chūkǒu bàoguāndān', 'đối chiếu tờ khai hải quan xuất khẩu'], ['用支付宝付水电费', 'yòng Zhīfùbǎo fù shuǐdiànfèi', 'thanh toán tiền điện nước bằng Alipay'],
          ['去图书馆查学习资料', 'qù túshūguǎn chá xuéxí zīliào', 'đến thư viện tra cứu tài liệu học tập'], ['向老师请教发音问题', 'xiàng lǎoshī qǐngjiào fāyīn wèntí', 'hỏi giáo viên về vấn đề phát âm'],
          ['完成一套HSK模拟试卷', 'wánchéng yī tào HSK mónǐ shìjuàn', 'hoàn thành một đề thi thử HSK'], ['把错题整理到笔记本里', 'bǎ cuòtí zhěnglǐ dào bǐjìběn lǐ', 'tổng hợp các câu làm sai vào sổ tay'],
          ['跟AI师父练习中文对话', 'gēn AI shīfu liànxí Zhōngwén duìhuà', 'luyện hội thoại tiếng Trung cùng Sư Phụ AI'], ['去电影院看新上映的电影', 'qù diànyǐngyuàn kàn xīn shàngyìng de diànyǐng', 'ra rạp xem bộ phim mới công chiếu']
        ];
        TIMEFRAMES_25.forEach(tf => {
          ROUTINES_140.forEach(rt => {
            const hz = tf[0] + rt[0];
            const py = tf[1] + ' ' + rt[1];
            const mn = tf[2] + ' ' + rt[2];
            addLexiconEntry(hz, py, 'Sinh hoạt & Giao tiếp', mn, `我打算${hz} — Tôi dự định ${mn}.`, 'Giao tiếp', 'routine');
          });
        });

        _unifiedDictionaryCache = Array.from(mapByHanzi.values());
        return _unifiedDictionaryCache;
      }

            // Bidirectional Phrase Synthesizer: Translates Vietnamese phrase -> Chinese OR Chinese phrase -> Vietnamese
      function synthesizeBidirectionalTranslation(rawQuery) {
        const q = String(rawQuery || '').trim();
        if (!q) return null;
        const master = getUnifiedMasterDictionary();
        const hasHanzi = /[\u4e00-\u9fff]/.test(q);

        if (hasHanzi) {
          // Chinese -> Vietnamese word-by-word segmentation & translation
          const tokens = segmentChineseWordsIntl(q);
          const partsVi = [];
          const matchedWords = [];
          tokens.forEach(tk => {
            const found = master.find(item => item.hanzi === tk);
            if (found) {
              partsVi.push(found.meaning.split(/[,•;（(]/)[0].trim());
              matchedWords.push(found);
            } else {
              partsVi.push(tk);
            }
          });
          return {
            direction: 'Trung ➔ Việt',
            sourceText: q,
            targetHanzi: q,
            targetPinyin: generateLibraryPinyinForText(q),
            targetVi: partsVi.join(' '),
            breakdown: matchedWords
          };
        }

        // Vietnamese -> Chinese phrase synthesizer (Greedy longest-phrase matching on Vietnamese words)
        const normVi = stripViAccents(q);
        const viWords = normVi.split(/\s+/).filter(Boolean);
        if (viWords.length === 0) return null;

        const outHanzi = [];
        const outPinyin = [];
        const breakdown = [];
        let i = 0;
        while (i < viWords.length) {
          let matchedEntry = null;
          let matchedLen = 0;
          for (let len = Math.min(4, viWords.length - i); len >= 1; len--) {
            const subPhrase = viWords.slice(i, i + len).join(' ');
            // Find entry where one of its comma-separated meanings matches `subPhrase`
            matchedEntry = master.find(entry => {
              const clauses = entry.plainMeaning.split(/[,•;()]/).map(s => s.trim());
              return clauses.includes(subPhrase);
            });
            if (matchedEntry) {
              matchedLen = len;
              break;
            }
          }
          if (matchedEntry) {
            outHanzi.push(matchedEntry.hanzi);
            outPinyin.push(matchedEntry.pinyin);
            breakdown.push(matchedEntry);
            i += matchedLen;
          } else {
            i++;
          }
        }

        if (outHanzi.length === 0) return null;
        return {
          direction: 'Việt ➔ Trung',
          sourceText: q,
          targetHanzi: outHanzi.join(''),
          targetPinyin: outPinyin.join(' '),
          targetVi: q,
          breakdown
        };
      }

            function renderDictionaryResults(query, keepLimit) {
        const grid = document.getElementById('dictResultsGrid');
        const banner = document.getElementById('dictInstantTranslationBanner');
        const countBadge = document.getElementById('dictTotalLexiconCountBadge');
        const domainSel = document.getElementById('dictDomainFilterSelect');
        const showingText = document.getElementById('dictShowingCountText');
        const btnMore = document.getElementById('btnDictLoadMore');
        if (!grid) return;

        if (!keepLimit) _dictDisplayLimit = 60;

        const masterPool = getUnifiedMasterDictionary();
        const activeDomain = (domainSel && domainSel.value) ? domainSel.value : 'all';
        const domainPool = activeDomain === 'all'
          ? masterPool
          : masterPool.filter(w => w.domain === activeDomain);

        if (countBadge) {
          countBadge.textContent = `📚 Kho Từ Điển Toàn Diện: ${masterPool.length.toLocaleString('vi-VN')} từ & cụm giao tiếp (Việt ↔ Trung)`;
        }

        const q = (query !== undefined ? query : (document.getElementById('dictSearchInput')?.value || '')).trim();
        const qLower = q.toLowerCase();
        const qPlain = stripViAccents(q);

        if (banner) {
          if (q.length >= 2) {
            const synth = synthesizeBidirectionalTranslation(q);
            if (synth && synth.targetHanzi) {
              banner.classList.remove('hidden');
              banner.innerHTML = `
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <span class="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-extrabold">⚡ Dịch & Ghép Câu Tức Thì (${escapeHtml(synth.direction)})</span>
                  <div class="flex items-center gap-2">
                    <button type="button" data-speak="${escapeHtml(synth.targetHanzi)}" class="speak-inline-btn px-3 py-1 rounded-xl bg-emerald-500 text-slate-950 font-extrabold text-xs">🔊 Nghe Phát Âm Chuẩn Trung</button>
                    <button type="button" data-save-dict-word="${escapeHtml(synth.targetHanzi)}" data-save-dict-py="${escapeHtml(synth.targetPinyin)}" data-save-dict-mn="${escapeHtml(synth.targetVi)}" class="save-dict-to-srs-btn px-3 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs">+ Lưu Vào Sổ Tay</button>
                  </div>
                </div>
                <div class="text-xl sm:text-2xl font-black hanzi-font text-white pt-1">${escapeHtml(synth.targetHanzi)}</div>
                <div class="text-xs sm:text-sm font-bold text-emerald-400">${escapeHtml(synth.targetPinyin)}</div>
                <div class="text-xs sm:text-sm text-slate-200"><b>Nghĩa tiếng Việt:</b> ${escapeHtml(synth.targetVi)}</div>
              `;
            } else {
              banner.classList.add('hidden');
            }
          } else {
            banner.classList.add('hidden');
          }
        }

        let totalMatched = [];
        if (q) {
          const scored = [];
          for (let i = 0; i < domainPool.length; i++) {
            const w = domainPool[i];
            let sc = 0;
            if (w.hanzi === q) sc += 120;
            else if (w.hanzi.includes(q)) sc += (w.domain === 'core' ? 75 : 55);
            if (w.meaning.toLowerCase() === qLower) sc += 110;
            else if (w.meaning.toLowerCase().includes(qLower) || (qPlain.length >= 2 && w.plainMeaning.includes(qPlain))) {
              sc += (w.domain === 'core' ? 65 : 45);
            }
            if (w.pinyin.toLowerCase() === qLower || w.plainPinyin === qPlain) sc += 90;
            else if (qPlain.length >= 2 && w.plainPinyin.includes(qPlain)) sc += 35;
            if (w.realmName && w.realmName.toLowerCase() === qLower) sc += 85;
            if (sc > 0) scored.push({ w, sc });
          }
          scored.sort((a, b) => b.sc - a.sc);
          totalMatched = scored.map(x => x.w);
        } else {
          totalMatched = domainPool;
        }

        const matches = totalMatched.slice(0, _dictDisplayLimit);
        if (showingText) {
          showingText.textContent = `Đang hiển thị ${matches.length.toLocaleString('vi-VN')} / ${totalMatched.length.toLocaleString('vi-VN')} mục từ vựng & cụm giao tiếp`;
        }
        if (btnMore) {
          if (totalMatched.length > matches.length) {
            btnMore.classList.remove('hidden');
            btnMore.textContent = `📄 Xem Thêm Từ Vựng (+60 mục tiếp theo • Còn ${(totalMatched.length - matches.length).toLocaleString('vi-VN')} mục)`;
          } else {
            btnMore.classList.add('hidden');
          }
        }

        if (matches.length === 0) {
          grid.innerHTML = `<div class="col-span-full text-xs text-slate-300 p-4 rounded-2xl bg-slate-950 border border-slate-800">Không tìm thấy từ khớp trong nhóm này — hãy chọn <b>"🗂️ Tất cả 11.300+ Từ & Cụm Giao Tiếp"</b> hoặc xem bản dịch tức thì ở khung phía trên!</div>`;
          return;
        }

        grid.innerHTML = matches.map(v => {
          const sHz = v.sentenceHz || (v.example || '').split(/[（(—]/)[0].replace('常用表达：', '').trim() || v.hanzi;
          const sPy = v.sentencePy || generateLibraryPinyinForText(sHz);
          return `
          <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between gap-2.5 text-xs shadow-sm">
            <div class="flex items-start justify-between gap-2">
              <div>
                <div class="flex flex-wrap items-center gap-1.5">
                  <span class="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-extrabold text-[11px]">${escapeHtml(v.realmName || v.hsk || 'Giao tiếp')}</span>
                  <span class="text-amber-300/90 font-semibold text-[11px]">${escapeHtml(v.hanviet || 'Thông dụng')}</span>
                </div>
                <div class="mt-1 flex items-baseline gap-2 flex-wrap">
                  <span class="text-xl sm:text-2xl font-black hanzi-font text-amber-300">${escapeHtml(v.hanzi)}</span>
                  <span class="text-xs sm:text-sm font-extrabold text-emerald-400">${escapeHtml(v.pinyin)}</span>
                </div>
              </div>
              <div class="flex items-center gap-1 shrink-0">
                <button type="button" data-speak="${escapeHtml(v.hanzi)}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-extrabold">🔊</button>
                <button type="button" data-save-dict-word="${escapeHtml(v.hanzi)}" data-save-dict-py="${escapeHtml(v.pinyin)}" data-save-dict-mn="${escapeHtml(v.meaning)}" class="save-dict-to-srs-btn px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-extrabold">+ Lưu Sổ Tay</button>
              </div>
            </div>

            <div class="text-slate-100 font-bold bg-slate-900 px-3 py-2 rounded-xl border border-slate-800 leading-relaxed">
              🇻🇳 ${escapeHtml(v.meaning)}
            </div>

            <div class="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-300">
              <div class="truncate"><b class="text-emerald-400">VD:</b> <span class="hanzi-font text-white font-bold">${escapeHtml(sHz)}</span></div>
              <button type="button" data-speak="${escapeHtml(sHz)}" class="speak-inline-btn px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold shrink-0">🔊 Câu</button>
            </div>
          </div>
        `}).join('');

        // Also search the 10,500 Conversational Sentences for matching context examples when user searches a keyword!
        const sentBox = document.getElementById('dictMatchingSentencesBox');
        const sentList = document.getElementById('dictMatchingSentencesList');
        if (sentBox && sentList) {
          if (q && q.length >= 2 && typeof window._getChineseConversationalSentence === 'function') {
            const matchedSents = [];
            for (let sIdx = 1; sIdx <= 600 && matchedSents.length < 6; sIdx += 3) {
              const sent = window._getChineseConversationalSentence(sIdx, 'all');
              if (sent.hanzi.includes(q) || stripViAccents(sent.vi).includes(qPlain) || sent.plainPinyin.includes(qPlain)) {
                matchedSents.push(sent);
              }
            }
            if (matchedSents.length > 0) {
              sentBox.classList.remove('hidden');
              sentList.innerHTML = matchedSents.map(sent => `
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-2">
                  <div class="space-y-0.5">
                    <div class="font-extrabold hanzi-font text-white text-sm">${escapeHtml(sent.hanzi)}</div>
                    <div class="text-emerald-400 font-medium">${escapeHtml(sent.pinyin)}</div>
                    <div class="text-slate-300">🇻🇳 ${escapeHtml(sent.vi)}</div>
                  </div>
                  <div class="flex flex-col gap-1 shrink-0">
                    <button type="button" data-speak="${escapeHtml(sent.hanzi)}" class="speak-inline-btn px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold">🔊</button>
                    <button type="button" data-save-dict-word="${escapeHtml(sent.hanzi)}" data-save-dict-py="${escapeHtml(sent.pinyin)}" data-save-dict-mn="${escapeHtml(sent.vi)}" class="save-dict-to-srs-btn px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-bold">+ Lưu</button>
                  </div>
                </div>
              `).join('');
            } else {
              sentBox.classList.add('hidden');
            }
          } else {
            sentBox.classList.add('hidden');
          }
        }
      }

            function renderGradedStory(idx) {
        currentStoryIdx = idx;
        const story = GRADED_STORIES[idx] || GRADED_STORIES[0];
        const container = document.getElementById('storyTokensContainer');
        if (!container) return;

        container.innerHTML = story.tokens.map((tk, i) => {
          if (!tk.py) {
            return `<span class="text-lg font-bold text-slate-400 px-0.5">${tk.hz}</span>`;
          }
          return `
            <button data-story-token="${i}" class="story-token-btn px-2 py-1 rounded-xl bg-slate-900 hover:bg-emerald-950 border border-slate-800 hover:border-emerald-500/50 transition text-center">
              <div class="text-xs text-emerald-400 font-medium ${showStoryPinyin ? '' : 'hidden'}">${tk.py}</div>
              <div class="text-base font-bold hanzi-font text-white">${tk.hz}</div>
            </button>
          `;
        }).join('');

        document.getElementById('storyVietnameseBox').innerHTML = `<b>🇻🇳 Bản dịch nghĩa toàn bài:</b> ${story.viTranslation}`;
      }

      function renderGrammarAndResources(rcat = 'all') {
        const gList = document.getElementById('grammarCardsList');
        if (gList) {
          gList.innerHTML = GRAMMAR_CAPSULES.map(g => `
            <div class="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div class="flex items-center justify-between">
                <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">${g.level}</span>
                <span class="font-bold text-amber-300">${g.title}</span>
              </div>
              <div class="p-2 rounded-lg bg-slate-900 border border-amber-500/30 font-mono text-amber-200">${g.formula}</div>
              <div class="text-slate-200"><b>Ví dụ:</b> <button data-speak="${g.example.split('（')[0]}" aria-label="Nghe phát âm tiếng Trung" class="speak-inline-btn text-emerald-300 underline hanzi-font">${g.example} 🔊</button></div>
              <div class="text-slate-400">${g.mistake}</div>
            </div>
          `).join('');
        }

        const rGrid = document.getElementById('externalResourcesGrid');
        if (rGrid) {
          const filtered = EXTERNAL_RESOURCES.filter(r => rcat === 'all' || r.cat === rcat);
          rGrid.innerHTML = filtered.map(r => `
            <div class="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 transition flex flex-col justify-between gap-3">
              <div class="space-y-1.5">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">${r.tag}</span>
                </div>
                <h4 class="font-extrabold text-sm text-white">${r.name}</h4>
                <p class="text-xs text-slate-400 leading-relaxed">${r.desc}</p>
              </div>
              <a href="${r.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-slate-900 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-slate-800 font-bold text-xs transition">
                <span>🌐 Khám Phá Trang Web</span>
                <span>↗</span>
              </a>
            </div>
          `).join('');
        }
      }

      // =====================================================
      // 13. PROFILE, CHART.JS ANALYTICS & SHOP RENDERER
      // =====================================================
      let studyChartInstance = null;

      function renderProfileAndChart() {
        renderAccountScheduleHub();
        const logList = document.getElementById('studyHistoryLogList');
        if (logList) {
          logList.innerHTML = (appState.studyHistory || []).map(item => `
            <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
              <div>
                <span class="text-slate-400 mr-2">[${item.time}]</span>
                <span class="text-slate-200 font-medium">${item.action}</span>
              </div>
              <span class="text-emerald-400 font-bold shrink-0">${item.exp || ''}</span>
            </div>
          `).join('');
        }

        const shopList = document.getElementById('rpgShopItemsList');
        if (shopList) {
          shopList.innerHTML = SHOP_ITEMS.map(item => {
            const owned = appState.inventory && appState.inventory[item.id];
            return `
              <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">${item.icon}</span>
                  <div>
                    <div class="text-xs font-extrabold text-white">${item.name} ${owned ? '<span class="text-emerald-400">(Đã sở hữu: ' + owned + ')</span>' : ''}</div>
                    <div class="text-xs text-slate-400">${item.desc}</div>
                  </div>
                </div>
                <button data-buy-item="${item.id}" class="buy-shop-btn px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shrink-0 transition">
                  ${item.cost} 💎
                </button>
              </div>
            `;
          }).join('');
        }

        const goalSelect = document.getElementById('dailyGoalSelect');
        if (goalSelect) goalSelect.value = String(appState.dailyGoalMinutes || 15);

        // Render Chart.js with Adaptive Light/Dark Theme Colors
        const canvas = document.getElementById('studyAnalyticsChart');
        if (canvas && window.Chart) {
          try {
            if (studyChartInstance) studyChartInstance.destroy();
            const isLightMode = Boolean(appState.lightTheme);
            const tickColor = isLightMode ? '#334155' : '#94a3b8';
            const legendColor = isLightMode ? '#0f172a' : '#cbd5e1';
            const gridColor = isLightMode ? 'rgba(148, 163, 184, 0.35)' : 'rgba(51, 65, 85, 0.4)';
            studyChartInstance = new window.Chart(canvas, {
              type: 'bar',
              data: {
                labels: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'Hôm nay'],
                datasets: [{
                  label: 'Số phút học tiếng Trung',
                  data: appState.weeklyMinutes || [12, 18, 15, 25, 20, 30, 10],
                  backgroundColor: 'rgba(16, 185, 129, 0.75)',
                  borderColor: '#10b981',
                  borderWidth: 1,
                  borderRadius: 8
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: legendColor, font: { size: 11 } } }
                },
                scales: {
                  x: { ticks: { color: tickColor }, grid: { display: false } },
                  y: { ticks: { color: tickColor }, grid: { color: gridColor }, beginAtZero: true }
                }
              }
            });
          } catch (e) {}
        }
      }

      // =====================================================
      // 14. PLACEMENT TEST (KIỂM TRA XẾP LỚP)
      // =====================================================
      const PLACEMENT_QUESTIONS = [
        { q: 'Câu 1 (Mất gốc): Khi gặp người Trung Quốc lần đầu, câu nào dùng để chào hỏi?', opts: ['你好 (nǐ hǎo)', '再见 (zàijiàn)', '对不起 (duìbuqǐ)'], ans: 0 },
        { q: 'Câu 2 (HSK 1-2): "今天比昨天热" có nghĩa là gì?', opts: ['Hôm nay nóng hơn hôm qua', 'Hôm qua nóng hơn hôm nay', 'Hôm nay và hôm qua đều lạnh'], ans: 0 },
        { q: 'Câu 3 (HSK 3): Chọn câu chữ 把 đúng ngữ pháp:', opts: ['我把作业做完了。', '我做完把作业了。', '把作业我做完。'], ans: 0 },
        { q: 'Câu 4 (HSK 4-5): Từ nào điền đúng vào "采取有效_______" (Áp dụng biện pháp hữu hiệu)?', opts: ['措施 (cuòshī)', '经验 (jīngyàn)', '趋势 (qūshì)'], ans: 0 },
        { q: 'Câu 5 (HSK 6): Thành ngữ "相辅相成" mang ý nghĩa gì?', opts: ['Bổ trợ lẫn nhau cùng phát triển', 'Bỏ cuộc giữa chừng', 'Vẽ rắn thêm chân'], ans: 0 }
      ];
      let placementStep = 0;
      let placementScore = 0;

      function openPlacementModal() {
        placementStep = 0;
        placementScore = 0;
        document.getElementById('placementModal').classList.remove('hidden');
        renderPlacementStep();
      }

      function renderPlacementStep() {
        const body = document.getElementById('placementQuizBody');
        if (placementStep < PLACEMENT_QUESTIONS.length) {
          const item = PLACEMENT_QUESTIONS[placementStep];
          body.innerHTML = `
            <div class="text-xs font-bold text-emerald-400">Tiến độ: Câu ${placementStep + 1} / ${PLACEMENT_QUESTIONS.length}</div>
            <h4 class="text-base font-extrabold text-white">${item.q}</h4>
            <div class="space-y-2">
              ${item.opts.map((o, idx) => `
                <button data-place-opt="${idx}" class="place-opt-btn w-full text-left p-3 rounded-xl bg-slate-950 hover:bg-emerald-600 hover:text-white border border-slate-800 text-xs sm:text-sm font-bold text-slate-200 transition">
                  ${o}
                </button>
              `).join('')}
            </div>
          `;
        } else {
          const recommendedNode = placementScore <= 1 ? 'c0_1' : (placementScore === 2 ? 'hsk2_1' : (placementScore === 3 ? 'hsk3_1' : (placementScore === 4 ? 'hsk5_1' : 'hsk6_1')));
          const recObj = CURRICULUM_NODES.find(n => n.id === recommendedNode) || CURRICULUM_NODES[0];
          appState.lastLessonId = recObj.id;
          saveStateToDatabase('Hoàn thành Kiểm tra xếp lớp (' + placementScore + '/5) ➔ Đề xuất: ' + recObj.realmName);

          body.innerHTML = `
            <div class="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-center space-y-3">
              <div class="text-3xl">🎉</div>
              <h4 class="text-lg font-extrabold text-white">Kết Quả Pháp Trận: ${placementScore} / 5 Điểm</h4>
              <p class="text-xs sm:text-sm text-slate-300">Cảnh giới phù hợp nhất với bạn hiện tại là: <b class="text-amber-300">${recObj.realmName} — ${recObj.title}</b></p>
              <button id="btnStartRecommendedLesson" class="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs sm:text-sm transition">
                🚀 Vào Học Ngay Cấp Độ Này
              </button>
            </div>
          `;
        }
      }

      // =====================================================
      // 15. NAVIGATION & GLOBAL EVENT DELEGATION
      // =====================================================
