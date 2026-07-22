# CHƯƠNG 3: CÀI ĐẶT & KIỂM THỬ

*Nguồn dữ liệu: toàn bộ ảnh chụp màn hình trong `report-assets/screenshots/` và kết quả
Postman/newman thật trong `report-assets/test-results/` đều được tạo bằng cách chạy trực
tiếp hệ thống đã container hoá (`docker compose up --build`, đủ 3 service) — không có nội
dung giả lập.*

## 3.0. Môi trường triển khai

Hệ thống được đóng gói thành 3 container Docker chạy trên cùng một máy (localhost), khởi
động bằng một lệnh duy nhất `docker compose up --build` theo đúng yêu cầu phi chức năng
"Deployment" của SRS:

| Service | Image | Cổng | Vai trò |
|---|---|---|---|
| sales_mysql | mysql:8 | 3307:3306 | Cơ sở dữ liệu, volume `mysql_data` |
| sales_backend | build từ `demo/Dockerfile` (multi-stage, Eclipse Temurin 21) | 8080:8080 | REST API (Spring Boot 4.1.0) |
| sales_frontend | build từ `demo/frontend/Dockerfile` (multi-stage, Node 24 → Nginx) | 3000:80 | Giao diện React (Vite build tĩnh) |

---

## 3.1. Module Xác thực & Phân quyền (UC-01, UC-02)

**Input:** họ tên, email, mật khẩu, số điện thoại (đăng ký) / email + mật khẩu (đăng nhập).

**Process:**
- Đăng ký: kiểm tra email chưa tồn tại → mã hoá mật khẩu bằng BCrypt → tạo tài khoản với
  role mặc định `CUSTOMER` → trả về JWT (tự động đăng nhập).
- Đăng nhập: so khớp mật khẩu BCrypt → kiểm tra `status` tài khoản (từ chối nếu `LOCKED`)
  → cấp JWT (claim `sub`=userId, `email`, `role`, hạn 24 giờ).
- Mọi request tiếp theo được xác thực qua `JwtAuthenticationFilter`, phân quyền theo vai
  trò (`CUSTOMER`/`STAFF`/`ADMIN`) bằng Spring Security `hasRole(...)`, khớp đúng ma trận
  phân quyền SRS mục 2.5.1.

**Output:** `AuthResponse {token, id, fullName, email, role}`; giao diện chuyển đến trang
sản phẩm (khách hàng) hoặc trang quản trị (nhân viên/admin).

**Ảnh minh hoạ:** `UC-01_dang-ky-tai-khoan.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | POST | `/api/auth/register` | Đăng ký hợp lệ | 201 + token | ✅ Pass |
| Postman/newman | POST | `/api/auth/register` | Email đã tồn tại | 409 | ✅ Pass |
| Postman/newman | POST | `/api/auth/login` | Sai mật khẩu | 401 | ✅ Pass |
| Postman/newman | POST | `/api/auth/login` | Tài khoản bị khoá | 403 | ⚠️ Cần seed thủ công (xem 3.9) |
| Playwright (trình duyệt thật) | UI | trang `/register`, `/login` | Luồng đăng ký → tự đăng nhập → chuyển trang | Thành công, không lỗi console | ✅ Pass |

---

## 3.2. Module Sản phẩm & Danh mục (UC-03, UC-04, UC-09)

**Input (khách hàng):** từ khoá tìm kiếm, categoryId, khoảng giá, trang/kích thước trang.
**Input (admin):** tên, danh mục, giá, tồn kho, ảnh, mô tả sản phẩm.

**Process:**
- Tìm kiếm/lọc dùng Spring Data JPA Specifications, kết hợp động các điều kiện tuỳ theo
  tham số được truyền, luôn giới hạn `status=ACTIVE` cho khách hàng.
- Admin thao tác qua các endpoint CRUD riêng (ADMIN only); tên sản phẩm/danh mục có ràng
  buộc UNIQUE ở cả tầng DB lẫn tầng service (409 khi trùng, đúng yêu cầu UC-09 "cảnh báo
  trùng lặp").
- **Xoá sản phẩm luôn là soft delete** (`status → INACTIVE`), không xoá vĩnh viễn dòng dữ
  liệu — đúng nguyên tắc đã chốt trong KEY DECISIONS: "sản phẩm đã có trong đơn hàng dùng
  soft delete để bảo toàn dữ liệu lịch sử". Sản phẩm INACTIVE không còn hiển thị ở
  `GET /api/products` (khách hàng) nhưng Admin xem được đầy đủ qua endpoint riêng
  `GET /api/admin/products` (bổ sung Ngày 8, đóng khoảng trống KNOWN ISSUE mở từ Ngày 3).

**Output:** danh sách sản phẩm phân trang (`Page<ProductResponse>`); với Admin có thêm bộ
lọc trạng thái ACTIVE/INACTIVE.

**Ảnh minh hoạ:** `UC-03_tim-kiem-loc-san-pham.png`, `UC-04_xem-chi-tiet-san-pham.png`,
`UC-09_quan-ly-san-pham.png`, `UC-09_san-pham-inactive.png`, `UC-09_quan-ly-danh-muc.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | GET | `/api/products` | Lọc theo tên/khoảng giá | 200, đúng kết quả | ✅ Pass |
| Postman/newman | POST | `/api/products` | Tên trùng | 409 | ✅ Pass |
| Postman/newman | DELETE | `/api/products/{id}` | Soft delete | 204, status→INACTIVE (không xoá dòng) | ✅ Pass |
| Postman/newman | GET | `/api/admin/products?status=INACTIVE` | Admin xem sản phẩm đã ẩn | 200, có sản phẩm INACTIVE | ✅ Pass |
| Playwright | UI | `/admin/products` | Tạo → sửa → xoá (ẩn) → lọc INACTIVE | Toàn bộ thao tác phản ánh đúng trên giao diện | ✅ Pass |

