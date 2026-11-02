# KaraokeVerse 3D v1.2.1 — Sửa tư thế micro & vị trí đứng dậy (Three.js)

Bản vá tiếp nối **KaraokeVerse v1.2**: không gian 3D có hai chế độ nhập vai, nhân vật nhiều khớp chuyển động, sân khấu biểu diễn, hiệu ứng ánh sáng và đồ vật tương tác được **đồng bộ Socket.IO**, cùng hệ thống phòng riêng, YouTube IFrame, chat và WebRTC micro vốn có.

> **Trạng thái kiểm chứng:** mã nguồn đã qua `npm run check` (12 bài kiểm thử logic và kiểm tra cú pháp) nhưng **chưa chạy được kiểm thử end-to-end trong trình duyệt và kiểm thử nghe gọi giữa hai thiết bị** trong môi trường tạo gói. Cần tải dependencies, kết nối Internet và tự chạy/kiểm tra trên máy hoặc máy chủ của bạn. Không coi đây là bản phát hành thương mại hoàn chỉnh.

## Thay đổi trong bản 1.2.1 (sửa theo phản hồi)

1. **Sửa động tác cầm micro**: thay tay thẳng bằng cấu trúc cánh tay hai đoạn (vai → khuỷu → cổ tay). Khi hát, tay phải gập tự nhiên phía trước ngực, micro nằm trong bàn tay và đầu micro hướng lên gần miệng. Có chuyển tiếp khớp mượt, micro chỉ hiện khi biểu diễn.
2. **Sửa lỗi đứng dậy dịch chuyển về vị trí ban đầu**: mỗi sofa có một vị trí đứng dậy riêng trong lối đi ngay cạnh ghế, không nằm trong vùng va chạm của bàn/sofa. **WASD** hoặc nút **Đứng** đều dùng cùng logic. Đổi camera không tự làm mất trạng thái đang ngồi.
3. **Sửa hướng nhìn**: hướng quay avatar theo đúng hướng di chuyển của góc nhìn nhập vai; ngồi ở sofa trái/phải sẽ hướng vào giữa phòng. Khi ngồi, hai chân đưa về phía trước thay vì xuyên ngược qua ghế.
4. Giữ các tính năng **phòng chung, YouTube, WebRTC micro, chat, hiệu ứng đèn và đồng bộ nhân vật qua Socket.IO**. Không cần thay đổi dữ liệu phòng hoặc giao thức socket.
5. Đổi **port mặc định sang 3002** theo yêu cầu gần nhất. Các port khác có thể truyền làm tham số file `.bat`.

**Kiểm tra nhanh:** vào phòng → bấm sofa trái → bấm **Đứng**: nhân vật phải xuất hiện sát sofa trái. Lặp lại với 3 sofa còn lại, rồi thử đi lại bằng WASD. Bấm **Đăng ký hát** để xem nhân vật đưa micro lên miệng trên sân khấu. Mở 2 tab để xem đồng bộ vị trí và hoạt ảnh.

> Lưu ý: ngồi trên đệm ghế làm vị trí avatar chồng lên vùng vật cản, nên khi đứng dậy nhân vật xuất hiện **tại lối đi gần đúng chiếc ghế vừa ngồi**, thay vì giữ y nguyên tọa độ bên trong đệm. Tránh hiện tượng kẹt nhân vật trong sofa.

## 1. Bắt đầu trên Windows

**Cần:** Node.js **20 trở lên**, npm, Chrome/Edge mới, Internet (cài dependency, Three.js CDN, YouTube API).

1. Giải nén `KaraokeVerse-3D-v1.2.1.zip`.
2. Nhấp đúp **`CHAY-TREN-WINDOWS.bat`**. Lần đầu chương trình sẽ `npm install`.
3. Truy cập **http://localhost:3002**.
4. Nhập tên và chọn avatar; tạo phòng, hoặc nhập mã phòng được gửi.
5. Thêm video YouTube bằng đường link vào danh sách. Chủ phòng có thể phát/dừng/chuyển bài.
6. Bấm **Bật micro** và cấp quyền. Nên sử dụng tai nghe.

