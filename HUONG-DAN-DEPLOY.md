# Cập nhật KaraokeVerse lên v1.4.2 — Avatar Atelier

Đây là bản nâng cấp trực tiếp từ **v1.4.1**. Giữ nguyên Render Web Service, đường dẫn website và các biến TURN/STUN đang cấu hình.

## 1. Sao lưu và upload

1. Sao lưu repository GitHub hiện có hoặc tạo nhánh backup.
2. Giải nén `KaraokeVerse-v1.4.2-GitHub-Update.zip`. Upload **các file bên trong** lên **gốc** repo đang liên kết với Render; không upload cả folder ZIP như một thư mục con mới.
3. Giữ nguyên tất cả các file không nằm trong gói cập nhật, nhất là `server.js`, `lib/`, `public/app.js`, `public/npc-ui.js`, `public/audio-mixer.js` và các thư mục test cũ.
4. Đảm bảo đủ những file mới/đổi:
   - `public/models/karaoke-avatar.glb`
   - `public/avatar-profile.js`
   - `public/avatar-materials.js`
   - `public/avatar-studio.js`
   - `public/scene.js`
   - `public/style.css`
   - `public/index.html`
   - `package.json`
   - `scripts/build-avatar-glb.py`
   - `tests/avatar-atelier.test.js`, `tests/avatar-profile.test.js`
5. Commit lên `main`. Nếu Auto Deploy bật, Render sẽ cập nhật. Nếu không, chọn `Manual Deploy` → `Deploy latest commit`.

## 2. Kiểm tra deploy

1. Chờ Render hiện trạng thái `Live`. Mở `/health` trên URL website để kiểm tra.
2. Truy cập `/models/karaoke-avatar.glb` — trình duyệt phải tải được file GLB (không trả 404).
3. Tải mới website bằng **Ctrl+Shift+R** trên desktop; trên điện thoại đóng/mở lại tab nếu trình duyệt còn cache.
4. Mở Avatar Studio, thử các kiểu tóc, preset, camera, micro, biểu cảm và Lưu.
5. Dùng 2 người tham gia cùng phòng để kiểm tra sự thay đổi ngoại hình của người A được gửi sang người B. Kiểm tra NPC, Battle, Mixer, voice chat trước khi sử dụng buổi karaoke thực.

**Không cần thêm biến môi trường.** Cần giữ `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` bên trong Render Environment. KHÔNG upload chúng lên GitHub, và KHÔNG chụp màn hình `/config` khi chứa credential.

## 3. Khắc phục sự cố

- **Không thấy Avatar Atelier:** kiểm tra `public/index.html`/`public/style.css` trên GitHub; làm mới cache.
- **Không tải được GLB:** kiểm tra đúng đường dẫn `public/models/karaoke-avatar.glb` ở repo gốc. Request GET `/models/karaoke-avatar.glb` phải trả 200.
- **Nhân vật có màu nhưng tóc/phụ kiện lỗi:** kiểm tra cả hai file `avatar-profile.js` và `avatar-materials.js` đã cập nhật cùng phiên bản.
- **Giao diện tab hoạt động nhưng không thấy preview:** kiểm tra Chrome/Edge hỗ trợ WebGL, tải thư viện Three.js từ CDN, kiểm tra Console > lỗi mạng. Bản game dùng Three.js từ jsDelivr như các bản trước.
- **Avatar không đồng bộ:** đảm bảo `public/scene.js`, `public/avatar-profile.js` đã upload, trang đã refresh. Server đang có `avatar:update` từ v1.4.
- **Bị lỗi server:** xem Render Logs; kiểm tra repo không làm mất `server.js` hoặc `lib`.
- **Chậm trên điện thoại:** giảm mức đồ họa 3D và tắt ứng dụng nặng; model mới có nhiều mesh hơn, chưa đo FPS thực trên điện thoại cụ thể.

## Ghi chú chất lượng

74/74 bài kiểm thử Node đạt. CSS đã đo hình học trên 4 viewport nhưng **preview WebGL và chuyển động GLB thực tế vẫn cần thử trên máy/Render**. Không quảng cáo đã thử đa thiết bị nếu chưa kiểm thử thật.
