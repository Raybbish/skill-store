# CLEAR Checklist

**CheckList for EvaluAtion of Radiomics research**
Version: CLEAR 2023
Source: https://doi.org/10.1186/s13244-023-01415-8
Reference: Kocak B, Baessler B, Bakas S, et al. CheckList for EvaluAtion of Radiomics research (CLEAR): a step-by-step reporting guideline for authors and reviewers endorsed by ESR and EuSoMII. Insights Imaging. 2023;14(1):75. doi:10.1186/s13244-023-01415-8

## Checklist Items (58 items)

### Domain 1: Study Design (Items 1-8)

| # | Item | Description |
|---|------|-------------|
| 1 | Study hypothesis | State the study hypothesis or objectives clearly. |
| 2 | Study design | Describe the study design (retrospective/prospective, single/multi-center, development/validation). |
| 3 | Inclusion criteria | Define the inclusion criteria for the study population. |
| 4 | Exclusion criteria | Define the exclusion criteria, including imaging quality-related exclusions. |
| 5 | Sample size | Report the total sample size and per-group sample sizes. Justify the sample size if a power analysis was performed. |
| 6 | Clinical and demographic data | Report relevant clinical and demographic characteristics of the study population. |
| 7 | Reference standard | Describe the reference standard (ground truth) used for labeling, including how and by whom it was determined. |
| 8 | Time frame | Report the time period of data collection and any relevant temporal information. |

### Domain 2: Imaging Data (Items 9-18)

| # | Item | Description |
|---|------|-------------|
| 9 | Imaging modality | Specify the imaging modality (CT, MRI, PET, ultrasound, etc.) and rationale for selection. |
| 10 | Scanner details | Report scanner manufacturer, model, and number of different scanners used. |
| 11 | Acquisition parameters | Report key acquisition parameters (e.g., slice thickness, pixel spacing, repetition time, echo time, field strength, reconstruction kernel). |
| 12 | Contrast agent | Report whether contrast agent was used, type, dose, and timing of acquisition relative to injection. |
| 13 | Image preprocessing | Describe all image preprocessing steps (resampling, normalization, filtering, N4 bias correction, etc.) and their order. |
| 14 | Image quality control | Describe any image quality assessment or exclusion criteria applied before feature extraction. |
| 15 | Multi-scanner harmonization | For multi-scanner data: describe any harmonization methods applied (e.g., ComBat, z-scoring) or state that none was used. |
| 16 | DICOM compliance | State whether the analysis was performed on DICOM-compliant images and report any format conversions. |
| 17 | Phantom or test-retest data | Report whether phantom or test-retest data were used to assess feature reproducibility. |
| 18 | Data augmentation | Describe any data augmentation techniques applied to imaging data and at which stage (before/after splitting). |

### Domain 3: Segmentation (Items 19-24)

| # | Item | Description |
|---|------|-------------|
| 19 | Segmentation method | Describe the segmentation method (manual, semi-automatic, fully automatic) and software used. |
| 20 | ROI definition | Define the region of interest (ROI) -- what was segmented, on which sequences/phases, 2D vs 3D. |
| 21 | Segmentator qualifications | Report the qualifications and experience of the person(s) performing segmentation. |
| 22 | Segmentation protocol | Describe the segmentation protocol, including any guidelines or training provided to segmentators. |
| 23 | Inter-reader agreement | Report inter-reader agreement for segmentation (e.g., Dice coefficient, ICC) if multiple readers were used. |
| 24 | Intra-reader agreement | Report intra-reader agreement for segmentation if assessed. |

### Domain 4: Feature Extraction and Processing (Items 25-34)

| # | Item | Description |
|---|------|-------------|
| 25 | Feature extraction software | Report the software name and version used for feature extraction. |
| 26 | Feature classes | List the feature classes extracted (e.g., first-order, shape, GLCM, GLRLM, GLSZM, GLDM, NGTDM). |
| 27 | Number of features | Report the total number of features extracted before any selection. |
| 28 | Extraction parameters | Report feature extraction parameters (e.g., bin width/count, distance for GLCM, voxel size for resampling). |
| 29 | IBSI compliance | State whether the feature extraction software is IBSI (Image Biomarker Standardisation Initiative) compliant. |
| 30 | Feature reproducibility | Report feature reproducibility assessment (e.g., ICC from test-retest or multi-reader segmentation). Describe how non-reproducible features were handled. |
| 31 | Feature standardization | Describe any feature standardization or normalization methods applied (e.g., z-score, min-max). |
| 32 | Collinearity handling | Describe methods used to address collinearity among features (e.g., correlation threshold, VIF). |
| 33 | Feature selection method | Describe the feature selection method(s) used (e.g., LASSO, mRMR, recursive feature elimination) and the rationale. |
| 34 | Number of selected features | Report the number of features selected for the final model. |

