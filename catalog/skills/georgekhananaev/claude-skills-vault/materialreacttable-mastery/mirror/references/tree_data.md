# Tree Data & Expandable Rows Reference

## Basic Expansion

### Detail Panel
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableExpanding: true,
  renderDetailPanel: ({ row }) => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6">Details for {row.original.name}</Typography>
      <Typography>Email: {row.original.email}</Typography>
      <Typography>Address: {row.original.address}</Typography>
    </Box>
  ),
});
```

### Conditional Detail Panel
```tsx
renderDetailPanel: ({ row }) =>
  row.original.hasDetails ? (
    <DetailComponent data={row.original} />
  ) : null,
```

## Tree Data Structure

### Data Shape
```typescript
interface TreeNode {
  id: string;
  name: string;
  children?: TreeNode[];
}

const data: TreeNode[] = [
  {
    id: '1',
    name: 'Parent 1',
    children: [
      { id: '1.1', name: 'Child 1.1' },
      { id: '1.2', name: 'Child 1.2', children: [
        { id: '1.2.1', name: 'Grandchild 1.2.1' }
      ]},
    ],
  },
];
```

### Enable Tree Mode
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableExpanding: true,
  getSubRows: (row) => row.children,
});
```

## Expand State Control

### Initial Expanded State
```tsx
initialState: {
  expanded: true, // Expand all
  // or
  expanded: { '1': true, '1.2': true }, // Specific rows
}
```

### Controlled Expansion
```tsx
const [expanded, setExpanded] = useState<MRT_ExpandedState>({});

const table = useMaterialReactTable({
  columns,
  data,
  enableExpanding: true,
  onExpandedChange: setExpanded,
  state: { expanded },
});
```

### Expand All Button
```tsx
renderTopToolbarCustomActions: ({ table }) => (
  <Box>
    <Button onClick={() => table.toggleAllRowsExpanded(true)}>
      Expand All
    </Button>
    <Button onClick={() => table.toggleAllRowsExpanded(false)}>
      Collapse All
    </Button>
  </Box>
),
```

## Aggregation in Tree

### Aggregate Child Values
```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  aggregationFn: 'sum',
  AggregatedCell: ({ cell }) => (
    <strong>Total: ${cell.getValue<number>().toLocaleString()}</strong>
  ),
}
```

### Footer Aggregation
```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  Footer: ({ table }) => {
    const total = table.getRowModel().flatRows
      .filter((row) => !row.subRows?.length) // Only leaf nodes
      .reduce((sum, row) => sum + row.getValue<number>('amount'), 0);
    return `Grand Total: $${total.toLocaleString()}`;
  },
}
```

## Lazy Loading Children

```tsx
const [loadedChildren, setLoadedChildren] = useState<Record<string, TreeNode[]>>({});

const table = useMaterialReactTable({
  columns,
  data,
  enableExpanding: true,
  getSubRows: (row) => loadedChildren[row.id] ?? [],
  muiExpandButtonProps: ({ row }) => ({
    onClick: async () => {
      if (!loadedChildren[row.id]) {
        const children = await fetchChildren(row.id);
        setLoadedChildren((prev) => ({ ...prev, [row.id]: children }));
      }
      row.toggleExpanded();
    },
  }),
});
```

## Indentation

### Custom Indent Width
```tsx
muiTableBodyCellProps: ({ column, row }) => ({
  sx: {
    paddingLeft: column.id === 'name'
      ? `${row.depth * 2}rem`
      : undefined,
  },
}),
```

### Tree Connector Lines
```tsx
renderCell: ({ row, cell }) => (
  <Box sx={{ display: 'flex', alignItems: 'center' }}>
    {row.depth > 0 && (
      <Box sx={{
        width: row.depth * 16,
        borderLeft: '1px solid #ccc',
        borderBottom: '1px solid #ccc',
        height: 20,
        ml: 1,
      }} />
    )}
    {cell.getValue()}
  </Box>
),
```

## Selection with Tree

### Select Children with Parent
```tsx
enableSubRowSelection: true,
```

### Only Leaf Nodes Selectable
```tsx
enableRowSelection: (row) => !row.subRows?.length,
enableSubRowSelection: false,
```

## Performance with Deep Trees

### Limit Initial Depth
```tsx
initialState: {
  expanded: false,
}
maxLeafRowFilterDepth: 1, // Only filter top level
```

### Virtualization
```tsx
enableRowVirtualization: true,
rowVirtualizerOptions: {
  overscan: 5,
  estimateSize: () => 40,
},
```

## Custom Expand Icon

```tsx
icons: {
  ExpandMoreIcon: () => <ChevronRightIcon />,
},
muiExpandButtonProps: {
  sx: {
    transform: 'rotate(0deg)',
    transition: 'transform 0.2s',
    '&[aria-expanded="true"]': {
      transform: 'rotate(90deg)',
    },
  },
},
```

## Grouping (Alternative to Tree)

### Group by Column
```tsx
enableGrouping: true,
initialState: {
  grouping: ['department'],
  expanded: true,
}
```

### Custom Group Header
```tsx
{
  accessorKey: 'department',
  header: 'Department',
  GroupedCell: ({ row, cell }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <FolderIcon />
      <strong>{cell.getValue<string>()}</strong>
      <Chip size="small" label={row.subRows.length} />
    </Box>
  ),
}
```