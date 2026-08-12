# Consent Management

Integrate or modify consent handling for GA4 Consent Mode v2. Use when
launching in a consent-required market (EU/EEA, UK, Brazil LGPD, etc.),
integrating a Consent Management Platform (CMP), or modifying the default
consent posture.

## Current state

Consent defaults to **granted** in `src/lib/analytics.ts`. No CMP is
integrated. This is appropriate when the target market has no legal requirement
for prior user consent before analytics tracking.

## When to change

You must switch to a consent-denied default when **any** of these apply:

- Launching in the EU/EEA or UK (GDPR / ePrivacy Directive)
- Launching in Brazil (LGPD)
- Launching in a jurisdiction with similar consent-before-tracking laws
- Your organisation's privacy policy requires opt-in consent regardless of
  market

## Migration guide — adding consent management

### Step 1: Change the default consent posture

In `src/lib/analytics.ts`, inside `init()`, replace the granted defaults:

```ts
// Before (current — consent granted by default)
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
})

// After (consent denied until user grants)
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500, // ms to wait for CMP to load
})
```

### Step 2: Integrate a CMP

Choose one of the following approaches:

#### Option A: Third-party CMP (recommended for production)

Popular CMPs with Google Consent Mode v2 support:

- **Cookiebot** — automatic geo-detection, plug-and-play script tag
- **OneTrust** — enterprise-grade, geo-specific banner rules
- **Usercentrics** — strong EU compliance, Google CMP partner
- **Cookie Information** — simple setup, Google-certified

These CMPs automatically call `gtag('consent', 'update', {...})` when the user
interacts with the banner. No custom code needed beyond loading their script.

#### Option B: Custom cookie banner (lightweight)

Create a consent banner component:

```
src/features/consent/
  components/
    ConsentBanner.tsx   # UI for the cookie banner
  hooks/
    useConsent.ts       # Manages consent state in localStorage
  types.ts              # Consent preference types
```

The banner should:

1. Render on first visit (check localStorage for prior consent decision).
2. Present clear Accept / Reject / Manage Preferences options.
3. On accept: call `analytics.updateConsent({ analytics_storage: 'granted' })`
   and persist the choice.
4. On reject: persist the decision (consent remains denied — GA4 fires
   cookieless pings for basic measurement).
5. Allow users to change their decision later (e.g. via a footer link).

### Step 3: Grant consent at runtime

After the user accepts tracking:

```ts
import { analytics } from '@/lib/analytics'

analytics.updateConsent({
  analytics_storage: 'granted',
  ad_storage: 'granted',       // only if running ads
  ad_user_data: 'granted',     // only if sharing data with Google Ads
  ad_personalization: 'granted' // only if personalising ads
})
```

### Step 4: Persist and restore consent on return visits

On subsequent visits, read the stored consent state and call
`analytics.updateConsent(...)` early in the page lifecycle (before any events
fire). The `wait_for_update: 500` in the default consent block gives you a
window to do this.

### Step 5: Region-specific defaults (optional)

For apps serving both consent-required and consent-free markets, use
`gtag('consent', 'default', ...)` with the `region` parameter:

```ts
// Deny by default only for EU/EEA users
gtag('consent', 'default', {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  region: ['EU'], // ISO 3166-2 region codes
})

// Grant by default everywhere else
gtag('consent', 'default', {
  analytics_storage: 'granted',
  ad_storage: 'granted',
})
```

This avoids showing a consent banner to users in non-regulated markets.

## Key types

The `ConsentSettings` type in `src/types/analytics.ts` models the four
Consent Mode v2 categories:

```ts
export type ConsentSettings = {
  analytics_storage?: 'granted' | 'denied'
  ad_storage?: 'granted' | 'denied'
  ad_user_data?: 'granted' | 'denied'
  ad_personalization?: 'granted' | 'denied'
}
```

## What GA4 does when consent is denied

Even with consent denied, GA4 sends **cookieless pings** that provide:

- Aggregated page view counts (modelled data)
- Conversion modelling (if Google Ads is linked)

No cookies are set and no user-identifiable data is stored. This satisfies
GDPR requirements while still providing directional analytics.

## Testing consent changes

1. In GA4 DebugView (`VITE_GA_DEBUG_MODE=true`), verify events show the
   correct `analytics_storage` state in the consent parameters.
2. Check the browser Application tab — no `_ga` or `_gid` cookies should
   exist when consent is denied.
3. After granting consent, cookies should appear and events should flow
   normally in Realtime reports.

## Related files

| File | Role |
|------|------|
| `src/lib/analytics.ts` | Consent defaults and `updateConsent()` method |
| `src/types/analytics.ts` | `ConsentSettings` type definition |
| `src/hooks/useAnalytics.ts` | `updateConsent` exposed via React hook |
| `.cursor/skills/analytics-and-monitoring/SKILL.md` | Parent analytics skill |
