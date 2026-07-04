# Filtering & Sorting Reference

## Filter Variants

### Text (Default)
```tsx
{ accessorKey: 'name', header: 'Name', filterVariant: 'text' }
```

### Select
```tsx
{
  accessorKey: 'status',
  header: 'Status',
  filterVariant: 'select',
  filterSelectOptions: ['Active', 'Inactive', 'Pending'],
}
```

### Multi-Select
```tsx
{
  accessorKey: 'tags',
  header: 'Tags',
  filterVariant: 'multi-select',
  filterSelectOptions: ['Frontend', 'Backend', 'DevOps', 'Design'],
}
```

### Range (Numeric)
```tsx
{
  accessorKey: 'age',
  header: 'Age',
  filterVariant: 'range',
}
```

### Range Slider
```tsx
{
  accessorKey: 'salary',
  header: 'Salary',
  filterVariant: 'range-slider',
  filterFn: 'betweenInclusive',
  muiFilterSliderProps: {
    min: 0,
    max: 200000,
    step: 1000,
    valueLabelFormat: (v) => `$${v.toLocaleString()}`,
  },
}
```

### Date
```tsx
{
  accessorKey: 'createdAt',
  header: 'Created',
  filterVariant: 'date',
  filterFn: 'lessThan',
}
```

### Date Range
```tsx
{
  accessorKey: 'createdAt',
  header: 'Created',
  filterVariant: 'date-range',
}
```

### Autocomplete
```tsx
{
  accessorKey: 'country',
  header: 'Country',
  filterVariant: 'autocomplete',
  filterSelectOptions: countries, // Large array
}
```

### Checkbox
```tsx
{
  accessorKey: 'isActive',
  header: 'Active',
  filterVariant: 'checkbox',
}
```

## Global Filter

### Enable
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableGlobalFilter: true,
  globalFilterFn: 'contains', // 'contains' | 'fuzzy' | custom
});
```

### Custom Position
```tsx
positionGlobalFilter: 'left', // 'left' | 'right' | 'none'
```

### Debounce
```tsx
globalFilterDebounceTime: 500, // ms
```

## Faceted Filters

Auto-generate filter options from data:

```tsx
{
  accessorKey: 'category',
  header: 'Category',
  filterVariant: 'select',
  // Options auto-generated from unique values
}

// Enable faceted values
enableFacetedValues: true,
```

## Custom Filter Functions

```tsx
{
  accessorKey: 'name',
  header: 'Name',
  filterFn: (row, columnId, filterValue) => {
    const value = row.getValue<string>(columnId);
    return value.toLowerCase().startsWith(filterValue.toLowerCase());
  },
}
```

### Built-in Filter Functions
- `'contains'` - Case-insensitive contains
- `'fuzzy'` - Fuzzy matching
- `'equals'` - Exact match
- `'startsWith'` - Starts with
- `'endsWith'` - Ends with
- `'empty'` - Is empty
- `'notEmpty'` - Is not empty
- `'between'` - Between two values
- `'betweenInclusive'` - Between inclusive
- `'greaterThan'` - Greater than
- `'lessThan'` - Less than

## Sorting

### Enable/Disable
```tsx
{
  accessorKey: 'id',
  header: 'ID',
  enableSorting: false, // Disable for this column
}
```

### Default Sort
```tsx
initialState: {
  sorting: [{ id: 'createdAt', desc: true }],
}
```

### Multi-Sort
```tsx
enableMultiSort: true,
maxMultiSortColCount: 3,
```

### Custom Sort Function
```tsx
{
  accessorKey: 'priority',
  header: 'Priority',
  sortingFn: (rowA, rowB, columnId) => {
    const order = { High: 3, Medium: 2, Low: 1 };
    return order[rowA.getValue(columnId)] - order[rowB.getValue(columnId)];
  },
}
```

## Server-Side Filtering

```tsx
const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
const [globalFilter, setGlobalFilter] = useState('');

const table = useMaterialReactTable({
  columns,
  data,
  manualFiltering: true,
  onColumnFiltersChange: setColumnFilters,
  onGlobalFilterChange: setGlobalFilter,
  state: { columnFilters, globalFilter },
});

// Use columnFilters in API call
// Format: [{ id: 'status', value: 'Active' }, { id: 'age', value: [20, 40] }]
```

## Server-Side Sorting

```tsx
const [sorting, setSorting] = useState<MRT_SortingState>([]);

const table = useMaterialReactTable({
  columns,
  data,
  manualSorting: true,
  onSortingChange: setSorting,
  state: { sorting },
});

// Use sorting in API call
// Format: [{ id: 'createdAt', desc: true }]
```

## Filter Modes

Allow users to change filter behavior:

```tsx
enableColumnFilterModes: true,
columnFilterModeOptions: ['contains', 'startsWith', 'endsWith', 'equals'],
```