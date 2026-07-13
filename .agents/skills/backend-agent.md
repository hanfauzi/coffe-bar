# Backend Agent Instructions

## Stack

Use:
- NestJS
- TypeScript
- Prisma ORM
- Local PostgreSQL
- JWT authentication
- bcrypt password hashing
- class-validator
- class-transformer

## Folder Structure

Recommended:

```txt
backend/
├── src/
│   ├── auth/
│   ├── users/
│   ├── ingredients/
│   ├── inventory/
│   ├── expenses/
│   ├── menus/
│   ├── recipes/
│   ├── sales/
│   ├── orders/
│   ├── personal-cups/
│   ├── reports/
│   ├── prisma/
│   ├── types/
│   └── common/
```

## Type and Interface Definitions

All domain-specific custom types, interfaces, and request/response shapes must be housed in `src/types/` split by domain files (e.g., `ingredient.ts`, `sale.ts`, `order.ts`, etc.) and exported through a barrel `index.ts` file.

## Local Database Rule

The backend connects to local PostgreSQL.

Do not assume:
- Supabase
- Neon
- PlanetScale
- Cloud SQL
- Any managed database

Use:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/coffee_tracker?schema=public"
```

## Authentication

V1 requires authentication because business data must not be visible to anyone who opens the app.

Implement:
- Register initial owner
- Login
- JWT auth guard
- Password hashing with bcrypt

Design user model so it can support multi-user later.

## Business Logic Rules

### Inventory Ledger Rule

Never update inventory stock without creating an inventory transaction.

Every stock movement must create:
- ingredientId
- type
- quantityChange
- unit
- referenceType
- referenceId
- notes
- createdAt

### Expense Creation

Creating an expense must happen in a database transaction.

Steps:
1. Create expense
2. Create expense items
3. Update ingredient latest cost
4. Increase inventory stock
5. Create inventory transaction for each item

### Order Creation (Pemesanan)

Creating or updating an order with status `PENDING`:
- Save order info (date, customer name, notes) and order items.
- **Do not** deduct stock or calculate HPP snapshots yet.

### Order Completion (Pemesanan Selesai)

Completing a pending order:
1. Fetch order and its items.
2. Calculate total HPP snapshot based on recipes, and total revenue.
3. Create a `Sale` record for reporting.
4. Reduce inventory stock of active ingredients based on recipes.
5. Create `InventoryTransaction` records for ledger audit.
6. Transition order status to `COMPLETED`.

### Sale Creation

Creating a sale directly must happen in a database transaction.

Steps:
1. Create sale
2. Create sale items
3. Snapshot unit price
4. Calculate HPP snapshot
5. Reduce inventory using recipe
6. Create inventory transaction
7. Return sale summary

### Personal Cup Creation

Creating personal consumption must:
1. Create personal cup record
2. Reduce inventory using recipe
3. Allow excluding packaging/cup ingredient
4. Create inventory transaction
5. Not create revenue

## API Modules

Required controllers:
- AuthController
- IngredientsController
- InventoryController
- ExpensesController
- MenusController
- RecipesController
- SalesController
- OrdersController
- PersonalCupsController
- ReportsController

## Reporting

Reports should calculate:
- Total revenue
- Total expenses
- Gross profit
- Net profit
- Total HPP
- Low stock items
- Inventory value
- Personal consumption cost

## Validation

All create/update endpoints must use DTO validation.

Use:
- class-validator
- class-transformer

## Error Handling

Return clear errors for:
- Ingredient not found
- Menu not found
- Recipe missing
- Insufficient stock
- Invalid quantity
- Invalid price
- Unauthorized access

## Future Compatibility

Prepare architecture for:
- Multi-user ownership
- Export endpoints
- Other expense categories
- Multi-branch

But do not implement those in V1 unless required.
