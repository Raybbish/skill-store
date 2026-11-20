---
name: predictive-analytics
description: Forecasts market trends, consumer demand, and campaign performance using historical data and machine learning.
author: @namanwtf
version: 3.0.0
---

# Predictive Analytics Skill

## Overview

The `predictive-analytics` skill leverages historical data and advanced machine learning models to forecast future trends, demand, and campaign outcomes. This empowers proactive decision-making in marketing, allowing for optimized resource allocation, early identification of opportunities or risks, and improved strategic planning.

## When to Use

Use this skill when you need to:

-   **Forecast market trends:** Anticipate changes in consumer behavior, industry shifts, or emerging product categories.
-   **Predict consumer demand:** Estimate future sales volume for products or services to optimize inventory and marketing spend.
-   **Forecast campaign performance:** Estimate the likely ROI, conversion rates, or reach of upcoming marketing campaigns.
-   **Identify potential churn:** Predict which customers are at risk of leaving so proactive retention strategies can be employed.
-   **Optimize pricing strategies:** Forecast the impact of different pricing models on sales and profitability.
-   **Allocate marketing budget:** Use predictive insights to determine the most effective channels and campaigns for investment.

**Commands:**

-   `predictive model train [model_name] --data "[historical_data_path]" --target "[target_variable]"`: Trains a new predictive model.
-   `predictive forecast [model_name] --period [time_frame] --new_data "[input_data_path]"`: Generates a forecast using a trained model.
-   `predictive evaluate [model_name] --test_data "[evaluation_data_path]"`: Evaluates the accuracy and performance of a model.
-   `predictive report [model_name] --type [brief|detail]`: Generates a report on model performance and forecast results.
-   `predictive deploy [model_name] --destination [dashboard|webhook]`: Deploys a model for continuous operation or integration.

## Capabilities

-   **Data Ingestion & Preprocessing:** Handles various data formats and prepares them for model training.
-   **Machine Learning Model Selection:** Supports a range of algorithms (e.g., ARIMA, Prophet, Regression, Time Series RNNs) for different forecasting needs.
-   **Feature Engineering:** Automatically or semi-automatically creates relevant features from raw data for improved model accuracy.
-   **Model Training & Validation:** Trains and validates models to ensure robustness and generalization.
-   **Forecast Generation:** Produces future predictions with confidence intervals.
-   **Performance Metrics:** Provides key metrics for model evaluation (e.g., RMSE, MAE, R-squared).
-   **Reporting & Visualization:** Generates clear, actionable reports and visualizations of forecasts.

## Usage Examples

### Scenario 1: Forecast next quarter's sales for a new product category

```bash
predictive model train new_product_sales --data "data/historical_sales_2023_2025.csv" --target "units_sold"
predictive forecast new_product_sales --period "3 months" --new_data "data/q1_2026_market_factors.json"
# Agent provides sales forecast for the next 3 months, with upper and lower bounds.
```

### Scenario 2: Predict the conversion rate for an upcoming email campaign

```bash
predictive model train email_conversion --data "data/past_email_campaigns.csv" --target "conversion_rate" --features "subject_line_sentiment,audience_size,offer_type"
predictive forecast email_conversion --period "1 campaign" --new_data "data/upcoming_campaign_details.json"
# Agent provides an estimated conversion rate range for the new campaign.
```

### Scenario 3: Identify customers at high risk of churn in the next 60 days

```bash
predictive model train customer_churn --data "data/customer_usage_history.csv" --target "churn_flag" --algorithm "logistic_regression"
predictive forecast customer_churn --period "60 days" --new_data "data/current_customer_activity.csv"
# Agent provides a list of customer IDs with their churn probability and recommends an action.
```

## Configuration

Successful use of this skill relies on well-prepared historical data and defining the target variables and relevant features.

-   **`data/*.csv`, `*.json`:** Historical datasets for training models. Must include the target variable and potential features.
-   **`models/*`:** Directory to store trained predictive models.
-   **`config/*.json`:** Configuration files for specific model parameters, feature engineering steps, or deployment settings.
    -   `target_variable`: The column in the dataset to predict.
    -   `features`: A list of columns to use as input for the model.
    -   `algorithm`: The specific machine learning algorithm to use (e.g., `Prophet`, `XGBoost`, `RandomForest`).

**Example `config/email_conversion_model.json`:**

```json
{
  "target_variable": "conversion_rate",
  "features": [
    "email_sent_count",
    "open_rate_prev",
    "click_rate_prev",
    "audience_segment",
    "day_of_week_sent"
  ],
  "algorithm": "RandomForestRegressor",
  "hyperparameters": {
    "n_estimators": 100,
    "max_depth": 10
  }
}
```

## Related Skills

-   **`personalization-engine`**: To use predictive insights to drive proactive personalized marketing actions.
-   **`lead-scoring`**: To improve lead qualification accuracy by incorporating predictive signals of buyer intent.
-   **`crisis-manager`**: To predict potential brand reputation issues based on social sentiment and historical data.
-   **`analytics-dashboard`**: To integrate predictive forecasts and reports into centralized marketing dashboards.
