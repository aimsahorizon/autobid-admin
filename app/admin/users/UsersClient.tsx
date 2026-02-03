'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  CheckCircle,
  XCircle,
  Shield,
  User as UserIcon,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Eye,
  EyeOff,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { createUser, updateUser, deleteUser, toggleUserStatus, type UserFormData } from './actions'

interface UserRole {
  id: string
  role_name: string
  display_name: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type User = Record<string, any>

interface UsersClientProps {
  initialUsers: User[]
  roles: UserRole[]
}

type ModalMode = 'view' | 'create' | 'edit' | 'delete'

interface FormState {
  email: string
  password: string
  username: string
  first_name: string
  last_name: string
  middle_name: string
  date_of_birth: string
  sex: 'male' | 'female' | ''
  role_id: string
  is_verified: boolean
  is_active: boolean
}

const initialFormState: FormState = {
  email: '',
  password: '',
  username: '',
  first_name: '',
  last_name: '',
  middle_name: '',
  date_of_birth: '',
  sex: '',
  role_id: '',
  is_verified: false,
  is_active: true,
}

export default function UsersClient({ initialUsers, roles }: UsersClientProps) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'verified' | 'unverified' | 'active' | 'inactive'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalMode, setModalMode] = useState<ModalMode | null>(null)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.username?.toLowerCase().includes(search.toLowerCase())

    if (filter === 'all') return matchesSearch
    if (filter === 'verified') return matchesSearch && user.is_verified
    if (filter === 'unverified') return matchesSearch && !user.is_verified
    if (filter === 'active') return matchesSearch && user.is_active
    if (filter === 'inactive') return matchesSearch && !user.is_active

    return matchesSearch
  })

  const getKycStatus = (user: User) => {
    const kycDoc = user.kyc_documents?.[0]
    if (!kycDoc) return 'none'
    return kycDoc.kyc_statuses?.status_name || 'none'
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const openCreateModal = () => {
    setFormState({
      ...initialFormState,
      role_id: roles.find((r) => r.role_name === 'buyer')?.id || '',
    })
    setSelectedUser(null)
    setModalMode('create')
    setError(null)
  }

  const openEditModal = (user: User) => {
    setFormState({
      email: user.email,
      password: '',
      username: user.username || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      middle_name: user.middle_name || '',
      date_of_birth: user.date_of_birth || '',
      sex: (user.sex as 'male' | 'female') || '',
      role_id: user.role_id || '',
      is_verified: user.is_verified,
      is_active: user.is_active,
    })
    setSelectedUser(user)
    setModalMode('edit')
    setError(null)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setModalMode('delete')
    setError(null)
  }

  const openViewModal = (user: User) => {
    setSelectedUser(user)
    setModalMode('view')
    setError(null)
  }

  const closeModal = () => {
    setSelectedUser(null)
    setModalMode(null)
    setFormState(initialFormState)
    setError(null)
    setShowPassword(false)
  }

  const validateForm = (): string | null => {
    if (modalMode === 'create') {
      if (!formState.email) return 'Email is required'
      if (!formState.username) return 'Username is required'
      if (!formState.first_name) return 'First name is required'
      if (!formState.last_name) return 'Last name is required'
      if (!formState.date_of_birth) return 'Date of birth is required'
      if (!formState.sex) return 'Sex is required'
      if (!formState.password || formState.password.length < 8) {
        return 'Password must be at least 8 characters'
      }
    }
    if (modalMode === 'edit') {
      if (!formState.first_name) return 'First name is required'
      if (!formState.last_name) return 'Last name is required'
    }
    return null
  }

  const handleCreateUser = async () => {
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const fullName = formState.middle_name
      ? `${formState.first_name} ${formState.middle_name} ${formState.last_name}`
      : `${formState.first_name} ${formState.last_name}`

    const userData: UserFormData = {
      email: formState.email,
      password: formState.password,
      username: formState.username,
      full_name: fullName,
      first_name: formState.first_name,
      last_name: formState.last_name,
      middle_name: formState.middle_name || undefined,
      date_of_birth: formState.date_of_birth,
      sex: formState.sex as 'male' | 'female',
      role_id: formState.role_id || null,
      is_verified: formState.is_verified,
      is_active: formState.is_active,
    }

    const result = await createUser(userData)

    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error || 'Failed to create user')
    }

    setLoading(false)
  }

  const handleUpdateUser = async () => {
    if (!selectedUser) return

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)

    const result = await updateUser(selectedUser.id, {
      first_name: formState.first_name,
      last_name: formState.last_name,
      middle_name: formState.middle_name || undefined,
      role_id: formState.role_id || null,
      is_verified: formState.is_verified,
      is_active: formState.is_active,
    })

    if (result.success) {
      closeModal()
      router.refresh()
    } else {
      setError(result.error || 'Failed to update user')
    }

    setLoading(false)
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return

    setLoading(true)
    setError(null)

    const result = await deleteUser(selectedUser.id)

    if (result.success) {
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))
      closeModal()
      router.refresh()
    } else {
      setError(result.error || 'Failed to delete user')
    }

    setLoading(false)
  }

  const handleToggleStatus = async (user: User, field: 'is_verified' | 'is_active') => {
    const result = await toggleUserStatus(user.id, field)

    if (result.success && result.data) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, [field]: (result.data as Record<string, boolean>)[field] } : u
        )
      )
      if (selectedUser?.id === user.id) {
        setSelectedUser({ ...selectedUser, [field]: (result.data as Record<string, boolean>)[field] })
      }
    }
  }

  return (
    <>
      {/* Filters & Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['all', 'verified', 'unverified', 'active', 'inactive'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.length === 0 ? (
          <div className="col-span-full bg-white rounded-xl border border-gray-200 p-12 text-center">
            <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No users found</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div onClick={() => openViewModal(user)} className="cursor-pointer">
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.full_name || 'User'}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg font-medium text-purple-700">
                        {getInitials(user.full_name, user.email)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    onClick={() => openViewModal(user)}
                    className="font-medium text-gray-900 truncate cursor-pointer hover:text-purple-600"
                  >
                    {user.full_name || 'No Name'}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                  {user.username && (
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {user.is_verified ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <XCircle className="w-3 h-3" />
                        Unverified
                      </span>
                    )}
                    {getKycStatus(user) === 'approved' && (
                      <span className="inline-flex items-center gap-1 text-xs text-blue-600">
                        <Shield className="w-3 h-3" />
                        KYC
                      </span>
                    )}
                    {!user.is_active && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600">
                        <XCircle className="w-3 h-3" />
                        Inactive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(user)}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                    title="Edit User"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(user)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <StatusBadge status={user.user_roles?.display_name || 'Buyer'} variant="purple" />
                <p className="text-xs text-gray-400">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* View User Modal */}
      {modalMode === 'view' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedUser.profile_image_url ? (
                  <img
                    src={selectedUser.profile_image_url}
                    alt={selectedUser.full_name || 'User'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-medium text-purple-700">
                      {getInitials(selectedUser.full_name, selectedUser.email)}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedUser.full_name || 'No Name'}
                  </h2>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  {selectedUser.username && (
                    <p className="text-sm text-gray-400">@{selectedUser.username}</p>
                  )}
                </div>
              </div>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Role</p>
                  <p className="font-medium text-gray-900">
                    {selectedUser.user_roles?.display_name || 'Buyer'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                  <p className="font-medium text-gray-900">
                    {selectedUser.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Verified</p>
                  <p className="font-medium text-gray-900">
                    {selectedUser.is_verified ? 'Yes' : 'No'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">KYC Status</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {getKycStatus(selectedUser).replace(/_/g, ' ')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Sex</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {selectedUser.sex || 'Not specified'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {selectedUser.date_of_birth
                      ? new Date(selectedUser.date_of_birth).toLocaleDateString()
                      : 'Not provided'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Joined</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedUser.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Close
                </button>
                <button
                  onClick={() => openEditModal(selectedUser)}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  Edit User
                </button>
                <button
                  onClick={() => handleToggleStatus(selectedUser, 'is_active')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    selectedUser.is_active
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedUser.is_active ? 'Suspend' : 'Activate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {modalMode === 'create' ? 'Create New User' : 'Edit User'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Account Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formState.email}
                      onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                      disabled={modalMode === 'edit'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={formState.username}
                      onChange={(e) => setFormState({ ...formState, username: e.target.value })}
                      disabled={modalMode === 'edit'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      placeholder="johndoe"
                    />
                  </div>
                  {modalMode === 'create' && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={formState.password}
                          onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                          className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                          placeholder="Minimum 8 characters"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border-b border-gray-200 pb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formState.first_name}
                      onChange={(e) => setFormState({ ...formState, first_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Middle Name
                    </label>
                    <input
                      type="text"
                      value={formState.middle_name}
                      onChange={(e) => setFormState({ ...formState, middle_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="Michael"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formState.last_name}
                      onChange={(e) => setFormState({ ...formState, last_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                      placeholder="Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth {modalMode === 'create' && '*'}
                    </label>
                    <input
                      type="date"
                      value={formState.date_of_birth}
                      onChange={(e) => setFormState({ ...formState, date_of_birth: e.target.value })}
                      disabled={modalMode === 'edit'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sex {modalMode === 'create' && '*'}
                    </label>
                    <select
                      value={formState.sex}
                      onChange={(e) => setFormState({ ...formState, sex: e.target.value as 'male' | 'female' | '' })}
                      disabled={modalMode === 'edit'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Sex</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Role & Status */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Role & Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <select
                      value={formState.role_id}
                      onChange={(e) => setFormState({ ...formState, role_id: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.display_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-6 pt-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.is_verified}
                        onChange={(e) => setFormState({ ...formState, is_verified: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Email Verified</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formState.is_active}
                        onChange={(e) => setFormState({ ...formState, is_active: e.target.checked })}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={closeModal}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={modalMode === 'create' ? handleCreateUser : handleUpdateUser}
                  disabled={loading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : modalMode === 'create' ? (
                    <>
                      <Plus className="w-4 h-4" />
                      Create User
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {modalMode === 'delete' && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Delete User</h2>
                <p className="text-gray-500 text-sm">This action cannot be undone</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600">
                Are you sure you want to delete the user{' '}
                <strong>{selectedUser.full_name || selectedUser.email}</strong>?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This will permanently delete:
              </p>
              <ul className="text-sm text-gray-500 list-disc list-inside mt-1">
                <li>User account and authentication</li>
                <li>All associated KYC documents</li>
                <li>Auction listings and bids</li>
                <li>Transaction history</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete User
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
