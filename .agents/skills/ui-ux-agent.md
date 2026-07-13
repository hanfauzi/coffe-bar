# UI/UX Agent Instructions

## Source of Truth

Always follow `design.md` as the main design system source of truth. This file defines how to apply the design system into actual UX decisions, screens, and flows.


## Design Direction

Create a mobile-first and responsive business dashboard application with a clean, minimal, modern interface. The default layout must be optimized for mobile screens, with a transition to desktop layout at the md: breakpoint.

Visual inspiration:
- Vercel
- Notion
- Linear

The design should feel:
- Simple
- Clear
- Calm
- Professional
- Not playful
- Not crowded
- Easy to scan

## Theme

Support:
- Light mode
- Dark mode

Default may be light mode, but all components must work properly in both modes.

## Layout

Use a responsive, mobile-first dashboard layout:

- Header with mobile navigation trigger (hamburger menu) on small screens
- Collapsible sidebar that overlays on mobile and displays side-by-side starting at the md: breakpoint
- Main content area that adjusts spacing dynamically (e.g. p-4 on mobile, md:p-8 on desktop)

Mobile-first responsive design is the priority.

## Navigation

Sidebar items:
- Dashboard
- Pemesanan (Orders)
- Penjualan (Sales)
- Pengeluaran (Expenses)
- Bahan Baku (Ingredients)
- Menu & Resep
- Ledger Inventory
- Konsumsi Pribadi (Personal Cups)
- Laporan Keuangan

Use clear labels. Avoid confusing abbreviations.

## Dashboard Priority

Dashboard must prioritize:

1. Total Sales / Revenue
2. Total Expenses
3. Inventory Status
4. Low Stock Alerts
5. Gross Profit / Net Profit if available

Recommended dashboard cards:
- Today Revenue
- Monthly Revenue
- Monthly Expense
- Gross Profit
- Net Profit
- Low Stock Items
- Inventory Value
- Recent Sales
- Recent Expenses

## Orders UX (Pemesanan)

The Orders page is where all transactions are initiated.

1. **Order Form**: Opened via a "Buat Pesanan Baru" button.
   - Support adding multiple items.
   - Order date, Customer Name, Notes.
   - Menu item selection, quantity, and unit price.
   - Custom price override.
   - Select recipe ingredient exclusions.
   - Select extras / add-ons.
2. **Order List**:
   - Shows active pending orders.
   - Clicking on a truncated Notes field opens a dedicated modal to read the full text.
   - An **Edit** action allows loading the order items back into the form for adjustments.
   - A **Selesaikan** action opens a confirmation dialog to trigger payment and conversion into a Sale record.

## Sales UX

Sales is **strictly readonly** (only displaying existing completed transactions). The user cannot add sales directly here. Removing a sale is supported via a confirmation modal, which will restore raw ingredient stock.

## Expense UX

Expense form should support:
- Date
- Supplier
- Notes
- Multiple expense items
- Ingredient
- Quantity
- Unit
- Total price

After submit, explain clearly that inventory and latest cost will update.

## Inventory UX

Inventory page should show:
- Ingredient name
- Category
- Current stock
- Unit
- Minimum stock
- Status badge

Status examples:
- In Stock
- Low Stock
- Out of Stock

Use subtle badges and clear status colors.

## Forms

Form style:
- Clean labels
- Good spacing
- Inline validation
- Helpful placeholders
- Avoid too many fields in one visual block
- Use sections when needed

## Tables

Tables should be:
- Minimal
- Easy to scan
- Searchable where useful
- Filterable by date/status/category where useful

Avoid overly decorative tables.

## Empty States

Every page should have a useful empty state.

Example:
- No sales yet
- No ingredients yet
- No expenses recorded
- No low stock items

Each empty state should include a clear call-to-action.

## Tone

Use Indonesian labels by default.

Example:
- Penjualan
- Pengeluaran
- Inventory
- Bahan Baku
- Menu
- Laporan

Keep copy simple and practical.

## Design System Rule

Before creating or modifying any UI:
1. Read `design.md`.
2. Follow the Vercel + Notion + Linear blended design direction.
3. Use mobile-first responsive layout (mobile default, md: for tablet/desktop layout).
4. Support light and dark mode.
5. Keep the app minimal, calm, and business-oriented.
6. Prioritize form clarity, table readability, dashboard scanning, and inventory status visibility.

Do not create a separate visual style that conflicts with `design.md`.

## Architecture & Code Organization Rules

Adhere to the **3-Layer Architecture** (Page, Hooks, API) combined with centralized types, utilities, and reusable shadcn/ui components when developing:

1. **API Layer (`src/api/`)**: Centralizes raw `fetch` network calls, request options, endpoint definitions, and token injection. Written as modular files per business resource (`auth.ts`, `ingredients.ts`, `sales.ts`, etc.) and re-exported via `src/api/index.ts`.
2. **Hooks Layer (`src/hooks/`)**: Custom React hooks (e.g., `useIngredients.ts`, `useSales.ts`, `useAuth.ts`) that orchestrate fetching, state cache, lifecycle loading indicators, CRUD handlers, and error catching. Page components MUST consume these hooks instead of referencing the raw API object.
3. **Page/Component Layer (`src/features/`)**: Renders layout, markup, UI tables, forms, and alerts. Pages consume data states and mutation handlers directly from the custom hooks layer to maintain clean separation of concerns.

Supporting Layers:
- **UI Component Layer (`src/components/ui/`)**: Centralized, reusable atomic UI elements following the shadcn/ui structure (e.g., `button.tsx`, `dialog.tsx`, `table.tsx`, `input.tsx`, `select.tsx`, `card.tsx`) implementing standard styling.
- **Shared Types Layer (`src/types/`)**: A single centralized types definitions file (`index.ts`) containing domain models to guarantee type safety.
- **Utility Helpers Layer (`src/utils/`)**: A centralized helpers file (`helpers.ts`) for currency formatting, date/time formatting, and translations.

Additional organization rules:
- **Folder-Per-File**: Group visual screens and component elements into feature-specific folders (e.g. `src/features/sales/SalesPage.tsx`).
- **Backward Compatibility**: Keep redirect/wrapper assets (e.g., `src/lib/api.ts`) during architectural transitions to prevent import path breaks.
