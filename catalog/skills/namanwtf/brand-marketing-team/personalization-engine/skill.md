---
name: personalization-engine
description: Dynamically personalizes content, product recommendations, and marketing messages based on user behavior and preferences.
author: @namanwtf
version: 3.0.0
---

# Personalization Engine Skill

## Overview

The `personalization-engine` skill delivers a powerful capability to tailor marketing efforts at an individual level. It analyzes user data (behavior, demographics, purchase history, real-time interactions) to dynamically adapt website content, email campaigns, product suggestions, and advertising, ensuring maximum relevance and engagement.

## When to Use

Use this skill when you need to:

-   **Dynamically personalize website content:** Show different hero images, calls-to-action, or text based on visitor segments.
-   **Tailor product recommendations:** Suggest relevant products or services to customers based on their browsing or purchase history.
-   **Customize email campaigns:** Adapt email subject lines, content blocks, and offers for individual subscribers.
-   **Optimize ad targeting:** Refine audience segmentation for more effective ad delivery across platforms.
-   **Enhance chatbot interactions:** Provide contextually relevant responses and offers through conversational agents (can interoperate with `ai-chatbot-builder` skill).
-   **Improve user journey mapping:** Design personalized paths through your digital properties.

**Commands:**

-   `personalize segment create [segment_name] --rules "[json_rule_definition_path]"`: Defines a new audience segment.
-   `personalize campaign setup [campaign_name] --strategy "[strategy_definition_path]" --channels [web,email,ads]`: Configures a personalized campaign.
-   `personalize deploy [campaign_name] --environment [dev|prod]`: Rolls out a personalized campaign.
-   `personalize monitor [campaign_name] --metric [conversion_rate|engagement|roi]`: Monitors the performance of a personalized campaign.
-   `personalize content variant create [variant_id] --target [segment_name] --type [web_element|email_block] --content "[content_path]"`: Creates a content variant for a specific segment.
-   `personalize recommendation generate --user_id [id] --context "[context_data]"`: Generates personalized recommendations for a user.

## Capabilities

-   **Real-time Data Ingestion:** Gathers and processes user data from various sources (CRM, website, app, CDP).
-   **Advanced Segmentation:** Creates granular audience segments based on explicit and implicit signals.
-   **Content Variation Management:** Manages multiple versions of content elements for different segments.
-   **Recommendation Engine:** Utilizes machine learning algorithms (collaborative filtering, content-based) to suggest relevant items.
-   **A/B/n Testing Integration:** Allows for testing different personalization strategies and content variants.
-   **Cross-Channel Orchestration:** Coordinates personalized experiences across web, email, mobile, and advertising.
-   **Performance Tracking:** Provides detailed analytics on the impact of personalization initiatives.

## Usage Examples

### Scenario 1: Personalize website hero banner for first-time visitors vs. returning customers

```bash
personalize segment create first_time_visitors --rules "rules/first_time_visitor.json"
personalize segment create returning_customers --rules "rules/returning_customer.json"
personalize content variant create BNR001_FTV --target first_time_visitors --type web_element --content "content/hero_banner_offer.html"
personalize content variant create BNR001_RC --target returning_customers --type web_element --content "content/hero_banner_loyalty.html"
personalize deploy homepage_banner_campaign --environment prod
```

### Scenario 2: Generate personalized product recommendations for an e-commerce user

```bash
personalize recommendation generate --user_id 12345 --context "browsed_category:electronics, last_purchase:smartphone"
# Agent returns a list of recommended products and their associated reasons
```

### Scenario 3: Setup an email personalization campaign for cart abandoners

```bash
personalize segment create cart_abandoners --rules "rules/cart_abandoner_logic.json"
personalize campaign setup abandoned_cart_email --strategy "strategies/abandoned_cart.json" --channels email
personalize deploy abandoned_cart_email --environment prod
```

## Configuration

This skill requires defining user segments, content variants, and personalization strategies.

-   **`rules/*.json`:** JSON files defining the logic for audience segmentation (e.g., `{"event": "page_view", "path": "/pricing", "last_visit": "< 24h"}`).
-   **`strategies/*.json`:** JSON files outlining how personalization should be applied (e.g., `{"action": "show_content", "element_id": "hero-banner", "variant_id_map": {"segment_a": "content_a", "segment_b": "content_b"}}`).
-   **`content/*`:** HTML snippets, text blocks, image URLs, or product IDs for content variants.
-   **Data Connectors:** Configuration for integrating with a Customer Data Platform (CDP), CRM, or analytics tools to feed user data.

**Example `rules/first_time_visitor.json` structure:**

```json
{
  "logic": "AND",
  "conditions": [
    {"type": "cookie", "name": "__fvc", "operator": "does_not_exist"},
    {"type": "session", "name": "session_count", "operator": "equals", "value": 1}
  ]
}
```

**Example `strategies/abandoned_cart.json` structure:**

```json
{
  "trigger": {
    "event": "cart_abandoned",
    "delay_minutes": 30
  },
  "action": {
    "type": "send_email_template",
    "template_id": "abandoned_cart_v1",
    "personalization_fields": [
      {"source": "user_data", "field": "first_name", "target": "subject_line"},
      {"source": "cart_data", "field": "product_list", "target": "email_body"}
    ]
  }
}
```

## Related Skills

-   **`ai-chatbot-builder`**: To provide personalized conversational experiences.
-   **`predictive-analytics`**: To leverage forecasted trends for proactive personalization strategies.
-   **`lead-scoring`**: To personalize offers or content for high-value leads.
-   **`localization-automation`**: To ensure personalized content is delivered in the correct language and cultural context.
