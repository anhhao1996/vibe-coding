# Investment & Expense Tracker

Ứng dụng web quản lý tài chính cá nhân — theo dõi đầu tư, chi tiêu hàng tháng và sổ tiết kiệm. Giao diện tiếng Việt.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React (CRA) | 18.x |
| Routing | React Router | 6.x |
| Charts | Recharts | 2.x |
| HTTP Client | Axios | 1.x |
| Date Utils | date-fns | 2.x |
| Backend | Node.js + Express | 4.x |
| ORM / Query Builder | Knex.js | 3.x |
| Database | MySQL (mysql2 driver) | 8.0 |
| Production DB | TiDB Cloud (MySQL-compatible, SSL) | — |
| Auth | JWT (jsonwebtoken) + bcryptjs | — |
| Security | helmet, express-rate-limit, express-validator | — |
| E2E Tests | Playwright (external repo) | — |
| CI/CD | GitHub Actions | — |

**Design:** Soft green theme (`#4CAF50`), fonts Lexend (UI) + JetBrains Mono (numbers).

## Product Spec

### Authentication

- Đăng ký / đăng nhập bằng username + password
- JWT token lưu localStorage, tự động logout khi 401
- Đổi mật khẩu
- Rate limit trên login/register chống brute-force
- Mọi dữ liệu đều scoped theo `user_id`

### Dashboard (`/`)

- **Net Worth Card** — tổng tài sản (đầu tư + tiết kiệm), % lãi/lỗ tổng
- **Stat Cards** — tổng đã đầu tư, đã bán, giá trị hiện tại, PnL
- **Stat Cards tiết kiệm** — tổng gửi, lãi nhận, tổng số dư (nếu có sổ tiết kiệm)
- **Biểu đồ phân bổ đầu tư** — donut chart theo danh mục
- **Biểu đồ phân bổ tiết kiệm** — pie chart theo sổ
- **PnL 7 ngày** — bar chart lãi/lỗ hàng ngày (đầu tư + lãi tiết kiệm)
- **Biểu đồ 30 ngày** — line chart so sánh tổng nạp vs giá trị hiện tại
- **Bảng PnL chi tiết** — từng danh mục: đã đầu tư, giá trị, lãi/lỗ, %
- **Bảng tổng quan tiết kiệm** — từng sổ: gửi, lãi, rút, số dư
- **Nút "Lưu Snapshot"** — tạo snapshot portfolio + tiết kiệm cho ngày hôm nay
- **Nút "Làm mới"** — tự động cập nhật giá từ API bên ngoài cho tất cả danh mục

### Quản lý Đầu tư (`/investments`)

- Tạo / sửa / xóa danh mục đầu tư (tên, mô tả, màu sắc)
- Mỗi danh mục hiển thị: số lượng, đã đầu tư, đã bán, giá trị hiện tại, PnL
- **Cập nhật giá thủ công** — nhập giá đơn vị, preview giá trị mới
- **Cập nhật giá tự động** — gọi API bên ngoài theo tên danh mục:
  - Quỹ mở Dragon Capital (DCDS, VESAF) → Fmarket API
  - Vàng SJC → vang.today API
  - USD → Vietcombank exchange rate
- **Cập nhật toàn bộ** — loop tất cả danh mục, gọi API phù hợp
- Thêm giao dịch mua/bán trực tiếp từ danh mục

### Giao dịch (`/transactions`)

- Danh sách tất cả giao dịch mua/bán
- Lọc theo: loại (mua/bán), danh mục, khoảng ngày
- Phân trang (10/50/100 mục/trang)
- Tạo / sửa / xóa giao dịch
- Xem chi tiết giao dịch trong modal
- Bán kiểm tra số lượng holding đủ trước khi cho phép
- Holdings tự động tính lại từ tất cả giao dịch sau mỗi thay đổi

### Chi tiêu (`/expenses`)

- Quản lý chi tiêu theo tháng (tạo, xóa tháng)
- Thêm / sửa / xóa từng mục chi tiêu (tên, số tiền, ghi chú)
- Tổng chi tiêu tự động cập nhật
- **Copy tháng** — sao chép danh sách mục từ tháng khác
- **Biểu đồ xu hướng** — tổng chi tiêu 12 tháng gần nhất
- **Theo dõi mục cụ thể** — chọn tên mục để vẽ line chart riêng 6 tháng
- Danh sách mục được theo dõi lưu trong user settings

