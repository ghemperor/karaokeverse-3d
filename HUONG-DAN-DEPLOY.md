# Deploy KaraokeVerse v1.3 lên Render/GitHub

## Nếu đã có KaraokeVerse v1.2.5 chạy trên Render

1. Tải file `KaraokeVerse-v1.3-GitHub-Update.zip`.
2. Giải nén, **upload nội dung bên trong** lên repository GitHub hiện tại, **không** tạo thư mục lồng `KaraokeVerse-v1.3-GitHub-Update` trong repo.
3. Giữ nguyên đường dẫn tương ứng:

   ```text
   server.js
   package.json
   lib/battle.js
   public/app.js
   public/battle-ui.js
   public/index.html
   public/style.css
   public/scene.js
   tests/battle.test.js
   ```

4. Chọn **Commit changes** trên nhánh mà Render đang kết nối (thường là `main`).
5. Vào Render Dashboard → Web Service → Events. Nếu Auto Deploy bật, Render tự deploy. Nếu tắt: Manual Deploy → Deploy latest commit.
6. Khi Render hiển thị **Live**, truy cập `https://TEN-WEBSITE.onrender.com/health` để xem `{ "ok": true }`.
7. Trên game, tải lại bằng **Ctrl + Shift + R**; trên điện thoại đóng tab và mở lại đường link.
8. Mời tối thiểu 3 thiết bị vào cùng phòng, bắt đầu Solo 1v1 và nhờ người thứ ba bầu chọn. Kiểm tra kết quả hiện đồng thời trên tất cả thiết bị.

**Không cần thay đổi** `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` nếu micro của v1.2.5 đã hoạt động. Không đưa các biến này hoặc `.env` chứa secret lên GitHub.

## Nếu GitHub hiện chưa có file `lib/battle.js`

**Phải upload cả file mới**, không chỉ thay `server.js`, để tránh lỗi `ERR_MODULE_NOT_FOUND` như lần trước.

## Nếu chạy local trên Windows

- Mặc định cổng `3002`, mở file `CHAY-TREN-WINDOWS.bat`.
- Cổng khác: CMD trong thư mục dự án → `CHAY-TREN-WINDOWS.bat 3003`.
- Để bật microphone từ thiết bị khác qua Internet, dùng HTTPS/Render và TURN hoạt động.

## Những việc cần kiểm thử trên Render

- Chủ phòng cấu hình được đội và số vòng; thành viên thường không có quyền bắt đầu, chuyển giai đoạn, hủy.
- Hai ca sĩ luân phiên theo thứ tự A → B; bảng biểu diễn và spotlight cùng đổi.
- Khi mở bình chọn: thành viên đủ quyền bầu đúng một phiếu, phiếu và đồng hồ 45 giây được đồng bộ.
- Khi đóng: điểm ở tất cả thiết bị giống nhau; khi hết vòng có cúp và hiệu ứng 3D.
- Các tính năng cũ YouTube, WebRTC, Auto-Tune, Mixer, Party Games, quà tặng, avatar vẫn hoạt động.
- Nếu người biểu diễn rời phòng, hệ thống đổi sang đồng đội còn lại; nếu đội hết người, trận hủy và khôi phục lượt hát thường.
- Render miễn phí có thể ngủ/chạy lại, gây mất trạng thái phòng; cần backend bền vững nếu khai thác thực tế.

## Sự cố thường gặp

- **Cannot find module `./lib/battle.js`** → file mới chưa upload đúng thư mục `lib/`.
- **Không thấy giao diện Battle** → Render chưa deploy commit mới hoặc trình duyệt vẫn cache JS/CSS.
- **Chủ phòng không bấm được Battle** → chưa vào phòng hoặc danh sách đội chưa chọn đủ hai bên.
- **Không thể bình chọn** → chưa đến giai đoạn bầu, đã bầu trước đó hoặc bạn là một trong hai ca sĩ vừa biểu diễn vòng này.
- **Có 2 người và không có điểm** → cả hai là ca sĩ, cần ít nhất một khán giả để chấm.
- **Không có âm thanh** → kiểm tra quyền microphone / Open Mic / TURN. Battle chỉ thay đổi lượt hát, không điều khiển micro vật lý.
- **Bảng điểm mất sau deploy** → trạng thái đang lưu RAM, restart sẽ làm mất phòng và trận đấu.

## Bảo mật

Một credential TURN cố định sẽ bị lộ nếu phát thẳng qua `/config`; nên cấu hình TURN credentials ngắn hạn, có giới hạn và xoay vòng. Không chia sẻ public JSON chứa credentials. Luật tính điểm ở server giúp tránh gian lận phiếu ở mức MVP, nhưng chưa có xác thực tài khoản chống việc một người mở nhiều phiên truy cập và bỏ phiếu nhiều danh tính.
