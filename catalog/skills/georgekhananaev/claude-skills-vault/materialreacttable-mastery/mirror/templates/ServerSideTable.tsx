/**
 * Server-Side Material React Table Template
 * Pagination, filtering, and sorting handled by backend API.
 * Integrates with TanStack Query for data fetching.
 */
import { useMemo, useState } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_ColumnFiltersState,
  type MRT_PaginationState,
  type MRT_SortingState,
} from 'material-react-table';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Box, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

// Define your data type
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// API response shape
interface UsersResponse {
  data: User[];
  meta: {
    totalRowCount: number;
    pageCount: number;
  };
}

// API fetch function
async function fetchUsers(params: {
  pagination: MRT_PaginationState;
  sorting: MRT_SortingState;
  columnFilters: MRT_ColumnFiltersState;
  globalFilter: string;
}): Promise<UsersResponse> {
  const { pagination, sorting, columnFilters, globalFilter } = params;

  const searchParams = new URLSearchParams({
    page: String(pagination.pageIndex + 1),
    limit: String(pagination.pageSize),
    ...(globalFilter && { search: globalFilter }),
  });

  // Add sorting
  if (sorting.length) {
    searchParams.set('sortBy', sorting[0].id);
    searchParams.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
  }

  // Add column filters
  columnFilters.forEach((filter) => {
    searchParams.set(`filter[${filter.id}]`, String(filter.value));
  });

  const response = await fetch(`/api/users?${searchParams}`);
  if (!response.ok) throw new Error('Failed to fetch users');
  return response.json();
}

export function ServerSideTable() {
  // Table state
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting] = useState<MRT_SortingState>([]);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Fetch data with React Query
  const { data, isError, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['users', { columnFilters, globalFilter, pagination, sorting }],
    queryFn: () => fetchUsers({ columnFilters, globalFilter, pagination, sorting }),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // 30 seconds
  });

  // Column definitions
  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Name',
        size: 200,
      },
      {
        accessorKey: 'email',
        header: 'Email',
        size: 250,
      },
      {
        accessorKey: 'role',
        header: 'Role',
        size: 120,
        filterVariant: 'select',
        filterSelectOptions: ['Admin', 'User', 'Guest'],
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        size: 150,
        filterVariant: 'date-range',
        Cell: ({ cell }) =>
          new Date(cell.getValue<string>()).toLocaleDateString(),
      },
    ],
    [],
  );

  const table = useMaterialReactTable({
    columns,
    data: data?.data ?? [],
    // Row count from server
    rowCount: data?.meta?.totalRowCount ?? 0,
    // Enable manual (server-side) operations
    manualFiltering: true,
    manualPagination: true,
    manualSorting: true,
    // State
    state: {
      columnFilters,
      globalFilter,
      isLoading,
      pagination,
      showAlertBanner: isError,
      showProgressBars: isRefetching,
      sorting,
    },
    // State change handlers
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    // Features
    enableRowSelection: true,
    enableColumnFilters: true,
    enableGlobalFilter: true,
    // Pagination
    paginationDisplayMode: 'pages',
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100],
      showFirstButton: true,
      showLastButton: true,
    },
    // Error banner
    muiToolbarAlertBannerProps: isError
      ? { color: 'error', children: 'Error loading data' }
      : undefined,
    // Refresh button
    renderTopToolbarCustomActions: () => (
      <Tooltip title="Refresh Data">
        <IconButton onClick={() => refetch()}>
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    ),
  });

  return <MaterialReactTable table={table} />;
}

/**
 * Example API endpoint (Next.js API Route):
 *
 * // app/api/users/route.ts
 * export async function GET(request: Request) {
 *   const { searchParams } = new URL(request.url);
 *   const page = parseInt(searchParams.get('page') ?? '1');
 *   const limit = parseInt(searchParams.get('limit') ?? '10');
 *   const search = searchParams.get('search') ?? '';
 *   const sortBy = searchParams.get('sortBy') ?? 'createdAt';
 *   const sortOrder = searchParams.get('sortOrder') ?? 'desc';
 *
 *   // Build query with your ORM (Prisma example)
 *   const where = search ? {
 *     OR: [
 *       { name: { contains: search, mode: 'insensitive' } },
 *       { email: { contains: search, mode: 'insensitive' } },
 *     ],
 *   } : {};
 *
 *   const [users, totalCount] = await Promise.all([
 *     prisma.user.findMany({
 *       where,
 *       orderBy: { [sortBy]: sortOrder },
 *       skip: (page - 1) * limit,
 *       take: limit,
 *     }),
 *     prisma.user.count({ where }),
 *   ]);
 *
 *   return Response.json({
 *     data: users,
 *     meta: {
 *       totalRowCount: totalCount,
 *       pageCount: Math.ceil(totalCount / limit),
 *     },
 *   });
 * }
 */