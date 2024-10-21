import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchFood, getFoodNames, getFoodDetails } from '../lib/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { GenreSelector } from './GenreSelector';

interface FoodInputProps {
  onAddFood: (name: string, maxQuantity: number) => void;
}

export const FoodInput: React.FC<FoodInputProps> = ({ onAddFood }) => {
  const [foodName, setFoodName] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allFoodNames, setAllFoodNames] = useState<string[]>([]);
  const [unit, setUnit] = useState('');
  const suggestionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchAllFoodNames = async () => {
      const names = await getFoodNames();
      setAllFoodNames(names);
    };
    fetchAllFoodNames();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (foodName.length > 0) {
        const results = await searchFood(foodName);
        setSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [foodName]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSuggestionClick = async (suggestion: string) => {
    setFoodName(suggestion);
    setShowSuggestions(false);
    const details = await getFoodDetails(suggestion);
    setUnit(details.unit);
  };

  const handleAddFood = () => {
    if (foodName && maxQuantity) {
      if (allFoodNames.includes(foodName)) {
        onAddFood(foodName, Number(maxQuantity));
        setFoodName('');
        setMaxQuantity('');
        setUnit('');
      } else {
        toast.error('正しい食材名を入力してください');
      }
    }
  };

  const handleGenreSelect = async (food: string) => {
    setFoodName(food);
    const details = await getFoodDetails(food);
    setUnit(details.unit);
  };

  return (
    <div className="space-y-4">
      <GenreSelector onFoodSelect={handleGenreSelect} />
      <div className="relative">
        <div className="flex space-x-2 mb-2">
          <Input
            type="text"
            placeholder="食材名"
            value={foodName}
            onChange={(e) => setFoodName(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="flex-grow"
          />
          <div className="relative flex-shrink-0">
            <Input
              type="number"
              placeholder="最大量"
              value={maxQuantity}
              onChange={(e) => setMaxQuantity(e.target.value)}
              className="w-24 pr-8"
            />
            {unit && (
              <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {unit}
              </span>
            )}
          </div>
          <Button onClick={handleAddFood}>
            <PlusCircle className="mr-2 h-4 w-4" /> 追加
          </Button>
        </div>
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              ref={suggestionRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute z-10 w-full bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              <ul className="py-1">
                {suggestions.map((suggestion, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="px-4 py-2 hover:bg-accent cursor-pointer"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};