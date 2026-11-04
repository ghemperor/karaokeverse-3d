# KaraokeVerse 3D v1.4.3 — Professional Avatar Pipeline

Bản này mở khóa **thay thế model avatar hiện tại bằng các model GLB/GLTF/VRM có quyền sử dụng**, cho riêng người chơi và 4 NPC (DJ Luna, Linh, Mai, Vy). Dự án **không tự đi kèm model bên thứ ba**: model mặc định v1.4.2 vẫn được dùng cho đến khi bạn thêm asset mới. Giữ toàn bộ các tính năng KaraokeVerse v1.4.2: YouTube, phòng 3D, micro/WebRTC/TURN, Mixer Pro, Auto-Tune, Party Games, Battle Arena, quà tặng, DJ và nhân viên NPC.

## Điểm mới

- Catalog tập trung: `public/models/avatar-catalog.json`. Mỗi vai trò có file model riêng, thay file không cần sửa `scene.js`.
- Nạp `.glb`, `.gltf`, `.vrm` dựa trên GLTFLoader của Three.js. **VRM được nạp ở cấp dữ liệu glTF; chưa có đủ bộ runtime đặc trưng VRM** như spring bones/look-at/expression schema. Model VRM cần kiểm thử trước khi dùng.
- Tải model được cache; dùng `SkeletonUtils.clone` để clone an toàn model có `SkinnedMesh` và xương cho nhiều người.
- Với model tùy chỉnh, tự chỉnh chiều cao và vị trí đặt chân xuống sàn; điều chỉnh hướng quay qua `yawDegrees`. Không đổi vị trí multiplayer.
- Ánh xạ tên clip animation (`Idle`, `Walk`, `Sing`, `Dance`, ...), fade giữa các clip. Rig có xương nhưng **không có animation clip** được dùng tư thế chuyển động đơn giản để tránh nhân vật bất động. Đây không phải retarget animation chuẩn cho mọi rig khác nhau.
- Gắn micro cơ bản vào xương bàn tay phải nếu model không có object tên `Mic`. Nếu model có sẵn micro thì giữ nguyên.
- Các tùy chỉnh màu có thể áp dụng cho model bên ngoài bằng `materialBindings`. Phong cách tóc/trang phục **chỉ tự động thay shape** với model mặc định có đúng các node tương thích. Model mới cần tự chuẩn bị morphs/variants nếu muốn tùy chỉnh đầy đủ.
- Tách asset DJ và nhân viên; collider tương tác NPC độc lập với tên mesh nên tương tác vẫn dùng được trên model mới.
- Avatar Studio xem đúng model player từ catalog; hiển thị đường dẫn asset đang dùng. Khi file thiếu/lỗi, fallback sang model mặc định.

## Chạy trên Windows

1. Giải nén toàn bộ thư mục, cài Node.js 20 trở lên (khuyên dùng Node 22).
2. Chạy `CHAY-TREN-WINDOWS.bat` và mở `http://localhost:3002`.
3. Muốn dùng cổng khác, mở CMD trong thư mục và chạy `CHAY-TREN-WINDOWS.bat 3003`.
4. Mở Avatar Studio, thử chọn animation Hát, Ngồi, Nhảy, Vẫy tay và xem model 360°.

## Thay model GLB chuyên nghiệp — 5 phút

**Bước 1.** Chuẩn bị model bạn được phép sử dụng. Khuyên dùng **GLB** một file đã embed texture, ở dạng đứng, có mặt và tay/chân, tốt nhất có clip `Idle`, `Walk`, `Sing`, `Sit` và `Dance`. Nếu chỉ có nhân vật không animation, game sẽ có chuyển động xương đơn giản nếu nhận diện được rig. Chuyển động chuyên nghiệp cần model có animation chất lượng hoặc retarget trước trong Blender.

**Bước 2.** Đặt file vào `public/models/people/`, ví dụ:

```text
public/
  models/
    avatar-catalog.json
    karaoke-avatar.glb            # model cũ fallback
    people/
      player.glb                  # người chơi
      dj.glb                      # DJ Luna
      linh.glb                    # NPC Linh
      mai.glb                     # NPC Mai
      vy.glb                      # NPC Vy
```

**Bước 3.** Sửa đường dẫn từng người trong `public/models/avatar-catalog.json`:

```json
{
  "version": 1,
  "models": {
    "player": {"src":"/models/people/player.glb", "height":1.85, "yawDegrees":0,
      "materialBindings":{"hair":["Hair"],"skin":["Skin"],"outfit":["Outfit"]}},
    "dj": {"src":"/models/people/dj.glb", "height":1.75, "yawDegrees":180},
    "linh": {"src":"/models/people/linh.glb", "height":1.74, "yawDegrees":0},
    "mai": {"src":"/models/people/mai.glb", "height":1.74, "yawDegrees":0},
    "vy": {"src":"/models/people/vy.glb", "height":1.74, "yawDegrees":0}
  }
}
```

Đây là cấu hình minh họa: bạn có thể **chỉ sửa thuộc tính `src`, `height`, `yawDegrees` và `materialBindings` của file catalog có sẵn**, giữ nguyên phần `animationAliases`. Không cần viết lại toàn bộ JSON. `materialBindings` chỉ ánh xạ *tên material chính xác trong model* sang màu trong Avatar Studio; nếu không biết tên thì bỏ qua thuộc tính này để giữ nguyên texture và màu gốc của model.

**Bước 4.** Chạy lại game, làm mới trang (`Ctrl + Shift + R`) và mở Avatar Studio. Nếu ghi “(model dự phòng)” thì đường dẫn/định dạng asset mới bị lỗi. Mở F12 → Console và Network để xem HTTP 404 hoặc lỗi parser GLB.

**Bước 5.** Đăng nhập từ hai thiết bị, kiểm tra nhân vật đồng bộ vị trí, ngồi dậy cạnh sofa, hát cầm mic, DJ/nhân viên đi và tương tác. Khi dùng 2 thiết bị khác mạng, kiểm tra cả voice chat riêng; thay model không sửa cấu hình TURN.

## Chuẩn model đề xuất

- GLB/GLTF có license phù hợp, không dùng asset bị sao chép trái phép; lưu bản license theo từng model.
- Hạn chế model nặng trên mobile: ưu tiên khoảng 15–35k triangles/avatar, texture 1K–2K, dưới 10 MB/model nếu có thể.
- Chỉ số `height` tính bằng mét chiều cao muốn hiển thị; `yawDegrees=180` nếu nhân vật quay ngược.
- Tên animation có thể ánh xạ từ `animationAliases` trong catalog, ví dụ `Walk`/`Walking`/`Mixamo_Walk`. Nếu file chứa animation cho rig khác, cần retarget vào rig mới bằng Blender hoặc phần mềm hỗ trợ trước khi xuất GLB.
- Nếu model không có skeleton, chỉ có thể đứng/di chuyển theo nhóm; không thể có động tác gập tay/hát chuyên nghiệp nếu chưa rig.
- `.gltf` có file `.bin` và texture bên ngoài phải upload đủ đường dẫn tương đối. `.glb` được ưu tiên để deploy dễ hơn.
- `.vrm` có thể hiện mesh nhưng bộ điều khiển VRM chuyên dụng chưa tích hợp; các biểu cảm VRM, hair physics và animation đặc thù có thể chưa chạy đúng.

## Test & deploy

Chạy `npm run check`. Sau đó cập nhật đúng file trong ZIP **GitHub-Update** vào repository, không xóa thư mục `lib` hay file cũ. Nếu đã cấu hình TURN trên Render, giữ nguyên ba biến `TURN_URL`, `TURN_USERNAME`, `TURN_PASSWORD`.

Để nâng cấp model sau này: upload file GLB mới vào GitHub `public/models/people/` và sửa đường dẫn `src` trong catalog. Render sẽ tự deploy khi Auto Deploy bật.

### Giới hạn kiểm thử

Bộ kiểm thử Node kiểm tra logic, cú pháp, catalog, file GLB mặc định và tính tương thích mã cũ. **Chưa được kiểm thử trực quan mọi GLB/VRM bên ngoài, animation thực tế và nhiều người đồng thời trên Render**. Chưa cung cấp file model thương mại chất lượng cao; pipeline mới là nền tảng để thay bằng model có quyền sử dụng.

### Bảo mật

Đường dẫn model chỉ nhận file cục bộ dưới `/models/` và không cho client chuyển URL tùy ý. Không commit credential TURN lên GitHub. Render đã bật TURN nên `/config` có thể làm lộ credential dài hạn; về lâu dài hãy dùng credential ngắn hạn.
