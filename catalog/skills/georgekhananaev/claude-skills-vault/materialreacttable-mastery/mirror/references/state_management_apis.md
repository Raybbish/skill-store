# State Management & APIs Reference

Complete guide to MRT state management, table instance APIs, row/cell APIs, and advanced patterns.

---

## Table of Contents

1. [State Management Approaches](#state-management-approaches)
2. [Table Instance APIs](#table-instance-apis)
3. [Row Instance APIs](#row-instance-apis)
4. [Cell Instance APIs](#cell-instance-apis)
5. [Column Instance APIs](#column-instance-apis)
6. [Available State Properties](#available-state-properties)
7. [Controlled vs Uncontrolled State](#controlled-vs-uncontrolled-state)
8. [State Persistence Patterns](#state-persistence-patterns)
9. [Event Callbacks](#event-callbacks)
10. [Advanced Patterns](#advanced-patterns)

---

## State Management Approaches

### Approach 1: Initial State Only (Simplest)

Set default values without managing state yourself.

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  initialState: {
    density: 'compact',
    expanded: true,
    pagination: { pageIndex: 0, pageSize: 25 },
    showColumnFilters: true,
    sorting: [{ id: 'createdAt', desc: true }],
    columnVisibility: { id: false },
    columnPinning: { left: ['name'] },
  },
});
```

**Use when:** You only need default values at mount, don't need to read/update state externally.

### Approach 2: Read-Only Access via Table Instance

Access current state without managing it.

```tsx
const table = useMaterialReactTable({ columns, data });

// Read state anywhere in your component
const handleExport = () => {
  const currentSorting = table.getState().sorting;
  const filteredRows = table.getFilteredRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;

  console.log('Exporting with sort:', currentSorting);
  exportData(filteredRows.map(row => row.original));
};

// Log full state for debugging
console.log(table.getState());
```

**Use when:** You need to read state in event handlers but don't need to control it externally.

### Approach 3: Controlled State (Full Control)

Manage specific states with React hooks.

```tsx
// Manage state with useState
const [pagination, setPagination] = useState<MRT_PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});
const [sorting, setSorting] = useState<MRT_SortingState>([]);
const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
const [globalFilter, setGlobalFilter] = useState('');
const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

const table = useMaterialReactTable({
  columns,
  data,
  // Pass state
  state: {
    pagination,
    sorting,
    columnFilters,
    globalFilter,
    rowSelection,
  },
  // Pass change handlers
  onPaginationChange: setPagination,
  onSortingChange: setSorting,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  onRowSelectionChange: setRowSelection,
});
```

**Critical:** If you specify `on*Change` without corresponding `state`, that state will be "frozen".

### Approach 4: Hybrid (Partial Control)

Mix controlled and uncontrolled states.

```tsx
// Only control what you need
const [rowSelection, setRowSelection] = useState({});

const table = useMaterialReactTable({
  columns,
  data,
  state: { rowSelection },
  onRowSelectionChange: setRowSelection,
  // Other states managed internally
  initialState: {
    sorting: [{ id: 'name', desc: false }],
    pagination: { pageIndex: 0, pageSize: 25 },
  },
});
```

---

## Table Instance APIs

The `useMaterialReactTable` hook returns the table instance with these methods:

### State Access

| Method | Description |
|--------|-------------|
| `getState()` | Get complete current state object |
| `setState(updater)` | Update internal state |
| `options` | Access table configuration options |
| `initialState` | Access initial state configuration |

```tsx
// Get current state
const state = table.getState();
console.log(state.sorting, state.pagination, state.columnFilters);

// Check specific state
if (table.getState().isFullScreen) {
  // Handle full screen mode
}
```

### Row Model Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getRowModel()` | Row model | Final rendered rows (after all transforms) |
| `getCoreRowModel()` | Row model | Base row model before transforms |
| `getFilteredRowModel()` | Row model | Rows after filtering |
| `getSortedRowModel()` | Row model | Rows after sorting |
| `getPaginationRowModel()` | Row model | Rows after pagination |
| `getGroupedRowModel()` | Row model | Rows after grouping |
| `getExpandedRowModel()` | Row model | Rows including expanded |
| `getSelectedRowModel()` | Row model | Only selected rows |
| `getPreFilteredRowModel()` | Row model | Rows before filtering |

```tsx
// Export filtered data
const handleExport = () => {
  const rows = table.getFilteredRowModel().rows;
  const data = rows.map(row => row.original);
  exportToCSV(data);
};

// Get selected rows for bulk action
const handleBulkDelete = () => {
  const selectedRows = table.getSelectedRowModel().rows;
  const ids = selectedRows.map(row => row.original.id);
  deleteItems(ids);
};

// Get row count
const totalRows = table.getRowModel().rows.length;
const filteredCount = table.getFilteredRowModel().rows.length;
```

### Row Access Methods

| Method | Description |
|--------|-------------|
| `getRow(rowId)` | Get specific row by ID |
| `getRowCount()` | Total row count |
| `getTopRows()` | Pinned top rows |
| `getBottomRows()` | Pinned bottom rows |
| `getCenterRows()` | Non-pinned rows |

```tsx
// Access specific row
const row = table.getRow('user-123');
console.log(row.original, row.getValue('name'));

// Get pinned rows
const pinnedTop = table.getTopRows();
```

### Column Methods

| Method | Description |
|--------|-------------|
| `getColumn(columnId)` | Get specific column |
| `getAllColumns()` | All columns including groups |
| `getAllFlatColumns()` | Flattened columns |
| `getAllLeafColumns()` | Only leaf columns (no groups) |
| `getVisibleLeafColumns()` | Visible leaf columns |
| `getLeftLeafColumns()` | Left-pinned columns |
| `getRightLeafColumns()` | Right-pinned columns |
| `getCenterLeafColumns()` | Center (non-pinned) columns |

```tsx
// Get column for manipulation
const nameColumn = table.getColumn('name');
nameColumn.toggleSorting(); // Toggle sort
nameColumn.toggleVisibility(); // Toggle visibility

// Get visible columns for export
const visibleColumns = table.getVisibleLeafColumns();
```

### Pagination Methods

| Method | Description |
|--------|-------------|
| `nextPage()` | Go to next page |
| `previousPage()` | Go to previous page |
| `firstPage()` | Go to first page |
| `lastPage()` | Go to last page |
| `setPageIndex(index)` | Set specific page |
| `setPageSize(size)` | Set page size |
| `getPageCount()` | Total page count |
| `getCanNextPage()` | Can navigate next |
| `getCanPreviousPage()` | Can navigate previous |

```tsx
// Custom pagination controls
<Button disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
  Previous
</Button>
<span>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</span>
<Button disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
  Next
</Button>
```

### Selection Methods

| Method | Description |
|--------|-------------|
| `toggleAllRowsSelected(value?)` | Select/deselect all |
| `getIsAllRowsSelected()` | Check if all selected |
| `getIsSomeRowsSelected()` | Check if some selected |
| `setRowSelection(updater)` | Set selection state |
| `resetRowSelection()` | Clear all selections |

```tsx
// Select all button
<Button onClick={() => table.toggleAllRowsSelected(true)}>
  Select All
</Button>

// Clear selection
<Button onClick={() => table.resetRowSelection()}>
  Clear Selection
</Button>

// Check selection state
const allSelected = table.getIsAllRowsSelected();
const someSelected = table.getIsSomeRowsSelected();
```

### Expansion Methods

| Method | Description |
|--------|-------------|
| `toggleAllRowsExpanded(value?)` | Expand/collapse all |
| `getIsAllRowsExpanded()` | Check if all expanded |
| `getIsSomeRowsExpanded()` | Check if some expanded |
| `setExpanded(updater)` | Set expansion state |
| `resetExpanded()` | Collapse all |

### Filter Methods

| Method | Description |
|--------|-------------|
| `setColumnFilters(updater)` | Set column filters |
| `resetColumnFilters()` | Clear column filters |
| `setGlobalFilter(value)` | Set global search |
| `resetGlobalFilter()` | Clear global search |
| `getPreFilteredRowModel()` | Rows before filtering |

```tsx
// Programmatic filtering
table.setGlobalFilter('search term');
table.setColumnFilters([{ id: 'status', value: 'Active' }]);

// Clear all filters
const handleClearFilters = () => {
  table.resetColumnFilters();
  table.resetGlobalFilter();
};
```

### Sort Methods

| Method | Description |
|--------|-------------|
| `setSorting(updater)` | Set sorting state |
| `resetSorting()` | Clear sorting |
| `getPreSortedRowModel()` | Rows before sorting |

```tsx
// Programmatic sorting
table.setSorting([{ id: 'createdAt', desc: true }]);

// Multi-sort
table.setSorting([
  { id: 'status', desc: false },
  { id: 'name', desc: false },
]);
```

### Column Visibility Methods

| Method | Description |
|--------|-------------|
| `setColumnVisibility(updater)` | Set visibility |
| `resetColumnVisibility()` | Reset to default |
| `toggleAllColumnsVisible(value?)` | Show/hide all |

```tsx
// Hide columns
table.setColumnVisibility({ email: false, phone: false });

// Show all columns
table.toggleAllColumnsVisible(true);
```

### Column Order & Pinning

| Method | Description |
|--------|-------------|
| `setColumnOrder(updater)` | Set column order |
| `resetColumnOrder()` | Reset order |
| `setColumnPinning(updater)` | Set pinning |
| `resetColumnPinning()` | Reset pinning |

```tsx
// Reorder columns
table.setColumnOrder(['name', 'email', 'status', 'actions']);

// Pin columns
table.setColumnPinning({ left: ['name'], right: ['actions'] });
```

### UI State Methods

| Method | Description |
|--------|-------------|
| `setDensity(density)` | Set row density |
| `setIsFullScreen(value)` | Toggle full screen |
| `setShowGlobalFilter(value)` | Show/hide search |
| `setShowColumnFilters(value)` | Show/hide filters |
| `setEditingRow(row)` | Enter edit mode |
| `setEditingCell(cell)` | Enter cell edit |
| `setCreatingRow(value)` | Enter create mode |

```tsx
// Toggle full screen
table.setIsFullScreen(true);

// Change density
table.setDensity('compact');

// Enter edit mode for a row
table.setEditingRow(row);

// Start creating new row
table.setCreatingRow(true);
```

---

## Row Instance APIs

Each row object has these properties and methods:

### Row Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique row identifier |
| `original` | TData | Original data object |
| `index` | number | Row index in current view |
| `depth` | number | Nesting depth (for tree data) |
| `parentId` | string? | Parent row ID |
| `subRows` | Row[] | Child rows |
| `getValue(columnId)` | any | Get cell value |
| `renderValue(columnId)` | any | Get rendered value |

```tsx
// In Cell render
Cell: ({ row }) => {
  const id = row.id;
  const originalData = row.original;
  const nameValue = row.getValue('name');
  const hasChildren = row.subRows.length > 0;
  const nestingLevel = row.depth;
}
```

### Row Methods

| Method | Description |
|--------|-------------|
| `getIsSelected()` | Check if selected |
| `getCanSelect()` | Check if selectable |
| `getIsExpanded()` | Check if expanded |
| `getCanExpand()` | Check if expandable |
| `toggleSelected(value?)` | Toggle selection |
| `toggleExpanded(value?)` | Toggle expansion |
| `getVisibleCells()` | Get visible cells |
| `getAllCells()` | Get all cells |
| `getParentRow()` | Get parent row |
| `getLeafRows()` | Get all leaf descendants |

```tsx
// Row action handler
const handleRowClick = (row: MRT_Row<Person>) => {
  if (row.getCanSelect()) {
    row.toggleSelected();
  }

  if (row.getCanExpand()) {
    row.toggleExpanded();
  }
};

// Check row state
renderRowActions: ({ row }) => (
  <Checkbox
    checked={row.getIsSelected()}
    onChange={() => row.toggleSelected()}
    disabled={!row.getCanSelect()}
  />
)
```

---

## Cell Instance APIs

Each cell object has these properties and methods:

### Cell Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique cell identifier |
| `getValue<T>()` | T | Get typed cell value |
| `renderValue()` | any | Get rendered value with fallback |
| `row` | Row | Parent row instance |
| `column` | Column | Parent column instance |
| `getContext()` | object | Full render context |

```tsx
// In Cell render
Cell: ({ cell, row, column }) => {
  const value = cell.getValue<string>(); // Type-safe
  const rowData = row.original;
  const columnId = column.id;

  return <span>{value}</span>;
}
```

### Cell Methods

| Method | Description |
|--------|-------------|
| `getIsGrouped()` | Is this a grouped cell |
| `getIsPlaceholder()` | Is this a placeholder |
| `getIsAggregated()` | Is this aggregated |

---

## Column Instance APIs

Each column object has these properties and methods:

### Column Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Column identifier |
| `columnDef` | ColumnDef | Column definition |
| `columns` | Column[] | Child columns (for groups) |
| `parent` | Column? | Parent column |
| `depth` | number | Nesting depth |
| `getSize()` | number | Current width |
| `getIsVisible()` | boolean | Visibility state |

### Column Methods

| Method | Description |
|--------|-------------|
| `toggleSorting(desc?, multi?)` | Toggle sort |
| `clearSorting()` | Clear sort |
| `getIsSorted()` | Get sort direction |
| `toggleVisibility(value?)` | Toggle visibility |
| `getIsFiltered()` | Check if filtered |
| `setFilterValue(value)` | Set filter value |
| `getFilterValue()` | Get filter value |
| `pin(position)` | Pin column |
| `getIsPinned()` | Get pin state |

```tsx
// Column actions
const column = table.getColumn('status');

// Sorting
column.toggleSorting(true); // Sort descending
column.clearSorting();

// Filtering
column.setFilterValue('Active');
const currentFilter = column.getFilterValue();

// Visibility
column.toggleVisibility(false); // Hide

// Pinning
column.pin('left');
```

---

## Available State Properties

Complete list of state properties accessible via `table.getState()`:

### Core State

| State | Type | Description |
|-------|------|-------------|
| `sorting` | SortingState | `[{ id, desc }]` |
| `pagination` | PaginationState | `{ pageIndex, pageSize }` |
| `columnFilters` | ColumnFiltersState | `[{ id, value }]` |
| `globalFilter` | string | Global search value |
| `rowSelection` | RowSelectionState | `{ [rowId]: boolean }` |
| `expanded` | ExpandedState | `{ [rowId]: boolean }` or `true` |
| `grouping` | GroupingState | `string[]` column IDs |

### Column State

| State | Type | Description |
|-------|------|-------------|
| `columnVisibility` | VisibilityState | `{ [columnId]: boolean }` |
| `columnOrder` | ColumnOrderState | `string[]` column IDs |
| `columnPinning` | ColumnPinningState | `{ left: [], right: [] }` |
| `columnSizing` | ColumnSizingState | `{ [columnId]: number }` |
| `columnSizingInfo` | ColumnSizingInfoState | Resize in progress info |

### UI State

| State | Type | Description |
|-------|------|-------------|
| `density` | 'comfortable' \| 'compact' \| 'spacious' | Row density |
| `isFullScreen` | boolean | Full screen mode |
| `showGlobalFilter` | boolean | Search visibility |
| `showColumnFilters` | boolean | Filter row visibility |
| `showToolbarDropZone` | boolean | DnD drop zone |

### Edit State

| State | Type | Description |
|-------|------|-------------|
| `editingRow` | Row \| null | Row being edited |
| `editingCell` | Cell \| null | Cell being edited |
| `creatingRow` | Row \| null | New row being created |

### Loading State

| State | Type | Description |
|-------|------|-------------|
| `isLoading` | boolean | Data loading |
| `isSaving` | boolean | Save in progress |
| `showProgressBars` | boolean | Show progress |
| `showSkeletons` | boolean | Show skeletons |
| `showAlertBanner` | boolean | Show alert |

---

## Controlled vs Uncontrolled State

### Uncontrolled (Internal)

```tsx
// State managed internally by MRT
const table = useMaterialReactTable({
  columns,
  data,
  initialState: { sorting: [{ id: 'name', desc: false }] },
});

// Read-only access
const sorting = table.getState().sorting;
```

### Controlled (External)

```tsx
// State managed by you
const [sorting, setSorting] = useState<MRT_SortingState>([]);

const table = useMaterialReactTable({
  columns,
  data,
  state: { sorting }, // Provide state
  onSortingChange: setSorting, // Handle changes
});

// Full control
useEffect(() => {
  // Sync with URL, localStorage, server, etc.
  const params = new URLSearchParams(window.location.search);
  const sortParam = params.get('sort');
  if (sortParam) {
    setSorting([{ id: sortParam, desc: params.get('desc') === 'true' }]);
  }
}, []);
```

### State Change Handler Pattern

```tsx
// onChange handlers receive updater function or value
onSortingChange: (updater) => {
  setSorting((prev) => {
    const next = typeof updater === 'function' ? updater(prev) : updater;
    // Side effects here
    saveToLocalStorage('sorting', next);
    updateURL(next);
    return next;
  });
},
```

---

## State Persistence Patterns

### LocalStorage Persistence

```tsx
const STORAGE_KEY = 'my-table-state';

// Load initial state
const loadState = (): Partial<MRT_TableState<TData>> => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

// Save state
const saveState = (state: Partial<MRT_TableState<TData>>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

function MyTable() {
  const [tableState, setTableState] = useState(loadState);
  const isFirstRender = useRef(true);

  // Save on change (skip first render)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    saveState(tableState);
  }, [tableState]);

  const table = useMaterialReactTable({
    columns,
    data,
    state: tableState,
    onStateChange: setTableState,
  });
}
```

### URL State Sync

```tsx
import { useSearchParams } from 'react-router-dom';

function MyTable() {
  const [searchParams, setSearchParams] = useSearchParams();

  const sorting = useMemo<MRT_SortingState>(() => {
    const sort = searchParams.get('sort');
    const desc = searchParams.get('desc') === 'true';
    return sort ? [{ id: sort, desc }] : [];
  }, [searchParams]);

  const table = useMaterialReactTable({
    columns,
    data,
    state: { sorting },
    onSortingChange: (updater) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater;
      if (next.length) {
        setSearchParams({ sort: next[0].id, desc: String(next[0].desc) });
      } else {
        searchParams.delete('sort');
        searchParams.delete('desc');
        setSearchParams(searchParams);
      }
    },
  });
}
```

### Reset State

```tsx
const [tableState, setTableState] = useState<Partial<MRT_TableState<TData>>>({});

const handleReset = () => {
  setTableState({});
  localStorage.removeItem(STORAGE_KEY);
  // Table will use initialState
};

<Button onClick={handleReset}>Reset Table</Button>
```

---

## Event Callbacks

### Complete Callback Reference

| Callback | When Triggered |
|----------|----------------|
| `onSortingChange` | Sort changes |
| `onPaginationChange` | Page/size changes |
| `onColumnFiltersChange` | Column filter changes |
| `onGlobalFilterChange` | Global search changes |
| `onRowSelectionChange` | Selection changes |
| `onExpandedChange` | Expand/collapse |
| `onGroupingChange` | Grouping changes |
| `onColumnVisibilityChange` | Visibility changes |
| `onColumnOrderChange` | Order changes |
| `onColumnPinningChange` | Pinning changes |
| `onColumnSizingChange` | Resize changes |
| `onDensityChange` | Density changes |
| `onIsFullScreenChange` | Full screen toggle |
| `onShowGlobalFilterChange` | Search visibility |
| `onShowColumnFiltersChange` | Filter visibility |
| `onEditingRowChange` | Edit row changes |
| `onEditingCellChange` | Edit cell changes |
| `onCreatingRowChange` | Create row changes |
| `onEditingRowSave` | Row save |
| `onEditingRowCancel` | Row edit cancel |
| `onCreatingRowSave` | New row save |
| `onCreatingRowCancel` | New row cancel |

### Row Event Callbacks

```tsx
muiTableBodyRowProps: ({ row }) => ({
  onClick: () => handleRowClick(row),
  onDoubleClick: () => handleRowDoubleClick(row),
  onContextMenu: (e) => handleRowContextMenu(e, row),
}),
```

### Cell Event Callbacks

```tsx
muiTableBodyCellProps: ({ cell, row, column }) => ({
  onClick: () => handleCellClick(cell),
  onDoubleClick: () => table.setEditingCell(cell),
}),
```

---

## Advanced Patterns

### Imperative Actions from Parent

```tsx
// Parent component
function ParentComponent() {
  const tableRef = useRef<MRT_TableInstance<Person>>(null);

  const handleExternalSort = () => {
    tableRef.current?.setSorting([{ id: 'name', desc: false }]);
  };

  return (
    <>
      <Button onClick={handleExternalSort}>Sort by Name</Button>
      <MyTable tableRef={tableRef} />
    </>
  );
}

// Child component
function MyTable({ tableRef }) {
  const table = useMaterialReactTable({ columns, data });

  useEffect(() => {
    if (tableRef) {
      tableRef.current = table;
    }
  }, [table, tableRef]);

  return <MaterialReactTable table={table} />;
}
```

### Derived State

```tsx
const table = useMaterialReactTable({ columns, data });

// Derived values
const hasFilters = table.getState().columnFilters.length > 0 ||
                   !!table.getState().globalFilter;
const selectedCount = table.getSelectedRowModel().rows.length;
const isAllSelected = table.getIsAllRowsSelected();

// Use in UI
{hasFilters && <Chip label="Filtered" onDelete={() => table.resetColumnFilters()} />}
{selectedCount > 0 && <span>{selectedCount} selected</span>}
```

### Batch State Updates

```tsx
// Apply multiple state changes at once
const applyPreset = (preset: 'default' | 'compact' | 'detailed') => {
  const presets = {
    default: {
      columnVisibility: {},
      density: 'comfortable',
      pagination: { pageIndex: 0, pageSize: 10 },
    },
    compact: {
      columnVisibility: { description: false, notes: false },
      density: 'compact',
      pagination: { pageIndex: 0, pageSize: 25 },
    },
    detailed: {
      columnVisibility: {},
      density: 'spacious',
      pagination: { pageIndex: 0, pageSize: 5 },
    },
  };

  const config = presets[preset];
  table.setColumnVisibility(config.columnVisibility);
  table.setDensity(config.density);
  table.setPagination(config.pagination);
};
```

### State Debugging

```tsx
// Development helper
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.log('Table State:', table.getState());
  }
}, [table.getState()]);

// Or add debug button
<Button onClick={() => console.table(table.getState())}>
  Debug State
</Button>
```

---

## Sources

- [State Management Guide](https://www.material-react-table.com/docs/guides/state-management)
- [Table Instance APIs](https://www.material-react-table.com/docs/api/table-instance-apis)
- [Row Instance APIs](https://www.material-react-table.com/docs/api/row-instance-apis)
- [Cell Instance APIs](https://www.material-react-table.com/docs/api/cell-instance-apis)
- [Column Instance APIs](https://www.material-react-table.com/docs/api/column-instance-apis)
- [State Options API](https://www.material-react-table.com/docs/api/state-options)