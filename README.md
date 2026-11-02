# KaraokeVerse 3D v1.2.3 — Karaoke Mixer Pro + Auto-Tune (beta)

## Nâng cấp 1.2.3: Bàn mixer karaoke chuyên nghiệp

- **Micro:** gain ±12 dB, EQ Bass/Mid/Treble ±12 dB, compressor, âm lượng micro gửi đi.
- **Echo:** thời gian trễ 70–600 ms, độ lặp feedback giới hạn 0–55%, âm lượng echo 0–60%.
- **Reverb:** 3 kiểu phòng (nhỏ/vừa/hội trường) và mức vang 0–60%. Reverb tổng hợp từ impulse response 2 kênh.
- **5 preset giọng hát:** Tự nhiên, Ballad, Bolero, Pop/EDM, Trò chuyện; tùy chỉnh trực tiếp và tự lưu trên trình duyệt.
- **Loa/nhạc:** điều chỉnh riêng âm lượng video YouTube (tại máy người nghe) và voice chat nhận từ người khác. Có lựa chọn loa/headphone *cho luồng voice chat WebRTC*, phụ thuộc vào khả năng `HTMLMediaElement.setSinkId()` của trình duyệt. YouTube iframe không đổi loa riêng qua giao diện này.
- **Chọn micro đầu vào:** có thể đổi micro khi đang hát, sử dụng `replaceTrack` để giữ kết nối WebRTC.
- **Nghe thử mic qua tai nghe** mặc định TẮT; bật có thể hú/rít nếu dùng loa ngoài.
- **Âm thanh xử lý gửi sang thành viên khác:** `getUserMedia → Auto-Tune AudioWorklet (nếu có) → EQ → compressor → dry + echo + reverb → limiter → MediaStreamDestination → WebRTC`. Không lấy, ghi lại hay xử lý audio từ YouTube.
- **Tương thích:** Khi Auto-Tune AudioWorklet không khả dụng, các hiệu ứng còn lại vẫn hoạt động qua Web Audio; nếu Web Audio không khả dụng, micro gốc được gửi đi với thông báo.
- **Tất cả mức chỉnh mixer là cài đặt cá nhân** và không thay đổi âm thanh micro của người khác, không lưu trên server.

### Cách sử dụng

1. Vào phòng và mở **🎚 MIXER KARAOKE PRO** phía dưới nút micro.
2. Chọn preset Ballad / Bolero / Pop hoặc tự kéo thanh Bass/Mid/Treble, Echo, Reverb.
3. Chọn micro và loa (nếu trình duyệt cho phép), rồi bật micro (Open Mic).
4. Nhờ thành viên khác nghe thử và phản hồi vì chế độ tự nghe micro mặc định tắt để tránh hú.
5. Chọn âm lượng Nhạc YouTube và Giọng bạn bè riêng cho thiết bị của bạn.

**Lưu ý:** Echo và Reverb có thể tăng cảm nhận độ trễ/tiếng vọng. Hãy dùng tai nghe, bắt đầu với Echo Mix khoảng 10–25%, Feedback dưới 30%, Reverb dưới 25%. Đây là bộ effect dựa trên Web Audio, không phải thiết bị DSP chuyên nghiệp hay tính năng tách vocal/nhạc của YouTube. Việc chọn loa đầu ra có thể không được hỗ trợ trên Safari và một số trình duyệt.

**Deploy:** Thay *toàn bộ* nội dung bản v1.2.2 trên GitHub bằng gói v1.2.3, trong đó bắt buộc có `public/audio-mixer.js` cùng `public/app.js`, `public/index.html`, `public/style.css`. Giữ nguyên các biến TURN trong Render. Commit trên nhánh kết nối; Auto Deploy On Commit sẽ tạo bản mới.

---

# Ghi chú từ v1.2.2 — Auto-Tune Lab (beta)

Phiên bản nâng cấp từ **v1.2.1-deploy**, giữ nguyên không gian 3D Three.js, nhân vật, phòng online, hàng chờ YouTube, chat, Socket.IO, voice chat WebRTC và sửa lỗi cầm micro / đứng dậy gần ghế.

## Mới ở v1.2.2

