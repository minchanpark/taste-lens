import json
import os
from typing import List, Dict, Any, Optional
from api.core.taste import match_score, distance
from api.services.supabase import get_supabase_client

_seed_data: Optional[Dict[str, Any]] = None

def get_seed_data() -> Dict[str, Any]:
    global _seed_data
    if _seed_data is None:
        data_path = os.path.join(os.path.dirname(__file__), "..", "data", "seed_data.json")
        with open(data_path, "r", encoding="utf-8") as f:
            _seed_data = json.load(f)
    return _seed_data

def get_all_foods(category: Optional[str] = None) -> List[Dict[str, Any]]:
    # Try supabase DB first if connected
    sp = get_supabase_client()
    if sp:
        try:
            query = sp.table("foods").select("*")
            if category:
                query = query.eq("category", category)
            res = query.execute()
            if res.data:
                return [
                    {
                        "id": row["food_id"],
                        "name": row["name"],
                        "category": row["category"],
                        "emoji": row.get("emoji", "🍽️"),
                        "vector": [
                            float(row["sweet"]),
                            float(row["salty"]),
                            float(row["sour"]),
                            float(row["umami"]),
                            float(row["spicy"]),
                            float(row["nutty"]),
                        ],
                        "description": row.get("rationale", ""),
                        "food_image_url": row.get("food_image_url"),
                    }
                    for row in res.data
                ]
        except Exception:
            pass

    # Fallback to seed JSON
    data = get_seed_data()
    foods = data["foods"]
    if category:
        foods = [f for f in foods if f["category"] == category]
    return foods

def get_all_restaurants(category: Optional[str] = None) -> List[Dict[str, Any]]:
    sp = get_supabase_client()
    if sp:
        try:
            query = sp.table("restaurants").select("*")
            if category:
                query = query.eq("category", category)
            res = query.execute()
            if res.data:
                return [
                    {
                        "id": row["restaurant_id"],
                        "name": row["name"],
                        "category": row["category"],
                        "restaurant_type": row.get("restaurant_type"),
                        "rating": float(row["rating"]),
                        "review_count": int(row["review_count"]),
                        "delivery_minutes": int(row["delivery_minutes"]),
                        "delivery_fee": int(row["delivery_fee"]),
                        "minimum_order": int(row["minimum_order"]),
                        "restaurant_image_url": row.get("restaurant_image_url"),
                    }
                    for row in res.data
                ]
        except Exception:
            pass

    data = get_seed_data()
    restaurants = data["restaurants"]
    if category:
        restaurants = [r for r in restaurants if r["category"] == category]
    return restaurants

def get_restaurant_menus(restaurant_id: str) -> List[Dict[str, Any]]:
    sp = get_supabase_client()
    if sp:
        try:
            res = sp.table("restaurant_menus").select("*").eq("restaurant_id", restaurant_id).execute()
            if res.data:
                return [
                    {
                        "id": row["restaurant_menu_id"],
                        "restaurant_id": row["restaurant_id"],
                        "food_id": row["food_id"],
                        "name": row["menu_name"],
                        "description": row.get("menu_description", ""),
                        "price": int(row["price"]),
                        "vector": [
                            float(row["sweet"]),
                            float(row["salty"]),
                            float(row["sour"]),
                            float(row["umami"]),
                            float(row["spicy"]),
                            float(row["nutty"]),
                        ],
                        "menu_section": row.get("menu_section", "메인 메뉴"),
                        "is_representative": bool(row.get("is_representative")),
                        "is_popular": bool(row.get("is_popular")),
                    }
                    for row in res.data
                ]
        except Exception:
            pass

    data = get_seed_data()
    return [m for m in data["restaurant_menus"] if m["restaurant_id"] == restaurant_id]

def rank_foods_by_vector(user_vector: List[float], category: Optional[str] = None, limit: int = 10) -> List[Dict[str, Any]]:
    foods = get_all_foods(category)
    ranked = []
    for f in foods:
        score = match_score(user_vector, f["vector"])
        ranked.append({
            **f,
            "match_percentage": round(score, 1),
            "distance": round(distance(user_vector, f["vector"]), 4),
        })
    ranked.sort(key=lambda x: x["match_percentage"], reverse=True)
    return ranked[:limit]

def rank_restaurants_for_food(user_vector: List[float], food_id: str) -> List[Dict[str, Any]]:
    data = get_seed_data()
    # Find all menus serving this food
    relevant_menus = [m for m in data["restaurant_menus"] if m["food_id"] == food_id]
    rest_map = {r["id"]: r for r in data["restaurants"]}

    results = []
    for m in relevant_menus:
        rest = rest_map.get(m["restaurant_id"])
        if not rest:
            continue
        score = match_score(user_vector, m["vector"])
        results.append({
            "restaurant": rest,
            "menu": m,
            "match_percentage": round(score, 1),
            "distance": round(distance(user_vector, m["vector"]), 4),
        })

    # Sort by match score descending
    results.sort(key=lambda x: (x["match_percentage"], x["restaurant"]["rating"]), reverse=True)
    return results
