import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Search } from 'lucide-react';
import { getFoodsInGenre } from '../lib/api';

interface GenreDialogProps {
  isOpen: boolean;
  onClose: () => void;
  genre: string;
  onFoodSelect: (food: string) => void;
}

export const GenreDialog: React.FC<GenreDialogProps> = ({ isOpen, onClose, genre, onFoodSelect }) => {
  const [foods, setFoods] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchFoods = async () => {
      if (genre) {
        const foodList = await getFoodsInGenre(genre);
        setFoods(foodList);
      }
    };
    fetchFoods();
  }, [genre]);

  const filteredFoods = foods.filter(food =>
    food.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4">
          <DialogTitle className="text-2xl">{genre}</DialogTitle>
        </DialogHeader>
        <div className="px-6 py-2">
          <div className="relative">
            <Input
              type="text"
              placeholder="食材を検索..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
        <ScrollArea className="flex-grow px-6 pb-6">
          <div className="grid grid-cols-3 gap-4">
            {filteredFoods.map((food, index) => (
              <motion.div
                key={food}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => onFoodSelect(food)}
                >
                  <CardContent className="flex items-center justify-center h-24">
                    <span className="text-sm font-medium text-center">{food}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};