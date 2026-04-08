# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal investment and expense tracking web app (Vietnamese UI). Two independent apps — no monorepo, no shared packages.

| Component | Tech | Port |
|-----------|------|------|
| Frontend | React 18 (CRA) | 3000 |
| Backend | Node.js/Express | 9000 |
| Database | MySQL 8.0 (TiDB Cloud in prod) | 3306 |
| Auth | JWT (bcrypt passwords) | - |

## Development Commands

```bash
# Backend
cd backend && npm install
npm run dev              # Start with nodemon on port 9000
npm start                # Production start

# Frontend
cd frontend && npm install
npm start                # Dev server on port 3000
npm run build            # Production build
npm test                 # React testing (jest)

# Database migrations (run from backend/)
npm run db:migrate           # 1. Base schema (categories, transactions, portfolio_snapshots)
npm run db:migrate-auth      # 2. Users table (creates admin:admin)
npm run db:migrate-total-sold    # 3. Add total_sold to holdings
npm run db:migrate-current-price # 4. Add current_price to holdings
npm run db:fix-cross-schema-fks # 5. Fix foreign key relationships
npm run db:seed-snapshots    # Optional: seed test data
```

## Architecture

**Backend follows MVC + Service layer pattern:**
- `controllers/` — Request handling, all extend `BaseController` for error handling
- `services/` — Business logic layer (one service per domain)
- `models/` — Data access, all extend `BaseModel` which provides CRUD operations
- `middleware/auth.js` — `authMiddleware` (required) and `optionalAuthMiddleware`
- `middleware/validator.js` — express-validator rules
- `routes/index.js` — Aggregates all route files, auth routes are public, rest require JWT

**Frontend follows feature-based organization:**
- `pages/` — Top-level route components (Dashboard, Investments, Transactions, Expenses, Savings, Login)
- `components/` — Grouped by feature (Dashboard/, Form/, Layout/)
- `contexts/AuthContext.jsx` — Global auth state (user, token, login/register/logout)
- `services/api.js` — Centralized axios instance with 6 API modules (categoryApi, transactionApi, portfolioApi, priceApi, expenseApi, savingsApi)
- `hooks/useApi.js` — Custom hooks: `useApi`, `useDashboard`, `useForm`
- `App.jsx` — Routing with `ProtectedRoute` and `PublicRoute` wrappers

## Key Patterns

- **User isolation:** All data is scoped by `user_id` from JWT token. Categories own the user_id; transactions/holdings link to categories.
- **Singleton DB pool:** `database.js` exports a single mysql2 connection pool with SSL support for TiDB Cloud.
- **External price APIs:** `ExternalPriceService.js` fetches from Dragon Capital (DCDS fund), vnappmob (SJC gold), Vietcombank (USD rate).

## Environment Variables

Backend `.env`: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `DB_SSL`

Frontend: `REACT_APP_API_URL` (defaults to `http://localhost:9000/api`)

## CI/CD

GitHub Actions workflow (`trigger-playwright.yml`) runs Playwright E2E tests on push/PR to main, delegating to an external workflow in `anhhao1996/playwright-test`.

## Design

Soft green theme (#4CAF50 primary). Fonts: Lexend (UI), JetBrains Mono (numbers). All UI text is in Vietnamese.
