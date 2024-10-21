// src/app/layout.tsx
'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { useState } from 'react'
import { Header } from '../components/Header'
import { Sidebar } from '../components/Sidebar'
import { ThemeProvider } from "@/components/ui/theme-provider"

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex flex-col min-h-screen bg-background">
            <Header toggleSidebar={toggleSidebar} />
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <main className="flex-1 p-4 md:p-6 overflow-y-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}