---

## 3.3. Module Giỏ hàng & Đặt hàng (UC-05, UC-06)

**Input:** productId + số lượng (thêm giỏ); địa chỉ giao hàng + phương thức thanh toán
(đặt hàng).

**Process:**
- Giỏ hàng: thêm sản phẩm gộp số lượng vào dòng (user, product) đã có thay vì tạo dòng
  mới; số lượng luôn bị giới hạn (cap) bằng tồn kho hiện có — **đúng UC-05**: "Nếu số
  lượng vượt quá tồn kho: giới hạn số lượng tối đa bằng tồn kho hiện có". Sản phẩm hết
  hàng hoàn toàn (`quantity=0`) bị từ chối thêm vào giỏ (409), thay vì tạo dòng số lượng 0
  vô nghĩa.
- Đặt hàng (`POST /api/orders`) là **một giao dịch (transaction) duy nhất**: kiểm tra lại
  tồn kho/trạng thái từng dòng giỏ hàng ngay tại thời điểm đặt hàng (không tin vào giá/tồn
  kho đã hiển thị trước đó) → nếu có sản phẩm không còn khả dụng, từ chối toàn bộ đơn
  (409, nêu rõ tên sản phẩm) → nếu hợp lệ: lưu snapshot `unit_price`, trừ tồn kho, xoá giỏ
  hàng, ghi dòng lịch sử trạng thái `PENDING` đầu tiên — đúng yêu cầu phi chức năng UC-06
  "việc trừ tồn kho và tạo đơn hàng phải là 1 giao dịch duy nhất".

**Output:** `OrderResponse` (id, tổng tiền, trạng thái PENDING, danh sách dòng đơn hàng).

