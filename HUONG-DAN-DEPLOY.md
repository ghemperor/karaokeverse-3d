# Cập nhật KaraokeVerse 3D v1.2.4 lên Render từ GitHub

**Dành cho repository đã chạy KaraokeVerse v1.2.3 và có TURN Metered cấu hình trong Render.**

1. Sao lưu nhánh `main` (hoặc tải ZIP repository) trước khi cập nhật.
2. Giải nén `KaraokeVerse-v1.2.4-GitHub-Update.zip` và upload các **file bên trong** lên cùng vị trí tương ứng tại repository GitHub của bạn (ghi đè phiên bản cũ).
3. Kiểm tra trong GitHub: `server.js` và `package.json` ở gốc; `lib/party-games.js` ở `lib/`; `party-ui.js`, `party-wheel.js`, `party-data.js`, `app.js`, `style.css`, `index.html` ở `public/`.
4. Commit lên nhánh Render đang theo dõi. Nếu Auto Deploy bật, Render sẽ tự triển khai; nếu không, vào Render → Manual Deploy → Deploy latest commit.
5. **Không xóa hoặc chỉnh lại** biến TURN của Metered trừ khi bạn cần thay credential. `/config` có thông tin TURN nhạy cảm, không chia sẻ nguyên JSON.
6. Đợi Render Live, mở `/health` kiểm tra `ok:true`, rồi mở website và `Ctrl + Shift + R`.
7. Kiểm thử với 2 thiết bị: Host bấm Quay, máy khác cũng phải thấy cùng kết quả; bình chọn mỗi người 1 lần; truyền lượt hát không tự bật mic; Youtube/Autotune/Mixer vẫn sử dụng được.

Không cần khai báo biến môi trường mới cho Party Games. Port mặc định local vẫn `3002`; trên Render sử dụng `PORT` do Render cấp.

---

# Deploy KaraokeVerse v1.2.3 – Karaoke Mixer Pro

- Upload toàn bộ nội dung ZIP lên GitHub và xác minh có `public/audio-mixer.js`, `public/app.js`, `public/index.html`, `public/style.css`, `public/autotune-processor.js`, `lib/`.
- Trên Render giữ dịch vụ Web Service Node.js hiện tại, **không xóa** các biến `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD`. Không tải các file `.env` có mật khẩu lên GitHub.
- Commit lên nhánh đang kết nối với Render (thường `main`), sau đó theo dõi Events/Logs để thấy deploy mới Live. Nếu không tự chạy, Manual Deploy → Deploy latest commit.
- Tải mới website bằng Ctrl+Shift+R. Kiểm tra có mục **🎚 MIXER KARAOKE PRO** nằm trên Auto-Tune Lab.
- Tạo phòng với 2 thiết bị ở 2 mạng khác nhau, dùng tai nghe; bật micro. Người kia phải nghe giọng sau xử lý Echo/Reverb.
- Kiểm tra âm lượng video YouTube trên mỗi thiết bị; đổi preset không ảnh hưởng đến nhạc Youtube, chỉ micro gửi đi.
- Nếu browser không hiện thiết bị loa, dùng thiết bị mặc định hệ thống. `setSinkId()` không điều khiển đầu ra YouTube iframe.
- Để bảo mật, thay credential TURN đã từng xuất hiện trong ảnh/chat; với production nên dùng credential ngắn hạn thay vì password cố định trong `/config`.
- Local Windows: `CHAY-TREN-WINDOWS.bat` (port 3002) hoặc `CHAY-TREN-WINDOWS.bat 3003`.

## Kiểm thử
Chạy `npm run check` và kiểm tra trong Chrome/Edge. Bộ test DSP không thay thế kiểm thử tai nghe và kết nối hai người thật.

---

# Cập nhật KaraokeVerse v1.2.2 có Auto-Tune lên GitHub / Render

Đây là bản nâng cấp của gói deploy v1.2.1, không phải dự án khác. Nếu bạn đã kết nối GitHub với Render, hãy thay thế/cập nhật **các file cùng đường dẫn** trong repository hiện tại (lưu ý **upload đầy đủ thư mục `lib/`**; đây là thư mục `server.js` đang import và trước đó từng bị thiếu).

