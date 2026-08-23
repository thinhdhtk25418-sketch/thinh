# Writing Studio - Hướng dẫn chạy dự án

Dự án bao gồm 2 phần: Frontend (React + Vite) và Backend (Node.js + Express + Prisma + PostgreSQL).

## Yêu cầu
- Node.js (v18+)
- PostgreSQL (hoặc chuỗi kết nối cloud database)

---

## 1. Cài đặt Backend

1. Mở terminal, di chuyển vào thư mục `backend`:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Cấu hình biến môi trường:
   - Đổi tên file `.env.example` thành `.env`
   - Cập nhật `DATABASE_URL` thành chuỗi kết nối PostgreSQL của bạn (nếu dùng local PostgreSQL thì format thường là `postgresql://user:password@localhost:5432/writing_studio?schema=public`)
4. Tạo database và chạy migration:
   ```bash
   npx prisma migrate dev --name init
   ```
5. Chạy server phát triển (chạy trên port 3000):
   ```bash
   npm run dev
   ```
   *(Lưu ý: Nếu file package.json chưa có script dev, bạn có thể chạy `npx ts-node-dev src/server.ts`)*

---

## 2. Cài đặt Frontend

1. Mở một terminal mới, di chuyển vào thư mục `frontend`:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi động Vite (chạy trên port 5173):
   ```bash
   npm run dev
   ```
4. Truy cập trang web tại `http://localhost:5173`

## 3. Cách sử dụng (Teacher Access)
- Chọn nút "Teacher Access" hoặc "Giáo viên" ở thanh bên trái (Sidebar).
- Nhập mật khẩu: `123456`
- Trong vai trò giáo viên, bạn có thể tạo bộ đề bài mới, chấm điểm (Bôi đen chữ trong bài làm để highlight và thêm nhận xét).
