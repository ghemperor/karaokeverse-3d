# KaraokeVerse 3D v1.4 — AVATAR STUDIO & CINEMATIC

**Bản nâng cấp trực tiếp từ v1.3 Battle Arena**, giữ Node.js + Express + Socket.IO, Three.js (ES modules CDN), WebRTC, YouTube IFrame API, Karaoke Mixer Pro và Auto-Tune Lab.

## Tính năng mới

1. **Avatar Studio:** nhấn `✨ Avatar Studio` ở màn hình vào phòng hoặc dưới sân khấu. Tùy chỉnh **màu da, tóc, áo, quần, giày, kiểu tóc (3 mẫu), phụ kiện (không/kính/tai nghe), dáng người (3 mẫu)**; xem trước GLB 3D và xoay bằng chuột hoặc cảm ứng. Nút Thử nhảy chạy clip `dance` trên preview.
2. **GLB thực có animation:** `public/models/karaoke-avatar.glb` là asset **tự xây dựng**, không tải từ kho mô hình bên ngoài; ~23 KB, nhiều vật thể hình học đơn giản, 10 embedded keyframe clips `idle`, `walk`, `sit`, `sing`, `dance`, `wave`, `clap`, `cheer`, `bow`, `heart`. Sử dụng **GLTFLoader + AnimationMixer** để nạp và chuyển clip mượt. Là animation theo node hierarchy, **chưa phải skinned-character hoặc motion-capture**. Giữ nhân vật low-poly procedural từ v1.3 làm **fallback** nếu GLB tải lỗi.
3. **Emotes mở rộng:** vẫy tay, vỗ tay, nhảy, đứng, cổ vũ, cúi chào và thả tim. Hành động được báo tới người chơi khác bằng Socket.IO.
4. **Multiplayer avatar appearance:** backend xác thực palette hợp lệ (`avatar:update`) và đồng bộ `user:avatar` cho tất cả người trong cùng phòng. Người mới tham gia thấy thiết kế hiện tại của mọi người từ `room:state`. Không thể nhập đường dẫn GLB hay URL từ client qua sự kiện này.
5. **Camera cinematic:** nhấn `🎬 Cinematic` trên thanh góc quay để xem ba góc quay thay đổi luân phiên: cận người đang hát, khu vực khán giả và toàn cảnh sân khấu. Nhấn các góc khác để dừng.
6. **Lưu tùy chọn:** dùng localStorage trên **thiết bị/trình duyệt hiện tại**. Chưa có tài khoản và cloud-sync, nên khi đổi thiết bị hoặc xóa dữ liệu trình duyệt sẽ phải chọn lại avatar.

### Giữ nguyên v1.3

- Solo/Team Battle, bảng điểm/vòng thi/voting và trao giải.
- Party Games: vòng quay, thử thách, truyền lượt hát và bình chọn.
- Quà tặng ảo 3D, tương tác đồ vật, phòng có nhiều người, ngồi sofa và đứng dậy cạnh ghế.
- Youtube embed, hàng chờ và đồng bộ trạng thái phát.
- Micro WebRTC qua STUN/TURN, Auto-Tune Lab, Karaoke Mixer Pro (Echo/Reverb/EQ), chat, emoji, ánh sáng và disco.

## Khởi chạy Windows

Cài Node.js LTS 22. Giải nén rồi chạy `CHAY-TREN-WINDOWS.bat` và mở `http://localhost:3002`.
Nếu cổng 3002 đã bị chiếm, dùng CMD trong thư mục dự án: `CHAY-TREN-WINDOWS.bat 3003`.

Từ terminal:

```bash
npm install
npm run check
npm start
```

`PORT=3002 npm start` trên Linux/Mac; với PowerShell: `$env:PORT=3002; npm start`.

**Internet:** giao diện Three.js đang import từ CDN qua importmap; cần mạng để tải thư viện. Video YouTube cần cho phép nhúng. GLB avatar được phục vụ từ chính Node server (`/models/karaoke-avatar.glb`), không phụ thuộc kho asset khác.

