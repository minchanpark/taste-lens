import pytest
from fastapi.testclient import TestClient

from api.services.solar import fallback_heuristic_analyzer, MenuTasteClaim, UserPreferenceClaim
from api.core.review_learning import (
    calculate_claim_weight,
    calculate_review_confidence,
    update_restaurant_menu_vector,
    update_user_vector_from_review,
)
from api.index import app

client = TestClient(app)

def test_claim_weight_and_confidence():
    claim_normal = MenuTasteClaim(axis="sweet", level=-1, comparative=False, evidence_text="덜 달아요")
    claim_comp = MenuTasteClaim(axis="sweet", level=-1, comparative=True, evidence_text="다른 집보다 덜 달아요")

    assert calculate_claim_weight(claim_normal) == -1.0
    assert pytest.approx(calculate_claim_weight(claim_comp), 0.01) == -1.2

    # n / (n + 10)
    assert pytest.approx(calculate_review_confidence(1), 0.01) == 0.0909
    assert pytest.approx(calculate_review_confidence(10), 0.01) == 0.5000
    assert pytest.approx(calculate_review_confidence(30), 0.01) == 0.7500

def test_fallback_review_analyzer_extraction():
    # 1. Menu claim with comparative
    res1 = fallback_heuristic_analyzer("다른 집보다 덜 달아요.")
    assert len(res1.menu_taste_claims) == 1
    assert res1.menu_taste_claims[0].axis == "sweet"
    assert res1.menu_taste_claims[0].level == -1
    assert res1.menu_taste_claims[0].comparative is True

    # 2. User preference claim
    res2 = fallback_heuristic_analyzer("저는 조금 더 매운 게 좋아요.")
    assert len(res2.user_preference_claims) == 1
    assert res2.user_preference_claims[0].axis == "spicy"
    assert res2.user_preference_claims[0].direction == "prefer_more"

    # 3. Taste-unrelated review
    res3 = fallback_heuristic_analyzer("배달 빠르고 양이 진짜 많아서 좋아요 친절합니다.")
    assert len(res3.menu_taste_claims) == 0
    assert len(res3.user_preference_claims) == 0

def test_restaurant_menu_learning_bounded():
    food_vec = [0.25, 0.65, 0.55, 0.78, 0.62, 0.18]
    claims = [MenuTasteClaim(axis="spicy", level=2, comparative=True, evidence_text="엄청 매워요")]
    
    updated = update_restaurant_menu_vector(
        food_vector=food_vec,
        menu_claims=claims,
        peer_menu_claims_list=[],
        unique_review_count=5,
    )
    # Spicy axis is index 4
    assert updated[4] >= food_vec[4]
    # Bound constraint: max ±0.15 change
    assert abs(updated[4] - food_vec[4]) <= 0.15

def test_prd_exact_user_vector_update():
    """
    PRD Section 75 exact test:
    U_spicy = 0.68
    prefer_more -> target = min(0.68 + 0.10, 1) = 0.78
    U_after = 0.98 * 0.68 + 0.02 * 0.78 = 0.682
    """
    u_before = [0.5, 0.5, 0.5, 0.5, 0.68, 0.5]
    pref = [UserPreferenceClaim(axis="spicy", direction="prefer_more", confidence=0.88, evidence_text="조금 더 매워도 좋았어요")]

    u_after, applied, impacts = update_user_vector_from_review(u_before, pref)
    assert applied is True
    assert pytest.approx(u_after[4], 0.0001) == 0.682
    assert impacts[0]["before"] == 68.0
    assert impacts[0]["after"] == 68.2

def test_review_submission_api_endpoint():
    payload = {
        "restaurant_id": "r_korean_01",
        "restaurant_menu_id": "rm_r_korean_01_kimchi_jjigae",
        "rating": 4.5,
        "review_text": "다른 집보다 덜 달아서 좋고, 저는 조금 더 매운 게 좋아요.",
        "user_vector": [0.5, 0.5, 0.5, 0.5, 0.68, 0.5],
    }
    response = client.post("/api/reviews", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["status"] == "completed"
    assert len(data["menu_taste_claims"]) >= 1
    assert len(data["user_preference_claims"]) >= 1
    assert data["user_update_applied"] is True
    # Verify user vector after contains updated spicy
    assert pytest.approx(data["user_vector_after"][4], 0.001) == 0.682
    assert len(data["impacts"]) >= 1
