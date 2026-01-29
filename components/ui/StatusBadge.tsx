interface StatusBadgeProps {
  status: string
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'purple'
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  error: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
}

export function getStatusVariant(status: string): StatusBadgeProps['variant'] {
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
    return 'info'
  }
  return 'default'
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const finalVariant = variant || getStatusVariant(status) || 'default'

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[finalVariant]}`}
    >
      {status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
    </span>
  )
}
