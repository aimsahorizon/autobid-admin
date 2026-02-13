'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Bell, LogOut, User, ChevronDown } from 'lucide-react'

interface AdminHeaderProps {
  user: {
    admin_roles?: { role_name: string; display_name: string }
    users?: { full_name: string; email: string; profile_image_url: string | null }
  }
}

export default function AdminHeader({ user }: AdminHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const initials = user.users?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'AD'

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-6 transition-all">
      <div className="flex items-center gap-6">
        {/* Notifications */}
        <button className="relative group p-2 rounded-full hover:bg-gray-50 transition-colors">
          <Bell className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
        </button>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-3 p-1 rounded-full hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 pr-3"
          >
            {user.users?.profile_image_url ? (
              <img
                src={user.users.profile_image_url}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-50 rounded-full flex items-center justify-center ring-2 ring-gray-50">
                <span className="text-xs font-bold text-purple-700">{initials}</span>
              </div>
            )}
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-700">
                {user.users?.full_name || 'Admin'}
              </p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl shadow-gray-200/50 border border-gray-100 py-2 z-50 transform origin-top-right transition-all">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-sm font-semibold text-gray-900">
                  {user.users?.full_name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{user.users?.email}</p>
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                  {user.admin_roles?.display_name || 'Administrator'}
                </div>
              </div>
              
              <div className="p-1">
                <button
                  onClick={() => router.push('/admin/settings')}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
