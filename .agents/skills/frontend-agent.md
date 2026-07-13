# Frontend Agent Instructions

## Stack

Use:
- React
- Vite
- TypeScript
- React Router
- TanStack Query
- React Hook Form
- Zod
- Tailwind CSS
- shadcn/ui

Do not use:
- Next.js
- Redux
- Overly complex state machines

## Folder Structure

Recommended:

```txt
frontend/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── shared/
│   ├── features/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── sales/
│   │   ├── orders/
│   │   ├── expenses/
│   │   ├── inventory/
│   │   ├── ingredients/
│   │   ├── menus/
│   │   ├── personal-cups/
│   │   └── reports/
│   ├── hooks/
│   ├── lib/
│   ├── routes/
│   ├── types/
│   └── utils/
```

## Architecture & Flow Standard

All features must follow a strict **3-Layer Architecture** structure combined with supporting folders:
1. **API Layer (`src/api/`)**: Domain resource API files.
2. **Hooks Layer (`src/hooks/`)**: Custom hooks encapsulating state and calling the API layer.
3. **Feature Pages Layer (`src/features/`)**: Pages partitioned inside feature folders.

Supporting Directories:
- **`src/components/ui/`**: Reusable atomic UI elements built using shadcn/ui.
- **`src/types/`**: Centered typescript declarations, split into domain-specific files (e.g., `user.ts`, `ingredient.ts`, `menu.ts`, `order.ts`) and exported via a barrel `index.ts` file.
- **`src/utils/`**: Consolidated helpers (e.g. formatters).

## UI Rules

- Mobile-first (styles target mobile first, md: breakpoint for tablet/desktop)
- Responsive layout with collapsible sidebar menu on mobile
- Support light and dark mode
- Use clean dashboard layout with grouped sidebar navigation (Dashboard, Data Master, Keuangan, Operasional)
- Use shadcn/ui components where appropriate

## Data Fetching

Use TanStack Query for:
- Server state
- Loading state
- Error state
- Cache invalidation after mutations

## Forms

Use:
- React Hook Form
- Zod validation

Required forms:
- Login
- Ingredient form
- Expense form
- Menu form
- Recipe form
- Order form (Pemesanan)
- Personal cup form
- Inventory adjustment form

## Order Form (Pemesanan) & Flow Behavior

Order form (Pemesanan) must support:
- Multiple order items
- Menu selection
- Quantity
- Unit price
- Custom price override
- Notes
- Order date
- Extras/Add-ons
- Recipe ingredient exclusions

The Orders page lists active `PENDING` orders with:
1. A **Selesaikan** button: completes the order, reduces stock, creates a `Sale` record.
2. An **Edit** button: loads order info back into the form for updates.
3. Clickable **Notes** cell: displays long notes in a detail modal.

After successful order completion, edit, or creation:
- Show success message
- Invalidate orders query
- Invalidate sales query
- Invalidate inventory query
- Invalidate dashboard query

## Sales View Behavior

The Sales page does **not** allow creating sales directly. It displays a readonly table containing the completed transactions resulting from finished orders.

After deletion of a sale record:
- Show success message
- Invalidate sales query
- Invalidate inventory query
- Invalidate dashboard query

## Expense Form Behavior

Expense form must support multiple items.

Each item:
- Ingredient
- Quantity
- Unit
- Total price

After successful submit:
- Show success message
- Invalidate expenses query
- Invalidate inventory query
- Invalidate dashboard query

## Error Handling

Every API mutation must show:
- Loading state
- Success state
- Error state

Avoid silent failures.

## API Client

Create a centralized API client.

Recommended:
```txt
src/lib/api.ts
```

Use environment variable:
```env
VITE_API_URL=http://localhost:3000
```

## Authentication

V1 requires login.

Use:
- JWT access token
- Store token safely enough for local-first app
- Protect authenticated routes

Future:
- Multi-user support
- Roles and permissions
