# Courtify API - Backend

RESTful API cho nền tảng đặt sân thể thao Courtify. Xây dựng bằng Node.js + Express 4 + MongoDB (Mongoose), bảo mật JWT, upload ảnh qua Cloudinary, thanh toán qua PayOS.

## 🚀 Tính năng nổi bật
- **Xác thực JWT:** Đăng ký/đăng nhập, refresh token, khóa/mở khóa tài khoản.
- **Đặt sân:** Quản lý cụm sân, sân, khung giờ, đặt sân theo thời gian thực.
- **Thanh toán trực tuyến:** Tạo link thanh toán PayOS
- **Upload ảnh:** Lưu ảnh lên Cloudinary (cụm sân, sân).
- **Phân quyền:** ADMIN / CUSTOMER.

## 🛠️ Hướng dẫn cài đặt
1. **Yêu cầu môi trường**
   - Node.js >= 20
   - MongoDB Atlas (hoặc MongoDB local)

2. **Cài đặt các thư viện**
   ```
   npm install
   ```

3. **Cấu hình môi trường (QUAN TRỌNG)**
   Tạo file `.env` tại thư mục gốc và điền các biến sau:

   **A. Server & Database**
   - `PORT` — Cổng chạy server (mặc định 8000).
   - `MONGODB_URI` — Chuỗi kết nối MongoDB Atlas.

   **B. Bảo mật JWT**
   - `JWT_SECRET` — Khóa bí mật dùng ký token.

   **C. CORS**
   - `CORS_ORIGIN` — Danh sách domain frontend được phép gọi API, cách nhau dấu phẩy.
     VD: `http://localhost:3000,<domain frontend khi deploy>`

   **D. Cloudinary (upload ảnh)**
   - Lấy tại: Cloudinary Dashboard
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

   **E. Thanh toán PayOS**
   - Lấy tại: PayOS Dashboard
   - `PAYOS_CLIENT_ID`, `PAYOS_API_KEY`, `PAYOS_CHECKSUM_KEY`
   - `PAYOS_RETURN_URL`, `PAYOS_CANCEL_URL` — Link quay về frontend sau thanh toán.

4. **Chạy thử**
   ```
   npm run dev    # phát triển
   npm start      # production
   ```

## 📁 Cấu trúc thư mục chính
```
bin/           Khởi động server (www)
config/        Kết nối MongoDB, Cloudinary, PayOS
controllers/   Xử lý request
services/      Nghiệp vụ
models/        Mongoose schema
routes/        Định nghĩa API
middleware/    authen (JWT), upload (Multer)
```

## 🔒 Bảo mật
- Không bao giờ commit file `.env` lên repository công khai.
- Đổi `JWT_SECRET` thành chuỗi ngẫu nhiên dài để bảo vệ token.
- Các API quản trị yêu cầu đăng nhập; chỉ ADMIN mới quản lý được người dùng.
