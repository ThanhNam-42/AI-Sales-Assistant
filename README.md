# AI Sales Assistant

Hệ thống hỗ trợ sales/telesales ưu tiên hoá lead bằng Machine Learning và tự động tóm tắt ghi chú chăm sóc khách hàng bằng AI. Dự án được xây dựng như một portfolio project thể hiện đồng thời 3 nhóm kỹ năng: **phân tích nghiệp vụ (BA)**, **Machine Learning / AI**, và **phát triển phần mềm full-stack**.

> 📄 Xem tài liệu nghiệp vụ đầy đủ trong [`docs/`](./docs): [BRD](./docs/BRD.md), [Use Cases & User Flows](./docs/use-cases.md), [Kiến trúc hệ thống](./docs/architecture.md), [Wireframes](./docs/wireframes.md).

## Vấn đề nghiệp vụ

Nhân viên sales/telesales thường xử lý hàng trăm lead nhưng không có công cụ định lượng để biết lead nào nên ưu tiên gọi trước, và mất nhiều thời gian ghi chép, tổng hợp lại nội dung chăm sóc khách hàng. Dự án này giải quyết hai vấn đề đó bằng:

1. **Lead Scoring** — mô hình `RandomForestClassifier` (scikit-learn) chấm điểm 0-100 xác suất chốt đơn dựa trên đặc điểm lead (quy mô deal, tần suất liên hệ, nguồn lead, ngành, tỉ lệ phản hồi...), kèm giải thích các yếu tố ảnh hưởng nhiều nhất.
2. **Tóm tắt ghi chú bằng AI** — tự động tóm tắt các ghi chú cuộc gọi thành 2-3 câu và đề xuất hành động tiếp theo. Mặc định dùng thuật toán extractive summarization tự viết (không cần API key trả phí); có thể bật chế độ dùng OpenAI API để có kết quả tự nhiên hơn.

## Kiến trúc & công nghệ

```
Frontend (React + Vite)  ⇄  Backend API (FastAPI)  ⇄  ML Module (scikit-learn)
                                      ⇄  Summarizer (rule-based / OpenAI)
                                      ⇄  Database (SQLite / PostgreSQL)
```

| Layer | Công nghệ |
|---|---|
| Frontend | React 18, Vite, React Router, Axios |
| Backend | FastAPI, Pydantic, SQLAlchemy, JWT auth |
| ML | scikit-learn, pandas, numpy |
| Database | SQLite (dev), PostgreSQL-ready (production) |
| Testing | pytest, FastAPI TestClient |
| CI/CD | GitHub Actions |
| Hosting | Render (backend), Vercel (frontend) |

Chi tiết & lý do chọn stack: xem [`docs/architecture.md`](./docs/architecture.md).

## Demo

- Frontend: https://ai-sales-assistant-steel.vercel.app
- Backend API docs (Swagger): https://ai-sales-assistant-api-ulqe.onrender.com/docs
- Tài khoản demo: `demo@company.com` / `demo1234`, hoặc tự đăng ký tài khoản mới — mỗi tài khoản có danh sách lead riêng, độc lập với tài khoản khác.

> Lưu ý: backend deploy trên gói free của Render nên sẽ "ngủ" sau ~15 phút không có truy cập — request đầu tiên có thể mất 20-30s để khởi động lại.

## Chạy local

### Cách 1: Docker Compose (khuyến nghị)
```bash
docker compose up --build
```
- Frontend: http://localhost:5173
- Backend API + docs: http://localhost:8000/docs

### Cách 2: Chạy thủ công

**Backend:**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -m app.ml.train        # huấn luyện model lần đầu
uvicorn app.main:app --reload
```
API chạy tại http://localhost:8000, Swagger UI tại http://localhost:8000/docs

**Frontend:**
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
Frontend chạy tại http://localhost:5173

## Chạy test
```bash
cd backend
pytest -v
```
Test bao gồm: xác thực (auth), CRUD lead, luồng ghi chú + tóm tắt AI, và pipeline huấn luyện mô hình ML (kiểm tra AUC, tính đúng đắn của điểm số).

## Deploy lên production (miễn phí)

### Backend → Render
1. Push repo này lên GitHub.
2. Vào [render.com](https://render.com) → New → Blueprint → chọn repo này (Render sẽ tự đọc `render.yaml`).
3. Sau khi deploy xong, Render cấp một URL dạng `https://ai-sales-assistant-api.onrender.com`.
4. (Tuỳ chọn) Thêm biến môi trường `OPENAI_API_KEY` trong Render dashboard nếu muốn dùng tóm tắt bằng LLM thật thay vì rule-based.

> ⚠️ **Lưu ý về dữ liệu:** gói Render Free không có persistent disk — nếu dùng SQLite mặc định (`DATABASE_URL=sqlite:///...`), dữ liệu sẽ **mất mỗi khi service ngủ rồi được đánh thức lại hoặc mỗi lần deploy**. Để dữ liệu (tài khoản, lead) được lưu lại lâu dài, làm thêm bước sau:
> 1. Trên Render Dashboard → **New → PostgreSQL** → tạo 1 database free (giới hạn 1GB, 30 ngày rồi cần gia hạn/nâng cấp gói trả phí để duy trì).
> 2. Copy **Internal Database URL** của database vừa tạo.
> 3. Vào service backend (`ai-sales-assistant-api`) → tab **Environment** → sửa biến `DATABASE_URL` thành URL vừa copy (dạng `postgresql://user:pass@host/dbname`).
> 4. Vào **Manual Deploy → Clear build cache & deploy** để backend tạo lại bảng trên Postgres (code đã hỗ trợ sẵn qua `psycopg2-binary` trong `requirements.txt`).

### Frontend → Vercel
1. Vào [vercel.com](https://vercel.com) → New Project → import repo, chọn thư mục `frontend` làm root.
2. Thêm biến môi trường `VITE_API_URL` = URL backend Render ở bước trên.
3. Deploy — Vercel cấp URL dạng `https://ai-sales-assistant.vercel.app`.

Sau khi có cả hai link, cập nhật lại mục "Demo" ở trên và trong CV/portfolio.

## Cấu trúc thư mục
```
ai-sales-assistant/
├── docs/                # BRD, use case, architecture, wireframes
├── backend/
│   ├── app/
│   │   ├── ml/          # data_gen, train, predict (lead scoring)
│   │   ├── routers/     # auth, leads
│   │   ├── main.py, models.py, schemas.py, auth.py, database.py, summarizer.py
│   ├── tests/           # pytest
│   ├── requirements.txt, Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/       # Login, Register, Dashboard, LeadDetail
│   │   ├── components/  # LeadForm, ScoreBadge
│   ├── package.json, vite.config.js
├── docker-compose.yml
├── render.yaml           # deploy backend
└── .github/workflows/ci.yml
```

## Điểm nhấn kỹ năng thể hiện trong dự án

- **BA:** tài liệu BRD, use case diagram, user flow (sequence diagram), wireframe đầy đủ trước khi code — thể hiện quy trình phân tích nghiệp vụ bài bản.
- **AI/ML:** tự xây pipeline sinh dữ liệu, huấn luyện, đánh giá (accuracy/ROC-AUC), và giải thích mô hình (feature importance dễ hiểu), không chỉ gọi API có sẵn.
- **Software Engineering:** kiến trúc rõ ràng (API/DB/ML tách lớp), REST API chuẩn, JWT auth (đăng ký + đăng nhập, dữ liệu cách ly theo từng tài khoản), test tự động, CI/CD, containerize, và deploy thật lên cloud.

## Giấy phép
MIT
