"""
Prediction & Inference Script for NeuroLearn AI Assessment Engine
Provides terminal demonstration and programmatic inference using the trained Random Forest model.
Also computes the explainable, rule-based exam-readiness indicator.
"""

import argparse
import json
import sys
from pathlib import Path
import joblib
import pandas as pd

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

def compute_exam_readiness(
    subject: str,
    assessment_score: float,
    topics_covered_count: int,
    total_syllabus_topics: int,
    hard_questions_attempted: int,
    hard_questions_correct: int,
    study_hours_week: float
) -> dict:
    """
    Explainable, rule-based exam-readiness indicator.
    Evaluates pedagogical mastery and topic coverage distinctly from statistical ML prediction.
    """
    topic_coverage_ratio = (
        topics_covered_count / total_syllabus_topics
        if total_syllabus_topics > 0
        else 0.0
    )
    hard_acc = (
        hard_questions_correct / hard_questions_attempted
        if hard_questions_attempted > 0
        else 0.0
    )

    # Readiness scoring rubric
    # 40% assessment score, 30% topic coverage, 20% hard difficulty mastery, 10% study consistency
    readiness_score = (
        (assessment_score * 0.40)
        + (topic_coverage_ratio * 100.0 * 0.30)
        + (hard_acc * 100.0 * 0.20)
        + (min(study_hours_week / 10.0, 1.0) * 100.0 * 0.10)
    )

    if readiness_score >= 70.0 and topic_coverage_ratio >= 0.60:
        level = "High Readiness"
        badge = "GREEN"
        summary = f"Student shows solid mastery in {subject} with strong topic coverage."
    elif readiness_score >= 45.0:
        level = "Moderate Readiness"
        badge = "AMBER"
        summary = f"Consistent foundation in {subject}, but requires reinforcement on challenging topics."
    else:
        level = "Needs Reinforcement"
        badge = "RED"
        summary = f"Immediate revision and topic coverage needed for {subject} before final examination."

    recommendations = []
    if topic_coverage_ratio < 0.70:
        recommendations.append(f"Complete remaining {total_syllabus_topics - topics_covered_count} core syllabus topics.")
    if hard_acc < 0.50:
        recommendations.append("Practice higher-difficulty multi-step calculation problems.")
    if study_hours_week < 5.0:
        recommendations.append("Increase dedicated weekly self-study to at least 6-8 hours.")

    if not recommendations:
        recommendations.append("Maintain timed mock exam practice under examination conditions.")

    return {
        "readiness_level": level,
        "readiness_badge": badge,
        "readiness_score": round(readiness_score, 1),
        "topic_coverage_percent": round(topic_coverage_ratio * 100, 1),
        "hard_question_accuracy_percent": round(hard_acc * 100, 1),
        "summary": summary,
        "actionable_recommendations": recommendations
    }

def run_prediction(model_path: Path, input_data: dict) -> dict:
    if not model_path.exists():
        raise FileNotFoundError(f"Trained model not found at {model_path}. Run train_model.py first.")

    model = joblib.load(model_path)

    # Convert single dict to DataFrame matching training schema
    df_input = pd.DataFrame([{
        "subject": input_data.get("subject", "Physics"),
        "assessment_score": float(input_data.get("assessment_score", 60.0)),
        "prior_score": float(input_data.get("prior_score", input_data.get("assessment_score", 60.0))),
        "study_hours_week": float(input_data.get("study_hours_week", 4.0)),
        "past_failures": int(input_data.get("past_failures", 0)),
        "absences": int(input_data.get("absences", 2)),
        "extra_support": int(input_data.get("extra_support", 0)),
        "paid_tuition": int(input_data.get("paid_tuition", 1)),
        "higher_ed_goal": int(input_data.get("higher_ed_goal", 1)),
        "internet_access": int(input_data.get("internet_access", 1)),
        "health_status": int(input_data.get("health_status", 4)),
        "free_time": int(input_data.get("free_time", 3))
    }])

    pred_score = float(model.predict(df_input)[0])
    pred_score = max(0.0, min(100.0, pred_score))
    pred_grade = marks_to_al_grade(pred_score)

    # Compute rule-based readiness
    readiness = compute_exam_readiness(
        subject=input_data.get("subject", "Physics"),
        assessment_score=df_input["assessment_score"].iloc[0],
        topics_covered_count=int(input_data.get("topics_covered_count", 3)),
        total_syllabus_topics=int(input_data.get("total_syllabus_topics", 4)),
        hard_questions_attempted=int(input_data.get("hard_questions_attempted", 2)),
        hard_questions_correct=int(input_data.get("hard_questions_correct", 1)),
        study_hours_week=df_input["study_hours_week"].iloc[0]
    )

    return {
        "student_input": input_data,
        "ml_prediction": {
            "predicted_score_percent": round(pred_score, 1),
            "predicted_grade_al": pred_grade,
            "model_type": "RandomForestRegressor (scikit-learn)",
            "benchmark_dataset": "UCI Secondary Education Student Performance (Cortez & Silva, 2008)"
        },
        "rule_based_readiness": readiness
    }

