# NeuroLearn AI: Adaptive Assessment, Exam Prediction & Exam Readiness Engine
**Individual Research Component:** Adaptive Assessment, G.C.E. A/L Exam Prediction, and Exam Readiness Engine
**Target Group:** Sri Lankan G.C.E. Advanced Level (A/L) Science Students (Physics, Chemistry, Biology)
**Milestone:** IT4010 Research Progress Presentation 1 (20% Research Progress)
**Author / Researcher:** individual research component within NeuroLearn AI

---

## 1. Executive Summary: Existing vs. Implemented Architecture

| Component | Status Prior to Milestone | Current State (Progress Presentation 1 Deliverable) |
| :--- | :--- | :--- |
| **Machine Learning Model** | No trained ML model existed (only a toy 3-line inline JavaScript formula). | **Genuine trained `scikit-learn` pipeline (`RandomForestRegressor`)** trained on 1,044 student records; serialized as `models/exam_predictor.joblib` and `models/model.joblib`. |
| **Model Evaluation & Metrics** | No evaluation artifacts or splits existed. | **Strict 80/20 train/test evaluation split** with saved `models/metrics.json` (MAE: 4.82, RMSE: 8.57, $R^2$: 0.81, Grade Accuracy: 70.81%). |
| **Empirical Dataset** | No dataset files in the repository. | **UCI Student Performance Benchmark Dataset** (Cortez & Silva, 2008; CC BY 4.0) downloaded and standardized into `data/processed_student_performance.csv`. |
| **Exam Readiness Indicator** | Conflated with prediction heuristics. | **Explainable, rule-based pedagogical readiness indicator** (High / Moderate / Needs Reinforcement) evaluating syllabus topic coverage and high-difficulty problem mastery distinctly from ML. |
| **Assessment Consent Flow** | Blocked on consent screen; clicking button did not launch questions. | **Fixed consent transition**: clicking "Record consent and continue" automatically confirms research consent, initializes session, and transitions directly to Question 1. |
| **Subject Coverage** | 4 questions per subject with placeholder difficulty. | **Full support for Physics, Chemistry, and Biology** with verified topics, difficulty adaptation (2, 3, 4), and subject coverage documentation. |
| **Backend & CLI Integration** | Unconnected toy endpoints. | `POST /api/prediction/predict` and `GET /api/prediction/grade/:studentId` connected to trained model; runnable CLI script `scripts/predict.py --demo`. |

---

## 2. Research Integrity & Dataset Scope Disclaimer

> [!IMPORTANT]
> **Scientific Integrity & Empirical Dataset Boundary:**
> The trained machine learning model in this prototype uses the **UCI Student Performance Benchmark Dataset** (*Cortez & Silva, 2008*; CC BY 4.0, $N = 1,044$) as an empirical secondary-school academic performance proxy.
> We **do not** claim this benchmark dataset is an institutional Sri Lankan Department of Examinations microdata repository. Real question-level G.C.E. A/L student response records are protected institutional data; securing institutional data access and large-scale A/L cohort response logs represents the empirical data-collection objective for Milestones 2 and 3.
> The current model demonstrates authentic, end-to-end ML feature engineering, model training, cross-validation, and inference pipelines.

---

## 3. Subject Coverage Table (Sri Lankan G.C.E. A/L Science Stream)

