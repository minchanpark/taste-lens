import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
  distance,
  estimate,
  question,
  rank,
  currentVector,
  restaurantVectors,
  timeSegment,
  type Food,
  type Choice,
  type Claim,
  type Order,
} from "../src/lib/taste";
import seeds from "./foods.json";
const foods = seeds as Food[];
test("RMS distance has expected endpoints and ranking is stable", () => {
  assert.equal(distance(Array(6).fill(0), Array(6).fill(1)), 1);
  assert.equal(distance(Array(6).fill(0.5), Array(6).fill(0.5)), 0);
  const u = foods[0].vector;
  assert.equal(rank(foods, u)[0].id, foods[0].id);
  assert.deepEqual(rank(foods, u), rank([...foods].reverse(), u));
});
test("10 questions cover all axes, refine without duplicate pairs, and produce bounded reproducible profile", () => {
  const answers: Choice[] = [];
  const axisCoverage = Array(6).fill(0);
  for (let i = 0; i < 10; i++) {
    const [a, b] = question(answers, foods);
    if (i < 6)
      a.vector.forEach(
        (n, k) => (axisCoverage[k] += Math.abs(n - b.vector[k])),
      );
    assert.notEqual(a.id, b.id);
    assert.ok(
      !answers.some(
        (c) =>
          [c.selected, c.rejected].sort().join() === [a.id, b.id].sort().join(),
      ),
    );
    answers.push({
      selected: a.id,
      rejected: b.id,
      question_id: `q${i}`,
      sequence: i + 1,
    });
  }
  assert.ok(axisCoverage.every((n) => n > 0.5));
  const u = estimate(answers, foods);
  assert.ok(u.every((n) => n >= 0 && n <= 1));
  assert.deepEqual(u, estimate(answers, foods));
  const opposite = estimate(
    answers.map((c) => ({ ...c, selected: c.rejected, rejected: c.selected })),
    foods,
  );
  assert.ok(distance(u, opposite) > 0.2);
});
test("zero context data or one identical context preserves base; diversified data uses shrinkage", () => {
  const base = Array(6).fill(0.5),
    ctx = { address: "home", time: "dinner", weather: "normal" };
  assert.deepEqual(currentVector(base, [], ctx), base);
  const orders = [
    { vector: Array(6).fill(0.9), context: ctx },
    { vector: Array(6).fill(0.1), context: { ...ctx, address: "work" } },
  ] as Order[];
  assert.deepEqual(currentVector(base, [orders[0]], ctx), base);
  const adjusted = currentVector(base, orders, ctx);
  assert.ok(
    adjusted.every((x) => Math.abs(x - (0.5 + (0.4 / 11) * 0.4)) < 1e-10),
  );
});
test("restaurant ties stay neutral, missing evidence falls back, sparse evidence is shrunk", () => {
  const base = Array(6).fill(0.5);
  const c = (level: number): Claim => ({
    axis: "sweet",
    level,
    comparative: false,
    evidence: "fixture",
    review_id: "r1",
  });
  const menus = [
    { id: "a", claims: [c(2)] },
    { id: "b", claims: [c(-2)] },
    { id: "missing", claims: [] },
  ];
  const result = restaurantVectors(base, menus);
  assert.ok(result[0].vector[0] > 0.5 && result[0].vector[0] < 0.52);
  assert.ok(result[1].vector[0] < 0.5);
  assert.deepEqual(result[2].vector, base);
  assert.deepEqual(
    restaurantVectors(base, [
      { id: "a", claims: [c(1)] },
      { id: "b", claims: [c(1)] },
    ])[0].vector,
    base,
  );
});
test("Korean time segmentation handles midnight and lunch independently of runtime timezone", () => {
  assert.equal(timeSegment(new Date("2026-09-13T15:00:00Z")), "late-night");
  assert.equal(timeSegment(new Date("2026-09-14T03:00:00Z")), "lunch");
});
