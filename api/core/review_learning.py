from typing import List, Dict, Any, Tuple
from api.core.taste import TASTE_AXES, clip, AXIS_LABELS
from api.services.solar import MenuTasteClaim, UserPreferenceClaim

def calculate_claim_weight(claim: MenuTasteClaim) -> float:
    """PRD v4.3 Section 71: Comparative Weight."""
    mult = 1.2 if claim.comparative else 1.0
    return float(claim.level) * mult

def calculate_review_confidence(unique_review_count: int) -> float:
    """PRD v4.3 Section 72: Review Confidence = n / (n + 10)."""
    n = float(unique_review_count)
    return n / (n + 10.0)

def update_restaurant_menu_vector(
    food_vector: List[float],
    menu_claims: List[MenuTasteClaim],
    peer_menu_claims_list: List[List[MenuTasteClaim]],
    unique_review_count: int
) -> List[float]:
    """
    PRD v4.3 Section 73: RestaurantMenu Learning.
    Peer group comparison, percentile ranking, bounded ±0.15 delta.
    """
    if not menu_claims or unique_review_count == 0:
        return list(food_vector)

    confidence = calculate_review_confidence(unique_review_count)
    updated_vector = list(food_vector)

    for k, axis in enumerate(TASTE_AXES):
        axis_claims = [c for c in menu_claims if c.axis == axis]
        if not axis_claims:
            continue

        raw_score = sum(calculate_claim_weight(c) for c in axis_claims) / len(axis_claims)

        # Peer comparison
        peer_scores: List[float] = []
        for peer_claims in peer_menu_claims_list:
            p_axis_claims = [c for c in peer_claims if c.axis == axis]
            if p_axis_claims:
                p_raw = sum(calculate_claim_weight(c) for c in p_axis_claims) / len(p_axis_claims)
                peer_scores.append(p_raw)

        if len(peer_scores) < 2:
            # Fallback if no peers: direct scale
            c = max(-1.0, min(1.0, raw_score / 2.4))
        else:
            less_count = sum(1 for s in peer_scores if s < raw_score)
            equal_count = sum(1 for s in peer_scores if s == raw_score)
            percentile = (less_count + (equal_count - 1) / 2.0) / (len(peer_scores) - 1.0)
            c = 2.0 * percentile - 1.0

        delta_restaurant = 0.15 * confidence * c
        updated_vector[k] = clip(round(food_vector[k] + delta_restaurant, 4))

    return updated_vector

def update_user_vector_from_review(
    user_vector: List[float],
    preference_claims: List[UserPreferenceClaim]
) -> Tuple[List[float], bool, List[Dict[str, Any]]]:
    """
    PRD v4.3 Section 74 & 75: Review-based User Learning.
    eta_review = 0.02
    target = min(U_k + 0.10, 1.0) if prefer_more else max(U_k - 0.10, 0.0)
    U_after = 0.98 * U_before + 0.02 * target
    """
    valid_claims = [c for c in preference_claims if c.confidence >= 0.75 and c.axis in TASTE_AXES]
    if not valid_claims:
        return list(user_vector), False, []

    u_after = list(user_vector)
    impacts: List[Dict[str, Any]] = []

    for claim in valid_claims:
        k = TASTE_AXES.index(claim.axis)
        u_before_val = u_after[k]

        if claim.direction == "prefer_more":
            target = min(u_before_val + 0.10, 1.0)
        else:
            target = max(u_before_val - 0.10, 0.0)

        # Learning update
        updated_val = 0.98 * u_before_val + 0.02 * target
        u_after[k] = round(updated_val, 4)

        axis_kor = AXIS_LABELS[k]
        impacts.append({
            "axis": claim.axis,
            "axis_label": axis_kor,
            "before": round(u_before_val * 100.0, 1),
            "after": round(u_after[k] * 100.0, 1),
            "evidence_text": claim.evidence_text,
            "direction": claim.direction,
        })

    return u_after, True, impacts