- **Auto-Tune cho micro** (mặc định **tắt**): bật trước hoặc sau khi mở micro.
- **Chọn tông (Key):** C, C♯, D, D♯, E, F, F♯, G, G♯, A, A♯, B.
- **Âm giai:** Chromatic, Major, Minor, Pentatonic.
- **Độ mạnh:** 0–100%; **tốc độ hiệu chỉnh:** 15–250 ms; **tỷ lệ hiệu ứng:** 0–100%.
- **Hiển thị nốt nhận diện → nốt mục tiêu**, không lưu bản ghi âm.
- **Người khác nghe giọng đã xử lý**: `getUserMedia → MediaStreamAudioSourceNode → AudioWorklet → MediaStreamDestination → RTCPeerConnection`; không lấy nhạc YouTube vào effect.
- **Hỗ trợ fallback:** nếu trình duyệt không chạy được AudioWorklet, micro vẫn gửi giọng gốc và có thông báo rõ ràng.
- Toàn bộ cài đặt Auto-Tune **cá nhân**, lưu trong `localStorage` của trình duyệt; không đồng bộ tới thành viên khác. Khi micro tắt, cả track đầu vào lẫn đầu ra bị mute.

### Sử dụng

1. Vào phòng và mở mục **✨ AUTO-TUNE LAB** ngay dưới thanh micro.
2. Bật **Chỉnh cao độ giọng hát**.
3. Chọn **Key/Scale của bài hát** (theo bài bạn đang hát; game không tự phân tích tông từ YouTube).
4. Đặt thử **Độ mạnh 60–85%**, **Tốc độ 80–120 ms**, **Mix 70–100%**; chỉnh tùy cảm nhận.
5. Bấm **Bật micro** và cấp quyền; người khác trong phòng sẽ nghe giọng qua bộ xử lý nếu trình duyệt hỗ trợ. Nên dùng **tai nghe**.
6. Khi không cần Auto-Tune, bỏ chọn **Bật chỉnh cao độ**; luồng micro trở về âm thanh gốc.

### Những giới hạn kỹ thuật cần biết

Đây là **pitch-correction beta cho giọng đơn âm**, sử dụng bộ dò tần số cơ bản kiểu YIN và dịch cao độ bằng delay line hai đầu đọc có crossfade. Không có cùng chất lượng với Auto-Tune thương mại, có thể nghe âm thanh không tự nhiên, xuất hiện artifacts/glitch và tăng độ trễ. Micro thu tiếng ồn, nhiều người hát chung một mic, hoặc đặt sai Key/Scale sẽ khiến kết quả kém. AudioWorklet cần ngữ cảnh bảo mật (**HTTPS** hoặc **localhost**) và trình duyệt hỗ trợ.

**Đã kiểm tra:** `npm run check`, gồm 18 bài kiểm thử logic và DSP mô phỏng với sóng sin; cú pháp JS hợp lệ. **Chưa kiểm chứng** âm thanh giữa hai thiết bị hay kiểm tra tai nghe/giọng hát thực tế trong trình duyệt: cần tự thử trên máy và Render. Chạy browser test trực tiếp trong môi trường phát triển bị giới hạn. Không tuyên bố đã kiểm thử chất lượng Auto-Tune thực tế.

## Chạy và deploy

- Windows: mở `CHAY-TREN-WINDOWS.bat`, truy cập `http://localhost:3002`. Hoặc CMD: `CHAY-TREN-WINDOWS.bat 3003`.
- GitHub: **upload toàn bộ nội dung** thư mục dự án, đặc biệt `lib/`, `public/autotune-math.js`, `public/autotune-processor.js`, `public/app.js`, `public/index.html`, `public/style.css` và `package.json`.
- Render: Web Service Node, Build `npm install`, Start `npm start`, Auto Deploy On Commit. Node 22 qua `.node-version`. Kiểm tra `/health` sau khi deploy.
- Không cần thêm API key hay thư viện npm riêng cho Auto-Tune; cả bộ DSP xử lý ở phía trình duyệt của người dùng.

---

# Tham khảo: ghi chú phiên bản v1.2.1 (đã tích hợp)

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


## Hướng dẫn deploy lên Internet

Xem [HUONG-DAN-DEPLOY.md](HUONG-DAN-DEPLOY.md) và cấu hình mẫu [render.yaml](render.yaml).
