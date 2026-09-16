export const AXES = [
  "sweet",
  "salty",
  "sour",
  "umami",
  "spicy",
  "nutty",
] as const;
export const LABELS = ["단맛", "짠맛", "신맛", "감칠맛", "매운맛", "고소함"];
export type Vector = number[];
export type Food = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  description: string;
  vector: Vector;
  color: string;
  vector_version: string;
};
export type Choice = {
  selected: string;
  rejected: string;
  question_id: string;
  sequence: number;
};
export type Context = { address: string; time: string; weather: string };
export type Order = {
  id: string;
  menu_id: string;
  food_id: string;
  vector: Vector;
  context: Context;
  repeat_order: boolean;
  applied: boolean;
  created_at: string;
};
export type Claim = {
  axis: (typeof AXES)[number];
  level: number;
  comparative: boolean;
  evidence: string;
  review_id: string;
};
export type Menu = {
  id: string;
  food_id: string;
  name: string;
  price: number;
  rating: number;
  vector: Vector;
  claims: Claim[];
  source_type: string;
  evidence_count: number;
  description: string;
};
export const VERSION = "taste-v1.0";
export const clip = (n: number) => Math.max(0, Math.min(1, n));
export const distance = (a: Vector, b: Vector) =>
  Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / 6);
export const match = (a: Vector, b: Vector) => 100 * (1 - distance(a, b));
export function estimate(choices: Choice[], foods: Food[]): Vector {
  const map = new Map(foods.map((f) => [f.id, f.vector]));
  // PRD 8.2: RMS-distance logistic likelihood, beta=8, L2 prior=0.05.
  const loss = (u: Vector) =>
    choices.reduce((total, c) => {
      const selected = map.get(c.selected),
        rejected = map.get(c.rejected);
      if (!selected || !rejected) throw new Error("알 수 없는 음식입니다.");
      const z = 8 * (distance(u, rejected) - distance(u, selected));
      return total + Math.log1p(Math.exp(-z));
    }, 0) +
    0.05 * u.reduce((s, v) => s + (v - 0.5) ** 2, 0);
  let u = Array(6).fill(0.5),
    best = loss(u);
  // Deterministic bounded coordinate descent; avoids an optimization service.
  for (const step of [0.2, 0.1, 0.05, 0.02, 0.01, 0.005, 0.001]) {
    for (let round = 0; round < 70; round++) {
      let improved = false;
      for (let axis = 0; axis < 6; axis++)
        for (const dir of [-1, 1]) {
          const candidate = [...u];
          candidate[axis] = clip(candidate[axis] + dir * step);
          const value = loss(candidate);
          if (value < best - 1e-10) {
            u = candidate;
            best = value;
            improved = true;
          }
        }
      if (!improved) break;
    }
  }
  return u.map((n) => Math.round(n * 10000) / 10000);
}
const COVERAGE = [
  ["bulgogi", "gukbap"],
  ["ramen", "porridge"],
  ["naengmyeon", "udon"],
  ["kimchi", "salad"],
  ["jeyuk", "donkatsu"],
  ["kongguksu", "pho"],
];
export function question(choices: Choice[], foods: Food[]): [Food, Food] {
  const map = new Map(foods.map((f) => [f.id, f]));
  if (choices.length < 6)
    return COVERAGE[choices.length].map((id) => map.get(id)!) as [Food, Food];
  const u = estimate(choices, foods);
  const evidence = Array(6).fill(0);
  for (const c of choices)
    for (let k = 0; k < 6; k++)
      evidence[k] += Math.abs(
        map.get(c.selected)!.vector[k] - map.get(c.rejected)!.vector[k],
      );
  const uncertain = evidence.indexOf(Math.min(...evidence));
  const used = new Set(
    choices.map((c) => [c.selected, c.rejected].sort().join(":")),
  );
  let result: [Food, Food] = [foods[0], foods[1]],
    best = -Infinity;
  for (let a = 0; a < foods.length; a++)
    for (let b = a + 1; b < foods.length; b++) {
      if (used.has([foods[a].id, foods[b].id].sort().join(":"))) continue;
      const contrast = Math.abs(
        foods[a].vector[uncertain] - foods[b].vector[uncertain],
      );
      const ambiguity = Math.abs(
        distance(u, foods[a].vector) - distance(u, foods[b].vector),
      );
      const score = contrast - ambiguity * 0.7;
      if (score > best) {
        best = score;
        result = [foods[a], foods[b]];
      }
    }
  return result;
}
export function currentVector(
  base: Vector,
  orders: Order[],
  context: Context,
): Vector {
  if (!orders.length) return [...base];
  const mean = (rows: Order[]) =>
    AXES.map(
      (_, k) => rows.reduce((sum, o) => sum + o.vector[k], 0) / rows.length,
    );
  const overall = mean(orders),
    output = [...base];
  const specs = [
    ["address", 0.4, 10],
    ["time", 0.3, 12],
    ["weather", 0.2, 20],
  ] as const;
  for (const [key, scale, prior] of specs) {
    if (context[key] === "unknown") continue;
    const rows = orders.filter((o) => o.context[key] === context[key]);
    if (!rows.length) continue;
    const local = mean(rows),
      weight = (scale * rows.length) / (rows.length + prior);
    for (let k = 0; k < 6; k++) output[k] += weight * (local[k] - overall[k]);
  }
  return output.map(clip);
}
export function rank<T extends { id: string; vector: Vector }>(
  items: T[],
  vector: Vector,
) {
  return items
    .map((item) => ({ ...item, score: match(vector, item.vector) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function reason(user: Vector, food: Vector) {
  const axes = AXES.map((_, i) => ({ i, d: Math.abs(user[i] - food[i]) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 2);
  return `${LABELS[axes[0].i]}과 ${LABELS[axes[1].i]}의 강도가 내 취향과 가까워요.`;
}
export function timeSegment(date = new Date()) {
  const h = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "numeric",
      hourCycle: "h23",
    }).format(date),
  );
  return h >= 6 && h < 11
    ? "breakfast"
    : h < 14 && h >= 11
      ? "lunch"
      : h >= 14 && h < 17
        ? "afternoon"
        : h >= 17 && h < 21
          ? "dinner"
          : "late-night";
}
export function restaurantVectors(
  base: Vector,
  menus: { id: string; claims: Claim[] }[],
) {
  return menus.map((menu) => ({
    id: menu.id,
    vector: AXES.map((axis, k) => {
      const claims = menu.claims.filter((c) => c.axis === axis);
      if (!claims.length) return base[k];
      const raw = (cs: Claim[]) =>
        cs.reduce((s, c) => s + c.level * (c.comparative ? 1.25 : 1), 0) /
        cs.length;
      const peers = menus
        .map((m) => m.claims.filter((c) => c.axis === axis))
        .filter((cs) => cs.length)
        .map(raw);
      if (peers.length < 2) return base[k];
      const value = raw(claims),
        less = peers.filter((v) => v < value).length,
        equal = peers.filter((v) => v === value).length;
      const percentile = (less + (equal - 1) / 2) / (peers.length - 1);
      const n = new Set(claims.map((c) => c.review_id)).size;
      return clip(base[k] + (2 * (percentile - 0.5) * 0.15 * n) / (n + 10));
    }),
  }));
}
