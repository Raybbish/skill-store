# Editing & CRUD Reference

## Edit Display Modes

### Row Editing
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableEditing: true,
  editDisplayMode: 'row',
  onEditingRowSave: handleSave,
  onEditingRowCancel: () => setValidationErrors({}),
});
```

### Modal Editing
```tsx
editDisplayMode: 'modal',
onEditingRowSave: handleSave,
renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
  <DialogContent>
    <DialogTitle>Edit User</DialogTitle>
    {internalEditComponents}
    <DialogActions>
      <Button onClick={() => table.setEditingRow(null)}>Cancel</Button>
      <Button onClick={() => table.setEditingRow(null)}>Save</Button>
    </DialogActions>
  </DialogContent>
),
```

### Cell Editing
```tsx
editDisplayMode: 'cell',
onEditingCellChange: ({ cell, row, table }) => {
  // Auto-save on blur
},
```

### Table Editing (All Cells)
```tsx
editDisplayMode: 'table',
// All cells editable at once
```

## Row Actions

```tsx
enableRowActions: true,
positionActionsColumn: 'last', // 'first' | 'last'
renderRowActions: ({ row, table }) => (
  <Box sx={{ display: 'flex', gap: '0.5rem' }}>
    <Tooltip title="Edit">
      <IconButton onClick={() => table.setEditingRow(row)}>
        <EditIcon />
      </IconButton>
    </Tooltip>
    <Tooltip title="Delete">
      <IconButton color="error" onClick={() => handleDelete(row.original.id)}>
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  </Box>
),
```

## Validation

### Column-Level Validation
```tsx
const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

const columns = useMemo<MRT_ColumnDef<User>[]>(() => [
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
          setValidationErrors((prev) => ({ ...prev, email: 'Email is required' }));
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          setValidationErrors((prev) => ({ ...prev, email: 'Invalid email format' }));
        } else {
          setValidationErrors((prev) => ({ ...prev, email: undefined }));
        }
      },
    },
  },
], [validationErrors]);
```

### Form-Level Validation
```tsx
const handleSave = async ({ values, row, table }) => {
  const errors = validateUser(values);
  if (Object.keys(errors).length) {
    setValidationErrors(errors);
    return;
  }
  await updateUser(row.original.id, values);
  setValidationErrors({});
  table.setEditingRow(null);
};
```

## Edit Field Types

### Text Input
```tsx
muiEditTextFieldProps: {
  type: 'text',
  required: true,
  multiline: true, // For textarea
  rows: 3,
}
```

### Select
```tsx
{
  accessorKey: 'status',
  header: 'Status',
  editVariant: 'select',
  editSelectOptions: ['Active', 'Inactive', 'Pending'],
  muiEditTextFieldProps: {
    select: true,
  },
}
```

### Date
```tsx
{
  accessorKey: 'birthDate',
  header: 'Birth Date',
  muiEditTextFieldProps: {
    type: 'date',
    InputLabelProps: { shrink: true },
  },
}
```

## Create New Row

### Top Toolbar Create Button
```tsx
renderTopToolbarCustomActions: ({ table }) => (
  <Button variant="contained" onClick={() => table.setCreatingRow(true)}>
    Create New User
  </Button>
),
onCreatingRowSave: handleCreate,
```

### Create Modal
```tsx
createDisplayMode: 'modal',
renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
  <>
    <DialogTitle>Create New User</DialogTitle>
    <DialogContent>{internalEditComponents}</DialogContent>
    <DialogActions>
      <Button onClick={() => table.setCreatingRow(null)}>Cancel</Button>
      <Button variant="contained" onClick={() => handleCreate(row)}>Create</Button>
    </DialogActions>
  </>
),
```

## Delete with Confirmation

```tsx
const handleDelete = async (id: string) => {
  if (!window.confirm('Are you sure you want to delete this row?')) return;

  await deleteUser(id);
  // Refetch or update local state
  queryClient.invalidateQueries(['users']);
};
```

### Delete Dialog
```tsx
const [deleteId, setDeleteId] = useState<string | null>(null);

<Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
  <DialogTitle>Confirm Delete</DialogTitle>
  <DialogContent>
    Are you sure you want to delete this item?
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setDeleteId(null)}>Cancel</Button>
    <Button color="error" onClick={async () => {
      await deleteUser(deleteId);
      setDeleteId(null);
    }}>Delete</Button>
  </DialogActions>
</Dialog>
```

## Optimistic Updates

```tsx
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['users']);
    const previous = queryClient.getQueryData(['users']);
    queryClient.setQueryData(['users'], (old) =>
      old.map((user) => user.id === newData.id ? { ...user, ...newData } : user)
    );
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(['users'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries(['users']);
  },
});
```

## Bulk Actions

### Enable Row Selection
```tsx
enableRowSelection: true,
enableBatchRowSelection: true,
```

### Bulk Delete
```tsx
renderTopToolbarCustomActions: ({ table }) => {
  const selectedRows = table.getSelectedRowModel().rows;
  return (
    <Button
      disabled={selectedRows.length === 0}
      onClick={() => handleBulkDelete(selectedRows.map((r) => r.original.id))}
    >
      Delete Selected ({selectedRows.length})
    </Button>
  );
},
```