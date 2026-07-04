# Column Definitions Reference

Comprehensive guide to MRT column definitions, migration between versions, and best practices.

---

## Table of Contents

1. [Core Column Options](#core-column-options)
2. [Accessor Patterns](#accessor-patterns)
3. [Custom Rendering](#custom-rendering)
4. [Filtering Options](#filtering-options)
5. [Sorting & Grouping](#sorting--grouping)
6. [Editing Configuration](#editing-configuration)
7. [Column Sizing & Layout](#column-sizing--layout)
8. [Type Safety](#type-safety)
9. [Migration Guide V1 → V2 → V3](#migration-guide-v1--v2--v3)
10. [Best Practices](#best-practices)
11. [Advanced Patterns](#advanced-patterns)
12. [Common Gotchas](#common-gotchas)

---

## Core Column Options

### Complete Column Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `accessorKey` | `string & keyof TData` | — | Data field key (dot notation supported) |
| `accessorFn` | `(row: TData) => any` | — | Custom accessor function |
| `id` | `string` | — | Unique column ID (required with `accessorFn`) |
| `header` | `string` | — | Column header text (required) |
| `Header` | `ReactNode \| (props) => ReactNode` | — | Custom header JSX |
| `Cell` | `(props) => ReactNode` | — | Custom cell renderer |
| `Footer` | `ReactNode \| (props) => ReactNode` | — | Footer content |
| `size` | `number` | `180` | Column width (px) |
| `minSize` | `number` | `40` | Minimum width (px) |
| `maxSize` | `number` | `1000` | Maximum width (px) |
| `grow` | `boolean \| number` | — | Flex grow in grid layout |
| `enableSorting` | `boolean` | `true` | Allow sorting |
| `enableColumnFilter` | `boolean` | `true` | Allow filtering |
| `enableGlobalFilter` | `boolean` | `true` | Include in global search |
| `enableHiding` | `boolean` | `true` | Show in visibility toggle |
| `enableResizing` | `boolean` | — | Allow column resizing |
| `enablePinning` | `boolean` | — | Allow column pinning |
| `enableEditing` | `boolean \| (row) => boolean` | — | Allow editing |
| `enableClickToCopy` | `boolean \| 'context-menu'` | — | Copy on click |
| `enableColumnActions` | `boolean` | — | Show column menu |
| `enableColumnDragging` | `boolean` | — | Allow drag reorder |
| `visibleInShowHideMenu` | `boolean` | `true` | Show in column visibility menu |
| `meta` | `any` | — | Custom metadata storage |

---

## Accessor Patterns

### Method 1: accessorKey (Recommended)

Simplest approach - matches data object keys directly.

```tsx
// Simple key
{ accessorKey: 'name', header: 'Name' }

// Nested data with dot notation
{ accessorKey: 'address.city', header: 'City' }
{ accessorKey: 'contact.email', header: 'Email' }

// Deep nesting
{ accessorKey: 'company.location.country', header: 'Country' }
```

### Method 2: accessorFn with id

For computed or transformed values. **Always requires `id`**.

```tsx
// Computed value
{
  accessorFn: (row) => `${row.firstName} ${row.lastName}`,
  id: 'fullName',
  header: 'Full Name',
}

// Numeric computation
{
  accessorFn: (row) => row.price * row.quantity,
  id: 'total',
  header: 'Total',
}

// Conditional value
{
  accessorFn: (row) => row.completedAt ? 'Done' : 'Pending',
  id: 'status',
  header: 'Status',
}

// Date formatting (return primitive for sorting)
{
  accessorFn: (row) => new Date(row.createdAt).getTime(),
  id: 'createdAt',
  header: 'Created',
  Cell: ({ cell }) => new Date(cell.getValue<number>()).toLocaleDateString(),
}
```

### Method 3: createMRTColumnHelper (Type-Safe)

**V2+ only.** Best for TypeScript projects.

```tsx
import { createMRTColumnHelper } from 'material-react-table';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'Active' | 'Inactive';
}

const columnHelper = createMRTColumnHelper<User>();

const columns = [
  // Simple accessor - type-safe accessorKey
  columnHelper.accessor('firstName', {
    header: 'First Name',
  }),

  // Computed accessor with TValue inference
  columnHelper.accessor((row) => `${row.firstName} ${row.lastName}`, {
    id: 'fullName',
    header: 'Full Name',
    // cell.getValue() returns string, not unknown!
    Cell: ({ cell }) => <strong>{cell.getValue()}</strong>,
  }),

  // Numeric accessor
  columnHelper.accessor('age', {
    header: 'Age',
    filterVariant: 'range',
    // cell.getValue() returns number
  }),
];
```

---

## Custom Rendering

### Cell Rendering

**CRITICAL**: Never put JSX in `accessorFn`. Use `Cell` for rendering.

```tsx
// ❌ WRONG - breaks sorting/filtering
{
  accessorFn: (row) => <Chip label={row.status} />, // DON'T DO THIS
  id: 'status',
}

// ✅ CORRECT - accessor returns primitive, Cell renders JSX
{
  accessorKey: 'status',
  header: 'Status',
  Cell: ({ cell }) => (
    <Chip
      label={cell.getValue<string>()}
      color={cell.getValue<string>() === 'Active' ? 'success' : 'default'}
      size="small"
    />
  ),
}
```

### Cell Props Available

```tsx
Cell: ({ cell, column, row, table, renderedCellValue }) => {
  // cell.getValue<T>() - typed value
  // row.original - full row data
  // row.index - row index
  // column.id - column identifier
  // table - table instance
  // renderedCellValue - default rendered value
}
```

### Header Rendering

```tsx
{
  accessorKey: 'priority',
  header: 'Priority', // Required string for internal use
  Header: ({ column }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <PriorityHighIcon fontSize="small" />
      <span>{column.columnDef.header}</span>
    </Box>
  ),
}
```

### Footer Rendering

```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  Footer: ({ table }) => {
    const total = table.getFilteredRowModel().rows.reduce(
      (sum, row) => sum + row.getValue<number>('amount'),
      0
    );
    return <strong>Total: ${total.toLocaleString()}</strong>;
  },
}
```

---

## Filtering Options

### Filter Variants

| Variant | Use Case | Data Type |
|---------|----------|-----------|
| `'text'` | Free text search (default) | string |
| `'select'` | Single option dropdown | enum |
| `'multi-select'` | Multiple options | array |
| `'range'` | Numeric range inputs | number |
| `'range-slider'` | Numeric slider | number |
| `'date'` | Single date picker | Date |
| `'date-range'` | Date range picker | Date |
| `'datetime'` | Date + time picker | Date |
| `'datetime-range'` | DateTime range | Date |
| `'time'` | Time only | Date |
| `'time-range'` | Time range | Date |
| `'autocomplete'` | Searchable dropdown | any |
| `'checkbox'` | Boolean toggle | boolean |

### Filter Configuration

```tsx
// Select filter with options
{
  accessorKey: 'status',
  header: 'Status',
  filterVariant: 'select',
  filterSelectOptions: ['Active', 'Inactive', 'Pending'],
}

// Select with label/value pairs (V3 format)
{
  accessorKey: 'role',
  header: 'Role',
  filterVariant: 'select',
  filterSelectOptions: [
    { label: 'Administrator', value: 'admin' },
    { label: 'Regular User', value: 'user' },
    { label: 'Guest', value: 'guest' },
  ],
}

// Range slider
{
  accessorKey: 'salary',
  header: 'Salary',
  filterVariant: 'range-slider',
  muiFilterSliderProps: {
    min: 0,
    max: 200000,
    step: 5000,
    valueLabelFormat: (v) => `$${v.toLocaleString()}`,
  },
}

// Date range
{
  accessorKey: 'createdAt',
  header: 'Created',
  filterVariant: 'date-range',
}

// Multi-select
{
  accessorKey: 'tags',
  header: 'Tags',
  filterVariant: 'multi-select',
  filterSelectOptions: ['Frontend', 'Backend', 'DevOps', 'Design'],
}
```

### Filter Functions

```tsx
// Built-in filter functions
filterFn: 'contains'         // Case-insensitive contains
filterFn: 'fuzzy'            // Fuzzy matching (default)
filterFn: 'equals'           // Exact match
filterFn: 'startsWith'       // Starts with
filterFn: 'endsWith'         // Ends with
filterFn: 'empty'            // Is empty
filterFn: 'notEmpty'         // Is not empty
filterFn: 'between'          // Between two values
filterFn: 'betweenInclusive' // Between inclusive
filterFn: 'greaterThan'      // Greater than
filterFn: 'lessThan'         // Less than

// Custom filter function
{
  accessorKey: 'name',
  header: 'Name',
  filterFn: (row, columnId, filterValue) => {
    const value = row.getValue<string>(columnId).toLowerCase();
    return value.startsWith(filterValue.toLowerCase());
  },
}
```

### Filter Modes (Faceted)

Allow users to switch filter logic per column:

```tsx
{
  accessorKey: 'category',
  header: 'Category',
  filterVariant: 'text',
  enableColumnFilterModes: true, // Shows mode switcher
  // User can switch between: contains, equals, startsWith, etc.
}
```

---

## Sorting & Grouping

### Sorting Configuration

```tsx
// Disable sorting for column
{
  accessorKey: 'actions',
  header: 'Actions',
  enableSorting: false,
}

// Sort descending first
{
  accessorKey: 'createdAt',
  header: 'Created',
  sortDescFirst: true,
}

// Custom sort function
{
  accessorKey: 'priority',
  header: 'Priority',
  sortingFn: (rowA, rowB, columnId) => {
    const order = { High: 3, Medium: 2, Low: 1 };
    return order[rowA.getValue(columnId)] - order[rowB.getValue(columnId)];
  },
}

// Handle undefined values
{
  accessorKey: 'completedAt',
  header: 'Completed',
  sortUndefined: 'last', // 'first' | 'last' | false | -1 | 1
}

// Invert sort direction (useful for ranks)
{
  accessorKey: 'rank',
  header: 'Rank',
  invertSorting: true, // Lower = better
}
```

### Grouping & Aggregation

```tsx
{
  accessorKey: 'department',
  header: 'Department',
  enableGrouping: true,
  GroupedCell: ({ row, cell }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FolderIcon />
      <strong>{cell.getValue<string>()}</strong>
      <Chip size="small" label={row.subRows.length} />
    </Box>
  ),
}

{
  accessorKey: 'salary',
  header: 'Salary',
  aggregationFn: 'sum', // 'sum' | 'mean' | 'median' | 'min' | 'max' | 'count' | custom
  AggregatedCell: ({ cell }) => (
    <strong>Total: ${cell.getValue<number>().toLocaleString()}</strong>
  ),
}

// Custom aggregation
{
  accessorKey: 'score',
  header: 'Score',
  aggregationFn: (columnId, leafRows) => {
    const values = leafRows.map(row => row.getValue<number>(columnId));
    return values.reduce((a, b) => a + b, 0) / values.length; // Average
  },
}
```

---

## Editing Configuration

### Edit Variants

```tsx
// Text input (default)
{
  accessorKey: 'name',
  header: 'Name',
  enableEditing: true,
  muiEditTextFieldProps: {
    required: true,
    type: 'text',
  },
}

// Select dropdown
{
  accessorKey: 'status',
  header: 'Status',
  editVariant: 'select',
  editSelectOptions: ['Active', 'Inactive', 'Pending'],
}

// Select with dynamic options
{
  accessorKey: 'role',
  header: 'Role',
  editVariant: 'select',
  editSelectOptions: ({ row }) =>
    row.original.isAdmin ? ['Admin', 'SuperAdmin'] : ['User', 'Guest'],
}

// Number input
{
  accessorKey: 'age',
  header: 'Age',
  muiEditTextFieldProps: {
    type: 'number',
    inputProps: { min: 0, max: 120 },
  },
}

// Multiline text
{
  accessorKey: 'description',
  header: 'Description',
  muiEditTextFieldProps: {
    multiline: true,
    rows: 3,
  },
}

// Date input
{
  accessorKey: 'birthDate',
  header: 'Birth Date',
  muiEditTextFieldProps: {
    type: 'date',
    InputLabelProps: { shrink: true },
  },
}
```

### Conditional Editing

```tsx
{
  accessorKey: 'salary',
  header: 'Salary',
  enableEditing: (row) => row.original.role === 'Admin', // Only admins can edit
}
```

### Edit Validation

```tsx
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

{
  accessorKey: 'email',
  header: 'Email',
  muiEditTextFieldProps: {
    required: true,
    type: 'email',
    error: !!validationErrors.email,
    helperText: validationErrors.email,
    onBlur: (e) => {
      const value = e.target.value;
      if (!value) {
        setValidationErrors(prev => ({ ...prev, email: 'Required' }));
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        setValidationErrors(prev => ({ ...prev, email: 'Invalid email' }));
      } else {
        setValidationErrors(prev => ({ ...prev, email: undefined }));
      }
    },
  },
}
```

### Custom Edit Component

```tsx
{
  accessorKey: 'color',
  header: 'Color',
  Edit: ({ cell, column, row, table }) => (
    <ColorPicker
      value={cell.getValue<string>()}
      onChange={(color) => {
        row._valuesCache[column.id] = color;
      }}
    />
  ),
}
```

---

## Column Sizing & Layout

### Size Properties

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  size: 200,      // Default width (px)
  minSize: 100,   // Minimum resize width
  maxSize: 400,   // Maximum resize width
  grow: true,     // Allow flex grow (grid layout)
}
```

### Layout Modes (V2+)

```tsx
// Table options
layoutMode: 'semantic'     // Traditional table (default for non-resizing)
layoutMode: 'grid'         // CSS Grid (columns can grow)
layoutMode: 'grid-no-grow' // CSS Grid, fixed widths (default with resizing)
```

### Alignment

```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  muiTableHeadCellProps: {
    align: 'right',
  },
  muiTableBodyCellProps: {
    align: 'right',
  },
}
```

---

## Type Safety

### Basic Type Definition

```tsx
import { useMemo } from 'react';
import { MRT_ColumnDef } from 'material-react-table';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'Active' | 'Inactive';
}

const columns = useMemo<MRT_ColumnDef<Person>[]>(
  () => [
    { accessorKey: 'firstName', header: 'First Name' }, // Type-checked
    { accessorKey: 'age', header: 'Age' },
    // { accessorKey: 'invalid', header: 'X' }, // TS Error!
  ],
  []
);
```

### Column Helper (Recommended)

```tsx
const columnHelper = createMRTColumnHelper<Person>();

const columns = [
  columnHelper.accessor('firstName', { header: 'First Name' }),
  columnHelper.accessor('age', {
    header: 'Age',
    Cell: ({ cell }) => {
      const age = cell.getValue(); // Inferred as number!
      return age >= 18 ? '✓' : '✗';
    },
  }),
];
```

### JSDoc for JavaScript Projects

```javascript
/** @type {import('material-react-table').MRT_ColumnDef<Person>[]} */
const columns = [
  { accessorKey: 'firstName', header: 'First Name' },
];
```

---

## Migration Guide V1 → V2 → V3

### V1 → V2 Breaking Changes

#### Import Changes
```tsx
// V1
import MaterialReactTable from 'material-react-table';

// V2+
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
```

#### tableInstanceRef → useMaterialReactTable Hook

```tsx
// V1 - Problematic ref approach
const tableInstanceRef = useRef();
<MaterialReactTable tableInstanceRef={tableInstanceRef} />
// Issues: stale refs, re-render problems

// V2+ - Hook returns full instance
const table = useMaterialReactTable({ columns, data });
<MaterialReactTable table={table} />
// Full access to table.getState(), table.setColumnFilters(), etc.
```

#### Renamed Props

| V1 | V2+ |
|----|-----|
| `editingMode` | `editDisplayMode` |
| `rowNumberMode` | `rowNumberDisplayMode` |
| `enablePinning` | `enableColumnPinning` + `enableRowPinning` |
| `virtualizerInstanceRef` | `rowVirtualizerRef` + `columnVirtualizerRef` |
| `virtualizerProps` | `rowVirtualizerOptions` + `columnVirtualizerOptions` |
| `muiTablePaginationProps` | `muiPaginationProps` |
| `muiTableBodyCellEditTextFieldProps` | `muiEditTextFieldProps` |
| `muiTableHeadCellFilterTextFieldProps` | `muiFilterTextFieldProps` |
| `muiTableHeadCellFilterSliderProps` | `muiFilterSliderProps` |
| `muiTableBodyCellCopyButtonProps` | `muiCopyButtonProps` |
| `muiTableBodyCellSkeletonProps` | `muiSkeletonProps` |
| `muiTableBodyRowDragHandleProps` | `muiRowDragHandleProps` |
| `muiTableDetailPanelProps` | `muiDetailPanelProps` |
| `muiTableHeadCellColumnActionsButtonProps` | `muiColumnActionsButtonProps` |
| `muiTableHeadCellDragHandleProps` | `muiColumnDragHandleProps` |

#### Type Renames

| V1 | V2+ |
|----|-----|
| `MaterialReactTableProps` | `MRT_TableOptions` |
| `MRT_FilterFnsState` | `MRT_ColumnFilterFns` |
| `MRT_FullScreenToggleButton` | `MRT_ToggleFullScreenButton` |

#### Column Sizing Behavior

```tsx
// V1 - Columns grow to fill space
// V2+ - Columns maintain fixed width when resizing enabled

// To revert to V1 behavior:
layoutMode: 'grid' // Allows column growth

// Remove V1 workarounds like:
// muiTableBodyCellProps: { sx: { flex: '0 0 auto' } } // DELETE THIS
```

#### New Peer Dependencies

```bash
# V2+ requires:
npm install @mui/x-date-pickers

# Must wrap app in LocalizationProvider for date features
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <App />
</LocalizationProvider>
```

### V2 → V3 Breaking Changes

#### MUI V6 Required

```bash
# V3 minimum requirements:
@mui/material >= 6.0.0
@mui/icons-material >= 6.0.0
@mui/x-date-pickers >= 7.15.0
react >= 18.0.0
```

#### Select Option Schema Change

```tsx
// V2 - 'text' property
filterSelectOptions: [
  { text: 'Active', value: 'active' },
]

// V3 - 'label' property (MUI V6 standard)
filterSelectOptions: [
  { label: 'Active', value: 'active' },
]
```

#### Virtualizer Type Changes

```tsx
// V2
import type { MRT_Virtualizer } from 'material-react-table';

// V3 - Split types
import type {
  MRT_RowVirtualizer,
  MRT_ColumnVirtualizer
} from 'material-react-table';
```

#### Keyboard Navigation Default

```tsx
// V3 - Keyboard shortcuts enabled by default
// To disable:
enableKeyboardShortcuts: false
```

#### Stricter TypeScript for sx Props

```tsx
// V3 (MUI V6) - More strict sx typing
// May need to cast or use theme tokens

// Before (might error in V3)
sx={{ color: '#ff0000' }}

// After (safer)
sx={{ color: 'error.main' }}
// or
sx={{ color: '#ff0000' as any }}
```

### Migration Checklist

#### V1 → V2
- [ ] Change import to named export
- [ ] Replace `tableInstanceRef` with `useMaterialReactTable`
- [ ] Rename `editingMode` → `editDisplayMode`
- [ ] Split `enablePinning` into column/row versions
- [ ] Rename all `muiTable*Props` to shorter names
- [ ] Install `@mui/x-date-pickers` if using dates
- [ ] Add `LocalizationProvider` wrapper
- [ ] Remove flex CSS workarounds for column sizing

#### V2 → V3
- [ ] Upgrade MUI to v6+
- [ ] Upgrade `@mui/x-date-pickers` to v7.15+
- [ ] Change `text` to `label` in select options
- [ ] Update virtualizer type imports
- [ ] Test keyboard navigation (now default)
- [ ] Fix any `sx` TypeScript errors

---

## Best Practices

### 1. Always Memoize Columns

```tsx
// ✅ CORRECT - Memoized
const columns = useMemo<MRT_ColumnDef<Person>[]>(() => [
  { accessorKey: 'name', header: 'Name' },
], []);

// ❌ WRONG - Recreated every render
const columns = [
  { accessorKey: 'name', header: 'Name' },
];
```

### 2. Memoize Data

```tsx
// ✅ CORRECT
const [data] = useState<Person[]>(initialData);
// or
const data = useMemo(() => fetchedData, [fetchedData]);

// ❌ WRONG - Causes infinite re-renders
<MaterialReactTable data={fetchData()} />
```

### 3. Keep Accessors Pure

```tsx
// ✅ CORRECT - Return primitives
accessorFn: (row) => row.price * row.quantity

// ❌ WRONG - JSX in accessor breaks sorting/filtering
accessorFn: (row) => <Chip label={row.status} />
```

### 4. Use Type-Safe Helpers

```tsx
// ✅ RECOMMENDED for TypeScript
const columnHelper = createMRTColumnHelper<Person>();
columnHelper.accessor('name', { header: 'Name' })

// Also good
const columns: MRT_ColumnDef<Person>[] = [...]
```

### 5. Share Default Options

```tsx
// Create reusable defaults
function getDefaultMRTOptions<T extends Record<string, any>>():
  Partial<MRT_TableOptions<T>> {
  return {
    enableColumnResizing: true,
    enableStickyHeader: true,
    muiTablePaperProps: { elevation: 0 },
    initialState: { density: 'compact' },
  };
}

// Use per table
const table = useMaterialReactTable({
  ...getDefaultMRTOptions<Person>(),
  columns,
  data,
});
```

### 6. Define Columns Outside Component

```tsx
// ✅ BEST - No useMemo needed, truly stable
const columns: MRT_ColumnDef<Person>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
];

function MyTable({ data }: { data: Person[] }) {
  const table = useMaterialReactTable({ columns, data });
  return <MaterialReactTable table={table} />;
}
```

### 7. Prefer filterVariant Over Custom UI

```tsx
// ✅ CORRECT - Use built-in variants
{ filterVariant: 'select', filterSelectOptions: ['A', 'B'] }

// ❌ AVOID - Custom filter UI when not needed
renderColumnFilterModeMenuItems: () => [...] // Overkill for simple cases
```

---

## Advanced Patterns

### Hybrid Computed Column

Sort by raw value, render with component:

```tsx
{
  id: 'progress',
  accessorFn: (row) => row.completedTasks / row.totalTasks, // 0-1 for sorting
  header: 'Progress',
  Cell: ({ cell }) => (
    <LinearProgress
      variant="determinate"
      value={cell.getValue<number>() * 100}
      color={cell.getValue<number>() === 1 ? 'success' : 'primary'}
    />
  ),
  filterVariant: 'range-slider',
  muiFilterSliderProps: {
    min: 0,
    max: 1,
    step: 0.1,
    valueLabelFormat: (v) => `${(v * 100).toFixed(0)}%`,
  },
}
```

### Dynamic Edit Options

Load options asynchronously:

```tsx
function EditableTable() {
  const { data: roles } = useQuery(['roles'], fetchRoles);

  const columns = useMemo<MRT_ColumnDef<User>[]>(() => [
    {
      accessorKey: 'role',
      header: 'Role',
      editVariant: 'select',
      editSelectOptions: roles?.map(r => ({ label: r.name, value: r.id })) ?? [],
    },
  ], [roles]); // Re-compute when roles load

  // ...
}
```

### Conditional Column Visibility

```tsx
const isMobile = useMediaQuery('(max-width: 600px)');

const table = useMaterialReactTable({
  columns,
  data,
  initialState: {
    columnVisibility: {
      email: !isMobile,
      phone: !isMobile,
      address: !isMobile,
    },
  },
});
```

### Column Groups

```tsx
const columns = useMemo<MRT_ColumnDef<Person>[]>(() => [
  {
    header: 'Personal Info',
    columns: [
      { accessorKey: 'firstName', header: 'First Name' },
      { accessorKey: 'lastName', header: 'Last Name' },
    ],
  },
  {
    header: 'Contact',
    columns: [
      { accessorKey: 'email', header: 'Email' },
      { accessorKey: 'phone', header: 'Phone' },
    ],
  },
], []);
```

### Custom Header Actions

```tsx
{
  accessorKey: 'items',
  header: 'Items',
  Header: ({ column }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {column.columnDef.header}
      <Tooltip title="Select All">
        <IconButton size="small" onClick={handleSelectAll}>
          <PlaylistAddCheckIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  ),
}
```

### Sticky First Column

```tsx
initialState: {
  columnPinning: { left: ['name'] },
}

// Or per-column
{
  accessorKey: 'name',
  header: 'Name',
  enablePinning: true,
}
```

---

## Common Gotchas

### 1. Infinite Re-renders

**Cause**: Data or columns recreated every render.

```tsx
// ❌ BAD
<MaterialReactTable
  columns={[{ accessorKey: 'name' }]} // New array every render
  data={users.filter(u => u.active)} // New array every render
/>

// ✅ GOOD
const columns = useMemo(() => [...], []);
const data = useMemo(() => users.filter(u => u.active), [users]);
```

### 2. accessorFn Without id

**Cause**: MRT can't derive column ID.

```tsx
// ❌ BAD - Missing id
{ accessorFn: (row) => row.a + row.b }

// ✅ GOOD - Include id
{ accessorFn: (row) => row.a + row.b, id: 'total' }
```

### 3. JSX in Accessor

**Cause**: Sorting/filtering breaks.

```tsx
// ❌ BAD
accessorFn: (row) => <Chip label={row.status} />

// ✅ GOOD
accessorKey: 'status',
Cell: ({ cell }) => <Chip label={cell.getValue()} />
```

### 4. Select Options Format (V3)

**Cause**: Using V2 format in V3.

```tsx
// ❌ V2 format (deprecated)
filterSelectOptions: [{ text: 'Active', value: 1 }]

// ✅ V3 format
filterSelectOptions: [{ label: 'Active', value: 1 }]
```

### 5. Date Picker Missing Provider

**Cause**: No LocalizationProvider wrapper.

```tsx
// Error: Cannot read properties of undefined

// Fix: Wrap app
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <App />
</LocalizationProvider>
```

### 6. Server-Side + Client-Side Mix

**Cause**: Enabling manual modes but not all of them.

```tsx
// ❌ BAD - Only pagination is server-side
manualPagination: true,
// Sorting still happens client-side on partial data!

// ✅ GOOD - All or nothing for server-side
manualPagination: true,
manualFiltering: true,
manualSorting: true,
```

### 7. Column Resizing CSS Issues

**Cause**: V1 CSS workarounds in V2+.

```tsx
// ❌ Remove V1 workarounds
muiTableBodyCellProps: { sx: { flex: '0 0 auto' } }

// ✅ V2+ handles this with layoutMode
layoutMode: 'grid-no-grow' // Default when resizing enabled
```

---

## Sources

- [Material React Table V3 Docs](https://www.material-react-table.com/)
- [Column Options API Reference](https://www.material-react-table.com/docs/api/column-options)
- [Data Columns Guide](https://www.material-react-table.com/docs/guides/data-columns)
- [Best Practices Guide](https://www.material-react-table.com/docs/guides/best-practices)
- [V2 Migration Guide](https://v2.material-react-table.com/docs/getting-started/migrating-to-v2)
- [V3 Migration Guide](https://www.material-react-table.com/docs/getting-started/migrating-to-v3)
