---
name: ai-chatbot-builder
description: Build, configure, and manage conversational AI chatbots for marketing, customer support, and lead generation.
author: @namanwtf
version: 3.0.0
---

# AI Chatbot Builder Skill

## Overview

The `ai-chatbot-builder` skill empowers you to create and manage advanced conversational AI chatbots for a variety of marketing and sales use cases. From automating customer inquiries to qualifying leads and delivering personalized content, this skill streamlines the deployment and optimization of AI-powered chat experiences.

## When to Use

Use this skill when you need to:

-   **Create a new chatbot:** Define its purpose, personality, and initial knowledge base.
-   **Configure chatbot flows:** Design conversational paths, intent recognition, and response logic.
-   **Integrate chatbots:** Connect with websites, messaging platforms (e.g., WhatsApp, Messenger), or CRM systems.
-   **Deploy a chatbot:** Launch the chatbot to a live environment.
-   **Monitor chatbot performance:** Track interactions, identify pain points, and gather insights.
-   **Update chatbot knowledge:** Add new FAQs, product information, or conversational scripts.
-   **Personalize chatbot responses:** Tailor interactions based on user data or context.

**Commands:**

-   `chatbot create [name] --purpose "[purpose]"`: Initializes a new chatbot project.
-   `chatbot configure [name] --flow "[flow_definition_path]"`: Configures the conversational flow using a JSON/YAML definition file.
-   `chatbot integrate [name] --platform [platform_name] --api-key [key]`: Integrates the chatbot with a specific platform.
-   `chatbot deploy [name] [--environment dev|staging|prod]`: Deploys the chatbot.
-   `chatbot update-knowledge [name] --data "[knowledge_file_path]"`: Updates the chatbot's knowledge base.
-   `chatbot monitor [name] --duration [time]` : Starts monitoring or fetches a report for a specific duration.

## Capabilities

-   **Natural Language Understanding (NLU):** Advanced intent recognition and entity extraction to understand user queries.
-   **Dialogue Management:** Stateful conversation management to maintain context across interactions.
-   **Integration Adapters:** Connectors for popular platforms (web, social media, CRM).
-   **Knowledge Base Management:** Tools to easily add, update, and retrieve information for chatbot responses.
-   **Performance Analytics:** Built-in reporting for conversation volume, user satisfaction, and goal completion.
-   **Personalization Engine:** Logic to dynamically adapt responses based on user history or profile (can interoperate with `personalization-engine` skill).

## Usage Examples

### Scenario 1: Create and deploy a FAQ chatbot for a new product launch

```bash
chatbot create product_launch_faq --purpose "Answer common questions about the new XYZ phone"
chatbot configure product_launch_faq --flow "references/xyz_faq_flow.json"
chatbot update-knowledge product_launch_faq --data "data/xyz_product_info.csv"
chatbot deploy product_launch_faq --environment prod
```

### Scenario 2: Integrate a lead generation chatbot on the company website

```bash
chatbot create lead_qualifier --purpose "Qualify website visitors and collect contact information" --personality "professional and helpful"
chatbot configure lead_qualifier --flow "references/lead_qualifier_flow.yaml"
chatbot integrate lead_qualifier --platform website --api-key "WEB_HOOK_SECRET_123"
chatbot deploy lead_qualifier --environment staging
```

### Scenario 3: Monitor chatbot performance and retrieve a report

```bash
chatbot monitor customer_support_bot --duration "24h"
# Agent provides a summary report of interactions, common unhandled queries, and user feedback
```

### Scenario 4: Update product information for an existing chatbot

```bash
chatbot update-knowledge existing_product_bot --data "data/new_product_features_q32026.json"
```

## Configuration

The skill relies on configuration files for specific chatbot definitions, flows, and integration details.

-   **`flows/*.json` or `*.yaml`:** Define conversational logic, intent mapping, and response templates.
-   **`knowledge/*.csv`, `*.json`, `*.xml`:** Structured data for the chatbot's knowledge base.
-   **API Keys:** Required for platform integrations (e.g., website embedding, WhatsApp API, CRM sync). These should be stored securely in OpenClaw's credential manager or environment variables, not directly in skill files.

**Example `flow.json` structure:**

```json
{
  "intents": [
    {
      "name": "greeting",
      "patterns": ["hi", "hello", "hey there"],
      "responses": ["Hello! How can I help you today?", "Hi, what can I do for you?"]
    },
    {
      "name": "product_inquiry",
      "patterns": ["tell me about {product}", "what is {product}"],
      "entities": ["product"],
      "responses": ["Sure, {product} is a fantastic device known for...", "You're asking about {product}? It features..."]
    }
  ],
  "dialog_states": {
    "initial": "greeting",
    "product_inquiry_followup": {
      "prompt": "Is there anything else you'd like to know about this product?",
      "options": ["features", "price", "availability"]
    }
  }
}
```

## Related Skills

-   **`personalization-engine`**: For advanced dynamic content delivery and tailored chatbot interactions.
-   **`lead-scoring`**: To automatically qualify leads collected by the chatbot based on defined criteria.
-   **`webinar-automation`**: To direct chatbot users to relevant webinars or marketing events.
-   **`localization-automation`**: For deploying chatbots in multiple languages and regions.
