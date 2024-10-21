// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

export interface FoodItem {
  name: string;
  max_quantity: number;
}

export interface IdealPFC {
  protein: number;
  fat: number;
  carbs: number;
}

export interface MenuItem {
  food_name: string;
  quantity: number;
  unit: string;
  max_quantity: number;
}

export interface ResultItem {
  menu: MenuItem[];
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  protein_diff: number;
  fat_diff: number;
  carbs_diff: number;
  total_diff: number;
}

export interface FoodDetails {
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  unit: string;
}

export interface OptimizationProgress {
  progress: number;
  status: string;
  result?: ResultItem[];
}

export async function getOptimizationProgress(): Promise<OptimizationProgress> {
  const response = await fetch(`${API_BASE_URL}/optimization_progress`);
  if (!response.ok) {
    throw new Error('進捗状況の取得に失敗しました');
  }
  const data = await response.json();
  return data;
}

export async function optimizeFood(
  foods: FoodItem[],
  ideal_pfc: IdealPFC
): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ foods, ideal_pfc }),
  });
  if (!response.ok) {
    throw new Error('APIリクエストに失敗しました');
  }
  const data = await response.json();
  return data;
}

export async function getFoodNames(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/food_names`);
  if (!response.ok) {
    throw new Error('食材名の取得に失敗しました');
  }
  const data = await response.json();
  return data.food_names;
}

export async function searchFood(query: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/search_food?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('食材の検索に失敗しました');
  }
  const data = await response.json();
  return data.results;
}

export async function getGenres(): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/genres`);
  if (!response.ok) {
    throw new Error('ジャンル一覧の取得に失敗しました');
  }
  const data = await response.json();
  return data.genres;
}

export async function getFoodsInGenre(genre: string): Promise<string[]> {
  const response = await fetch(`${API_BASE_URL}/foods_in_genre/${encodeURIComponent(genre)}`);
  if (!response.ok) {
    throw new Error('ジャンル内の食材リストの取得に失敗しました');
  }
  const data = await response.json();
  return data.foods;
}

export async function getFoodDetails(foodName: string): Promise<FoodDetails> {
  const response = await fetch(`${API_BASE_URL}/food_details/${encodeURIComponent(foodName)}`);
  if (!response.ok) {
    throw new Error('食材の詳細情報の取得に失敗しました');
  }
  const data = await response.json();
  return data;
}