**Port mặc định 3002**, vì cổng 3000 của người dùng đã có dịch vụ khác. Muốn đổi cổng, mở CMD tại thư mục và chạy:

```bat
CHAY-TREN-WINDOWS.bat 3003
```

Hoặc chạy bằng Terminal:

```bat
npm install
set PORT=3003
npm start
```

PowerShell: `$env:PORT=3003; npm start`. Với macOS/Linux: `PORT=3003 npm start`.

## 2. Tính năng giữ lại từ v1.2

| Tính năng | Cách sử dụng | Đồng bộ với các người chơi? |
|---|---|---|
| **Avatar low-poly nhiều khớp** | 8 màu áo, đầu, tóc, tay, chân, mặt, micro cầm tay; hoạt ảnh đi/ngồi/chào/vỗ tay/nhảy/hát | Có, tọa độ, góc hướng và trạng thái hoạt ảnh qua Socket.IO |
| **First-person** | Chọn **Góc mắt**; WASD di chuyển, rê/kéo chuột để quan sát, E tương tác | Vị trí và hành động được gửi đến phòng |
| **Third-person** | Chọn **Theo nhân vật**; camera ở sau avatar, theo dõi khi di chuyển | Có |
| **Xoay toàn phòng 360°** | Chọn **Xoay 360°**; kéo chuột và cuộn để quan sát | Chỉ camera cá nhân |
| **Sân khấu** | **Đăng ký hát**; người đầu tiên trở thành singer; người khác vào hàng chờ; khi tới lượt tự chuyển tới sân khấu | Có, mỗi phòng một ca sĩ chính; host có thể chuyển lượt |
| **Animation** | Bấm **Chào, Vỗ tay, Nhảy, Đứng** trên thanh dưới màn hình | Có |
| **Đèn và Party mode** | Bấm nút **Đèn**, **Party mode** hoặc nhấn vào đồ vật tương ứng | Có, thay đổi đồng thời cho thành viên trong phòng |
| **TV / Sofa / Cửa / Disco / Loa** | Chạm/nhấp vào vật hoặc ngắm vào nó, bấm **E** | Sofa/TV ảnh hưởng camera của riêng bạn; cửa, disco, đèn và loa được đồng bộ |
| **Hiệu ứng cổ vũ** | Bấm emoji cạnh khung chat | Có, xuất hiện ở mọi người và tạo particles tại sân khấu |

**Giữ từ v1.1:** phòng tối đa 8 người, link mời, danh sách nhạc chung, nhúng YouTube, host điều khiển nhạc, text chat, emoji, WebRTC voice mesh, PTT (Space), full-screen, kiểm tra dữ liệu người dùng.

### Điều khiển

- **W A S D / mũi tên:** đi trong phòng (góc mắt và theo nhân vật).
- **Shift:** di chuyển nhanh hơn.
- **Kéo chuột / vuốt:** quay camera.
- **E:** tương tác với vật đang ngắm.
- **Esc:** chuyển về chế độ xem xoay.
- **F:** bật/tắt toàn màn hình.
- **Điện thoại:** các phím điều hướng ảo xuất hiện trong chế độ nhập vai.

### Phân biệt hành động và trạng thái chia sẻ

- Vị trí avatar, pose, emoji, ca sĩ/queue, đèn, disco, cửa và đèn loa: **đồng bộ theo phòng**.
- Tùy chọn góc nhìn, xem TV gần, ngồi sofa, danh sách UI: **thao tác trên thiết bị cá nhân**. Trạng thái `sit` của avatar được đồng bộ; vị trí ngồi không có hệ thống đặt chỗ.
- Cửa chỉ là **hoạt ảnh đóng/mở**, chưa có chuyển phòng hoặc vật lý cánh cửa; vật lý/collision chủ yếu là hình chữ nhật xấp xỉ. Các tương tác đồ vật không phải hệ vật lý rigid-body hoàn chỉnh.
- Nhân vật được dựng **thủ công bằng primitives Three.js** (không có model GLB/GLTF cao cấp). Animation dùng thay đổi khớp procedural, không phải motion-capture.

## 3. Chạy và kiểm thử

```bash
npm run check
```