| Subject | G.C.E. A/L Syllabus Units Covered | Available Questions | Difficulty Levels | Adaptive Mechanism | Baseline ML Evaluation |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **Physics** | Mechanics (Newton's Laws), Waves & Optics, Thermal Physics, Fields | 4 | Easy (2), Medium (3), Hard (4) | Target difficulty shifts up (+1) on correct, down (-1) on incorrect; topic penalties prevent duplicate topic clustering | Benchmarked ($N = 348$ partition), predicts final marks (0–100%) and A/L grade (A, B, C, S, W) |
| **Chemistry** | Atomic Structure, Chemical Bonding, Physical Chemistry (Equilibrium), Organic Chemistry | 4 | Easy (2), Medium (3), Hard (4) | Target difficulty shifts up (+1) on correct, down (-1) on incorrect; topic penalties prevent duplicate topic clustering | Benchmarked ($N = 348$ partition), predicts final marks (0–100%) and A/L grade (A, B, C, S, W) |
| **Biology** | Cell Biology, Plant Form & Function, Animal Physiology, Genetics & Molecular Biology | 4 | Easy (2), Medium (3), Hard (4) | Target difficulty shifts up (+1) on correct, down (-1) on incorrect; topic penalties prevent duplicate topic clustering | Benchmarked ($N = 348$ partition), predicts final marks (0–100%) and A/L grade (A, B, C, S, W) |

---

## 4. Machine Learning Model Architecture & Performance

### 4.1 Feature Formulation
- **`assessment_score`** (0–100%): Performance accuracy on the adaptive assessment or recent mock exam.
- **`prior_score`** (0–100%): Baseline diagnostic score.
- **`study_hours_week`** (numeric): Dedicated weekly self-study hours.
- **`past_failures`** (0–3): Historical failed modules or subtopics.
- **`absences`** (numeric): Attendance / missed study sessions.
- **`extra_support`**, **`paid_tuition`**, **`higher_ed_goal`**, **`internet_access`**: Socio-academic indicators.
- **`subject`**: Categorical indicator (Physics, Chemistry, Biology) one-hot encoded via `ColumnTransformer`.

### 4.2 Benchmark Model Comparison (Held-out 20% Test Split, $N_{test} = 209$)

| Model Candidate | MAE | RMSE | $R^2$ Score | Grade Accuracy | Grade Macro F1 | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Baseline Mean Regressor** | 14.694 | 19.740 | -0.0082 | 22.49% | 0.0734 | Empirical baseline |
| **Ridge Regression** ($\alpha=1.0$) | 4.799 | 8.635 | 0.8071 | 68.90% | 0.6622 | Linear benchmark |
| **Gradient Boosting Regressor** | 4.643 | 7.975 | 0.8355 | 67.94% | 0.6409 | Ensemble candidate |
| **Random Forest Regressor** (Selected) | **4.819** | **8.574** | **0.8098** | **70.81%** | **0.6680** | **Primary Serialized Model** |

### 4.3 Feature Importance (Random Forest Explainability)
1. **`assessment_score`**: **85.27%** – Primary academic mastery signal.
2. **`absences`**: **6.47%** – Study consistency and session attendance.
3. **`study_hours_week`**: **1.63%** – Weekly preparation volume.
4. **`prior_score`**: **1.63%** – Diagnostic baseline.
5. **`free_time` & `health`**: **2.08%** – Lifestyle balance factors.

### 4.4 Sri Lankan G.C.E. A/L Grade Classification Thresholds
- **Grade A (Distinction):** $\ge 75.0\%$
- **Grade B (Very Good Pass):** $65.0\% - 74.9\%$
- **Grade C (Credit Pass):** $55.0\% - 64.9\%$
- **Grade S (Ordinary Pass):** $35.0\% - 54.9\%$
- **Grade W (Failure):** $< 35.0\%$

---

## 5. Explainable Rule-Based Exam-Readiness Indicator

Distinct from the statistical ML regression model, the **Exam Readiness Indicator** applies a pedagogical rubric:

$$\text{Readiness Score} = (0.40 \times \text{Assessment Score}) + (0.30 \times \text{Topic Coverage \%}) + (0.20 \times \text{Hard Difficulty Accuracy}) + (0.10 \times \text{Study Consistency})$$

- **High Readiness (GREEN):** Score $\ge 70.0$ and topic coverage $\ge 60\%$. Summary: Solid syllabus mastery with strong topic coverage.
- **Moderate Readiness (AMBER):** Score $45.0 - 69.9$. Summary: Consistent foundation, but requires reinforcement on challenging topics.
- **Needs Reinforcement (RED):** Score $< 45.0$. Summary: Immediate revision and topic coverage needed before final examination.

---

## 6. Artifact Inventory

- `ai-services/assessment-engine/data/student_performance/`: Raw benchmark CSV datasets (`student-mat.csv`, `student-por.csv`).
- `ai-services/assessment-engine/data/processed_student_performance.csv`: Processed 1,044-row dataset.
- `ai-services/assessment-engine/models/exam_predictor.joblib`: Serialized `scikit-learn` pipeline (`ColumnTransformer` + `RandomForestRegressor`).
- `ai-services/assessment-engine/models/metrics.json`: Full metrics report, hyperparameters, and feature importances.
- `ai-services/assessment-engine/scripts/prepare_dataset.py`: Data ingestion and cleaning pipeline.
- `ai-services/assessment-engine/scripts/train_model.py`: Model training, comparison, and evaluation script.
- `ai-services/assessment-engine/scripts/predict.py`: CLI inference and interactive demonstration script.
- `ai-services/assessment-engine/app/main.py`: FastAPI microservice exposing `/health`, `/api/metrics`, and `POST /api/predict`.

---

## 7. Runnable Commands for Progress Presentation 1 (Windows PowerShell)

Use these exact commands in PowerShell to demonstrate genuine execution live:

### 1. Run Interactive CLI Demonstration across Physics, Chemistry & Biology
```powershell
C:\Users\MCS\.python311\python.exe ai-services/assessment-engine/scripts/predict.py --demo
```

### 2. Predict for a Specific Custom Student Profile
```powershell
C:\Users\MCS\.python311\python.exe ai-services/assessment-engine/scripts/predict.py --subject Physics --score 82.5 --study_hours 8 --absences 1
```

### 3. Retrain and Evaluate All Candidate Models Live
```powershell
C:\Users\MCS\.python311\python.exe ai-services/assessment-engine/scripts/train_model.py
```

### 4. Execute Backend Automated Test Suite (13 passing tests)
```powershell
cd backend
npm test
```

### 5. Launch FastAPI Service
```powershell
C:\Users\MCS\.python311\python.exe -m uvicorn app.main:app --app-dir ai-services/assessment-engine --port 8000
```
