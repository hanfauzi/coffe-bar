# Coffee Business Tracker - Design System

## Source Inspiration

This product uses a blended design language inspired by Vercel, Notion, and Linear.

Use Vercel for precision: near-white surfaces, near-black ink, hairline borders, Geist/Inter typography, minimal shadows, and engineered clarity.

Use Notion for warmth: paper-soft canvas, calm document-like spacing, friendly readable forms, and restrained blue/link accents.

Use Linear for dashboard depth: excellent dark mode, surface ladder, dense product UI, subtle borders, clear hierarchy, and lavender focus/primary accents.

Do not copy any brand exactly. Build a practical internal dashboard for coffee sales, inventory, expense, HPP, and reports.

---

## Product Personality

The UI must feel minimal, calm, professional, practical, fast to scan, and business-oriented.

Avoid playful visuals, heavy colors, heavy shadows, and decorative complexity.

This is an internal business app, not a marketing website.

---

## Theme Strategy

Support both light mode and dark mode.

Light mode should feel closer to Vercel + Notion: warm off-white canvas, white cards, near-black text, hairline borders.

Dark mode should feel closer to Linear: near-black canvas, layered dark surfaces, subtle borders, lavender primary/focus.

---

# Color System

## Light Mode Tokens

```txt
canvas: #f6f5f4
surface: #ffffff
surface-soft: #fafafa
surface-muted: #f2f2f2
border: #e6e6e6
border-strong: #d9d9d9
ink: #171717
ink-secondary: #4d4d4d
ink-muted: #8f8f8f
ink-faint: #a1a1a1
primary: #171717
primary-hover: #313131
link: #0070f3
focus: #5e6ad2
success: #27a644
warning: #f5a623
error: #ee0000
```

Rules:
- Use warm paper canvas for app background.
- Use white for cards, tables, inputs, and panels.
- Use near-black for primary CTA.
- Use blue only for links, focus, and important active states.
- Do not overuse colorful accents.

## Dark Mode Tokens

```txt
canvas: #010102
surface-1: #0d0e12
surface-2: #16171d
surface-3: #1d1f27
surface-4: #252833
border: #23252a
border-strong: #343741
ink: #f7f8f8
ink-secondary: #d0d6e0
ink-muted: #8a8f98
ink-faint: #62666d
primary: #5e6ad2
primary-hover: #828fff
focus: #5e69d1
success: #27a644
warning: #f5a623
error: #ff4d4f
```

Rules:
- Use a dark surface ladder instead of heavy shadows.
- Use lavender only for primary CTA, active states, and focus.
- Semantic colors are allowed only for real statuses and validation.

---

# Typography

Use:

```txt
font-sans: Inter, Geist Sans, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
font-mono: Geist Mono, JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, monospace
```

Type scale:

```txt
display: 48px / 56px / 600 / -1.8px
h1: 32px / 40px / 600 / -1.0px
h2: 24px / 32px / 600 / -0.4px
h3: 20px / 28px / 600 / -0.2px
body-lg: 16px / 24px / 400 / 0
body: 14px / 20px / 400 / 0
body-sm: 12px / 16px / 400 / 0
label: 14px / 20px / 500 / 0
button: 14px / 20px / 500 / 0
caption: 12px / 16px / 400 / 0
mono-eyebrow: 12px / 16px / 500 / 0.4px
```

Rules:
- Use 600 for headings.
- Use 400 for body.
- Use 500 for labels and buttons.
- Use negative tracking only for large headings.
- Use mono only for technical labels, IDs, code, compact metadata, and report labels.

---

# Layout System

## App Shell

Use a mobile-first responsive dashboard layout:

```txt
Mobile: Mobile Header (with hamburger button) + Scrollable Content
Desktop (md+): Sidebar + Header + Main Content
```

Sidebar width:

```txt
sidebar-width: 240px
collapsed-width: 72px
```

Navigation:
- Dashboard
- Sales
- Expenses
- Inventory
- Ingredients
- Menu & Recipes
- Personal Cups
- Reports
- Settings

## Container

```txt
max-content-width: 1280px
page-padding-desktop: 32px
page-padding-tablet: 24px
page-padding-mobile: 16px
```

## Spacing

Use a 4px base scale:

```txt
4, 8, 12, 16, 24, 32, 40, 48, 64, 96
```

Rules:
- Card padding: 24px
- Dense card padding: 16px
- Page section gap: 32px
- Form field gap: 16px
- Table row padding: 12px 16px

---

# Shape System

```txt
radius-xs: 4px
radius-sm: 6px
radius-md: 8px
radius-lg: 12px
radius-xl: 16px
radius-full: 9999px
```

