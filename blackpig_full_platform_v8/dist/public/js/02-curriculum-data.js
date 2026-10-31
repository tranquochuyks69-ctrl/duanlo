// ============================================================================
// Module 02: HSK 1-6 Vocabulary Banks, Course Roadmaps, AI Scenarios & Dojo Data
// ============================================================================
'use strict';

const CURRICULUM_NODES = [
        {
          id: 'c0_1',
          realm: 0,
          realmName: 'Cấp 0: Mất Gốc',
          title: 'Bài 1: Làm Quen Pinyin, 4 Thanh Điệu & Biến Điệu',
          subtitle: 'Nền tảng phát âm chuẩn Bắc Kinh cho người bắt đầu từ con số 0',
          rewardExp: 50,
          rewardGems: 25,
          vocab: [
            { hanzi: '你好', pinyin: 'nǐ hǎo', hanviet: 'Nhĩ hảo', meaning: 'Xin chào (Biến điệu: ní hǎo)', example: '你好！很高兴认识你。(Xin chào! Rất vui được quen bạn.)' },
            { hanzi: '谢谢', pinyin: 'xièxie', hanviet: 'Tạ tạ', meaning: 'Cảm ơn', example: '谢谢你的帮助。(Cảm ơn sự giúp đỡ của bạn.)' },
            { hanzi: '不客气', pinyin: 'bú kèqi', hanviet: 'Bất khách khí', meaning: 'Đừng khách sáo / Không có chi', example: 'A: 谢谢！ B: 不客气！' },
            { hanzi: '再见', pinyin: 'zàijiàn', hanviet: 'Tái kiến', meaning: 'Tạm biệt, hẹn gặp lại', example: '明天见，再见！(Mai gặp nhé, tạm biệt!)' }
          ],
          grammarNote: 'Quy tắc vàng: Khi hai chữ mang Thanh 3 đứng liền nhau (như 你 nǐ + 好 hǎo), chữ đầu tiên đọc lướt lên thành Thanh 2 (ní hǎo).',
          questions: [
            { q: 'Khi nói "你好" (nǐ hǎo - Xin chào), âm thực tế phát ra sẽ biến điệu như thế nào?', options: ['Đọc thành "ní hǎo" (Thanh 2 + Thanh 3)', 'Giữ nguyên hai thanh 3 nặng', 'Đọc thành "nì hào" (Hai thanh 4)', 'Đọc thành thanh nhẹ'], answer: 0, explain: 'Hai thanh 3 đi liền nhau thì âm tiết đầu biến thành thanh 2 để dễ phát âm.' },
            { q: 'Ai đó nói "谢谢" (Cảm ơn) với bạn, bạn đáp lại lịch sự nhất bằng câu nào?', options: ['不客气 (bú kèqi)', '再见 (zàijiàn)', '对不起 (duìbuqǐ)', '你好 (nǐ hǎo)'], answer: 0, explain: '不客气 (bú kèqi) nghĩa là "Đừng khách sáo / Không có chi".' },
            { q: 'Chữ "不" (bù) khi đứng trước từ mang Thanh 4 như "是" (shì) sẽ đọc thành gì?', options: ['bú shì (Thanh 2 + Thanh 4)', 'bù shì (Thanh 4 + Thanh 4)', 'bǔ shì (Thanh 3 + Thanh 4)', 'bū shì (Thanh 1 + Thanh 4)'], answer: 0, explain: 'Trước thanh 4, chữ 不 (bù) luôn biến điệu thành bú (thanh 2).' }
          ]
        },
        {
          id: 'c0_2',
          realm: 0,
          realmName: 'Cấp 0: Mất Gốc',
          title: 'Bài 2: 8 Nét Cơ Bản, Quy Tắc Bút Thuận & Bộ Thủ',
          subtitle: 'Hiểu cấu tạo chữ Hán tượng hình — Nhìn chữ đoán ngay ý nghĩa',
          rewardExp: 60,
          rewardGems: 30,
          vocab: [
            { hanzi: '人', pinyin: 'rén', hanviet: 'Nhân', meaning: 'Con người (Tượng hình dáng người bước đi)', example: '中国人 (Người Trung Quốc)' },
            { hanzi: '口', pinyin: 'kǒu', hanviet: 'Khẩu', meaning: 'Cái miệng / Nhân khẩu', example: '一口水 (Một ngụm nước)' },
            { hanzi: '女', pinyin: 'nǚ', hanviet: 'Nữ', meaning: 'Phụ nữ, con gái', example: '女人 (Phụ nữ)' },
            { hanzi: '好', pinyin: 'hǎo', hanviet: 'Hảo', meaning: 'Tốt, khỏe (Ghép 女 Nữ + 子 Tử)', example: '好人 (Người tốt)' }
          ],
          grammarNote: 'Quy tắc viết chữ Hán (Bút thuận): Ngang trước sổ sau (十), Phẩy trước mác sau (人), Trên trước dưới sau (三), Trái trước phải sau (好), Ngoài trước trong sau, Vào nhà trước đóng cửa sau (回).',
          questions: [
            { q: 'Khi viết chữ "十" (Thập - số 10), thứ tự nét đúng là gì?', options: ['Viết nét Ngang (一) trước, nét Sổ (丨) sau', 'Viết nét Sổ trước, nét Ngang sau', 'Viết từ dưới lên trên', 'Viết nét nào trước cũng được'], answer: 0, explain: 'Quy tắc cốt lõi: Ngang trước sổ sau (先横后竖).' },
            { q: 'Chữ "好" (Hảo - Tốt) được ghép từ hai bộ thủ nào?', options: ['Bộ Nữ (女) và Bộ Tử (子)', 'Bộ Nhân (人) và Bộ Khẩu (口)', 'Bộ Nhật (日) và Bộ Nguyệt (月)', 'Bộ Thủy (氵) và Bộ Hỏa (火)'], answer: 0, explain: 'Người phụ nữ (女) có con (子) tượng trưng cho điều tốt lành (好).' },
            { q: 'Bộ "口" (Khẩu - cái miệng) thường xuất hiện trong các chữ mang ý nghĩa gì?', options: ['Ăn uống, nói năng, âm thanh (吃, 喝, 叫)', 'Đi lại, chạy nhảy', 'Cây cối, rừng rậm', 'Kim loại, vũ khí'], answer: 0, explain: 'Bộ Khẩu (口) liên quan trực tiếp đến hoạt động của miệng.' }
          ]
        },
        {
          id: 'hsk1_1',
          realm: 1,
          realmName: 'HSK 1: Sơ Cấp 1',
          title: 'Bài 3: Giới Thiệu Bản Thân, Quốc Tịch & Nghề Nghiệp',
          subtitle: 'Làm chủ động từ 叫 (gọi là), 是 (là) và câu hỏi với 吗 / 呢',
          rewardExp: 70,
          rewardGems: 35,
          vocab: [
            { hanzi: '我叫', pinyin: 'wǒ jiào', hanviet: 'Ngã khiếu', meaning: 'Tôi tên là...', example: '我叫明明。(Tôi tên là Minh Minh.)' },
            { hanzi: '越南', pinyin: 'Yuènán', hanviet: 'Việt Nam', meaning: 'Nước Việt Nam', example: '我是越南人。(Tôi là người Việt Nam.)' },
            { hanzi: '老师', pinyin: 'lǎoshī', hanviet: 'Lão sư', meaning: 'Giáo viên, thầy/cô giáo', example: '王老师好！(Chào thầy Vương ạ!)' },
            { hanzi: '学生', pinyin: 'xuésheng', hanviet: 'Học sinh', meaning: 'Học sinh, sinh viên', example: '我是大学生。(Tôi là sinh viên đại học.)' }
          ],
          grammarNote: 'Cấu trúc câu trần thuật cơ bản: Chủ ngữ + 是 (shì - là) + Danh từ. Thêm trợ từ "吗" (ma) vào cuối câu trần thuật để biến thành câu hỏi Có/Không!',
          questions: [
            { q: 'Để nói "Tôi là người Việt Nam", câu tiếng Trung nào chuẩn xác nhất?', options: ['我是越南人。(Wǒ shì Yuènán rén.)', '我越南是人。', '我是人越南。', '我叫越南。'], answer: 0, explain: 'Trong tiếng Trung, tên quốc gia đứng trước chữ 人 (người): 越南人 (Việt Nam nhân).' },
            { q: 'Muốn hỏi "Bạn là học sinh phải không?", ta nói thế nào?', options: ['你是学生吗？(Nǐ shì xuésheng ma?)', '你是吗学生？', '吗你是学生？', '你学生呢？'], answer: 0, explain: 'Đặt 吗 (ma) ở cuối câu khẳng định để tạo câu hỏi Yes/No.' },
            { q: 'Từ "老师" (lǎoshī) có nghĩa là gì?', options: ['Giáo viên / Thầy cô', 'Bác sĩ', 'Bạn học', 'Giám đốc'], answer: 0, explain: '老师 (Lão sư) là thầy cô giáo.' }
          ]
        },
        {
          id: 'hsk1_2',
          realm: 1,
          realmName: 'HSK 1: Sơ Cấp 1',
          title: 'Bài 4: Con Số, Thời Gian, Ngày Tháng & Gọi Món',
          subtitle: 'Đếm số từ 1-999, hỏi giờ giấc và gọi trà sữa/món ăn chuẩn xác',
          rewardExp: 75,
          rewardGems: 35,
          vocab: [
            { hanzi: '现在', pinyin: 'xiànzài', hanviet: 'Hiện tại', meaning: 'Bây giờ, hiện tại', example: '现在几点？(Bây giờ mấy giờ?)' },
            { hanzi: '喝茶', pinyin: 'hē chá', hanviet: 'Hát trà', meaning: 'Uống trà', example: '我想喝奶茶。(Tôi muốn uống trà sữa.)' },
            { hanzi: '多少钱', pinyin: 'duōshao qián', hanviet: 'Đa thiểu tiền', meaning: 'Bao nhiêu tiền?', example: '这个多少钱？(Cái này bao nhiêu tiền?)' },
            { hanzi: '米饭', pinyin: 'mǐfàn', hanviet: 'Mễ phạn', meaning: 'Cơm trắng', example: '我吃米饭。(Tôi ăn cơm.)' }
          ],
          grammarNote: 'Thứ tự thời gian trong tiếng Trung luôn đi từ LỚN đến NHỎ: Năm (年) ➔ Tháng (月) ➔ Ngày (日/号) ➔ Buổi ➔ Giờ (点) ➔ Phút (分).',
          questions: [
            { q: 'Trong tiếng Trung, trật tự nói thời gian nào sau đây là ĐÚNG?', options: ['Năm ➔ Tháng ➔ Ngày ➔ Giờ', 'Giờ ➔ Ngày ➔ Tháng ➔ Năm', 'Ngày ➔ Tháng ➔ Năm', 'Phút ➔ Giờ ➔ Ngày'], answer: 0, explain: 'Tiếng Trung luôn sắp xếp đơn vị thời gian và không gian từ Lớn đến Nhỏ.' },
            { q: 'Khi đi mua hàng, bạn hỏi "这个多少钱？" (Zhège duōshao qián?) nghĩa là gì?', options: ['Cái này bao nhiêu tiền?', 'Cái này ở đâu?', 'Cái này tên là gì?', 'Có mấy cái này?'], answer: 0, explain: '多少钱 (duōshao qián) là bao nhiêu tiền.' }
          ]
        },
        {
          id: 'hsk2_1',
          realm: 2,
          realmName: 'HSK 2: Sơ Cấp 2',
          title: 'Bài 5: Mua Sắm, Mặc Cả & So Sánh Với Chữ 比 (bǐ)',
          subtitle: 'Biết khen đắt/rẻ, xin giảm giá và so sánh hơn kém tự nhiên',
          rewardExp: 85,
          rewardGems: 40,
          vocab: [
            { hanzi: '便宜', pinyin: 'piányi', hanviet: 'Tiện nghi', meaning: 'Rẻ (giá cả)', example: '太贵了，便宜一点吧！(Đắt quá, bớt chút đi!)' },
            { hanzi: '觉得', pinyin: 'juéde', hanviet: 'Giác đắc', meaning: 'Cảm thấy, cho rằng', example: '我觉得这件衣服很好看。(Tôi thấy bộ đồ này rất đẹp.)' },
            { hanzi: '比', pinyin: 'bǐ', hanviet: 'Tỷ', meaning: 'So với (dùng trong câu so sánh hơn)', example: '今天比昨天冷。(Hôm nay lạnh hơn hôm qua.)' },
            { hanzi: '准备', pinyin: 'zhǔnbèi', hanviet: 'Chuẩn bị', meaning: 'Chuẩn bị', example: '我准备去北京旅游。(Tôi chuẩn bị đi Bắc Kinh du lịch.)' }
          ],
          grammarNote: 'Công thức so sánh hơn với 比 (bǐ): A + 比 + B + Tính từ (+ Mức độ: 一点儿 / 得多). Lưu ý: Tuyệt đối KHÔNG dùng 很 (hěn) trước tính từ trong câu so sánh 比!',
          questions: [
            { q: 'Câu nào diễn tả ĐÚNG ngữ pháp câu so sánh "Hôm nay nóng hơn hôm qua"?', options: ['今天比昨天热。(Jīntiān bǐ zuótiān rè.)', '今天比昨天很热。', '今天热比昨天。', '比今天昨天热。'], answer: 0, explain: 'Công thức A 比 B + Tính từ, không thêm 很 trước tính từ.' },
            { q: 'Khi muốn mặc cả "Đắt quá, rẻ hơn một chút đi!", bạn nói câu nào?', options: ['太贵了，便宜一点吧！', '太便宜了，贵一点吧！', '多少钱一斤？', '我不买这个。'], answer: 0, explain: '太贵了 (Đắt quá), 便宜一点吧 (Rẻ hơn một chút đi).' }
          ]
        },
        {
          id: 'hsk2_2',
          realm: 2,
          realmName: 'HSK 2: Sơ Cấp 2',
          title: 'Bài 6: Hỏi Đường, Phương Tiện & Trải Nghiệm Quá Khứ (过)',
          subtitle: 'Kể về những nơi từng đi qua và hỏi đường tàu điện ngầm, sân bay',
          rewardExp: 90,
          rewardGems: 45,
          vocab: [
            { hanzi: '机场', pinyin: 'jīchǎng', hanviet: 'Cơ trường', meaning: 'Sân bay', example: '怎么去机场？(Đi sân bay như thế nào?)' },
            { hanzi: '离', pinyin: 'lí', hanviet: 'Ly', meaning: 'Cách (khoảng cách từ A đến B)', example: '我家离公司很近。(Nhà tôi cách công ty rất gần.)' },
            { hanzi: '去过', pinyin: 'qùguo', hanviet: 'Khứ qua', meaning: 'Đã từng đi', example: '我去过上海。(Tôi đã từng đi Thượng Hải.)' },
            { hanzi: '帮忙', pinyin: 'bāngmáng', hanviet: 'Bang mang', meaning: 'Giúp đỡ (Động từ ly hợp)', example: '请你帮我一个忙。(Xin bạn giúp tôi một việc.)' }
          ],
          grammarNote: 'Động từ + 过 (guo) dùng để diễn tả một trải nghiệm ĐÃ TỪNG xảy ra trong quá khứ (VD: 我吃过北京烤鸭 - Tôi từng ăn vịt quay Bắc Kinh). Phủ định dùng: 没(有) + Động từ + 过.',
          questions: [
            { q: 'Muốn nói "Tôi chưa từng đi Bắc Kinh", câu nào chuẩn ngữ pháp nhất?', options: ['我没去过北京。(Wǒ méi qùguo Běijīng.)', '我不去过北京。', '我没去北京过。', '我过没去北京。'], answer: 0, explain: 'Phủ định của trải nghiệm 过 luôn dùng 没(有) + Động từ + 过.' },
            { q: 'Để nói "Nhà tôi cách trường học rất gần", ta dùng giới từ nào?', options: ['我家离学校很近。(dùng 离)', '我家从学校很近。', '我家比学校很近。', '我家在学校很近。'], answer: 0, explain: 'A 离 B + 远/近 dùng để chỉ khoảng cách giữa hai địa điểm.' }
          ]
        },
        {
          id: 'hsk3_1',
          realm: 3,
          realmName: 'HSK 3: Trung Cấp 1',
          title: 'Bài 7: Bổ Ngữ Kết Quả, Bổ Ngữ Xu Hướng & Câu Chữ 把 (bǎ)',
          subtitle: 'Vượt qua "ải khó nhất" của ngữ pháp sơ-trung cấp để nói giống người bản xứ',
          rewardExp: 110,
          rewardGems: 55,
          vocab: [
            { hanzi: '把', pinyin: 'bǎ', hanviet: 'Bả', meaning: 'Đem, lấy (Giới từ câu chữ 把)', example: '请把门关上。(Xin hãy đóng cửa lại.)' },
            { hanzi: '清楚', pinyin: 'qīngchu', hanviet: 'Thanh sở', meaning: 'Rõ ràng', example: '我听清楚了。(Tôi nghe rõ rồi.)' },
            { hanzi: '决定', pinyin: 'juédìng', hanviet: 'Quyết định', meaning: 'Quyết định', example: '我决定留在这里。(Tôi quyết định ở lại đây.)' },
            { hanzi: '放心', pinyin: 'fàngxīn', hanviet: 'Phóng tâm', meaning: 'Yên tâm', example: '你放心吧，没问题！(Bạn yên tâm đi, không vấn đề gì!)' }
          ],
          grammarNote: 'Câu chữ 把 (bǎ) dùng khi muốn nhấn mạnh tác động làm thay đổi vị trí/trạng thái của tân ngữ xác định: Chủ ngữ + 把 + Tân ngữ + Động từ + Thành phần khác (VD: 我把作业做完了 - Tôi làm xong bài tập rồi).',
          questions: [
            { q: 'Khi muốn nói "Tôi làm xong bài tập rồi" bằng câu chữ 把, câu nào ĐÚNG?', options: ['我把作业做完了。', '我做完把作业了。', '把作业我做完。', '我把做完作业了。'], answer: 0, explain: 'Cấu trúc chuẩn: Chủ ngữ (我) + 把 + Tân ngữ (作业) + Động từ + Kết quả (做完了).' },
            { q: 'Từ "放心" (fàngxīn) có nghĩa tiếng Việt là gì?', options: ['Yên tâm / An tâm', 'Cẩn thận', 'Đau lòng', 'Vui vẻ'], answer: 0, explain: '放心 (Phóng tâm) = Đặt nỗi lo xuống = Yên tâm.' }
          ]
        },
        {
          id: 'hsk3_2',
          realm: 3,
          realmName: 'HSK 3: Trung Cấp 1',
          title: 'Bài 8: Câu Bị Động Chữ 被 (bèi) & Liên Từ Phức Hợp',
          subtitle: 'Diễn đạt nguyên nhân - kết quả, điều kiện và câu bị động trôi chảy',
          rewardExp: 115,
          rewardGems: 55,
          vocab: [
            { hanzi: '被', pinyin: 'bèi', hanviet: 'Bị', meaning: 'Bị, được (Giới từ câu bị động)', example: '我的蛋糕被弟弟吃了。(Bánh của tôi bị em trai ăn mất rồi.)' },
            { hanzi: '虽然…但是…', pinyin: 'suīrán... dànshì...', hanviet: 'Tuy nhiên... đản thị...', meaning: 'Mặc dù... nhưng...', example: '虽然很累，但是我很高兴。' },
            { hanzi: '不但…而且…', pinyin: 'búdàn... érqiě...', hanviet: 'Bất đản... nhi thả...', meaning: 'Không những... mà còn...', example: '他不但聪明，而且很努力。' },
            { hanzi: '习惯', pinyin: 'xíguàn', hanviet: 'Tập quán', meaning: 'Thói quen / Quen với', example: '我已经习惯了北京的天气。' }
          ],
          grammarNote: 'Cấu trúc bị động: Chủ ngữ (vật/người chịu tác động) + 被 (bèi) + (Tác nhân) + Động từ + Kết quả. Trạng từ phủ định (没) luôn đặt TRƯỚC chữ 被!',
          questions: [
            { q: 'Cặp liên từ "不但……而且……" (búdàn... érqiě...) có nghĩa là gì?', options: ['Không những... mà còn...', 'Mặc dù... nhưng...', 'Nếu... thì...', 'Bởi vì... cho nên...'], answer: 0, explain: '不但...而且... dùng để nối hai vế câu tăng tiến: Không những... mà còn...' },
            { q: 'Trong câu "我的手机被小偷偷走了", cái gì đã xảy ra?', options: ['Điện thoại của tôi bị kẻ trộm lấy mất rồi', 'Tôi lấy điện thoại của kẻ trộm', 'Điện thoại của tôi bị rơi vỡ', 'Tôi mua điện thoại mới'], answer: 0, explain: '手机 (điện thoại) 被 (bị) 小偷 (kẻ trộm) 偷走了 (lấy trộm mất rồi).' }
          ]
        },
        {
          id: 'hsk4_1',
          realm: 4,
          realmName: 'HSK 4: Trung Cấp 2',
          title: 'Bài 9: Giao Tiếp Công Sở, Phỏng Vấn & Thuyết Trình',
          subtitle: 'Từ vựng chuyên nghiệp để viết email, phỏng vấn xin việc và làm việc nhóm',
          rewardExp: 135,
          rewardGems: 65,
          vocab: [
            { hanzi: '经验', pinyin: 'jīngyàn', hanviet: 'Kinh nghiệm', meaning: 'Kinh nghiệm làm việc/sống', example: '他有五年的工作经验。(Anh ấy có 5 năm kinh nghiệm làm việc.)' },
            { hanzi: '负责', pinyin: 'fùzé', hanviet: 'Phụ trách', meaning: 'Chịu trách nhiệm, phụ trách', example: '我负责这个新项目。(Tôi phụ trách dự án mới này.)' },
            { hanzi: '流利', pinyin: 'liúlì', hanviet: 'Lưu lợi', meaning: 'Lưu loát, trôi chảy', example: '她的汉语说得很流利。(Cô ấy nói tiếng Trung rất lưu loát.)' },
            { hanzi: '联系', pinyin: 'liánxì', hanviet: 'Liên hệ', meaning: 'Liên lạc, liên hệ', example: '有问题请随时联系我。(Có vấn đề gì xin liên hệ tôi bất cứ lúc nào.)' }
          ],
          grammarNote: 'Ở cấp độ HSK 4, khi giao tiếp công sở, hãy thay thế các từ khẩu ngữ đơn giản bằng từ song âm tiết trang trọng: dùng 与/同 thay cho 跟 (với), dùng 协助 thay cho 帮 (hỗ trợ).',
          questions: [
            { q: 'Trong buổi phỏng vấn, nhà tuyển dụng hỏi về "工作经验" (gōngzuò jīngyàn), họ đang hỏi gì?', options: ['Kinh nghiệm làm việc', 'Mức lương mong muốn', 'Trình độ học vấn', 'Sở thích cá nhân'], answer: 0, explain: '工作 (công tác/làm việc) + 经验 (kinh nghiệm) = Kinh nghiệm làm việc.' },
            { q: 'Để nói "Tôi phụ trách thị trường Việt Nam", ta dùng động từ nào?', options: ['我负责越南市场。(fùzé)', '我经验越南市场。', '我流利越南市场。', '我习惯越南市场。'], answer: 0, explain: '负责 (Phụ trách) + Tân ngữ chỉ mảng công việc đảm nhận.' }
          ]
        },
        {
          id: 'hsk4_2',
          realm: 4,
          realmName: 'HSK 4: Trung Cấp 2',
          title: 'Bài 10: Phân Biệt Từ Đồng Nghĩa & Sắc Thái Biểu Đạt',
          subtitle: 'Nắm vững sự khác biệt tinh tế giữa 适合 vs 合适, 刚才 vs 刚, 尽管 vs 虽然',
          rewardExp: 140,
          rewardGems: 70,
          vocab: [
            { hanzi: '合适', pinyin: 'héshì', hanviet: 'Hợp thích', meaning: 'Phù hợp, vừa vặn (Tính từ - không mang tân ngữ)', example: '这双鞋大小很合适。(Đôi giày này kích cỡ rất vừa.)' },
            { hanzi: '适合', pinyin: 'shìhé', hanviet: 'Thích hợp', meaning: 'Phù hợp với... (Động từ - theo sau có tân ngữ)', example: '这份工作很适合你。(Công việc này rất hợp với bạn.)' },
            { hanzi: '既然', pinyin: 'jìrán', hanviet: 'Ký nhiên', meaning: 'Đã... thì... (Đưa ra suy luận từ sự thật hiển nhiên)', example: '既然你来了，就一起吃饭吧。' },
            { hanzi: '坚持', pinyin: 'jiānchí', hanviet: 'Kiên trì', meaning: 'Kiên trì, bền bỉ', example: '坚持学中文一定会成功。' }
          ],
          grammarNote: 'Mẹo phân biệt cực nhanh: 适合 (Thích hợp) là ĐỘNG TỪ nên theo sau luôn có Tân ngữ (适合你 - hợp với bạn). Còn 合适 (Hợp thích) là TÍNH TỪ nên đứng cuối câu hoặc trước danh từ (很合适).',
          questions: [
            { q: 'Điền từ đúng vào chỗ trống: "这套衣服的颜色很_______你。" (Màu của bộ đồ này rất hợp với bạn.)', options: ['适合 (shìhé - Động từ + Tân ngữ 你)', '合适 (héshì - Tính từ không nhận tân ngữ)', '习惯', '负责'], answer: 0, explain: 'Vì phía sau có tân ngữ "你" (bạn), bắt buộc dùng động từ 适合.' },
            { q: 'Liên từ "既然" (jìrán - Đã... thì...) thường đi kèm với từ nào ở vế sau?', options: ['就 / 也 / 还 (jiù / yě / hái)', '但是 (dànshì)', '因为 (yīnwèi)', '虽然 (suīrán)'], answer: 0, explain: 'Cấu trúc 既然 A，就 B (Đã A rồi thì hãy B đi).' }
          ]
        },
        {
          id: 'hsk5_1',
          realm: 5,
          realmName: 'HSK 5: Cao Cấp 1',
          title: 'Bài 11: Kinh Tế, Thương Mại Điện Tử & Đàm Phán Kinh Doanh',
          subtitle: 'Đọc hiểu tin tức kinh tế, ký kết hợp đồng và thảo luận chiến lược',
          rewardExp: 165,
          rewardGems: 85,
          vocab: [
            { hanzi: '趋势', pinyin: 'qūshì', hanviet: 'Xu thế', meaning: 'Xu hướng, xu thế phát triển', example: '数字化是未来的发展趋势。(Số hóa là xu thế phát triển tương lai.)' },
            { hanzi: '促进', pinyin: 'cùjìn', hanviet: 'Xúc tiến', meaning: 'Thúc đẩy, xúc tiến', example: '促进两国经济合作。(Thúc đẩy hợp tác kinh tế hai nước.)' },
            { hanzi: '双方', pinyin: 'shuāngfāng', hanviet: 'Song phương', meaning: 'Hai bên, song phương', example: '双方达成了协议。(Hai bên đã đạt được thỏa thuận.)' },
            { hanzi: '采取', pinyin: 'cǎiqǔ', hanviet: 'Thái thủ', meaning: 'Áp dụng, thực thi (biện pháp, chính sách)', example: '采取有效措施。(Áp dụng biện pháp hữu hiệu.)' }
          ],
          grammarNote: 'Trong văn phong HSK 5-6 (Báo chí & Thương mại), nắm vững các cặp kết hợp cố định (Collocations): 采取 + 措施/行动 (Áp dụng biện pháp), 促进 + 发展/合作 (Thúc đẩy phát triển), 达成 + 协议/共识 (Đạt được thỏa thuận).',
          questions: [
            { q: 'Động từ "采取" (cǎiqǔ - áp dụng/thực thi) thường kết hợp chuẩn nhất với danh từ nào sau đây?', options: ['措施 (cuòshī - biện pháp)', '经济 (jīngjì - kinh tế)', '经验 (jīngyàn - kinh nghiệm)', '双方 (shuāngfāng - song phương)'], answer: 0, explain: 'Cụm cố định kinh điển trong HSK 5: 采取措施 (cǎiqǔ cuòshī - áp dụng biện pháp).' },
            { q: 'Từ "趋势" (qūshì) mang âm Hán Việt và ý nghĩa là gì?', options: ['Xu thế / Xu hướng phát triển', 'Ưu thế vượt trội', 'Thị trường chứng khoán', 'Khủng hoảng tài chính'], answer: 0, explain: '趋势 (Xu thế) chỉ chiều hướng vận động phát triển của sự vật.' }
          ]
        },
        {
          id: 'hsk5_2',
          realm: 5,
          realmName: 'HSK 5: Cao Cấp 1',
          title: 'Bài 12: Tứ Tự Thành Ngữ (成语) & Văn Hóa Triết Lý Trung Hoa',
          subtitle: 'Nói chuyện sâu sắc, giàu hình ảnh như người trí thức bản địa',
          rewardExp: 175,
          rewardGems: 90,
          vocab: [
            { hanzi: '熟能生巧', pinyin: 'shú néng shēng qiǎo', hanviet: 'Thục năng sinh xảo', meaning: 'Trăm hay không bằng tay quen (Luyện tập nhiều ắt tinh thông)', example: '学外语没有捷径，唯独熟能生巧。' },
            { hanzi: '画蛇添足', pinyin: 'huà shé tiān zú', hanviet: 'Họa xà thiêm túc', meaning: 'Vẽ rắn thêm chân (Làm việc thừa thãi gây hỏng chuyện)', example: '这样做简直是画蛇添足。' },
            { hanzi: '半途而废', pinyin: 'bàn tú ér fèi', hanviet: 'Bán đồ nhi phế', meaning: 'Bỏ cuộc giữa chừng', example: '做事不能半途而废。' },
            { hanzi: '一举两得', pinyin: 'yì jǔ liǎng dé', hanviet: 'Nhất cử lưỡng đắc', meaning: 'Một mũi tên trúng hai đích', example: '既能锻炼又能省钱，真是一举两得。' }
          ],
          grammarNote: 'Thành ngữ 4 chữ (成语 - Chéngyǔ) là tinh hoa của Hán ngữ, thường đóng vai trò làm vị ngữ, định ngữ hoặc trạng ngữ trong câu, giúp câu văn cô đọng gấp 3 lần.',
          questions: [
            { q: 'Để khuyên bạn bè "Làm việc gì cũng đừng bỏ cuộc giữa chừng", ta dùng thành ngữ nào?', options: ['半途而废 (Bán đồ nhi phế)', '画蛇添足 (Họa xà thiêm túc)', '一举两得 (Nhất cử lưỡng đắc)', '马马虎虎 (Mã mã hổ hổ)'], answer: 0, explain: '半途 (nửa đường) 而废 (mà bỏ đi) = Bỏ cuộc giữa chừng.' },
            { q: 'Thành ngữ "画蛇添足" (Vẽ rắn thêm chân) phê phán hành vi nào?', options: ['Làm thêm việc thừa thãi không cần thiết làm hỏng việc', 'Làm việc nhanh nhẹn quyết đoán', 'Giúp đỡ người khác nhiệt tình', 'Chăm chỉ học tập ngày đêm'], answer: 0, explain: 'Rắn vốn không có chân, vẽ thêm chân vừa tốn công vừa làm mất phần thắng.' }
          ]
        },
        {
          id: 'hsk6_1',
          realm: 6,
          realmName: 'HSK 6: Thượng Thừa',
          title: 'Bài 13: Hùng Biện Học Thuật, Khoa Học Công Nghệ & Tư Duy Phản Biện',
          subtitle: 'Sử dụng cấu trúc văn ngôn hiện đại và từ vựng học thuật HSK 6',
          rewardExp: 210,
          rewardGems: 110,
          vocab: [
            { hanzi: '潜移默化', pinyin: 'qián yí mò huà', hanviet: 'Tiềm di mặc hóa', meaning: 'Mưa dầm thấm lâu (Biến đổi ngầm một cách tự nhiên)', example: '环境对人的影响是潜移默化的。' },
            { hanzi: '根深蒂固', pinyin: 'gēn shēn dì gù', hanviet: 'Căn thâm đế cố', meaning: 'Ăn sâu bám rễ (Quan niệm, thói quen khó thay đổi)', example: '这种传统观念已经根深蒂固。' },
            { hanzi: '迫在眉睫', pinyin: 'pò zài méi jié', hanviet: 'Bách tại mi tiệp', meaning: 'Cấp bách ngay trước mắt (Gần ngay lông mày và lông mi)', example: '保护生态环境已经迫在眉睫。' },
            { hanzi: '相辅相成', pinyin: 'xiāng fǔ xiāng chéng', hanviet: 'Tương phụ tương thành', meaning: 'Bổ trợ lẫn nhau cùng phát triển', example: '理论与实践是相辅相成的。' }
          ],
          grammarNote: 'Ở cảnh giới HSK 6, người học cần phân biệt chính xác sắc thái biểu cảm (tích cực / trung tính / tiêu cực) của thành ngữ và liên từ văn viết như 固然 (cố nhiên), 诚然 (thành nhiên), 归根到底 (quy căn đáo để).',
          questions: [
            { q: 'Muốn diễn tả "Lý thuyết và thực hành bổ trợ lẫn nhau cùng tạo nên thành quả", thành ngữ HSK 6 nào chuẩn nhất?', options: ['相辅相成 (Tương phụ tương thành)', '迫在眉睫 (Bách tại mi tiệp)', '根深蒂固 (Căn thâm đế cố)', '半途而废 (Bán đồ nhi phế)'], answer: 0, explain: '相辅相成 nghĩa là hai yếu tố hỗ trợ, bổ sung cho nhau không thể tách rời.' },
            { q: 'Thành ngữ "迫在眉睫" (pò zài méi jié) mô tả tình huống như thế nào?', options: ['Vô cùng khẩn cấp, cấp bách ngay trước mắt', 'Từ từ biến đổi qua nhiều năm', 'Vững chắc không thể lay chuyển', 'Đẹp đẽ lộng lẫy'], answer: 0, explain: '眉 (lông mày) 睫 (lông mi) — việc đã sát ngay trước mắt, cực kỳ cấp bách.' }
          ]
        },
        {
          id: 'hsk6_2',
          realm: 6,
          realmName: 'HSK 6: Thượng Thừa',
          title: 'Bài 14: Đại Boss Cuối — Tổng Duyệt Hán Ngữ Toàn Diện (HSK 6 Tinh Hoa)',
          subtitle: 'Thử thách tổng hợp Từ vựng, Ngữ pháp sửa lỗi câu bệnh (病句) và Biểu đạt',
          rewardExp: 260,
          rewardGems: 150,
          vocab: [
            { hanzi: '举足轻重', pinyin: 'jǔ zú qīng zhòng', hanviet: 'Cử túc khinh trọng', meaning: 'Giữ vị trí then chốt, có tầm ảnh hưởng lớn', example: '他在行业内处于举足轻重的地位。' },
            { hanzi: '精益求精', pinyin: 'jīng yì qiú jīng', hanviet: 'Tinh ích cầu tinh', meaning: 'Đã tốt lại càng cầu toàn, hoàn thiện hơn nữa', example: '工匠精神就是对产品精益求精。' },
            { hanzi: '不可或缺', pinyin: 'bù kě huò quē', hanviet: 'Bất khả hoặc khuyết', meaning: 'Không thể thiếu được', example: '水是生命不可或缺的要素。' },
            { hanzi: '融会贯通', pinyin: 'róng huì guàn tōng', hanviet: 'Dung hội quán thông', meaning: 'Thấu hiểu tường tận, kết nối mọi kiến thức thành một thể', example: '把所学的汉字知识融会贯通。' }
          ],
          grammarNote: 'Bí quyết xử lý bài thi HSK 6 "Tìm câu sai ngữ pháp (病句)": Kiểm tra 4 lỗi kinh điển: (1) Thiếu chủ ngữ do lạm dụng Through/Under (通过...使...), (2) Động từ và Tân ngữ không khớp nhau, (3) Phủ định kép 2-3 lần gây ngược nghĩa, (4) Xếp sai thứ tự nguyên nhân - kết quả.',
          questions: [
            { q: 'Trong bài thi HSK 6, câu "通过这次学习，使我提高了中文水平。" mắc lỗi ngữ pháp (病句) gì?', options: ['Khuyết chủ ngữ do dùng đồng thời cả "通过..." và "使..."', 'Sai vị trí tân ngữ', 'Sai lượng từ', 'Không có lỗi ngữ pháp'], answer: 0, explain: 'Cấu trúc "通过 A, 使 B..." làm câu mất chủ ngữ. Phải bỏ "通过" hoặc bỏ "使".' },
            { q: 'Thành ngữ "精益求精" (Tinh ích cầu tinh) ca ngợi tinh thần gì?', options: ['Đã giỏi/tốt rồi nhưng vẫn không ngừng trau chuốt để hoàn hảo hơn', 'Làm việc qua loa đại khái', 'Tiết kiệm chi phí tối đa', 'Chờ đợi thời cơ may mắn'], answer: 0, explain: '精益求精 thể hiện tinh thần nghệ nhân luôn hướng tới sự hoàn mỹ.' }
          ]
        }
      ];

      // =====================================================
      // 3. AI CONVERSATION SCENARIOS & INTELLIGENT ENGINE
      // =====================================================
      const AI_SCENARIOS = [
        {
          id: 'zero_intro',
          badge: 'Cấp 0 - HSK 1',
          title: '🌱 Làm Quen Vỡ Lòng',
          mission: 'Chào Sư Phụ, giới thiệu tên bạn và nói bạn là người Việt Nam đang học tiếng Trung.',
          greeting: {
            hanzi: '你好！我是小龙师傅。欢迎来到华语奇境！你叫什么名字？你是哪国人？',
            pinyin: 'Nǐ hǎo! Wǒ shì Xiǎolóng shīfu. Huānyíng lái dào Huáyǔ Qíjìng! Nǐ jiào shénme míngzi? Nǐ shì nǎ guó rén?',
            vi: 'Xin chào! Ta là Sư phụ Tiểu Long. Chào mừng đến với Hoa Ngữ Kỳ Cảnh! Bạn tên là gì? Bạn là người nước nào?'
          },
          suggestions: [
            { level: 'Cơ bản (HSK 1)', hanzi: '你好！我叫明明，我是越南人。', pinyin: 'Nǐ hǎo! Wǒ jiào Míngmíng, wǒ shì Yuènán rén.', vi: 'Xin chào! Tôi tên Minh Minh, tôi là người Việt Nam.' },
            { level: 'Tự nhiên (HSK 2)', hanzi: '小龙师傅好！我来自越南，现在开始学中文。', pinyin: 'Xiǎolóng shīfu hǎo! Wǒ láizì Yuènán, xiànzài kāishǐ xué Zhōngwén.', vi: 'Chào Sư phụ Tiểu Long! Tôi đến từ Việt Nam, nay bắt đầu học tiếng Trung.' },
            { level: 'Ấn tượng (HSK 4)', hanzi: '幸会！我是越南人，非常渴望能说一口流利的汉语。', pinyin: 'Xìnghuì! Wǒ shì Yuènán rén, fēicháng kěwàng néng shuō yì kǒu liúlì de Hànyǔ.', vi: 'Hân hạnh! Tôi là người Việt Nam, rất khao khát nói tiếng Trung lưu loát.' }
          ],
          turns: [
            {
              hanzi: '太棒了！你的发音很有潜力！你为什么想学习中文呢？是为了工作、旅游还是看中国电影？',
              pinyin: 'Tài bàng le! Nǐ de fāyīn hěn yǒu qiánlì! Nǐ wèishénme xiǎng xuéxí Zhōngwén ne? Shì wèile gōngzuò, lǚyóu háishì kàn Zhōngguó diànyǐng?',
              vi: 'Tuyệt lắm! Phát âm của bạn rất có tiềm năng! Tại sao bạn muốn học tiếng Trung? Vì công việc, du lịch hay xem phim Trung Quốc?',
              upgradeTip: '💡 Mẹo nâng cấp từ: Thay vì chỉ nói "我想学中文" (Tôi muốn học tiếng Trung), bạn có thể dùng "我对中国文化很感兴趣" (Wǒ duì Zhōngguó wénhuà hěn gǎn xìngqù - Tôi rất hứng thú với văn hóa Trung Hoa).',
              nextSuggestions: [
                { level: 'Cơ bản (HSK 1)', hanzi: '我想去中国旅游，也想找好工作。', pinyin: 'Wǒ xiǎng qù Zhōngguó lǚyóu, yě xiǎng zhǎo hǎo gōngzuò.', vi: 'Tôi muốn đi du lịch Trung Quốc và tìm việc tốt.' },
                { level: 'Tự nhiên (HSK 3)', hanzi: '因为我对中国文化和商业很感兴趣。', pinyin: 'Yīnwèi wǒ duì Zhōngguó wénhuà hé shāngyè hěn gǎn xìngqù.', vi: 'Vì tôi rất quan tâm đến văn hóa và thương mại Trung Quốc.' },
                { level: 'Cao cấp (HSK 5)', hanzi: '掌握汉语不仅能开拓视野，还能促进我的职业发展。', pinyin: 'Zhǎngwò Hànyǔ bùjǐn néng kāituò shìyě, hái néng cùjìn wǒ de zhíyè fāzhǎn.', vi: 'Làm chủ Hán ngữ không chỉ mở rộng tầm nhìn mà còn thúc đẩy sự nghiệp của tôi.' }
              ]
            },
            {
              hanzi: '说得非常好！记住这句成语：“熟能生巧”。只要你每天坚持练习十五分钟，一定能融会贯通！你想现在试试点一杯奶茶还是继续聊爱好？',
              pinyin: 'Shuō de fēicháng hǎo! Jìzhu zhè jù chéngyǔ: "Shú néng shēng qiǎo". Zhǐyào nǐ měitiān jiānchí liànxí shíwǔ fēnzhōng, yídìng néng rónghuì guàntōng! Nǐ xiǎng xiànzài shìshi diǎn yì bēi nǎichá háishì jìxù liáo àihào?',
              vi: 'Nói hay lắm! Hãy nhớ câu thành ngữ "Thục năng sinh xảo" (Trăm hay không bằng tay quen). Chỉ cần mỗi ngày kiên trì 15 phút, ắt sẽ tinh thông! Bạn muốn thử gọi trà sữa hay trò chuyện tiếp về sở thích?',
              upgradeTip: '🏆 Thưởng Giao Tiếp: +25 EXP! Bạn đã vận dụng cấu trúc câu nguyên nhân - mục đích rất mạch lạc.',
              nextSuggestions: [
                { level: 'Cơ bản', hanzi: '我每天都会努力练习中文！', pinyin: 'Wǒ měitiān dōu huì nǔlì liànxí Zhōngwén!', vi: 'Mỗi ngày tôi đều sẽ chăm chỉ luyện tiếng Trung!' },
                { level: 'Tự nhiên', hanzi: '谢谢师傅鼓励，我一定不会半途而废！', pinyin: 'Xièxie shīfu gǔlì, wǒ yídìng bú huì bàntú ér fèi!', vi: 'Cảm ơn Sư phụ khích lệ, tôi nhất định không bỏ cuộc giữa chừng!' },
                { level: 'Hỏi thêm AI', hanzi: '师傅，怎么才能快速记住汉字呢？', pinyin: 'Shīfu, zěnme cáinéng kuàisù jìzhu Hànzì ne?', vi: 'Sư phụ ơi, làm sao để nhớ chữ Hán nhanh ạ?' }
              ]
            }
          ]
        },
        {
          id: 'boba_food',
          badge: 'HSK 1 - HSK 2',
          title: '🧋 Gọi Trà Sữa & Ẩm Thực',
          mission: 'Gọi 1 ly trà sữa trân châu ít đường, ít đá và hỏi giá tiền thanh toán.',
          greeting: {
            hanzi: '欢迎光临“奇境茶坊”！请问您想喝点什么？我们招牌是珍珠奶茶和茉莉绿茶。',
            pinyin: 'Huānyíng guānglín "Qíjìng Cháfáng"! Qǐngwèn nín xiǎng hē diǎn shénme? Wǒmen zhāopái shì zhēnzhū nǎichá hé mòlì lǜchá.',
            vi: 'Chào mừng quý khách đến Tiệm Trà Kỳ Cảnh! Xin hỏi bạn muốn uống gì? Món tủ của quán là Trà sữa trân châu và Trà xanh hoa nhài.'
          },
          suggestions: [
            { level: 'Cơ bản (HSK 1)', hanzi: '我要一杯珍珠奶茶，多少钱？', pinyin: 'Wǒ yào yì bēi zhēnzhū nǎichá, duōshao qián?', vi: 'Cho tôi 1 ly trà sữa trân châu, bao nhiêu tiền?' },
            { level: 'Chuẩn bản xứ (HSK 2)', hanzi: '请给我来一杯大杯珍珠奶茶，少冰、半糖。', pinyin: 'Qǐng gěi wǒ lái yì bēi dàbēi zhēnzhū nǎichá, shǎo bīng, bàn táng.', vi: 'Cho tôi 1 ly trà sữa trân châu size lớn, ít đá, 50% đường.' },
            { level: 'Sành điệu (HSK 3)', hanzi: '我想点一杯招牌珍珠奶茶，三分糖去冰，打包带走。', pinyin: 'Wǒ xiǎng diǎn yì bēi zhāopái zhēnzhū nǎichá, sān fēn táng qù bīng, dǎbāo dàizǒu.', vi: 'Tôi muốn gọi 1 ly trà sữa trân châu đặc biệt, 30% đường không đá, mang đi.' }
          ],
          turns: [
            {
              hanzi: '好的！大杯珍珠奶茶，少冰半糖。一共十八块钱。请问您是扫微信、支付宝还是付现金？',
              pinyin: 'Hǎo de! Dàbēi zhēnzhū nǎichá, shǎo bīng bàn táng. Yígòng shíbā kuài qián. Qǐngwèn nín shì sǎo Wēixìn, Zhīfùbǎo háishì fù xiànjīn?',
              vi: 'Vâng ạ! Trà sữa trân châu ly lớn, ít đá nửa đường. Tổng cộng 18 tệ. Xin hỏi bạn quét WeChat, Alipay hay trả tiền mặt?',
              upgradeTip: '💡 Từ vựng thực tế Trung Quốc: 少冰 (shǎo bīng - ít đá), 去冰 (qù bīng - không đá), 半糖 (bàn táng - 50% đường), 打包带走 (dǎbāo dàizǒu - gói mang về).',
              nextSuggestions: [
                { level: 'Cơ bản', hanzi: '我付现金，给你二十块。', pinyin: 'Wǒ fù xiànjīn, gěi nǐ èrshí kuài.', vi: 'Tôi trả tiền mặt, đưa bạn 20 tệ.' },
                { level: 'Hiện đại', hanzi: '我扫微信支付吧，扫好了！', pinyin: 'Wǒ sǎo Wēixìn zhīfù ba, sǎo hǎo le!', vi: 'Tôi quét WeChat Pay nhé, quét xong rồi!' },
                { level: 'Mở rộng', hanzi: '可以用支付宝吗？顺便给我一根吸管，谢谢！', pinyin: 'Kěyǐ yòng Zhīfùbǎo ma? Shùnbiàn gěi wǒ yì gēn xīguǎn, xièxie!', vi: 'Dùng Alipay được không? Tiện thể cho tôi 1 cái ống hút, cảm ơn!' }
              ]
            }
          ]
        },
        {
          id: 'market_bargain',
          badge: 'HSK 2 - HSK 3',
          title: '🛍️ Mặc Cả Chợ Đêm Thượng Hải',
          mission: 'Chê món hàng hơi đắt và thương lượng giảm giá từ 200 tệ xuống 120 tệ.',
          greeting: {
            hanzi: '老板看看呀！正宗的丝绸围巾，质量特别好，送人很有面子！这一条只要两百块！',
            pinyin: 'Lǎobǎn kànkan ya! Zhèngzōng de sīchóu wéijīn, zhìliàng tèbié hǎo, sòng rén hěn yǒu miànzi! Zhè yì tiáo zhǐ yào liǎngbǎi kuài!',
            vi: 'Ông/bà chủ ghé xem nào! Khăn lụa tơ tằm chính hiệu, chất lượng cực tốt, tặng quà rất sang! Chiếc này chỉ 200 tệ thôi!'
          },
          suggestions: [
            { level: 'Cơ bản (HSK 2)', hanzi: '两百块太贵了！便宜一点吧，一百二十块可以吗？', pinyin: 'Liǎngbǎi kuài tài guì le! Piányi yìdiǎn ba, yìbǎi èrshí kuài kěyǐ ma?', vi: '200 tệ đắt quá! Rẻ chút đi, 120 tệ được không?' },
            { level: 'Cao tay (HSK 3)', hanzi: '老板，我买两条，你给我算便宜点，一条一百二怎么样？', pinyin: 'Lǎobǎn, wǒ mǎi liǎng tiáo, nǐ gěi wǒ suàn piányi diǎn, yì tiáo yìbǎi èr zěnmeyàng?', vi: 'Ông chủ ơi, tôi mua 2 chiếc, tính rẻ cho tôi đi, 120 tệ một chiếc thế nào?' },
            { level: 'Chiến thuật (HSK 4)', hanzi: '款式确实不错，但价格超出预算了。如果一百二能卖，我立刻拿走！', pinyin: 'Kuǎnshì quèshí búcuò, dàn jiàgé chāochū yùsuàn le. Rúguǒ yìbǎi èr néng mài, wǒ lìkè názǒu!', vi: 'Kiểu dáng quả thực đẹp, nhưng giá vượt ngân sách rồi. Nếu 120 tệ bán được tôi lấy ngay!' }
          ],
          turns: [
            {
              hanzi: '哎呀，你太会砍价了！看你是诚心想买，交个朋友，一百二十块拿走吧！给你包起来！',
              pinyin: 'Āiyā, nǐ tài huì kǎnjià le! Kàn nǐ shì chéngxīn xiǎng mǎi, jiāo gè péngyou, yìbǎi èrshí kuài názǒu ba! Gěi nǐ bāo qǐlái!',
              vi: 'Ái chà, bạn khéo trả giá quá! Thấy bạn thật lòng muốn mua, kết bạn luôn, 120 tệ lấy đi nhé! Để tôi gói lại cho bạn!',
              upgradeTip: '💡 Từ vựng mặc cả đắt giá: 砍价 (kǎnjià - trả giá/mặc cả), 打折 (dǎzhé - giảm giá chiết khấu), 诚心 (chéngxīn - thành tâm).',
              nextSuggestions: [
                { level: 'Cơ bản', hanzi: '太好了，谢谢老板！', pinyin: 'Tài hǎo le, xièxie lǎobǎn!', vi: 'Tuyệt quá, cảm ơn ông chủ!' },
                { level: 'Tự nhiên', hanzi: '老板真爽快！下次我还来光顾。', pinyin: 'Lǎobǎn zhēn shuǎngkuai! Xiàcì wǒ hái lái guānggù.', vi: 'Ông chủ sởi lởi quá! Lần sau tôi lại ghé ủng hộ.' },
                { level: 'Nâng cao', hanzi: '祝老板生意兴隆，财源广进！', pinyin: 'Zhù lǎobǎn shēngyì xīnglóng, cáiyuán guǎngjìn!', vi: 'Chúc ông chủ buôn may bán đắt, tiền vào như nước!' }
              ]
            }
          ]
        },
        {
          id: 'job_interview',
          badge: 'HSK 4 - HSK 5',
          title: '💼 Phỏng Vấn Tập Đoàn Đa Quốc Gia',
          mission: 'Giới thiệu kinh nghiệm làm việc, điểm mạnh bản thân và lý do ứng tuyển.',
          greeting: {
            hanzi: '你好，欢迎参加我们跨国公司的面试。请先用中文简单介绍一下你的工作经验和优势。',
            pinyin: 'Nǐ hǎo, huānyíng cānjiā wǒmen kuàguó gōngsī de miànshì. Qǐng xiān yòng Zhōngwén jiǎndān jièshào yíxià nǐ de gōngzuò jīngyàn hé yōushì.',
            vi: 'Xin chào, chào mừng bạn tham gia buổi phỏng vấn của tập đoàn đa quốc gia chúng tôi. Hãy giới thiệu ngắn gọn bằng tiếng Trung về kinh nghiệm làm việc và thế mạnh của bạn.'
          },
          suggestions: [
            { level: 'Chuẩn HSK 4', hanzi: '面试官您好！我有三年的市场负责经验，工作非常认真负责。', pinyin: 'Miànshìguān nín hǎo! Wǒ yǒu sān nián de shìchǎng fùzé jīngyàn, gōngzuò fēicháng rènzhēn fùzé.', vi: 'Chào nhà tuyển dụng! Tôi có 3 năm kinh nghiệm phụ trách thị trường, làm việc rất nghiêm túc trách nhiệm.' },
            { level: 'Chuyên nghiệp HSK 5', hanzi: '您好！我不仅精通越中双语，而且具备丰富的项目管理经验，抗压能力很强。', pinyin: 'Nín hǎo! Wǒ bùjǐn jīngtōng Yuè-Zhōng shuāngyǔ, érqiě jùbèi fēngfù de xiàngmù guǎnlǐ jīngyàn, kàngyā nénglì hěn qiáng.', vi: 'Xin chào! Tôi không chỉ thông thạo song ngữ Việt-Trung mà còn có kinh nghiệm quản lý dự án phong phú, chịu áp lực tốt.' },
            { level: 'Xuất sắc HSK 6', hanzi: '荣幸之至！我擅长跨文化沟通与数据分析，定能与团队相辅相成，创造卓越价值。', pinyin: 'Róngxìng zhī zhì! Wǒ shàncháng kuà wénhuà gōutōng yǔ shùjù fēnxī, dìng néng yǔ tuánduì xiāngfǔ xiāngchéng, chuàngzào zhuóyuè jiàzhí.', vi: 'Vinh hạnh lớn lao! Tôi giỏi giao tiếp đa văn hóa và phân tích dữ liệu, chắc chắn sẽ bổ trợ cùng đội ngũ tạo ra giá trị vượt trội.' }
          ],
          turns: [
            {
              hanzi: '你的表达非常流利、得体！如果遇到紧迫的项目截止日期，你会采取什么措施来保证效率？',
              pinyin: 'Nǐ de biǎodá fēicháng liúlì, détǐ! Rúguǒ yùdào jǐnpò de xiàngmù jiézhǐ rìqī, nǐ huì cǎiqǔ shénme cuòshī lái bǎozhèng xiàolǜ?',
              vi: 'Cách diễn đạt của bạn rất lưu loát và đúng mực! Nếu gặp hạn chót dự án gấp gáp, bạn sẽ áp dụng biện pháp gì để đảm bảo hiệu suất?',
              upgradeTip: '💡 Cụm từ ghi điểm tuyệt đối khi phỏng vấn: 抗压能力 (kàngyā nénglì - khả năng chịu áp lực), 团队合作 (tuánduì hézuò - làm việc nhóm), 精益求精 (tinh ích cầu tinh).',
              nextSuggestions: [
                { level: 'HSK 4', hanzi: '我会先安排好时间，然后跟同事一起努力完成。', pinyin: 'Wǒ huì xiān ānpái hǎo shíjiān, ránhòu gēn tóngshì yìqǐ nǔlì wánchéng.', vi: 'Tôi sẽ sắp xếp thời gian trước rồi cùng đồng nghiệp cố gắng hoàn thành.' },
                { level: 'HSK 5', hanzi: '我会分清轻重缓急，制定详细计划，并与团队保持高效沟通。', pinyin: 'Wǒ huì fēnqīng qīngzhòng huǎnjí, zhìdìng xiángxì jìhuà, bìng yǔ tuánduì bǎochí gāoxiào gōutōng.', vi: 'Tôi sẽ phân định việc nào quan trọng/khẩn cấp, lập kế hoạch chi tiết và giữ giao tiếp hiệu quả với nhóm.' },
                { level: 'HSK 6', hanzi: '面对迫在眉睫的任务，我会统筹兼顾，优化流程，确保精益求精地交付成果。', pinyin: 'Miànduì pòzàiméijié de rènwu, wǒ huì tǒngchóu jiāngù, yōuhuà liúchéng, quèbǎo jīngyìqiújīng de jiāofù chéngguǒ.', vi: 'Trước nhiệm vụ cấp bách, tôi sẽ điều phối toàn diện, tối ưu quy trình để bàn giao kết quả hoàn hảo nhất.' }
              ]
            }
          ]
        },
        {
          id: 'free_debate',
          badge: 'HSK 5 - HSK 6',
          title: '🐉 Tranh Luận Học Thuật & Đàm Đạo Tự Do',
          mission: 'Thảo luận về vai trò của Trí Tuệ Nhân Tạo (AI) đối với việc học ngoại ngữ và tương lai.',
          greeting: {
            hanzi: '如今人工智能（AI）发展一日千里。你认为AI会完全取代人类翻译和语言学习吗？请谈谈你的见解。',
            pinyin: 'Rújīn réngōng zhìnéng (AI) fāzhǎn yírì qiānlǐ. Nǐ rènwéi AI huì wánquán qǔdài rénlèi fānyì hé yǔyán xuéxí ma? Qǐng tántan nǐ de jiànjiě.',
            vi: 'Ngày nay Trí tuệ nhân tạo (AI) phát triển một ngày ngàn dặm. Bạn cho rằng AI sẽ thay thế hoàn toàn phiên dịch viên và việc học ngôn ngữ của con người chứ? Hãy chia sẻ góc nhìn của bạn.'
          },
          suggestions: [
            { level: 'Trung cấp (HSK 4)', hanzi: '我觉得AI很有用，但它不能完全代替人与人之间的感情交流。', pinyin: 'Wǒ juéde AI hěn yǒuyòng, dàn tā bùnéng wánquán dàitì rén yǔ rén zhījiān de gǎnqíng jiāoliú.', vi: 'Tôi thấy AI rất hữu ích, nhưng nó không thể thay thế hoàn toàn giao tiếp tình cảm giữa người với người.' },
            { level: 'Cao cấp (HSK 5)', hanzi: '我认为AI是促进学习的工具，但跨文化理解依然需要人类亲自掌握语言。', pinyin: 'Wǒ rènwéi AI shì cùjìn xuéxí de gōngjù, dàn kuà wénhuà lǐjiě yīrán xūyào rénlèi qīnzì zhǎngwò yǔyán.', vi: 'Tôi cho rằng AI là công cụ thúc đẩy việc học, nhưng thấu hiểu đa văn hóa vẫn cần con người tự làm chủ ngôn ngữ.' },
            { level: 'Thượng thừa (HSK 6)', hanzi: '诚然AI效率惊人，但人类情感的微妙与文化底蕴不可或缺，二者应当相辅相成。', pinyin: 'Chéngrán AI xiàolǜ jīngrén, dàn rénlèi qínggǎn de wēimiào yǔ wénhuà dǐyùn bùkě huòquē, èrzhě yīngdāng xiāngfǔ xiāngchéng.', vi: 'Quả thực AI có hiệu suất kinh ngạc, nhưng sự tinh tế cảm xúc và chiều sâu văn hóa của con người là không thể thiếu; cả hai nên bổ trợ lẫn nhau.' }
          ],
          turns: [
            {
              hanzi: '见解独到，令人佩服！你能运用“不可或缺”与“相辅相成”来阐述论点，说明你的汉语思维已经达到了很高的境界！',
              pinyin: 'Jiànjiě dúdào, lìng rén pèifú! Nǐ néng yùnyòng "bùkě huòquē" yǔ "xiāngfǔ xiāngchéng" lái chǎnshù lùndiǎn, shuōmíng nǐ de Hànyǔ sīwéi yǐjīng dádào le hěn gāo de jìngjiè!',
              vi: 'Góc nhìn sắc sảo, thật đáng khâm phục! Bạn vận dụng được "bất khả hoặc khuyết" và "tương phụ tương thành" để lập luận, chứng tỏ tư duy Hán ngữ của bạn đã đạt cảnh giới rất cao!',
              upgradeTip: '👑 Cảnh giới HSK 6: Khi lập luận phản biện, dùng "诚然/固然……然而……" (Quả thực là... tuy nhiên...) giúp câu văn có sức nặng học thuật vượt trội.',
              nextSuggestions: [
                { level: 'HSK 5', hanzi: '谢谢师傅指点，我会继续深入研究汉语文化。', pinyin: 'Xièxie shīfu zhǐdiǎn, wǒ huì jìxù shēnrù yánjiū Hànyǔ wénhuà.', vi: 'Cảm ơn Sư phụ chỉ điểm, tôi sẽ tiếp tục nghiên cứu sâu văn hóa Hán ngữ.' },
                { level: 'HSK 6', hanzi: '学无止境，我定当精益求精，做到融会贯通！', pinyin: 'Xué wú zhǐjìng, wǒ dìng dāng jīngyìqiújīng, zuòdào rónghuì guàntōng!', vi: 'Học tập là vô tận, tôi nhất định sẽ tinh ích cầu tinh để dung hội quán thông!' },
                { level: 'Hỏi thêm', hanzi: '请问师傅还有哪些推荐的高级成语？', pinyin: 'Qǐngwèn shīfu hái yǒu nǎxiē tuījiàn de gāojí chéngyǔ?', vi: 'Xin hỏi Sư phụ còn thành ngữ cao cấp nào khuyên dùng nữa không?' }
              ]
            }
          ]
        }
      ];

      // =====================================================
      // 4. DOJO DATA: HANZI WRITING, PINYIN, TONES & RADICALS
      // =====================================================
      const DOJO_CHARACTERS = [
        { char: '好', pinyin: 'hǎo', hanviet: 'Hảo', meaning: 'Tốt, đẹp, khỏe', hsk: 'HSK 1', strokes: 6, mnemonic: 'Ghép bộ Nữ 女 (phụ nữ) + bộ Tử 子 (con cái): Có vợ có con là điều TỐT ĐẸP!', rule: 'Trái trước phải sau (女 trước, 子 sau).' },
        { char: '人', pinyin: 'rén', hanviet: 'Nhân', meaning: 'Con người', hsk: 'Cấp 0', strokes: 2, mnemonic: 'Hình ảnh hai chân con người đang sải bước tiến về phía trước.', rule: 'Phẩy (丿) trước, Mác (㇏) sau.' },
        { char: '中', pinyin: 'zhōng', hanviet: 'Trung', meaning: 'Ở giữa, Trung Quốc', hsk: 'HSK 1', strokes: 4, mnemonic: 'Một mũi tên bắn xuyên trúng chính giữa hồng tâm hình vuông (口).', rule: 'Viết khung 口 trước, nét Sổ (丨) xuyên qua chính giữa cuối cùng.' },
        { char: '国', pinyin: 'guó', hanviet: 'Quốc', meaning: 'Đất nước, quốc gia', hsk: 'HSK 1', strokes: 8, mnemonic: 'Bên ngoài là biên giới lãnh thổ (囗), bên trong là ấn Ngọc tỷ của nhà vua (玉).', rule: 'Ngoài trước, trong (玉) sau, đóng khung đáy cuối cùng.' },
        { char: '爱', pinyin: 'ài', hanviet: 'Ái', meaning: 'Yêu thương', hsk: 'HSK 1', strokes: 10, mnemonic: 'Dưới mái nhà (冖) có tình bạn (友) nâng niu bằng cả đôi tay (爫) là Tình Yêu.', rule: 'Từ trên xuống dưới.' },
        { char: '学', pinyin: 'xué', hanviet: 'Học', meaning: 'Học tập', hsk: 'HSK 1', strokes: 8, mnemonic: 'Đứa trẻ (子) ngồi dưới mái trường (冖) được truyền dạy tri thức.', rule: 'Từ trên xuống dưới, nét Ngang của chữ 子 viết cuối cùng.' },
        { char: '水', pinyin: 'shuǐ', hanviet: 'Thủy', meaning: 'Dòng nước', hsk: 'HSK 1', strokes: 4, mnemonic: 'Dòng suối chảy ở giữa và những giọt nước bắn ra hai bên.', rule: 'Giữa trước (nét Sổ móc), hai bên trái phải sau.' },
        { char: '心', pinyin: 'xīn', hanviet: 'Tâm', meaning: 'Trái tim, tấm lòng', hsk: 'HSK 2', strokes: 4, mnemonic: 'Hình dáng quả tim với các ngăn tim và mạch máu.', rule: 'Chấm trái, Nằm móc, Chấm giữa, Chấm phải.' },
        { char: '道', pinyin: 'dào', hanviet: 'Đạo', meaning: 'Con đường, đạo lý', hsk: 'HSK 2', strokes: 12, mnemonic: 'Cái đầu suy nghĩ (首) bước đi trên con đường lớn (辶 - bộ Sước).', rule: 'Viết phần bên trong (首) trước, bộ Sước (辶) bao đáy viết sau cùng.' },
        { char: '龙', pinyin: 'lóng', hanviet: 'Long', meaning: 'Con rồng', hsk: 'HSK 3', strokes: 5, mnemonic: 'Biểu tượng Rồng phương Đông bay lượn trên mây.', rule: 'Ngang, Phẩy, Sổ cong móc, Phẩy, Chấm.' },
        { char: '赢', pinyin: 'yíng', hanviet: 'Doanh', meaning: 'Chiến thắng', hsk: 'HSK 4', strokes: 17, mnemonic: 'Gồm 5 bộ phận của người chiến thắng: 亡 (ý thức nguy cơ), 口 (giao tiếp), 月 (thời gian), 贝 (tiền tài), 凡 (bình tâm).', rule: 'Từ trên xuống dưới, dưới cùng chia trái - giữa - phải.' },
        { char: '德', pinyin: 'dé', hanviet: 'Đức', meaning: 'Đạo đức, phẩm đức', hsk: 'HSK 5', strokes: 15, mnemonic: 'Bước đi (彳) với mười (十) con mắt (目) nhìn thẳng một lòng (一 + 心) là người có Đạo Đức.', rule: 'Bộ Xích (彳) bên trái trước, phần bên phải từ trên xuống dưới.' }
      ];

      const TONES_DATA = [
        { tone: 1, name: 'Thanh 1 (Âm Bình)', mark: 'mā (妈)', pitch: '55 ➔ Cao và phẳng đều', desc: 'Giữ giọng cao, ngân ngang bằng phẳng như bác sĩ bảo há miệng "Aaaa".', sample: '妈', meaning: 'Mẹ (Mẫu thân)', svgPath: 'M 10 25 L 110 25' },
        { tone: 2, name: 'Thanh 2 (Dương Bình)', mark: 'má (麻)', pitch: '35 ➔ Vút lên cao', desc: 'Giống dấu sắc kết hợp giọng hỏi "Hả?" từ trung bình vút lên cao.', sample: '麻', meaning: 'Cây gai / Tê', svgPath: 'M 10 65 L 110 20' },
        { tone: 3, name: 'Thanh 3 (Thượng Thanh)', mark: 'mǎ (马)', pitch: '214 ➔ Trầm xuống rồi vòng lên', desc: 'Hạ giọng xuống thấp rồi uốn cong lên nhẹ nhàng.', sample: '马', meaning: 'Con ngựa (Mã)', svgPath: 'M 10 45 Q 50 85 110 25' },
        { tone: 4, name: 'Thanh 4 (Khứ Thanh)', mark: 'mà (骂)', pitch: '51 ➔ Dứt khoát từ cao xuống thấp', desc: 'Đọc mạnh, dứt khoát từ trên đỉnh rơi thẳng xuống.', sample: '骂', meaning: 'Mắng (Mạ)', svgPath: 'M 10 20 L 110 80' }
      ];

      const PINYIN_INITIALS = [
        { p: 'b', speak: '波', tip: 'Đọc giống "p" tiếng Việt (không bật hơi): bō (Sóng)' },
        { p: 'p', speak: '坡', tip: 'Đọc "p" nhưng BẬT HƠI mạnh ra ngoài: pō (Sườn dốc)' },
        { p: 'm', speak: '摸', tip: 'Đọc giống "m" tiếng Việt: mō (Chạm)' },
        { p: 'f', speak: '佛', tip: 'Đọc giống "ph" tiếng Việt: fó (Phật)' },
        { p: 'd', speak: '得', tip: 'Đọc giống "t" tiếng Việt (không bật hơi): dé' },
        { p: 't', speak: '特', tip: 'Đọc giống "th" tiếng Việt (BẬT HƠI mạnh): tè' },
        { p: 'n', speak: '呢', tip: 'Đọc giống "n" tiếng Việt: ne' },
        { p: 'l', speak: '勒', tip: 'Đọc giống "l" tiếng Việt: lè' },
        { p: 'g', speak: '哥', tip: 'Đọc giống "c/k" tiếng Việt: gē (Anh trai)' },
        { p: 'k', speak: '科', tip: 'Đọc giống "kh" nhưng bật hơi từ cuống họng: kē (Khoa)' },
        { p: 'h', speak: '喝', tip: 'Đọc giữa "h" và "kh" nhẹ: hē (Uống)' },
        { p: 'j', speak: '鸡', tip: 'Mặt lưỡi chạm vòm miệng, giống "ch" nhẹ: jī (Con gà)' },
        { p: 'q', speak: '七', tip: 'Giống "j" nhưng BẬT HƠI mạnh: qī (Số 7)' },
        { p: 'x', speak: '西', tip: 'Giống "x" tiếng Việt, khóe miệng hơi mỉm cười: xī (Phía Tây)' },
        { p: 'zh', speak: '知', tip: 'UỐN CONG ĐẦU LƯỠI lên vòm họng, không bật hơi: zhī (Biết)' },
        { p: 'ch', speak: '吃', tip: 'UỐN CONG LƯỠI và BẬT HƠI mạnh: chī (Ăn)' },
        { p: 'sh', speak: '师', tip: 'UỐN CONG LƯỠI giống "s" nặng tiếng Việt: shī (Thầy)' },
        { p: 'r', speak: '日', tip: 'Uốn cong lưỡi rung nhẹ: rì (Mặt trời)' },
        { p: 'z', speak: '资', tip: 'Đầu lưỡi chạm mặt sau răng cửa trên, không bật hơi: zī' },
        { p: 'c', speak: '次', tip: 'Giống "z" nhưng BẬT HƠI mạnh: cì (Lần)' },
        { p: 's', speak: '思', tip: 'Đầu lưỡi thẳng, giống "x" nhẹ: sī (Suy nghĩ)' }
      ];

      const PINYIN_FINALS = [
        { p: 'a', speak: '啊' }, { p: 'o', speak: '哦' }, { p: 'e', speak: '鹅' },
        { p: 'i', speak: '衣' }, { p: 'u', speak: '乌' }, { p: 'ü', speak: '鱼' },
        { p: 'ai', speak: '爱' }, { p: 'ei', speak: '杯' }, { p: 'ao', speak: '好' },
        { p: 'ou', speak: '走' }, { p: 'an', speak: '安' }, { p: 'en', speak: '恩' },
        { p: 'ang', speak: '帮' }, { p: 'eng', speak: '朋' }, { p: 'ong', speak: '中' },
        { p: 'ia', speak: '家' }, { p: 'ie', speak: '谢' }, { p: 'iao', speak: '叫' },
        { p: 'iu', speak: '六' }, { p: 'ian', speak: '天' }, { p: 'iang', speak: '想' },
        { p: 'ua', speak: '花' }, { p: 'uo', speak: '国' }, { p: 'uan', speak: '欢' }
      ];

      const CORE_RADICALS = [
        { r: '亻', name: 'Nhân đứng', mean: 'Con người (你, 他, 们)', sample: '你' },
        { r: '氵', name: 'Chấm thủy', mean: 'Nước, chất lỏng (河, 海, 洗)', sample: '海' },
        { r: '口', name: 'Khẩu', mean: 'Miệng, ăn, nói (吃, 喝, 叫)', sample: '吃' },
        { r: '女', name: 'Nữ', mean: 'Phụ nữ (妈, 姐, 好)', sample: '妈' },
        { r: '扌', name: 'Tài gẩy', mean: 'Động tác tay (打, 找, 拿)', sample: '找' },
        { r: '忄', name: 'Tâm đứng', mean: 'Tâm trạng, cảm xúc (忙, 快, 怕)', sample: '忙' },
        { r: '讠', name: 'Ngôn', mean: 'Lời nói, ngôn ngữ (请, 谢, 说)', sample: '说' },
        { r: '辶', name: 'Sước', mean: 'Bước đi, đường xá (远, 近, 送)', sample: '远' },
        { r: '艹', name: 'Thảo đầu', mean: 'Cỏ cây, hoa lá (茶, 花, 草)', sample: '茶' },
        { r: '木', name: 'Mộc', mean: 'Gỗ, cây cối (树, 林, 桌)', sample: '树' },
        { r: '钅', name: 'Kim', mean: 'Kim loại, tiền bạc (钱, 铁, 银)', sample: '钱' },
        { r: '饣', name: 'Thực', mean: 'Thức ăn, ẩm thực (饭, 饿, 馆)', sample: '饭' }
      ];

      // =====================================================
      // 5. GRADED STORIES, GRAMMAR CAPSULES & EXTERNAL RESOURCES
      // =====================================================
      const GRADED_STORIES = [
        {
          title: 'HSK 1: Quán Trà Sữa Đầu Ngõ (巷子里的奶茶店)',
          viTranslation: 'Buổi chiều hôm nay trời rất nóng. Tôi và bạn thân cùng đi tới quán trà sữa nhỏ ở đầu ngõ. Cô chủ quán mỉm cười hỏi chúng tôi muốn uống gì. Tôi gọi một ly trà sữa trân châu ít đá nửa đường, còn bạn tôi chọn một ly cà phê đá.',
          tokens: [
            { hz: '今天', py: 'jīntiān', vi: 'Hôm nay' },
            { hz: '下午', py: 'xiàwǔ', vi: 'buổi chiều' },
            { hz: '天气', py: 'tiānqì', vi: 'thời tiết' },
            { hz: '很', py: 'hěn', vi: 'rất' },
            { hz: '热', py: 'rè', vi: 'nóng' },
            { hz: '。', py: '', vi: '' },
            { hz: '我', py: 'wǒ', vi: 'Tôi' },
            { hz: '和', py: 'hé', vi: 'và' },
            { hz: '好朋友', py: 'hǎo péngyou', vi: 'bạn thân' },
            { hz: '一起', py: 'yīqǐ', vi: 'cùng nhau' },
            { hz: '去', py: 'qù', vi: 'đi đến' },
            { hz: '奶茶店', py: 'nǎichádiàn', vi: 'quán trà sữa' },
            { hz: '。', py: '', vi: '' },
            { hz: '老板', py: 'lǎobǎn', vi: 'Chủ quán' },
            { hz: '微笑', py: 'wēixiào', vi: 'mỉm cười' },
            { hz: '问', py: 'wèn', vi: 'hỏi' },
            { hz: '我们', py: 'wǒmen', vi: 'chúng tôi' },
            { hz: '想', py: 'xiǎng', vi: 'muốn' },
            { hz: '喝', py: 'hē', vi: 'uống' },
            { hz: '什么', py: 'shénme', vi: 'cái gì' },
            { hz: '。', py: '', vi: '' },
            { hz: '我', py: 'wǒ', vi: 'Tôi' },
            { hz: '点', py: 'diǎn', vi: 'gọi món' },
            { hz: '了', py: 'le', vi: 'đã' },
            { hz: '一杯', py: 'yī bēi', vi: 'một ly' },
            { hz: '少冰', py: 'shǎo bīng', vi: 'ít đá' },
            { hz: '珍珠奶茶', py: 'zhēnzhū nǎichá', vi: 'trà sữa trân châu' },
            { hz: '。', py: '', vi: '' }
          ]
        },
        {
          title: 'HSK 2: Mặc Cả Ở Chợ Đêm Hàng Châu (杭州夜市买衣服)',
          viTranslation: 'Tối cuối tuần, chợ đêm Hàng Châu vô cùng náo nhiệt. Tôi nhìn thấy một chiếc áo khoác màu trắng rất đẹp liền hỏi giá. Ông chủ nói 200 tệ, tôi cười bảo đắt quá, bớt một chút đi. Cuối cùng tôi mua được với giá 130 tệ bằng WeChat Pay.',
          tokens: [
            { hz: '周末', py: 'zhōumò', vi: 'Cuối tuần' },
            { hz: '晚上', py: 'wǎnshang', vi: 'buổi tối' },
            { hz: '，', py: '', vi: '' },
            { hz: '杭州', py: 'Hángzhōu', vi: 'Hàng Châu' },
            { hz: '夜市', py: 'yèshì', vi: 'chợ đêm' },
            { hz: '非常', py: 'fēicháng', vi: 'vô cùng' },
            { hz: '热闹', py: 'rènao', vi: 'náo nhiệt' },
            { hz: '。', py: '', vi: '' },
            { hz: '我', py: 'wǒ', vi: 'Tôi' },
            { hz: '看见', py: 'kànjiàn', vi: 'nhìn thấy' },
            { hz: '一件', py: 'yī jiàn', vi: 'một chiếc' },
            { hz: '白色', py: 'báisè', vi: 'màu trắng' },
            { hz: '外套', py: 'wàitào', vi: 'áo khoác' },
            { hz: '很', py: 'hěn', vi: 'rất' },
            { hz: '漂亮', py: 'piàoliang', vi: 'đẹp' },
            { hz: '。', py: '', vi: '' },
            { hz: '我', py: 'wǒ', vi: 'Tôi' },
            { hz: '说', py: 'shuō', vi: 'nói' },
            { hz: '太贵了', py: 'tài guì le', vi: 'đắt quá' },
            { hz: '，', py: '', vi: '' },
            { hz: '便宜一点', py: 'piányi yīdiǎn', vi: 'rẻ hơn một chút đi' },
            { hz: '。', py: '', vi: '' },
            { hz: '最后', py: 'zuìhòu', vi: 'Cuối cùng' },
            { hz: '我', py: 'wǒ', vi: 'tôi' },
            { hz: '用', py: 'yòng', vi: 'dùng' },
            { hz: '微信支付', py: 'Wēixìn zhīfù', vi: 'WeChat Pay' },
            { hz: '买到', py: 'mǎidào', vi: 'mua được' },
            { hz: '了', py: 'le', vi: 'rồi' },
            { hz: '。', py: '', vi: '' }
          ]
        },
        {
          title: 'HSK 3: Khám Bệnh & Mua Thuốc Tại Bắc Kinh (在北京看病买药)',
          viTranslation: 'Hôm qua thời tiết Bắc Kinh đột nhiên trở lạnh nên tôi bị cảm cúm và hơi sốt. Sáng nay bạn cùng phòng đưa tôi đến bệnh viện kiểm tra. Bác sĩ dặn tôi uống thuốc đúng giờ, uống nhiều nước ấm và nghỉ ngơi hai ngày là sẽ khỏi.',
          tokens: [
            { hz: '昨天', py: 'zuótiān', vi: 'Hôm qua' },
            { hz: '北京', py: 'Běijīng', vi: 'Bắc Kinh' },
            { hz: '突然', py: 'tūrán', vi: 'đột nhiên' },
            { hz: '降温', py: 'jiàngwēn', vi: 'giảm nhiệt độ, trở lạnh' },
            { hz: '，', py: '', vi: '' },
            { hz: '我', py: 'wǒ', vi: 'tôi' },
            { hz: '感冒', py: 'gǎnmào', vi: 'bị cảm cúm' },
            { hz: '发烧', py: 'fāshāo', vi: 'bị sốt' },
            { hz: '了', py: 'le', vi: 'rồi' },
            { hz: '。', py: '', vi: '' },
            { hz: '医生', py: 'yīshēng', vi: 'Bác sĩ' },
            { hz: '仔细', py: 'zǐxì', vi: 'cẩn thận, kỹ lưỡng' },
            { hz: '检查', py: 'jiǎnchá', vi: 'kiểm tra, khám' },
            { hz: '以后', py: 'yǐhòu', vi: 'sau khi' },
            { hz: '，', py: '', vi: '' },
            { hz: '提醒', py: 'tíxǐng', vi: 'nhắc nhở' },
            { hz: '我', py: 'wǒ', vi: 'tôi' },
            { hz: '按时', py: 'ànshí', vi: 'đúng giờ' },
            { hz: '吃药', py: 'chīyào', vi: 'uống thuốc' },
            { hz: '、', py: '', vi: '' },
            { hz: '多', py: 'duō', vi: 'nhiều' },
            { hz: '喝', py: 'hē', vi: 'uống' },
            { hz: '温水', py: 'wēnshuǐ', vi: 'nước ấm' },
            { hz: '和', py: 'hé', vi: 'và' },
            { hz: '休息', py: 'xiūxi', vi: 'nghỉ ngơi' },
            { hz: '。', py: '', vi: '' }
          ]
        },
        {
          title: 'HSK 4: Bí Quyết Thành Công Của Người Trẻ (年轻人的成功秘诀)',
          viTranslation: 'Nhiều người trẻ thường hỏi làm thế nào để nhanh chóng đạt được thành công. Thực ra, trên thế giới không có con đường tắt nào dễ dàng cả. Chỉ khi bạn kiên trì tích lũy kinh nghiệm mỗi ngày và không bỏ cuộc giữa chừng, cơ hội mới mỉm cười với bạn.',
          tokens: [
            { hz: '许多', py: 'xǔduō', vi: 'Rất nhiều' },
            { hz: '年轻人', py: 'niánqīngrén', vi: 'người trẻ tuổi' },
            { hz: '经常', py: 'jīngcháng', vi: 'thường xuyên' },
            { hz: '问', py: 'wèn', vi: 'hỏi' },
            { hz: '怎样', py: 'zěnyàng', vi: 'làm thế nào' },
            { hz: '才能', py: 'cáinéng', vi: 'mới có thể' },
            { hz: '获得', py: 'huòdé', vi: 'đạt được' },
            { hz: '成功', py: 'chénggōng', vi: 'thành công' },
            { hz: '。', py: '', vi: '' },
            { hz: '其实', py: 'qíshí', vi: 'Thực ra' },
            { hz: '，', py: '', vi: '' },
            { hz: '只要', py: 'zhǐyào', vi: 'chỉ cần' },
            { hz: '每天', py: 'měitiān', vi: 'mỗi ngày' },
            { hz: '坚持', py: 'jiānchí', vi: 'kiên trì' },
            { hz: '积累', py: 'jīlěi', vi: 'tích lũy' },
            { hz: '经验', py: 'jīngyàn', vi: 'kinh nghiệm' },
            { hz: '，', py: '', vi: '' },
            { hz: '绝不', py: 'juébù', vi: 'tuyệt đối không' },
            { hz: '半途而废', py: 'bàntú ér fèi', vi: 'bỏ cuộc giữa chừng' },
            { hz: '，', py: '', vi: '' },
            { hz: '机会', py: 'jīhuì', vi: 'cơ hội' },
            { hz: '一定', py: 'yīdìng', vi: 'nhất định' },
            { hz: '会', py: 'huì', vi: 'sẽ' },
            { hz: '出现', py: 'chūxiàn', vi: 'xuất hiện' },
            { hz: '。', py: '', vi: '' }
          ]
        },
        {
          title: 'HSK 5: Đàm Phán Hợp Đồng Thương Mại Việt – Trung (越中贸易合同谈判)',
          viTranslation: 'Trong buổi đàm phán sáng nay tại Thượng Hải, đại diện hai bên đã thảo luận chi tiết về tiêu chuẩn chất lượng, thời hạn giao hàng và phương thức thanh toán. Nhờ sự chuẩn bị chu đáo và tinh thần hợp tác cùng có lợi, hai công ty đã chính thức ký kết hợp đồng dài hạn.',
          tokens: [
            { hz: '在', py: 'zài', vi: 'Tại' },
            { hz: '今天', py: 'jīntiān', vi: 'hôm nay' },
            { hz: '的', py: 'de', vi: 'của' },
            { hz: '商务', py: 'shāngwù', vi: 'thương mại' },
            { hz: '谈判', py: 'tánpàn', vi: 'đàm phán' },
            { hz: '中', py: 'zhōng', vi: 'trong' },
            { hz: '，', py: '', vi: '' },
            { hz: '双方', py: 'shuāngfāng', vi: 'hai bên, song phương' },
            { hz: '客户', py: 'kèhù', vi: 'khách hàng, đối tác' },
            { hz: '仔细', py: 'zǐxì', vi: 'kỹ lưỡng' },
            { hz: '核对', py: 'héduì', vi: 'đối chiếu, kiểm tra' },
            { hz: '了', py: 'le', vi: 'đã' },
            { hz: '质量', py: 'zhìliàng', vi: 'chất lượng' },
            { hz: '标准', py: 'biāozhǔn', vi: 'tiêu chuẩn' },
            { hz: '与', py: 'yǔ', vi: 'và' },
            { hz: '交货', py: 'jiāohuò', vi: 'giao hàng' },
            { hz: '日期', py: 'rìqī', vi: 'thời hạn, ngày tháng' },
            { hz: '，', py: '', vi: '' },
            { hz: '正式', py: 'zhèngshì', vi: 'chính thức' },
            { hz: '签署', py: 'qiānshǔ', vi: 'ký kết' },
            { hz: '长期', py: 'chángqī', vi: 'dài hạn' },
            { hz: '合作', py: 'hézuò', vi: 'hợp tác' },
            { hz: '合同', py: 'hétong', vi: 'hợp đồng' },
            { hz: '。', py: '', vi: '' }
          ]
        },
        {
          title: 'HSK 6: Trí Tuệ Nhân Tạo & Tương Lai Con Người (人工智能与未来)',
          viTranslation: 'Cùng với sự phát triển vượt bậc của công nghệ trí tuệ nhân tạo, phương thức làm việc và học tập của nhân loại đang trải qua những biến đổi sâu sắc. Tuy nhiên, sự đồng cảm, tư duy sáng tạo và chiều sâu văn hóa vẫn là những giá trị độc nhất vô nhị của con người.',
          tokens: [
            { hz: '随着', py: 'suízhe', vi: 'Cùng với' },
            { hz: '人工智能', py: 'réngōng zhìnéng', vi: 'trí tuệ nhân tạo (AI)' },
            { hz: '技术', py: 'jìshù', vi: 'công nghệ, kỹ thuật' },
            { hz: '的', py: 'de', vi: 'của' },
            { hz: '迅速', py: 'xùnsù', vi: 'nhanh chóng' },
            { hz: '发展', py: 'fāzhǎn', vi: 'phát triển' },
            { hz: '，', py: '', vi: '' },
            { hz: '人类', py: 'rénlèi', vi: 'nhân loại' },
            { hz: '的', py: 'de', vi: 'của' },
            { hz: '学习', py: 'xuéxí', vi: 'học tập' },
            { hz: '方式', py: 'fāngshì', vi: 'phương thức' },
            { hz: '正在', py: 'zhèngzài', vi: 'đang' },
            { hz: '经历', py: 'jīnglì', vi: 'trải qua' },
            { hz: '深刻', py: 'shēnkè', vi: 'sâu sắc' },
            { hz: '的', py: 'de', vi: 'những' },
            { hz: '变化', py: 'biànhuà', vi: 'biến đổi' },
            { hz: '。', py: '', vi: '' },
            { hz: '然而', py: 'rán\'ér', vi: 'Tuy nhiên' },
            { hz: '，', py: '', vi: '' },
            { hz: '创造力', py: 'chuàngzàolì', vi: 'sức sáng tạo' },
            { hz: '依然', py: 'yīrán', vi: 'vẫn như cũ' },
            { hz: '是', py: 'shì', vi: 'là' },
            { hz: '独一无二', py: 'dúyī wú\'èr', vi: 'độc nhất vô nhị' },
            { hz: '的', py: 'de', vi: 'mà' },
            { hz: '价值', py: 'jiàzhí', vi: 'giá trị' },
            { hz: '。', py: '', vi: '' }
          ]
        }
      ];

      const GRAMMAR_CAPSULES = [
        { level: 'HSK 1', title: 'Trật tự Địa điểm & Thời gian (Chống dịch word-by-word từ tiếng Việt)', formula: 'Chủ ngữ + [Thời gian] + [Ở + Địa điểm] + Động từ + Tân ngữ', example: '我明天在学校学习中文。(Ngày mai tôi học tiếng Trung ở trường.)', mistake: '❌ Lỗi người Việt hay mắc: 我学习中文在学校明天 (Đặt thời gian và địa điểm ra cuối câu như tiếng Việt).' },
        { level: 'HSK 2', title: 'Phân biệt Bổ ngữ Thời lượng & Thời điểm', formula: 'Chủ ngữ + Động từ + 了 + Khoảng thời gian + (的) + Tân ngữ', example: '我学了两年（的）汉语。(Tôi đã học tiếng Trung được 2 năm.)', mistake: '💡 Nếu đang tiếp diễn tính đến hiện tại thì thêm 了 ở cả sau động từ và cuối câu: 我学了两年汉语了。' },
        { level: 'HSK 3', title: 'Cấu trúc Nhấn mạnh 是……的 (shì... de)', formula: 'Chủ ngữ + 是 + [Thời gian / Địa điểm / Cách thức] + Động từ + 的', example: '我是昨天来北京的。(Tôi đến Bắc Kinh vào ngày hôm qua — nhấn mạnh thời điểm.)', mistake: 'Dùng khi sự việc ĐÃ XẢY RA và người nói muốn nhấn mạnh chi tiết xảy ra ở đâu, lúc nào, bằng cách gì.' },
        { level: 'HSK 4', title: 'Cấu trúc Bất kể... đều... (不管 / 无论……都……)', formula: '不管 / 无论 + Từ để hỏi / Lựa chọn A还是B ， Chủ ngữ + 都 + Vế kết quả', example: '无论遇到什么困难，我们都不能放弃。(Bất kể gặp khó khăn gì, chúng ta đều không được bỏ cuộc.)', mistake: 'Vế sau bắt buộc phải có phó từ 都 (dōu) hoặc 也 (yě) để hô ứng.' },
        { level: 'HSK 5', title: 'Cấu trúc Ninh khả... chứ không... (宁可……也不……)', formula: 'Chủ ngữ + 宁可 (nìngkě) + Vế chịu thiệt A ， 也不 + Vế B', example: '他宁可自己吃苦，也不愿意麻烦别人。(Anh ấy thà tự mình chịu khổ chứ không muốn làm phiền người khác.)', mistake: 'Diễn tả sự lựa chọn dứt khoát giữa hai phương án.' },
        { level: 'HSK 6', title: 'Cấu trúc Nhượng bộ học thuật (固然 / 诚然……然而 / 但是……)', formula: '诚然 / 固然 + [Thừa nhận sự thật A] ， 但 / 然而 + [Luận điểm chính B]', example: '天赋固然重要，但后天的努力才是决定性的。(Thiên phú quả thực quan trọng, nhưng nỗ lực rèn luyện về sau mới mang tính quyết định.)', mistake: 'Giúp bài viết nghị luận HSK 6 và tranh biện cực kỳ khách quan, sắc bén.' }
      ];

      const EXTERNAL_RESOURCES = [
        { cat: 'dict', name: 'Pleco Chinese Dictionary', tag: 'Từ điển Số 1 Thế giới', url: 'https://www.pleco.com/', desc: 'Từ điển Hán-Anh tích hợp nhận diện chữ viết tay cực nhạy, tra bằng camera trực tiếp và phân tích bộ thủ chuyên sâu.' },
        { cat: 'dict', name: 'Arch Chinese & HanziCraft', tag: 'Chiết tự & Thứ tự nét', url: 'https://www.archchinese.com/', desc: 'Tra cứu bách khoa thứ tự nét viết (Stroke Order), nguồn gốc chữ tượng hình và bảng 214 bộ thủ chi tiết.' },
        { cat: 'read', name: 'Du Chinese (读中文)', tag: 'Luyện Đọc Phân Cấp HSK', url: 'https://www.duchinese.net/', desc: 'Kho truyện đọc tiếng Trung phân cấp từ Newbie đến Master kèm audio giọng bản xứ và bật/tắt Pinyin 1 chạm.' },
        { cat: 'read', name: 'The Chairman’s Bao (TCB)', tag: 'Đọc Báo Thời Sự HSK 1-6', url: 'https://www.thechairmansbao.com/', desc: 'Báo chí thời sự thực tế được biên tập lại theo đúng chuẩn từ vựng HSK 1 đến HSK 6+.' },
        { cat: 'listen', name: 'YouGlish for Chinese', tag: 'Nghe Phát Âm Thực Tế', url: 'https://youglish.com/chinese', desc: 'Nhập bất kỳ từ tiếng Trung nào để nghe hàng ngàn đoạn video người bản xứ phát âm từ đó trong ngữ cảnh thực tế.' },
        { cat: 'listen', name: 'Little Fox Chinese', tag: 'Truyện Hoạt Hình Song Ngữ', url: 'https://chinese.littlefox.com/', desc: 'Học tiếng Trung qua phim hoạt hình nhiều tập từ mất gốc (Tây Du Ký, Tam Quốc...) cực kỳ cuốn hút và dễ nghe.' },
        { cat: 'exam', name: 'ChineseTest.cn (Hanban Official)', tag: 'Cổng Thi HSK Chính Thức', url: 'https://www.chinesetest.cn/', desc: 'Trang chủ chính thức của kỳ thi năng lực Hán ngữ quốc tế HSK & HSKK: đăng ký thi, tải đề mẫu và tra điểm.' },
        { cat: 'exam', name: 'AnkiWeb Shared Chinese Decks', tag: 'Kho Thẻ SRS Cộng Đồng', url: 'https://ankiweb.net/shared/decks?search=HSK', desc: 'Tải miễn phí hàng trăm bộ thẻ Flashcard HSK 1-9 có sẵn âm thanh và hình ảnh ví dụ.' },
        { cat: 'read', name: 'Dong Chinese (懂中文)', tag: 'Học Qua Phim & Báo', url: 'https://www.dong-chinese.com/', desc: 'Phân tích tần suất chữ Hán và học qua các đoạn hội thoại video thực tế phù hợp trình độ cá nhân.' }
      ];

      const SHOP_ITEMS = [
        { id: 'streak_freeze', icon: '🛡️', name: 'Bùa Hộ Mệnh Giữ Streak', cost: 50, desc: 'Bảo vệ chuỗi ngày học liên tiếp không bị mất nếu bạn bận 1 ngày.' },
        { id: 'exp_boost', icon: '⚡', name: 'Đan Dược Nhân Đôi EXP', cost: 80, desc: 'Nhận ngay +120 EXP Tu Luyện để thăng cấp Danh hiệu nhanh chóng.' },
        { id: 'heart_refill', icon: '❤️', name: 'Bình Linh Lực Thượng Hạng', cost: 40, desc: 'Hồi phục tối đa 5/5 Tim Linh Lực để vượt ải Boss.' },
        { id: 'dragon_title', icon: '👑', name: 'Danh Hiệu: Long Tộc Học Giả', cost: 150, desc: 'Mở khóa danh hiệu Kim Cương hiển thị trên thanh trạng thái.' }
      ];

      // =====================================================
      // 6. HYBRID PERSISTENT DATABASE (IndexedDB + LocalStorage)
      // =====================================================