1. Giải nén `KaraokeVerse-3D-v1.2.2-autotune.zip`.
2. Upload toàn bộ **nội dung bên trong** thư mục `KaraokeVerse-3D-v1.2.2-autotune` lên thư mục gốc GitHub (`package.json` nằm ngang hàng `server.js`).
3. Xác nhận `public/autotune-processor.js`, `public/autotune-math.js`, `public/app.js`, `lib/validation.js` đều hiện trên GitHub.
4. Chọn **Commit changes** (nhánh đang kết nối Render, thường là `main`).
5. Nếu Auto-Deploy đã bật, Render tự lấy commit mới; nếu không, chọn **Manual Deploy → Deploy latest commit**.
6. Mở `https://TEN-DICH-VU.onrender.com/health`. Sau đó mở game bằng URL HTTPS, tham gia phòng, mở Auto-Tune Lab, bật micro và thử với người khác.

Nếu nghe **giọng gốc** sau khi bật Auto-Tune, kiểm tra thông báo trong Auto-Tune Lab và console (F12). Trình duyệt không hỗ trợ hoặc audio worklet gặp lỗi sẽ **tự fallback về micro gốc**. Hai người ở các mạng NAT khó có thể vẫn cần TURN/WebRTC ngoài phạm vi tính năng này.

---

# Đưa KaraokeVerse 3D v1.2.1 lên Internet (GitHub + Render)

Hướng dẫn dành cho mã nguồn trong thư mục này. Nhà cung cấp có thể thay đổi giao diện/trang giá; hướng dẫn mô tả quy trình thông dụng, không cam kết gói miễn phí hay tính sẵn có hiện tại.

## Điều cần nhớ

- **Deploy toàn bộ dự án Node.js**, không chỉ tải thư mục `public/` lên hosting tĩnh: Socket.IO, chat, phòng, điều khiển YouTube và signaling WebRTC nằm trong `server.js`.
- `server.js` tự đọc `process.env.PORT` và lắng nghe trên `0.0.0.0`, không phải đổi port 3002 trong bản chạy Windows khi deploy.
- Client dùng `window.io()` chung origin và link mời dùng `location.origin`, nên **không cần sửa URL trong `public/app.js`** khi server và client cùng một Web Service.
- Máy chủ này lưu phòng trong RAM. Chỉ chạy **1 instance**; không bật autoscale/horizontal scaling. Sau restart/deploy, phòng/playlist/chat đang hoạt động biến mất.
- Mỗi phòng tối đa **8 người**, WebRTC là kiểu **mesh** (mỗi máy kết nối trực tiếp với các máy khác). Đó không phải hệ thống đông người hay bảo đảm voice trên mọi NAT/firewall.

## A. Đưa code lên GitHub (cách giao diện)

