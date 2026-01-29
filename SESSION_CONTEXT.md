# Investment Tracker - Session Context

## Project Overview

Personal investment and expense tracking web app with multi-user authentication.

| Component | Tech | Port |
|-----------|------|------|
| Frontend | React | 3000 |
| Backend | Node.js/Express | 9000 |
| Database | MySQL | 3306 |
| Auth | JWT (7 days) | - |
| Theme | Light green #4CAF50 | - |

## Database Schema

```sql
-- Authentication
users (id, username, password[bcrypt], display_name, email, created_at)

-- Investments (user_id via categories)
categories (id, user_id, name, description, color)
transactions (id, category_id, type[buy/sell], amount, price, quantity, transaction_date, notes)
holdings (id, category_id, quantity, average_price, current_price, total_invested, total_sold, current_value)
portfolio_snapshots (id, category_id, snapshot_date, total_value, total_invested, total_sold, pnl, pnl_percentage)

-- Expenses (user_id direct)
monthly_expenses (id, user_id, month[YYYY-MM], total_amount, notes)
expense_items (id, monthly_expense_id, name, amount, notes)
```

## API Endpoints

### Auth (Public)
- POST /api/auth/login
- POST /api/auth/register

### Protected Routes (require JWT)
- /api/categories - CRUD, filtered by user
- /api/transactions - CRUD with filters
- /api/portfolio/dashboard, /snapshot, /price/:categoryId
- /api/price/dcds, /gold, /usd + update endpoints
- /api/expenses - monthly management

## External Price APIs

| Asset | Source | JSONPath |
|-------|--------|----------|
| DCDS | Dragon Capital | $.returnValue[0].navPerShare__c |
| Gold | vnappmob (SJC) | $.results[0].buy_1l |
| USD | Vietcombank | currencyCode=USD, transfer |

## Frontend Routes

| Route | Page | Auth |
|-------|------|------|
| /login | Login/Register | Public |
| / | Dashboard | Protected |
| /investments | Categories | Protected |
| /transactions | Transaction list | Protected |
| /expenses | Monthly expenses | Protected |

## Key Code Patterns

### BaseModel.create returns full object
```javascript
const item = await Model.create(data);
// Returns { id, ...data } - NOT result.insertId
```

### db.query returns rows directly
```javascript
const rows = await db.query(sql, params);
// DONT: const [rows] = await db.query()
```

### Number formatting
- Comma (,) = thousand separator
- Dot (.) = decimal point
- formatNumberDisplay / parseFormattedNumber

## Investment Calculation Formulas

### Holdings (per category)
- **current_price**: Giá hiện tại 1 đơn vị (lưu trong DB, không đổi khi có giao dịch mới)
- **current_value**: Tính on-the-fly = `current_price × quantity`
- **total_invested**: Tổng giá trị các giao dịch MUA
- **total_sold**: Tổng giá trị các giao dịch BÁN
- **Lãi/Lỗ**: `(current_value + total_sold) - total_invested`

### Dashboard Overview
- **Tổng đầu tư**: SUM của tất cả total_invested
- **Tổng đã bán**: SUM của tất cả total_sold
- **Giá trị hiện tại**: SUM của tất cả current_value
- **Lãi/Lỗ**: (Giá trị hiện tại + Tổng đã bán) - Tổng đầu tư

### Portfolio Chart
- **Đường Đầu tư**: total_invested
- **Đường Giá trị**: total_value + total_sold

## NPM Scripts

```bash
# Backend
npm run dev              # Start server
npm run db:migrate       # Base tables
npm run db:migrate-auth  # Users + user_id (creates admin/admin)
npm run db:migrate-total-sold    # Add total_sold to holdings
npm run db:migrate-current-price # Add current_price to holdings
npm run db:seed-snapshots
npm run db:clear-snapshots

# Frontend
npm start
```

## Migration Scripts (cho Production)

Khi deploy code mới, chạy theo thứ tự:
```bash
cd backend
node src/database/migrate-add-total-sold.js      # 1. Thêm total_sold vào holdings
node src/database/migrate-add-current-price.js   # 2. Thêm current_price vào holdings  
node src/database/migrate-snapshot-total-sold.js # 3. Thêm total_sold vào snapshots
```

Hoặc với TiDB Cloud (chạy từ local với env production):
```bash
DB_HOST=xxx.tidbcloud.com DB_PORT=4000 DB_USER=xxx DB_PASSWORD=xxx DB_NAME=investment_tracker \
node src/database/migrate-add-total-sold.js
```

## Quick Start

```bash
cd backend && npm run db:migrate && npm run db:migrate-auth
cd backend && npm run dev
cd frontend && npm start
# Login: admin / admin
```

## Auth Implementation

### Backend
- AuthService: bcryptjs + jsonwebtoken
- middleware/auth.js: JWT verification
- All routes use authMiddleware except /api/auth/*

### Frontend
- contexts/AuthContext.jsx: state + localStorage
- App.jsx: ProtectedRoute component
- Sidebar.jsx: user info + logout

## Known Issues

1. MySQL: Use pool.query() not pool.execute()
2. Dragon Capital SSL: axios with rejectUnauthorized: false
3. React StrictMode: Double API calls (normal)

## Current Features

- JWT Authentication with multi-user
- Investment categories with real-time prices (DCDS/Gold/USD)
- Transaction management with filters/pagination
- Portfolio snapshots and history charts
- Monthly expense tracking with copy feature
- Expense trend charts
- Dashboard với 4 thống kê: Tổng đầu tư, Tổng đã bán, Giá trị hiện tại, Lãi/Lỗ
- Trang Investments hiển thị: Số lượng, Tổng đầu tư, Tổng đã bán, Giá trị hiện tại, Lãi/Lỗ

## Key Files (Auth)

```
backend/
  middleware/auth.js
  services/AuthService.js
  controllers/AuthController.js
  routes/authRoutes.js
  database/migrate-auth.js

frontend/
  contexts/AuthContext.jsx
  pages/Login/
  App.jsx (ProtectedRoute)
  components/Layout/Sidebar.jsx (logout)
```

## Key Files (Investment Calculations)

```
backend/
  models/Holding.js              # recalculateFromTransactions(), updateCurrentPrice()
  models/Category.js             # findWithHoldings() - tính current_value on-the-fly
  models/PortfolioSnapshot.js    # getPortfolioHistory() - include total_sold
  services/PortfolioService.js   # updateCurrentPrice(), getDashboardData()
  controllers/PriceController.js # Cập nhật current_price khi lấy giá từ API
  database/migrate-add-total-sold.js
  database/migrate-add-current-price.js
  database/migrate-snapshot-total-sold.js

frontend/
  pages/Dashboard/Dashboard.jsx           # 4 StatCards
  pages/Investments/Investments.jsx       # Hiển thị holdings với công thức mới
  components/Dashboard/PortfolioLineChart.jsx  # value = total_value + total_sold
  services/api.js                         # portfolioApi.updateCurrentPrice()
```
