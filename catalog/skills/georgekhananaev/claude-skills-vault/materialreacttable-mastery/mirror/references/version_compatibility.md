# Version Compatibility Matrix

Complete reference for MRT version compatibility, feature availability, and dependency requirements.

---

## Version Overview

| MRT Version | Release | MUI Version | React Version | TanStack Table | Status |
|-------------|---------|-------------|---------------|----------------|--------|
| V3.x | 2024+ | v6.0.0+ | v18.0.0+ | v8.x | **Current** |
| V2.x | 2023-2024 | v5.11.0+ | v17.0.0+ | v8.x | Maintenance |
| V1.x | 2022-2023 | v5.0.0+ | v17.0.0+ | v8.x | Deprecated |

---

## MUI v7 Compatibility (2025)

### Current Status

⚠️ **MRT V3 does NOT officially support MUI v7 yet.** As of January 2025, MRT V3.2.1 has peer dependencies requiring MUI v6. Official v7 support is tracked in [GitHub Issue #1401](https://github.com/KevinVandy/material-react-table/issues/1401).

### Known Issues with MUI v7

| Issue | Severity | Workaround |
|-------|----------|------------|
| Dark mode displays incorrectly | High | Use light mode only |
| TypeScript errors (`TimePickerProps` generics) | Medium | Type assertions or disable strict mode |
| npm peer dependency conflicts | Medium | Use `--legacy-peer-deps` flag |
| CSS variables not fully respected | Low | Avoid `nativeColor: true` theme feature |

### Installing MRT with MUI v7 (Experimental)

```bash
# NOT RECOMMENDED FOR PRODUCTION
npm install material-react-table@3 @mui/material@7 @mui/icons-material@7 --legacy-peer-deps

# Or with force (may cause instability)
npm install material-react-table@3 @mui/material@7 @mui/icons-material@7 --force
```

### MUI v7 Breaking Changes Affecting Tables

#### 1. Grid Component Restructuring

```tsx
// MUI v6
import { Grid2 } from '@mui/material';
<Grid2 container spacing={2}>...</Grid2>

// MUI v7 - Grid2 promoted to Grid
import { Grid } from '@mui/material';
<Grid container spacing={2}>...</Grid>

// Old Grid renamed to GridLegacy
import { GridLegacy } from '@mui/material';
```

#### 2. Deep Imports Removed

```tsx
// MUI v6 - Works
import createTheme from '@mui/material/styles/createTheme';

// MUI v7 - BROKEN, use:
import { createTheme } from '@mui/material/styles';
```

#### 3. Dialog/Modal API Changes

```tsx
// MUI v6 - Deprecated but works
<Dialog onBackdropClick={handleClose}>

// MUI v7 - Use onClose with reason
<Dialog onClose={(event, reason) => {
  if (reason === 'backdropClick') handleClose();
}}>
```

#### 4. InputLabel Size Prop

```tsx
// MUI v6
<InputLabel size="normal">

// MUI v7 - "normal" replaced with "medium"
<InputLabel size="medium">
```

#### 5. Hidden Component Removed

```tsx
// MUI v6
import { Hidden } from '@mui/material';
<Hidden mdDown>...</Hidden>

// MUI v7 - Use sx prop or useMediaQuery
<Box sx={{ display: { xs: 'none', md: 'block' } }}>...</Box>

// Or JavaScript approach
const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
{isMdUp && <Component />}
```

#### 6. Import Path Changes

```tsx
// MUI v6
import { TablePaginationActionsProps } from '@mui/material/TablePagination/TablePaginationActions';
import { StyledEngineProvider } from '@mui/material';

// MUI v7
import { TablePaginationActionsProps } from '@mui/material/TablePaginationActions';
import { StyledEngineProvider } from '@mui/material/styles';
```

#### 7. Theme Behavior with CSS Variables

```tsx
// MUI v7 - Theme no longer re-renders on mode change when using CSS variables
// Access runtime values differently:

// Before (v6)
const bgColor = theme.palette.background.default;

// After (v7) - Use theme.vars for CSS variable mode
const bgColor = theme.vars?.palette?.background?.default || theme.palette.background.default;

// Or opt-out of new behavior
<ThemeProvider theme={theme} forceThemeRerender>
```

### Migration Codemod

MUI provides codemods for automated migration:

```bash
# Run all v7 codemods
npx @mui/codemod v7.0.0/preset-safe <path/to/folder>

# Specific codemods
npx @mui/codemod v7.0.0/grid-props <path>          # Grid → GridLegacy
npx @mui/codemod v7.0.0/input-label-size <path>    # normal → medium
```

### Recommended Approach

| Scenario | Recommendation |
|----------|----------------|
| New project | Stay on MUI v6 until MRT officially supports v7 |
| Existing MRT project | Do NOT upgrade to MUI v7 yet |
| Must use MUI v7 | Use light mode only, expect TypeScript issues |
| Production app | Wait for official MRT v7 support |

### TypeScript with MUI v7

```tsx
// MUI v7 requires TypeScript 4.9+
// Stricter typing may require adjustments:

// DatePicker props changed
import { TimePickerProps } from '@mui/x-date-pickers';

// v6 - Worked
const props: TimePickerProps = { ... };

// v7 - Requires generic
const props: TimePickerProps<Date> = { ... };
```

### Monitoring v7 Support

Watch these resources for official support:
- [MRT GitHub Issue #1401](https://github.com/KevinVandy/material-react-table/issues/1401)
- [MRT Changelog](https://www.material-react-table.com/changelog)
- [MRT Discord](https://discord.gg/5wqyRx6fnm)

---

## MUI v7 Dark Mode Workarounds

### The Problem

When toggling light/dark mode with MRT + MUI v7, text colors change but background colors and table rows don't update properly. This is due to hardcoded background values in `MRT_TablePaper` that don't dynamically respond to theme changes.

### Solution 1: CSS Override (Simplest)

```css
/* Force MRT to use MUI CSS variables for backgrounds */
.mrt-table {
  .MuiPaper-root,
  .MuiBox-root,
  .MuiTableRow-root {
    background-color: var(--mui-palette-background-default) !important;
  }
}
```

### Solution 2: Dynamic mrtTheme Function

```tsx
const table = useMaterialReactTable({
  columns,
  data,
  mrtTheme: (theme) => ({
    baseBackgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[900]
      : theme.palette.background.default,
    menuBackgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.background.paper,
    selectedRowBackgroundColor: theme.palette.mode === 'dark'
      ? alpha(theme.palette.primary.main, 0.2)
      : alpha(theme.palette.primary.main, 0.1),
  }),
});
```

### Solution 3: Wrapper Box with Theme-Aware Styles

```tsx
<Box
  sx={{
    '& .MuiPaper-root, & .MuiBox-root, & .MuiTableRow-root': {
      backgroundColor: (theme) => theme.palette.background.paper,
    },
  }}
>
  <MaterialReactTable table={table} />
</Box>
```

### Solution 4: Use theme.applyStyles() (MUI v7 Recommended)

```tsx
// In your styled components or sx prop
const StyledTableContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.vars?.palette?.background?.default,
  ...theme.applyStyles('dark', {
    backgroundColor: theme.vars?.palette?.grey?.[900],
  }),
}));
```

---

## MUI v7 CSS Layers Support

### Overview

MUI v7 introduces CSS layers (`@layer`) for better style ordering and framework integration (e.g., Tailwind CSS v4). This feature is also backported to MUI v6.

### Enable CSS Layers

#### Next.js App Router

```tsx
// app/layout.tsx
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          {children}
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

#### Vite / Client-Side Apps

```tsx
import { StyledEngineProvider } from '@mui/material/styles';
import GlobalStyles from '@mui/material/GlobalStyles';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StyledEngineProvider enableCssLayer>
    <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
    <App />
  </StyledEngineProvider>
);
```

### Modular CSS Layers

For granular control, enable modular layers:

```tsx
const theme = createTheme({
  modularCssLayers: true,
});
```

This generates five layers:
- `@layer mui.global` - Baseline styles
- `@layer mui.components` - Component base styles
- `@layer mui.theme` - Theme overrides
- `@layer mui.custom` - Custom styled components
- `@layer mui.sx` - Inline sx prop styles

---

## MUI v7 SSR Dark Mode (No Flickering)

### The Problem

SSR apps can't detect user's preferred mode on the server, causing a light→dark flicker during hydration.

### Solution: InitColorSchemeScript

```tsx
// app/layout.tsx (Next.js App Router)
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
  colorSchemes: { dark: true },
  cssVariables: {
    colorSchemeSelector: 'data',
  },
});

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="data" defaultMode="system" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider theme={theme} defaultMode="system">
            {children}
          </ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
```

### Use theme.applyStyles() Instead of theme.palette.mode

```tsx
// DON'T - Causes flickering
const bgColor = theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff';

// DO - No flickering
const MyComponent = styled('div')(({ theme }) => ({
  backgroundColor: theme.vars?.palette?.background?.default,
  ...theme.applyStyles('dark', {
    backgroundColor: theme.vars?.palette?.grey?.[900],
  }),
}));
```

---

## MUI X Date Pickers v8 Compatibility

### Current State

| Package | MRT V3 Requirement | MUI v7 Optimized |
|---------|-------------------|------------------|
| @mui/x-date-pickers | v7.15.0+ | v8.x |

### Compatibility Notes

- **MRT V3** requires `@mui/x-date-pickers` v7.15.0+
- **MUI X v8** is optimized for MUI v7 but supports v5/v6 with extra config
- Mixing MRT V3 + MUI v7 + Date Pickers v8 may cause issues

### Safe Configuration

```json
{
  "dependencies": {
    "material-react-table": "^3.2.1",
    "@mui/material": "^6.0.0",
    "@mui/x-date-pickers": "^7.15.0"
  }
}
```

### If Using MUI v7 (Experimental)

```json
{
  "dependencies": {
    "material-react-table": "^3.2.1",
    "@mui/material": "^7.0.0",
    "@mui/x-date-pickers": "^8.0.0"
  },
  "overrides": {
    "material-react-table": {
      "@mui/material": "^7.0.0",
      "@mui/icons-material": "^7.0.0"
    }
  }
}
```

---

## MRT Roadmap (Future MUI v7 Support)

According to the official roadmap, planned updates include:
- Upgrade to Material UI V7
- Upgrade to TanStack Table V9
- Modular options rewrite for smaller bundle size
- Joy UI and Base UI adapters

Track progress at [MRT Roadmap](https://www.material-react-table.com/roadmap).

---

## Dependency Requirements

### MRT V3 (Current)

```json
{
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0",
    "@mui/material": ">=5.15.0 || >=6.0.0",
    "@mui/icons-material": ">=5.15.0 || >=6.0.0",
    "@mui/x-date-pickers": ">=6.15.0 || >=7.15.0",
    "@emotion/react": ">=11.0.0",
    "@emotion/styled": ">=11.0.0"
  }
}
```

**Note:** MRT V3 officially supports both MUI v5.15+ and MUI v6+. MUI v6 is recommended for new projects.

### MRT V2 (Maintenance)

```json
{
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0",
    "@mui/material": ">=5.11.0",
    "@mui/icons-material": ">=5.11.0",
    "@mui/x-date-pickers": ">=6.15.0",
    "@emotion/react": ">=11.0.0",
    "@emotion/styled": ">=11.0.0"
  }
}
```

### MRT V1 (Deprecated)

```json
{
  "peerDependencies": {
    "react": ">=17.0.0",
    "react-dom": ">=17.0.0",
    "@mui/material": ">=5.0.0",
    "@mui/icons-material": ">=5.0.0",
    "@emotion/react": ">=11.0.0",
    "@emotion/styled": ">=11.0.0"
  }
}
```

---

## Feature Availability by Version

### Core Features

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| Sorting | ✅ | ✅ | ✅ |
| Filtering | ✅ | ✅ | ✅ |
| Pagination | ✅ | ✅ | ✅ |
| Row Selection | ✅ | ✅ | ✅ |
| Column Visibility | ✅ | ✅ | ✅ |
| Column Resizing | ✅ | ✅ | ✅ |
| Row Virtualization | ✅ | ✅ | ✅ |
| Column Virtualization | ✅ | ✅ | ✅ |
| Grouping | ✅ | ✅ | ✅ |
| Aggregation | ✅ | ✅ | ✅ |
| Expand/Collapse | ✅ | ✅ | ✅ |
| Editing (CRUD) | ✅ | ✅ | ✅ |

### Hook & API Changes

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| `useMaterialReactTable` hook | ❌ | ✅ | ✅ |
| `tableInstanceRef` prop | ✅ | ❌ | ❌ |
| `createMRTColumnHelper` | ❌ | ✅ | ✅ |

### UI Features

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| Full Screen Mode | ✅ | ✅ | ✅ |
| Density Toggle | ✅ | ✅ | ✅ |
| Global Filter | ✅ | ✅ | ✅ |
| Column Pinning | `enablePinning` | `enableColumnPinning` | `enableColumnPinning` |
| Row Pinning | ❌ | ✅ | ✅ |
| Keyboard Navigation | Limited | Limited | ✅ (Default) |

### Layout Modes

| Mode | V1 | V2 | V3 |
|------|----|----|-----|
| `semantic` | Default | ✅ | ✅ |
| `grid` | ❌ | ✅ | ✅ |
| `grid-no-grow` | ❌ | ✅ (Default w/ resize) | ✅ (Default w/ resize) |

### Date Features

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| Date filtering | ⚠️ Basic | ✅ | ✅ |
| Date range filtering | ❌ | ✅ | ✅ |
| DateTime filtering | ❌ | ✅ | ✅ |
| Time filtering | ❌ | ✅ | ✅ |
| Date picker integration | ❌ | `@mui/x-date-pickers` v6+ | `@mui/x-date-pickers` v7.15+ |

### Localization

| Feature | V1 | V2 | V3 |
|---------|----|----|-----|
| Built-in locales | ✅ 25+ | ✅ 30+ | ✅ 30+ |
| Custom localization | ✅ | ✅ | ✅ |
| Number formatting | ❌ | ❌ | ✅ (`language` tag) |

---

## API Changes Between Versions

### Prop Renames V1 → V2

| V1 Prop | V2+ Prop |
|---------|----------|
| `editingMode` | `editDisplayMode` |
| `rowNumberMode` | `rowNumberDisplayMode` |
| `enablePinning` | `enableColumnPinning` + `enableRowPinning` |
| `virtualizerInstanceRef` | `rowVirtualizerRef` + `columnVirtualizerRef` |
| `virtualizerProps` | `rowVirtualizerOptions` + `columnVirtualizerOptions` |
| `muiTablePaginationProps` | `muiPaginationProps` |
| `muiTableBodyCellEditTextFieldProps` | `muiEditTextFieldProps` |
| `muiTableHeadCellFilterTextFieldProps` | `muiFilterTextFieldProps` |
| `muiTableHeadCellFilterSliderProps` | `muiFilterSliderProps` |
| `muiTableBodyCellCopyButtonProps` | `muiCopyButtonProps` |
| `muiTableBodyCellSkeletonProps` | `muiSkeletonProps` |
| `muiTableBodyRowDragHandleProps` | `muiRowDragHandleProps` |
| `muiTableDetailPanelProps` | `muiDetailPanelProps` |
| `muiTableHeadCellColumnActionsButtonProps` | `muiColumnActionsButtonProps` |
| `muiTableHeadCellDragHandleProps` | `muiColumnDragHandleProps` |

### Type Renames V1 → V2

| V1 Type | V2+ Type |
|---------|----------|
| `MaterialReactTableProps<TData>` | `MRT_TableOptions<TData>` |
| `MRT_FilterFnsState` | `MRT_ColumnFilterFns` |
| `MRT_FullScreenToggleButton` | `MRT_ToggleFullScreenButton` |

### API Changes V2 → V3

| V2 | V3 |
|----|-----|
| `MRT_Virtualizer` type | `MRT_RowVirtualizer` + `MRT_ColumnVirtualizer` |
| `{ text: 'X', value: 'x' }` in select options | `{ label: 'X', value: 'x' }` |
| `enableKeyboardShortcuts: false` (default) | `enableKeyboardShortcuts: true` (default) |

---

## Breaking Changes Summary

### V1 → V2

1. **Import change**: Default export → Named export
   ```tsx
   // V1
   import MaterialReactTable from 'material-react-table';
   // V2+
   import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
   ```

2. **Table instance access**: `tableInstanceRef` removed, use `useMaterialReactTable` hook

3. **Column sizing**: New `grid-no-grow` layout mode default when resizing enabled

4. **Date pickers**: Now require `@mui/x-date-pickers` and `LocalizationProvider`

5. **Prop renames**: Many `muiTable*Props` shortened

### V2 → V3

1. **MUI v6 required**: Must upgrade all MUI packages to v6+

2. **Date pickers**: Require `@mui/x-date-pickers` v7.15+

3. **Select options**: `text` → `label` in `filterSelectOptions` and `editSelectOptions`

4. **Virtualizer types**: `MRT_Virtualizer` split into row/column specific types

5. **Keyboard navigation**: Now enabled by default

6. **TypeScript**: Stricter `sx` prop typing from MUI v6

---

## Upgrade Paths

### V1 → V2 (Recommended First)

```bash
# 1. Update dependencies
npm install material-react-table@2 @mui/x-date-pickers@6