Chạy các kiểm tra JS và 12 test đối với URL, input, vị trí, trạng thái đồ vật và logic lượt hát.

**Kiểm thử thực tế cần làm trên 2 máy (chưa xác nhận):**

1. Thiết bị A mở app, tạo phòng và gửi link; B tham gia.
2. A chọn **Theo nhân vật**, di chuyển và nhảy; B nhìn thấy avatar A đổi tư thế.
3. A bật **Party mode**, đổi đèn và mở cửa; B thấy đồ vật đổi trạng thái tương ứng.
4. A đăng ký hát, B đăng ký tiếp; A nhường lượt, B tự động lên sân khấu.
5. Thử playlist: A thêm link YouTube và phát, B xem. Nếu trình duyệt chặn autoplay, B bấm **Bật video**.
6. A/B dùng tai nghe riêng, bật micro và thử nói chuyện qua WebRTC.
7. Kiểm tra kết nối lại, thoát phòng, quyền Host, thiết bị mobile và điều khiển cảm ứng.

## 4. Triển khai cho bạn bè ở nơi khác

`localhost` chỉ dùng trên máy chạy server. Để chia sẻ qua Internet, triển khai Node.js/Socket.IO lên VPS hoặc dịch vụ hỗ trợ WebSocket với HTTPS. Cấu hình `PORT` theo nhà cung cấp, và TURN nếu micro không kết nối được qua NAT:

```env
PORT=3002
TURN_URL=turn:turn-server.example:3478,turns:turn-server.example:5349
TURN_USERNAME=temporary-username
TURN_PASSWORD=temporary-password
```

`npm start` mặc định **không tự đọc `.env`**. Dùng biến môi trường hệ thống hoặc `node --env-file=.env server.js` trên Node 22+.

WebRTC hiện là mesh (người dùng kết nối trực tiếp nhau), chưa phải SFU; cần SFU/LiveKit, TURN credential ngắn hạn và quản lý room/database khi vận hành nhiều người. Không hỗ trợ thu âm, lưu tin nhắn lâu dài, kiểm soát nội dung nâng cao hay chuyển đổi phòng 3D có bản đồ rộng.

## 5. Giới hạn YouTube và karaoke

- Sử dụng **YouTube IFrame Player API chính thức**. Không trích xuất audio, không loại quảng cáo, không bypass chính sách nhúng.
- Video bị chủ sở hữu cấm embed sẽ không chạy; browser có thể chặn tự phát hoặc hiển thị quảng cáo khác nhau.
- Phát video là **đồng bộ best effort**, có thể có sai lệch do network buffer và quảng cáo, không bảo đảm micro và nhạc đạt độ trễ hát đồng thời tuyệt đối.
- **Voice chat không phải positional audio ở bản này**: bạn nghe người khác bằng luồng WebRTC riêng, bất kể vị trí trong phòng. Nếu muốn hiệu ứng xa gần thực sự, cần thêm bộ Web Audio spatializer.
- Room/queue/avatars đều nằm trong RAM máy chủ. Khởi động lại server sẽ làm mất trạng thái hiện tại.

## 6. Cấu trúc

```
KaraokeVerse-3D-v1.2/
├── CHAY-TREN-WINDOWS.bat
├── package.json
├── server.js                # Room, singer queue, world state, voice signalling
├── lib/
│   ├── validation.js        # URL/text validation
│   ├── position.js          # Bounded player position and pose
│   ├── world.js             # World interaction state machine
│   └── performance.js       # Singer waiting queue
├── public/
│   ├── index.html           # UI controls
│   ├── style.css            # Desktop/mobile styling
│   ├── scene.js             # Three.js 3D room, camera, avatars, gestures and effects
│   └── app.js               # Socket.IO, YT iframe, WebRTC, events
├── tests/                  # Unit tests
├── .env.example
└── README.md
```

Three.js **0.169.0 được tải từ jsDelivr CDN** bằng importmap, không đóng gói trong zip. Cần kết nối Internet để tải thư viện, YouTube API và fonts. Nếu phát hành bản thương mại nên chuyển sang Vite + npm bundle và tự lưu các asset 3D.
