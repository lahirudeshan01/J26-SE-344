from fastapi.testclient import TestClient

from app.main import app


def test_health():
    response = TestClient(app).get("/health")

    assert response.status_code == 200

    data = response.json()

    assert data["service"] == "assessment-engine"
    assert data["status"] == "ok"
    assert "ml_model_loaded" in data
    assert "model_type" in data
    assert "supported_subjects" in data