# 2. Update imports
# Before: import MaterialReactTable from 'material-react-table';
# After: import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';

# 3. Replace tableInstanceRef with useMaterialReactTable hook

# 4. Rename props (see table above)

# 5. Add LocalizationProvider if using date features
```

### V2 → V3

```bash
# 1. Update MUI to v6
npm install @mui/material@6 @mui/icons-material@6 @mui/x-date-pickers@7

# 2. Update MRT
npm install material-react-table@3

# 3. Update select option format: text → label

# 4. Update virtualizer type imports if used

# 5. Test keyboard navigation (now default)

# 6. Fix any sx prop TypeScript errors
```

### V1 → V3 (Direct)

```bash
# 1. Update all dependencies at once
npm install material-react-table@3 @mui/material@6 @mui/icons-material@6 @mui/x-date-pickers@7

# 2. Apply ALL changes from V1→V2 AND V2→V3
```

---

## Version Detection

### Check Installed Version

```bash
npm list material-react-table
```

### Runtime Version Check

```tsx
import { MRT_TableOptions } from 'material-react-table';

// V2+ has useMaterialReactTable
// V3 has specific types like MRT_RowVirtualizer

// Check at runtime (not recommended, use proper version)
const isV3 = 'enableKeyboardShortcuts' in defaultOptions;
```

---

## Recommended Versions

### New Projects (2025+)

```bash
npm install material-react-table@latest @mui/material@latest @mui/icons-material@latest @mui/x-date-pickers@latest @emotion/react @emotion/styled @tanstack/react-query
```

### Existing Projects

| Current State | Recommendation |
|---------------|----------------|
| V1 on MUI 5 | Upgrade to V2 first, then V3 |
| V2 on MUI 5 | Upgrade MUI to v6, then MRT to V3 |
| V2 on MUI 6 | Upgrade to MRT V3 |
| V3 | Keep updated |

---

## TypeScript Compatibility

| MRT Version | TypeScript | Notes |
|-------------|------------|-------|
| V3 | 4.7+ | Required for MUI v6 |
| V2 | 4.4+ | Recommended 4.7+ |
| V1 | 4.1+ | Basic support |

### Type Strictness Changes in V3

```tsx
// V2 - More permissive
sx={{ color: '#ff0000' }}

