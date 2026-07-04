# Row Selection Reference

## Basic Selection

### Single Select
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableRowSelection: true,
  enableMultiRowSelection: false,
});
```

### Multi Select
```tsx
enableRowSelection: true,
enableMultiRowSelection: true, // Default: true
```

### Checkbox Position
```tsx
positionToolbarAlertBanner: 'bottom', // 'top' | 'bottom' | 'none'
```

## Selection State

### Controlled Selection
```tsx
const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({});

const table = useMaterialReactTable({
  columns,
  data,
  enableRowSelection: true,
  onRowSelectionChange: setRowSelection,
  state: { rowSelection },
  getRowId: (row) => row.id, // Important for controlled selection
});
```

### Get Selected Rows
```tsx
const selectedRows = table.getSelectedRowModel().rows;
const selectedIds = selectedRows.map((row) => row.original.id);
```

### Pre-Select Rows
```tsx
initialState: {
  rowSelection: { '1': true, '3': true }, // Row IDs as keys
}
```

## Conditional Selection

### Disable Selection for Specific Rows
```tsx
enableRowSelection: (row) => row.original.status !== 'Archived',
```

### Custom Checkbox
```tsx
muiSelectCheckboxProps: ({ row }) => ({
  disabled: row.original.isLocked,
  color: 'secondary',
}),
```

## Selection Actions

### Toolbar Actions
```tsx
renderTopToolbarCustomActions: ({ table }) => {
  const selectedRows = table.getSelectedRowModel().rows;
  const count = selectedRows.length;

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Button
        disabled={count === 0}
        onClick={() => handleBulkDelete(selectedRows)}
        startIcon={<DeleteIcon />}
      >
        Delete ({count})
      </Button>
      <Button
        disabled={count === 0}
        onClick={() => handleExport(selectedRows)}
        startIcon={<ExportIcon />}
      >
        Export Selected
      </Button>
    </Box>
  );
},
```

### Alert Banner
```tsx
renderToolbarAlertBannerContent: ({ selectedAlert, table }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    {selectedAlert}
    <Button size="small" onClick={() => handleBulkAction(table)}>
      Process Selected
    </Button>
  </Box>
),
```

## Select All

### Enable Select All Header
```tsx
enableSelectAll: true, // Default: true
```

### Select All Pages (Server-Side)
```tsx
// When using server-side, "select all" only selects current page
// For true select-all, track separately:
const [selectAll, setSelectAll] = useState(false);

renderTopToolbarCustomActions: ({ table }) => (
  <FormControlLabel
    control={
      <Checkbox
        checked={selectAll}
        onChange={(e) => {
          setSelectAll(e.target.checked);
          if (e.target.checked) {
            table.toggleAllRowsSelected(true);
          } else {
            table.resetRowSelection();
          }
        }}
      />
    }
    label="Select all items"
  />
),
```

## Row Click Selection

```tsx
muiTableBodyRowProps: ({ row }) => ({
  onClick: () => row.toggleSelected(),
  sx: { cursor: 'pointer' },
}),
```

## Sticky Selection Column

```tsx
initialState: {
  columnPinning: { left: ['mrt-row-select'] },
}
```

## Subrow Selection

### Select Parent and Children
```tsx
enableSubRowSelection: true,
```

### Only Leaf Rows
```tsx
enableSubRowSelection: false,
enableRowSelection: (row) => !row.subRows?.length, // Only leaf nodes
```

## Integration with Actions

### Bulk Status Update
```tsx
const handleBulkStatusChange = async (rows: MRT_Row<User>[], newStatus: string) => {
  const ids = rows.map((row) => row.original.id);
  await updateUsersStatus(ids, newStatus);
  table.resetRowSelection();
  queryClient.invalidateQueries(['users']);
};
```

### Bulk Export
```tsx
const handleExport = (rows: MRT_Row<User>[]) => {
  const data = rows.map((row) => row.original);
  const csv = convertToCSV(data);
  downloadFile(csv, 'users.csv', 'text/csv');
};
```

## Selection with Server-Side Pagination

```tsx
// Track selection across pages by ID
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

// Convert to MRT format for current page
const rowSelection = useMemo(() => {
  return data.reduce((acc, row) => {
    if (selectedIds.has(row.id)) acc[row.id] = true;
    return acc;
  }, {} as MRT_RowSelectionState);
}, [data, selectedIds]);

// Sync changes back
onRowSelectionChange: (updater) => {
  const newSelection = typeof updater === 'function' ? updater(rowSelection) : updater;
  const newIds = new Set(selectedIds);
  Object.entries(newSelection).forEach(([id, selected]) => {
    if (selected) newIds.add(id);
    else newIds.delete(id);
  });
  setSelectedIds(newIds);
};
```