**Ảnh minh hoạ:** `UC-05_quan-ly-gio-hang.png`, `UC-06_dat-hang-thanh-toan.png`,
`UC-06_dat-hang-thanh-cong.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | POST | `/api/cart` | Thêm vượt tồn kho | 201, số lượng bị giới hạn = tồn kho | ✅ Pass |
| Postman/newman | POST | `/api/orders` | Giỏ hàng rỗng | 400 | ✅ Pass |
| Postman/newman | POST | `/api/orders` | Sản phẩm trong giỏ đã hết hàng/bị ẩn (re-validate tại thời điểm đặt) | 409, nêu tên sản phẩm | ✅ Pass |
| Postman/newman | POST | `/api/orders` | Đặt hàng hợp lệ | 201, tồn kho bị trừ đúng, giỏ hàng rỗng sau đó | ✅ Pass |
| Playwright | UI | `/cart` → `/checkout` | Luồng đặt hàng đầy đủ, kiểm tra tổng tiền | Đơn hàng tạo thành công, chuyển đến trang chi tiết | ✅ Pass |

---

## 3.4. Module Theo dõi đơn hàng & Đánh giá sản phẩm (UC-07, UC-08)

**Input:** không có input trực tiếp cho UC-07 (chỉ xem); rating (1-5) + bình luận cho UC-08.

**Process:**
- UC-07: khách hàng chỉ xem được đơn hàng của chính mình (`GET /api/orders/{id}` trả 404,
  không phải 403, nếu đơn không thuộc về mình — tránh xác nhận sự tồn tại của đơn hàng
  người khác).
- UC-08: điều kiện đánh giá — khách hàng phải có **ít nhất một đơn hàng chứa sản phẩm này
  ở trạng thái COMPLETED** (đúng UC-08 "Đơn hàng chứa sản phẩm đã ở trạng thái COMPLETED").
  Mỗi khách hàng chỉ đánh giá một sản phẩm **một lần duy nhất** (ràng buộc UNIQUE
  (user_id, product_id) ở tầng DB + kiểm tra tầng service, 409 nếu đánh giá lần 2). Nút
  đánh giá được ẩn hoàn toàn (không chỉ vô hiệu hoá) nếu khách hàng chưa từng mua/hoàn tất
  sản phẩm — đúng UC-08 "Nếu sản phẩm chưa từng mua/hoàn tất: không hiển thị nút đánh giá".

**Output:** danh sách đơn hàng kèm trạng thái; `ReviewResponse` công khai kèm điểm trung
bình.

**Ảnh minh hoạ:** `UC-07_theo-doi-don-hang.png`, `UC-08_danh-gia-san-pham.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | GET | `/api/orders/{id}` | Xem đơn của người khác | 404 | ✅ Pass |
| Postman/newman | POST | `/api/products/{id}/reviews` | Chưa đủ điều kiện (chưa COMPLETED) | 403 | ✅ Pass |
| Postman/newman | POST | `/api/products/{id}/reviews` | Đánh giá lần 2 | 409 | ✅ Pass |
| Postman/newman | POST | `/api/products/{id}/reviews` | Rating ngoài 1-5 | 400 | ✅ Pass |
| Playwright | UI | `/orders/{id}` | Gửi đánh giá 5 sao trên đơn COMPLETED thật (dữ liệu seed) | Đánh giá hiển thị ngay trên trang, ẩn form sau khi gửi | ✅ Pass |

---

## 3.5. Module Quản lý đơn hàng — Admin/Nhân viên (UC-10)

**Input:** trạng thái mới (`CONFIRMED`/`SHIPPING`/`COMPLETED`/`CANCELLED`) + ghi chú
(tuỳ trường hợp).

**Process:** trạng thái đơn hàng chỉ được chuyển **đúng chiều mũi tên** trong sơ đồ Hình
2.4 (`PENDING→{CONFIRMED,CANCELLED}`, `CONFIRMED→{SHIPPING,CANCELLED}`,
`SHIPPING→{COMPLETED,CANCELLED}`; `COMPLETED`/`CANCELLED` là trạng thái cuối, không có
chuyển tiếp) — không cho phép nhảy cóc (ví dụ PENDING→COMPLETED trực tiếp bị từ chối 409).
Mọi lần chuyển trạng thái đều được ghi vào bảng `order_status_history` (audit trail) —
đúng yêu cầu phi chức năng UC-10 "Toàn bộ thay đổi trạng thái phải được ghi log". Giao
diện Admin **vô hiệu hoá/làm mờ trước** các nút chuyển trạng thái không hợp lệ (dựa trên
cùng một bảng ánh xạ ALLOWED_STATUS_TRANSITIONS ở cả frontend lẫn backend) thay vì để
người dùng bấm rồi nhận lỗi 409.

**Output:** `OrderResponse` cập nhật kèm lịch sử trạng thái đầy đủ.

