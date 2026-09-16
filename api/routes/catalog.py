from typing import List, Optional
from pydantic import BaseModel, Field
from fastapi import APIRouter, HTTPException, Query

from api.services.catalog import (
    get_all_foods,
    get_all_restaurants,
    get_restaurant_menus,
    rank_foods_by_vector,
    rank_restaurants_for_food,
)

router = APIRouter(prefix="/api", tags=["Catalog & Recommendations"])

class FoodRecommendRequest(BaseModel):
    user_vector: List[float] = Field(..., min_length=6, max_length=6)
    category: Optional[str] = None
    limit: Optional[int] = 10

class RestaurantRecommendRequest(BaseModel):
    user_vector: List[float] = Field(..., min_length=6, max_length=6)
    food_id: str

@router.get("/foods")
async def list_foods(category: Optional[str] = Query(None)):
    """Returns list of 70 seed foods (or filtered by category)."""
    return get_all_foods(category=category)

@router.get("/categories")
async def list_categories():
    """Returns the 8 categories and counts."""
    foods = get_all_foods()
    cats = {}
    for f in foods:
        c = f["category"]
        cats[c] = cats.get(c, 0) + 1
    return [{"name": name, "food_count": count} for name, count in cats.items()]

@router.get("/restaurants")
async def list_restaurants(category: Optional[str] = Query(None)):
    """Returns list of 41 seed restaurants."""
    return get_all_restaurants(category=category)

@router.get("/restaurants/{restaurant_id}")
async def get_restaurant(restaurant_id: str):
    """Returns restaurant details along with its menus."""
    restaurants = get_all_restaurants()
    rest = next((r for r in restaurants if r["id"] == restaurant_id), None)
    if not rest:
        raise HTTPException(status_code=404, detail="Restaurant not found")
    
    menus = get_restaurant_menus(restaurant_id)
    return {
        **rest,
        "menus": menus,
    }

@router.post("/recommendations/foods")
async def recommend_foods(payload: FoodRecommendRequest):
    """Ranks foods based on user taste vector similarity."""
    return rank_foods_by_vector(
        user_vector=payload.user_vector,
        category=payload.category,
        limit=payload.limit or 10,
    )

@router.post("/recommendations/restaurants")
async def recommend_restaurants(payload: RestaurantRecommendRequest):
    """Ranks restaurants serving a selected food by menu-level taste match."""
    return rank_restaurants_for_food(
        user_vector=payload.user_vector,
        food_id=payload.food_id,
    )
