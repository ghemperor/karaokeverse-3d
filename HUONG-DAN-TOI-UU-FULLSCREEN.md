# KaraokeVerse 3D v1.4.3.3 – Fullscreen Smooth

## Vì sao fullscreen giật hơn?

Renderer v1.4.3.2 khởi tạo một pixel ratio cố định rồi phóng khung canvas khi fullscreen. Ví dụ, cửa sổ game 900 × 500 chỉ chiếm 450.000 điểm ảnh CSS trong khi màn hình 1920 × 1080 có 2.073.600 điểm ảnh, chưa tính pixel ratio trên màn hình DPI cao. GPU phải xử lý nhiều điểm ảnh hơn, trong khi đèn và bóng đổ trong phòng vẫn chạy.

## Bản sửa thay đổi gì?

1. Giới hạn ngân sách điểm ảnh riêng cho fullscreen, desktop và mobile. Bản Auto hướng tới khoảng 1,9 triệu điểm ảnh render ở fullscreen desktop và 1,05 triệu ở mobile.
2. Theo dõi FPS và giảm render scale nếu FPS thấp kéo dài, tăng chậm nếu hiệu năng dư.
3. Tính lại pixel ratio sau khi vào hoặc thoát fullscreen, giữ tỷ lệ camera chính xác khi cửa sổ thay đổi kích thước.
4. Thêm nút **⚡ Auto / Mượt / Sắc nét** ngay bên trong vùng fullscreen, kèm FPS ước lượng.
5. Giữ nguyên camera V, game, GLB tùy chỉnh, DJ/NPC, YouTube, WebRTC/TURN, Auto-Tune và Mixer Pro.

## Kiểm tra

- Mở karaoke ở chế độ cửa sổ, xem chỉ số FPS trên nút ⚡.
- Nhấn **F** để vào fullscreen, thử đi bằng WASD và chuyển góc với **V**.
- Để **Auto** chạy khoảng 5–10 giây. Nếu FPS thấp, chọn **Mượt**.
- Nếu ưu tiên độ nét và máy đủ mạnh, chọn **Sắc nét**.
- So sánh FPS với cùng góc camera / cùng số người chơi / cùng video.

## Upload lên GitHub / Render

1. Sao lưu commit hiện tại hoặc tạo branch dự phòng.
2. Giải nén `KaraokeVerse-v1.4.3.3-GitHub-Fullscreen-Update.zip`.
3. Upload nội dung đúng cấu trúc vào repository đang deploy, ghi đè file tương ứng.
4. Commit vào `main`. Render Auto Deploy sẽ khởi chạy nếu đang bật. Không cần biến môi trường mới.
5. Khi Render báo Live, nhấn Ctrl+Shift+R hoặc mở tab ẩn danh để nhận JS/CSS mới.

**Quan trọng:** ZIP cập nhật không chứa file model `public/models/people/*.glb` và cũng không chứa `avatar-catalog.json`. Không xóa các file model đã upload trên GitHub.

## Kiểm thử và giới hạn

`npm run check` → 91/91 kiểm thử logic đạt. Chưa có xác minh FPS trên GPU của người dùng; hiệu quả thực tế phụ thuộc thiết bị và driver. Nếu FPS vẫn thấp hơn 30 ở chế độ Mượt, cần đo thêm số draw calls, polygon và hiệu ứng bóng đổ, tối ưu GLB bên ngoài.
