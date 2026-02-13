'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Car,
  Database,
  FileCheck,
  Gavel,
  CreditCard,
  Settings,
  ChevronLeft,
  Menu,
  MapPin,
} from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Listings', href: '/admin/listings', icon: Car },
  { name: 'Vehicle DB', href: '/admin/vehicles', icon: Database },
  { name: 'KYC Verification', href: '/admin/kyc', icon: FileCheck },
  { name: 'Auctions', href: '/admin/auctions', icon: Gavel },
  { name: 'Transactions', href: '/admin/transactions', icon: CreditCard },
  { name: 'Locations', href: '/admin/locations', icon: MapPin },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-sm border border-gray-200 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-white border-r border-gray-100 transition-all duration-300 ease-in-out ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Logo */}
        <div className="h-20 flex items-center justify-between px-6 mb-2">
          <Link href="/admin" className="flex items-center gap-3 group">
            <div className="w-8 h-8 bg-gray-900 text-white rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
              <span className="font-bold text-lg">A</span>
            </div>
            {!collapsed && (
              <span className="font-bold text-xl text-gray-900 tracking-tight">AutoBid<span className="text-purple-600">.</span></span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ChevronLeft
              className={`w-4 h-4 transition-transform duration-300 ${
                collapsed ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                  isActive
                    ? 'text-gray-900 bg-gray-50 font-medium'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-purple-600 rounded-r-full" />
                )}
                <item.icon
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`w-5 h-5 flex-shrink-0 transition-colors ${
                    isActive ? 'text-purple-600' : 'text-gray-400 group-hover:text-gray-600'
                  }`}
                />
                {!collapsed && (
                  <span className="text-sm">{item.name}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer/Version */}
        {!collapsed && (
          <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-gray-100 bg-white">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>v1.0.0</span>
              <span>© 2026</span>
            </div>
          </div>
        )}
      </aside>
    </>
  )
}
