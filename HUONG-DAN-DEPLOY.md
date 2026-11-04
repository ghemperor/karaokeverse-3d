# CẬP NHẬT KARAOKEVERSE v1.4.3 LÊN GITHUB / RENDER

1. Backup repository `karaokeverse-3d` hiện tại hoặc tạo nhánh backup trước khi cập nhật.
2. Tải **KaraokeVerse-v1.4.3-GitHub-Update.zip**, giải nén và tải **nội dung bên trong** lên GitHub nhánh `main`. Chọn ghi đè khi trùng tên, giữ nguyên thư mục.
3. Kiểm tra tối thiểu có `public/avatar-catalog.js`, `public/avatar-runtime.js`, `public/models/avatar-catalog.json` và `public/models/karaoke-avatar.glb` (file cũ vẫn cần làm dự phòng).
4. Commit thay đổi; Render Web Service sẽ build/deploy khi bật Auto Deploy. Nếu không, chọn Manual Deploy → Deploy latest commit.
5. Khi báo Live, mở website → Avatar Studio. Xem trạng thái file đang dùng dưới preview. Nếu chưa thay `src` thì model mặc định của v1.4.2 vẫn hiện (đó là chủ ý để không bị lỗi).
6. Để dùng model 3D đẹp mới, chuẩn bị `player.glb` / `dj.glb` / `linh.glb` / `mai.glb` / `vy.glb` có bản quyền hoặc license cho phép, upload dưới `public/models/people/`, sửa catalog theo README, commit GitHub, đợi Render Live.
7. Làm mới trang bằng `Ctrl+Shift+R`. Thử 2 thiết bị với NPC, micro, battle và YouTube.

**Không cần sửa Environment**, các biến TURN vẫn dùng như trước. Không upload mật khẩu TURN vào repo. Mặc định Windows vẫn chạy cổng 3002.

## Nếu thấy avatar mặc định

Đây là kết quả bình thường nếu chưa thêm model mới. Nếu đã có asset mới, kiểm tra `src` bắt đầu bằng `/models/` và file thật tồn tại trong `public/models/people/`. Có thể model tải lỗi định dạng hoặc GLTF thiếu tài nguyên bên ngoài. Khi lỗi, game dùng model mặc định để không làm mất phòng karaoke.

## Những gì v1.4.3 chưa tự làm

Không cung cấp avatar thương mại, không tự tải model có bản quyền, không đảm bảo mọi file `.vrm` được rig/biểu cảm đúng; chưa tự retarget animation từ một nhân vật khác rig vào GLB mới. Với file model đẹp nhưng chưa rig, bạn vẫn cần chuẩn bị animation trong Blender hoặc phần mềm tương đương.