**Ảnh minh hoạ:** `UC-10_quan-ly-don-hang.png`,
`UC-10_chi-tiet-don-hang-chuyen-trang-thai.png` (ảnh cho thấy rõ 2 nút "Chuyển sang: Đang
giao" và "Chuyển sang: Hoàn tất" bị làm mờ vì đơn đang ở trạng thái PENDING, chỉ
"Đã xác nhận" và "Đã huỷ" là hợp lệ)

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | PATCH | `/api/orders/{id}/status` | Nhảy cóc PENDING→COMPLETED | 409 | ✅ Pass |
| Postman/newman | PATCH | `/api/orders/{id}/status` | SHIPPING→CANCELLED thiếu `note` | 400 | ✅ Pass |
| Postman/newman | PATCH | `/api/orders/{id}/status` | Chuyển hợp lệ theo đúng chiều | 200, lịch sử được ghi | ✅ Pass |
| Postman/newman | PATCH | `/api/orders/{id}/status` | Nhân viên (STAFF) thực hiện | 200 (được phép) | ✅ Pass |
| Playwright | UI | `/admin/orders/{id}` | Chuyển PENDING→CONFIRMED→SHIPPING→COMPLETED tuần tự | Nút bị vô hiệu hoá đúng theo từng bước | ✅ Pass |

**Ghi chú khác biệt so với đặc tả gốc:** xem mục 3.9 (điểm 3).

---

## 3.6. Module Quản lý khách hàng (UC-11)

**Input:** trạng thái mới (`ACTIVE`/`LOCKED`) cho một khách hàng.

**Process:** chỉ áp dụng cho tài khoản `role=CUSTOMER` (không thể dùng để khoá tài khoản
STAFF/ADMIN qua endpoint này). Tài khoản bị khoá không đăng nhập được, hệ thống trả về
403 kèm thông báo tương ứng — đúng UC-11 "Tài khoản bị khoá không thể đăng nhập".

**Output:** danh sách khách hàng kèm trạng thái hiện tại.

**Ảnh minh hoạ:** `UC-11_quan-ly-khach-hang.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | PATCH | `/api/admin/customers/{id}/status` | Khoá tài khoản | 200, status=LOCKED | ✅ Pass |
| Postman/newman | POST | `/api/auth/login` | Đăng nhập bằng tài khoản vừa khoá | 403 | ✅ Pass |
| Playwright | UI | `/admin/customers` | Khoá/mở khoá qua giao diện | Trạng thái cập nhật ngay trên bảng | ✅ Pass |

---

## 3.7. Module Quản lý tài khoản nội bộ (UC-12)

**Input:** họ tên, email, mật khẩu, vai trò (`STAFF`/`ADMIN`).

**Process:** chỉ Admin được tạo tài khoản nội bộ; vai trò bắt buộc là `STAFF` hoặc
`ADMIN` (400 nếu truyền `CUSTOMER`); email trùng bị từ chối (409) — đúng UC-12
"Nếu email trùng lặp: hệ thống cảnh báo".

**Output:** danh sách tài khoản STAFF/ADMIN.

**Ảnh minh hoạ:** `UC-12_quan-ly-tai-khoan-noi-bo.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | POST | `/api/admin/staff` | Vai trò không hợp lệ (CUSTOMER) | 400 | ✅ Pass |
| Postman/newman | POST | `/api/admin/staff` | Tạo tài khoản STAFF hợp lệ | 201 | ✅ Pass |
| Postman/newman | GET | `/api/admin/staff` (gọi bằng token STAFF) | Nhân viên cố truy cập | 403 | ✅ Pass |
| Playwright | UI | `/admin/staff` | Tạo tài khoản qua form | Tài khoản mới xuất hiện ngay trong danh sách | ✅ Pass |

**Ghi chú khác biệt so với đặc tả gốc:** xem mục 3.9 (điểm 4).

---

## 3.8. Module Thống kê & Báo cáo doanh thu (UC-13)

**Input:** khoảng thời gian (từ ngày/đến ngày), độ chi tiết (Ngày/Tháng/Năm).

**Process:** doanh thu chỉ tính từ đơn hàng `status=COMPLETED`, nhóm theo mẫu định dạng
ngày MySQL tương ứng độ chi tiết được chọn; nếu không có dữ liệu trong khoảng thời gian,
trả về mảng rỗng (200, không phải lỗi) — đúng UC-13 "Nếu không có dữ liệu... hiển thị
'Không có dữ liệu'". Top sản phẩm bán chạy tính từ `order_details` join với đơn hàng
COMPLETED, sắp xếp theo số lượng bán.

