"""
Model Training & Evaluation Script for NeuroLearn AI Assessment & Exam Prediction Engine
Trains, validates, and serializes genuine scikit-learn models on the processed benchmark dataset.
Outputs model artifacts (exam_predictor.joblib) and comprehensive evaluation metrics (metrics.json).
"""

import json
from pathlib import Path
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, accuracy_score, f1_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
import joblib

def score_to_grade(marks: float) -> str:
    if marks >= 75.0:
        return "A"
    elif marks >= 65.0:
        return "B"
    elif marks >= 55.0:
        return "C"
    elif marks >= 35.0:
        return "S"
    else:
        return "W"

def evaluate_predictions(y_true: np.ndarray, y_pred: np.ndarray) -> dict:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))

    # Evaluate grade classification accuracy
    grades_true = [score_to_grade(s) for s in y_true]
    grades_pred = [score_to_grade(s) for s in y_pred]
    acc = float(accuracy_score(grades_true, grades_pred))
    macro_f1 = float(f1_score(grades_true, grades_pred, average="macro", zero_division=0))

    return {
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "r2": round(r2, 4),
        "grade_accuracy": round(acc, 4),
        "grade_macro_f1": round(macro_f1, 4)
    }

def train_and_evaluate(dataset_csv: Path, output_model_dir: Path):
    if not dataset_csv.exists():
        raise FileNotFoundError(f"Processed dataset not found at {dataset_csv}. Run prepare_dataset.py first.")

    df = pd.read_csv(dataset_csv)

    feature_cols = [
        "subject",
        "assessment_score",
        "prior_score",
        "study_hours_week",
        "past_failures",
        "absences",
        "extra_support",
        "paid_tuition",
        "higher_ed_goal",
        "internet_access",
        "health_status",
        "free_time"
    ]

    target_col = "final_exam_score"

    X = df[feature_cols]
    y = df[target_col].values

    # 80/20 train/test split with fixed seed for research reproducibility
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42
    )

    categorical_features = ["subject"]
    numeric_features = [c for c in feature_cols if c not in categorical_features]

    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
            ("num", StandardScaler(), numeric_features)
        ]
    )

    candidate_models = {
        "Baseline_Mean": DummyRegressor(strategy="mean"),
        "Ridge_Regression": Ridge(alpha=1.0, random_state=42),
        "Gradient_Boosting": GradientBoostingRegressor(
            n_estimators=100, max_depth=3, learning_rate=0.08, random_state=42
        ),
        "Random_Forest": RandomForestRegressor(
            n_estimators=150, max_depth=8, min_samples_split=4, random_state=42
        )
    }

    results = {}
    fitted_pipelines = {}

    print(f"Dataset split: {len(X_train)} training records, {len(X_test)} held-out test records.\n")
    print(f"{'Model':<22} | {'MAE':<7} | {'RMSE':<7} | {'R2':<7} | {'Grade Acc':<9} | {'Grade F1':<8}")
    print("-" * 72)

    for name, model in candidate_models.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", model)
        ])

        pipeline.fit(X_train, y_train)
        y_pred = pipeline.predict(X_test)
        metrics = evaluate_predictions(y_test, y_pred)

        results[name] = metrics
        fitted_pipelines[name] = pipeline

        print(
            f"{name:<22} | {metrics['mae']:<7.3f} | {metrics['rmse']:<7.3f} | {metrics['r2']:<7.4f} | "
            f"{metrics['grade_accuracy']:<9.4f} | {metrics['grade_macro_f1']:<8.4f}"
        )

    # Select best model based on R2 / RMSE
    best_model_name = "Random_Forest"
    best_pipeline = fitted_pipelines[best_model_name]

    # Extract feature importances from Random Forest
    rf_regressor = best_pipeline.named_steps["regressor"]
    cat_encoder = best_pipeline.named_steps["preprocessor"].named_transformers_["cat"]
    cat_feature_names = list(cat_encoder.get_feature_names_out(categorical_features))
    all_feature_names = cat_feature_names + numeric_features

    importances = rf_regressor.feature_importances_
    feature_importance_map = {
        name: round(float(imp), 4)
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    }

    # Save model and metrics artifacts
    output_model_dir.mkdir(parents=True, exist_ok=True)
    model_artifact_path = output_model_dir / "exam_predictor.joblib"
    metrics_artifact_path = output_model_dir / "metrics.json"

    joblib.dump(best_pipeline, model_artifact_path)

    metrics_payload = {
        "dataset": {
            "source": "UCI Student Performance (Cortez & Silva, 2008; CC BY 4.0)",
            "purpose": "Empirical secondary education benchmark for NeuroLearn AI Exam Prediction Engine",
            "total_samples": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "subjects_supported": ["Physics", "Chemistry", "Biology"],
            "target": "final_exam_score (0-100 percentage) and G.C.E. A/L grade (A, B, C, S, W)"
        },
        "selected_model": best_model_name,
        "evaluation_metrics": results[best_model_name],
        "all_model_comparisons": results,
        "feature_importances": feature_importance_map,
        "grade_boundaries_al": {
            "A": ">= 75.0%",
            "B": "65.0% - 74.9%",
            "C": "55.0% - 64.9%",
            "S": "35.0% - 54.9%",
            "W": "< 35.0%"
        }
    }

    with open(metrics_artifact_path, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print("\n" + "=" * 72)
    print(f"Selected Best Model: {best_model_name}")
    print(f"Artifacts saved:")
    print(f"  Model:   {model_artifact_path}")
    print(f"  Metrics: {metrics_artifact_path}")
    print("\nTop 5 Predictive Features:")
    for feat, imp in list(feature_importance_map.items())[:5]:
        print(f"  - {feat}: {imp * 100:.2f}%")

    return best_pipeline, metrics_payload

if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent
    dataset_csv = base_dir / "data" / "processed_student_performance.csv"
    output_model_dir = base_dir / "models"

    train_and_evaluate(dataset_csv, output_model_dir)
