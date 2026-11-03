# KaraokeVerse 3D v1.4.2 — AVATAR ATELIER

Đây là bản **nâng cấp toàn diện nhân vật / Avatar Studio** từ v1.4.1 Private Party Lounge, phục vụ nhóm bạn riêng tư. Không thay đổi các cơ chế YouTube, phòng, WebRTC/TURN, Mixer Pro, Auto-Tune, Battle, Party Games, quà tặng, DJ và nhân viên NPC.

## Bản phát hành này có gì mới?

### 1. Model avatar GLB được dựng lại

- Asset gốc `public/models/karaoke-avatar.glb` được tạo bằng **script đi kèm**, không tải model thương mại hay asset có vấn đề bản quyền.
- **111 nodes và 12 animation clips** trong GLB; khoảng 70 KB; mô hình stylized mới với mặt, iris, pupils, catchlights, má, lông mày, biểu cảm miệng; chi tiết tóc, áo khoác, áo hoodie, áo thun, áo thanh lịch, viền áo, cúc, đồng hồ, giày/dây giày và micro.
- Khớp vai/khuỷu tay cho animation hát, đi, ngồi, nhảy, vẫy tay, vỗ tay, cổ vũ, cúi chào, thả tim, tạo dáng.
- Chớp mắt và hoạt họa miệng nhẹ trong phòng karaoke, giữ nguyên tỷ lệ mesh.
- DJ Luna và Linh/Mai/Vy sử dụng cùng rig GLB được cá nhân hóa; giữ model procedural làm phương án dự phòng khi tải GLB thất bại.
- Model **stylized** chứ không phải photorealistic, chưa sử dụng skinning mocap hoặc đồ họa AAA.

### 2. Avatar Studio mới

- Trình xem 3D có ánh sáng studio, sàn trình diễn, có thể xoay 360° và xem **chính diện / nghiêng / phía sau / xoay tự do**.
- Chọn thử **11 hành động** trực tiếp trong preview (gồm cầm mic hát và ngồi).
- **4 preset**: Pop Star, Chill Night, VIP Lounge, Retro Beat; chức năng randomize, undo, reset.
- Tùy chỉnh **7 màu da, 9 màu tóc, 9 màu áo, 6 màu quần, 5 màu giày**, 5 kiểu tóc, 5 loại phụ kiện, 4 kiểu trang phục, 3 dáng người, 3 biểu cảm.
- UI chia tab Khuôn mặt & tóc / Trang phục / Phụ kiện. Trên mobile hiển thị dạng màn hình toàn phần, cuộn được toàn bộ thiết lập và chân trang giữ nút Lưu.
- Lựa chọn lưu `localStorage` và gửi sang Socket.IO khi ở trong phòng như trước.

### 3. Giữ tương thích

Không thay đổi tên các clip animation cũ hoặc đường dẫn GLB; profile cũ được nâng lên schema v1.4.2 với các mục mới lấy mặc định an toàn. Bộ dựng không đòi database, API key mới hay cấu hình Render mới.

## Chạy trên Windows

1. Cài Node.js 22 và có kết nối Internet (để tải dependencies + Three.js từ CDN).
2. Giải nén toàn bộ thư mục, chạy `CHAY-TREN-WINDOWS.bat`.
3. Truy cập `http://localhost:3002` (cổng mặc định). Nếu trùng port, mở CMD tại thư mục và chạy `CHAY-TREN-WINDOWS.bat 3003`.
4. Vào Avatar Studio từ màn hình chào hoặc nút `Avatar` trong phòng.

macOS/Linux: chạy `npm install && PORT=3002 npm start`.

## Kiểm thử mã nguồn

`npm run check` hoặc `node --test tests/*.test.js`.

Tại thời điểm đóng gói: **74/74 tests Node đạt**; GLB đọc được dưới dạng glTF scene độc lập; kiểm tra CSS layout ở 360, 390, 768 và 1280 px không tràn ngang, nút lưu trong vùng nhìn thấy.

**Giới hạn chưa kiểm chứng:** Model GLB không được render với Three.js trong phiên thử Chromium không có thư viện CDN, do đó ngoại hình/animation thực tế cần chạy thử ở Chrome/Edge có Internet. Chưa kiểm chứng đa thiết bị WebRTC và NPC animation thực tế trên Render sau bản nâng cấp. Kiểm thử code không thay thế kiểm thử game trên thiết bị thật.

## Kiểm tra sau khi chạy

1. Mở Avatar Studio: thử chọn kiểu tóc ngắn, dài, buộc, xoăn và mũ; đảm bảo không có nhiều tóc trùng nhau.
2. Chọn 4 preset; dùng Undo; thử chọn khuôn mặt, biểu cảm, trang phục, phụ kiện.
3. Chọn **Cầm micro & hát** trong preview; xem tư thế khuỷu tay, vị trí micro.
4. Vào phòng 2 trình duyệt; thay đổi nhân vật A và xác nhận B thấy đúng màu tóc/quần áo, đồng thời thử vỗ tay và ngồi/đứng.
5. Gọi Linh/Mai/Vy đến bàn; thử DJ và cử động NPC; tương tác vẫn hoạt động.
6. Dùng điện thoại 360–390 px, kiểm tra tabs, xem trước, điều khiển camera và nút **Lưu nhân vật**.
7. Thử YouTube, microphone, mixer, Auto-Tune, Echo, party/vote để phát hiện hồi quy.

## File chính

- `scripts/build-avatar-glb.py`: script tái tạo asset gốc (cần `pip install trimesh numpy` nếu muốn tự build).
- `public/models/karaoke-avatar.glb`: asset 3D tự chứa không tải texture ngoài.
- `public/avatar-profile.js`: schema ngoại hình với giá trị cho phép.
- `public/avatar-materials.js`: áp dụng màu và bật/tắt các phần tóc / quần áo / biểu cảm.
- `public/avatar-studio.js`: preview 3D, preset, undo, responsive interactions.
- `public/scene.js`: dùng avatar GLB cho người chơi và NPC.
- `public/index.html`, `public/style.css`: giao diện Avatar Atelier.

## An toàn & vận hành

Không đưa TURN credentials vào repo. Các biến TURN đang lưu trên Render giữ nguyên khi deploy. Do dịch vụ hiện tại trả TURN credentials qua `/config`, nên đổi sang TURN credential ngắn hạn trước khi công khai website. Nếu chỉ dùng với vài bạn bè, vẫn cần giới hạn truy cập hợp lý.