Usage:
- Inputs: 6px or 8px
- Buttons: 8px
- Cards: 12px
- Large panels: 16px
- Badges: full pill

Do not overuse pill buttons inside the app. Pill buttons are mainly for badges and filters.

---

# Elevation

Default surfaces should use border first, shadow second.

Light mode soft shadow:

```css
box-shadow:
  0 1px 1px rgba(0,0,0,0.04),
  0 8px 16px -8px rgba(0,0,0,0.08);
```

Dark mode:
- Prefer surface ladder + border.
- Use shadow rarely.

---

# Component Guidelines

## Buttons

Primary button:
- Light mode: near-black background, white text.
- Dark mode: lavender background, white text.
- Radius: 8px.
- Height: 40px.

Secondary button:
- Surface background.
- Border.
- Ink text.
- Radius: 8px.

Ghost button:
- Transparent background.
- Muted text.
- Subtle hover background.

## Cards

Cards should have:
- Surface background.
- 1px border.
- 12px radius.
- 16-24px padding.

Avoid heavy shadows, colorful card backgrounds, and excessive gradients.

## Forms

Forms are critical in this product.

Use:
- Clear labels.
- Helpful placeholders.
- Inline validation.
- Section grouping.
- Footer actions.

Required forms:
- Login.
- Ingredient.
- Expense.
- Menu.
- Recipe.
- Sales.
- Personal Cup.
- Inventory Adjustment.

## Tables

Tables must be clean, readable, and dense enough for business data.

Use:
- Sticky header where useful.
- 12px to 16px cell padding.
- Row border.
- Muted metadata.
- Clear action column.
- Search and filters above table.

## Badges

Use badges for:
- In Stock.
- Low Stock.
- Out of Stock.
- Active.
- Inactive.
- Personal.
- Custom Price.

Badge style:
- Pill radius.
- 12px font.
- Subtle background.
- Semantic color only when useful.

---

# Page UX

## Dashboard

Priority:
1. Total sales / revenue.
2. Total expenses.
3. Gross profit and net profit.
4. Inventory status.
5. Low stock alerts.
6. Recent transactions.

Required KPI cards:
- Total Revenue.
- Total Expenses.
- Gross Profit.
- Net Profit.
- Low Stock Items.
- Inventory Value.

## Sales

Use form-based workflow, not POS style.

Sales form fields:
- Sale date.
- Menu item.
- Quantity.
- Unit price.
- Custom price override.
- Notes.
- Multiple sale items.

After saving:
- Update sales.
- Deduct inventory.
- Snapshot HPP.
- Update dashboard.

## Expenses

Expense form fields:
- Date.
- Supplier.
- Notes.
- Multiple expense items.
- Ingredient.
- Quantity.
- Unit.
- Total price.

After saving:
- Increase inventory.
- Update latest unit cost.
- Update dashboard.

## Inventory

Must show:
- Ingredient.
- Category.
- Current stock.
- Unit.
- Minimum stock.
- Status.
- Actions.

## Personal Cups

Must support:
- Menu selection.
- Date.
- Use cup toggle.
- Notes.

If use cup is false, do not deduct cup inventory, but still deduct relevant ingredients.

---

# Responsive Behavior

Mobile first.

Breakpoints:

```txt
mobile: default (< 768px)
tablet/desktop: md: (768px+)
```

Rules:
- Mobile layout is default (styles target small screens first).
- Use `md:` modifier as the transition point to tablet/desktop styling.
- On mobile/tablet, sidebar is hidden by default and overlays the screen when active.
- Starting at `md:`, sidebar remains fixed side-by-side with main content.
- Tables should have overflow scroll wrapper or wrap text cleanly.
- Forms should stack input fields vertically on mobile and convert to inline grids starting at `md:`.
- KPI grid should be 1 column on mobile, and 2 or 4 columns starting at `md:`.

---

# Do's

- Use warm off-white canvas in light mode.
- Use dark surface ladder in dark mode.
- Use hairline borders.
- Use restrained accent colors.
- Make forms extremely clear.
- Make inventory status obvious.
- Keep dashboard scannable.
- Use Indonesian labels in the app.
- Use concise copy.
- Preserve whitespace.

# Don'ts

- Do not make the app playful.
- Do not use too many colors.
- Do not use heavy shadows.
- Do not copy Vercel, Notion, or Linear exactly.
- Do not use marketing-style hero sections inside the app.
- Do not use gradients except for rare decorative onboarding or empty states.
- Do not make the dashboard too crowded.
- Do not hide important inventory warnings.
- Do not use POS-style sales input.