**Output:** biểu đồ cột doanh thu theo thời gian + bảng top sản phẩm bán chạy.

**Ảnh minh hoạ:** `UC-13_admin-dashboard.png`, `UC-13_thong-ke-doanh-thu.png`

### Kiểm thử

| Công cụ | Phương thức | Endpoint | Kịch bản | Kỳ vọng | Thực tế |
|---|---|---|---|---|---|
| Postman/newman | GET | `/api/admin/statistics/revenue` | Có dữ liệu COMPLETED | 200, đúng tổng doanh thu | ✅ Pass |
| Postman/newman | GET | `/api/admin/statistics/revenue` | Khoảng thời gian trống dữ liệu | 200, mảng rỗng | ✅ Pass |
| Postman/newman | GET | `/api/admin/statistics/top-products` | — | 200, đúng thứ tự theo số lượng bán | ✅ Pass |
| Playwright | UI | `/admin/statistics` | Xem biểu đồ + bảng với dữ liệu thật (đơn hàng seed đã COMPLETED) | Hiển thị đúng doanh thu và sản phẩm bán chạy | ✅ Pass |

---

## 3.9. Tổng hợp kết quả kiểm thử tự động (Postman/newman)

Toàn bộ 94 request / 120 assertion của bộ Postman collection (8 nhóm: Auth, Category,
Product, Cart, Order, Admin/Accounts, Review, Statistics) được chạy bằng `npx newman`
trực tiếp lên backend đã container hoá. Kết quả thật (xem
`report-assets/test-results/newman-run-console.txt` và `newman-run.json`):

```
requests: 94/94 executed, 0 failed
assertions: 120 total, 116 passed, 4 failed
total run duration: 8.5s
average response time: 20ms
```

**4 assertion không đạt** đều là hai kịch bản đã biết từ trước (không phải lỗi phát sinh
hôm nay), cần seed dữ liệu thủ công qua SQL trước khi `newman` — cả hai đã được xác nhận
đúng qua kiểm thử thủ công (curl/trình duyệt) ở các ngày trước:
1. *Login - Locked Account*: cần khoá một tài khoản test trước khi chạy (Postman không
   tự làm được trong 1 lần chạy tuần tự); chạy độc lập qua trình duyệt thì kết quả đúng
   403 (xem mục 3.6).
2. *Delete Category - Blocked By Products*: cần một sản phẩm tham chiếu category test
   trước khi chạy; tương tự, xác nhận đúng 409 khi kiểm thử thủ công.

## 3.10. Phân loại các vấn đề còn tồn tại (real bug vs. cắt giảm phạm vi có chủ đích)

| # | Vấn đề | Phân loại |
|---|---|---|
| 1 | Không có endpoint khách hàng tự huỷ đơn (chỉ Admin/Nhân viên) | Cắt giảm phạm vi có chủ đích — SRS không yêu cầu bắt buộc |
| 2 | Không có sửa/xoá đánh giá | Cắt giảm phạm vi có chủ đích — UC-08 không yêu cầu |
| 3 | Mật khẩu tối thiểu 6 ký tự (SRS ghi 8 ký tự) | **✅ Đã sửa (Ngày 10)** — tăng lên 8 ký tự ở cả backend và frontend, khớp SRS — xem mục 3.11 |
| 4 | "Phiên hết hạn" chưa có thông báo/chuyển hướng chuẩn hoá | Khác biệt nhỏ so với Phần 4 SRS — không chặn demo |
| 5 | Chưa có endpoint sửa tài khoản nội bộ đã tạo (chỉ thêm mới) | **✅ Đã sửa (Ngày 10)** — bổ sung `PUT /api/admin/staff/{id}` + giao diện sửa — xem mục 3.11 |
| 6 | ddl-auto=update thay vì Flyway/Liquibase | Cắt giảm phạm vi có chủ đích — hợp lý cho quy mô đồ án |
| 7 | Không có cơ chế tự tạo tài khoản Admin đầu tiên qua API | Cắt giảm phạm vi có chủ đích — vấn đề triển khai, không phải chức năng SRS |
| 8 | Backend chưa có healthcheck riêng trong docker-compose | Cắt giảm phạm vi có chủ đích — chưa gây lỗi thực tế |

