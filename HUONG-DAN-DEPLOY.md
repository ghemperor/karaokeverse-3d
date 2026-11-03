# CẬP NHẬT KARAOKEVERSE v1.4 TỪ v1.3 TRÊN GITHUB / RENDER

## 1. Sao lưu

Tải ZIP mã nguồn từ repository GitHub hiện tại trước khi thay đổi. Có thể lưu lại commit SHA của bản v1.3 để khôi phục nếu cần.

## 2. Upload file đúng vị trí

Giải nén **KaraokeVerse-v1.4-GitHub-Update.zip** và upload các nội dung bên trong lên **root** repository `karaokeverse-3d`, trên nhánh `main`. Ghi đè file trùng và commit.

Các đường dẫn quan trọng:

- `server.js` — tiếp nhận profile và sự kiện `avatar:update`.
- `lib/world.js`, `lib/position.js` — thêm ba emote hợp lệ, duy trì pose khi truyền tọa độ.
- `public/index.html`, `public/style.css`, `public/app.js`, `public/scene.js` — giao diện, luồng realtime và cinematic.
- `public/avatar-studio.js`, `public/avatar-profile.js`, `public/avatar-materials.js` — các module mới.
- **`public/models/karaoke-avatar.glb`** — model GLB có animation. Đây là file nhị phân bắt buộc; đừng đổi tên hoặc chỉ dán nội dung text lên GitHub.
- `package.json`, `tests/avatar-profile.test.js`, `tests/avatar-glb.test.js`, `scripts/build-avatar-glb.py`.

**Không upload thư mục ZIP lồng một cấp**. Trên GitHub phải thấy `server.js` ở root và `public/models/karaoke-avatar.glb` tồn tại đúng path.

## 3. Render

Nếu Auto Deploy bật, Render tự deploy khi có commit mới trên `main`. Nếu không: chọn Manual Deploy → Deploy latest commit. Bản này không thêm biến môi trường.

**Giữ nguyên** cấu hình TURN đã lưu ở Environment. Không bao giờ đẩy credentials Metered lên GitHub. Với sản phẩm công khai, nên chuyển qua credentials ngắn hạn (hiện `/config` có thể làm lộ TURN username/password cố định).

## 4. Kiểm tra ngay sau khi deploy

1. Đảm bảo trạng thái Render là `Live` (bản deploy mới).
2. Mở `/health`, kiểm tra `ok:true`.
3. Mở `/models/karaoke-avatar.glb` — trình duyệt phải tải file, không trả HTML. Phản hồi nên có Content-Type GLB (thường `model/gltf-binary` hoặc octet-stream). Nếu nhận HTML, file chưa được upload đúng đường dẫn.
4. Vào website, tải mới không cache (Ctrl+Shift+R).
5. Mở Avatar Studio ở màn chào và xem preview GLB xoay được.
6. Tạo phòng với thiết bị A và B trên 2 mạng, đổi màu áo trên A và xác nhận B thấy ngay.
7. Kiểm tra lại voice chat, YouTube, Echo/Auto-Tune, Party Games và Battle Arena.

**Nếu preview đen:** kiểm tra Network/Console trong DevTools: `/models/karaoke-avatar.glb`, CDN Three.js, WebGL. Model cũ vẫn được dùng nếu nạp GLB thất bại.

## 5. Khôi phục khi gặp lỗi

Vào GitHub, revert commit nâng cấp hoặc deploy lại commit v1.3 trên Render. Các biến TURN của Render vẫn không thay đổi. Nếu lỗi chỉ trên máy một người, thử hard refresh và xóa cache website trước khi rollback toàn bộ.

## Giới hạn

Phiên bản này đã kiểm tra tự động Node/GLB nhưng chưa được thử trên Render hay 2 thiết bị thực tế. Model GLB có animation theo node (không phải skeletal mocap). Chưa có đăng nhập hoặc lưu avatar trên server vĩnh viễn.
