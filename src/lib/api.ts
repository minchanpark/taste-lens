/**
 * Client API module for Taste Lens Frontend (PRD v4.3)
 * Points to FastAPI backend via NEXT_PUBLIC_API_BASE_URL (defaults to /api).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

export type ApiFood = {
  id: string;
  name: string;
  category: string;
  emoji: string;
  vector: number[];
  description: string;
  food_image_url?: string;
  match_percentage?: number;
  distance?: number;
};

export type ApiRestaurant = {
  id: string;
  name: string;
  category: string;
  restaurant_type: string;
  rating: number;
  review_count: number;
  delivery_minutes: number;
  delivery_fee: number;
  minimum_order: number;
  restaurant_image_url?: string;
};

export type ApiMenu = {
  id: string;
  restaurant_id: string;
  food_id: string;
  name: string;
  description: string;
  price: number;
  vector: number[];
  menu_section: string;
  is_representative: boolean;
  is_popular: boolean;
};

export type ApiCategory = {
  name: string;
  food_count: number;
};

export type ReviewImpact = {
  axis: string;
  axis_label: string;
  before: number;
  after: number;
  evidence_text: string;
  direction: string;
};

export type ReviewResponse = {
  review_id: string;
  status: string;
  model_used: string;
  menu_taste_claims: Array<{
    axis: string;
    level: number;
    comparative: boolean;
    confidence: number;
    evidence_text: string;
  }>;
  user_preference_claims: Array<{
    axis: string;
    direction: string;
    confidence: number;
    evidence_text: string;
  }>;
  user_update_applied: boolean;
  user_vector_before: number[];
  user_vector_after: number[];
  menu_vector_after?: number[];
  impacts: ReviewImpact[];
  message: string;
};

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errorDetail = "API Error";
    try {
      const err = await res.json();
      errorDetail = err.detail || err.message || JSON.stringify(err);
    } catch {
      errorDetail = await res.text();
    }
    throw new Error(errorDetail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const apiClient = {
  // Health
  health: () => request<{ status: string; fastapi: string; version: string }>("/health"),

  // Catalog
  getFoods: (category?: string) =>
    request<ApiFood[]>(`/foods${category ? `?category=${encodeURIComponent(category)}` : ""}`),

  getCategories: () => request<ApiCategory[]>("/categories"),

  getRestaurants: (category?: string) =>
    request<ApiRestaurant[]>(`/restaurants${category ? `?category=${encodeURIComponent(category)}` : ""}`),

  getRestaurantDetail: (id: string) =>
    request<ApiRestaurant & { menus: ApiMenu[] }>(`/restaurants/${encodeURIComponent(id)}`),

  // Recommendations
  recommendFoods: (user_vector: number[], category?: string, limit: number = 10) =>
    request<ApiFood[]>("/recommendations/foods", {
      method: "POST",
      body: JSON.stringify({ user_vector, category, limit }),
    }),

  recommendRestaurants: (user_vector: number[], food_id: string) =>
    request<Array<{ restaurant: ApiRestaurant; menu: ApiMenu; match_percentage: number; distance: number }>>(
      "/recommendations/restaurants",
      {
        method: "POST",
        body: JSON.stringify({ user_vector, food_id }),
      }
    ),

  // Weather
  getWeather: (city: string = "seoul") =>
    request<{ weather: string; temperature: number | null; city: string; message?: string }>(
      `/weather?city=${encodeURIComponent(city)}`
    ),

  // Taste Math
  getNextQuestion: (choices: Array<{ selected: string; rejected: string; sequence?: number }>, foods: ApiFood[]) =>
    request<{ step: number; is_completed: boolean; food_a: ApiFood; food_b: ApiFood }>("/taste/question", {
      method: "POST",
      body: JSON.stringify({ choices, foods }),
    }),

  estimateVector: (choices: Array<{ selected: string; rejected: string; sequence?: number }>, foods: ApiFood[]) =>
    request<{ u_base: number[]; axes: string[]; total_choices: number }>("/taste/estimate", {
      method: "POST",
      body: JSON.stringify({ choices, foods }),
    }),

  getCurrentVector: (base_vector: number[], orders: any[] = [], context: Record<string, string> = {}) =>
    request<{ u_current: number[]; base_vector: number[]; context: Record<string, string> }>("/taste/current", {
      method: "POST",
      body: JSON.stringify({ base_vector, orders, context }),
    }),

  getMatch: (user_vector: number[], target_vector: number[]) =>
    request<{ distance: number; match_percentage: number; reason: string }>("/taste/match", {
      method: "POST",
      body: JSON.stringify({ user_vector, target_vector }),
    }),

  // Reviews & Learning Loop (PRD v4.3 Section 67~76)
  submitReview: (payload: {
    restaurant_id: string;
    restaurant_menu_id: string;
    rating: number;
    review_text: string;
    user_vector?: number[];
    order_id?: string;
    user_id?: string;
  }) =>
    request<ReviewResponse>("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
