# Customization Reference

## Toolbar Customization

### Top Toolbar
```tsx
renderTopToolbar: ({ table }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <MRT_GlobalFilterTextField table={table} />
      <MRT_ToggleFiltersButton table={table} />
    </Box>
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Button onClick={handleExport}>Export</Button>
      <Button variant="contained" onClick={() => table.setCreatingRow(true)}>
        Add New
      </Button>
    </Box>
  </Box>
),
```

### Bottom Toolbar
```tsx
renderBottomToolbar: ({ table }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2 }}>
    <Typography>
      Showing {table.getRowModel().rows.length} of {table.getFilteredRowModel().rows.length}
    </Typography>
    <MRT_TablePagination table={table} />
  </Box>
),
```

### Custom Actions
```tsx
renderTopToolbarCustomActions: ({ table }) => (
  <Button onClick={() => handleRefresh()}>Refresh Data</Button>
),
```

### Toolbar Internal Actions
```tsx
renderToolbarInternalActions: ({ table }) => (
  <>
    <MRT_ToggleGlobalFilterButton table={table} />
    <MRT_ToggleFiltersButton table={table} />
    <MRT_ShowHideColumnsButton table={table} />
    <MRT_ToggleDensePaddingButton table={table} />
    <MRT_ToggleFullScreenButton table={table} />
    <IconButton onClick={handleSettings}>
      <SettingsIcon />
    </IconButton>
  </>
),
```

## Styling

### Table Container
```tsx
muiTableContainerProps: {
  sx: {
    maxHeight: '600px',
    border: '1px solid rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
  },
},
```

### Table Paper
```tsx
muiTablePaperProps: {
  elevation: 0,
  sx: {
    borderRadius: 2,
    border: '1px solid #e0e0e0',
  },
},
```

### Header
```tsx
muiTableHeadCellProps: {
  sx: {
    backgroundColor: 'primary.main',
    color: 'white',
    fontWeight: 'bold',
  },
},
```

### Rows
```tsx
muiTableBodyRowProps: ({ row }) => ({
  sx: {
    backgroundColor: row.index % 2 ? 'grey.50' : 'white',
    '&:hover': { backgroundColor: 'action.hover' },
  },
}),
```

### Cells
```tsx
muiTableBodyCellProps: {
  sx: { borderRight: '1px solid #e0e0e0' },
},
```

### Per-Column Styling
```tsx
{
  accessorKey: 'amount',
  header: 'Amount',
  muiTableHeadCellProps: { sx: { color: 'green' } },
  muiTableBodyCellProps: { sx: { fontWeight: 'bold' } },
}
```

## Conditional Row Styling

```tsx
muiTableBodyRowProps: ({ row }) => ({
  sx: {
    backgroundColor:
      row.original.status === 'Error' ? 'error.light' :
      row.original.status === 'Warning' ? 'warning.light' : undefined,
    opacity: row.original.isDisabled ? 0.5 : 1,
  },
}),
```

## Empty State

```tsx
renderEmptyRowsFallback: () => (
  <Box sx={{ textAlign: 'center', p: 4 }}>
    <Typography variant="h6" color="text.secondary">
      No data available
    </Typography>
    <Button sx={{ mt: 2 }} onClick={handleCreate}>
      Add First Item
    </Button>
  </Box>
),
```

## Loading State

```tsx
muiCircularProgressProps: {
  color: 'secondary',
  size: 60,
},
muiSkeletonProps: {
  animation: 'wave',
},
```

## Localization

### Built-in Locales
```tsx
import { MRT_Localization_ES } from 'material-react-table/locales/es';

localization: MRT_Localization_ES,
```

### Custom Localization
```tsx
localization: {
  actions: 'Actions',
  cancel: 'Cancel',
  clearFilter: 'Clear',
  clearSearch: 'Clear Search',
  columnActions: 'Column Actions',
  edit: 'Edit',
  expand: 'Expand',
  filterByColumn: 'Filter by {column}',
  noRecordsToDisplay: 'No records found',
  // ... more keys
},
```

## Layout Modes

### Grid Layout
```tsx
layoutMode: 'grid', // Default: 'semantic'
```

### Fixed Column Widths
```tsx
defaultColumn: {
  minSize: 50,
  maxSize: 500,
  size: 150,
},
```

## Density

### Initial Density
```tsx
initialState: {
  density: 'compact', // 'comfortable' | 'compact' | 'spacious'
}
```

### Disable Density Toggle
```tsx
enableDensityToggle: false,
```

## Column Features Toggle

