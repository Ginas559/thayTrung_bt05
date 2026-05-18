Tóm tắt — Pagination & Carousel (Bán chạy nhất / Xem nhiều nhất)

Mục tiêu
- Hiển thị 10 sản phẩm "Bán chạy nhất" và 10 sản phẩm "Xem nhiều nhất" theo dải ngang có phân trang (horizontal paging).
- API cung cấp metadata phân trang để UI có thể hiển thị Prev/Next và chỉ báo trang.

Backend (Express + Mongoose)
- File chính: src/services/keyboardService.js
- API endpoint: GET /v1/api/keyboards
- Tham số quan trọng:
  - sort: 'popular' | 'views' | 'latest' | 'price-asc' | 'price-desc' | 'rating'
  - bestseller=true    (lọc bestseller)
  - promotion=true     (lọc khuyến mãi)
  - page, limit         (pagination numeric)
- Response (luôn trả object phân trang):
  {
    items: [...],      // mảng tài nguyên cho trang hiện tại
    total: 123,        // tổng số sản phẩm khớp filter
    page: 1,           // trang hiện tại
    totalPages: 13,    // tổng số trang
    pageSize: 10       // kích thước trang
  }

Frontend (React, Vite)
- Tập tin chính: src/pages/home.jsx
  - Hai dải ngang: "Bán Chạy Nhất" và "Xem Nhiều Nhất".
  - Mỗi dải yêu cầu API với `page` và `limit=10`.
  - Prev/Next gọi lại API với page tăng/giảm.
  - Overlay arrows xuất hiện khi hover; có hiệu ứng fade và transition khi thay đổi trang.
- Tập tin tìm kiếm: src/pages/search.jsx
  - Giữ infinite scroll theo chiều dọc (IntersectionObserver) — đã xử lý cả 2 dạng response (mảng fallback và object phân trang).

Ví dụ gọi API
- Bán chạy nhất (trang 2):
  GET /v1/api/keyboards?bestseller=true&sort=popular&page=2&limit=10
- Xem nhiều nhất (trang 1):
  GET /v1/api/keyboards?sort=views&page=1&limit=10

Ví dụ response (rút gọn)
{
  "items": [{"_id":"...","title":"...", ...}],
  "total": 78,
  "page": 1,
  "totalPages": 8,
  "pageSize": 10
}

Kiểm thử локally
1. Chạy backend:
   cd FullStackNodeJS01/Expressjs
   npm run dev
2. Chạy frontend:
   cd FullStackNodeJS01/ReactJS01/reactjs01
   npm run dev
3. Mở Home, dùng overlay arrows trong dải "Bán Chạy Nhất" và "Xem Nhiều Nhất"; quan sát Network tab cho các request có `page` và `limit=10`.

Tương thích ngược
- Frontend vẫn xử lý response dạng mảng (nếu có phần khác trả mảng). Tuy nhiên giờ API chuẩn hoá trả object — tốt khi muốn hiển thị `totalPages`.

Lưu ý triển khai production
- Đặt biến môi trường `VITE_BACKEND_URL` cho frontend (nếu deploy riêng).
- Backend cần kết nối tới MongoDB Atlas với `MONGO_DB_URL`.

Câu hỏi thường gặp (Q&A)
Q: Tại sao đôi khi không thấy "Đang tải..." trên UI?
A: Ở môi trường local, response rất nhanh hoặc được cache (304), nên chỉ báo tải có thể nháy nhanh. Đã bổ sung animation/status rõ hơn cho demo.

Q: API có hỗ trợ cursor-based horizontal paging?
A: Hiện dùng numeric `page`/`limit` cho simplicity. Nếu cần cursor (id/offset), có thể bổ sung `after`/`before` với sorting ổn định.

Q: Nếu muốn mỗi trang ngang "snap" đúng 10 item khi kéo tay?
A: Có thể thêm CSS scroll-snap + javascript để đảm bảo snap-to-page; tôi có thể implement nếu bạn muốn.

Ghi chú kết thúc
- Nếu bạn muốn, tôi sẽ tạo thêm phần minh hoạ cho giáo viên (screenshot, checklist chấm điểm), hoặc chuyển một số logic pagination ra helper chung để tái sử dụng.
