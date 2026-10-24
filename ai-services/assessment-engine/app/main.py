import json
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd

app = FastAPI(
    title="NeuroLearn AI - Assessment & Exam Prediction Engine",
    description="Adaptive Assessment, G.C.E. A/L Exam Prediction and Readiness Service",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BASE_DIR / "models" / "exam_predictor.joblib"
METRICS_PATH = BASE_DIR / "models" / "metrics.json"

pipeline = None
metrics_data = None

def load_artifacts():
    global pipeline, metrics_data
    if MODEL_PATH.exists():
        pipeline = joblib.load(MODEL_PATH)
    if METRICS_PATH.exists():
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics_data = json.load(f)

load_artifacts()

class PredictionRequest(BaseModel):
    subject: str = Field(default="Physics", description="Subject: Physics, Chemistry, or Biology")
    assessment_score: float = Field(default=60.0, ge=0.0, le=100.0, description="Adaptive assessment percentage score")
    prior_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Prior mock or diagnostic score")
    study_hours_week: float = Field(default=4.0, ge=0.0, le=40.0, description="Self-study hours per week")
    past_failures: int = Field(default=0, ge=0, le=5, description="Number of past class failures")
    absences: int = Field(default=2, ge=0, le=100, description="Absences / missed sessions")
    extra_support: int = Field(default=0, ge=0, le=1)
    paid_tuition: int = Field(default=1, ge=0, le=1)
    higher_ed_goal: int = Field(default=1, ge=0, le=1)
    internet_access: int = Field(default=1, ge=0, le=1)
    health_status: int = Field(default=4, ge=1, le=5)
    free_time: int = Field(default=3, ge=1, le=5)
    topics_covered_count: int = Field(default=3, ge=0)
    total_syllabus_topics: int = Field(default=4, ge=1)
    hard_questions_attempted: int = Field(default=2, ge=0)
    hard_questions_correct: int = Field(default=1, ge=0)

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

def evaluate_readiness(
    subject: str,
    assessment_score: float,
    topics_covered_count: int,
    total_syllabus_topics: int,
    hard_questions_attempted: int,
    hard_questions_correct: int,
    study_hours_week: float
) -> dict:
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

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "assessment-engine",
        "ml_model_loaded": pipeline is not None,
        "model_type": "RandomForestRegressor (scikit-learn)",
        "supported_subjects": ["Physics", "Chemistry", "Biology"]
    }

@app.get("/api/metrics")
def get_metrics():
    if not metrics_data:
        load_artifacts()
    if not metrics_data:
        raise HTTPException(status_code=404, detail="Metrics artifact not found")
    return metrics_data

@app.post("/api/predict")
def predict_score(req: PredictionRequest):
    if pipeline is None:
        load_artifacts()
    if pipeline is None:
        raise HTTPException(status_code=500, detail="Trained model pipeline not loaded")

    prior = req.prior_score if req.prior_score is not None else req.assessment_score

    df_input = pd.DataFrame([{
        "subject": req.subject,
        "assessment_score": float(req.assessment_score),
        "prior_score": float(prior),
        "study_hours_week": float(req.study_hours_week),
        "past_failures": int(req.past_failures),
        "absences": int(req.absences),
        "extra_support": int(req.extra_support),
        "paid_tuition": int(req.paid_tuition),
        "higher_ed_goal": int(req.higher_ed_goal),
        "internet_access": int(req.internet_access),
        "health_status": int(req.health_status),
        "free_time": int(req.free_time)
    }])

    pred_score = float(pipeline.predict(df_input)[0])
    pred_score = max(0.0, min(100.0, pred_score))
    pred_grade = marks_to_al_grade(pred_score)

    readiness = evaluate_readiness(
        subject=req.subject,
        assessment_score=req.assessment_score,
        topics_covered_count=req.topics_covered_count,
        total_syllabus_topics=req.total_syllabus_topics,
        hard_questions_attempted=req.hard_questions_attempted,
        hard_questions_correct=req.hard_questions_correct,
        study_hours_week=req.study_hours_week
    )

    return {
        "ml_prediction": {
            "predicted_score_percent": round(pred_score, 1),
            "predicted_grade_al": pred_grade,
            "model_type": "RandomForestRegressor (scikit-learn)",
            "benchmark_dataset": "UCI Secondary Education Student Performance (Cortez & Silva, 2008)"
        },
        "rule_based_readiness": readiness
    }