// V3 - May require casting
sx={{ color: '#ff0000' as any }}
// or use theme tokens
sx={{ color: 'error.main' }}
```

---

## Browser Support

All versions support:
- Chrome 90+
- Firefox 90+
- Safari 14+
- Edge 90+

**Note**: IE11 not supported in any version.

---

## Sources

### Material React Table
- [MRT V3 Changelog](https://www.material-react-table.com/changelog)
- [MRT Roadmap](https://www.material-react-table.com/roadmap)
- [V2 Migration Guide](https://v2.material-react-table.com/docs/getting-started/migrating-to-v2)
- [V3 Migration Guide](https://www.material-react-table.com/docs/getting-started/migrating-to-v3)
- [MRT Customize Components](https://www.material-react-table.com/docs/guides/customize-components)

### MUI Migration
- [MUI v6 Migration](https://mui.com/material-ui/migration/upgrade-to-v6/)
- [MUI v7 Migration](https://mui.com/material-ui/migration/upgrade-to-v7/)
- [MUI X v6→v7 Migration](https://mui.com/x/migration/migration-data-grid-v6/)
- [MUI X v7→v8 Migration](https://mui.com/x/migration/migration-pickers-v7/)

### MUI v7 Features
- [CSS Layers](https://mui.com/material-ui/customization/css-layers/)
- [Dark Mode](https://mui.com/material-ui/customization/dark-mode/)
- [CSS Theme Variables](https://mui.com/material-ui/customization/css-theme-variables/configuration/)
- [InitColorSchemeScript](https://mui.com/material-ui/react-init-color-scheme-script/)
- [Next.js App Router](https://mui.com/material-ui/integrations/nextjs/)

### GitHub Issues
- [MRT + MUI v7 Issue #1401](https://github.com/KevinVandy/material-react-table/issues/1401)
- [MRT Theme Mode Switching #1429](https://github.com/KevinVandy/material-react-table/issues/1429)