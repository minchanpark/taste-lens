-- Taste Lens Canonical Schema (PRD v4.3 Section 79)
-- 10 Canonical Tables with explicit 6D taste vectors and RLS

-- 1. users
CREATE TABLE IF NOT EXISTS public.users (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. user_profiles
CREATE TABLE IF NOT EXISTS public.user_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.users(user_id) ON DELETE CASCADE,
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    baseline_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. foods (70 Seed Foods)
CREATE TABLE IF NOT EXISTS public.foods (
    food_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '🍽️',
    food_image_url TEXT,
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    source TEXT NOT NULL DEFAULT 'seed',
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_foods_category ON public.foods(category);

-- 4. restaurants (41 Restaurants)
CREATE TABLE IF NOT EXISTS public.restaurants (
    restaurant_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    restaurant_type TEXT,
    restaurant_image_url TEXT,
    rating NUMERIC NOT NULL DEFAULT 4.5 CHECK (rating BETWEEN 0 AND 5),
    review_count INT NOT NULL DEFAULT 0,
    delivery_minutes INT NOT NULL DEFAULT 25,
    delivery_fee INT NOT NULL DEFAULT 2000,
    minimum_order INT NOT NULL DEFAULT 12000,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_restaurants_category ON public.restaurants(category);

-- 5. restaurant_menus (210-250 menus)
CREATE TABLE IF NOT EXISTS public.restaurant_menus (
    restaurant_menu_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(restaurant_id) ON DELETE CASCADE,
    food_id TEXT NOT NULL REFERENCES public.foods(food_id) ON DELETE CASCADE,
    menu_name TEXT NOT NULL,
    menu_description TEXT,
    menu_image_url TEXT,
    price INT NOT NULL CHECK (price >= 0),
    sweet NUMERIC NOT NULL CHECK (sweet BETWEEN 0 AND 1),
    salty NUMERIC NOT NULL CHECK (salty BETWEEN 0 AND 1),
    sour NUMERIC NOT NULL CHECK (sour BETWEEN 0 AND 1),
    umami NUMERIC NOT NULL CHECK (umami BETWEEN 0 AND 1),
    spicy NUMERIC NOT NULL CHECK (spicy BETWEEN 0 AND 1),
    nutty NUMERIC NOT NULL CHECK (nutty BETWEEN 0 AND 1),
    menu_section TEXT NOT NULL DEFAULT '메인 메뉴',
    is_representative BOOLEAN NOT NULL DEFAULT false,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    is_available BOOLEAN NOT NULL DEFAULT true,
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    evidence_count INT NOT NULL DEFAULT 0,
    source TEXT NOT NULL DEFAULT 'seed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(restaurant_id, food_id)
);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_food ON public.restaurant_menus(food_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_menus_rest ON public.restaurant_menus(restaurant_id);

-- 6. onboarding_responses
CREATE TABLE IF NOT EXISTS public.onboarding_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    question_index INT NOT NULL CHECK (question_index BETWEEN 1 AND 10),
    left_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    right_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    selected_food_id TEXT NOT NULL REFERENCES public.foods(food_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.onboarding_responses(user_id);

-- 7. orders
CREATE TABLE IF NOT EXISTS public.orders (
    order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    restaurant_menu_id TEXT NOT NULL REFERENCES public.restaurant_menus(restaurant_menu_id),
    place_type TEXT NOT NULL DEFAULT 'home',
    time_segment TEXT NOT NULL DEFAULT 'lunch',
    weather_type TEXT NOT NULL DEFAULT 'normal',
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_vector_before JSONB,
    user_vector_after JSONB,
    vector_version_before TEXT,
    vector_version_after TEXT,
    repeat_order BOOLEAN NOT NULL DEFAULT false,
    taste_update_applied BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON public.orders(user_id);

-- 8. reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(order_id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    restaurant_id TEXT NOT NULL REFERENCES public.restaurants(restaurant_id),
    restaurant_menu_id TEXT NOT NULL REFERENCES public.restaurant_menus(restaurant_menu_id),
    rating NUMERIC NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    user_vector_before JSONB,
    user_vector_after JSONB,
    user_update_applied BOOLEAN NOT NULL DEFAULT false,
    restaurant_update_applied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_menu ON public.reviews(restaurant_menu_id);

-- 9. review_evidence
CREATE TABLE IF NOT EXISTS public.review_evidence (
    evidence_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.reviews(review_id) ON DELETE CASCADE,
    claim_type TEXT NOT NULL CHECK (claim_type IN ('menu_taste', 'user_preference')),
    axis TEXT NOT NULL CHECK (axis IN ('sweet', 'salty', 'sour', 'umami', 'spicy', 'nutty')),
    level INT NOT NULL,
    direction TEXT,
    comparative BOOLEAN NOT NULL DEFAULT false,
    confidence NUMERIC NOT NULL DEFAULT 0.8 CHECK (confidence BETWEEN 0 AND 1),
    evidence_text TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT 'solar-pro4',
    prompt_version TEXT NOT NULL DEFAULT 'v4.3',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_review_evidence_review ON public.review_evidence(review_id);

-- 10. recommendations
CREATE TABLE IF NOT EXISTS public.recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
    scope TEXT NOT NULL,
    category TEXT,
    candidate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    context_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    user_vector_snapshot JSONB,
    vector_version TEXT NOT NULL DEFAULT 'v4.3',
    selected_food_id TEXT REFERENCES public.foods(food_id),
    selected_restaurant_id TEXT REFERENCES public.restaurants(restaurant_id),
    selected_restaurant_menu_id TEXT REFERENCES public.restaurant_menus(restaurant_menu_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_recommendations_user ON public.recommendations(user_id);

-- Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;

-- Public read access for catalogs
CREATE POLICY foods_public_read ON public.foods FOR SELECT USING (true);
CREATE POLICY restaurants_public_read ON public.restaurants FOR SELECT USING (true);
CREATE POLICY menus_public_read ON public.restaurant_menus FOR SELECT USING (true);

-- User-scoped access
CREATE POLICY users_own ON public.users FOR ALL USING (auth.uid() = user_id);
CREATE POLICY profiles_own ON public.user_profiles FOR ALL USING (auth.uid() = user_id);
CREATE POLICY onboarding_own ON public.onboarding_responses FOR ALL USING (auth.uid() = user_id);
CREATE POLICY orders_own ON public.orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY reviews_own ON public.reviews FOR ALL USING (auth.uid() = user_id);
CREATE POLICY review_evidence_read ON public.review_evidence FOR SELECT USING (true);
CREATE POLICY recommendations_own ON public.recommendations FOR ALL USING (auth.uid() = user_id);

-- Auto-sync auth.users to public.users via trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
