# Deploy KaraokeVerse 3D v1.4.1 lên GitHub và Render

Đây là bản cập nhật **trực tiếp từ v1.4**, không cần tạo Render Service mới.

1. **Sao lưu** repo hoặc tạo nhánh dự phòng trước khi ghi đè.
2. Tải `KaraokeVerse-v1.4.1-GitHub-Update.zip` và giải nén. Upload **nội dung bên trong** vào repository đang kết nối với Render, đúng cấu trúc; không tạo thêm một cấp thư mục bao ngoài.
3. Chú ý các file mới bắt buộc:
   - `lib/npc-service.js`
   - `public/npc-ui.js`
   - `public/models/karaoke-avatar.glb` (phiên bản GLB mới)
   - `public/scene.js`, `public/app.js`, `public/index.html`, `public/style.css`, `server.js`.
4. Commit vào nhánh `main`; Render sẽ tự deploy khi Auto-Deploy On Commit được bật. Nếu không: **Manual Deploy → Deploy latest commit**.
5. Giữ `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` **đang có trong Render Environment**. Không đưa mật khẩu vào file trong GitHub.
6. Khi Render báo **Live**, tải lại website bằng `Ctrl+Shift+R` (điện thoại có thể cần đóng và mở lại tab, xóa cache site nếu còn giao diện cũ).
7. Kiểm tra `<your-render-url>/health` (không lộ secret); tạo phòng, mời một người ở thiết bị khác, thử nút Gọi nhân viên và thay tên NPC.

**Sự cố thường gặp:** `ERR_MODULE_NOT_FOUND` trỏ tới `lib/npc-service.js` = thư mục `lib/` chưa upload đúng gốc cùng `server.js`. Nếu bảng NPC không phản hồi, kiểm tra `public/npc-ui.js` và `public/app.js` đã cập nhật đúng bản. Nếu GLB không xuất hiện, kiểm tra `public/models/karaoke-avatar.glb` có trên GitHub và URL `/models/karaoke-avatar.glb` được trả về. Nếu mobile thiếu menu, kiểm tra `public/style.css` và `public/index.html`, tải lại cache.

**Lưu ý:** Phòng NPC lưu RAM và mất khi Render restart. TURN và micro cần kiểm thử thật trên hai mạng; bộ kiểm thử Node không xác nhận chất lượng WebRTC hay hình ảnh WebGL.
