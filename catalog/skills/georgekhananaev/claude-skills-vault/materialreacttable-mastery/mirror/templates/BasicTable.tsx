/**
 * Basic Material React Table Template
 * Simple read-only table with filtering, sorting, and pagination.
 */
import { useMemo } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
} from 'material-react-table';

// Define your data type
interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  status: 'Active' | 'Inactive' | 'Pending';
}

interface BasicTableProps {
  data: Person[];
}

export function BasicTable({ data }: BasicTableProps) {
  // ALWAYS wrap columns in useMemo
  const columns = useMemo<MRT_ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'firstName',
        header: 'First Name',
        size: 150,
      },
      {
        accessorKey: 'lastName',
        header: 'Last Name',
        size: 150,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
      },
      {
        accessorKey: 'age',
        header: 'Age',
        size: 100,
        filterVariant: 'range',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        size: 120,
        filterVariant: 'select',
        filterSelectOptions: ['Active', 'Inactive', 'Pending'],
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data,
    // Features
    enableColumnFilters: true,
    enableGlobalFilter: true,
    enablePagination: true,
    enableSorting: true,
    // Defaults
    initialState: {
      showColumnFilters: false,
      density: 'comfortable',
    },
    // Pagination options
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50],
      showFirstButton: true,
      showLastButton: true,
    },
  });

  return <MaterialReactTable table={table} />;
}