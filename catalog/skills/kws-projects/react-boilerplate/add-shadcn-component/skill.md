---
name: add-shadcn-component
description: Add, wrap, or upgrade shadcn/ui components in this project using its two-layer convention. Use when adding a shadcn component, customizing one, upgrading shadcn, or when the user mentions shadcn, "ui component", or "components/ui".
---

# Add / Upgrade shadcn Components

This project uses a two-layer convention so that vendored shadcn code stays
pristine (easy to upgrade) and customizations live in a stable wrapper layer.

- `src/components/shadcn/<name>.tsx` - the original, downloaded via the CLI.
  Never imported directly by app code. Treat as vendored; avoid editing.
- `src/components/ui/<name>.tsx` - the project-facing component. App code imports
  **only** from here. Extend the original here.

`components.json` is configured so the CLI installs into `src/components/shadcn/`
(the `ui` alias points there). shadcn primitives import each other from
`@/components/shadcn/*`, which is intentional and self-consistent.

## Add a new component

1. Download it (pins the current version into `shadcn/`):

```bash
npx shadcn@latest add <name>
```

2. Create the wrapper `src/components/ui/<name>.tsx`.

   - If no changes are needed, make it a passthrough:

```tsx
export * from '@/components/shadcn/<name>'
```

   - If extending, import the original and build on top, re-exporting the same
     names so call sites are unchanged:

```tsx
import { Button as ShadcnButton } from '@/components/shadcn/button'
// ...add props/variants, then export your Button
```

3. App code imports from `@/components/ui/<name>` (never `shadcn/`).

## Upgrade

Re-run `npx shadcn@latest add <name> --overwrite`. Only files in `shadcn/`
change; wrappers in `ui/` keep your customizations. Review the diff, then run
`yarn format && yarn typecheck && yarn lint && yarn test`.

## Gotchas

- Theme: the shadcn `sonner` reads its theme from `next-themes`, which this
  project does not use. `src/components/ui/sonner.tsx` overrides the `theme`
  prop with the app's `useTheme` (`@/app/providers/ThemeContext`). Apply the
  same override pattern in the wrapper for any component that assumes
  `next-themes`.
- Naming: the shadcn CLI generates files in kebab-case (e.g. `dropdown-menu.tsx`).
  Leave the `shadcn/` file as-is (vendored, never renamed). The `ui/` wrapper
  uses PascalCase (e.g. `DropdownMenu.tsx`) to match the project convention.
- Animations come from `tw-animate-css` (imported in `src/index.css`). Keep that
  import if components use `animate-in` / `zoom-in` utilities.
- ESLint disables `react-refresh/only-export-components` for `shadcn/` and `ui/`,
  so co-locating variants with components is fine there.
