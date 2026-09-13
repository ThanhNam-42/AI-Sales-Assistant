# Business Requirements Document (BRD)
## AI Sales Assistant

### 1. Mục tiêu dự án (Project Objective)
Xây dựng một hệ thống hỗ trợ đội ngũ sales/telesales trong việc:
- Ưu tiên hóa lead (khách hàng tiềm năng) dựa trên xác suất chốt đơn, thay vì gọi điện ngẫu nhiên.
- Tự động tóm tắt nội dung cuộc gọi/ghi chú chăm sóc khách hàng, giảm thời gian nhập liệu thủ công.
- Cung cấp gợi ý hành động tiếp theo (next best action) cho từng lead.

### 2. Bối cảnh & vấn đề nghiệp vụ (Business Context)
Trong mô hình telesales/B2B sales truyền thống, nhân viên sales thường xử lý hàng trăm lead mỗi tuần nhưng không có công cụ định lượng để biết lead nào đáng ưu tiên gọi trước. Hệu quả:
- Lãng phí thời gian gọi các lead có xác suất chốt thấp.
- Ghi chú chăm sóc khách hàng rời rạc, khó tổng hợp khi bàn giao giữa các sales.
- Quản lý (sales manager) khó theo dõi sức khỏe pipeline theo thời gian thực.

### 3. Đối tượng sử dụng (Stakeholders)
| Vai trò | Nhu cầu |
|---|---|
| Sales/Telesales | Biết lead nào nên ưu tiên gọi, xem lịch sử tương tác nhanh |
| Sales Manager | Theo dõi tổng quan pipeline, phân bổ lead cho team |
| BA/Product | Tài liệu hoá luồng nghiệp vụ để mở rộng hệ thống |

### 4. Phạm vi dự án (Scope)
**Trong phạm vi (In-scope):**
- Quản lý lead (CRUD): tên, công ty, ngành, quy mô deal, nguồn lead, trạng thái.
- Chấm điểm lead tự động (Lead Scoring) bằng mô hình Machine Learning dựa trên đặc điểm lead + lịch sử tương tác.
- Ghi chú cuộc gọi và tóm tắt tự động bằng AI (rule-based/LLM tuỳ cấu hình).
- Dashboard hiển thị danh sách lead sắp xếp theo điểm số, có bộ lọc theo ngành/trạng thái.
- Xác thực người dùng (đăng nhập demo).

**Ngoài phạm vi (Out-of-scope, cho phiên bản v1):**
- Tích hợp trực tiếp với hệ thống điện thoại (VoIP) hay CRM thật (Salesforce, HubSpot).
- Gửi email/SMS tự động.
- Phân quyền đa cấp (multi-role permission) phức tạp.

### 5. Yêu cầu chức năng (Functional Requirements)
| Mã | Yêu cầu | Mô tả |
|---|---|---|
| FR-01 | Đăng nhập | Người dùng đăng nhập bằng tài khoản demo để truy cập hệ thống |
| FR-02 | Thêm/xem/sửa/xoá lead | CRUD đầy đủ cho thực thể Lead |
| FR-03 | Chấm điểm lead | Hệ thống tự động tính điểm xác suất chốt đơn (0-100) khi tạo/cập nhật lead |
| FR-04 | Giải thích điểm số | Hiển thị các yếu tố ảnh hưởng nhiều nhất đến điểm số (feature importance) |
| FR-05 | Thêm ghi chú cuộc gọi | Người dùng nhập ghi chú dạng text tự do cho một lead |
| FR-06 | Tóm tắt ghi chú | Hệ thống tóm tắt các ghi chú thành 2-3 câu + đề xuất hành động tiếp theo |
| FR-07 | Dashboard tổng quan | Danh sách lead sắp xếp theo điểm, lọc theo ngành/trạng thái/nguồn |

### 6. Yêu cầu phi chức năng (Non-functional Requirements)
- Thời gian phản hồi API < 500ms cho các thao tác CRUD thông thường.
- Hệ thống chạy được cả local (Docker Compose) và triển khai cloud (Render/Vercel).
- Mã nguồn có kiểm thử tự động (unit test) cho các luồng nghiệp vụ chính.
- Giao diện responsive, dùng được trên desktop và tablet.

### 7. Tiêu chí nghiệm thu (Acceptance Criteria)
- Người dùng có thể đăng nhập, thêm một lead mới, và ngay lập tức thấy điểm số được tính.
- Khi thêm ghi chú cuộc gọi, hệ thống trả về bản tóm tắt trong vòng vài giây.
- Dashboard hiển thị đúng thứ tự ưu tiên (điểm cao → thấp) và lọc đúng theo tiêu chí.
- Toàn bộ test suite (`pytest`) pass ở CI.

### 8. Giả định & ràng buộc (Assumptions & Constraints)
- Dữ liệu lead ban đầu là dữ liệu tổng hợp (synthetic) do không có dữ liệu thật từ doanh nghiệp.
- Tính năng tóm tắt mặc định dùng phương pháp rule-based/extractive để không phụ thuộc API key trả phí; có thể bật chế độ dùng LLM thật nếu cấu hình `OPENAI_API_KEY`.
