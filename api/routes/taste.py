from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException

from api.core.taste import (
    TASTE_AXES,
    distance,
    match_score,
    estimate_u_base,
    get_next_question,
    current_vector,
    time_segment,
    generate_reason,
)

router = APIRouter(prefix="/api/taste", tags=["Taste Engine"])

class ChoiceModel(BaseModel):
    selected: str
    rejected: str
    sequence: Optional[int] = 0

class FoodModel(BaseModel):
    id: str
    name: str
    vector: List[float] = Field(..., min_length=6, max_length=6)
    category: Optional[str] = None
    emoji: Optional[str] = None
    description: Optional[str] = None

class QuestionRequest(BaseModel):
    choices: List[ChoiceModel]
    foods: List[FoodModel]

class EstimateRequest(BaseModel):
    choices: List[ChoiceModel]
    foods: List[FoodModel]

class CurrentVectorRequest(BaseModel):
    base_vector: List[float] = Field(..., min_length=6, max_length=6)
    orders: List[Dict[str, Any]] = []
    context: Dict[str, str] = {}

class MatchRequest(BaseModel):
    user_vector: List[float] = Field(..., min_length=6, max_length=6)
    target_vector: List[float] = Field(..., min_length=6, max_length=6)

@router.post("/question")
async def next_question(payload: QuestionRequest):
    """Calculates the next pair of foods for Pairwise Onboarding."""
    if len(payload.foods) < 2:
        raise HTTPException(status_code=400, detail="At least 2 foods required.")
    
    foods_data = [f.model_dump() for f in payload.foods]
    choices_data = [c.model_dump() for c in payload.choices]
    
    food_a, food_b = get_next_question(choices_data, foods_data)
    return {
        "step": len(payload.choices) + 1,
        "is_completed": len(payload.choices) >= 10,
        "food_a": food_a,
        "food_b": food_b,
    }

@router.post("/estimate")
async def estimate_vector(payload: EstimateRequest):
    """Estimates U_base vector using Bounded Coordinate Descent."""
    vector_map = {f.id: f.vector for f in payload.foods}
    choices_data = [c.model_dump() for c in payload.choices]
    
    u_base = estimate_u_base(choices_data, vector_map)
    return {
        "u_base": u_base,
        "axes": TASTE_AXES,
        "total_choices": len(payload.choices),
    }

@router.post("/current")
async def calculate_current_vector(payload: CurrentVectorRequest):
    """Adjusts U_base with Place, Time, and Weather context shrinkage to produce U_current."""
    u_curr = current_vector(
        base_vector=payload.base_vector,
        orders=payload.orders,
        context=payload.context,
    )
    return {
        "u_current": u_curr,
        "base_vector": payload.base_vector,
        "context": payload.context,
    }

@router.post("/match")
async def calculate_match(payload: MatchRequest):
    """Calculates RMS distance, match percentage, and natural language explanation."""
    dist = distance(payload.user_vector, payload.target_vector)
    score = match_score(payload.user_vector, payload.target_vector)
    reason_text = generate_reason(payload.user_vector, payload.target_vector)
    return {
        "distance": round(dist, 4),
        "match_percentage": round(score, 1),
        "reason": reason_text,
    }

@router.get("/time-segment")
async def get_time_segment():
    """Returns the current Korean time segment."""
    segment = time_segment()
    return {"time_segment": segment}