### Tiết kiệm (`/savings`)

- Tạo / sửa / xóa sổ tiết kiệm (tên, mô tả, màu sắc)
- Giao dịch: gửi tiền / rút tiền / nhận lãi
- Lãi suất ghi nhận khi gửi tiền (optional)
- Rút tiền kiểm tra số dư đủ
- Xem chi tiết lịch sử giao dịch từng sổ
- Tổng hợp: tổng gửi, lãi, rút, số dư hiện tại

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── app.js              # Port, CORS, env
│   │   │   └── database.js         # Knex + mysql2 pool, SSL
│   │   ├── controllers/
│   │   │   ├── BaseController.js   # Shared response helpers
│   │   │   ├── AuthController.js
│   │   │   ├── CategoryController.js
│   │   │   ├── TransactionController.js
│   │   │   ├── PortfolioController.js
│   │   │   ├── PriceController.js
│   │   │   ├── ExpenseController.js
│   │   │   └── SavingsController.js
│   │   ├── services/
│   │   │   ├── AuthService.js           # JWT, bcrypt, user ops
│   │   │   ├── CategoryService.js       # CRUD + ownership
│   │   │   ├── TransactionService.js    # Buy/sell + holding recalc
│   │   │   ├── PortfolioService.js      # Dashboard data, snapshots, PnL
│   │   │   ├── ExternalPriceService.js  # Fmarket, gold, USD APIs
│   │   │   ├── ExpenseService.js        # Monthly expenses + trends
│   │   │   └── SavingsService.js        # Books + transactions
│   │   ├── models/
│   │   │   ├── BaseModel.js         # Generic Knex CRUD
│   │   │   ├── User.js
│   │   │   ├── Category.js
│   │   │   ├── Holding.js           # recalculateFromTransactions
│   │   │   ├── Transaction.js
│   │   │   ├── PortfolioSnapshot.js
│   │   │   ├── MonthlyExpense.js
│   │   │   ├── ExpenseItem.js
│   │   │   ├── UserSettings.js
│   │   │   ├── SavingsBook.js
│   │   │   ├── SavingsTransaction.js
│   │   │   └── SavingsSnapshot.js
│   │   ├── middleware/
│   │   │   ├── auth.js              # authMiddleware, optionalAuthMiddleware
│   │   │   └── validator.js         # express-validator rules
│   │   ├── routes/
│   │   │   ├── index.js             # Mounts all routes under /api
│   │   │   ├── authRoutes.js
│   │   │   ├── categoryRoutes.js
│   │   │   ├── transactionRoutes.js
│   │   │   ├── portfolioRoutes.js
│   │   │   ├── priceRoutes.js
│   │   │   ├── expenseRoutes.js
│   │   │   └── savingsRoutes.js
│   │   ├── database/                # Migration & seed scripts
│   │   └── server.js                # Express entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/           # StatCard, NetWorthCard, Charts, PnLTable, SavingsTable
│   │   │   ├── Form/               # Modal, CategoryForm, TransactionForm
│   │   │   └── Layout/             # Layout shell, Sidebar nav
│   │   ├── pages/
│   │   │   ├── Dashboard/
│   │   │   ├── Investments/
│   │   │   ├── Transactions/
│   │   │   ├── Expenses/
│   │   │   ├── Savings/
│   │   │   └── Login/
│   │   ├── contexts/AuthContext.jsx  # Auth state, token, login/logout
│   │   ├── services/api.js          # Axios instance + API modules
│   │   ├── utils/formatters.js      # VND currency, date, number formatting
│   │   ├── styles/index.css         # Global theme + CSS variables
│   │   ├── App.jsx                  # Routes + ProtectedRoute/PublicRoute
│   │   └── index.js                 # React 18 entry
│   └── package.json
│
├── .github/workflows/
│   └── trigger-playwright.yml       # CI: E2E tests on push/PR to main
├── CLAUDE.md                        # AI assistant context
└── README.md
```

## Installation

### Prerequisites

- Node.js >= 18
- MySQL >= 8.0 (hoặc TiDB Cloud)
- npm

### 1. Clone

```bash
git clone <repository-url>
cd vibe-coding
```

### 2. Backend

```bash
cd backend
npm install
```

Tạo file `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=investment_tracker
DB_SSL=false

