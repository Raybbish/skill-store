# Pagination & Virtualization Reference

## Client-Side Pagination

### Basic Setup
```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enablePagination: true,
  paginationDisplayMode: 'pages', // 'pages' | 'default'
});
```

### Page Size Options
```tsx
muiPaginationProps: {
  rowsPerPageOptions: [10, 25, 50, 100],
  showFirstButton: true,
  showLastButton: true,
},
```

### Initial State
```tsx
initialState: {
  pagination: { pageIndex: 0, pageSize: 25 },
}
```

## Server-Side Pagination

### Setup
```tsx
const [pagination, setPagination] = useState<MRT_PaginationState>({
  pageIndex: 0,
  pageSize: 10,
});

const { data, isLoading } = useQuery({
  queryKey: ['data', pagination],
  queryFn: () => fetchData({
    page: pagination.pageIndex + 1, // API usually 1-indexed
    limit: pagination.pageSize,
  }),
});

const table = useMaterialReactTable({
  columns,
  data: data?.items ?? [],
  rowCount: data?.totalCount ?? 0, // Total rows in DB
  manualPagination: true,
  onPaginationChange: setPagination,
  state: { pagination, isLoading },
});
```

### Backend API Shape
```typescript
// Request
GET /api/users?page=1&limit=10&sort=createdAt&order=desc

// Response
{
  items: User[],
  totalCount: 1500,
  page: 1,
  limit: 10,
  totalPages: 150
}
```

## Row Virtualization

Enable for large datasets (10,000+ rows):

```tsx
const table = useMaterialReactTable({
  columns,
  data: largeDataset,
  enableRowVirtualization: true,
  rowVirtualizerInstanceRef: rowVirtualizerInstanceRef, // Optional ref
  rowVirtualizerOptions: {
    overscan: 5, // Rows to render outside viewport
    estimateSize: () => 52, // Estimated row height
  },
});
```

### Fixed Row Height (Performance)
```tsx
muiTableBodyRowProps: {
  sx: { height: 52 }, // Fixed height for consistent virtualization
},
```

### Scroll to Row
```tsx
const rowVirtualizerInstanceRef = useRef<MRT_RowVirtualizer>(null);

// Scroll to specific row
rowVirtualizerInstanceRef.current?.scrollToIndex(100, { align: 'center' });
```

## Column Virtualization

For tables with many columns (20+):

```tsx
const table = useMaterialReactTable({
  columns, // 50+ columns
  data,
  enableColumnVirtualization: true,
  columnVirtualizerOptions: {
    overscan: 2,
  },
});
```

## Combined Virtualization

```tsx
const table = useMaterialReactTable({
  columns,
  data: massiveDataset,
  enableRowVirtualization: true,
  enableColumnVirtualization: true,
  rowVirtualizerOptions: { overscan: 10 },
  columnVirtualizerOptions: { overscan: 5 },
});
```

## Infinite Scroll

Instead of pagination, load more on scroll:

```tsx
const { data, fetchNextPage, hasNextPage, isFetching } = useInfiniteQuery({
  queryKey: ['users'],
  queryFn: ({ pageParam = 0 }) => fetchUsers({ offset: pageParam, limit: 50 }),
  getNextPageParam: (lastPage) => lastPage.nextOffset,
});

const flatData = useMemo(
  () => data?.pages.flatMap((page) => page.items) ?? [],
  [data]
);

const table = useMaterialReactTable({
  columns,
  data: flatData,
  enablePagination: false,
  enableRowVirtualization: true,
  rowVirtualizerOptions: {
    overscan: 10,
  },
  muiTableContainerProps: {
    sx: { maxHeight: '600px' },
    onScroll: (event) => {
      const { scrollTop, scrollHeight, clientHeight } = event.target;
      if (scrollHeight - scrollTop - clientHeight < 400 && hasNextPage && !isFetching) {
        fetchNextPage();
      }
    },
  },
});
```

## Performance Tips

### 1. Memoize Data
```tsx
const data = useMemo(() => rawData, [rawData]);
```

### 2. Memoize Columns
```tsx
const columns = useMemo<MRT_ColumnDef<T>[]>(() => [...], []);
```

### 3. Fixed Row Height
```tsx
muiTableBodyRowProps: { sx: { height: 52 } },
```

### 4. Disable Unnecessary Features
```tsx
enableDensityToggle: false,
enableFullScreenToggle: false,
enableColumnActions: false,
```

### 5. Lazy Load Heavy Cells
```tsx
Cell: ({ cell, row }) => {
  // Only render complex content when visible
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => { setIsVisible(true); }, []);
  if (!isVisible) return <Skeleton />;
  return <HeavyComponent data={row.original} />;
},
```

## Sticky Header

Keep header visible when scrolling:

```tsx
muiTableContainerProps: {
  sx: { maxHeight: '500px' },
},
enableStickyHeader: true,
```

## Sticky Footer

```tsx
enableStickyFooter: true,
```