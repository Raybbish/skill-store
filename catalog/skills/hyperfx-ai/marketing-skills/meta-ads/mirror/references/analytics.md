# Meta Ads: Performance Analytics

Use this for querying performance data, ad-level insights, and historical reporting.

---

## When to use cached data vs the Meta API

| Situation | Use |
|---|---|
| User asks for a performance check or trend | Cached data first (faster, no rate limits) |
| User needs fields not in the cache | Meta API insights tools |
| Cache is stale or user explicitly requests fresh data | Call `meta_business_sync`, then query cache |
| No cached data exists yet for this account | Meta API as fallback |
| Campaign was just created in this session | Meta API directly — new campaigns are NOT in cache yet |

> **Important**: The cache is not real-time. If the user just created a campaign in this conversation, it won't appear in cached data. Use `meta_ads_insights_get` or `meta_ads_campaigns_get` directly for anything created in the current session.

> **Check the cache's latest date before trusting it for a recent window.** The cache can lag by weeks or months. If the user asks for "last 30 days" but the cache's most recent row is older than that window, the cache cannot answer the question — go straight to `meta_ads_insights_get` for live data. Always confirm the max date in the cache (e.g. `SELECT MAX(date_start) FROM <table>`) before relying on it for a time-bounded request.

Check the toolkit context for the cached table name and last sync timestamp before calling any API tools.

---

## Querying insights via the Meta API

### Account-level campaign summary

```json
{
  "object_id": "act_123456789",
  "object_type": "account",
  "level": "campaign",
  "date_preset": "last_30d",
  "include_actions": true
}
```

### Ad set breakdown

```json
{
  "object_id": "act_123456789",
  "object_type": "account",
  "level": "adset",
  "date_preset": "last_30d",
  "include_actions": true
}
```

### Ad-level breakdown (use for historical or drilldown)

Use `level: "ad"` to get ad-level data across the full account. Do **not** iterate every ad ID individually — that is slow and will hit rate limits.

```json
{
  "object_id": "act_123456789",
  "object_type": "account",
  "level": "ad",
  "date_preset": "last_90d",
  "include_actions": true
}
```

Use `object_type: "ad"` only when drilling into a single specific ad.

Use `time_increment: "1"` only when daily rows are needed (daily spend trends, delivery dates). It significantly increases response size — avoid for summary queries.

---

## Valid date presets

`date_preset` accepts only Meta's fixed preset values. Do **not** invent values — they will be rejected by the API with no clear error message.

**Valid presets:**

```
today               yesterday           last_3d             last_7d
last_14d            last_28d            last_30d            last_90d
last_week_mon_sun   last_week_sun_sat   last_month          last_quarter
last_year           this_week_mon_today this_week_sun_today this_month
this_quarter        this_year           maximum             data_maximum
```

**These do NOT exist and will be rejected:**
`last_60d`, `last_1d`, `last_180d`, `last_6_months`, `last_45d`

**For any window without a matching preset, use `time_range` instead:**

```json
{
  "time_range": {
    "since": "2026-04-01",
    "until": "2026-05-31"
  }
}
```

`since`/`until` are `YYYY-MM-DD`. `time_range` overrides `date_preset` when both are present.

For all-time / lifetime data: `"date_preset": "maximum"` (optionally with `"time_increment": "all_days"`).

Do not claim Meta only supports 7 or 28 days unless an actual API response says so.

---

## Querying cached data

Use the integration-scoped table name from the toolkit context. Query cached data with `database_query` (the canonical SQL tool; `hyper_data_sql` is a legacy alias and may not be exposed under that name). There is no other standalone raw-SQL tool — for dashboards, route SQL through `hyper_data_build_dashboard`'s `sql_data_sources` instead.

### Daily spend trend

```sql
SELECT
  campaign_name,
  date_start,
  SUM(spend) AS total_spend,
  SUM(impressions) AS total_impressions
FROM <cached_table>
GROUP BY campaign_name, date_start
ORDER BY date_start DESC
LIMIT 100;
```

### Campaign performance summary

```sql
SELECT
  campaign_name,
  SUM(spend) AS spend,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  ROUND(SUM(clicks)::numeric / NULLIF(SUM(impressions), 0) * 100, 2) AS ctr_pct,
  ROUND(SUM(spend)::numeric / NULLIF(SUM(clicks), 0), 2) AS cpc
FROM <cached_table>
GROUP BY campaign_name
ORDER BY spend DESC;
```

### Ad set cost-per-conversion

```sql
SELECT
  adset_name,
  SUM(spend) AS spend,
  SUM(conversions) AS conversions,
  CASE
    WHEN SUM(conversions) > 0 THEN ROUND(SUM(spend)::numeric / SUM(conversions), 2)
    ELSE NULL
  END AS cost_per_conversion
FROM <cached_table>
GROUP BY adset_name
ORDER BY spend DESC;
```

Prefer cached data for reporting and dashboards. Use the Meta API directly only when a required field is missing from the cache, or for campaigns created in this session.

---

## Cache refresh

Data syncs automatically every 30 minutes.

If the data appears stale or the user requests a refresh: call `meta_business_sync` with no parameters. This is a background operation — do not wait for completion.

---

## Replicating an existing campaign (analyze → create)

When the task is "find the best performer and build a new campaign modelled on it," inspect the source with `meta_ads_campaigns_get` and `meta_ads_ad_sets_list`, then build the new campaign via the matching objective workflow ([discovery.md](discovery.md) → relevant `campaigns/<objective>.md`).

> **`get_ad_sets` often returns `promoted_object: null` (and `bid_amount`/`bid_strategy: null`) even when the source ad set actually uses pixel tracking.** Do not assume the source had no pixel just because the GET response shows null. When replicating a sales or leads campaign, re-derive `promoted_object` yourself: look up the pixel with `meta_ads_ad_pixels_list`, infer the `custom_event_type` from the conversion events visible in the source's insights (e.g. PURCHASE, LEAD, COMPLETE_REGISTRATION), and set it explicitly on the new ad set per the objective workflow.

Carry forward from the source: objective, targeting (age/geo/advantage_audience), and budget mode (campaign-level CBO vs ad-set). Re-derive everything pixel/promoted_object-related rather than trusting the GET response.

### Duplicating a campaign and swapping creatives

For "duplicate this campaign exactly but with new creatives":

1. **Read the source structure**: `meta_ads_campaigns_get`, `meta_ads_ad_sets_list`, `meta_ads_list`. For the creative, `meta_ads_ad_creatives_get` (the list view shows `link_url: null` — get the full creative to see the real destination).
2. **Recreate** campaign → ad set → ad via the matching objective workflow, copying objective, targeting, and budget mode. Re-derive `promoted_object` (see warning above). Name the new campaign as the user specified.
3. **Swap creatives**: upload the new images (`meta_ads_ad_images_upload`), then either build a fresh inline `object_story_spec` on the new ad or create new creatives with `meta_ads_ad_creatives_create` and attach by `creative_id`.
4. **Verify before deleting anything**: confirm the new ads were created and the new creatives are attached (`meta_ads_list` / `meta_ads_ad_creatives_get`).
5. **Only then** delete old draft creatives with `meta_ads_ad_creatives_delete` (or `meta_ads_delete` for ads). Never delete the source until the replacement is confirmed.

Leave the new campaign PAUSED unless the user said to activate.
