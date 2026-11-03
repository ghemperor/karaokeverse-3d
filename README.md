# KaraokeVerse 3D v1.3 — BATTLE ARENA

Bản nâng cấp trực tiếp từ KaraokeVerse v1.2.5 (Virtual Gifts & Celebration). Chạy trên Node.js + Express + Socket.IO; giao diện React-free vanilla JS; thế giới 3D Three.js từ CDN, YouTube IFrame API, WebRTC voice, Web Audio mixer/Auto-Tune.

## Tính năng v1.3 mới

- **Solo Battle (1 vs 1):** chủ phòng chọn hai ca sĩ, từ 1 đến 5 vòng.
- **Team Battle:** chủ phòng tạo hai đội Đỏ/Xanh, mỗi bên từ 1 đến 4 người, tổng người trong phòng tối đa 8; người hát của mỗi đội được luân phiên theo vòng.
- **Vòng đấu do máy chủ điều khiển:** hát A → hát B → bầu chọn 45 giây → tổng kết vòng → vòng kế tiếp / trao giải chung cuộc.
- **Bình chọn có xác thực:** mỗi người một phiếu/vòng; hai ca sĩ vừa biểu diễn ở vòng đó không được bỏ phiếu; một người không thể gửi nhiều phiếu; người ngoài phòng không được bỏ phiếu. Thành viên khác (kể cả đồng đội không hát trong vòng) có thể bình chọn A hoặc B.
- **Điểm thực:** bên nhiều phiếu hơn được 1 điểm; hòa có phiếu được 0,5 điểm mỗi bên; nếu không có phiếu thì không bên nào được cộng điểm. Có bảng điểm trực tiếp, lịch sử phiếu từng vòng và công bố bên thắng chung cuộc.
- **Three.js Battle Stage:** hai khu vực sân khấu Đỏ/Xanh, spotlight di chuyển theo lượt hát, bảng tỉ số 3D ở phía trước và hiệu ứng vương miện/pháo giấy khi vô địch.
- **Đồng bộ Socket.IO:** kết quả và tiến độ do máy chủ lưu trong RAM, gửi tới mọi thành viên, kể cả người vào giữa trận. Chủ phòng có thể kết thúc bình chọn sớm hoặc hủy trận.
- **Chống xung đột:** tạm ngăn truyền micro thủ công, đăng ký lượt hát thường và mở Party Poll khi Battle đang hoạt động; sau trận khôi phục danh sách ca sĩ/hàng chờ cũ trong khả năng có người còn ở phòng.

### Giữ nguyên từ v1.2.5

- Tạo phòng / link mời, tối đa 8 người, chat/emoji, avatar nhân vật, góc nhìn first person & third person, ngồi ghế / tương tác đồ vật.
- Màn hình 3D phát YouTube qua nhúng chính thức và hàng chờ.
- WebRTC voice chat, cấu hình STUN/TURN thông qua biến môi trường; Open Mic / Push to Talk.
- Auto-Tune Lab, Mixer Pro (EQ, gain, Echo, Reverb, Compression, preset, chỉnh nhạc và loa tại máy).
- Party Games (vòng quay, thử thách, bình chọn ngoài Battle), quà tặng ảo, bảng cổ vũ và lễ trao giải Party Games.

## Chạy trên Windows

1. Cài **Node.js 20 trở lên** (đề nghị LTS 22).
2. Giải nén dự án, mở `CHAY-TREN-WINDOWS.bat`.
3. Mở trình duyệt tại `http://localhost:3002` (cổng mặc định).
4. Nếu 3002 bận, chạy `CHAY-TREN-WINDOWS.bat 3003` trong Command Prompt từ thư mục dự án.

Dùng CMD trực tiếp:

```bat
npm install
set PORT=3002
npm start
```

## Cách chơi Battle Arena

