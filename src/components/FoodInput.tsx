// frontend/src/components/FoodInput.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react';
import { searchFood, getFoodNames } from '../lib/api';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PlusCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface FoodInputProps {
  onAddFood: (name: string, maxQuantity: number) => void;
}

export const FoodInput: React.FC<FoodInputProps> = ({ onAddFood }) => {
  const [foodName, setFoodName] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allFoodNames, setAllFoodNames] = useState<string[]>([]);
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

  const handleSuggestionClick = (suggestion: string) => {
    setFoodName(suggestion);
    setShowSuggestions(false);
  };

  const handleAddFood = () => {
    if (foodName && maxQuantity) {
      if (allFoodNames.includes(foodName)) {
        onAddFood(foodName, Number(maxQuantity));
        setFoodName('');
        setMaxQuantity('');
      } else {
        toast.error('正しい食材名を入力してください');
      }
    }
  };

  return (
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
        <Input
          type="number"
          placeholder="最大量"
          value={maxQuantity}
          onChange={(e) => setMaxQuantity(e.target.value)}
          className="w-24"
        />
        <Button onClick={handleAddFood}>
          <PlusCircle className="mr-2 h-4 w-4" /> 追加
        </Button>
      </div>
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionRef}
          className="absolute z-10 w-full bg-background border border-input rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          <ul className="py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="px-4 py-2 hover:bg-accent cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};