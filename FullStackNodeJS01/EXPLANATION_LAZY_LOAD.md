Giải thích tính năng: Hiển thị sản phẩm theo danh mục với Lazy Loading (Infinite Scroll) và tùy chọn phân trang

Mục tiêu
- Hiển thị danh sách sản phẩm (bàn phím) theo bộ lọc/danh mục.
- Hỗ trợ lazy loading: khi cuộn xuống cuối trang thì tải thêm sản phẩm (request API tiếp theo).
- Đảm bảo tương thích ngược: các nơi gọi API không truyền tham số `page`/`limit` vẫn nhận mảng sản phẩm như cũ.

Tệp đã chỉnh sửa
- `Expressjs/src/services/keyboardService.js`:
  - Thêm xử lý `page` và `limit` từ `query`.
  - Nếu không có `page`/`limit`: trả về mảng sản phẩm (giữ tương thích ngược).
  - Nếu có pagination: trả về object `{ items, total, page, totalPages, pageSize }`.
  - Lý do: front-end có thể dùng infinite scroll (yêu cầu phân trang) hoặc dùng API cũ để lấy danh sách đầy đủ.

- `ReactJS01/reactjs01/src/pages/search.jsx`:
  - Thêm state: `page`, `hasMore`, `sentinelRef`.
  - Khi bộ lọc thay đổi: reset `keyboards=[], page=1, hasMore=true`.
  - Khi `page` thay đổi: gọi API với `page` và `limit` (ví dụ `12`).
  - Xử lý kết quả:
    - Nếu API trả về mảng (fallback) -> dùng mảng đó, tắt `hasMore`.
    - Nếu API trả về object phân trang -> append `items` vào danh sách hiện tại và cập nhật `hasMore`.
  - Thêm `IntersectionObserver` quan sát `sentinelRef` (một div rỗng ở cuối danh sách). Khi sentinel xuất hiện và còn dữ liệu -> tăng `page` để tải trang tiếp.

Luồng chạy (tôi diễn đạt như thể tôi là người làm ra):
1. Người dùng mở trang tìm kiếm hoặc danh mục. Trình duyệt render `SearchPage` và đọc `searchParams` từ URL.
2. `useEffect` khởi tạo: gọi `getCategoriesApi()` để lấy danh mục hiển thị sidebar.
3. Khi `searchParams` thay đổi (lọc, từ khóa, thể loại), component:
   - reset danh sách và page (về 1)
   - khởi tạo lại quá trình tải dữ liệu
4. `useEffect` đang lắng nghe `page` và `searchParamsString` gọi `getKeyboardsApi` với `page` và `limit`:
   - Server kiểm tra: nếu `page`/`limit` có trong query -> trả về object phân trang.
   - Frontend nhận object -> nếu `page===1` thì thay thế danh sách, nếu `page>1` thì append vào danh sách.
5. Ở cuối vùng hiện danh sách có một `div` (sentinel) gắn `ref`. `IntersectionObserver` quan sát phần tử này.
   - Khi sentinel xuất hiện trong viewport và `hasMore===true`, `setPage(page+1)` được gọi.
   - Thao tác này làm `useEffect` tải trang kế tiếp.
6. Quy trình lặp lại cho đến khi `page >= totalPages` → `hasMore=false` → không còn request tiếp theo.

Chi tiết kỹ thuật quan trọng
- Giữ tương thích ngược: nếu client gọi `/v1/api/keyboards` mà không truyền `page`/`limit`, server trả mảng sản phẩm như trước.
- Tham số lọc (q, categoryIds, minPrice, maxPrice, minRating, inStock, sort) vẫn hoạt động như trước và được áp dụng trước khi phân trang.
- `limit` mặc định ở frontend là `12` (có thể thay đổi tuỳ UI).
- `IntersectionObserver` sử dụng `rootMargin: '200px'` để prefetch khi người dùng sắp chạm đáy.

Một vài câu trả lời thầy có thể hỏi (gợi ý trả lời ngắn gọn, chuyên nghiệp)
- Hỏi: "API trả về theo dạng nào?"
  - Trả lời: "API hỗ trợ hai chế độ: nếu không truyền `page`/`limit` trả về mảng sản phẩm (tương thích cũ). Nếu truyền `page`/`limit` thì trả về object phân trang `{ items, total, page, totalPages, pageSize }`."

- Hỏi: "Tại sao chọn IntersectionObserver thay vì xử lý sự kiện scroll?"
  - Trả lời: "`IntersectionObserver` hiệu quả hơn, ít gây tái dựng và dễ kiểm soát prefetch (dùng `rootMargin`). Tránh phải lắng nghe scroll liên tục và debounce phức tạp."

- Hỏi: "Làm sao đảm bảo không xảy ra request trùng lặp?"
  - Trả lời: "Kiểm soát bằng `loading` và `hasMore`: observer chỉ tăng `page` khi `!loading` và `hasMore===true`. Ngoài ra server trả `totalPages` nên client dừng khi `page >= totalPages`."

- Hỏi: "Nếu muốn đổi thành phân trang (page number UI) thì cần thay đổi gì?"
  - Trả lời: "Chỉ cần thay đổi UI để điều khiển `page` (nút 'Trang trước'/'Trang sau' hoặc số trang). Backend đã hỗ trợ `page`/`limit` nên không cần thay đổi server."

- Hỏi: "Có cách tối ưu nào khi dữ liệu lớn?"
  - Trả lời: "Có thể dùng cursor-based pagination (sử dụng `createdAt` hoặc `_id` làm cursor) để tăng hiệu suất, hoặc index các trường hay filter thường dùng (price, categoryId, title) để giảm chi phí tìm kiếm."

Hướng dẫn kiểm tra nhanh (như một checklist để chạy):
1. Chạy server Express (đảm bảo kết nối MongoDB đúng). Thử gọi:
   - `GET /v1/api/keyboards` => trả về mảng sản phẩm.
   - `GET /v1/api/keyboards?page=1&limit=12` => trả về object phân trang.
2. Chạy frontend dev server và mở `Search` page. Cuộn xuống đáy để thấy yêu cầu tiếp theo được gửi và sản phẩm được append.

Gợi ý mở rộng (nếu cần làm thêm để đạt điểm tối đa)
- Thêm nút "Xem thêm" (fallback) cho trường hợp trình duyệt không hỗ trợ `IntersectionObserver`.
- Bổ sung hiển thị trạng thái: "Đang tải", "Hết sản phẩm" rõ ràng.
- Thêm cache hoặc debounce filter inputs để giảm request không cần thiết.

---
Nếu bạn muốn, tôi sẽ:
- Commit các thay đổi và tạo một PR (nếu bạn dùng git).
- Viết thêm unit test cho service (mocha/jest) hoặc E2E (cypress) để chứng minh tính hoạt động.
- Chỉnh giao diện (thêm nút Xem thêm, spinner đẹp) theo yêu cầu.

Cho tôi biết bạn muốn tôi tạo file README ngắn gọn cho cách chạy, hoặc muốn tôi commit thay đổi không.