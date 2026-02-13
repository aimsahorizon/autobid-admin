import { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  color?: 'purple' | 'blue' | 'green' | 'orange' | 'red' // Kept for compatibility but will be used subtly
}

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
}: StatsCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 hover:border-purple-200 transition-colors group">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <Icon className="w-5 h-5 text-gray-400 group-hover:text-purple-500 transition-colors" />
        </div>
        
        <div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                  trend.isPositive 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              <span className="text-xs text-gray-400">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
