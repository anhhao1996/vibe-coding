# 🌱 Investment Tracker

Ứng dụng theo dõi đầu tư cá nhân được xây dựng với React, Node.js và MySQL.

## 📋 Tính năng

### Dashboard
- 📊 **Bar Chart** - Phân bổ portfolio theo danh mục
- 📈 **Line Chart** - Biến thiên giá trị portfolio theo thời gian
- 💹 **PnL 7 ngày** - Lãi/lỗ 7 ngày gần nhất
- 📋 **Bảng chi tiết** - Lời/lỗ chi tiết từng khoản đầu tư

### Quản lý Đầu tư
- ➕ Tạo mới danh mục đầu tư (Cổ phiếu, Vàng, Crypto...)
- ✏️ Chỉnh sửa thông tin danh mục
- 🗑️ Xóa danh mục

### Giao dịch
- 🟢 Ghi nhận giao dịch MUA
- 🔴 Ghi nhận giao dịch BÁN
- 📝 Xem lịch sử giao dịch
- 🔍 Lọc theo loại giao dịch

## 🛠️ Công nghệ sử dụng

### Frontend
- **React** 18.x
- **React Router** - Routing
- **Recharts** - Charts library
- **Axios** - HTTP client

### Backend
- **Node.js** + **Express**
- **MySQL** - Database
- **MVC Pattern**
- **SOLID Principles**

## 📁 Cấu trúc dự án

```
investment-tracker/
├── backend/
│   ├── src/
│   │   ├── config/         # Cấu hình database, app
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── middleware/     # Validation, auth
│   │   ├── database/       # Migration scripts
│   │   └── server.js       # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── hooks/          # Custom hooks
│   │   ├── utils/          # Utilities
│   │   ├── styles/         # Global styles
│   │   └── App.jsx         # Main app
│   └── package.json
│
└── README.md
```

## 🚀 Hướng dẫn cài đặt

### Yêu cầu
- Node.js >= 18.x
- MySQL >= 8.0
- npm hoặc yarn

### 1. Clone repository
```bash
git clone <repository-url>
cd investment-tracker
```

### 2. Cài đặt Backend

```bash
cd backend
npm install
```

Tạo file `.env` trong thư mục backend:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=investment_tracker

# Server Configuration
PORT=5000
NODE_ENV=development
```

Chạy migration để tạo database:
```bash
npm run db:migrate
```

Khởi động server:
```bash
npm run dev
```

### 3. Cài đặt Frontend

```bash
cd frontend
npm install
npm start
```

Ứng dụng sẽ chạy tại: http://localhost:3000

## 📡 API Endpoints

### Categories
- `GET /api/categories` - Lấy tất cả danh mục
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `POST /api/categories` - Tạo danh mục mới
- `PUT /api/categories/:id` - Cập nhật danh mục
- `DELETE /api/categories/:id` - Xóa danh mục

### Transactions
- `GET /api/transactions` - Lấy tất cả giao dịch
- `GET /api/transactions/recent` - Giao dịch gần đây
- `GET /api/transactions/category/:id` - Giao dịch theo danh mục
- `POST /api/transactions` - Tạo giao dịch mới
- `PUT /api/transactions/:id` - Cập nhật giao dịch
- `DELETE /api/transactions/:id` - Xóa giao dịch

### Portfolio
- `GET /api/portfolio/dashboard` - Dữ liệu dashboard
- `GET /api/portfolio/overview` - Tổng quan portfolio
- `GET /api/portfolio/distribution` - Phân bổ portfolio
- `GET /api/portfolio/pnl` - PnL theo danh mục
- `GET /api/portfolio/history` - Lịch sử portfolio
- `PUT /api/portfolio/value/:categoryId` - Cập nhật giá trị hiện tại

## 🎨 Theme

Ứng dụng sử dụng theme **Xanh lá nhạt (Soft Green)** với:
- Primary color: `#4CAF50` - `#66BB6A`
- Background: `#F1F8E9`
- Font: Lexend (UI) + JetBrains Mono (numbers)

## 📝 SOLID Principles Applied

1. **Single Responsibility** - Mỗi class/module chỉ có một trách nhiệm
2. **Open/Closed** - BaseModel có thể extend mà không cần sửa đổi
3. **Liskov Substitution** - Các model kế thừa BaseModel hoạt động đúng
4. **Interface Segregation** - Services expose chỉ những methods cần thiết
5. **Dependency Inversion** - Controllers phụ thuộc vào Services, không phụ thuộc trực tiếp Models

## 📄 License

MIT License

---

Made with 💚 for personal investment tracking

