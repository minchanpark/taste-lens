"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Bike,
  Search,
  ShoppingBag,
  ChevronDown,
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Compass,
  Flame,
  Heart,
  History,
  House,
  Leaf,
  LoaderCircle,
  LogOut,
  MapPin,
  RotateCcw,
  Sparkles,
  Star,
  Sun,
  UserRound,
  Utensils,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AXES,
  LABELS,
  currentVector,
  estimate,
  match,
  question,
  rank,
  reason,
  timeSegment,
  type Choice,
  type Context,
  type Food,
  type Menu,
  type Order,
  type Vector,
} from "@/lib/taste";
import Radar from "./radar";
import DeliveryHome from "./delivery-home";
import DeliveryCart from "./delivery-cart";
import { foodPhoto, type Cart, type Checkout } from "@/lib/delivery";
type Profile = {
  vector: Vector;
  source: string;
  baseline_at: string;
  updated_at: string;
};
type View = "discover" | "profile" | "history" | "account" | "about";
const ADDRESS = { home: "집", school: "학교", work: "회사", other: "기타" };
const TIMES: Record<string, string> = {
  breakfast: "아침",
  lunch: "점심",
  afternoon: "오후",
  dinner: "저녁",
  "late-night": "야식",
};
const WEATHER: Record<string, string> = {
  normal: "온화한 날",
  rain: "비·눈",
  hot: "더운 날",
  cold: "추운 날",
  unknown: "날씨 확인 중",
};
function errorText(error: unknown) {
  const raw =
    error instanceof Error
      ? error.message
      : (error as { message?: string })?.message || "요청을 완료하지 못했어요.";
  if (raw.includes("Invalid login"))
    return "이메일 또는 비밀번호를 확인해 주세요.";
  if (raw.includes("Email not confirmed"))
    return "받은 메일에서 이메일 인증을 완료한 뒤 로그인해 주세요.";
  if (raw.includes("rate limit"))
    return "요청이 많아 잠시 제한되었어요. 잠시 후 다시 시도해 주세요.";
  return raw;
}
export default function TasteApp() {
  const [cart, setCart] = useState<Cart | null>(null),
    [cartOpen, setCartOpen] = useState(false),
    [pendingCart, setPendingCart] = useState<Cart | null>(null),
    [completedCheckout, setCompletedCheckout] = useState<Checkout | null>(null),
    [mode, setMode] = useState<"delivery" | "pickup">("delivery"),
    [locationOpen, setLocationOpen] = useState(false),
    [checkouts, setCheckouts] = useState<Checkout[]>([]);
  const checkoutId = useRef<string | null>(null);
  function changeMode(next: "delivery" | "pickup") {
    setMode(next);
    checkoutId.current = null;
  }
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem("tl-cart") || "null");
      if (
        c &&
        typeof c.menu?.id === "string" &&
        typeof c.food?.id === "string" &&
        Number.isInteger(c.quantity) &&
        c.quantity >= 1 &&
        c.quantity <= 10
      )
        setCart(c);
    } catch {}
  }, []);
  function persistCart(c: Cart | null) {
    setCart(c);
    checkoutId.current = null;
    localStorage.setItem("tl-cart", JSON.stringify(c));
  }
  function addToCart(menu: Menu, food: Food) {
    setCompletedCheckout(null);
    if (cart && cart.menu.id !== menu.id) {
      setPendingCart({ menu, food, quantity: 1 });
      setCartOpen(true);
      setSelected(null);
      return;
    }
    persistCart({
      menu,
      food,
      quantity: Math.min(10, (cart?.quantity || 0) + 1),
    });
    setSelected(null);
    setNotice(`${food.name}을 장바구니에 담았어요.`);
  }
  async function checkout() {
    if (!user) {
      setCartOpen(false);
      setAuthOpen(true);
      setNotice("로그인한 뒤 장바구니에서 주문을 완료해 주세요.");
      return;
    }
    if (!cart) return;
    await action(async () => {
      checkoutId.current ||= crypto.randomUUID();
      const { data, error } = await supabase!.rpc("tl_checkout", {
        p_id: checkoutId.current,
        p_menu_id: cart.menu.id,
        p_quantity: cart.quantity,
        p_mode: mode,
        p_context: context,
      });
      if (error) throw error;
      setCompletedCheckout(data);
      setCheckouts((cs) => [data, ...cs.filter((c) => c.id !== data.id)]);
      persistCart(null);
      const r = await supabase!
        .from("tl_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (r.error) {
        setNotice(
          "주문은 저장했지만 내역을 불러오지 못했어요. 새로고침해 주세요.",
        );
      } else setOrders(r.data || []);
    });
  }
  const [foods, setFoods] = useState<Food[]>([]),
    [user, setUser] = useState<User | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [view, setView] = useState<View>("discover"),
    [authOpen, setAuthOpen] = useState(false),
    [signup, setSignup] = useState(false),
    [onboarding, setOnboarding] = useState(false),
    [choices, setChoices] = useState<Choice[]>([]);
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [authMessage, setAuthMessage] = useState("");
  const [context, setContext] = useState<Context>({
      address: "home",
      time: "dinner",
      weather: "unknown",
    }),
    [city, setCity] = useState("seoul"),
    [temp, setTemp] = useState<number | null>(null),
    [weatherStatus, setWeatherStatus] = useState("");
  const [category, setCategory] = useState("전체"),
    [selected, setSelected] = useState<Food | null>(null),
    [menus, setMenus] = useState<Menu[]>([]),
    [menuLoading, setMenuLoading] = useState(false),
    [sort, setSort] = useState("taste"),
    [expanded, setExpanded] = useState<string | null>(null);
  const [recommendationId, setRecommendationId] = useState<string | null>(null),
    [feedback, setFeedback] = useState<string | null>(null),
    [retake, setRetake] = useState(false);
  const lock = useRef(false),
    recKey = useRef(""),
    orderKey = useRef<{ menu: string; id: string } | null>(null),
    dialogRef = useRef<HTMLDialogElement>(null);
  const loadUser = useCallback(async (u: User | null) => {
    setUser(u);
    setProfile(null);
    setOrders([]);
    recKey.current = "";
    setRecommendationId(null);
    setFeedback(null);
    if (!u || !supabase) return;
    const [p, o, checkoutRows] = await Promise.all([
      supabase
        .from("tl_profiles")
        .select("*")
        .eq("user_id", u.id)
        .maybeSingle(),
      supabase
        .from("tl_orders")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("tl_checkouts")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false }),
    ]);
    if (p.error || o.error || checkoutRows.error)
      throw p.error || o.error || checkoutRows.error;
    setCheckouts(checkoutRows.data || []);
    setProfile(p.data);
    setOrders(o.data || []);
  }, []);
  useEffect(() => {
    if (!supabase) {
      setError(
        "Supabase 연결 설정이 필요합니다. .env.local 파일을 확인해 주세요.",
      );
      setLoading(false);
      return;
    }
    let alive = true;
    Promise.all([
      supabase.from("tl_foods").select("*").order("id"),
      supabase.auth.getUser(),
    ])
      .then(async ([f, u]) => {
        if (!alive) return;
        if (f.error) throw f.error;
        setFoods(f.data || []);
        await loadUser(u.data.user);
      })
      .catch((e) => {
        if (alive) setError(errorText(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setOrders([]);
        setCheckouts([]);
      }
      if (event === "SIGNED_IN") setUser(session?.user || null);
    });
    const stored = localStorage.getItem("taste-context");
    if (stored) {
      try {
        const s = JSON.parse(stored);
        if (s.address in ADDRESS)
          setContext((c) => ({ ...c, address: s.address }));
        if (["seoul", "busan", "daejeon", "jeju"].includes(s.city))
          setCity(s.city);
      } catch {}
    }
    setContext((c) => ({ ...c, time: timeSegment() }));
    const timer = setInterval(
      () => setContext((c) => ({ ...c, time: timeSegment() })),
      60000,
    );
    return () => {
      alive = false;
      subscription.unsubscribe();
      clearInterval(timer);
    };
  }, [loadUser]);
  useEffect(() => {
    const abort = new AbortController();
    setContext((c) => ({ ...c, weather: "unknown" }));
    setTemp(null);
    fetch(`/api/weather?city=${city}`, { signal: abort.signal })
      .then((r) => r.json())
      .then((w) => {
        if (abort.signal.aborted) return;
        setContext((c) => ({ ...c, weather: w.weather }));
        setTemp(w.temperature);
        setWeatherStatus(
          w.source === "unavailable"
            ? "날씨 조회 실패 · 보정 제외"
            : "도시 대표 지점 · Open-Meteo",
        );
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setContext((c) => ({ ...c, weather: "unknown" }));
          setWeatherStatus("날씨 조회 실패 · 보정 제외");
        }
      });
    return () => abort.abort();
  }, [city]);
  useEffect(() => {
    localStorage.setItem(
      "taste-context",
      JSON.stringify({ address: context.address, city }),
    );
  }, [context.address, city]);
  const activeOrders = profile
    ? orders.filter((o) => o.created_at >= profile.baseline_at)
    : [];
  const vector = profile
    ? currentVector(profile.vector, activeOrders, context)
    : Array(6).fill(0.5);
  const recommendations = profile ? rank(foods, vector) : foods;
  const displayed = profile
    ? recommendations
        .filter((f) => category === "전체" || f.category === category)
        .slice(0, 5)
    : foods
        .filter((f) => category === "전체" || f.category === category)
        .slice(0, 6);
  const topAxes = AXES.map((_, i) => i)
    .sort((a, b) => vector[b] - vector[a])
    .slice(0, 2);
  useEffect(() => {
    if (!profile || !user || !foods.length || onboarding || !supabase) return;
    const ranking = rank(foods, vector)
        .filter((f) => category === "전체" || f.category === category)
        .slice(0, 5),
      key = JSON.stringify([user.id, vector, context, category]);
    if (recKey.current === key) return;
    recKey.current = key;
    setFeedback(null);
    setRecommendationId(null);
    let stale = false;
    supabase
      .from("tl_recommendations")
      .insert({
        user_id: user.id,
        kind: "food",
        candidates: ranking.map((f, i) => ({
          id: f.id,
          score: f.score,
          rank: i + 1,
        })),
        context,
        vector,
      })
      .select("id")
      .single()
      .then(({ data, error }) => {
        if (stale) return;
        if (error) {
          setNotice("추천은 계산했지만 노출 기록을 저장하지 못했어요.");
          recKey.current = "";
        } else setRecommendationId(data.id);
      });
    return () => {
      stale = true;
    };
    // Content-based dependency keeps ranking logs stable across unrelated UI renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    profile,
    user,
    foods,
    onboarding,
    category,
    JSON.stringify(vector),
    JSON.stringify(context),
  ]);
  const modal =
    authOpen || onboarding || !!selected || retake || cartOpen || locationOpen;
  useEffect(() => {
    if (modal && !dialogRef.current?.open) dialogRef.current?.showModal();
    else if (!modal && dialogRef.current?.open) dialogRef.current?.close();
  }, [modal]);
  async function action(fn: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(errorText(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  function start() {
    setError("");
    setAuthMessage("");
    if (!user) setAuthOpen(true);
    else {
      setChoices([]);
      setOnboarding(true);
    }
  }
  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    await action(async () => {
      if (!supabase) throw new Error("Supabase 설정을 확인해 주세요.");
      if (signup) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          setAuthMessage(
            "인증 메일을 보냈어요. 메일의 링크를 연 뒤 이 화면에서 로그인해 주세요.",
          );
          setSignup(false);
          return;
        }
        await loadUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        await loadUser(data.user);
      }
      setPassword("");
      setAuthOpen(false);
      setNotice("로그인했어요. 저장된 취향이 있다면 자동으로 불러와요.");
    });
  }
  async function choose(food: Food, other: Food) {
    if (choices.length >= 10) return;
    const next = [
      ...choices,
      {
        selected: food.id,
        rejected: other.id,
        question_id: `${choices.length < 6 ? "coverage" : "refinement"}-${choices.length + 1}`,
        sequence: choices.length + 1,
      },
    ];
    setChoices(next);
  }
  async function saveProfile() {
    await action(async () => {
      if (!supabase || !user) throw new Error("먼저 로그인해 주세요.");
      const u = estimate(choices, foods);
      const { data, error } = await supabase.rpc("tl_save_profile", {
        p_vector: u,
        p_responses: choices,
      });
      if (error) throw error;
      setProfile(data);
      setOnboarding(false);
      setView("discover");
      setCategory("전체");
      setNotice("10번의 선택으로 나만의 취향을 저장했어요.");
    });
  }
  async function openFood(food: Food) {
    setSelected(food);
    setMenus([]);
    setExpanded(null);
    setSort(profile ? "taste" : "rating");
    setError("");
    setMenuLoading(true);
    try {
      const { data, error } = await supabase!
        .from("tl_menus")
        .select("*")
        .eq("food_id", food.id);
      if (error) throw error;
      setMenus(data || []);
      if (!user || !profile) return;
      const ranked = rank((data || []) as Menu[], vector);
      const result = await supabase!.from("tl_recommendations").insert({
        user_id: user!.id,
        kind: "restaurant",
        candidates: ranked.map((m, i) => ({
          id: m.id,
          score: m.score,
          rank: i + 1,
        })),
        context,
        vector,
      });
      if (result.error) setNotice("식당 추천 기록 저장에 실패했어요.");
    } catch (e) {
      setError(errorText(e));
    } finally {
      setMenuLoading(false);
    }
  }
  async function applyOrders() {
    await action(async () => {
      const { data, error } = await supabase!.rpc("tl_apply_orders");
      if (error) throw error;
      setProfile(data);
      const result = await supabase!
        .from("tl_orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (result.error) throw result.error;
      setOrders(result.data || []);
      setNotice("새로운 식사 기록을 취향에 반영했어요.");
    });
  }
  async function sendFeedback(answer: string) {
    await action(async () => {
      const { error } = await supabase!.from("tl_feedback").insert({
        user_id: user!.id,
        recommendation_id: recommendationId,
        answer,
      });
      if (error) throw error;
      setFeedback(answer);
    });
  }
  function closeModal() {
    if (busy) return;
    setAuthOpen(false);
    setCartOpen(false);
    setPendingCart(null);
    setLocationOpen(false);
    setSelected(null);
    setRetake(false);
    if (onboarding) {
      setOnboarding(false);
      setNotice("취향 테스트를 잠시 멈췄어요. 다시 시작할 수 있어요.");
    }
    setError("");
  }
  const nav = (v: View, label: string, Icon: typeof Compass) => {
    const active = view === v || (v === "account" && view === "history");
    return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      aria-current={active ? "page" : undefined}
      onClick={() => {
        setView(v);
        setError("");
      }}
    >
      <Icon size={19} />
      <span>{label}</span>
      {active && <span className="nav-dot" />}
    </button>
    );
  };
  return (
    <div className="app-shell">
      <header className="platform-header">
        <div className="platform-header-inner">
          <button
            className="brand"
            onClick={() => setView("discover")}
            aria-label="취향렌즈 홈"
          >
            <span className="brand-icon">
              <Utensils size={21} />
            </span>
            <span>
              취향렌즈<small>TASTE LENS DELIVERY</small>
            </span>
          </button>
          <button
            className="delivery-location"
            onClick={() => setLocationOpen(true)}
          >
            <MapPin size={20} />
            <span>
              <small>어디로 가져다드릴까요?</small>
              <b>
                {
                  {
                    seoul: "서울",
                    busan: "부산",
                    daejeon: "대전",
                    jeju: "제주",
                  }[city]
                }{" "}
                · {ADDRESS[context.address as keyof typeof ADDRESS]}
              </b>
            </span>
            <ChevronDown size={15} />
          </button>
          <nav className="desktop-platform-nav" aria-label="주요 메뉴">
            {nav("discover", "홈", House)}
            {nav("profile", "취향 렌즈", Sparkles)}
            {nav("account", "마이 페이지", UserRound)}
          </nav>
          <div className="platform-account">
            <button
              aria-label="장바구니"
              className="header-cart"
              onClick={() => {
                setCompletedCheckout(null);
                setCartOpen(true);
              }}
            >
              <ShoppingBag size={21} />
              {cart && <span>{cart.quantity}</span>}
            </button>
            <button
              className="platform-login"
              aria-label={user ? "로그아웃" : "이메일 로그인"}
              onClick={() =>
                user
                  ? action(async () => {
                      const { error } = await supabase!.auth.signOut();
                      if (error) throw error;
                      setView("discover");
                    })
                  : setAuthOpen(true)
              }
            >
              <UserRound size={18} />
              <span>{user ? "로그아웃" : "로그인"}</span>
            </button>
          </div>
        </div>
      </header>
      <nav className="platform-bottom-nav" aria-label="주요 메뉴">
        {nav("discover", "홈", House)}
        {nav("profile", "취향 렌즈", Sparkles)}
        {nav("account", "마이 페이지", UserRound)}
      </nav>
      {cart && !modal && (
        <button className="floating-cart" onClick={() => setCartOpen(true)}>
          <span>{cart.quantity}</span>
          <b>장바구니 보기</b>
          <strong>
            {(
              cart.menu.price * cart.quantity +
              (mode === "delivery" ? 2000 : 0)
            ).toLocaleString()}
            원
          </strong>
          <ArrowRight size={18} />
        </button>
      )}
      <div className="workspace">
        <main>
          {notice && (
            <div role="status" className="notice">
              <Check size={16} />
              {notice}
              <button aria-label="알림 닫기" onClick={() => setNotice("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {error && !modal && (
            <div role="alert" className="error">
              {error}
              <button onClick={() => window.location.reload()}>
                다시 불러오기
              </button>
            </div>
          )}
          {loading ? (
            <div className="loading">
              <LoaderCircle className="spin" />
              <h2>취향을 발견할 준비를 하고 있어요</h2>
            </div>
          ) : (
            <>
              {view === "discover" && (
                <DeliveryHome
                  foods={foods}
                  vector={vector}
                  personalized={!!profile}
                  profileVector={profile?.vector}
                  orders={orders}
                  context={context}
                  city={city}
                  temperature={temp}
                  onCity={setCity}
                  onContext={setContext}
                  onQuiz={start}
                  onFood={openFood}
                  onAdd={addToCart}
                  onHistory={() => setView("history")}
                  onProfile={() => setView("profile")}
                  mode={mode}
                  onMode={changeMode}
                  category={category}
                  onCategory={setCategory}
                  feedback={feedback}
                  onFeedback={sendFeedback}
                  busy={busy}
                />
              )}
              {view === "account" && (
                <section className="panel account-page">
                  <UserRound size={30} />
                  <h1>마이 페이지</h1>
                  {user ? (
                    <>
                      <p className="account-email">{user.email}</p>
                      <p>내 계정과 주문, 취향 정보를 확인하세요.</p>
                    </>
                  ) : (
                    <>
                      <p>로그인하고 내 취향과 주문 내역을 모아보세요.</p>
                      <button className="primary" onClick={() => setAuthOpen(true)}>이메일로 로그인하기</button>
                    </>
                  )}
                  <div className="account-links">
                    <button className="outline" onClick={() => setView("profile")}>
                      <Sparkles size={18} /> 취향 렌즈 <ArrowRight size={16} />
                    </button>
                    <button className="outline" onClick={() => setView("history")}>
                      <History size={18} /> 주문 내역 <ArrowRight size={16} />
                    </button>
                  </div>
                </section>
              )}
              {view === "profile" && (
                <>
                  <section className="page-heading">
                    <div>
                      <div className="eyebrow">MY TASTE IDENTITY</div>
                      <h1>나를 닮은 맛의 모양</h1>
                      <p>좋아하는 맛의 강도를 여섯 가지 축으로 살펴보세요.</p>
                    </div>
                  </section>
                  {profile ? (
                    <div className="profile-page">
                      <section className="panel">
                        <h2>나의 취향 프로필</h2>
                        <Radar vector={profile.vector} comparison={vector} />
                        <div className="legend">
                          <span>● 기본 취향</span>
                          <span>◌ 현재 상황 반영</span>
                        </div>
                        <p>
                          매칭 점수는 맛의 거리로 계산한 유사도이며, 만족 확률을
                          뜻하지 않습니다.
                        </p>
                      </section>
                      <section className="panel">
                        <h2>조금 더 자세히</h2>
                        {LABELS.map((label, i) => (
                          <div className="taste-bar" key={label}>
                            <span>{label}</span>
                            <div>
                              <i
                                style={{ width: `${profile.vector[i] * 100}%` }}
                              />
                            </div>
                            <b>{Math.round(profile.vector[i] * 100)}</b>
                          </div>
                        ))}
                        <p>
                          취향 반영에 사용할 식사 기록 {activeOrders.length}개 ·
                          기록이 없으면 상황 보정을 적용하지 않아요.
                        </p>
                        <button
                          className="outline"
                          onClick={() => setRetake(true)}
                        >
                          <RotateCcw size={15} /> 취향 다시 설정하기
                        </button>
                      </section>
                    </div>
                  ) : (
                    <Empty
                      icon="♡"
                      title="아직 나의 맛 지도가 없어요"
                      text="10번의 선택으로 나를 알아가는 첫걸음을 시작해 보세요."
                      action={start}
                    />
                  )}
                </>
              )}
              {view === "history" && (
                <>
                  <button
                    className="mypage-back"
                    onClick={() => setView("account")}
                  >
                    <ArrowLeft size={17} /> 마이 페이지
                  </button>
                  <section className="page-heading">
                    <div>
                      <div className="eyebrow">MY TASTING JOURNAL</div>
                      <h1>나의 주문내역</h1>
                      <p>주문했던 메뉴를 확인하고, 다음 한 끼를 더 나답게.</p>
                    </div>
                  </section>
                  {user ? (
                    <>
                      {profile && (
                        <section className="batch-banner">
                          <div>
                            <b>
                              새 식사 기록{" "}
                              {activeOrders.filter((o) => !o.applied).length}
                              개가 기다리고 있어요
                            </b>
                            <p>
                              한 번에 취향에 반영해요. 같은 식당 메뉴의 재선택은
                              조금 더 크게 반영됩니다.
                            </p>
                          </div>
                          <button
                            className="primary"
                            disabled={
                              busy || !activeOrders.some((o) => !o.applied)
                            }
                            onClick={applyOrders}
                          >
                            {busy ? (
                              <LoaderCircle className="spin" size={17} />
                            ) : (
                              <Sparkles size={17} />
                            )}
                            취향에 반영하기
                          </button>
                        </section>
                      )}
                      {orders.length ? (
                        <div className="history-list">
                          {orders.map((o) => {
                            const f = foods.find((f) => f.id === o.food_id);
                            return (
                              <article key={o.id}>
                                <span
                                  className="history-emoji"
                                  style={{ background: f?.color }}
                                >
                                  {f?.emoji}
                                </span>
                                <div>
                                  <h3>
                                    {f?.name}
                                    <span>
                                      {o.repeat_order
                                        ? "다시 먹었어요"
                                        : "새로운 한 끼"}
                                    </span>
                                  </h3>
                                  <p>
                                    {new Date(o.created_at).toLocaleString(
                                      "ko-KR",
                                    )}{" "}
                                    ·{" "}
                                    {
                                      ADDRESS[
                                        o.context
                                          .address as keyof typeof ADDRESS
                                      ]
                                    }{" "}
                                    · {TIMES[o.context.time]}
                                  </p>
                                  <small>
                                    {profile &&
                                    o.created_at < profile.baseline_at
                                      ? "이전 취향의 기록"
                                      : o.applied
                                        ? "취향 반영 완료"
                                        : "반영 대기"}{" "}
                                    · 테스트 주문
                                  </small>
                                </div>
                                <div className="order-summary">
                                  {checkouts.find((c) => c.id === o.id) && (
                                    <>
                                      <b>
                                        {checkouts
                                          .find((c) => c.id === o.id)!
                                          .total.toLocaleString()}
                                        원
                                      </b>
                                      <small>
                                        {
                                          checkouts.find((c) => c.id === o.id)!
                                            .quantity
                                        }
                                        개 ·{" "}
                                        {checkouts.find((c) => c.id === o.id)!
                                          .mode === "pickup"
                                          ? "포장"
                                          : "배달"}{" "}
                                        · 결제 없음
                                      </small>
                                    </>
                                  )}
                                  <button
                                    className="outline"
                                    onClick={() => f && openFood(f)}
                                  >
                                    다시 담기
                                  </button>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <Empty
                          icon="🍽️"
                          title="첫 번째 한 끼를 기다리고 있어요"
                          text="추천 음식에서 식당을 비교하고 먹은 메뉴를 기록해 보세요."
                          action={() => setView("discover")}
                          button="추천 음식 보러 가기"
                        />
                      )}
                    </>
                  ) : (
                    <Empty
                      icon="🍽️"
                      title="나만의 식사 노트를 시작해요"
                      text="이메일로 로그인하고 취향을 먼저 알려 주세요."
                      action={start}
                    />
                  )}
                </>
              )}
              {view === "about" && (
                <>
                  <section className="page-heading">
                    <div>
                      <div className="eyebrow">THE IDEA BEHIND TASTE LENS</div>
                      <h1>
                        좋은 식당보다 먼저,
                        <br />
                        좋아하는 음식부터.
                      </h1>
                      <p>오늘 뭘 먹을지, 나의 취향에서 답을 찾아요.</p>
                    </div>
                  </section>
                  <div className="about-grid">
                    {[
                      {
                        n: "01",
                        title: "10번의 가벼운 선택",
                        text: "단맛이 몇 점인지 묻지 않아요. 두 음식 중 더 끌리는 것을 고르면 여섯 가지 맛의 선호 강도를 추정해요.",
                      },
                      {
                        n: "02",
                        title: "맛의 거리로 발견하는 음식",
                        text: "단맛, 짠맛, 신맛, 감칠맛, 매운맛, 고소함. 내 취향과 음식의 거리가 가까울수록 적합도가 높아요.",
                      },
                      {
                        n: "03",
                        title: "같은 음식, 다른 취향",
                        text: "식당마다 다른 맛을 비교해요. 리뷰 근거가 적으면 음식의 기본 맛에 가깝게 보정합니다.",
                      },
                    ].map((c) => (
                      <section className="panel" key={c.n}>
                        <span className="step-number">{c.n}</span>
                        <h2>{c.title}</h2>
                        <p>{c.text}</p>
                      </section>
                    ))}
                  </div>
                  <section className="panel about-disclosure">
                    <h2>지금 우리가 테스트하는 것</h2>
                    <p>
                      이 웹은 제품 가설을 확인하는 MVP입니다. 음식 24개의 맛
                      수치는 초기 가설이며, 식당 72곳과 리뷰는 AI가 작성한 합성
                      실험 데이터입니다. 식사 기록은 실제 주문이나 결제로
                      이어지지 않습니다.
                    </p>
                    <p>
                      추천 계산에 AI를 실시간 호출하지 않아요. Solar 리뷰 분석
                      및 실제 플랫폼 리뷰 연동은 후속 단계입니다. 실제 데이터
                      기반의 추천 정확도는 사용자 테스트가 필요합니다.
                    </p>
                    <p>
                      날씨는 선택한 도시의 대표 지점에서 조회하며 상세 주소는
                      수집하지 않습니다. 개인 식사 기록이 쌓여야 상황별 보정이
                      생겨요.
                    </p>
                    <a
                      href="https://open-meteo.com/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      날씨 제공: Open-Meteo ↗
                    </a>
                  </section>
                </>
              )}
            </>
          )}
          <footer>
            <span className="footer-brand">
              취향렌즈 <span>TASTE LENS</span>
            </span>
            <span>오늘의 한 끼, 조금 더 나답게.</span>
            <span>Made for your taste.</span>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialogRef}
        className={`modal ${onboarding ? "onboarding-modal" : ""} ${selected ? "restaurant-modal" : ""}`}
        onCancel={(e) => {
          e.preventDefault();
          closeModal();
        }}
      >
        <div className="modal-inner">
          <button
            className="modal-close"
            aria-label="닫기"
            disabled={busy}
            onClick={closeModal}
          >
            <X size={21} />
          </button>
          {error && modal && (
            <div role="alert" className="error">
              {error}
            </div>
          )}
          {authOpen && (
            <form className="auth-form" onSubmit={authenticate}>
              <span className="brand-icon">
                <Utensils size={22} />
              </span>
              <div className="eyebrow">YOUR TASTE STARTS HERE</div>
              <h2>
                {signup ? "나만의 취향 여정, 시작해요" : "다시 만나서 반가워요"}
              </h2>
              <p>이메일로 취향과 식사 기록을 안전하게 보관하세요.</p>
              {authMessage && (
                <div role="status" className="auth-message">
                  {authMessage}
                </div>
              )}
              <label>
                이메일
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </label>
              <label>
                비밀번호
                <input
                  type="password"
                  required
                  minLength={6}
                  autoComplete={signup ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력해 주세요"
                />
              </label>
              <button disabled={busy} type="submit" className="primary full">
                {busy ? <LoaderCircle className="spin" size={16} /> : null}
                {signup ? "가입하고 인증 메일 받기" : "로그인"}
                <ArrowRight size={16} />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setSignup(!signup);
                  setError("");
                  setAuthMessage("");
                }}
              >
                {signup
                  ? "이미 계정이 있나요? 로그인"
                  : "처음 오셨나요? 이메일로 가입하기"}
              </button>
              <small>
                가입 후 이메일 인증을 완료하면 취향 테스트를 시작할 수 있어요.
              </small>
            </form>
          )}
          {onboarding && (
            <div className="onboarding">
              <div className="eyebrow">A LITTLE CHOICE, A LITTLE MORE YOU</div>
              <div className="progress-label">
                <span>나의 취향 발견하기</span>
                <b>
                  {Math.min(choices.length + 1, 10)} <small>/ 10</small>
                </b>
              </div>
              <div className="progress-track">
                <i style={{ width: `${choices.length * 10}%` }} />
              </div>
              {choices.length < 10 && foods.length ? (
                (() => {
                  const [a, b] = question(choices, foods);
                  return (
                    <>
                      <h2>지금 더 먹고 싶은 음식은?</h2>
                      <p>정답은 없어요. 조금 더 끌리는 쪽을 골라주세요.</p>
                      <div className="pair">
                        {[a, b].map((f, i) => (
                          <button
                            key={`${choices.length}-${f.id}`}
                            className="pair-card"
                            data-testid={`choice-${i}`}
                            disabled={busy}
                            onClick={() => choose(f, i === 0 ? b : a)}
                          >
                            <div style={{ background: f.color }}>
                              <span>{f.emoji}</span>
                            </div>
                            <h3>{f.name}</h3>
                            <p>{f.description}</p>
                            <span className="pair-choose">
                              이 음식이 더 끌려요 <ArrowRight size={15} />
                            </span>
                          </button>
                        ))}
                        <span className="versus">OR</span>
                      </div>
                      <button
                        className="text-button"
                        disabled={!choices.length || busy}
                        onClick={() => setChoices((c) => c.slice(0, -1))}
                      >
                        <ArrowLeft size={14} /> 이전 선택 바꾸기
                      </button>
                    </>
                  );
                })()
              ) : (
                <div className="complete">
                  <span className="complete-icon">
                    <Check size={32} />
                  </span>
                  <h2>열 번의 선택, 하나의 취향.</h2>
                  <p>선택을 저장하고 나에게 가까운 음식을 만나보세요.</p>
                  <Radar vector={estimate(choices, foods)} />
                  <button
                    className="primary"
                    disabled={busy}
                    onClick={saveProfile}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Sparkles size={17} />
                    )}
                    취향 저장하고 추천 보기
                  </button>
                </div>
              )}
            </div>
          )}
          {cartOpen && (
            <DeliveryCart
              cart={cart}
              pending={pendingCart}
              completed={completedCheckout}
              mode={mode}
              busy={busy}
              loggedIn={!!user}
              onMode={changeMode}
              onQuantity={(n) => cart && persistCart({ ...cart, quantity: n })}
              onRemove={() => persistCart(null)}
              onReplace={() => {
                persistCart(pendingCart);
                setPendingCart(null);
              }}
              onKeep={() => setPendingCart(null)}
              onCheckout={checkout}
              onBrowse={() => {
                closeModal();
                setView("discover");
              }}
              onHistory={() => {
                closeModal();
                setView("history");
              }}
            />
          )}
          {locationOpen && (
            <div className="location-panel">
              <MapPin size={30} />
              <h2>어디에서 드시나요?</h2>
              <p>도시와 장소를 선택하면 지금의 상황을 추천에 반영해요.</p>
              <label>
                도시
                <select
                  aria-label="도시 선택"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                >
                  <option value="seoul">서울</option>
                  <option value="busan">부산</option>
                  <option value="daejeon">대전</option>
                  <option value="jeju">제주</option>
                </select>
              </label>
              <label>
                장소
                <select
                  aria-label="장소 선택"
                  value={context.address}
                  onChange={(e) =>
                    setContext((c) => ({ ...c, address: e.target.value }))
                  }
                >
                  {Object.entries(ADDRESS).map(([v, n]) => (
                    <option key={v} value={v}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div className="test-payment-note">
                테스트 서비스로 상세 주소는 받지 않습니다.
              </div>
              <button
                className="primary full"
                onClick={() => setLocationOpen(false)}
              >
                이 위치로 설정 <Check size={16} />
              </button>
            </div>
          )}
          {selected && (
            <div className="restaurants">
              <img
                className="restaurant-modal-cover"
                src={foodPhoto(selected)}
                alt="음식 카테고리 예시 사진"
              />
              <div className="eyebrow">SAME DISH, YOUR KIND OF TASTE</div>
              <h2>
                {selected.emoji} {selected.name}, 어디서 먹을까요?
              </h2>
              <p>같은 음식 안에서도 내 입맛에 더 가까운 곳을 찾아요.</p>
              <div className="synthetic-note">
                실험용 가상 식당 · 가격·평점·리뷰 모두 합성 데이터입니다.
              </div>
              <div className="restaurant-toolbar">
                <b>{menus.length}개의 맛 비교</b>
                <select
                  aria-label="식당 정렬"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {profile && <option value="taste">취향 적합도순</option>}
                  <option value="rating">평점순</option>
                  <option value="price">가격순</option>
                </select>
              </div>
              {menuLoading ? (
                <div className="loading">
                  <LoaderCircle className="spin" />
                  식당의 맛을 비교하고 있어요
                </div>
              ) : menus.length ? (
                rank(menus, vector)
                  .sort((a, b) =>
                    sort === "rating"
                      ? b.rating - a.rating
                      : sort === "price"
                        ? a.price - b.price
                        : 0,
                  )
                  .map((m, i) => (
                    <article className="restaurant-item" key={m.id}>
                      <div className="restaurant-top">
                        <span className="restaurant-rank">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <h3>{m.name}</h3>
                          <p>{m.description}</p>
                          <div className="restaurant-meta">
                            <Star size={13} />
                            {m.rating}
                            <span>·</span>
                            {m.price.toLocaleString()}원<span>·</span>가상 식당
                          </div>
                        </div>
                        {profile && (
                          <div className="restaurant-score">
                            {Math.round(m.score)}
                            <small>%</small>
                            <span>취향 적합도</span>
                          </div>
                        )}
                      </div>
                      <p className="restaurant-reason">
                        <Sparkles size={14} />
                        {profile
                          ? reason(vector, m.vector)
                          : "취향 테스트를 완료하면 내 입맛과 비교할 수 있어요."}
                      </p>
                      <div className="restaurant-actions">
                        <button
                          className="text-button"
                          onClick={() =>
                            setExpanded(expanded === m.id ? null : m.id)
                          }
                        >
                          {expanded === m.id
                            ? "리뷰 근거 접기"
                            : "리뷰 근거 살펴보기"}{" "}
                          <ChevronRight size={13} />
                        </button>
                        <button
                          className="outline"
                          disabled={busy}
                          onClick={() => addToCart(m, selected)}
                        >
                          장바구니 담기 <ShoppingBag size={14} />
                        </button>
                      </div>
                      {expanded === m.id && (
                        <div className="evidence">
                          <small>
                            출처: AI 작성 합성 리뷰 · 4개 실험 리뷰 · Solar 추출
                            결과 아님
                          </small>
                          {m.claims
                            .filter((c) => c.review_id.endsWith("-1"))
                            .map((c) => (
                              <p key={c.axis}>
                                <b>{LABELS[AXES.indexOf(c.axis)]}</b> “
                                {c.evidence}”{" "}
                                <span>
                                  {c.level > 0 ? "+" : ""}
                                  {c.level}
                                </span>
                              </p>
                            ))}
                          <p>근거가 적어 음식의 기본 맛에 가깝게 보정했어요.</p>
                        </div>
                      )}
                    </article>
                  ))
              ) : (
                <p>식당을 불러오지 못했어요. 창을 닫고 다시 시도해 주세요.</p>
              )}
              <p className="modal-foot">
                실제 주문은 발생하지 않아요. 기록을 통해 추천 변화를 테스트할 수
                있어요.
              </p>
            </div>
          )}
          {retake && (
            <div className="retake">
              <RotateCcw size={32} />
              <h2>지금의 취향을 다시 찾아볼까요?</h2>
              <p>
                새 테스트를 완료하면 기본 취향이 바뀝니다. 이전 식사 기록은
                보관되지만 새 취향 학습에는 사용하지 않아요.
              </p>
              <button
                className="primary"
                onClick={() => {
                  setRetake(false);
                  setChoices([]);
                  setOnboarding(true);
                }}
              >
                10문항 다시 시작하기 <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </dialog>
    </div>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
  button = "내 취향 발견하기",
}: {
  icon: string;
  title: string;
  text: string;
  action: () => void;
  button?: string;
}) {
  return (
    <div className="empty">
      <span>{icon}</span>
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="primary" onClick={action}>
        {button}
        <ArrowRight size={16} />
      </button>
    </div>
  );
}
