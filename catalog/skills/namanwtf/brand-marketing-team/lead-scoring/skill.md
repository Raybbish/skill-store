---
name: lead-scoring
description: AI-powered lead qualification that scores and prioritizes prospects based on behavior, demographics, and engagement.
author: @namanwtf
version: 3.0.0
---

# Lead Scoring Skill

## Overview

The `lead-scoring` skill uses AI to automatically evaluate and rank leads based on their likelihood to convert. By analyzing behavioral signals (website activity, email engagement, content downloads), demographic data (company size, job title, industry), and engagement patterns, it helps sales and marketing teams focus on the highest-value prospects.

## When to Use

Use this skill when you need to:

-   **Qualify inbound leads:** Score website visitors and form submissions for sales readiness.
-   **Prioritize sales outreach:** Identify which leads to contact first based on conversion probability.
-   **Optimize lead nurturing:** Segment leads by score for targeted nurture campaigns.
-   **Build predictive models:** Create custom scoring models based on historical conversion data.
-   **Identify hot leads:** Detect leads showing high-intent behaviors in real-time.
-   **Improve marketing-sales alignment:** Establish shared lead quality definitions.
-   **Measure lead quality trends:** Track how lead quality changes over time and by source.

**Commands:**

-   `lead-scoring model create [model_name] --data "[historical_data_path]" --target [converted_flag]`: Creates a lead scoring model.
-   `lead-scoring score [lead_id] --model [model_name]`: Scores an individual lead.
-   `lead-scoring batch score --leads "[leads_data_path]" --model [model_name]`: Scores multiple leads.
-   `lead-scoring segment create [segment_name] --score_range "[min-max]" --label "[hot|warm|cold]"`: Creates lead segments.
-   `lead-scoring priority list --count [n] --model [model_name]`: Lists top-priority leads.
-   `lead-scoring model evaluate [model_name] --test_data "[test_data_path]"`: Evaluates model accuracy.
-   `lead-scoring alert setup --threshold [score] --action [notify_sales]`: Sets up hot lead alerts.

## Capabilities

-   **Behavioral Scoring:** Tracks website visits, page views, time on site, and content engagement.
-   **Demographic Scoring:** Evaluates job titles, company size, industry, and location fit.
-   **Engagement Scoring:** Measures email opens, clicks, webinar attendance, and form completions.
-   **Predictive Modeling:** Uses machine learning to identify patterns that predict conversion.
-   **Real-time Scoring:** Updates lead scores instantly as new behavioral data comes in.
-   **Custom Scoring Rules:** Allows business-specific scoring criteria and weightings.
-   **Segmentation:** Automatically categorizes leads into hot, warm, and cold segments.
-   **Sales Alerts:** Notifies sales teams when leads reach threshold scores.

## Usage Examples

### Scenario 1: Create a lead scoring model from historical data

```bash
lead-scoring model create "B2B_SaaS_Model" --data "data/historical_leads_2024_2025.csv" --target "converted_to_customer"
# Agent trains a model based on past lead behavior and outcomes
```

### Scenario 2: Score a new inbound lead

```bash
lead-scoring score LEAD_89234 --model "B2B_SaaS_Model"
# Agent returns: Score 78/100 (Hot Lead) with breakdown of scoring factors
```

### Scenario 3: Get priority list of leads for sales team

```bash
lead-scoring priority list --count 50 --model "B2B_SaaS_Model"
# Agent returns top 50 highest-scoring leads with contact info and recommended actions
```

### Scenario 4: Set up real-time hot lead alerts

```bash
lead-scoring alert setup --threshold 80 --action "notify_sales_team_slack"
# Agent configures alerts when any lead scores above 80
```

### Scenario 5: Segment leads for targeted campaigns

```bash
lead-scoring segment create hot_leads --score_range "75-100" --label "hot"
lead-scoring segment create warm_leads --score_range "50-74" --label "warm"
lead-scoring segment create nurture_leads --score_range "0-49" --label "cold"
```

## Configuration

Lead scoring requires historical data, feature definitions, and scoring rules.

-   **`models/*.pkl`, `*.json`:** Trained lead scoring models.
-   **`config/scoring_criteria.json`:** Default scoring weights for behaviors and attributes.
-   **`data/historical_leads/*.csv`:** Past lead data with conversion outcomes.
-   **`segments/*.json`:** Lead segment definitions and scoring thresholds.
-   **`alerts/*.json`:** Alert configuration for high-scoring leads.

## Related Skills

-   **`ai-chatbot-builder`**: To qualify and score leads through conversational interactions.
-   **`webinar-automation`**: To score leads based on webinar engagement.
-   **`email-sequence`**: To nurture leads based on their scores.
-   **`personalization-engine`**: To deliver personalized experiences to high-scoring leads.
-   **`predictive-analytics`**: For advanced forecasting of lead conversion likelihood.
