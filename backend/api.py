from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import pandas as pd
import time
from deap import base, creator, tools, algorithms
import numpy as np
from typing import List, Dict

app = FastAPI()

# コメントアウト

origins = [
    "https://food-helper-app.vercel.app",
    "http://localhost",
    "http://localhost:8080",
    "http://localhost:3000",
    # 必要に応じて他のオリジンを追加
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ランダムシードの設定
random.seed(time.time())
np.random.seed(int(time.time()))

# -----------------------------
# PFCデータの読み込み
# -----------------------------

# calorie.csv の読み込み
pfc_file_path = 'calorie.csv'

pfc_dict = {}  # 各食材のPFC情報を保持

# pandasを使用してCSVファイルを読み込む
df = pd.read_csv(pfc_file_path, header=0)

# データフレームを辞書に変換
for index, row in df.iterrows():
    food_name = row['food_name']
    # 空の行をスキップ
    if pd.isna(food_name):
        continue
    protein = row['protein']
    fat = row['fat']
    carbs = row['carbohydrate']
    unit = row['unit']
    # PFC値が数値であることを確認
    try:
        protein = float(protein)
        fat = float(fat)
        carbs = float(carbs)
    except ValueError:
        print(f"{food_name}のPFC値に不正な値があります。データを確認してください。")
        continue
    pfc_dict[food_name] = {
        'protein': protein,
        'fat': fat,
        'carbs': carbs,
        'unit': unit
    }

# 全ての食材のリスト
food_items = list(pfc_dict.keys())

# リクエストボディの定義
class FoodItem(BaseModel):
    name: str
    max_quantity: float

class FoodSelection(BaseModel):
    foods: list[FoodItem]
    ideal_pfc: dict

# グローバル変数で最適化の進捗を追跡
optimization_progress = {"progress": 0, "status": "待機中"}
optimization_result = None

# 進化計算によるPFCバランスの最適化を関数化
def optimize_pfc(available_foods, max_quantities, ideal_pfc):
    global optimization_progress
    low = [0.0] * len(available_foods)
    up = max_quantities

    # 単位が「個」の食材のインデックスを取得
    integer_indices = [i for i, food in enumerate(available_foods) if pfc_dict[food]['unit'] == '個']

    # 個体評価関数
    def evaluate(individual):
        total_protein = 0
        total_fat = 0
        total_carbs = 0

        for idx, quantity in enumerate(individual):
            food_name = available_foods[idx]
            pfc = pfc_dict[food_name]
            factor = quantity
            total_protein += pfc['protein'] * factor
            total_fat += pfc['fat'] * factor
            total_carbs += pfc['carbs'] * factor

        protein_diff = abs(total_protein - ideal_pfc['protein'])
        fat_diff = abs(total_fat - ideal_pfc['fat'])
        carbs_diff = abs(total_carbs - ideal_pfc['carbs'])

        protein_weight = 1.0
        fat_weight = 1.0
        carbs_weight = 1.0

        score = (protein_weight * protein_diff +
                 fat_weight * fat_diff +
                 carbs_weight * carbs_diff)

        return (score,)

    creator.create("FitnessMin", base.Fitness, weights=(-1.0,))
    creator.create("Individual", list, fitness=creator.FitnessMin)

    toolbox = base.Toolbox()

    def create_attr_quantity(idx):
        if idx in integer_indices:
            return random.randint(int(low[idx]), int(up[idx]))
        else:
            return random.uniform(low[idx], up[idx])

    toolbox.register("individual", tools.initIterate, creator.Individual,
                     lambda: [create_attr_quantity(i) for i in range(len(available_foods))])
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)

    toolbox.register("evaluate", evaluate)

    def mate_individual(ind1, ind2):
        for i in range(len(ind1)):
            if random.random() < 0.5:
                ind1[i], ind2[i] = ind2[i], ind1[i]
        return ind1, ind2

    toolbox.register("mate", mate_individual)

    def mutate_individual(individual):
        for i in range(len(individual)):
            if random.random() < 0.2:
                if i in integer_indices:
                    individual[i] = random.randint(int(low[i]), int(up[i]))
                else:
                    individual[i] = random.uniform(low[i], up[i])
        return individual,

    toolbox.register("mutate", mutate_individual)
    toolbox.register("select", tools.selTournament, tournsize=5)

    def enforce_bounds(individual):
        for i in range(len(individual)):
            if individual[i] < low[i]:
                individual[i] = low[i]
            elif individual[i] > up[i]:
                individual[i] = up[i]
            if i in integer_indices:
                individual[i] = int(round(individual[i]))

    stats = tools.Statistics(lambda ind: ind.fitness.values)
    stats.register("avg", np.mean)
    stats.register("min", np.min)

    num_runs = 1
    NGEN = 2000

    best_individuals = []

    for run in range(num_runs):
        population = toolbox.population(n=2000)
        hof = tools.HallOfFame(10)

        # 世代ごとにコールバック関数を呼び出す
        for gen in range(NGEN):
            population, logbook = algorithms.eaSimple(
                population, toolbox, cxpb=0.7, mutpb=0.3, ngen=1, # ngenを1に設定
                stats=stats, halloffame=hof, verbose=False
            )
            progress = int((gen + 1) / NGEN * 100)
            optimization_progress["progress"] = progress
            optimization_progress["status"] = f"最適化中... {progress}%"

        best_individuals.extend(hof)

    unique_best_individuals = []
    seen = set()
    for ind in best_individuals:
        ind_key = tuple(round(gene, 2) for gene in ind)
        if ind_key not in seen:
            seen.add(ind_key)
            unique_best_individuals.append(ind)

    top_n = 1
    selected_individuals = unique_best_individuals[:top_n]

    results = []

    for idx, best_ind in enumerate(selected_individuals):
        best_ind_copy = best_ind[:]
        enforce_bounds(best_ind_copy)
        menu = []
        for i, quantity in enumerate(best_ind_copy):
            food_name = available_foods[i]
            unit = pfc_dict[food_name]['unit']
            if quantity > 0:
                if unit == '個':
                    quantity_display = int(quantity)
                else:
                    quantity_display = round(quantity, 2)
                menu.append({
                    'food_name': food_name,
                    'quantity': quantity_display,
                    'unit': unit,
                    'max_quantity': up[i]
                })

        total_protein = 0
        total_fat = 0
        total_carbs = 0

        for i, quantity in enumerate(best_ind_copy):
            food_name = available_foods[i]
            pfc = pfc_dict[food_name]
            factor = quantity
            total_protein += pfc['protein'] * factor
            total_fat += pfc['fat'] * factor
            total_carbs += pfc['carbs'] * factor

        protein_diff = total_protein - ideal_pfc['protein']
        fat_diff = total_fat - ideal_pfc['fat']
        carbs_diff = total_carbs - ideal_pfc['carbs']

        total_diff = abs(protein_diff) + abs(fat_diff) + abs(carbs_diff)

        results.append({
            'menu': menu,
            'total_protein': total_protein,
            'total_fat': total_fat,
            'total_carbs': total_carbs,
            'protein_diff': protein_diff,
            'fat_diff': fat_diff,
            'carbs_diff': carbs_diff,
            'total_diff': total_diff
        })

    return results

