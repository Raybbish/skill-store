---
name: crisis-manager
description: Monitors brand reputation, detects potential crises, and coordinates rapid response to protect brand image.
author: @namanwtf
version: 3.0.0
---

# Crisis Manager Skill

## Overview

The `crisis-manager` skill provides comprehensive brand reputation protection through proactive monitoring, early warning systems, and coordinated response protocols. It tracks brand mentions across social media, news, review sites, and forums—detecting negative sentiment spikes, emerging issues, and potential crises before they escalate.

## When to Use

Use this skill when you need to:

-   **Monitor brand reputation:** Track mentions, sentiment, and conversations about your brand across channels.
-   **Detect emerging crises:** Identify negative trends, viral complaints, or reputation threats early.
-   **Coordinate crisis response:** Execute pre-planned response protocols with clear roles and messaging.
-   **Manage negative reviews:** Systematically address and mitigate negative customer feedback.
-   **Track competitor crises:** Learn from competitor missteps and benchmark your own response.
-   **Generate crisis reports:** Document incidents, responses, and outcomes for analysis.
-   **Prepare crisis playbooks:** Create response plans for various crisis scenarios.

**Commands:**

-   `crisis monitor [brand_name] --channels "[social,news,forums,reviews]" --alert_threshold [sentiment_score]`: Sets up brand monitoring.
-   `crisis detect [brand_name] --period [timeframe]`: Analyzes for potential crisis signals.
-   `crisis alert check [brand_name]`: Checks for active crisis alerts requiring attention.
-   `crisis respond [alert_id] --severity [low|medium|high|critical]`: Initiates crisis response protocol.
-   `crisis playbook create [scenario] --triggers "[trigger_conditions]"`: Creates crisis response playbooks.
-   `crisis report generate [incident_id] --include [timeline,response,outcome]`: Generates post-crisis analysis.
-   `crisis sentiment track [brand_name] --compare "[competitor_names]"`: Tracks brand sentiment vs competitors.

## Capabilities

-   **Real-time Monitoring:** Tracks brand mentions across social media, news, forums, and review sites.
-   **Sentiment Analysis:** Detects negative sentiment trends and viral complaint patterns.
-   **Early Warning System:** Alerts on unusual spikes in negative mentions or engagement.
-   **Crisis Classification:** Categorizes threats by type (product, service, PR, employee, etc.) and severity.
-   **Response Automation:** Executes pre-approved response workflows and escalations.
-   **Stakeholder Notification:** Alerts relevant team members via email, Slack, or other channels.
-   **Response Templates:** Provides crisis-specific messaging templates.
-   **Post-crisis Analysis:** Documents incidents and analyzes response effectiveness.

## Usage Examples

### Scenario 1: Set up comprehensive brand monitoring

```bash
crisis monitor "Brand Name" --channels "twitter,facebook,instagram,reddit,news,youtube" --alert_threshold 0.3
# Agent sets up monitoring and will alert when sentiment drops below threshold
```

### Scenario 2: Check for active crisis alerts

```bash
crisis alert check "Brand Name"
# Agent reports any active alerts requiring attention with severity levels
```

### Scenario 3: Respond to a detected crisis

```bash
crisis respond ALERT_001 --severity high
# Agent initiates response protocol: notifies stakeholders, suggests messaging, tracks resolution
```

### Scenario 4: Create a crisis response playbook

```bash
crisis playbook create "product_defect_reports" --triggers "negative_mentions>100/hour,sentiment<-0.5,viral_video_detected"
# Agent creates a response playbook with defined escalation paths and messaging
```

### Scenario 5: Generate post-crisis analysis report

```bash
crisis report generate INCIDENT_042 --include "timeline,response,outcome,lessons_learned"
# Agent creates comprehensive report for stakeholder review and future preparation
```

## Configuration

Crisis management requires monitoring settings, alert thresholds, and response protocols.

-   **`config/monitoring_sources.json`:** List of channels and keywords to monitor.
-   **`config/alert_thresholds.json`:** Sentiment and volume thresholds for different alert levels.
-   **`playbooks/*.json`:** Pre-defined response protocols for various crisis types.
-   **`contacts/escalation_list.json`:** Stakeholder contact information for crisis notifications.
-   **`templates/responses/*.md`:** Pre-approved response message templates.

## Related Skills

-   **`community-manager`**: For day-to-day social engagement and community building.
-   **`pr-distributor`**: For proactive PR and media relationship management.
-   **`analytics-dashboard`**: For comprehensive brand health monitoring.
-   **`competitive-intel`**: To benchmark reputation against competitors.
