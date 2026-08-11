# Color Management

Work with the design-token color system in this project. Use when adding,
changing, or debugging colors, or when the user asks about theming, design
tokens, OKLCH, or "how do I use colors".

## How the color system works

Colors are managed in a single file: **`src/index.css`**. There is no JS config
or separate token JSON — CSS custom properties are the single source of truth.

```
src/index.css
  :root { --primary: oklch(...); ... }     ← light theme values
  .dark { --primary: oklch(...); ... }     ← dark theme overrides
  @theme inline { --color-primary: var(--primary); ... }  ← Tailwind bridge
```

The flow:

1. **`:root` / `.dark`** define semantic CSS variables in OKLCH.
2. **`@theme inline`** maps each variable to a `--color-*` Tailwind token.
3. **Tailwind utilities** like `bg-primary`, `text-success`, `border-info`
   resolve to the CSS variables and automatically flip with dark mode.
4. **`ThemeProvider`** toggles `light` / `dark` class on `<html>`.

## Available tokens

### Surfaces

| Token | Light | Dark | Tailwind class |
|-------|-------|------|----------------|
| `background` / `foreground` | white / near-black | near-black / near-white | `bg-background`, `text-foreground` |
| `card` / `card-foreground` | white / near-black | dark gray / near-white | `bg-card`, `text-card-foreground` |
| `popover` / `popover-foreground` | same | same | `bg-popover`, etc. |

### Brand / actions

| Token | Tailwind class |
|-------|----------------|
| `primary` / `primary-foreground` | `bg-primary`, `text-primary-foreground` |
| `secondary` / `secondary-foreground` | `bg-secondary`, etc. |

### Neutral helpers

| Token | Tailwind class |
|-------|----------------|
| `muted` / `muted-foreground` | `bg-muted`, `text-muted-foreground` |
| `accent` / `accent-foreground` | `bg-accent`, etc. |

### Semantic status

| Token | Purpose | Tailwind class |
|-------|---------|----------------|
| `destructive` / `destructive-foreground` | Errors, deletions | `bg-destructive`, `text-destructive` |
| `success` / `success-foreground` | Confirmations, positive states | `bg-success`, `text-success` |
| `warning` / `warning-foreground` | Cautions, attention needed | `bg-warning`, `text-warning` |
| `info` / `info-foreground` | Informational notices | `bg-info`, `text-info` |

### Borders & inputs

| Token | Tailwind class |
|-------|----------------|
| `border` | `border-border` (applied globally via `@layer base`) |
| `input` | `border-input` |
| `ring` | `ring-ring` |

### Chart palette (data visualisation)

| Token | Tailwind class |
|-------|----------------|
| `chart-1` … `chart-5` | `bg-chart-1`, `text-chart-1`, etc. |

### Radius

| Token | Tailwind class |
|-------|----------------|
| `radius-sm` … `radius-xl` | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl` |

## Adding a new color

1. Pick an OKLCH value. Use [oklch.com](https://oklch.com) to find a value.
2. Add the CSS variable in **both** `:root` and `.dark` in `src/index.css`:

   ```css
   :root {
     --brand-accent: oklch(0.65 0.2 250);
     --brand-accent-foreground: oklch(0.985 0 0);
   }
   .dark {
     --brand-accent: oklch(0.75 0.18 250);
     --brand-accent-foreground: oklch(0.145 0 0);
   }
   ```

3. Register in `@theme inline`:

   ```css
   @theme inline {
     --color-brand-accent: var(--brand-accent);
     --color-brand-accent-foreground: var(--brand-accent-foreground);
   }
   ```

4. Use in components:

   ```tsx
   <div className="bg-brand-accent text-brand-accent-foreground">
   ```

## Changing the project's brand color

To rebrand `primary` (used by buttons, links, focus rings):

1. Open `src/index.css`.
2. Change the `--primary` and `--primary-foreground` OKLCH values in `:root`.
3. Change the corresponding values in `.dark`.
4. Verify contrast — `primary-foreground` must be readable on `primary`.

## Rules

- **Always use semantic tokens** — never use raw hex, rgb, or oklch values in
  component `className` strings. Use `text-primary`, `bg-success`, etc.
- **Both themes** — every token in `:root` must have a `.dark` counterpart.
- **Foreground pairs** — every background token should have a matching
  `-foreground` for text contrast (e.g. `success` + `success-foreground`).
- **OKLCH** — all values use OKLCH for perceptual uniformity. Alpha is
  expressed as `oklch(L C H / alpha%)`.
- **Don't edit `@theme inline` for color values** — it only maps
  `--color-x: var(--x)`. The actual OKLCH values live in `:root` / `.dark`.
- **Opacity modifiers** work out of the box: `bg-primary/80`, `text-muted-foreground/50`.

## Debugging

- Open DevTools → Elements → computed styles on `<html>` to see resolved values.
- Toggle dark mode via the `<ThemeToggle />` or `document.documentElement.classList.toggle('dark')`.
- `@custom-variant dark (&:is(.dark *))` means `dark:` utilities apply to any
  descendant of `.dark`, not just direct children.