PORT=9000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
```

Chạy migration (theo thứ tự):

```bash
npm run db:migrate              # 1. Schema chính (categories, transactions, holdings, expenses, savings)
npm run db:migrate-auth         # 2. Users table + user_id columns (tạo admin:admin)
npm run db:migrate-total-sold   # 3. Thêm total_sold vào holdings
npm run db:migrate-current-price # 4. Thêm current_price vào holdings
npm run db:migrate-settings     # 5. User settings table
```

Khởi động server:

```bash
npm run dev    # Development (nodemon, auto-reload)
npm start      # Production
```

Backend chạy tại `http://localhost:9000`.

### 3. Frontend

```bash
cd frontend
npm install
npm start
```

Frontend chạy tại `http://localhost:3000`.

Nếu backend không ở port 9000, tạo file `.env`:

```env
REACT_APP_API_URL=http://localhost:9000/api
```

### 4. Seed data (optional)

```bash
cd backend
npm run db:seed-test-data    # Seed categories, transactions, snapshots, expenses, savings cho user admin
npm run db:seed-snapshots    # Seed 30 ngày portfolio snapshots từ holdings hiện tại
```

## Environment Variables

### Backend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_HOST` | Yes | — | MySQL host |
| `DB_PORT` | Yes | — | MySQL port (3306 local, 4000 TiDB) |
| `DB_USER` | Yes | — | Database user |
| `DB_PASSWORD` | Yes | — | Database password |
| `DB_NAME` | Yes | — | Database name |
| `DB_SSL` | No | `false` | Enable SSL (required for TiDB Cloud) |
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` / `production` / `test` |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed origins (comma-separated) |
| `JWT_SECRET` | Yes | — | Secret key for JWT signing |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiration |

### Frontend

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_URL` | No | `http://localhost:9000/api` | Backend API base URL |

## API Reference

Base URL: `/api`. Tất cả routes trừ Auth và Health đều yêu cầu header `Authorization: Bearer <token>`.

### Health

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |

### Auth (`/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Đăng nhập → `{ token, user }` |
| POST | `/auth/register` | Đăng ký tài khoản mới |
| GET | `/auth/me` | Lấy thông tin user hiện tại (JWT) |
| POST | `/auth/change-password` | Đổi mật khẩu (JWT) |

### Categories (`/categories`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | Danh sách danh mục + holdings |
| POST | `/categories` | Tạo danh mục mới |
| PUT | `/categories/:id` | Cập nhật danh mục |
| DELETE | `/categories/:id` | Xóa danh mục |

### Transactions (`/transactions`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/transactions?limit=100` | Danh sách giao dịch |
| POST | `/transactions` | Tạo giao dịch (buy/sell) |
| PUT | `/transactions/:id` | Cập nhật giao dịch |
| DELETE | `/transactions/:id` | Xóa giao dịch |

### Portfolio (`/portfolio`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/portfolio/dashboard` | Dashboard data (overview, distribution, PnL, history, savings) |
| PUT | `/portfolio/price/:categoryId` | Cập nhật giá hiện tại (`{ current_price }`) |
| POST | `/portfolio/snapshot` | Tạo daily snapshot (portfolio + savings) |

### External Price (`/price`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/price/fmarket/update/:categoryId` | Cập nhật giá từ Fmarket (`{ slug }`) |
| POST | `/price/gold/update/:categoryId` | Cập nhật giá vàng SJC |
| POST | `/price/usd/update/:categoryId` | Cập nhật tỷ giá USD |

### Expenses (`/expenses`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/expenses/trend?months=12` | Xu hướng tổng chi tiêu |
| POST | `/expenses/trend/items?months=12` | Xu hướng theo tên mục (`{ items }`) |
| GET | `/expenses/item-names` | Danh sách tên mục đã dùng |
| GET | `/expenses/tracked-items` | Mục đang theo dõi |
| PUT | `/expenses/tracked-items` | Lưu mục theo dõi (`{ items }`) |
| GET | `/expenses/month/:month` | Chi tiêu tháng cụ thể |
| POST | `/expenses` | Tạo tháng mới (`{ month, notes }`) |
| POST | `/expenses/:monthlyExpenseId/items` | Thêm mục chi tiêu |
| POST | `/expenses/copy` | Copy mục từ tháng khác |
| PUT | `/expenses/items/:id` | Cập nhật mục |
| DELETE | `/expenses/items/:id` | Xóa mục |
| DELETE | `/expenses/month/:month` | Xóa cả tháng |

