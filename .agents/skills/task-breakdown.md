# Coffee Business Tracker - Task Breakdown

## Phase 0 - Project Setup

### Backend
- Initialize NestJS project
- Setup Prisma
- Setup local PostgreSQL connection
- Setup environment variables
- Create base modules

### Frontend
- Initialize React + Vite + TypeScript
- Setup Tailwind CSS
- Setup shadcn/ui
- Setup React Router
- Setup TanStack Query
- Setup app layout

## Phase 1 - Authentication

### Backend
- User model
- Register initial owner
- Login endpoint
- JWT strategy
- Auth guard

### Frontend
- Login page
- Protected routes
- Auth state
- Logout

## Phase 2 - Ingredients & Inventory Foundation

### Backend
- Ingredient CRUD
- Inventory transaction model
- Manual stock adjustment
- Low stock logic

### Frontend
- Ingredients page
- Inventory page
- Ingredient form
- Inventory adjustment form
- Low stock badges

## Phase 3 - Expense Management

### Backend
- Expense model
- Expense item model
- Create expense with transaction
- Update latest ingredient cost
- Increase inventory
- Create inventory ledger records

### Frontend
- Expense list
- Expense create form
- Multi-item expense input
- Expense detail

## Phase 4 - Menu & Recipe

### Backend
- Menu CRUD
- Recipe item CRUD
- Calculate menu HPP

### Frontend
- Menu list
- Menu form
- Recipe builder
- HPP preview

## Phase 5 - Sales Tracker

### Backend
- Sale model
- Sale item model
- Create sale with inventory deduction
- Snapshot HPP
- Calculate gross profit

### Frontend
- Sales list
- Sales form
- Multiple sale items
- Custom price override
- Sale detail

## Phase 6 - Personal Cups

### Backend
- Personal consumption model
- Create personal cup usage
- Exclude cup when useCup is false
- Deduct relevant inventory

### Frontend
- Personal cups list
- Personal cup form
- Use cup toggle

## Phase 7 - Dashboard & Reports

### Backend
- Dashboard summary endpoint
- Revenue report
- Expense report
- Profit report
- Inventory status report

### Frontend
- Dashboard KPI cards
- Recent sales
- Recent expenses
- Low stock alert section
- Report filters

## Phase 8 - Polish

- Loading states
- Error states
- Empty states
- Dark mode polish
- Responsive polish
- Seed data
- README setup guide

## Future Phase

Do not implement in V1 unless requested:
- Excel export
- PDF export
- Other expense categories
- Multi-user role management
- Multi-branch
- Cloud database
