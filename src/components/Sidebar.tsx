'use client';

import { useState } from 'react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="bg-gray-800 text-white w-64 min-h-screen hidden md:block">
        <nav className="p-4">
          <ul>
            <li className="mb-2">
              <a href="/" className="hover:text-gray-300">
                ホーム
              </a>
            </li>
            {/* 他のメニュー項目 */}
          </ul>
        </nav>
      </div>
      {/* モバイル用メニュー */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(true)}
          className="p-4 focus:outline-none"
        >
          <Bars3Icon className="h-6 w-6 text-gray-800" />
        </button>
        {isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
            <div className="fixed inset-y-0 left-0 bg-gray-800 text-white w-64 p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="mb-4 focus:outline-none"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
              <nav>
                <ul>
                  <li className="mb-2">
                    <a href="/" className="hover:text-gray-300">
                      ホーム
                    </a>
                  </li>
                  {/* 他のメニュー項目 */}
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