# 最適化を非同期で実行する関数
def run_optimization(available_foods, max_quantities, ideal_pfc):
    global optimization_progress, optimization_result
    optimization_progress = {"progress": 0, "status": "最適化を開始しています..."}
    
    results = optimize_pfc(available_foods, max_quantities, ideal_pfc)
    
    optimization_progress = {"progress": 100, "status": "最適化が完了しました"}
    optimization_result = results

# 食材名の一覧を取得する関数
def get_food_names() -> List[str]:
    return list(pfc_dict.keys())

# 食材名を検索する関数
def search_food_names(query: str) -> List[str]:
    query = query.lower()
    return [name for name in get_food_names() if query in name.lower()]

# エンドポイントの定義
@app.post("/optimize")
async def optimize_food(food_selection: FoodSelection, background_tasks: BackgroundTasks):
    global optimization_progress, optimization_result
    optimization_progress = {"progress": 0, "status": "最適化を開始しています..."}
    optimization_result = None

    available_foods = [item.name for item in food_selection.foods]
    max_quantities = [item.max_quantity for item in food_selection.foods]
    ideal_pfc = food_selection.ideal_pfc

    # 入力の検証
    for food in available_foods:
        if food not in pfc_dict:
            return {"error": f"{food} はデータに存在しません。"}

    # バックグラウンドタスクとして最適化を実行
    background_tasks.add_task(run_optimization, available_foods, max_quantities, ideal_pfc)

    return {"message": "最適化を開始しました"}

# 進捗状況を取得するエンドポイント
@app.get("/optimization_progress")
async def get_optimization_progress():
    global optimization_progress, optimization_result
    if optimization_result is not None:
        return {"progress": 100, "status": "完了", "result": optimization_result}
    return optimization_progress

# ジャンル名の英語から日本語への変換辞書
genre_translation = {
    'dairy': '乳製品',
    'fruits': '果物',
    'grains': '穀物',
    'meat': '肉',
    'mushrooms': 'きのこ',
    'nuts': 'ナッツ',
    'salad': 'サラダ',
    'seafood': '魚介類',
    'seaweed': '海藻',
    'sugar': '砂糖',
    'tubers': 'イモ類'
}

# ジャンルごとの食材リストを作成 (日本語ジャンル名を使用)
genre_foods: Dict[str, List[str]] = {}
for _, row in df.iterrows():
    genre_en = row['genre']
    if pd.isna(genre_en):  # ジャンルが空の場合はスキップ
        continue
    genre_ja = genre_translation.get(genre_en, genre_en)  # 翻訳がない場合は英語をそのまま使用
    food_name = row['food_name']
    if pd.isna(food_name):  # 食材名が空の場合はスキップ
        continue
    if genre_ja not in genre_foods:
        genre_foods[genre_ja] = []
    genre_foods[genre_ja].append(food_name)

# ジャンルの一覧を取得するエンドポイント
@app.get("/genres")
def get_genres():
    return {"genres": list(genre_foods.keys())}

# 特定のジャンルの食材リストを取得するエンドポイント
@app.get("/foods_in_genre/{genre}")
def get_foods_in_genre(genre: str):
    if genre not in genre_foods:
        raise HTTPException(status_code=404, detail="ジャンルが見つかりません")
    return {"foods": genre_foods[genre]}

# 新しいエンドポイント: 食材の詳細情報を取得
@app.get("/food_details/{food_name}")
def get_food_details(food_name: str):
    if food_name not in pfc_dict:
        raise HTTPException(status_code=404, detail="食材が見つかりません")
    food_info = pfc_dict[food_name]
    return {
        "name": food_name,
        "protein": food_info["protein"],
        "fat": food_info["fat"],
        "carbs": food_info["carbs"],
        "unit": food_info["unit"]
    }

# 新しいエンドポイント: 食材名の一覧を取得
@app.get("/food_names")
def food_names():
    return {"food_names": get_food_names()}

# 新しいエンドポイント: 食材名を検索
@app.get("/search_food")
def search_food(query: str):
    return {"results": search_food_names(query)}