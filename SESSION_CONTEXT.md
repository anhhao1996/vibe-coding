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
holdings (id, category_id, quantity, average_price, total_invested, current_value)
portfolio_snapshots (id, category_id, snapshot_date, total_value, total_invested, pnl, pnl_percentage)

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
- /api/portfolio/dashboard, /snapshot, /value/:id
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

## NPM Scripts

```bash
# Backend
npm run dev              # Start server
npm run db:migrate       # Base tables
npm run db:migrate-auth  # Users + user_id (creates admin/admin)
npm run db:seed-snapshots
npm run db:clear-snapshots

# Frontend
npm start
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
