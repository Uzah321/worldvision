import { useQuery } from '@tanstack/react-query'
import { Users, Truck, Package, ShoppingCart, AlertTriangle, TrendingUp } from 'lucide-react'
import api from '../lib/api'
import type { DashboardStats } from '../types'
import { cn } from '../lib/utils'

function StatCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string; value: number | string; sub?: string
  icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-white border border-gray-200 p-5 flex items-start gap-4">
      <div className={cn('w-11 h-11 flex items-center justify-center flex-shrink-0', color)}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/reports/dashboard').then((r) => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 p-5 h-28 animate-pulse" />
        ))}
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-sm">Failed to load dashboard. Check that the backend is running.</p>
      </div>
    )
  }

  const s = data

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Real-time overview of aid management operations</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Beneficiaries"   value={s.beneficiaries.total.toLocaleString()}
          sub={`${s.beneficiaries.active.toLocaleString()} active`}
          icon={Users} color="bg-blue-600" />
        <StatCard label="New This Month"        value={s.beneficiaries.this_month.toLocaleString()}
          icon={TrendingUp} color="bg-emerald-600" />
        <StatCard label="Distributions"         value={s.distributions.completed.toLocaleString()}
          sub={`${s.distributions.in_progress} in progress`}
          icon={Truck} color="bg-violet-600" />
        <StatCard label="Planned Distributions" value={s.distributions.planned.toLocaleString()}
          icon={Truck} color="bg-amber-500" />
        <StatCard label="Near-Expiry Stock"     value={s.inventory.near_expiry.toLocaleString()}
          sub="items within 30 days"
          icon={AlertTriangle} color={s.inventory.near_expiry > 0 ? 'bg-red-500' : 'bg-gray-400'} />
        <StatCard label="Below Reorder Level"   value={s.inventory.below_reorder.toLocaleString()}
          icon={Package} color={s.inventory.below_reorder > 0 ? 'bg-orange-500' : 'bg-gray-400'} />
        <StatCard label="Pending PO Approvals"  value={s.procurement.pending_approval.toLocaleString()}
          icon={ShoppingCart} color={s.procurement.pending_approval > 0 ? 'bg-yellow-500' : 'bg-gray-400'} />
        <StatCard label="POs This Month"        value={s.procurement.this_month.toLocaleString()}
          icon={ShoppingCart} color="bg-sky-600" />
      </div>

      {/* Quick-action alerts */}
      {(s.inventory.near_expiry > 0 || s.procurement.pending_approval > 0) && (
        <div className="bg-amber-50 border border-amber-200 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
            <AlertTriangle size={16} /> Action Required
          </p>
          {s.inventory.near_expiry > 0 && (
            <p className="text-sm text-amber-700">
              • {s.inventory.near_expiry} inventory item(s) are expiring within 30 days.
            </p>
          )}
          {s.procurement.pending_approval > 0 && (
            <p className="text-sm text-amber-700">
              • {s.procurement.pending_approval} procurement order(s) awaiting approval.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
