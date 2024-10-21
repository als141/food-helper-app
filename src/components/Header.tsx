// src/components/Header.tsx
'use client'

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface HeaderProps {
  toggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen(!isMenuOpen);
    toggleSidebar();
  };

  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between">
      <h1 className="text-2xl font-bold text-primary">Food Helper App</h1>
      <motion.button
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
        onClick={handleMenuClick}
        whileTap={{ scale: 0.95 }}
      >
        <Menu className="h-6 w-6 text-primary" />
      </motion.button>
    </header>
  );
};