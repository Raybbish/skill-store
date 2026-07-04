/**
 * Editable Material React Table Template
 * CRUD operations with row editing, validation, and delete confirmation.
 */
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
} from 'material-react-table';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

// Define your data type
interface User {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'User' | 'Guest';
}

interface EditableTableProps {
  data: User[];
  onUpdate: (id: string, values: Partial<User>) => Promise<void>;
  onCreate: (values: Omit<User, 'id'>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EditableTable({
  data,
  onUpdate,
  onCreate,
  onDelete,
}: EditableTableProps) {
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors.name,
          helperText: validationErrors.name,
          onFocus: () =>
            setValidationErrors((prev) => ({ ...prev, name: undefined })),
        },
      },
      {
        accessorKey: 'email',
        header: 'Email',
        muiEditTextFieldProps: {
          type: 'email',
          required: true,
          error: !!validationErrors.email,
          helperText: validationErrors.email,
          onFocus: () =>
            setValidationErrors((prev) => ({ ...prev, email: undefined })),
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        editVariant: 'select',
        editSelectOptions: ['Admin', 'User', 'Guest'],
        muiEditTextFieldProps: {
          select: true,
          error: !!validationErrors.role,
          helperText: validationErrors.role,
        },
      },
    ],
    [validationErrors],
  );

  // Validation
  const validateUser = (values: Record<string, unknown>): Record<string, string> => {
    const errors: Record<string, string> = {};
    if (!values.name) errors.name = 'Name is required';
    if (!values.email) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email as string)) {
      errors.email = 'Invalid email format';
    }
    if (!values.role) errors.role = 'Role is required';
    return errors;
  };

  // Save handler
  const handleSave: MRT_TableOptions<User>['onEditingRowSave'] = async ({
    values,
    row,
    table,
  }) => {
    const errors = validateUser(values);
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    await onUpdate(row.original.id, values);
    table.setEditingRow(null);
  };

  // Create handler
  const handleCreate: MRT_TableOptions<User>['onCreatingRowSave'] = async ({
    values,
    table,
  }) => {
    const errors = validateUser(values);
    if (Object.keys(errors).length) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    await onCreate(values as Omit<User, 'id'>);
    table.setCreatingRow(null);
  };

  // Delete handler
  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const table = useMaterialReactTable({
    columns,
    data,
    // Editing
    enableEditing: true,
    editDisplayMode: 'row',
    createDisplayMode: 'row',
    onEditingRowSave: handleSave,
    onCreatingRowSave: handleCreate,
    onEditingRowCancel: () => setValidationErrors({}),
    onCreatingRowCancel: () => setValidationErrors({}),
    getRowId: (row) => row.id,
    // Row actions
    enableRowActions: true,
    positionActionsColumn: 'last',
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: 'flex', gap: '0.5rem' }}>
        <Tooltip title="Edit">
          <IconButton onClick={() => table.setEditingRow(row)}>
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={() => setDeleteId(row.original.id)}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    // Top toolbar - Create button
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="contained"
        onClick={() => table.setCreatingRow(true)}
      >
        Add New User
      </Button>
    ),
  });

  return (
    <>
      <MaterialReactTable table={table} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this user? This action cannot be
          undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}