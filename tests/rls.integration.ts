import { test } from "node:test";
import { strict as assert } from "node:assert";
import { createClient } from "@supabase/supabase-js";
process.loadEnvFile(".env.local");
try {
  process.loadEnvFile(".env.test.local");
} catch {}
const make = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false } },
  );
test("real Supabase catalog permissions, ownership RLS, vector validation, atomic order idempotency", async () => {
  assert.ok(
    process.env.TEST_EMAIL,
    "Disposable test users must be provisioned before this integration test.",
  );
  const anon = make(),
    a = make(),
    b = make();
  const catalog = await anon.from("tl_foods").select("*");
  assert.equal(catalog.error, null);
  assert.equal(catalog.data?.length, 24);
  const unauth = await anon.from("tl_profiles").select("*");
  assert.ok(unauth.error);
  const authA = await a.auth.signInWithPassword({
    email: process.env.TEST_EMAIL!,
    password: process.env.TEST_PASSWORD!,
  });
  assert.equal(authA.error, null);
  const authB = await b.auth.signInWithPassword({
    email: process.env.TEST_OTHER_EMAIL!,
    password: process.env.TEST_OTHER_PASSWORD!,
  });
  assert.equal(authB.error, null);
  const uidA = authA.data.user!.id,
    uidB = authB.data.user!.id;
  const denied = await a
    .from("tl_foods")
    .update({ name: "tamper" })
    .eq("id", "jeyuk");
  assert.ok(denied.error);
  const own = await b.rpc("tl_save_profile", {
    p_vector: Array(6).fill(0.5),
    p_responses: Array(10).fill({ selected: "jeyuk", rejected: "naengmyeon" }),
  });
  assert.equal(own.error, null);
  const stolen = await a.from("tl_profiles").select("*").eq("user_id", uidB);
  assert.equal(stolen.error, null);
  assert.deepEqual(stolen.data, []);
  const reassign = await b
    .from("tl_profiles")
    .update({ user_id: uidA })
    .eq("user_id", uidB);
  assert.ok(reassign.error);
  const bad = await b.rpc("tl_save_profile", {
    p_vector: [2, 0, 0, 0, 0, 0],
    p_responses: Array(10).fill({}),
  });
  assert.ok(bad.error);
  const context = { address: "home", time: "dinner", weather: "normal" },
    id = crypto.randomUUID();
  const results = await Promise.all([
    b.rpc("tl_record_order", {
      p_id: id,
      p_menu_id: "jeyuk-1",
      p_context: context,
    }),
    b.rpc("tl_record_order", {
      p_id: id,
      p_menu_id: "jeyuk-1",
      p_context: context,
    }),
  ]);
  results.forEach((r) => assert.equal(r.error, null));
  const recorded = await b.from("tl_orders").select("*").eq("id", id);
  assert.equal(recorded.data?.length, 1);
  const leakage = await a.from("tl_orders").select("*").eq("user_id", uidB);
  assert.deepEqual(leakage.data, []);
  const batch = await b.rpc("tl_apply_orders");
  assert.equal(batch.error, null);
  const again = await b.rpc("tl_apply_orders");
  assert.deepEqual(again.data.vector, batch.data.vector);
  const second = await b.rpc("tl_record_order", {
    p_id: crypto.randomUUID(),
    p_menu_id: "jeyuk-1",
    p_context: context,
  });
  assert.equal(second.data.repeat_order, true);
  const repeat = await b.rpc("tl_apply_orders");
  const seed = catalog.data!.find((x) => x.id === "jeyuk")!.vector;
  for (let k = 0; k < 6; k++)
    assert.ok(
      Math.abs(
        repeat.data.vector[k] - (0.82 * batch.data.vector[k] + 0.18 * seed[k]),
      ) < 1e-9,
    );
  await Promise.all([a.auth.signOut({ scope: "local" }), b.auth.signOut({ scope: "local" })]);
});
