import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileBarChart, Users, Truck, Package, Target, ClipboardList } from 'lucide-react'
import api from '../lib/api'
import { formatDateTime, formatDate, cn } from '../lib/utils'

type Tab = 'distributions' | 'beneficiaries' | 'inventory' | 'kpis' | 'audit'

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'distributions', label: 'Distributions',  icon: Truck },
  { id: 'beneficiaries', label: 'Beneficiaries',  icon: Users },
  { id: 'inventory',     label: 'Inventory',      icon: Package },
  { id: 'kpis',          label: 'KPIs',           icon: Target },
  { id: 'audit',         label: 'Audit Log',      icon: ClipboardList },
]

function ReportTable({ queryKey, endpoint, columns }: {
  queryKey: string
  endpoint: string
  columns: { key: string; label: string; right?: boolean; format?: (v: any, row: any) => string }[]
}) {
  const { data, isLoading, isError } = useQuery<any>({
    queryKey: [queryKey],
    queryFn: () => api.get(endpoint).then((r) => r.data),
  })

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Loading report…</div>
  if (isError) return <div className="p-8 text-center text-sm text-red-500">Failed to load report.</div>

  const rows: any[] = Array.isArray(data) ? data : data?.data ?? []

  if (!rows.length) {
    return (
      <div className="p-12 text-center">
        <FileBarChart size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">No data available</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-200">
            {columns.map((col) => (
              <th key={col.key} className={cn('px-4 py-3 font-medium text-gray-600', col.right ? 'text-right' : 'text-left')}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50 transition-colors">
              {columns.map((col) => {
                const raw = col.key.split('.').reduce((acc, k) => acc?.[k], row)
                const val = col.format ? col.format(raw, row) : (raw ?? '—')
                return (
                  <td key={col.key} className={cn('px-4 py-3 text-gray-700', col.right ? 'text-right' : '')}>
                    {String(val)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const REPORT_CONFIGS: Record<Tab, { endpoint: string; columns: any[] }> = {
  distributions: {
    endpoint: '/reports/distributions',
    columns: [
      { key: 'distribution_number', label: 'Number' },
      { key: 'name',                label: 'Name' },
      { key: 'distribution_date',   label: 'Date',          format: (v: string) => formatDate(v) },
      { key: 'status',              label: 'Status' },
      { key: 'mode',                label: 'Mode' },
      { key: 'planned_beneficiaries', label: 'Planned',     right: true, format: (v: number) => v?.toLocaleString() },
      { key: 'actual_beneficiaries',  label: 'Actual',      right: true, format: (v: number) => v?.toLocaleString() ?? '—' },
    ],
  },
  beneficiaries: {
    endpoint: '/reports/beneficiaries',
    columns: [
      { key: 'beneficiary_number', label: 'Number' },
      { key: 'full_name',          label: 'Name' },
      { key: 'gender',             label: 'Gender' },
      { key: 'age',                label: 'Age',     right: true },
      { key: 'status',             label: 'Status' },
      { key: 'household.household_number', label: 'Household' },
    ],
  },
  inventory: {
    endpoint: '/reports/inventory',
    columns: [
      { key: 'commodity.name',       label: 'Commodity' },
      { key: 'warehouse.name',       label: 'Warehouse' },
      { key: 'batch_number',         label: 'Batch' },
      { key: 'quantity_available',   label: 'Available',    right: true, format: (v: number) => v?.toLocaleString() },
      { key: 'quantity_distributed', label: 'Distributed',  right: true, format: (v: number) => v?.toLocaleString() },
      { key: 'quantity_damaged',     label: 'Damaged',      right: true, format: (v: number) => v?.toLocaleString() },
      { key: 'expiry_date',          label: 'Expiry',       format: (v: string) => formatDate(v) },
      { key: 'status',               label: 'Status' },
    ],
  },
  kpis: {
    endpoint: '/reports/kpis',
    columns: [
      { key: 'indicator',     label: 'Indicator' },
      { key: 'target',        label: 'Target',   right: true },
      { key: 'achieved',      label: 'Achieved', right: true },
      { key: 'unit',          label: 'Unit' },
      { key: 'period',        label: 'Period' },
      { key: 'programme.name', label: 'Programme' },
    ],
  },
  audit: {
    endpoint: '/reports/audit-log',
    columns: [
      { key: 'created_at',    label: 'Timestamp',  format: (v: string) => formatDateTime(v) },
      { key: 'user.name',     label: 'User' },
      { key: 'module',        label: 'Module' },
      { key: 'event',         label: 'Event' },
      { key: 'description',   label: 'Description' },
      { key: 'ip_address',    label: 'IP' },
    ],
  },
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>('distributions')
  const config = REPORT_CONFIGS[tab]

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-sm text-gray-500 mt-0.5">Analytics and audit data across all modules</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors',
              tab === id
                ? 'border-blue-700 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Report content */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <ReportTable
          key={tab}
          queryKey={`report-${tab}`}
          endpoint={config.endpoint}
          columns={config.columns}
        />
      </div>
    </div>
  )
}
