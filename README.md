# KaraokeVerse 3D v1.4.1 — PRIVATE PARTY LOUNGE

Phiên bản phát triển từ **v1.4 Avatar Studio** dành cho nhóm bạn riêng tư. Giữ **Three.js, GLB, Solo/Team Battle, Party Games, quà tặng, YouTube IFrame Player, WebRTC/STUN/TURN, Mixer Pro, Echo, Reverb, EQ và Auto-Tune**.

## Mới trong v1.4.1

### Avatar 3D mềm mại hơn

- `public/models/karaoke-avatar.glb` được **tự xây dựng lại từ script đi kèm**, nhiều khối hình bo tròn hơn, khuôn mặt/tóc/áo/quần/giày được làm rõ hơn.
- Thêm **khớp khuỷu tay** `ForearmL` và `ForearmR`; clip `sing` có tư thế đưa micro lên miệng, `sit` và `stand` có keyframe vị trí hông riêng để tránh giữ dáng ngồi.
- Vẫn 10 clip gốc (`idle`, `walk`, `sit`, `sing`, `dance`, `wave`, `clap`, `cheer`, `bow`, `heart`) và hệ thống palette v1.4. Đây là **GLB stylized tự làm**, chưa phải người thật 3D hoặc mocap.

### Mobile: truy cập đầy đủ chức năng

- Dưới màn hình điện thoại có thanh **Phòng 3D / Bài hát / Micro / DJ & NPC / Chat / Tất cả**.
- Menu **Tất cả** đưa tới 12 khu vực như Avatar Studio, Karaoke Battle, Party Games, quà tặng, Echo/Reverb, Auto-Tune, cài đặt đèn và chat.
- Mọi panel đều có thể cuộn và mở riêng; trên tablet dưới 960 px **không còn ẩn hoàn toàn chat/thành viên**.
- Thanh play/pause, next và **tua YouTube** hiển thị riêng hàng để không chồng chữ trên màn hình hẹp.
- Các panel âm thanh / game được thu gọn khi vào bằng điện thoại, bạn bấm từ menu để mở đúng panel.

### DJ & các nhân viên NPC

NPC có ba nhân viên **Linh, Mai, Vy** và **DJ Luna**, đều là nhân vật hư cấu trưởng thành, tạo bằng Three.js ngay trong phòng. DJ có bàn mix và hiệu ứng chuyển động; các nhân viên có tóc, đồng phục, bảng tên và cử động.

- Mở **🎧 DJ & NHÂN VIÊN PHỤC VỤ • NPC**, hoặc chạm vào nhân vật trong phòng.
- Chọn nhân viên → **Gọi đến bàn** để NPC di chuyển đến vị trí gần bàn trung tâm.
- Chọn **Bia (mô phỏng), Nước ngọt, Nước lọc** → **Mang đồ uống** → **Mời cụng ly** hoặc **Cảm ơn & tiễn**.
- Chọn **DJ Luna** → **Chào DJ**; chủ phòng có thể **Bật/tắt animation DJ**.
- Chủ phòng có thể **đặt lại tên** tất cả bốn nhân vật bằng cách chọn nhân vật rồi nhập tên.
- Tất cả thay đổi được máy chủ kiểm tra và đồng bộ qua **Socket.IO**; một nhân viên không phục vụ cùng lúc hai người khác nhau. Người chơi rời phòng thì NPC tự về quầy.
- **Giới hạn:** đây là hành động mô phỏng cho game, không có mua đồ uống thật; NPC sử dụng hội thoại viết sẵn, **không phải AI chatbot**. DJ chỉ là hiệu ứng 3D, **không thay thế trình phát YouTube hay chỉnh mixer của người chơi**.

## Khởi chạy trên Windows

1. Giải nén. Cài **Node.js LTS 22**.
2. Mở `CHAY-TREN-WINDOWS.bat` hoặc chạy `npm install && npm start`.
3. Bản `.bat` đặt cổng **3002**. Mở `http://localhost:3002`.
4. Nếu 3002 bị chiếm: `CHAY-TREN-WINDOWS.bat 3003`.

Với macOS/Linux: `npm install`, `PORT=3002 npm start`.

## Kiểm thử

Tại thư mục dự án: `npm run check`.

Kiểm tra thực tế (nên làm lần lượt):

1. Vào phòng, dùng 2 trình duyệt khác nhau, gọi Linh đến bàn ở A. Xem NPC di chuyển và trạng thái phục vụ thay đổi ở B.
2. Thử gọi cùng Linh từ B trong lúc đang phục vụ A (B cần nhận thông báo không thể gọi); thử Mai/Vy vẫn độc lập.
3. Chủ phòng đổi tên Mai thành một tên khác; B phải thấy tên mới. Rời phòng và quay lại từ bản khởi động lại sẽ khôi phục tên mặc định do dữ liệu chỉ nằm trong RAM.
4. Chạm DJ, thử chào, cho chủ phòng bật/tắt DJ.
5. Thử 390 px và tablet khoảng 768 px: menu Tất cả phải mở được từng panel; chat, Playlist, Auto-Tune, Mixer, Battle, Party, quà tặng và Avatar Studio phải truy cập được.
6. Vào Avatar Studio, thử GLB, quay nhân vật, nhảy; trong phòng kiểm tra cầm micro và ngồi/đứng, chuyển camera.
7. Thử YouTube, micro trên hai mạng khác nhau, Echo, Auto-Tune, bình chọn và gifts để phát hiện lỗi hồi quy.

**Đã kiểm tra:** cú pháp Node, 67 bài kiểm thử tự động cho logic và tích hợp tĩnh; ảnh kiểm tra bố cục mobile trong Chromium với DOM tĩnh. **Chưa kiểm thử thực tế:** WebGL/render NPC, âm thanh/multiplayer hai thiết bị trên Render; cần xác nhận khi bạn deploy.

## Deploy Render / GitHub

Xem `HUONG-DAN-DEPLOY.md`. Gói update bao gồm **`lib/npc-service.js` và `public/npc-ui.js`** — thiếu hai file này sẽ gây lỗi khởi động hoặc mất chức năng. Giữ bí mật TURN credentials trong Render Environment, không commit vào GitHub.

## Giới hạn vận hành

Phòng và trạng thái NPC lưu RAM. Khi Render restart, tên NPC và vị trí phục vụ của phòng sẽ trở về mặc định. Trình duyệt tải thư viện Three.js qua CDN; mạng cần truy cập CDN. WebRTC giữa các mạng có thể cần TURN. Không tự bật micro, không ghi âm. Các nhân viên là nhân vật giải trí, không có thanh toán hay đồ uống thực.
