import json
import re
from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, Field

from api.config import settings
from api.core.taste import TASTE_AXES

class MenuTasteClaim(BaseModel):
    axis: str = Field(..., description="One of: sweet, salty, sour, umami, spicy, nutty")
    level: int = Field(..., description="-2 (매우 약함), -1 (다소 약함), 0 (변화 없음), +1 (다소 강함), +2 (매우 강함)")
    comparative: bool = Field(False, description="Whether comparative phrasing was used (e.g., 다른 집보다)")
    confidence: float = Field(0.85, ge=0.0, le=1.0)
    evidence_text: str = Field(..., description="Exact text excerpt")

class UserPreferenceClaim(BaseModel):
    axis: str = Field(..., description="One of: sweet, salty, sour, umami, spicy, nutty")
    direction: str = Field(..., description="'prefer_more' or 'prefer_less'")
    confidence: float = Field(0.85, ge=0.0, le=1.0)
    evidence_text: str = Field(..., description="Exact text excerpt")

class ReviewAnalysisResult(BaseModel):
    menu_taste_claims: List[MenuTasteClaim] = []
    user_preference_claims: List[UserPreferenceClaim] = []
    raw_response: Optional[str] = None
    model_used: str = "solar-pro4"

SYSTEM_PROMPT = """당신은 음식 배달 앱 '취향렌즈(Taste Lens)'의 맛 리뷰 분석 전문 AI입니다.
리뷰 텍스트를 정밀 분석하여 다음 2가지 형태의 정형화된 Claim을 JSON으로만 추출하세요.

1. menu_taste_claims: 해당 식당 메뉴 자체의 맛 특성에 대한 서술
   - axis: "sweet" | "salty" | "sour" | "umami" | "spicy" | "nutty" 중 하나
   - level: -2 (매우 약함), -1 (다소 약함), 0 (보통), +1 (다소 강함), +2 (매우 강함)
   - comparative: true(다른 곳/평소에 비해 비교 표현 사용 시) / false
   - confidence: 0.0 ~ 1.0 (명확도)
   - evidence_text: 리뷰 원문 근거 구절

2. user_preference_claims: 작성자 개인의 취향/선호에 대한 명시적 진술 ("나는 ~한 게 좋다", "더 ~했으면 좋겠다")
   - axis: "sweet" | "salty" | "sour" | "umami" | "spicy" | "nutty" 중 하나
   - direction: "prefer_more" (더 강한 것을 선호) | "prefer_less" (더 약한 것을 선호)
   - confidence: 0.0 ~ 1.0
   - evidence_text: 리뷰 원문 근거 구절

* 주의 원칙:
- '맛있어요', '양 많아요', '친절해요', '배달 빨라요' 등 맛 6개 축과 무관한 내용은 제외하세요.
- 오직 아래 JSON 형식만 반환하세요:
{
  "menu_taste_claims": [...],
  "user_preference_claims": [...]
}
"""

