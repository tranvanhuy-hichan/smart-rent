# Smart Rent – Nhà Trọ Thông Minh

Hệ thống SaaS quản lý dãy trọ và phòng trọ dành cho **Chủ trọ** và **Khách thuê**, gồm ứng dụng Web/Android (Vue 3) và API (Spring Boot).

Repo này là monorepo, gộp từ hai repo `QLPT_VUE_FE` và `QLPT_JAVA_BE` (giữ nguyên lịch sử commit).

```text
smart-rent/
├── frontend/   # Vue 3 + Vite + Tailwind + Capacitor (Web & Android)
└── backend/    # Spring Boot 3 + PostgreSQL + JWT
```

## Tính năng chính

- Xác thực JWT, đăng nhập Google; phân quyền `ADMIN`, `LANDLORD`, `TENANT`.
- Gói cước SaaS: dùng thử miễn phí 45 ngày, gia hạn 3/6/12 tháng; tài khoản hết hạn bị chặn với mã `402 Payment Required`.
- Quản lý dãy trọ, phòng trọ, nội quy, tài khoản ngân hàng nhận thanh toán.
- Hợp đồng thuê, phụ lục, thanh lý; quản lý khách thuê.
- Hóa đơn hàng tháng theo chỉ số điện/nước, phụ phí, giảm giá; thanh toán bằng VietQR động.
- Thông báo (push), chat, hỗ trợ, camera dãy trọ, xuất Excel.
- Giao diện Mobile First, đóng gói ứng dụng Android bằng Capacitor.

## Công nghệ

| Phần | Công nghệ |
|------|-----------|
| Frontend | Vue 3 (Composition API), Vite, Pinia, Vue Router, Axios, Tailwind CSS 4, Capacitor |
| Backend | Java 17, Spring Boot 3.2, Spring Security + JWT, Spring Data JPA, WebSocket, PostgreSQL, Maven |
| Triển khai | Docker / Docker Compose, Nginx (frontend), Vercel (`frontend/vercel.json`) |

## Chạy nhanh

### Yêu cầu
- Node.js 22.x, npm
- JDK 17, Maven
- Docker (tùy chọn, để chạy PostgreSQL và backend)

### 1. Backend

```bash
cd backend
docker compose up -d postgres-db      # PostgreSQL local
export DATABASE_URL=jdbc:postgresql://localhost:5432/qlpt
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=<mật khẩu>
export JWT_SECRET=<chuỗi bí mật>
mvn spring-boot:run                   # API chạy tại http://localhost:8080
```

Hoặc chạy cả backend và DB bằng `docker compose up --build`.

Biến môi trường tùy chọn: `JWT_EXPIRATION_MS`, `RESEND_API_KEY`, `RESEND_FROM`, `GOOGLE_CLIENT_ID`, `IMOU_APP_ID`, `IMOU_APP_SECRET`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env     # đặt VITE_API_URL=http://localhost:8080 và VITE_GOOGLE_CLIENT_ID
npm install
npm run dev
```

Build production: `npm run build`.

## Tài liệu chi tiết

- [frontend/README.md](frontend/README.md) – cấu trúc mã nguồn, UX, build Android.
- [backend/README.md](backend/README.md) – tính năng, API và cấu hình backend.

## Lưu ý bảo mật

Không commit secret (JWT secret, mật khẩu DB, API key). Truyền qua biến môi trường.
