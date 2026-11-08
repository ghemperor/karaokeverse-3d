# KaraokeVerse — Phím V chuyển nhanh góc nhìn (v1.4.3.2)

## Điều khiển

- **V**: chuyển sang góc nhìn kế tiếp theo thứ tự Sân khấu → Toàn phòng → Xoay 360° → Góc mắt → Theo nhân vật → Xem TV → Cinematic.
- **Shift + V**: chuyển ngược lại.
- **F**: bật/tắt fullscreen; **Esc**: thoát fullscreen (trình duyệt).
- **WASD**, **Shift**, **E**: vẫn hoạt động trong góc nhập vai, không thay đổi cách di chuyển và tương tác.
- **Nút V góc trên bên phải của phòng 3D**: chuyển góc bằng chuột/chạm, kể cả khi fullscreen (hữu ích với điện thoại hoặc khi video YouTube nhận focus bàn phím).
- Khi đang gõ nội dung trong chat, nhập link YouTube, hoặc mở Avatar Studio, V sẽ không chuyển góc. Ctrl+V (dán) vẫn bình thường.

## Cập nhật trên GitHub + Render

1. Giải nén file `KaraokeVerse-v1.4.3.2-GitHub-View-Update.zip`.
2. Trong kho GitHub hiện tại, giữ nguyên các model bạn đã nhập ở `public/models/people/` và file `public/models/avatar-catalog.json`.
3. Chỉ upload các tệp trong ZIP, bảo toàn các đường dẫn `public/` và `tests/`. Commit lên nhánh `main`.
4. Render Auto Deploy sẽ triển khai khi bật. Đợi trạng thái Live, mở trang và tải lại bằng `Ctrl+Shift+R`.
5. Vào cùng phòng, bấm F rồi thử V nhiều lần; thử tiếp bằng nút V trong khung fullscreen.

> Nếu đang nhấp vào bên trong iframe video YouTube và phím V không được chuyển sang trang, đây là giới hạn focus iframe của trình duyệt. Hãy nhấp lại vùng 3D hoặc dùng nút V nổi.

## Kiểm thử

Chạy `npm run check` ở thư mục gốc nếu đã cài dependencies. Kiểm tra thao tác trong trình duyệt thật vì Node test không chứng minh được tương tác WebGL và fullscreen trên mọi thiết bị.