---

## 3.11. Khác biệt giữa SRS và triển khai thực tế (để nhóm quyết định có cập nhật SRS hay không)

*(Chi tiết đầy đủ đã được liệt kê riêng cho người dùng xem trước khi chỉnh sửa — xem phần
tóm tắt trong docs.txt mục KEY DECISIONS/Session 12. Dưới đây là bản tóm tắt để đưa vào
báo cáo.)*

1. **UC-06, luồng ngoại lệ "mất kết nối"**: SRS mô tả nếu mất kết nối khi đang xử lý đặt
   hàng thì đơn được lưu ở trạng thái PENDING để xử lý thủ công. Thực tế, việc tạo đơn là
   một transaction nguyên tử duy nhất — nếu lỗi giữa chừng, toàn bộ giao dịch rollback,
   **không có đơn hàng PENDING nào được tạo** (an toàn hơn nhưng khác mô tả gốc).
2. **UC-10, luồng ngoại lệ "huỷ đơn sau khi đã giao"**: SRS yêu cầu khi từ chối yêu cầu
   huỷ đơn COMPLETED, hệ thống phải **ghi chú lý do từ chối**. Thực tế, COMPLETED là
   trạng thái cuối, mọi yêu cầu chuyển trạng thái từ đó chỉ trả lỗi 409 chung, không có cơ
   chế ghi chú riêng cho trường hợp bị từ chối này.
3. **UC-12, chức năng "sửa" tài khoản nội bộ**: SRS ghi "Admin thêm/**sửa** tài khoản
   Nhân viên". Tại thời điểm rà soát (Ngày 9), hệ thống chỉ có chức năng xem danh sách +
   thêm mới, chưa có endpoint/màn hình sửa vai trò một tài khoản đã tồn tại.
   **✅ Đã bổ sung ở Ngày 10**: `PUT /api/admin/staff/{id}` (`AdminService.updateStaffAccount()`,
   dùng chung logic kiểm tra vai trò với chức năng thêm mới) + giao diện sửa trực tiếp
   trên bảng tài khoản nội bộ (`AdminStaffPage.jsx`) + 3 kịch bản kiểm thử Postman mới.
4. **Mục 2.5.1 vs 2.5.2 — quyền xem danh sách khách hàng của Nhân viên**: mục 2.5.1 (bảng
   phân quyền chức năng) ghi Nhân viên **không** được "Quản lý khách hàng", nhưng mục
   2.5.2 (phạm vi dữ liệu) lại ghi Nhân viên được xem "danh sách khách hàng" — hai mục tự
   mâu thuẫn nhau trong chính SRS gốc. Triển khai thực tế chọn theo 2.5.1 (chặn hoàn toàn
   Nhân viên khỏi mọi endpoint `/api/admin/**`, bao gồm cả xem danh sách khách hàng).
5. **Mật khẩu tối thiểu**: SRS ghi rõ tối thiểu 8 ký tự; tại thời điểm rà soát (Ngày 9),
   triển khai chỉ yêu cầu tối thiểu 6 ký tự. **✅ Đã sửa ở Ngày 10**: tăng lên 8 ký tự ở
   cả `RegisterRequest`/`CreateStaffRequest` (backend) và form đăng ký/tạo tài khoản
   (frontend), khớp đúng SRS.
6. **Bảng `order_status_history`**: không có trong ERD gốc (chỉ liệt kê 7 thực thể), được
   bổ sung ở Ngày 4 để đáp ứng yêu cầu "toàn bộ thay đổi trạng thái phải được ghi log" của
   UC-10 — bổ sung cần thiết, không phải thiếu sót.
7. **Thông báo "Phiên hết hạn"**: Phần 4 SRS định nghĩa mẫu thông báo chuẩn khi JWT hết
   hạn; giao diện hiện tại chưa bắt riêng lỗi 401-do-hết-hạn để hiển thị đúng thông báo
   này/chuyển hướng tự động về trang đăng nhập — chỉ hiển thị thông báo lỗi chung từ
   backend.

*(Nhóm quyết định: cập nhật lại SRS cho khớp thực tế, hay điều chỉnh code cho khớp SRS —
Claude không tự ý sửa SRS theo yêu cầu của người dùng.)*
