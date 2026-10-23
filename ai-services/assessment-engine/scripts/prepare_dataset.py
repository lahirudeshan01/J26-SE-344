"""
Dataset Preparation Script for NeuroLearn AI Assessment & Exam Prediction Engine
Processes the UCI Student Performance benchmark dataset (Cortez & Silva, 2008)
into a standardized tabular format for G.C.E. A/L exam score and grade prediction.
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np

# Map numeric percentage to Sri Lankan G.C.E. A/L grade boundaries
def marks_to_al_grade(marks: float) -> str:
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

def prepare_dataset(data_dir: Path, output_path: Path) -> pd.DataFrame:
    mat_file = data_dir / "student-mat.csv"
    por_file = data_dir / "student-por.csv"

    if not mat_file.exists() or not por_file.exists():
        raise FileNotFoundError(f"Dataset files missing in {data_dir}. Checked for student-mat.csv and student-por.csv.")

    df_mat = pd.read_csv(mat_file, sep=";")
    df_mat["original_course"] = "Mathematics"

    df_por = pd.read_csv(por_file, sep=";")
    df_por["original_course"] = "Portuguese"

    combined = pd.concat([df_mat, df_por], ignore_index=True)

    # Weekly study time mapping (hours/week approximation from UCI categories)
    studytime_map = {1: 1.5, 2: 3.5, 3: 7.5, 4: 12.0}

    # Synthesize subject labels across the 3 target GCE A/L science subjects
    # using a deterministic round-robin assignment preserving distribution
    subjects = ["Physics", "Chemistry", "Biology"]
    combined["subject"] = [subjects[i % len(subjects)] for i in range(len(combined))]

    processed = pd.DataFrame({
        "subject": combined["subject"],
        "assessment_score": combined["G2"] * 5.0,  # Recent mock/adaptive assessment score (0-100)
        "prior_score": combined["G1"] * 5.0,       # Initial diagnostic score (0-100)
        "study_hours_week": combined["studytime"].map(studytime_map).fillna(3.5),
        "past_failures": combined["failures"].astype(int),
        "absences": combined["absences"].clip(upper=30).astype(int),
        "extra_support": (combined["schoolsup"] == "yes").astype(int),
        "paid_tuition": (combined["paid"] == "yes").astype(int),
        "higher_ed_goal": (combined["higher"] == "yes").astype(int),
        "internet_access": (combined["internet"] == "yes").astype(int),
        "health_status": combined["health"].astype(int),
        "free_time": combined["freetime"].astype(int),
        "final_exam_score": (combined["G3"] * 5.0).clip(lower=0.0, upper=100.0)  # Continuous target (0-100)
    })

    # Categorical target: GCE A/L Grade
    processed["predicted_grade"] = processed["final_exam_score"].apply(marks_to_al_grade)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    processed.to_csv(output_path, index=False)

    print(f"Dataset prepared successfully: {len(processed)} records saved to {output_path}")
    print("\nScore statistics:")
    print(processed[["assessment_score", "prior_score", "final_exam_score"]].describe().round(2))
    print("\nGrade distribution:")
    print(processed["predicted_grade"].value_counts().sort_index())
    print("\nSubject distribution:")
    print(processed["subject"].value_counts())

    return processed

if __name__ == "__main__":
    script_dir = Path(__file__).resolve().parent
    base_dir = script_dir.parent
    data_dir = base_dir / "data" / "student_performance"
    output_csv = base_dir / "data" / "processed_student_performance.csv"

    prepare_dataset(data_dir, output_csv)
