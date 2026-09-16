import math
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Tuple, Optional

TASTE_AXES = ["sweet", "salty", "sour", "umami", "spicy", "nutty"]
AXIS_LABELS = ["단맛", "짠맛", "신맛", "감칠맛", "매운맛", "고소함"]

DEFAULT_COVERAGE_PAIRS = [
    ["bulgogi", "gukbap"],
    ["ramen", "porridge"],
    ["naengmyeon", "udon"],
    ["kimchi", "salad"],
    ["jeyuk", "donkatsu"],
    ["kongguksu", "pho"],
]

def clip(x: float, low: float = 0.0, high: float = 1.0) -> float:
    return max(low, min(high, x))

def distance(a: List[float], b: List[float]) -> float:
    """RMS distance across 6 dimensions."""
    if len(a) != 6 or len(b) != 6:
        raise ValueError("Vectors must have exactly 6 dimensions.")
    variance = sum((a[i] - b[i]) ** 2 for i in range(6)) / 6.0
    return math.sqrt(variance)

def match_score(a: List[float], b: List[float]) -> float:
    """Match percentage: 100 * (1 - RMS distance)."""
    return 100.0 * (1.0 - distance(a, b))

def estimate_u_base(choices: List[Dict[str, Any]], food_vectors: Dict[str, List[float]]) -> List[float]:
    """
    Estimate U_base using Bounded Coordinate Descent.
    Loss = -sum(log(P(actual))) + 0.05 * ||U - 0.5||^2
    where z = 8 * (d(U, rejected) - d(U, selected))
    """
    if not choices:
        return [0.5] * 6

    def compute_loss(u: List[float]) -> float:
        total = 0.0
        for c in choices:
            selected_id = c["selected"]
            rejected_id = c["rejected"]
            if selected_id not in food_vectors or rejected_id not in food_vectors:
                raise ValueError(f"Unknown food ID: {selected_id} or {rejected_id}")
            sel = food_vectors[selected_id]
            rej = food_vectors[rejected_id]
            z = 8.0 * (distance(u, rej) - distance(u, sel))
            if z >= 40.0:
                total += math.exp(-z)
            elif z <= -40.0:
                total += -z
            else:
                total += math.log1p(math.exp(-z))
        reg = 0.05 * sum((u[k] - 0.5) ** 2 for k in range(6))
        return total + reg

    u = [0.5] * 6
    best_loss = compute_loss(u)

    steps = [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001]
    for step in steps:
        for _ in range(70):
            improved = False
            for axis in range(6):
                for direction in (-1.0, 1.0):
                    candidate = list(u)
                    candidate[axis] = clip(candidate[axis] + direction * step)
                    cand_loss = compute_loss(candidate)
                    if cand_loss < best_loss - 1e-10:
                        u = candidate
                        best_loss = cand_loss
                        improved = True
            if not improved:
                break

    return [round(val, 4) for val in u]

def get_next_question(
    choices: List[Dict[str, Any]],
    foods: List[Dict[str, Any]],
    coverage_pairs: Optional[List[List[str]]] = None
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Returns the next pair of foods for Pairwise Onboarding.
    Q1-Q6: Coverage pairs.
    Q7-Q10: Adaptive uncertainty reduction.
    """
    coverage = coverage_pairs or DEFAULT_COVERAGE_PAIRS
    food_map = {f["id"]: f for f in foods}

    if len(choices) < len(coverage):
        pair_ids = coverage[len(choices)]
        return food_map[pair_ids[0]], food_map[pair_ids[1]]

    vector_map = {f["id"]: f["vector"] for f in foods}
    u_temp = estimate_u_base(choices, vector_map)

    # Calculate evidence per axis
    evidence = [0.0] * 6
    for c in choices:
        sel_vec = vector_map[c["selected"]]
        rej_vec = vector_map[c["rejected"]]
        for k in range(6):
            evidence[k] += abs(sel_vec[k] - rej_vec[k])

    uncertain_axis = evidence.index(min(evidence))

    used_pairs = {":".join(sorted([c["selected"], c["rejected"]])) for c in choices}

    best_pair: Optional[Tuple[Dict[str, Any], Dict[str, Any]]] = None
    best_utility = -float("inf")

    for i in range(len(foods)):
        for j in range(i + 1, len(foods)):
            pair_key = ":".join(sorted([foods[i]["id"], foods[j]["id"]]))
            if pair_key in used_pairs:
                continue

            fa = foods[i]["vector"]
            fb = foods[j]["vector"]

            target_contrast = abs(fa[uncertain_axis] - fb[uncertain_axis])
            ambiguity = abs(distance(u_temp, fa) - distance(u_temp, fb))
            utility = target_contrast - 0.7 * ambiguity

            if utility > best_utility:
                best_utility = utility
                best_pair = (foods[i], foods[j])

    if best_pair is None:
        return foods[0], foods[1]

    return best_pair

def current_vector(
    base_vector: List[float],
    orders: List[Dict[str, Any]],
    context: Dict[str, str]
) -> List[float]:
    """
    Calculates U_current = U_base + Place + Time + Weather with shrinkage.
    """
    if not orders:
        return list(base_vector)

    def mean_vector(order_rows: List[Dict[str, Any]]) -> List[float]:
        n = len(order_rows)
        return [sum(o["vector"][k] for o in order_rows) / n for k in range(6)]

    overall_mean = mean_vector(orders)
    output = list(base_vector)

    specs = [
        ("address", 0.4, 10.0),
        ("time", 0.3, 12.0),
        ("weather", 0.2, 20.0),
    ]

    for key, scale, prior in specs:
        ctx_val = context.get(key, "unknown")
        if ctx_val == "unknown":
            continue

        matched_orders = [o for o in orders if o.get("context", {}).get(key) == ctx_val]
        if not matched_orders:
            continue

        local_mean = mean_vector(matched_orders)
        n = len(matched_orders)
        weight = (scale * n) / (n + prior)

        for k in range(6):
            output[k] += weight * (local_mean[k] - overall_mean[k])

    return [clip(round(v, 4)) for v in output]

def time_segment(dt: Optional[datetime] = None) -> str:
    """Classifies time of day in Asia/Seoul (UTC+9)."""
    if dt is None:
        seoul_tz = timezone(timedelta(hours=9))
        dt = datetime.now(seoul_tz)
    elif dt.tzinfo is None:
        seoul_tz = timezone(timedelta(hours=9))
        dt = dt.replace(tzinfo=seoul_tz)

    hour = dt.hour
    if 6 <= hour < 11:
        return "breakfast"
    elif 11 <= hour < 14:
        return "lunch"
    elif 14 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "dinner"
    else:
        return "late-night"

def generate_reason(user_vec: List[float], food_vec: List[float]) -> str:
    """Generates user-facing match explanation from closest taste axes."""
    diffs = sorted(
        [(abs(user_vec[i] - food_vec[i]), i) for i in range(6)],
        key=lambda x: x[0]
    )
    first_axis = AXIS_LABELS[diffs[0][1]]
    second_axis = AXIS_LABELS[diffs[1][1]]
    return f"{first_axis}과 {second_axis}의 강도가 내 취향과 가까워요."
