'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Shield, Key, Loader2, CheckCircle, Mail, Calendar } from 'lucide-react'

interface SettingsClientProps {
  adminUser: {
    admin_roles?: { role_name: string; display_name: string }
    users?: { id: string; full_name: string; email: string; profile_image_url: string | null; created_at: string }
  } | null
}

export default function SettingsClient({ adminUser }: SettingsClientProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }

    setLoading(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-gray-50 to-gray-100"></div>
          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              <div className="bg-white p-1.5 rounded-full ring-1 ring-gray-100">
                {adminUser?.users?.profile_image_url ? (
                  <img
                    src={adminUser.users.profile_image_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-sm">
                    <span className="text-3xl font-bold">
                      {getInitials(adminUser?.users?.full_name || null, adminUser?.users?.email || 'A')}
                    </span>
                  </div>
                )}
              </div>
              <div className="mb-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold border border-purple-100">
                  <Shield className="w-3 h-3" />
                  {adminUser?.admin_roles?.display_name || 'Administrator'}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {adminUser?.users?.full_name || 'Admin User'}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  {adminUser?.users?.email}
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {adminUser?.users?.created_at ? new Date(adminUser.users.created_at).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-2xl border border-gray-100 p-8">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                <Key className="w-5 h-5" />
             </div>
             <div>
                <h2 className="text-lg font-bold text-gray-900">Security</h2>
                <p className="text-sm text-gray-500">Update your password</p>
             </div>
          </div>
          
          <form onSubmit={handlePasswordChange} className="space-y-5 max-w-md">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Password updated successfully
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm"
                placeholder="Minimum 8 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-purple-100 focus:border-purple-400 outline-none transition-all text-sm"
                placeholder="••••••••"
              />
            </div>
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Account Status</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-green-500">
                <CheckCircle className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-sm font-medium text-gray-900">Active</p>
                 <p className="text-xs text-gray-500">Full access granted</p>
              </div>
            </div>
            
             <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center text-purple-500">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                 <p className="text-sm font-medium text-gray-900">Admin</p>
                 <p className="text-xs text-gray-500">System management</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 text-white text-center">
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
             <Shield className="w-6 h-6 text-purple-200" />
          </div>
          <h3 className="font-bold mb-1">AutoBid Admin</h3>
          <p className="text-sm text-purple-200 mb-4">
            Version 1.0.0
          </p>
          <div className="text-xs text-white/40 border-t border-white/10 pt-4">
            Built with Next.js & Supabase
          </div>
        </div>
      </div>
    </div>
  )
}
