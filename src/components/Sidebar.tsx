// src/components/Sidebar.tsx
'use client'

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 h-full w-64 bg-white shadow-lg z-50"
          >
            <div className="p-4">
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <X className="h-6 w-6 text-primary" />
              </button>
              <nav className="mt-8">
                <ul className="space-y-4">
                  <li>
                    <a href="/" className="text-lg font-medium text-primary hover:text-primary-dark">
                      ホーム
                    </a>
                  </li>
                  {/* 他のメニュー項目 */}
                </ul>
              </nav>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};