# PROBAST Assessment Guide

Prediction model Risk Of Bias ASsessment Tool.
Reference: Wolff RF et al. Ann Intern Med 2019;170(1):51-58. PMID: 30596875.
AI extension: PROBAST+AI (BMJ 2024).

## Structure

PROBAST assesses 4 domains, each for Risk of Bias AND Applicability.
- **Signalling questions**: Yes / Probably yes / No / Probably no / No information
- **Domain judgment**: Low / High / Unclear
- **Overall judgment**: High if any domain is high; Low only if all domains are low

## Domain 1: Participants

### Signalling Questions (Risk of Bias)
1. Were appropriate data sources used (e.g., cohort, RCT, nested case-control)?
2. Were all inclusions and exclusions of participants appropriate?

### Applicability
- Do the participants and setting match the review question?

## Domain 2: Predictors

### Signalling Questions (Risk of Bias)
1. Were predictors defined and assessed in a similar way for all participants?
2. Were predictor assessments made without knowledge of outcome data?
3. Are all predictors available at the time the model is intended to be used?

### Applicability
- Do the predictors, their assessment, and timing match the review question?

## Domain 3: Outcome

### Signalling Questions (Risk of Bias)
1. Was the outcome determined appropriately?
2. Was a pre-specified or standard outcome definition used?
3. Were predictors excluded from the outcome definition?
4. Was the outcome defined and determined in a similar way for all participants?
5. Was the outcome determined without knowledge of predictor information?
6. Was the time interval between predictor assessment and outcome appropriate?

### Applicability
- Does the outcome and its definition/timing match the review question?

## Domain 4: Analysis

### Signalling Questions (Risk of Bias)
1. Were there a reasonable number of participants with the outcome?
2. Were continuous and categorical predictors handled appropriately?
3. Were all enrolled participants included in the analysis?
4. Were participants with missing data handled appropriately?
5. Was selection of predictors based on univariable analysis avoided?
6. Were complexities in the data accounted for appropriately?
7. Were relevant model performance measures evaluated appropriately?
8. Were model overfitting and optimism in model performance accounted for?
9. Do predictors and their assigned weights in the final model correspond to the reported multivariable analysis?

### For Validation Studies (additional)
- Were the model and its performance evaluated appropriately?

## PROBAST+AI Extensions (2024)

For AI/ML prediction models, additional considerations:
- **Data**: Training/validation/test split, data leakage check
- **Model**: Architecture transparency, hyperparameter tuning method
- **Performance**: Discrimination (AUC), calibration, fairness across subgroups
- **Reproducibility**: Code/data availability, external validation

## When to Use

- Diagnostic prediction models (e.g., AI classifiers for imaging findings)
- Prognostic prediction models (e.g., risk scores, survival prediction)
- Both development AND validation studies
- Use PROBAST+AI when the model involves machine learning or deep learning
