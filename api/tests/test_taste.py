import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

from api.core.taste import (
    distance,
    match_score,
    estimate_u_base,
    get_next_question,
    current_vector,
    time_segment,
    generate_reason,
)
from api.index import app

client = TestClient(app)

SAMPLE_FOODS = [
    {"id": "bulgogi", "name": "불고기", "vector": [0.65, 0.55, 0.15, 0.70, 0.10, 0.40]},
    {"id": "gukbap", "name": "국밥", "vector": [0.15, 0.60, 0.10, 0.75, 0.35, 0.45]},
    {"id": "ramen", "name": "라멘", "vector": [0.20, 0.70, 0.10, 0.80, 0.30, 0.50]},
    {"id": "porridge", "name": "죽", "vector": [0.20, 0.30, 0.10, 0.45, 0.05, 0.50]},
    {"id": "naengmyeon", "name": "냉면", "vector": [0.45, 0.45, 0.70, 0.55, 0.25, 0.20]},
    {"id": "udon", "name": "우동", "vector": [0.30, 0.50, 0.10, 0.65, 0.05, 0.35]},
    {"id": "kimchi", "name": "김치찌개", "vector": [0.25, 0.65, 0.50, 0.75, 0.75, 0.25]},
    {"id": "salad", "name": "샐러드", "vector": [0.35, 0.20, 0.45, 0.30, 0.05, 0.35]},
    {"id": "jeyuk", "name": "제육볶음", "vector": [0.55, 0.60, 0.15, 0.70, 0.70, 0.30]},
    {"id": "donkatsu", "name": "돈까스", "vector": [0.50, 0.50, 0.20, 0.60, 0.05, 0.45]},
    {"id": "kongguksu", "name": "콩국수", "vector": [0.20, 0.35, 0.05, 0.50, 0.00, 0.85]},
    {"id": "pho", "name": "쌀국수", "vector": [0.25, 0.55, 0.35, 0.65, 0.20, 0.25]},
]

def test_distance_and_match():
    v_zero = [0.0] * 6
    v_one = [1.0] * 6
    assert distance(v_zero, v_zero) == 0.0
    assert match_score(v_zero, v_zero) == 100.0
    assert pytest.approx(distance(v_zero, v_one), 0.001) == 1.0
    assert pytest.approx(match_score(v_zero, v_one), 0.001) == 0.0

def test_estimate_u_base():
    choices = [
        {"selected": "bulgogi", "rejected": "gukbap", "sequence": 1},
        {"selected": "kimchi", "rejected": "salad", "sequence": 2},
    ]
    food_map = {f["id"]: f["vector"] for f in SAMPLE_FOODS}
    u_base = estimate_u_base(choices, food_map)
    assert len(u_base) == 6
    for val in u_base:
        assert 0.0 <= val <= 1.0

def test_next_question_coverage_and_adaptive():
    choices = []
    # Q1-Q6 should follow default coverage pairs
    for i in range(6):
        food_a, food_b = get_next_question(choices, SAMPLE_FOODS)
        assert food_a["id"] != food_b["id"]
        choices.append({"selected": food_a["id"], "rejected": food_b["id"], "sequence": i + 1})

    # Q7 should be adaptive
    food_a, food_b = get_next_question(choices, SAMPLE_FOODS)
    assert food_a["id"] != food_b["id"]

def test_korean_time_segments():
    seoul_tz = timezone(timedelta(hours=9))
    base = datetime(2026, 9, 16, tzinfo=seoul_tz)

    assert time_segment(base.replace(hour=7)) == "breakfast"
    assert time_segment(base.replace(hour=12)) == "lunch"
    assert time_segment(base.replace(hour=15)) == "afternoon"
    assert time_segment(base.replace(hour=18)) == "dinner"
    assert time_segment(base.replace(hour=22)) == "late-night"

def test_current_vector_shrinkage():
    base = [0.5] * 6
    orders = [
        {"vector": [0.8, 0.8, 0.1, 0.8, 0.9, 0.2], "context": {"address": "집", "time": "lunch", "weather": "rain"}},
        {"vector": [0.7, 0.8, 0.1, 0.7, 0.8, 0.3], "context": {"address": "집", "time": "dinner", "weather": "normal"}},
    ]
    u_curr = current_vector(base, orders, {"address": "집", "time": "lunch", "weather": "rain"})
    assert len(u_curr) == 6
    for val in u_curr:
        assert 0.0 <= val <= 1.0

def test_reason_generation():
    reason = generate_reason([0.8, 0.7, 0.2, 0.9, 0.8, 0.3], [0.8, 0.7, 0.1, 0.9, 0.7, 0.2])
    assert "내 취향과 가까워요" in reason

def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["fastapi"] == "running"
    assert data["version"] == "4.3"

def test_taste_match_endpoint():
    response = client.post(
        "/api/taste/match",
        json={"user_vector": [0.5] * 6, "target_vector": [0.6] * 6}
    )
    assert response.status_code == 200
    data = response.json()
    assert "match_percentage" in data
    assert "distance" in data
    assert "reason" in data
