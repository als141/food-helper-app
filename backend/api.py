from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import pandas as pd
import time
from deap import base, creator, tools, algorithms
import numpy as np
from typing import List

app = FastAPI()

origins = [
    "https://food-helper-app.vercel.app",
    "http://localhost",
    "http://localhost:8000",
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

# 進化計算によるPFCバランスの最適化を関数化
def optimize_pfc(available_foods, max_quantities, ideal_pfc):
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

        algorithms.eaSimple(
            population, toolbox, cxpb=0.7, mutpb=0.3, ngen=NGEN,
            stats=stats, halloffame=hof, verbose=False
        )

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

# 食材名の一覧を取得する関数
def get_food_names() -> List[str]:
    return list(pfc_dict.keys())

# 食材名を検索する関数
def search_food_names(query: str) -> List[str]:
    query = query.lower()
    return [name for name in get_food_names() if query in name.lower()]



# エンドポイントの定義
@app.post("/optimize")
def optimize_food(food_selection: FoodSelection):
    available_foods = [item.name for item in food_selection.foods]
    max_quantities = [item.max_quantity for item in food_selection.foods]
    ideal_pfc = food_selection.ideal_pfc

    # 入力の検証
    for food in available_foods:
        if food not in pfc_dict:
            return {"error": f"{food} はデータに存在しません。"}

    results = optimize_pfc(available_foods, max_quantities, ideal_pfc)
    return results

# 新しいエンドポイント: 食材名の一覧を取得
@app.get("/food_names")
def food_names():
    return {"food_names": get_food_names()}

# 新しいエンドポイント: 食材名を検索
@app.get("/search_food")
def search_food(query: str):
    return {"results": search_food_names(query)}