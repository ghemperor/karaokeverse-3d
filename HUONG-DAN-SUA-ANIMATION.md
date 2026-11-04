# KaraokeVerse v1.4.3.1 — Sửa nhân vật tự phát animation

**Đã sửa lỗi cụ thể:** Bản v1.4.3 trước đây coi animation đầu tiên trong GLB là `idle` nếu thiếu clip tên Idle, nên có thể khiến nhân vật tự nhảy/chạy ngay cả khi đứng yên. Bản này chỉ chạy clip nếu tên hoặc `animationAliases` khớp hành động thực tế; chuyển sang hành động không có clip sẽ tắt clip cũ, thay vì tiếp tục lặp. Đây không phải animation retargeting.

## Cập nhật GitHub/Render

1. Dùng **KaraokeVerse-v1.4.3.1-GitHub-Animation-Fix.zip**. Upload 3 file `public/avatar-catalog.js`, `public/avatar-runtime.js`, `public/avatar-studio.js` (và test tùy chọn) vào GitHub đúng đường dẫn.
2. **Không ghi đè `public/models/avatar-catalog.json` của bạn.** File này chứa các đường dẫn model GLB đã tải lên và cấu hình riêng của bạn.
3. Commit nhánh `main`, Render Auto Deploy. Khi Live, dùng `Ctrl+Shift+R` để làm mới.
4. Mở Avatar Studio; xem danh sách clip và mục thiếu ánh xạ. Mở F12 → Console để xem `GLB animation clips` và `Game action mapping`.

## Ánh xạ animation theo tên thực tế

Mở `public/models/avatar-catalog.json` và chỉnh **chính xác tên clip trong model của bạn** ở trường `animationAliases`. Giữ nguyên các mục khác. Ví dụ (chỉ minh họa):

```json
"animationAliases": {
  "idle": ["Idle", "Breathing"],
  "walk": ["Walk", "Walking", "Armature|Walk"],
  "run": ["Run"],
  "sit": ["Sit", "Sitting"],
  "sing": ["Sing", "Singing"],
  "dance": ["Dance", "Dancing"],
  "wave": ["Wave", "Waving"],
  "clap": ["Clap", "Clapping"],
  "cheer": ["Cheer"],
  "bow": ["Bow"],
  "heart": ["Heart"],
  "pose": ["Pose"]
}
```

Nếu GLB chỉ chứa một clip `Take 001` hoặc `Action`, bạn **không thể** biến clip đó thành mọi chuyển động. Cần tạo/ghép các clip riêng cho Idle, Walk, Sit, Sing, Dance bằng Blender/Mixamo rồi xuất lại GLB. Chỉ ánh xạ `Take 001` cho đúng hành động tương ứng, không ánh xạ chung cho mọi thao tác.

## Kiểm tra

- Không bấm gì: Idle, hoặc tư thế đứng yên nếu chưa có clip Idle.
- WASD: Walk hoặc Run (nếu có clip); nếu chưa có clip nhân vật chỉ di chuyển vị trí, không giả chạy bằng clip khác.
- Ngồi sofa: Sit (nếu GLB có clip tương ứng).
- Đăng ký hát: Sing (nếu có).
- Emote Nhảy: Dance (nếu có).

Lưu ý: Chưa được thử với file GLB tùy chỉnh của bạn, vì file đó chưa được gửi trong cuộc trò chuyện. Nếu vẫn tự nhảy, hãy gửi file GLB để kiểm tra tên clip và skeleton thực tế. Test Node không thay thế kiểm thử WebGL trên máy thật.
