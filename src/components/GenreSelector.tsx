import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronUp, Milk, Apple, Wheat, Beef, Cookie, Salad, Fish, Candy } from 'lucide-react';
import { GiMushroom } from "react-icons/gi";
import { GiAtSea } from "react-icons/gi";
import { GiPotato } from "react-icons/gi";
import { getGenres } from '../lib/api';
import { GenreDialog } from './GenreDialog';

interface GenreSelectorProps {
  onFoodSelect: (food: string) => void;
}

const genreIcons: { [key: string]: React.ReactNode } = {
  '乳製品': <Milk className="h-6 w-6" />,
  '果物': <Apple className="h-6 w-6" />,
  '穀物': <Wheat className="h-6 w-6" />,
  '肉': <Beef className="h-6 w-6" />,
  'きのこ': <GiMushroom className="h-6 w-6" />,
  'ナッツ': <Cookie className="h-6 w-6" />,
  'サラダ': <Salad className="h-6 w-6" />,
  '魚介類': <Fish className="h-6 w-6" />,
  '海藻': <GiAtSea className="h-6 w-6" />,
  '砂糖': <Candy className="h-6 w-6" />,
  'イモ類': <GiPotato className="h-6 w-6" />,
};

export const GenreSelector: React.FC<GenreSelectorProps> = ({ onFoodSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const fetchGenres = async () => {
      const genreList = await getGenres();
      setGenres(genreList);
    };
    fetchGenres();
  }, []);

  const handleGenreSelect = (genre: string) => {
    setSelectedGenre(genre);
    setIsDialogOpen(true);
  };

  const handleFoodSelect = (food: string) => {
    onFoodSelect(food);
    setIsDialogOpen(false);
    setIsOpen(false);
  };

  return (
    <div className="mb-4">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        variant="outline"
      >
        ジャンル別に探す
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </motion.div>
      </Button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ScrollArea className="h-[300px] mt-2">
              <div className="grid grid-cols-2 gap-4 p-4">
                {genres.map((genre) => (
                  <Card
                    key={genre}
                    className="cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => handleGenreSelect(genre)}
                  >
                    <CardContent className="flex items-center justify-center h-24 p-4">
                      <div className="flex flex-col items-center space-y-2">
                        {genreIcons[genre] || <Beef className="h-6 w-6" />}
                        <span className="text-sm font-medium">{genre}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
      <GenreDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        genre={selectedGenre || ''}
        onFoodSelect={handleFoodSelect}
      />
    </div>
  );
};