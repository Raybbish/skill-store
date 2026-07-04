# App Promotion Campaign Workflow (OUTCOME_APP_PROMOTION)

## When to use

Use for campaigns that drive mobile app installs, in-app events, or app re-engagement for a mobile application registered in Meta's App Dashboard.

## Before starting

Re-read [../constraints.md](../constraints.md). Most relevant:
- Budget in cents (×100)
- `promoted_object` required for OUTCOME_APP_PROMOTION — missing it causes a cryptic API error
- `targeting_automation` inside `targeting`
- Budget at campaign level for Advantage+
- `meta_ads_ad_sets_create` uses `mode` + `input_data` — all fields inside `input_data`
- `meta_ads_create` takes a single `input_data` dict — no separate top-level args
- Use `meta_ads_campaigns_activate()`, not `update_campaign(status="ACTIVE")`

---

## Required inputs

| Input | How to get it |
|---|---|
| Ad account ID | Discovery step 1 |
| Facebook Page ID | Discovery step 2 (`meta_ads_owned_pages_list`) |
| Mobile App ID | Ask the user — from Meta App Dashboard (not the app store ID) |
| App store URL | Ask the user — full Apple App Store or Google Play URL with https:// |
| Optimization goal | App installs (default) or specific in-app events |
| Budget amount + currency | Ask the user |
| Daily or lifetime | Ask; lifetime needs start + end dates |
| Ad creative (image_hash) | Upload via `meta_ads_ad_images_upload` |

`promoted_object` with both `application_id` **and** `object_store_url` is required. Missing either will fail at the API.

---

## Decision point: installs vs re-engagement

```
User wants app promotion
  ├── New installs (most common)
  │     optimization_goal: APP_INSTALLS
  │     call_to_action: DOWNLOAD
  │
  └── Re-engagement (existing users)
        optimization_goal: APP_EVENT (confirm specific event with user)
```

Default to APP_INSTALLS unless re-engagement is specified.

---

## Step-by-step creation (default)

### Pre-build checklist

- [ ] App ID confirmed (from Meta App Dashboard — NOT the app store numeric ID)
- [ ] App store URL confirmed (full URL with https://)
- [ ] Budget confirmed and converted to cents
- [ ] Page ID captured explicitly from discovery
- [ ] Creative assets ready or will use app store screenshots

### 1. Create campaign

```python
meta_ads_campaigns_create(
    account_id="act_123456789",
    name="App Installs - [App Name] - [Date]",
    objective="OUTCOME_APP_PROMOTION",
    status="PAUSED",
    daily_budget=2000    # $20/day in cents — Advantage+ only; omit for manual
)
```

→ Capture `campaign_id`.

### 2. Create ad set

> `meta_ads_ad_sets_create` uses a `mode` + `input_data` pattern. Every ad set field goes inside `input_data`.

**Advantage+ (default):**

```json
{
  "mode": "advantage_plus",
  "input_data": {
    "account_id": "act_123456789",
    "name": "US Broad - App Installs",
    "campaign_id": "<campaign_id>",
    "optimization_goal": "APP_INSTALLS",
    "billing_event": "IMPRESSIONS",
    "targeting": {
      "geo_locations": {"countries": ["US"]},
      "targeting_automation": {"advantage_audience": 1}
    },
    "promoted_object": {
      "application_id": "<app_id>",
      "object_store_url": "https://apps.apple.com/app/example/id123456789"
    }
  }
}
```

> **CRITICAL**: `promoted_object` with both `application_id` AND `object_store_url` is required. Omitting either causes a cryptic API error.

> **CRITICAL**: `application_id` is the Meta App Dashboard ID, not the numeric App Store ID.

**Manual (only when user explicitly requests):**

```json
{
  "mode": "manual",
  "input_data": {
    "account_id": "act_123456789",
    "name": "US 18-35 - App Installs",
    "campaign_id": "<campaign_id>",
    "optimization_goal": "APP_INSTALLS",
    "billing_event": "IMPRESSIONS",
    "daily_budget": 2000,
    "targeting": {
      "geo_locations": {"countries": ["US"]},
      "age_min": 18,
      "age_max": 35
    },
    "promoted_object": {
      "application_id": "<app_id>",
      "object_store_url": "https://apps.apple.com/app/example/id123456789"
    }
  }
}
```

→ Capture `adset_id`.

### 3. Upload image

```python
meta_ads_ad_images_upload(account_id="act_123456789", image_url="<url>")
```

→ Capture `image_hash`.

### 4. Create ad

> **CRITICAL**: `meta_ads_create` takes a **single `input_data` dict**. No separate top-level args.

```json
{
  "input_data": {
    "account_id": "act_123456789",
    "name": "App Install Ad - [Creative]",
    "adset_id": "<adset_id>",
    "creative": {
      "object_story_spec": {
        "page_id": "<page_id>",
        "link_data": {
          "link": "https://apps.apple.com/app/example/id123456789",
          "image_hash": "<image_hash>",
          "call_to_action": {"type": "DOWNLOAD"},
          "message": "Download [App Name] and [key benefit].",
          "name": "Get the App"
        }
      }
    }
  }
}
```

> Omit `status` — ads default to PAUSED.

→ Capture `ad_id`.

### 5. Preview and activate

```python
# creative_id is in the ad creation response: response.creative.id
meta_ads_ad_previews_get(creative_ids=["<creative_id>"])
meta_ads_campaigns_activate(campaign_id="<campaign_id>")  # when user approves
```

---

## Common failure points

| Symptom | Cause | Fix |
|---|---|---|
| Cryptic API error on ad set | Missing `promoted_object` | Add `application_id` + `object_store_url` |
| "App not found" error | Wrong `application_id` | Verify in Meta App Dashboard, not app store |
| `object_store_url` invalid | URL format wrong or missing https:// | Use full URL with https:// |
| Budget rejected | Passed dollars not cents | Multiply by 100 |
| Ad set error: unexpected argument | Fields outside `input_data` | All fields must be inside `input_data` dict |
| Campaign ACTIVE but no installs | Used `update_campaign(status="ACTIVE")` | Use `meta_ads_campaigns_activate()` |
