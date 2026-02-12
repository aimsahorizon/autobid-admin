import React from 'react'

type StatusVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'

interface StatusBadgeProps {
  status: string
  variant?: StatusVariant
}

const variantStyles: Record<StatusVariant, string> = {
  default: "bg-gray-50 text-gray-700 border-gray-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  warning: "bg-amber-50 text-amber-700 border-amber-100",
  error: "bg-rose-50 text-rose-700 border-rose-100",
  info: "bg-blue-50 text-blue-700 border-blue-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
}

const dotStyles: Record<StatusVariant, string> = {
  default: "bg-gray-400",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  error: "bg-rose-500",
  info: "bg-blue-500",
  purple: "bg-purple-500",
}

export function getStatusVariant(status: string): StatusVariant {
  const statusLower = status.toLowerCase()
  if (['approved', 'completed', 'active', 'live', 'sold', 'won', 'verified'].includes(statusLower)) {
    return 'success'
  }
  if (['pending', 'pending_approval', 'under_review', 'scheduled', 'in_transaction'].includes(statusLower)) {
    return 'warning'
  }
  if (['rejected', 'cancelled', 'failed', 'expired', 'deal_failed', 'lost'].includes(statusLower)) {
    return 'error'
  }
  if (['draft', 'ended', 'unsold', 'outbid', 'refunded'].includes(statusLower)) {
    return 'default'
  }
  return 'default'
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const finalVariant = variant || getStatusVariant(status) || 'default'
  const displayStatus = status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${variantStyles[finalVariant]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[finalVariant]}`} />
      {displayStatus}
    </span>
  )
}