### Domain 5: Modeling (Items 35-44)

| # | Item | Description |
|---|------|-------------|
| 35 | Model type | Specify the type of model(s) used (e.g., logistic regression, random forest, SVM, neural network). |
| 36 | Training methodology | Describe the training methodology, including optimization algorithm, loss function, and stopping criteria. |
| 37 | Data splitting | Describe the data splitting strategy (training/validation/test), including method (random, temporal, institutional) and ratios. |
| 38 | Cross-validation | If cross-validation was used, specify the type (k-fold, leave-one-out, nested) and number of folds/repetitions. |
| 39 | Hyperparameter tuning | Describe the hyperparameter tuning approach and which hyperparameters were tuned. |
| 40 | Class imbalance | Report whether class imbalance existed and how it was handled (oversampling, undersampling, SMOTE, class weights, etc.). |
| 41 | Clinical feature integration | If clinical features were combined with radiomics features, describe the integration method. |
| 42 | Comparison models | Describe any comparison models (clinical-only, radiomics-only, combined) and how they were compared. |
| 43 | External validation | Report whether external validation was performed. If so, describe the external dataset source, size, and key differences from the development set. |
| 44 | Temporal validation | Report whether temporal (chronological) validation was performed and the time gap between development and validation cohorts. |

### Domain 6: Performance Assessment (Items 45-52)

| # | Item | Description |
|---|------|-------------|
| 45 | Discrimination metrics | Report discrimination metrics (e.g., AUC, sensitivity, specificity, accuracy) with confidence intervals. |
| 46 | Calibration | Report calibration assessment (calibration plot, Hosmer-Lemeshow test, calibration slope/intercept, Brier score). |
| 47 | Clinical utility | Report clinical utility assessment (e.g., decision curve analysis, net benefit, net reclassification improvement). |
| 48 | Statistical tests | Report statistical tests used for comparing models and their p-values. |
| 49 | Subgroup analysis | Report any subgroup analyses performed (e.g., by scanner, institution, patient subgroup). |
| 50 | Failure analysis | Report any analysis of cases where the model failed or performed poorly. |
| 51 | Reader comparison | If applicable, compare model performance with radiologist readers. |
| 52 | Multicollinearity in final model | Report assessment of multicollinearity in the final model (e.g., VIF values). |

### Domain 7: Open Science (Items 53-58)

| # | Item | Description |
|---|------|-------------|
| 53 | Code availability | State whether the analysis code is publicly available. If yes, provide the repository URL. |
| 54 | Data availability | State whether the data are publicly available. If restricted, explain why and how access can be requested. |
| 55 | Model availability | State whether the trained model is publicly available for external validation. |
| 56 | Radiomics feature values | State whether extracted feature values are shared (as supplementary material or in a repository). |
| 57 | Pre-registration | State whether the study was pre-registered (e.g., in a prospective register or protocol). |
| 58 | Reporting guideline adherence | State which reporting guideline(s) were followed (e.g., CLEAR, CLAIM, TRIPOD+AI). |

---

## Notes for Assessors

- CLEAR is specifically designed for radiomics studies. For deep learning studies without handcrafted radiomics features, CLAIM 2024 or TRIPOD+AI may be more appropriate.
- Items in Domain 3 (Segmentation) may not apply if the study uses atlas-based or fully automated segmentation without reader involvement.
- Items 17 (phantom data) and 57 (pre-registration) are aspirational best practices; their absence should be noted but may be scored as N/A if justified.
- Item 29 (IBSI compliance) is strongly recommended. Non-IBSI-compliant software should be flagged as a potential limitation.
- For studies combining radiomics with deep learning features, assess both CLEAR (for radiomics components) and CLAIM/TRIPOD+AI (for deep learning components).
- Domain 7 (Open Science) items are increasingly required by journals. Missing items here are more likely to trigger reviewer comments in high-impact journals.
- CLEAR was endorsed by the European Society of Radiology (ESR) and the European Society of Medical Imaging Informatics (EuSoMII).
