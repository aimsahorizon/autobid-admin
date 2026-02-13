'use client'

import { useState, useEffect } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminHeader from '@/components/admin/AdminHeader'

interface AdminLayoutClientProps {
  children: React.ReactNode
  user: any // Using any to avoid complex type duplication for now, but in prod should be properly typed
}

export default function AdminLayoutClient({ children, user }: AdminLayoutClientProps) {
  const [collapsed, setCollapsed] = useState(false)
  
  // Persist sidebar state
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved) {
      setCollapsed(JSON.parse(saved))
    }
  }, [])

  const handleSetCollapsed = (val: boolean) => {
    setCollapsed(val)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(val))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar collapsed={collapsed} setCollapsed={handleSetCollapsed} />
      
      <div 
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          collapsed ? 'lg:pl-20' : 'lg:pl-72'
        }`}
      >
        <AdminHeader user={user} />
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
