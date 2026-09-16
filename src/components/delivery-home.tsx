"use client";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bike,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Heart,
  Search,
  ShoppingBag,
  Sparkles,
  Star,
  Sun,
  UtensilsCrossed,
  X,
} from "lucide-react";
import Radar from "./radar";
import { supabase } from "@/lib/supabase";
import {
  LABELS,
  match,
  rank,
  reason,
  type Food,
  type Menu,
  type Order,
  type Vector,
  type Context,
} from "@/lib/taste";
import { foodPhoto, money, deliveryMinutes } from "@/lib/delivery";
type Props = {
  foods: Food[];
  vector: Vector;
  personalized: boolean;
  profileVector?: Vector;
  orders: Order[];
  context: Context;
  city: string;
  temperature: number | null;
  onCity: (city: string) => void;
  onContext: (context: Context) => void;
  onQuiz: () => void;
  onFood: (food: Food) => void;
  onAdd: (menu: Menu, food: Food) => void;
  onHistory: () => void;
  onProfile: () => void;
  mode: "delivery" | "pickup";
  onMode: (mode: "delivery" | "pickup") => void;
  category: string;
  onCategory: (category: string) => void;
  feedback: string | null;
  onFeedback: (answer: string) => void;
  busy: boolean;
};
const categories = [
  ["전체", "🍽️"],
  ["한식", "🍚"],
  ["치킨", "🍗"],
  ["분식", "🌶️"],
  ["중식", "🥡"],
  ["일식", "🍣"],
  ["양식", "🍕"],
  ["아시안", "🍜"],
  ["샐러드", "🥗"],
];
export default function DeliveryHome(p: Props) {
  const [catalog, setCatalog] = useState<Menu[]>([]),
    [query, setQuery] = useState(""),
    [submitted, setSubmitted] = useState(""),
    [sort, setSort] = useState("recommended"),
    [favoriteIds, setFavoriteIds] = useState<string[]>([]),
    [onlyFavorites, setOnlyFavorites] = useState(false),
    [foodId, setFoodId] = useState("all"),
    [catalogError, setCatalogError] = useState("");
  useEffect(() => {
    let live = true;
    supabase
      ?.from("tl_menus")
      .select("*")
      .then(({ data, error }) => {
        if (!live) return;
        if (error)
          setCatalogError(
            "가게 목록을 불러오지 못했어요. 새로고침 후 다시 시도해 주세요.",
          );
        else setCatalog(data || []);
      });
    try {
      const saved = JSON.parse(
        localStorage.getItem("tl-favorite-menus") || "[]",
      );
      if (Array.isArray(saved))
        setFavoriteIds(saved.filter((x) => typeof x === "string"));
    } catch {}
    return () => {
      live = false;
    };
  }, []);
  function favorite(id: string) {
    const next = favoriteIds.includes(id)
      ? favoriteIds.filter((x) => x !== id)
      : [...favoriteIds, id];
    setFavoriteIds(next);
    localStorage.setItem("tl-favorite-menus", JSON.stringify(next));
  }
  const byFood = useMemo(
    () => new Map(p.foods.map((f) => [f.id, f])),
    [p.foods],
  );
  const topFoods = rank(p.foods, p.vector)
    .filter((f) => p.category === "전체" || f.category === p.category)
    .slice(0, 5);
  const search = submitted.trim().toLowerCase();
  const listed = useMemo(
    () =>
      catalog
        .filter((m) => {
          const f = byFood.get(m.food_id);
          return (
            f &&
            (p.category === "전체" || f.category === p.category) &&
            (foodId === "all" || f.id === foodId) &&
            (!onlyFavorites || favoriteIds.includes(m.id)) &&
            (!search ||
              `${f.name} ${f.category} ${m.name}`
                .toLowerCase()
                .includes(search))
          );
        })
        .sort((a, b) =>
          sort === "rating"
            ? b.rating - a.rating
            : sort === "price"
              ? a.price - b.price
              : sort === "fast"
                ? deliveryMinutes(a) - deliveryMinutes(b)
                : p.personalized
                  ? match(p.vector, b.vector) - match(p.vector, a.vector)
                  : a.id.localeCompare(b.id),
        ),
    [
      catalog,
      byFood,
      p.category,
      foodId,
      onlyFavorites,
      favoriteIds,
      search,
      sort,
      p.personalized,
      p.vector,
    ],
  );
  const [limit, setLimit] = useState(9);
  useEffect(() => setLimit(9), [search, p.category, foodId, onlyFavorites, sort]);
  const recent = [...new Set(p.orders.map((o) => o.menu_id))]
    .slice(0, 3)
    .flatMap((id) => {
      const menu = catalog.find((m) => m.id === id);
      return menu ? [menu] : [];
    });
  function selectCategory(category: string) {
    p.onCategory(category);
    setFoodId("all");
  }
  const savedVector = p.profileVector || p.vector;
  const strongest = LABELS.map((label, i) => ({ label, value: savedVector[i] }))
    .sort((a, b) => b.value - a.value).slice(0, 2);
  return (
    <div className="delivery-home">
      <section className="home-taste-profile" aria-labelledby="home-profile-title">
        <div className="home-profile-copy">
          <span className="blue-overline"><Sparkles size={13} /> MY TASTE PROFILE</span>
          <h1 id="home-profile-title">내 취향 프로필</h1>
          {p.personalized ? <>
            <p><strong>{strongest.map(x => x.label).join(" · ")}</strong>의 강도를 높게 선호해요.</p>
            <div className="home-taste-values">{LABELS.map((label, i) =>
              <span key={label}>{label}<b>{Math.round(savedVector[i] * 100)}</b></span>
            )}</div>
            <small>저장된 기본 취향 · 메뉴 추천에는 현재 상황도 반영해요.</small>
          </> : <p>10번의 선택으로 내 입맛을 발견해 보세요.<br />취향에 맞는 음식과 가게를 추천해 드려요.</p>}
          <button className="taste-entry" onClick={p.personalized ? p.onProfile : p.onQuiz}>
            {p.personalized ? "취향 자세히 보기" : "내 취향 발견하기"}<ArrowRight size={16} />
          </button>
        </div>
        {p.personalized ? <Radar vector={savedVector} /> :
          <div className="home-profile-placeholder"><Sparkles size={35} /><b>나만의 맛 지도</b><span>취향 분석 후 이곳에 표시돼요</span></div>}
      </section>
      <section id="restaurant-discovery" className="restaurant-discovery home-order-section">
        <div className="order-tabs" role="tablist" aria-label="주문 방식">
          {(["delivery", "pickup"] as const).map((mode, index) => <button
            type="button" key={mode} role="tab" id={`tab-${mode}`}
            aria-selected={p.mode === mode} aria-controls="order-menu-panel"
            tabIndex={p.mode === mode ? 0 : -1}
            onClick={() => p.onMode(mode)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === "Home" ? "delivery" : event.key === "End" ? "pickup" : index === 0 ? "pickup" : "delivery";
              p.onMode(next);
              document.getElementById(`tab-${next}`)?.focus();
            }}
          >{mode === "delivery" ? <Bike size={20} /> : <ShoppingBag size={20} />}{mode === "delivery" ? "배달" : "포장"}</button>)}
        </div>
        <div id="order-menu-panel" role="tabpanel" aria-labelledby={`tab-${p.mode}`}>
      <section className="category-section">
        <div className="delivery-section-title">
          <h2>어떤 음식이 끌리세요?</h2>
          <span>맛있는 선택의 시작</span>
        </div>
        <div className="delivery-categories">
          {categories.map(([name, emoji]) => (
            <button
              key={name}
              aria-pressed={p.category === name}
              className={p.category === name ? "active" : ""}
              onClick={() => selectCategory(name)}
            >
              <span>{emoji}</span>
              <b>{name}</b>
            </button>
          ))}
        </div>
      </section>
        <div className="food-subcategories" aria-label="세부 메뉴 종류">
          <button aria-pressed={foodId === "all"} onClick={() => setFoodId("all")}>전체 메뉴</button>
          {p.foods.filter(f => p.category === "전체" || f.category === p.category).map(f =>
            <button key={f.id} aria-pressed={foodId === f.id} onClick={() => setFoodId(f.id)}>{f.name}</button>
          )}
        </div>
      <div className="delivery-search-row">
        <form
          className="delivery-search"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(query);
            document
              .getElementById("restaurant-discovery")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          <Search size={23} />
          <input
            aria-label="음식 또는 가게 검색"
            placeholder="오늘 뭐 먹지? 음식이나 가게를 검색해 보세요"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (!e.target.value) setSubmitted("");
            }}
          />
          {query && (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => {
                setQuery("");
                setSubmitted("");
              }}
            >
              <X size={17} />
            </button>
          )}
          <button type="submit">검색</button>
        </form>
        <div className="live-weather">
          <Sun size={21} />
          <span>
            {p.temperature === null
              ? "날씨 정보 확인 중"
              : `${Math.round(p.temperature)}° 오늘도 맛있는 하루`}
            <small>도시 기준 날씨 · Open-Meteo</small>
          </span>
        </div>
      </div>

        <p className="service-selection" role="status">
          {p.mode === "pickup" ? <ShoppingBag size={17} /> : <Bike size={17} />}
          {p.mode === "pickup" ? "포장할 가게 · 배달비 없음" : "배달받을 가게 · 배달비 2,000원"}
        </p>
        <div className="delivery-section-title">
          <div>
            <span className="blue-overline">GOOD FOOD, GOOD MOOD</span>
            <h2>
              {search
                ? `“${submitted}” 검색 결과`
                : onlyFavorites
                  ? "내가 찜한 맛집"
                  : p.category === "전체"
                    ? "오늘의 한 끼, 여기 어때요?"
                    : `${p.category}, 오늘은 여기 어때요?`}
            </h2>
          </div>
          <span>{listed.length}개 가게</span>
        </div>
        <div className="menu-dropdowns">
          <label>정렬<select aria-label="메뉴 정렬" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="recommended">{p.personalized ? "내 취향순" : "추천순"}</option>
            <option value="rating">별점 높은 순</option>
            <option value="price">가격 낮은 순</option>
            <option value="fast">{p.mode === "pickup" ? "준비 빠른 순" : "배달 빠른 순"}</option>
          </select></label>
          <label>보기<select aria-label="가게 필터" value={onlyFavorites ? "favorites" : "all"} onChange={e => setOnlyFavorites(e.target.value === "favorites")}>
            <option value="all">전체 가게</option><option value="favorites">찜한 가게</option>
          </select></label>
        </div>
        {catalogError && (
          <div role="alert" className="error">
            {catalogError}
          </div>
        )}
        <div className="delivery-restaurants">
          {listed.slice(0, limit).map((m, i) => {
            const f = byFood.get(m.food_id)!;
            const minutes = deliveryMinutes(m);
            return (
              <article className="delivery-restaurant-card" key={m.id}>
                <button
                  className="restaurant-image-button"
                  aria-label={`${m.name} 메뉴 보기`}
                  onClick={() => p.onFood(f)}
                >
                  <img
                    src={foodPhoto(f)}
                    alt={`${f.name} 카테고리 예시 사진`}
                    loading="lazy"
                  />
                  <span className="restaurant-image-shade" />
                  <span className="image-badge">
                    {p.personalized ? (
                      <>
                        <Sparkles size={12} />
                        {Math.round(match(p.vector, m.vector))}% 취향 적합
                      </>
                    ) : i % 3 === 0 ? (
                      "오늘의 발견"
                    ) : (
                      "취향렌즈 셀렉션"
                    )}
                  </span>
                  <span className="image-delivery">
                    <Clock3 size={12} />
                    {minutes}–{minutes + 10}분
                  </span>
                </button>
                <button
                  className={`favorite-button ${favoriteIds.includes(m.id) ? "saved" : ""}`}
                  aria-label={`${m.name} ${favoriteIds.includes(m.id) ? "찜 해제" : "찜하기"}`}
                  aria-pressed={favoriteIds.includes(m.id)}
                  onClick={() => favorite(m.id)}
                >
                  <Heart
                    size={19}
                    fill={favoriteIds.includes(m.id) ? "currentColor" : "none"}
                  />
                </button>
                <div className="delivery-card-content">
                  <div className="restaurant-name-row">
                    <button onClick={() => p.onFood(f)}>
                      <h3>
                        {m.name.split(" · ")[0]} <span>{f.name}</span>
                      </h3>
                    </button>
                    <span>
                      <Star size={13} fill="currentColor" />
                      {m.rating.toFixed(1)}
                    </span>
                  </div>
                  <p>
                    {m.description} · {f.category}
                  </p>
                  <div className="delivery-cost">
                    {p.mode === "pickup" ? <ShoppingBag size={14} /> : <Bike size={14} />}
                    {p.mode === "pickup"
                      ? "포장 · 배달비 없음"
                      : "배달비 2,000원"}
                    <span>최소주문 없음</span>
                  </div>
                  <div className="delivery-card-bottom">
                    <b>{money(m.price)}</b>
                    <button
                      aria-label={`${m.name} 담기`}
                      onClick={() => p.onAdd(m, f)}
                    >
                      <ShoppingBag size={14} />
                      담기
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {!listed.length && !catalogError && (
          <div className="delivery-empty">
            <Search size={32} />
            <h3>
              {onlyFavorites
                ? "아직 찜한 가게가 없어요"
                : "찾으시는 메뉴가 없어요"}
            </h3>
            <p>다른 검색어나 카테고리로 맛있는 메뉴를 찾아보세요.</p>
            <button
              className="outline"
              onClick={() => {
                setQuery("");
                setSubmitted("");
                setOnlyFavorites(false);
                selectCategory("전체");
              }}
            >
              전체 가게 보기
            </button>
          </div>
        )}
        {listed.length > limit && (
          <button
            className="load-restaurants"
            onClick={() => setLimit((n) => n + 9)}
          >
            더 많은 가게 보기 <ChevronDown size={17} />
          </button>
        )}
        </div>
      </section>
      {p.personalized && (
        <section className="personal-picks">
          <div className="delivery-section-title">
            <div>
              <span className="blue-overline">
                <Sparkles size={12} /> ONLY FOR YOU
              </span>
              <h2>지금, 내 입맛에 가까운 음식</h2>
            </div>
            <span>맛의 거리로 찾은 TOP 5</span>
          </div>
          <div className="personal-foods">
            {topFoods.map((f) => (
              <button
                className="personal-food-card"
                key={f.id}
                onClick={() => p.onFood(f)}
              >
                <img src={foodPhoto(f)} alt={`${f.name} 카테고리 예시`} />
                <span className="personal-score">
                  {Math.round(f.score)}% MATCH
                </span>
                <div>
                  <h3>
                    {f.name}
                    <ArrowUpRight size={15} />
                  </h3>
                  <p>{reason(p.vector, f.vector)}</p>
                </div>
              </button>
            ))}
          </div>
          <div className="delivery-feedback">
            <span>추천 음식 중 먹고 싶은 메뉴가 있나요?</span>
            {p.feedback ? (
              <b>의견을 저장했어요. 고마워요!</b>
            ) : (
              <div>
                <button disabled={p.busy} onClick={() => p.onFeedback("yes")}>
                  있어요 <Check size={13} />
                </button>
                <button disabled={p.busy} onClick={() => p.onFeedback("no")}>
                  아직 없어요
                </button>
              </div>
            )}
          </div>
        </section>
      )}
      {recent.length > 0 && (
        <section className="recent-section">
          <div className="delivery-section-title">
            <div>
              <span className="blue-overline">ONE MORE BITE</span>
              <h2>지난번 그 맛, 다시 한 번</h2>
            </div>
            <button onClick={p.onHistory}>
              주문내역 <ChevronRight size={15} />
            </button>
          </div>
          <div className="repeat-grid">
            {recent.map((m) => {
              const f = byFood.get(m.food_id)!;
              return (
                <article key={m.id}>
                  <img src={foodPhoto(f)} alt="메뉴 카테고리 예시" />
                  <div>
                    <small>{m.name.split(" · ")[0]}</small>
                    <h3>{f.name}</h3>
                    <b>{money(m.price)}</b>
                  </div>
                  <button
                    aria-label={`${f.name} 다시 담기`}
                    onClick={() => p.onAdd(m, f)}
                  >
                    <ShoppingBag size={18} />
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}
      <div className="delivery-bottom-info">
        <div>
          <span className="brand-icon">
            <UtensilsCrossed size={19} />
          </span>
          <b>취향렌즈</b>
          <span>오늘의 한 끼를, 더 나답게.</span>
        </div>
        <p>
          서비스 검증을 위한 MVP입니다. 가게·리뷰·평점·가격·배달 시간은 실험
          데이터이며 사진은 카테고리 예시입니다.
          <br />
          실제 결제나 배달은 진행되지 않습니다. 취향 적합도는 만족 확률이 아닌
          맛의 유사도입니다.
        </p>
      </div>
    </div>
  );
}
