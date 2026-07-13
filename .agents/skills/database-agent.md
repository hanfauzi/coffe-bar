# Database Agent Instructions

## Database

Use local PostgreSQL with Prisma ORM.

This project must work with a PostgreSQL instance running locally on the user's device.

## Prisma Requirements

Use:
- UUID primary keys
- Decimal for money and quantity fields
- DateTime for dates
- Enum for controlled types
- Relation fields with clear names

## Core Models

Required models:
- User
- Ingredient
- InventoryTransaction
- Expense
- ExpenseItem
- Menu
- RecipeItem
- Sale
- SaleItem
- PersonalConsumption
- Order
- OrderItem

## Important Design Rule

Do not rely only on `currentStock`.

Always maintain an inventory ledger through `InventoryTransaction`.

`currentStock` may exist for fast reads, but the ledger is the source of audit history.

## Ingredient Model

Ingredient should support:
- name
- category
- unit
- currentStock
- minimumStock
- latestUnitCost
- isPackaging
- isActive

Categories:
- RAW_MATERIAL
- PACKAGING
- OTHER

## InventoryTransaction Model

Must track every stock movement.

Types:
- PURCHASE
- SALE_USAGE
- PERSONAL_USAGE
- MANUAL_ADJUSTMENT
- WASTE
- CORRECTION

Fields:
- id
- ingredientId
- type
- quantityChange
- unit
- unitCostSnapshot
- referenceType
- referenceId
- notes
- createdAt

## Expense Model

Expense:
- id
- date
- supplier
- notes
- totalAmount
- createdAt
- updatedAt

ExpenseItem:
- id
- expenseId
- ingredientId
- quantity
- unit
- totalPrice
- unitCostSnapshot

## Menu and Recipe

Menu:
- id
- name
- defaultSellingPrice
- active
- createdAt
- updatedAt

RecipeItem:
- id
- menuId
- ingredientId
- quantity
- unit
- optional
- canExcludeForPersonalUse

Important:
`canExcludeForPersonalUse` helps personal cups skip cup usage.

## Sales

Sale:
- id
- saleDate
- totalRevenue
- totalHpp
- grossProfit
- notes
- createdAt

SaleItem:
- id
- saleId
- menuId
- quantity
- unitPrice
- customPrice
- finalPrice
- hppSnapshot
- notes

## Personal Consumption

PersonalConsumption:
- id
- date
- menuId
- estimatedCost
- useCup
- notes
- createdAt

## Orders

Order:
- id
- orderDate
- customerName
- status ("PENDING" / "COMPLETED" / "CANCELLED")
- notes
- createdAt
- updatedAt

OrderItem:
- id
- orderId
- menuId
- quantity
- unitPrice
- customPrice
- finalPrice
- notes
- excludedIngredients (array of string)
- parentItemId
- extras (relation to self)

## HPP V1

Use latest purchase cost.

For each recipe item:
```txt
ingredient.latestUnitCost * recipeItem.quantity
```

Menu HPP:
```txt
sum(all recipe item costs)
```

Sale item HPP:
```txt
menuHpp * quantity
```

Store HPP snapshot during sale creation.

Do not recalculate historical sales based on new ingredient prices.

## Future HPP Methods

Prepare but do not implement:
- Weighted average cost
- FIFO

Avoid schema decisions that make FIFO impossible later.

## Money Handling

Use Decimal.

Avoid JavaScript floating-point for money calculations where possible.
