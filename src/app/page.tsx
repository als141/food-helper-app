'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FoodItem, IdealPFC, ResultItem, optimizeFood, MenuItem, getOptimizationProgress, OptimizationProgress } from '../lib/api'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { Trash2 } from 'lucide-react'
import { toast, Toaster } from 'react-hot-toast'
import { FoodInput } from '../components/FoodInput'

export default function Home() {
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [idealPFC, setIdealPFC] = useState<IdealPFC>({
    protein: 140,
    fat: 60,
    carbs: 350,
  })
  const [result, setResult] = useState<ResultItem[] | null>(null)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState<OptimizationProgress | null>(null)

  const addFood = (name: string, maxQuantity: number) => {
    setFoods([
      ...foods,
      { name, max_quantity: maxQuantity },
    ])
    toast.success('食材を追加しました')
  }

  const removeFood = (index: number) => {
    setFoods(foods.filter((_, i) => i !== index))
    toast.success('食材を削除しました')
  }

  const handleOptimize = async () => {
    try {
      setIsOptimizing(true)
      setResult(null)
      setOptimizationProgress({ progress: 0, status: '最適化を開始しています...' })
      
      // 最適化処理を開始
      await optimizeFood(foods, idealPFC)

      // 進捗状況の更新を開始
      const progressInterval = setInterval(async () => {
        try {
          const progress = await getOptimizationProgress()
          setOptimizationProgress(progress)
          
          if (progress.progress >= 100 && progress.result) {
            clearInterval(progressInterval)
            setResult(progress.result)
            setIsOptimizing(false)
            toast.success('最適化が完了しました')
          }
        } catch (error) {
          console.error('進捗状況の取得に失敗しました:', error)
        }
      }, 1000) // 1秒ごとに進捗状況を更新
    } catch (error) {
      console.error(error)
      toast.error('最適化に失敗しました')
      setIsOptimizing(false)
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-8">
      <Toaster position="top-right" />
      <Card>
        <CardHeader>
          <CardTitle>食材の入力</CardTitle>
        </CardHeader>
        <CardContent>
          <FoodInput onAddFood={addFood} />
          <motion.ul className="mt-4 space-y-2">
            <AnimatePresence>
              {foods.map((food, index) => (
                <motion.li
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between bg-secondary p-2 rounded"
              >
                <span>
                  {food.name}: 最大量 {food.max_quantity}
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeFood(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>理想的なPFCバランス</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>タンパク質: {idealPFC.protein}g</Label>
          <Slider
            value={[idealPFC.protein]}
            min={0}
            max={300}
            step={1}
            onValueChange={(value) => setIdealPFC({ ...idealPFC, protein: value[0] })}
          />
        </div>
        <div className="space-y-2">
          <Label>脂質: {idealPFC.fat}g</Label>
          <Slider
            value={[idealPFC.fat]}
            min={0}
            max={300}
            step={1}
            onValueChange={(value) => setIdealPFC({ ...idealPFC, fat: value[0] })}
          />
        </div>
        <div className="space-y-2">
          <Label>炭水化物: {idealPFC.carbs}g</Label>
          <Slider
            value={[idealPFC.carbs]}
            min={0}
            max={300}
            step={1}
            onValueChange={(value) => setIdealPFC({ ...idealPFC, carbs: value[0] })}
          />
        </div>
      </CardContent>
    </Card>

    <Button onClick={handleOptimize} className="w-full" disabled={isOptimizing}>
        {isOptimizing ? '最適化中...' : '最適化'}
      </Button>

      {isOptimizing && optimizationProgress && (
        <Card>
          <CardHeader>
            <CardTitle>最適化の進捗状況</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={optimizationProgress.progress} className="w-full" />
            <p className="mt-2 text-center">{optimizationProgress.status}</p>
          </CardContent>
        </Card>
      )}

      <AnimatePresence>
        {result && result.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>提案メニュー</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result[0].menu.map((item: MenuItem, index: number) => (
                    <li key={index} className="flex justify-between items-center bg-secondary p-2 rounded">
                      <span>{item.food_name}</span>
                      <span>
                        {item.quantity}
                        {item.unit} / 最大 {item.max_quantity}
                        {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">合計PFC</h3>
                <div className="flex justify-between">
                  <span>タンパク質:</span>
                  <span>{result[0].total_protein.toFixed(2)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>脂質:</span>
                  <span>{result[0].total_fat.toFixed(2)}g</span>
                </div>
                <div className="flex justify-between">
                  <span>炭水化物:</span>
                  <span>{result[0].total_carbs.toFixed(2)}g</span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">PFC差分</h3>
                <div className="flex justify-between">
                  <span>タンパク質差:</span>
                  <span className={result[0].protein_diff >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {result[0].protein_diff >= 0 ? '+' : ''}
                    {result[0].protein_diff.toFixed(2)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>脂質差:</span>
                  <span className={result[0].fat_diff >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {result[0].fat_diff >= 0 ? '+' : ''}
                    {result[0].fat_diff.toFixed(2)}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>炭水化物差:</span>
                  <span className={result[0].carbs_diff >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {result[0].carbs_diff >= 0 ? '+' : ''}
                    {result[0].carbs_diff.toFixed(2)}g
                  </span>
                </div>
              </div>
              <div className="mt-4">
                <p className="font-bold text-lg">
                  総誤差: <span className="text-primary">{result[0].total_diff.toFixed(2)}g</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)
}