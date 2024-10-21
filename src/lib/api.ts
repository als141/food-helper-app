// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

export async function optimizeFood(
  foods: FoodItem[],
  ideal_pfc: IdealPFC
): Promise<ResultItem[]> {
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