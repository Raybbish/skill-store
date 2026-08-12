# Analytics & Monitoring

Work with the GA4 analytics and Sentry error-monitoring integrations in this
project. Use when adding events, capturing errors, configuring user identity,
managing consent, or troubleshooting the integration.

## Architecture overview

Both integrations follow the **adapter pattern**: a thin typed wrapper in
`src/lib/` owns the SDK, and all other code uses the adapter (or the React
hooks) — never the raw SDK.

```
src/lib/analytics.ts    → GA4 gtag.js adapter
src/lib/monitoring.ts   → Sentry adapter (also re-exports ErrorBoundary)
src/types/analytics.ts  → Typed event definitions
src/types/monitoring.ts → Error context / user / breadcrumb types
src/hooks/useAnalytics.ts     → React hook (route-aware)
src/hooks/useMonitoring.ts    → React hook
src/hooks/usePageTracking.ts  → Auto page-view on route change
src/components/ErrorFallback.tsx → Fallback UI for SentryErrorBoundary
```

## GA4 — Adding a new tracked event

1. Define the event shape in `src/types/analytics.ts`:

   ```ts
   export type FeatureUsedEvent = {
     name: 'feature_used'
     params: { feature: string; duration_ms?: number }
   }
   ```

2. Add it to the `AnalyticsEvent` union in the same file.

3. Track it from feature code:

   ```ts
   import { analytics } from '@/lib/analytics'
   analytics.track({ name: 'feature_used', params: { feature: 'export' } })
   ```

   Or via the hook:

   ```tsx
   const { track } = useAnalytics()
   track({ name: 'feature_used', params: { feature: 'export' } })
   ```

### Event naming rules (GA4)

- Use `snake_case`, max 40 characters.
- Avoid GA4 reserved names: `click`, `error`, `first_visit`, `page_view`,
  `scroll`, `session_start`, `user_engagement`.
- Prefer recommended events (`login`, `sign_up`, `search`, `share`,
  `select_content`, `exception`) when they fit — GA4 provides enhanced
  reporting for these.

### User identification (GA4)

```ts
analytics.setUserId(user.id)                    // after login — internal ID only, no PII
analytics.setUserProperties({ plan: 'pro' })    // user-scoped custom dimensions
analytics.clearUserId()                          // on logout
```

Register each user property as a User-scoped Custom Dimension in GA4 Admin >
Custom definitions.

### Consent Mode v2

Consent defaults to **granted** (no CMP integrated; the target market does not
require prior user consent). Data collection starts immediately on page load.

The `updateConsent` method is still available for runtime changes:

```ts
analytics.updateConsent({ analytics_storage: 'granted' })
```

If you later need to launch in a consent-required market (EU/EEA, UK, etc.),
see the dedicated `consent-management` skill for a step-by-step migration guide.

## Sentry — Capturing errors in feature code

### Automatic capture (already wired)

- **Render crashes**: `SentryErrorBoundary` in `App.tsx`.
- **React 19 error hooks**: `onUncaughtError`, `onCaughtError`,
  `onRecoverableError` in `main.tsx`.
- **Unhandled exceptions / rejections**: Sentry global handlers.
- **Navigation spans**: React Router v7 tracing integration in `router.tsx`.

### Manual capture

```ts
import { monitoring } from '@/lib/monitoring'

try {
  await riskyOperation()
} catch (err) {
  monitoring.captureException(err, {
    tags: { feature: 'payments' },       // indexed, filterable in dashboard
    extras: { orderId: order.id },       // arbitrary context
    level: 'error',                      // fatal | error | warning | info | debug
  })
}
```

### Breadcrumbs

Sentry auto-records clicks, navigation, console, and fetch. Add manual
breadcrumbs for significant state changes:

```ts
monitoring.addBreadcrumb({
  category: 'checkout',
  message: 'User selected express shipping',
  data: { shippingMethod: 'express' },
})
```

### User context (Sentry)

```ts
monitoring.setUser({ id: user.id, email: user.email })  // after login
monitoring.clearUser()                                     // on logout
```

### Source-map uploads

Set these **build-time** env vars (not `VITE_` prefixed):

```
SENTRY_AUTH_TOKEN=sntrys_…
SENTRY_ORG=my-org
SENTRY_PROJECT=my-project
```

`@sentry/vite-plugin` uploads source maps automatically during `yarn build`.

## Adding a new error boundary section

Wrap a section in its own `SentryErrorBoundary` with `beforeCapture` to tag it:

```tsx
import { SentryErrorBoundary } from '@/lib/monitoring'

<SentryErrorBoundary
  fallback={ErrorFallback}
  beforeCapture={(scope) => scope.setTag('section', 'dashboard')}
>
  <Dashboard />
</SentryErrorBoundary>
```

## Env vars checklist

| Variable | File | Purpose |
|----------|------|---------|
| `VITE_ANALYTICS_ENABLED` | `.env.example`, `env.ts`, `vite-env.d.ts` | Toggle GA4 |
| `VITE_GA_MEASUREMENT_ID` | same trio | GA4 stream ID |
| `VITE_GA_DEBUG_MODE` | same trio | GA4 debug view |
| `VITE_SENTRY_ENABLED` | same trio | Toggle Sentry |
| `VITE_SENTRY_DSN` | same trio | Sentry ingest URL |
| `VITE_SENTRY_ENVIRONMENT` | same trio | e.g. staging, production |
| `VITE_SENTRY_RELEASE` | same trio | Semver or commit SHA |
| `VITE_SENTRY_TRACES_SAMPLE_RATE` | same trio | Performance sample rate |
| `VITE_SENTRY_REPLAYS_SAMPLE_RATE` | same trio | Replay sample rate |
| `VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE` | same trio | Replay-on-error rate |
| `SENTRY_AUTH_TOKEN` | CI / local `.env` | Source-map upload |
| `SENTRY_ORG` | CI / local `.env` | Source-map upload |
| `SENTRY_PROJECT` | CI / local `.env` | Source-map upload |

## Testing

Both adapters are no-ops when disabled (the default in tests). The test file
`src/lib/__tests__/integrations.test.ts` verifies safe no-op behaviour and
console fallbacks.