def run_demo():
    script_dir = Path(__file__).resolve().parent
    model_path = script_dir.parent / "models" / "exam_predictor.joblib"

    print("=" * 80)
    print("NEUROLERN AI - EXAM PREDICTION & READINESS ENGINE (DEMONSTRATION)")
    print("Sri Lankan G.C.E. Advanced Level Science Subjects: Physics, Chemistry, Biology")
    print("=" * 80)

    demo_cases = [
        {
            "label": "Physics - High Performing Candidate (Unit: Mechanics & Optics)",
            "data": {
                "subject": "Physics",
                "assessment_score": 82.5,
                "prior_score": 80.0,
                "study_hours_week": 8.0,
                "past_failures": 0,
                "absences": 1,
                "extra_support": 0,
                "paid_tuition": 1,
                "higher_ed_goal": 1,
                "topics_covered_count": 4,
                "total_syllabus_topics": 4,
                "hard_questions_attempted": 3,
                "hard_questions_correct": 3
            }
        },
        {
            "label": "Chemistry - Average Performing Candidate (Unit: Physical & Organic)",
            "data": {
                "subject": "Chemistry",
                "assessment_score": 58.0,
                "prior_score": 55.0,
                "study_hours_week": 4.0,
                "past_failures": 0,
                "absences": 4,
                "extra_support": 0,
                "paid_tuition": 1,
                "higher_ed_goal": 1,
                "topics_covered_count": 3,
                "total_syllabus_topics": 4,
                "hard_questions_attempted": 2,
                "hard_questions_correct": 1
            }
        },
        {
            "label": "Biology - Struggling Candidate (Unit: Cellular Biology & Genetics)",
            "data": {
                "subject": "Biology",
                "assessment_score": 32.0,
                "prior_score": 30.0,
                "study_hours_week": 2.0,
                "past_failures": 1,
                "absences": 9,
                "extra_support": 1,
                "paid_tuition": 0,
                "higher_ed_goal": 1,
                "topics_covered_count": 2,
                "total_syllabus_topics": 4,
                "hard_questions_attempted": 2,
                "hard_questions_correct": 0
            }
        }
    ]

    for case in demo_cases:
        print(f"\n[Case]: {case['label']}")
        print(f"  Inputs: Score={case['data']['assessment_score']}%, Study={case['data']['study_hours_week']}h/wk, Absences={case['data']['absences']}")
        result = run_prediction(model_path, case["data"])
        pred = result["ml_prediction"]
        ready = result["rule_based_readiness"]

        print(f"  --> ML Predicted Final Exam Marks: {pred['predicted_score_percent']}%")
        print(f"  --> Sri Lankan G.C.E. A/L Grade:    {pred['predicted_grade_al']}")
        print(f"  --> Readiness Status:               {ready['readiness_level']} ({ready['readiness_badge']}) [Score: {ready['readiness_score']}/100]")
        print(f"  --> Readiness Summary:              {ready['summary']}")
        print(f"  --> Key Revision Action:            {ready['actionable_recommendations'][0]}")

    print("\n" + "=" * 80)
    print("Summary: Genuine ML execution via scikit-learn pipeline completed successfully.")
    print("=" * 80)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="NeuroLearn AI Assessment & Exam Prediction Engine CLI")
    parser.add_argument("--demo", action="store_true", help="Run interactive demonstration on Physics, Chemistry, Biology cases")
    parser.add_argument("--json", type=str, help="JSON input string of student assessment features")
    parser.add_argument("--subject", type=str, default="Physics", help="Subject (Physics, Chemistry, Biology)")
    parser.add_argument("--score", type=float, default=65.0, help="Assessment score (0-100)")
    parser.add_argument("--study_hours", type=float, default=5.0, help="Study hours per week")
    parser.add_argument("--absences", type=int, default=2, help="Absence count")

    args = parser.parse_args()
    script_dir = Path(__file__).resolve().parent
    model_path = script_dir.parent / "models" / "exam_predictor.joblib"

    if args.demo:
        run_demo()
    elif args.json:
        data = json.loads(args.json)
        result = run_prediction(model_path, data)
        print(json.dumps(result, indent=2))
    else:
        # Single input from flags
        data = {
            "subject": args.subject,
            "assessment_score": args.score,
            "study_hours_week": args.study_hours,
            "absences": args.absences
        }
        result = run_prediction(model_path, data)
        print(json.dumps(result, indent=2))