1. Đăng nhập [GitHub](https://github.com/) và chọn **New repository**.
2. Tên gợi ý: `karaokeverse-3d` và có thể đặt **Private**.
3. Tạo kho trống, **không** chọn tạo sẵn README/.gitignore (trong mã nguồn đã có).
4. Chọn **Add file > Upload files**, kéo **nội dung bên trong** thư mục `KaraokeVerse-3D-v1.2.1-deploy` lên repo (không upload nguyên ZIP). Đảm bảo `server.js`, `package.json`, `public/`, `lib/`, `render.yaml` nằm ở cấp gốc repository.
5. Chọn **Commit changes**.
6. Không upload `.env`, khóa API hay mật khẩu. File `.env.example` chỉ là mẫu.

Nếu upload một loạt thư mục bằng trình duyệt gặp khó khăn, dùng Git trong Terminal:

```bash
git init
git add .
git commit -m "Deploy KaraokeVerse v1.2.1"
git branch -M main
git remote add origin https://github.com/TEN-TAI-KHOAN/karaokeverse-3d.git
git push -u origin main
```

## B. Tạo Web Service trên Render

1. Đăng nhập [Render](https://dashboard.render.com/) và kết nối GitHub (chỉ khi bạn đồng ý cấp quyền).
2. Tạo **New > Web Service** (đừng chọn Static Site).
3. Chọn repository `karaokeverse-3d`, nhánh `main`.
4. Chọn runtime/language **Node**.
5. Thiết lập:
   - Root directory: **để trống** nếu source nằm ở gốc repo.
   - Build command: `npm install --no-audit --no-fund`
   - Start command: `npm start`
   - Health check path (nếu có): `/health`
   - Environment variable: `NODE_ENV=production`
   - Node 22 được gợi ý bằng `.node-version`.
6. Chọn instance/plan có hỗ trợ WebSocket/HTTPS theo nhu cầu và điều khoản của nhà cung cấp. Duy trì **1 instance**.
7. **Không đặt `PORT=3002` ở Render**. Mã nguồn nhận port dịch vụ cấp qua `process.env.PORT`.
8. Nhấn **Deploy/Create Web Service**, chờ trạng thái **Live** (thời gian tùy môi trường).

Nếu dùng Render Blueprint từ `render.yaml`, chọn tạo Blueprint từ repo, kiểm tra lại cấu hình và đặc biệt là plan, quyền GitHub trước khi bấm deploy.

## C. Kiểm tra link công khai và gửi bạn bè

- Mở URL thực tế do Render cấp, ví dụ **https://TEN-DICH-VU.onrender.com**.
- Mở **https://TEN-DICH-VU.onrender.com/health**: kỳ vọng JSON có `"ok": true`.
- Thiết bị A tạo phòng, bấm **Sao chép link mời**.
- Thiết bị B (khác mạng, ví dụ điện thoại dùng 4G/5G) mở link và nhập tên, chọn Join Room nếu chưa tự vào.
- Kiểm tra chat, avatar di chuyển, playlist và YouTube, sau đó **cả hai đeo tai nghe** và bật micro để kiểm tra WebRTC.
- Nếu trình duyệt chặn autoplay video, mỗi người bấm nút phát trên màn hình riêng.

## D. Âm thanh WebRTC và TURN

- Trang HTTPS cho phép trình duyệt hỏi quyền micro; `localhost` dùng để thử máy cá nhân.
- Client hiện sử dụng WebRTC **mesh + STUN**. Một số nhà mạng/NAT/firewall sẽ làm voice không kết nối được dù chat và game vẫn hoạt động.
- Có thể thử TURN bằng cách thiết lập `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` trong **Environment** của Web Service, rồi redeploy; nhưng code hiện đưa những thông tin này cho trình duyệt qua `/config` (đúng quy trình ICE), do đó **không dùng tài khoản TURN cố định, quyền rộng, dài hạn** trên trang công khai. Để vận hành thật, nâng cấp sang thông tin TURN giới hạn thời gian hoặc LiveKit/SFU có quản lý token.
- Không có cách bảo đảm đồng bộ nhạc YouTube ở độ trễ phù hợp hát hòa giọng tuyệt đối giữa các máy. Video YouTube có thể bị chặn embed, hiện quảng cáo khác nhau hoặc cần thao tác phát riêng.

## E. Lỗi thường gặp

| Triệu chứng | Cần kiểm tra |
| --- | --- |
| `Application failed to respond`/502 | Render logs; `npm start`; repo chứa `server.js`; biến `PORT` tự động |
| `/health` không trả JSON | Sai loại hosting, chưa deploy thành công, hoặc cấu trúc thư mục sai |
| WebSocket disconnect | Sử dụng Web Service, không deploy tĩnh; chỉ 1 instance; xem Logs/Network |
| `NotAllowedError` khi bật micro | Link HTTPS, cấp quyền trình duyệt, đóng ứng dụng đang chiếm micro |
| Có chat nhưng không nghe micro | Thử 2 tai nghe, quyền micro, autoplay, Wi-Fi/4G; có thể cần TURN |
| Phòng biến mất | RAM reset khi service restart/deploy; bản MVP chưa có database |
| Một số video YouTube không phát | Chủ sở hữu cấm nhúng, autoplay bị chặn, quảng cáo/sự cố YouTube |
| Link mời chứa localhost | Người tạo phòng phải mở website công khai trước khi bấm sao chép link |

## F. Trước khi chia sẻ quy mô lớn

- Chuyển room/queue/chat sang kho dữ liệu bền vững, định nghĩa chính sách quyền riêng tư.
- Bảo vệ chống spam/DoS cho việc tạo phòng và kết nối; có kiểm soát nội dung cơ bản.
- Bổ sung token truy cập phòng/quản trị Host thay vì chỉ dựa trên Socket.IO session đang hoạt động.
- Nâng cấp voice sang SFU/LiveKit và TURN credential ngắn hạn.
- Giám sát CPU, RAM, WebSocket connections và băng thông, kiểm thử tải thực tế.

**Lưu ý kiểm chứng:** bản mã nguồn đã qua kiểm tra logic (`npm run check`), nhưng chưa được triển khai và thử nghiệm end-to-end với nhiều máy trên dịch vụ hosting trong môi trường tạo gói. Một số tính năng yêu cầu cấu hình mạng và kiểm thử thực tế.
