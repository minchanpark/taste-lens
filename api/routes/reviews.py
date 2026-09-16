import uuid
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from api.services.solar import analyze_review_with_solar
from api.core.review_learning import (
    update_user_vector_from_review,
    update_restaurant_menu_vector,
)
from api.services.catalog import get_seed_data
from api.services.supabase import get_supabase_client

router = APIRouter(prefix="/api/reviews", tags=["Reviews & Learning Loop"])

class ReviewSubmissionRequest(BaseModel):
    user_id: Optional[str] = None
    order_id: Optional[str] = None
    restaurant_id: str
    restaurant_menu_id: str
    rating: float = Field(..., ge=1.0, le=5.0)
    review_text: str = Field(..., min_length=2)
    user_vector: Optional[List[float]] = Field(None, min_length=6, max_length=6)

@router.post("")
async def submit_review(payload: ReviewSubmissionRequest):
    """
    Submits a review, invokes Solar Pro 4 to extract structured evidence,
    and calculates vector updates for user and restaurant menu.
    """
    data = get_seed_data()
    menu = next((m for m in data["restaurant_menus"] if m["id"] == payload.restaurant_menu_id), None)
    food_name = ""
    menu_name = menu["name"] if menu else ""
    if menu:
        food = next((f for f in data["foods"] if f["id"] == menu["food_id"]), None)
        food_name = food["name"] if food else ""

    # 1. Analyze review with Solar Pro 4
    analysis = await analyze_review_with_solar(
        review_text=payload.review_text,
        menu_name=menu_name,
        food_name=food_name,
    )

    # 2. Review-based User Learning
    u_before = payload.user_vector or [0.5] * 6
    u_after, user_updated, impacts = update_user_vector_from_review(
        user_vector=u_before,
        preference_claims=analysis.user_preference_claims,
    )

    # 3. Review-based RestaurantMenu Learning
    # Find peer menus serving the same food
    peer_claims_list: List[List[Any]] = []
    if menu:
        food_id = menu["food_id"]
        # In real DB, fetch claims of peer menus; here we simulate peer claims
        menu_vector_after = update_restaurant_menu_vector(
            food_vector=menu["vector"],
            menu_claims=analysis.menu_taste_claims,
            peer_menu_claims_list=peer_claims_list,
            unique_review_count=1,
        )
    else:
        menu_vector_after = None

    review_id = str(uuid.uuid4())

    # 4. Save to Supabase if client is available
    sp = get_supabase_client()
    if sp:
        try:
            sp.table("reviews").insert({
                "review_id": review_id,
                "order_id": payload.order_id,
                "user_id": payload.user_id,
                "restaurant_id": payload.restaurant_id,
                "restaurant_menu_id": payload.restaurant_menu_id,
                "rating": payload.rating,
                "review_text": payload.review_text,
                "status": "completed",
                "user_vector_before": u_before,
                "user_vector_after": u_after,
                "user_update_applied": user_updated,
                "restaurant_update_applied": bool(analysis.menu_taste_claims),
            }).execute()

            for c in analysis.menu_taste_claims:
                sp.table("review_evidence").insert({
                    "review_id": review_id,
                    "claim_type": "menu_taste",
                    "axis": c.axis,
                    "level": c.level,
                    "comparative": c.comparative,
                    "confidence": c.confidence,
                    "evidence_text": c.evidence_text,
                    "model": analysis.model_used,
                }).execute()

            for uc in analysis.user_preference_claims:
                sp.table("review_evidence").insert({
                    "review_id": review_id,
                    "claim_type": "user_preference",
                    "axis": uc.axis,
                    "level": 1 if uc.direction == "prefer_more" else -1,
                    "direction": uc.direction,
                    "confidence": uc.confidence,
                    "evidence_text": uc.evidence_text,
                    "model": analysis.model_used,
                }).execute()
        except Exception:
            pass

    # 5. Return structured response for Section 76 Review Impact UX
    return {
        "review_id": review_id,
        "status": "completed",
        "model_used": analysis.model_used,
        "menu_taste_claims": [c.model_dump() for c in analysis.menu_taste_claims],
        "user_preference_claims": [c.model_dump() for c in analysis.user_preference_claims],
        "user_update_applied": user_updated,
        "user_vector_before": u_before,
        "user_vector_after": u_after,
        "menu_vector_after": menu_vector_after,
        "impacts": impacts,
        "message": (
            "취향 점수에 리뷰가 반영되었어요."
            if user_updated
            else "메뉴의 맛 정보는 학습했지만, 개인 선호에 대한 명확한 표현은 없어 내 취향 점수는 유지되었어요."
        ),
    }
