import { writeFileSync } from "node:fs";
import {
  restaurantVectors,
  VERSION,
  type Food,
  type Claim,
} from "../src/lib/taste";
const rows: [string, string, string, string, string, number[]][] = [
  [
    "jeyuk",
    "제육볶음",
    "한식",
    "🥘",
    "불향 가득, 매콤한 한 입",
    [0.55, 0.65, 0.1, 0.8, 0.75, 0.4],
  ],
  [
    "bulgogi",
    "불고기",
    "한식",
    "🥩",
    "달큰한 양념과 부드러운 소고기",
    [0.8, 0.55, 0.05, 0.8, 0.05, 0.4],
  ],
  [
    "gukbap",
    "돼지국밥",
    "한식",
    "🍲",
    "속까지 든든해지는 깊은 국물",
    [0.05, 0.55, 0.05, 0.9, 0.1, 0.55],
  ],
  [
    "ramen",
    "라멘",
    "일식",
    "🍜",
    "진한 육수에 감칠맛이 차곡차곡",
    [0.15, 0.85, 0.05, 0.95, 0.15, 0.55],
  ],
  [
    "porridge",
    "전복죽",
    "한식",
    "🥣",
    "편안하고 담백한 한 그릇",
    [0.1, 0.2, 0.02, 0.55, 0.0, 0.4],
  ],
  [
    "naengmyeon",
    "물냉면",
    "한식",
    "🧊",
    "새콤한 육수와 시원한 면발",
    [0.35, 0.45, 0.8, 0.4, 0.1, 0.15],
  ],
  [
    "udon",
    "우동",
    "일식",
    "🍜",
    "따뜻한 국물, 쫄깃한 면발",
    [0.15, 0.5, 0.05, 0.65, 0.0, 0.1],
  ],
  [
    "kimchi",
    "김치찌개",
    "한식",
    "🍲",
    "칼칼하고 진한 밥 한 공기의 친구",
    [0.1, 0.7, 0.6, 0.9, 0.7, 0.2],
  ],
  [
    "salad",
    "그린 샐러드",
    "샐러드",
    "🥗",
    "산뜻하고 아삭한 초록 한 접시",
    [0.15, 0.15, 0.4, 0.15, 0.0, 0.15],
  ],
  [
    "donkatsu",
    "돈카츠",
    "일식",
    "🍱",
    "바삭한 튀김옷 속 촉촉함",
    [0.3, 0.45, 0.05, 0.65, 0.0, 0.7],
  ],
  [
    "kongguksu",
    "콩국수",
    "한식",
    "🥛",
    "부드러운 콩의 진한 고소함",
    [0.1, 0.15, 0.02, 0.35, 0.0, 0.95],
  ],
  [
    "pho",
    "쌀국수",
    "아시안",
    "🍜",
    "향긋하고 맑은 육수 한 그릇",
    [0.2, 0.5, 0.3, 0.7, 0.1, 0.1],
  ],
  [
    "tteokbokki",
    "떡볶이",
    "분식",
    "🌶️",
    "달콤하게 시작해서 매콤하게",
    [0.8, 0.6, 0.05, 0.55, 0.85, 0.1],
  ],
  [
    "pizza",
    "마르게리타 피자",
    "양식",
    "🍕",
    "토마토와 치즈의 기분 좋은 균형",
    [0.25, 0.65, 0.4, 0.75, 0.0, 0.65],
  ],
  [
    "pasta",
    "크림 파스타",
    "양식",
    "🍝",
    "크리미하고 부드러운 여유",
    [0.25, 0.5, 0.02, 0.65, 0.05, 0.9],
  ],
  [
    "burger",
    "치즈버거",
    "양식",
    "🍔",
    "육즙과 치즈가 만드는 꽉 찬 맛",
    [0.4, 0.75, 0.2, 0.85, 0.05, 0.6],
  ],
  [
    "chicken",
    "양념치킨",
    "치킨",
    "🍗",
    "바삭함에 더한 달콤 매콤한 소스",
    [0.85, 0.6, 0.15, 0.65, 0.55, 0.5],
  ],
  [
    "fried-chicken",
    "후라이드 치킨",
    "치킨",
    "🍗",
    "바삭 고소한 클래식",
    [0.1, 0.65, 0.02, 0.7, 0.1, 0.85],
  ],
  [
    "bibimbap",
    "비빔밥",
    "한식",
    "🥗",
    "다채로운 나물에 고소한 참기름",
    [0.2, 0.45, 0.1, 0.6, 0.4, 0.7],
  ],
  [
    "mala",
    "마라탕",
    "중식",
    "🥘",
    "얼얼하고 강렬한 국물의 매력",
    [0.1, 0.8, 0.05, 0.85, 1, 0.55],
  ],
  [
    "jjajang",
    "짜장면",
    "중식",
    "🍜",
    "달큰한 춘장에 볶아낸 감칠맛",
    [0.65, 0.65, 0.02, 0.8, 0.0, 0.5],
  ],
  [
    "sushi",
    "연어초밥",
    "일식",
    "🍣",
    "산뜻한 밥 위 부드러운 연어",
    [0.3, 0.4, 0.45, 0.65, 0.05, 0.5],
  ],
  [
    "padthai",
    "팟타이",
    "아시안",
    "🍝",
    "새콤달콤한 소스와 고소한 땅콩",
    [0.7, 0.55, 0.65, 0.65, 0.25, 0.75],
  ],
  [
    "sundubu",
    "순두부찌개",
    "한식",
    "🍲",
    "부드러운 두부에 칼칼한 국물",
    [0.1, 0.6, 0.1, 0.85, 0.7, 0.3],
  ],
];
const colors = [
  "#fae4d5",
  "#f2e7d8",
  "#e5eadb",
  "#f5e8ce",
  "#ece8e0",
  "#dfecec",
];
export const foods: Food[] = rows.map(
  ([id, name, category, emoji, description, vector], i) => ({
    id,
    name,
    category,
    emoji,
    description,
    vector,
    color: colors[i % colors.length],
    vector_version: VERSION,
  }),
);
const profiles = [
  {
    name: "소담한 상",
    description: "은은한 단맛, 부드러운 풍미",
    levels: [2, -1, -1, 1, -2, 1],
  },
  {
    name: "화끈한 부엌",
    description: "선명한 간과 매콤한 풍미",
    levels: [-1, 2, 1, 2, 2, -1],
  },
  {
    name: "담백한 식탁",
    description: "가벼운 간, 고소한 마무리",
    levels: [-2, -2, 0, 0, -1, 2],
  },
];
const axes = ["sweet", "salty", "sour", "umami", "spicy", "nutty"] as const;
const labels = ["단맛", "짠맛", "신맛", "감칠맛", "매운맛", "고소함"];
const menus = foods.flatMap((food, fi) => {
  const group = profiles.map((p, pi) => {
    const id = `${food.id}-${pi + 1}`;
    const claims: Claim[] = Array.from({ length: 4 }, (_, ri) =>
      axes.map((axis, k) => ({
        axis,
        level: p.levels[k],
        comparative: ri % 2 === 0,
        evidence: `${food.name}의 ${labels[k]}이 ${ri % 2 === 0 ? "다른 곳보다 " : ""}${p.levels[k] > 0 ? "강한" : p.levels[k] < 0 ? "약한" : "보통인"} 편이에요.`,
        review_id: `${id}-review-${ri + 1}`,
      })),
    ).flat();
    return {
      id,
      food_id: food.id,
      name: `${p.name} · ${food.name}`,
      price: 8500 + fi * 200 + pi * 1500,
      rating: [4.6, 4.8, 4.9][pi],
      description: p.description,
      claims,
      source_type: "synthetic",
      evidence_count: 4,
    };
  });
  const vectors = restaurantVectors(food.vector, group);
  return group.map((m, i) => ({ ...m, vector: vectors[i].vector }));
});
const sqlLiteral = (value: unknown) =>
  `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
const sql = `-- 24 food vectors are manually specified engineering priors.\n-- All 72 restaurants and 288 reviews are AI-authored synthetic fixtures, NOT customer reviews.\ninsert into public.tl_foods (id,name,category,emoji,description,vector,color,vector_version) select id,name,category,emoji,description,vector,color,vector_version from jsonb_to_recordset(${sqlLiteral(foods)}) as f(id text,name text,category text,emoji text,description text,vector jsonb,color text,vector_version text);\ninsert into public.tl_menus (id,food_id,name,price,rating,description,claims,source_type,evidence_count,vector) select id,food_id,name,price,rating,description,claims,source_type,evidence_count,vector from jsonb_to_recordset(${sqlLiteral(menus)}) as m(id text,food_id text,name text,price integer,rating numeric,description text,claims jsonb,source_type text,evidence_count integer,vector jsonb);\n`;
writeFileSync("supabase/seed.sql", sql);
writeFileSync("tests/foods.json", JSON.stringify(foods, null, 2));