```tsx
enableColumnActions: false,      // Column menu
enableColumnFilters: false,      // Filter row
enableColumnOrdering: false,     // Drag reorder
enableColumnResizing: false,     // Resize handles
enableHiding: false,             // Show/hide columns
enablePinning: false,            // Pin columns
enableSorting: false,            // Sort headers
```

## Icons Override

```tsx
icons: {
  ArrowDownwardIcon: () => <CustomSortIcon />,
  CancelIcon: () => <CustomClearIcon />,
  ClearAllIcon: () => <CustomResetIcon />,
  // ... more icons
},
```

## mrtTheme (V3 Styling Superpower)

V3 introduced `mrtTheme` for cleaner semantic color theming without fighting `sx` selectors.

### Basic mrtTheme

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  mrtTheme: {
    baseBackgroundColor: '#f5f5f5',
    draggingBorderColor: 'primary.main',
    matchHighlightColor: 'warning.light',
    menuBackgroundColor: 'background.paper',
    pinnedRowBackgroundColor: 'grey.100',
    selectedRowBackgroundColor: 'primary.light',
  },
});
```

### mrtTheme Properties

| Property | Description |
|----------|-------------|
| `baseBackgroundColor` | Default table background |
| `draggingBorderColor` | Border during drag operations |
| `matchHighlightColor` | Search match highlighting |
| `menuBackgroundColor` | Column action menu background |
| `pinnedRowBackgroundColor` | Pinned row background |
| `selectedRowBackgroundColor` | Selected row highlight |
| `cellNavigationOutlineColor` | Keyboard nav focus outline (V3) |

### Dark Mode with mrtTheme

```tsx
const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

mrtTheme: {
  baseBackgroundColor: isDarkMode ? '#1e1e1e' : '#ffffff',
  menuBackgroundColor: isDarkMode ? '#2d2d2d' : '#ffffff',
  selectedRowBackgroundColor: isDarkMode ? '#3d3d3d' : '#e3f2fd',
},
```

### Combined with MUI Theme

```tsx
// mrtTheme for MRT-specific colors
// MUI theme for general component styling
const table = useMaterialReactTable({
  columns,
  data,
  mrtTheme: {
    baseBackgroundColor: theme.palette.background.default,
    selectedRowBackgroundColor: alpha(theme.palette.primary.main, 0.1),
  },
});
```

---

## Z-Index & Stacking Context

### Common Issue: Table in Modal/Drawer

Sticky headers/columns can lose z-index context when table is inside Modal, Drawer, or nested layouts.

### Fix: Establish Stacking Context

```tsx
muiTableContainerProps: {
  sx: {
    position: 'relative',
    zIndex: 0, // Establish new stacking context
  },
},
```

### Fix: Adjust Header z-index

```tsx
muiTableHeadCellProps: {
  sx: {
    zIndex: 1, // Ensure headers stay above body
  },
},
```

### Modal with Table Pattern

```tsx
<Dialog open={open} maxWidth="xl" fullWidth>
  <DialogContent sx={{ position: 'relative', overflow: 'hidden' }}>
    <Box sx={{ position: 'relative', zIndex: 0 }}>
      <MaterialReactTable
        table={table}
        muiTableContainerProps={{
          sx: { maxHeight: '60vh' },
        }}
      />
    </Box>
  </DialogContent>
</Dialog>
```

### Pinned Column z-index

```tsx
// Ensure pinned columns stay above regular cells during horizontal scroll
muiTableBodyCellProps: ({ column }) => ({
  sx: {
    ...(column.getIsPinned() && {
      zIndex: 1,
      position: 'sticky',
    }),
  },
}),
```

---

## Theme Integration

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { padding: '8px 16px' },
        head: { backgroundColor: '#f5f5f5' },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: { '&:hover': { backgroundColor: '#fafafa' } },
      },
    },
  },
});

<ThemeProvider theme={theme}>
  <MaterialReactTable table={table} />
</ThemeProvider>
```

## Responsive Behavior

### Hide Columns on Mobile
```tsx
{
  accessorKey: 'email',
  header: 'Email',
  visibleInShowHideMenu: false, // Hide from toggle
}

// Or dynamically
const isMobile = useMediaQuery('(max-width:600px)');
initialState: {
  columnVisibility: {
    email: !isMobile,
    phone: !isMobile,
  },
}
```

### Stack on Mobile
```tsx
muiTableProps: {
  sx: {
    '@media (max-width: 600px)': {
      '& td, & th': { display: 'block' },
    },
  },
},
```