def fallback_heuristic_analyzer(review_text: str) -> ReviewAnalysisResult:
    """Deterministic heuristic analysis when Upstage API key is absent or offline."""
    menu_claims: List[MenuTasteClaim] = []
    user_claims: List[UserPreferenceClaim] = []

    text = review_text.strip()

    # Rule patterns for axes
    axis_patterns = [
        ("spicy", r"(매[워운콤]|얼큰|칼칼|알싸|맵)", r"(안 매[워운]|덜 매[워운])"),
        ("sweet", r"(달[달콤아달]|단맛)", r"(안 달[아아]|덜 달[아아]|단맛이 없)"),
        ("salty", r"(짜[다요]|짭[조름짤]|간간)", r"(싱거[워운]|간이 심심|덜 짜)"),
        ("sour", r"(새콤|시큼|신맛)", r"(덜 시[어었]|신맛 없)"),
        ("umami", r"(감칠맛|진하[고네]|깊은 국물|풍미)", r"(밍밍|국물이 얕)"),
        ("nutty", r"(고소|구수|참기름|버터)", r"(고소한 맛 없)"),
    ]

    is_comparative = bool(re.search(r"(보다|비해|다른|평소)", text))

    for axis, pos_pat, neg_pat in axis_patterns:
        # Check negative/less
        neg_m = re.search(neg_pat, text)
        if neg_m:
            menu_claims.append(MenuTasteClaim(
                axis=axis,
                level=-1,
                comparative=is_comparative,
                confidence=0.88,
                evidence_text=neg_m.group(0),
            ))
            continue

        # Check positive/more
        pos_m = re.search(pos_pat, text)
        if pos_m:
            is_strong = bool(re.search(r"(너무|아주|진짜|엄청|많이)", text))
            level = 2 if is_strong else 1
            menu_claims.append(MenuTasteClaim(
                axis=axis,
                level=level,
                comparative=is_comparative,
                confidence=0.90,
                evidence_text=pos_m.group(0),
            ))

    # User preference check: "더 ~했으면", "좋아요", "선호", "취향"
    pref_patterns = [
        ("spicy", r"(더 매[워웠으면]|매운 게 좋|매콤한 걸 선호)", "prefer_more"),
        ("spicy", r"(덜 매[워웠으면]|안 매운 게 좋)", "prefer_less"),
        ("sweet", r"(더 달[았으면]|달달한 게 좋)", "prefer_more"),
        ("sweet", r"(덜 달[았으면]|덜 단 게 좋)", "prefer_less"),
        ("salty", r"(더 짭[조름했으면]|간이 더 세면)", "prefer_more"),
        ("salty", r"(덜 짰으면|싱거운 게 좋)", "prefer_less"),
    ]

    for axis, pat, direction in pref_patterns:
        m = re.search(pat, text)
        if m:
            user_claims.append(UserPreferenceClaim(
                axis=axis,
                direction=direction,
                confidence=0.89,
                evidence_text=m.group(0),
            ))

    return ReviewAnalysisResult(
        menu_taste_claims=menu_claims,
        user_preference_claims=user_claims,
        raw_response=None,
        model_used="heuristic-rule-fallback"
    )

async def analyze_review_with_solar(
    review_text: str,
    menu_name: str = "",
    food_name: str = ""
) -> ReviewAnalysisResult:
    """
    Calls Upstage Solar Pro 4 API to extract structured evidence.
    Falls back to deterministic rule analyzer if key is missing or call fails.
    """
    if not settings.UPSTAGE_API_KEY:
        return fallback_heuristic_analyzer(review_text)

    prompt = (
        f"음식 종류: {food_name or '미지정'}\n"
        f"식당 메뉴명: {menu_name or '미지정'}\n"
        f"리뷰 본문: {review_text}"
    )

    url = f"{settings.UPSTAGE_API_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {settings.UPSTAGE_API_KEY}",
        "Content-Type": "application/json",
    }
    body = {
        "model": settings.UPSTAGE_MODEL or "solar-pro4",
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.1,
        "response_format": {"type": "json_object"},
    }

    try:
        async with httpx.AsyncClient(timeout=12.0) as client:
            resp = await client.post(url, headers=headers, json=body)
            if resp.status_code != 200:
                return fallback_heuristic_analyzer(review_text)

            result_json = resp.json()
            content = result_json["choices"][0]["message"]["content"]
            parsed = json.loads(content)

            menu_claims = [
                MenuTasteClaim(**item) for item in parsed.get("menu_taste_claims", [])
                if item.get("axis") in TASTE_AXES
            ]
            user_claims = [
                UserPreferenceClaim(**item) for item in parsed.get("user_preference_claims", [])
                if item.get("axis") in TASTE_AXES
            ]

            return ReviewAnalysisResult(
                menu_taste_claims=menu_claims,
                user_preference_claims=user_claims,
                raw_response=content,
                model_used=settings.UPSTAGE_MODEL or "solar-pro4",
            )
    except Exception:
        return fallback_heuristic_analyzer(review_text)