## Kiểm thử v1.4

Trước khi mở phòng cho bạn bè, kiểm tra tuần tự:

1. Mở Avatar Studio ở màn hình chào. Xem avatar 3D, xoay, thử nhảy, đổi 2–3 màu và nhấn Hoàn tất.
2. Tạo phòng A, mời thiết bị B bằng link. Ở A đổi màu áo/tóc — trên B phải đổi đúng sau khi sự kiện Socket.IO được nhận.
3. A bật camera Theo nhân vật, đi WASD; B nhìn nhân vật A di chuyển và hoạt ảnh đi bộ.
4. A ngồi sofa, đứng dậy tại ghế, đăng ký hát và thử tư thế cầm micro; B xem hoạt ảnh hát.
5. Thử emote Cổ vũ/Cúi chào/Thả tim; các màn hình phải cùng thấy.
6. Chọn Cinematic, kiểm tra đổi góc quay; chuyển sang Xoay 360° để thoát.
7. Thử YouTube, micro 2 mạng, Auto-Tune, Echo/Reverb, Party Games, Quà tặng và 1 trận Battle.
8. F5 tải lại trang: ngoại hình trên trình duyệt đó được giữ, nhưng phòng có thể cần tham gia lại.

**Giới hạn kiểm chứng:** đã chạy tests Node, kiểm tra cấu trúc GLB qua parser/trimesh và cú pháp; **chưa kiểm thử chất lượng hoạt ảnh và WebGL trên thiết bị thật, cũng chưa kiểm thử nhiều trình duyệt với Render/TURN**. Không thể đảm bảo hoạt ảnh hoàn toàn tự nhiên trên mọi thiết bị.

## Deploy Render đã có sẵn

Xem `HUONG-DAN-DEPLOY.md`. Để cập nhật từ v1.3, giải nén **KaraokeVerse-v1.4-GitHub-Update.zip**, upload **cả thư mục** lên GitHub và giữ nguyên đường dẫn; đặc biệt phải có `public/models/karaoke-avatar.glb`, `public/avatar-studio.js`, `public/avatar-profile.js`, `public/avatar-materials.js`. Sau commit, Auto Deploy (nếu bật) sẽ chạy. Tải mới bằng Ctrl+Shift+R.

Không có biến môi trường mới. Giữ ba biến `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD` trên Render (đừng đưa vào GitHub). Mã cũ vẫn công khai TURN credentials cố định thông qua `/config`; trước khi ra mắt công khai lâu dài nên dùng TURN credentials ngắn hạn hoặc LiveKit SFU. Render restart làm mất phòng vì chưa có DB.

## Tùy biến asset GLB

- Asset gốc do script `scripts/build-avatar-glb.py` tạo bằng `trimesh` và `numpy` (phụ thuộc chỉ ở bước **tạo model**, không cần trên web server). Script dựng hình khối, cấu trúc node và clip animation, xuất GLB tự chứa.
- Khi thay bằng GLB riêng, phải đảm bảo tên clip tương ứng (`idle`,`walk`,`sit`,`sing`,...) và đối tượng có tên tương ứng (`Head`, `Mic`, `OutfitBody`, `HairBangs`, ...), hoặc sửa `public/avatar-materials.js` và `scene.js`.
- Chưa hỗ trợ người chơi upload tệp GLB tùy ý để chia sẻ với các thành viên. Việc đó cần hệ thống lưu trữ và kiểm soát nội dung/định dạng tập tin.

## Bảo mật / vận hành

Room/avatar state lưu RAM, người chơi tự chọn biệt danh, không có xác thực tài khoản. Profile được giới hạn theo palette trên server; không lưu dữ liệu nhạy cảm, không tự bật mic. WebRTC P2P có thể cần TURN trên các mạng NAT; phòng đông nên chuyển SFU.

© Demo KaraokeVerse. Model GLB trong gói do script đi kèm tự tạo. Các thư viện thứ ba theo giấy phép tương ứng.
