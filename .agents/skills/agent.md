# Coffee Business Tracker - Main Agent Instructions

## Project Summary

Build a mobile-first and responsive web application for tracking coffee sales, expenses, inventory, HPP/COGS, and business reports. The UI should default to mobile layouts and use the md: breakpoint to adjust for larger displays.

The app is for a small coffee business owner who needs accurate tracking of:
- Sales revenue
- Raw material spending
- Dynamic HPP based on latest ingredient cost
- Inventory status
- Low stock alerts
- Personal coffee consumption
- Profit reporting

## Tech Stack

### Frontend
- React
- Vite
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui

### Backend
- NestJS
- TypeScript
- Prisma ORM
- Local PostgreSQL

### Database
- PostgreSQL running locally on the user's device
- Do not assume cloud database
- Use environment variable `DATABASE_URL`

Example:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/coffee_tracker?schema=public"
```

## Product Direction

This is not a public SaaS app. It is a local-first business management app for personal/small business usage.

Version 1 should support:
- Single user
- Login/authentication
- Local PostgreSQL
- Mobile-first & responsive UI (md: breakpoint for larger displays)
- Light mode and dark mode
- Inventory ledger
- Expense tracking
- Sales tracking
- Dynamic HPP
- Reporting dashboard

Future-ready architecture should allow:
- Multi-user support
- Export to Excel/PDF
- Additional expense types
- Multi-branch support, but not needed now

## Development Principles

1. Build simple but scalable foundations.
2. Prefer clear business logic over over-engineering.
3. Keep UI clean, minimal, and functional.
4. Use transaction-safe backend operations for inventory and sales.
5. Never mutate inventory without creating an inventory transaction record.
6. Avoid cloud assumptions.
7. Do not use Next.js.
8. Do not use Redux unless absolutely necessary.
9. Prefer form-based workflows over POS-style workflows.
10. Make every core feature testable and modular.

## App Modules

### Required V1 Modules
- Authentication
- Dashboard
- Ingredients
- Inventory
- Expenses
- Menu / Recipes
- Sales
- Personal Cups
- Reports
- Settings

### Optional Future Modules
- Export
- Multi-user roles
- Other operational expenses
- Multi-branch
- Notifications

## Navigation Structure

Recommended sidebar navigation:

- Dashboard
- Sales
- Expenses
- Inventory
- Ingredients
- Menu & Recipes
- Personal Cups
- Reports
- Settings

## Core Business Rules

### Expense Rule
When a raw material purchase is recorded:
- Create expense record
- Create expense items
- Increase inventory stock
- Update latest ingredient cost
- Create inventory transaction with type `PURCHASE`

### Sales Rule
When a sale is recorded:
- Create sales record
- Create sales items
- Calculate HPP snapshot at the time of sale
- Reduce inventory based on recipe
- Create inventory transaction with type `SALE_USAGE`

### Personal Cup Rule
When owner creates coffee for personal use:
- Do not create sales revenue
- Reduce inventory based on recipe
- Allow excluding cup usage
- Create inventory transaction with type `PERSONAL_USAGE`

### HPP Rule V1
Use latest purchase cost.

Example:
- Coffee bean 1kg bought for Rp180,000
- Cost per gram = Rp180
- If next purchase is Rp220,000 per kg
- New cost per gram = Rp220

Future methods:
- Weighted average cost
- FIFO

## Definition of Done

A feature is done only when:
- UI exists
- API exists
- Database schema/migration exists
- Validation exists
- Error handling exists
- Loading and empty states exist
- Inventory effects are correct where applicable
- Code is clean and typed