### Savings (`/savings`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/savings` | Danh sách sổ tiết kiệm |
| GET | `/savings/:id` | Chi tiết sổ + lịch sử giao dịch |
| POST | `/savings` | Tạo sổ mới |
| PUT | `/savings/:id` | Cập nhật sổ |
| DELETE | `/savings/:id` | Xóa sổ |
| POST | `/savings/:id/transactions` | Thêm giao dịch (deposit/withdrawal/interest) |
| DELETE | `/savings/transactions/:id` | Xóa giao dịch tiết kiệm |

## Architecture

### Backend: MVC + Service Layer

```
Request → Route → Middleware (auth, validator) → Controller → Service → Model → Database
```

- **Controllers** kế thừa `BaseController` — chuẩn hóa response format, error handling
- **Services** chứa business logic — validation, ownership checks, calculations
- **Models** kế thừa `BaseModel` — Knex query builder, generic CRUD
- **Middleware** — JWT auth (`req.user`), express-validator rules

### Frontend: Feature-based

- **Pages** — top-level route components, mỗi page tự quản lý state với `useState`/`useEffect`/`useCallback`
- **Components** — nhóm theo feature (Dashboard, Form, Layout), tái sử dụng
- **AuthContext** — global auth state, token persistence, auto-logout on 401
- **api.js** — axios instance + 7 API modules, response interceptor

### Database Schema

```
users
  └── categories (user_id FK)
        ├── holdings (category_id FK, 1:1)
        ├── transactions (category_id FK)
        └── portfolio_snapshots (category_id FK)
  └── monthly_expenses (user_id FK, unique user_id+month)
        └── expense_items (monthly_expense_id FK)
  └── savings_books (user_id)
        └── savings_transactions (savings_book_id FK)
  └── savings_snapshots (user_id, daily aggregate)
  └── user_settings (user_id, key-value JSON)
```

### Key Behaviors

- **Holdings recalculation** — sau mỗi tạo/sửa/xóa transaction, holding được tính lại từ tất cả transactions (`Holding.recalculateFromTransactions`)
- **Daily snapshots** — lưu giá trị portfolio + tiết kiệm theo ngày, dùng cho PnL 7 ngày và line chart 30 ngày
- **External prices** — Fmarket (NAV quỹ mở), vang.today (SJC), Vietcombank (USD); auto-detect theo tên danh mục
- **User isolation** — tất cả data scoped theo `user_id` từ JWT, categories là root owner

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm start
```

Backend auto-reload với nodemon. Frontend hot-reload với CRA.

### Database Scripts

| Script | Description |
|--------|-------------|
| `npm run db:migrate` | Schema chính |
| `npm run db:migrate-auth` | Users + multi-tenancy |
| `npm run db:migrate-total-sold` | `holdings.total_sold` column |
| `npm run db:migrate-current-price` | `holdings.current_price` column |
| `npm run db:migrate-settings` | `user_settings` table |
| `npm run db:seed-test-data` | Seed đầy đủ cho user admin |
| `npm run db:seed-snapshots` | Seed 30 ngày snapshots |
| `npm run db:clear-snapshots` | Xóa toàn bộ snapshots |
| `npm run db:fix-cross-schema-fks` | Fix FK cross-schema (TiDB) |

### CI/CD

GitHub Actions workflow chạy trên mỗi push/PR vào `main`:

1. Spin up MySQL 8.0 service container
2. Install backend deps → run all migrations → seed test data
3. Start backend (port 9000) + frontend (port 3000)
4. Checkout `anhhao1996/playwright-test` repo
5. Run Playwright E2E tests (Chromium, 4 workers)
6. Upload test results artifact (7 days retention)

### Build for Production

```bash
cd frontend && npm run build   # Output: frontend/build/
cd backend && npm start        # NODE_ENV=production loads .env.production
```

## License

MIT