1. Chủ phòng tạo phòng. Mời bạn bè bằng đường dẫn phòng.
2. Mở **⚔️ BATTLE ARENA • SOLO & TEAM** bên dưới sân khấu.
3. Chọn Solo (1 người mỗi bên) hoặc Team (1–4 người mỗi bên). Hai đội không được trùng thành viên. Chọn 1–5 vòng.
4. Nhấn **Bắt đầu trận đấu**. Chỉ chủ phòng có quyền này.
5. Ca sĩ Đỏ biểu diễn: người chơi tự bật mic; chủ phòng điều khiển bài hát YouTube nếu muốn.
6. Chủ phòng nhấn **Lượt hát của B**. Ca sĩ Xanh biểu diễn.
7. Nhấn **Mở bình chọn 45 giây**. Các thành viên đủ điều kiện bình chọn một lần. Hệ thống tự chốt sau 45 giây hoặc chủ phòng chốt sớm.
8. Nhấn **Vòng tiếp theo**, lặp lại. Sau vòng cuối nhấn **Trao cúp chung cuộc**. Game phát hiệu ứng cả phòng.
9. Người tham gia có thể xem điểm số, số phiếu và lịch sử các vòng.

**Chú ý:** Trong phòng chỉ có đúng 2 người thi Solo và không có khán giả, cả hai ca sĩ không được bỏ phiếu vòng đó. Điểm sẽ là 0–0 (hòa) cho tới khi có thêm người xem. Hãy mời ít nhất một khán giả để chấm điểm. Không có cơ chế AI tự chấm cao độ. Trận Team 4v4 cũng cần phân công người không hát trong vòng đó để bình chọn.

Hành động trên game chỉ thay đổi **lượt biểu diễn**; ứng dụng **không bật micro vật lý thay người dùng**, phù hợp với quyền riêng tư trình duyệt.

## Deploy lên Render đã có sẵn

Xem `HUONG-DAN-DEPLOY.md`. Upload bộ cập nhật GitHub đi kèm (các file trong gói) vào đúng thư mục repository đang kết nối với Render, commit lên nhánh `main`. Nếu Render bật Auto Deploy, nó tự xây dựng phiên bản mới. Không cần thêm biến môi trường chỉ để chạy Battle.

Để kiểm tra máy chủ: `https://TEN-SERVICE.onrender.com/health`.

**Giữ nguyên** các biến `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` đang có trên Render. Không đưa secrets vào GitHub. Vì cấu hình WebRTC hiện tại trả TURN credentials trong `/config`, nên với website công khai cần nâng cấp cơ chế cấp thông tin TURN ngắn hạn trước khi vận hành lâu dài.

## Test & giới hạn

```bash
npm run check
```

- Bộ kiểm thử cú pháp và Node.js tests bao gồm toán điểm, kiểm soát phiếu, vòng đấu, thành viên rời phòng, hiển thị trạng thái công khai và kiểm thử hồi quy của các tính năng cũ.
- Giao diện Battle đã được chạy thử bằng Chromium với người chơi giả lập; chưa kiểm thử hai người thực trên hai mạng Internet, cũng chưa xác nhận hiệu ứng WebGL 3D trên máy người dùng.
- Phòng và trận đấu **chỉ được giữ trong RAM** của một Node.js instance; Render restart sẽ làm mất dữ liệu. Nếu mở rộng qua nhiều instance, cần session store / sticky session + Socket.IO adapter.
- Hạn chế autoplay, video không cho nhúng và quảng cáo YouTube vẫn thuộc chính sách trình nhúng chính thức.
- WebRTC mesh hiện thích hợp MVP nhỏ; phòng đông có thể cần SFU/LiveKit. TURN có thể phát sinh chi phí băng thông.
- Không có tài khoản, tiền thật hay phần thưởng quy đổi tiền. Quà tặng chỉ là hoạt ảnh miễn phí.

## Tập tin v1.3

- `lib/battle.js` — luật chơi/điểm số thuần JS, server-authoritative.
- `public/battle-ui.js` — bảng điều khiển cuộc thi.
- `server.js` — events `battle:start`, `battle:advance`, `battle:vote`, `battle:cancel`; đồng bộ `battle:state`, `battle:champion`.
- `public/scene.js` — đèn sân khấu đối kháng, neon, 3D score banner và animation trao giải.
- `tests/battle.test.js` — test vòng đấu, phiếu, phân đội, tie, disconnect.

© Demo KaraokeVerse. Three.js và các thư viện khác theo giấy phép tương ứng.
