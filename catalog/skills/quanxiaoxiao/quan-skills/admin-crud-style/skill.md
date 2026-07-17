---
name: admin-crud-style
description: Enforce consistent CRUD admin page style using React + shadcn/ui + Tailwind + lucide-react. Covers layout, filters, tables, pagination, forms, and interaction patterns for management systems.
---

# Admin CRUD Style

Generate and review CRUD admin pages with a unified layout, interaction, and component standard.

## Use This Skill

Use this skill when the task involves:

- creating a new admin CRUD page (list + create + edit + delete)
- reviewing an existing admin page for layout or interaction consistency
- scaffolding filters, tables, form dialogs, or pagination for a management UI
- ensuring shadcn/ui component usage follows the project baseline

## When NOT to use

Do not use this skill when:

- the task is a public-facing marketing or content page
- the task is a dashboard with charts or analytics (no CRUD table)
- the UI framework is not React + shadcn/ui + Tailwind

## Pre-Read Order

Read the target repository first:

1. `README.md`
2. `package.json`
3. existing admin pages for current patterns
4. `src/components/ui/` to check installed shadcn components

Then load bundled guidance from this skill pack:

5. `../../checklists/admin-crud-style.checklist.md`
6. `../../prompts/admin-crud-scaffold.md`

## Workflow

1. Identify the entity and its CRUD operations.
   Determine which fields are filterable, which are table columns, and which belong in the form.

2. Ensure required shadcn/ui components are installed.
   Check for Card, Button, Input, Select, Table, Badge, Dialog, Drawer, AlertDialog, DropdownMenu, Skeleton, Label, Pagination, Tooltip.

3. Apply the standard page structure.
   Every CRUD list page follows: PageHeader → FilterCard → TableCard (with Pagination) → FormDialog/Drawer.

4. Implement interaction patterns consistently.
   Enter triggers search, reset clears filters and resets pagination, edit opens pre-populated dialog, delete requires AlertDialog confirmation.

5. Split code into logical files.
   Page component, filter component, table component, form dialog component, and custom hooks for data fetching and mutations.

## Implementation Rules

### Technology Stack

- React + Tailwind CSS + shadcn/ui + lucide-react
- @tanstack/react-query for data fetching
- Zod for form validation
- sonner for toast notifications

### Page Layout

```
PageContainer (p-6 space-y-6 bg-muted/30)
├─ PageHeader (title + primary action button)
├─ FilterCard (Card p-4, max 4 fields per row, gap-4)
├─ TableCard (Card p-4, Table + Pagination)
└─ FormDialog or FormDrawer
```

### Component Rules

- Filters and table in separate Cards
- Dialog for simple forms, Drawer for complex multi-section forms
- Delete via AlertDialog with destructive style
- Badge for status columns
- Icons from lucide-react only
- Loading state: skeleton rows or overlay, never empty table
- Empty state: clean message, no large illustrations

### Styling

- Spacing: `gap-4`, `gap-6`, `p-4`, `p-6`
- Borders: `border-muted`
- Corners: `rounded-xl`
- Avoid excessive shadows or animations

### File Structure

```
pages/<entity>/
├── index.tsx
├── components/
│   ├── <entity>-filters.tsx
│   ├── <entity>-table.tsx
│   └── <entity>-form-dialog.tsx
└── hooks/
    ├── use-<entity>-list.ts
    └── use-<entity>-form.ts
```

### Hook Naming

```
use<Entity>List
use<Entity>Form
use<Entity>Filters
```

## Verification

Before completing, verify:

1. Page follows the standard layout structure
2. All required shadcn components are installed
3. Filters, table, form, and delete confirmation all present
4. Interaction patterns match the spec (Enter search, reset, pre-populated edit, delete confirmation)
5. Code is split into logical files, not monolithic
6. Keyboard navigation and basic accessibility work

## Output Contract

Return results in this order:

1. `Entity` — what CRUD entity is being built
2. `Components` — list of files created or modified
3. `shadcn Components` — any newly installed components
4. `Verification` — interaction and layout checks passed
