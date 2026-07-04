# Advanced Features Reference

Complete guide to MRT advanced features: accessibility, localization, export, click-to-copy, drag & drop, and more.

---

## Table of Contents

1. [Accessibility & Keyboard Navigation](#accessibility--keyboard-navigation)
2. [Localization (i18n)](#localization-i18n)
3. [Data Export (CSV, Excel, PDF)](#data-export-csv-excel-pdf)
4. [Click to Copy](#click-to-copy)
5. [Drag & Drop](#drag--drop)
6. [Cell Actions & Context Menu](#cell-actions--context-menu)
7. [Full Screen Mode](#full-screen-mode)
8. [Column Resizing](#column-resizing)
9. [Row Pinning](#row-pinning)
10. [Aggregation & Grouping](#aggregation--grouping)
11. [Density Toggle](#density-toggle)
12. [Column Actions Menu](#column-actions-menu)

---

## Accessibility & Keyboard Navigation

### Keyboard Shortcuts (V3 Default)

MRT V3 enables `enableKeyboardShortcuts` by default.

| Key | Action |
|-----|--------|
| `↑` `↓` `←` `→` | Navigate cells |
| `Tab` | Next focusable element |
| `Shift + Tab` | Previous element |
| `Home` | First cell in row |
| `End` | Last cell in row |
| `Ctrl/Cmd + Home` | First cell in table |
| `Ctrl/Cmd + End` | Last cell in table |
| `Page Up/Down` | Navigate pages |
| `Enter` / `Space` | Trigger action (sort, select, expand) |
| `Ctrl/Cmd + Enter` | Open column menu |
| `Escape` | Exit full screen, close menu |

### Configuration

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  // V3: enabled by default, disable if needed
  enableKeyboardShortcuts: false,

  // Focus styling
  mrtTheme: {
    cellNavigationOutlineColor: 'primary.main',
  },
});
```

### Custom Focus Styling

```tsx
muiTableBodyCellProps: {
  sx: {
    '&:focus-visible': {
      outline: '2px solid',
      outlineColor: 'primary.main',
      outlineOffset: -2,
    },
  },
},
```

### ARIA Attributes

MRT automatically applies ARIA attributes:

```tsx
// Automatic attributes
<table role="grid" aria-colcount={columnCount} aria-rowcount={rowCount}>
<th aria-sort="ascending|descending|none">
<td aria-selected="true|false">
```

### Screen Reader Support

```tsx
// Add custom announcements
const [announcement, setAnnouncement] = useState('');

onSortingChange: (sorting) => {
  const col = sorting[0];
  setAnnouncement(`Sorted by ${col.id} ${col.desc ? 'descending' : 'ascending'}`);
},

// Render live region
<div role="status" aria-live="polite" className="sr-only">
  {announcement}
</div>
```

### Focus Management

```tsx
// Focus trap in full screen
enableFullScreenToggle: true, // Focus trapped when active

// Custom key handlers
muiTableBodyCellProps: {
  onKeyDown: (e) => {
    if (e.key === 'Enter') {
      // Custom action
    }
  },
},
```

---

## Localization (i18n)

### Built-in Locales (30+)

```tsx
// Import specific locale
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import { MRT_Localization_DE } from 'material-react-table/locales/de';
import { MRT_Localization_FR } from 'material-react-table/locales/fr';
import { MRT_Localization_JA } from 'material-react-table/locales/ja';
import { MRT_Localization_ZH_HANS } from 'material-react-table/locales/zh-Hans';
import { MRT_Localization_PT_BR } from 'material-react-table/locales/pt-BR';

const table = useMaterialReactTable({
  columns,
  data,
  localization: MRT_Localization_ES,
});
```

### Available Locales

`cs`, `da`, `de`, `en`, `es`, `fa`, `fi`, `fr`, `hu`, `id`, `it`, `ja`, `ko`, `nl`, `no`, `pl`, `pt`, `pt-BR`, `ro`, `ru`, `sk`, `sr-Cryl-RS`, `sr-Latn-RS`, `sv`, `tr`, `uk`, `vi`, `zh-Hans`, `zh-Hant`

### Remix/ESM Import

```tsx
// For Remix or strict ESM environments
import { MRT_Localization_ES } from 'material-react-table/locales/es/index.esm.js';
```

### Custom/Partial Localization

```tsx
// Override specific strings
localization: {
  ...MRT_Localization_EN,
  actions: 'Acciones',
  cancel: 'Cancelar',
  clearFilter: 'Limpiar Filtro',
  clearSearch: 'Limpiar Búsqueda',
  noRecordsToDisplay: 'No hay registros',
  save: 'Guardar',
  search: 'Buscar...',
},
```

### Complete Custom Localization

```tsx
const customLocalization: MRT_Localization = {
  // Must include language tag for number formatting
  language: 'es-ES',

  // All UI strings
  actions: 'Acciones',
  and: 'y',
  cancel: 'Cancelar',
  clearFilter: 'Limpiar filtro',
  clearSearch: 'Limpiar búsqueda',
  clearSort: 'Limpiar orden',
  clickToCopy: 'Clic para copiar',
  columnActions: 'Acciones de columna',
  copiedToClipboard: 'Copiado al portapapeles',
  edit: 'Editar',
  expand: 'Expandir',
  expandAll: 'Expandir todo',
  filterByColumn: 'Filtrar por {column}',
  filterMode: 'Modo de filtro: {filterType}',
  grab: 'Arrastrar',
  groupByColumn: 'Agrupar por {column}',
  groupedBy: 'Agrupado por ',
  hideAll: 'Ocultar todo',
  hideColumn: 'Ocultar columna {column}',
  max: 'Máx',
  min: 'Mín',
  move: 'Mover',
  noRecordsToDisplay: 'No hay registros para mostrar',
  noResultsFound: 'No se encontraron resultados',
  of: 'de',
  or: 'o',
  pinToLeft: 'Fijar a la izquierda',
  pinToRight: 'Fijar a la derecha',
  resetOrder: 'Restablecer orden',
  rowActions: 'Acciones de fila',
  rowNumber: '#',
  rowNumbers: 'Números de fila',
  rowsPerPage: 'Filas por página',
  save: 'Guardar',
  search: 'Buscar',
  selectedCountOfRowCountRowsSelected: '{selectedCount} de {rowCount} fila(s) seleccionada(s)',
  showAll: 'Mostrar todo',
  showAllColumns: 'Mostrar todas las columnas',
  showHideColumns: 'Mostrar/Ocultar columnas',
  showHideFilters: 'Mostrar/Ocultar filtros',
  showHideSearch: 'Mostrar/Ocultar búsqueda',
  sortByColumnAsc: 'Ordenar por {column} ascendente',
  sortByColumnDesc: 'Ordenar por {column} descendente',
  thenBy: ', luego por ',
  toggleDensity: 'Alternar densidad',
  toggleFullScreen: 'Alternar pantalla completa',
  toggleSelectAll: 'Alternar seleccionar todo',
  toggleSelectRow: 'Alternar seleccionar fila',
  toggleVisibility: 'Alternar visibilidad',
  ungroupByColumn: 'Desagrupar por {column}',
  unpin: 'Desfijar',
  unpinAll: 'Desfijar todo',
};
```

### Dynamic Locale Switching

```tsx
const [locale, setLocale] = useState<MRT_Localization>(MRT_Localization_EN);

const handleLanguageChange = (lang: string) => {
  const locales: Record<string, MRT_Localization> = {
    en: MRT_Localization_EN,
    es: MRT_Localization_ES,
    de: MRT_Localization_DE,
  };
  setLocale(locales[lang] || MRT_Localization_EN);
};

const table = useMaterialReactTable({
  columns,
  data,
  localization: locale,
});
```

### Number Formatting (V3)

```tsx
// V3 automatically uses locale for number formatting
// Based on localization.language BCP 47 tag
localization: {
  language: 'de-DE', // German number format: 1.234,56
},
```

---

## Data Export (CSV, Excel, PDF)

### CSV Export with export-to-csv

```bash
npm install export-to-csv
```

```tsx
import { mkConfig, generateCsv, download } from 'export-to-csv';

const csvConfig = mkConfig({
  fieldSeparator: ',',
  decimalSeparator: '.',
  useKeysAsHeaders: true,
  filename: 'table-export',
});

// Export handlers
const handleExportAllData = () => {
  const csv = generateCsv(csvConfig)(data);
  download(csvConfig)(csv);
};

const handleExportFilteredRows = () => {
  const rows = table.getFilteredRowModel().rows.map(row => row.original);
  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
};

const handleExportPageRows = () => {
  const rows = table.getRowModel().rows.map(row => row.original);
  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
};

const handleExportSelectedRows = () => {
  const rows = table.getSelectedRowModel().rows.map(row => row.original);
  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
};

// Add to toolbar
renderTopToolbarCustomActions: ({ table }) => (
  <Box sx={{ display: 'flex', gap: 1 }}>
    <Button onClick={handleExportAllData} startIcon={<FileDownloadIcon />}>
      Export All
    </Button>
    <Button
      disabled={table.getSelectedRowModel().rows.length === 0}
      onClick={handleExportSelectedRows}
    >
      Export Selected
    </Button>
  </Box>
),
```

### Excel Export with xlsx

```bash
npm install xlsx
```

```tsx
import * as XLSX from 'xlsx';

const handleExportExcel = () => {
  const rows = table.getFilteredRowModel().rows.map(row => row.original);

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // Column A
    { wch: 30 }, // Column B
    { wch: 15 }, // Column C
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

  // Download
  XLSX.writeFile(workbook, 'export.xlsx');
};
```

### PDF Export with jsPDF

```bash
npm install jspdf jspdf-autotable
```

```tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const handleExportPDF = () => {
  const doc = new jsPDF();

  // Get visible columns
  const visibleColumns = table.getVisibleLeafColumns();
  const headers = visibleColumns.map(col => col.columnDef.header as string);

  // Get row data
  const rows = table.getFilteredRowModel().rows.map(row =>
    visibleColumns.map(col => row.getValue(col.id))
  );

  // Generate table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 139, 202] },
  });

  // Add title
  doc.setFontSize(16);
  doc.text('Data Export', 14, 15);

  doc.save('export.pdf');
};
```

### Export with Column Selection

```tsx
const handleExportWithColumns = (columnIds: string[]) => {
  const rows = table.getFilteredRowModel().rows.map(row => {
    const rowData: Record<string, any> = {};
    columnIds.forEach(colId => {
      rowData[colId] = row.getValue(colId);
    });
    return rowData;
  });

  const csv = generateCsv(csvConfig)(rows);
  download(csvConfig)(csv);
};
```

---

## Click to Copy

### Enable Globally

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableClickToCopy: true,
});
```

### Enable Per Column

```tsx
{
  accessorKey: 'email',
  header: 'Email',
  enableClickToCopy: true,
}

{
  accessorKey: 'phone',
  header: 'Phone',
  enableClickToCopy: 'context-menu', // Right-click only
}
```

### Custom Copy Button

```tsx
muiCopyButtonProps: {
  sx: { width: '100%' },
  startIcon: <ContentCopyIcon />,
},
```

### Copy Callback

```tsx
// Customize what gets copied
{
  accessorKey: 'email',
  header: 'Email',
  enableClickToCopy: true,
  muiCopyButtonProps: ({ cell }) => ({
    onClick: () => {
      navigator.clipboard.writeText(cell.getValue<string>());
      toast.success('Email copied!');
    },
  }),
}
```

### Context Menu Copy

```tsx
enableClickToCopy: 'context-menu',

// Copy appears in cell action menu
renderCellActionMenuItems: ({ cell, closeMenu, internalMenuItems }) => [
  ...internalMenuItems, // Includes copy action
  <MenuItem key="custom" onClick={() => {
    customAction(cell);
    closeMenu();
  }}>
    Custom Action
  </MenuItem>,
],
```

---

## Drag & Drop

### Column Reordering

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  enableColumnOrdering: true,
  enableColumnDragging: true,
});

// Controlled column order
const [columnOrder, setColumnOrder] = useState<string[]>([
  'name', 'email', 'status', 'actions'
]);

state: { columnOrder },
onColumnOrderChange: setColumnOrder,
```

### Row Reordering

```tsx
const [data, setData] = useState(initialData);

const table = useMaterialReactTable({
  columns,
  data,
  enableRowOrdering: true,
  enableSorting: false, // Disable sorting when row ordering

  muiRowDragHandleProps: {
    onDragEnd: () => {
      const { draggingRow, hoveredRow } = table.getState();
      if (draggingRow && hoveredRow) {
        // Reorder data
        const newData = [...data];
        const dragIndex = draggingRow.index;
        const hoverIndex = hoveredRow.index;

        const [removed] = newData.splice(dragIndex, 1);
        newData.splice(hoverIndex, 0, removed);

        setData(newData);
      }
    },
  },
});
```

### Row Dragging to External Target

```tsx
enableRowDragging: true,

muiRowDragHandleProps: ({ row }) => ({
  onDragStart: (e) => {
    e.dataTransfer.setData('text/plain', JSON.stringify(row.original));
  },
}),
```

### Drag Handle Customization

```tsx
displayColumnDefOptions: {
  'mrt-row-drag': {
    header: '',
    size: 40,
    muiTableHeadCellProps: { sx: { padding: 0 } },
    muiTableBodyCellProps: { sx: { padding: 0 } },
  },
},
```

---

## Cell Actions & Context Menu

### Basic Cell Actions

```tsx
enableCellActions: true,

renderCellActionMenuItems: ({ cell, row, column, closeMenu }) => [
  <MenuItem key="edit" onClick={() => {
    handleEdit(row.original);
    closeMenu();
  }}>
    <ListItemIcon><EditIcon /></ListItemIcon>
    Edit
  </MenuItem>,
  <MenuItem key="delete" onClick={() => {
    handleDelete(row.original.id);
    closeMenu();
  }}>
    <ListItemIcon><DeleteIcon /></ListItemIcon>
    Delete
  </MenuItem>,
],
```

### Include Internal Actions

```tsx
renderCellActionMenuItems: ({ internalMenuItems, closeMenu, cell }) => [
  // Include copy action if enableClickToCopy is set
  ...internalMenuItems,
  <Divider key="divider" />,
  <MenuItem key="custom">Custom Action</MenuItem>,
],
```

### Context Menu Only

```tsx
enableCellActions: true,
// Right-click triggers menu, not hover
positionActionsColumn: false,
```

---

## Full Screen Mode

### Enable

```tsx
enableFullScreenToggle: true, // Default true

// Programmatic control
table.setIsFullScreen(true);
table.setIsFullScreen(false);
```

### Custom Full Screen Button

```tsx
renderToolbarInternalActions: ({ table }) => (
  <>
    {/* Other actions */}
    <Tooltip title="Full Screen">
      <IconButton onClick={() => table.setIsFullScreen(!table.getState().isFullScreen)}>
        {table.getState().isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
      </IconButton>
    </Tooltip>
  </>
),
```

### Full Screen Styling

```tsx
muiTablePaperProps: ({ table }) => ({
  sx: {
    ...(table.getState().isFullScreen && {
      '& .MuiTableContainer-root': {
        maxHeight: 'calc(100vh - 150px)',
      },
    }),
  },
}),
```

---

## Column Resizing

### Enable

```tsx
enableColumnResizing: true,
columnResizeMode: 'onChange', // 'onChange' | 'onEnd'
columnResizeDirection: 'ltr', // 'ltr' | 'rtl'

// Default sizing
defaultColumn: {
  minSize: 50,
  maxSize: 500,
  size: 150,
},
```

### Layout Mode (V2+)

```tsx
// When column resizing enabled, default is 'grid-no-grow'
layoutMode: 'grid',         // Columns can grow
layoutMode: 'grid-no-grow', // Fixed widths (default with resizing)
layoutMode: 'semantic',     // Traditional table layout
```

### Controlled Column Sizing

```tsx
const [columnSizing, setColumnSizing] = useState<MRT_ColumnSizingState>({});

state: { columnSizing },
onColumnSizingChange: setColumnSizing,
```

### Reset Column Sizes

```tsx
<Button onClick={() => table.resetColumnSizing()}>
  Reset Column Widths
</Button>
```

---

## Row Pinning

### Enable

```tsx
enableRowPinning: true,
rowPinningDisplayMode: 'top-and-bottom', // 'top' | 'bottom' | 'top-and-bottom' | 'select-sticky'
```

### Pin Actions

```tsx
// Automatic pin button in row actions
// Or programmatic:
row.pin('top');
row.pin('bottom');
row.pin(false); // Unpin
```

### Controlled Pinning

```tsx
const [rowPinning, setRowPinning] = useState<MRT_RowPinningState>({
  top: ['row-1', 'row-2'],
  bottom: [],
});

state: { rowPinning },
onRowPinningChange: setRowPinning,
```

### Keep Pinned Rows Visible

```tsx
keepPinnedRows: true, // Show pinned even when filtered
```

---

## Aggregation & Grouping

### Enable Grouping

```tsx
enableGrouping: true,
enableExpandAll: true,

initialState: {
  grouping: ['department'],
  expanded: true,
},
```

### Column Aggregation

```tsx
{
  accessorKey: 'salary',
  header: 'Salary',
  aggregationFn: 'sum', // Built-in: 'sum' | 'mean' | 'median' | 'min' | 'max' | 'count' | 'extent' | 'unique' | 'uniqueCount'
  AggregatedCell: ({ cell }) => (
    <Box sx={{ fontWeight: 'bold' }}>
      Total: ${cell.getValue<number>().toLocaleString()}
    </Box>
  ),
}
```

### Custom Aggregation Function

```tsx
{
  accessorKey: 'score',
  header: 'Score',
  aggregationFn: (columnId, leafRows, childRows) => {
    const values = leafRows.map(row => row.getValue<number>(columnId));
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length; // Average
  },
}
```

### Grouped Cell Rendering

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

---

## Density Toggle

### Enable

```tsx
enableDensityToggle: true, // Default true
```

### Initial Density

```tsx
initialState: {
  density: 'compact', // 'comfortable' | 'compact' | 'spacious'
}
```

### Programmatic Control

```tsx
table.setDensity('compact');
```

### Custom Density Options

```tsx
// Note: Density affects padding, not easily customizable
// Use muiTableBodyCellProps for fine control
muiTableBodyCellProps: {
  sx: ({ table }) => ({
    py: table.getState().density === 'compact' ? 0.5 : 1.5,
  }),
},
```

---

## Column Actions Menu

### Enable

```tsx
enableColumnActions: true, // Default true
```

### Custom Menu Items

```tsx
renderColumnActionsMenuItems: ({ column, closeMenu, internalMenuItems }) => [
  ...internalMenuItems,
  <Divider key="divider" />,
  <MenuItem key="custom" onClick={() => {
    handleCustomColumnAction(column);
    closeMenu();
  }}>
    Custom Action
  </MenuItem>,
],
```

### Disable for Specific Column

```tsx
{
  accessorKey: 'actions',
  header: 'Actions',
  enableColumnActions: false,
}
```

### Column Menu Button Styling

```tsx
muiColumnActionsButtonProps: {
  sx: { opacity: 0.5 },
},
```

---

## Sources

- [Accessibility Guide](https://www.material-react-table.com/docs/guides/accessibility)
- [Localization Guide](https://www.material-react-table.com/docs/guides/localization)
- [CSV Export Example](https://www.material-react-table.com/docs/examples/export-csv)
- [PDF Export Example](https://www.material-react-table.com/docs/examples/export-pdf)
- [Click to Copy Guide](https://www.material-react-table.com/docs/guides/click-to-copy)
- [Column Ordering/DnD Guide](https://www.material-react-table.com/docs/guides/column-ordering-dnd)
- [Row Ordering/DnD Guide](https://www.material-react-table.com/docs/guides/row-ordering-dnd)
- [Cell Actions Guide](https://www.material-react-table.com/docs/guides/cell-actions)