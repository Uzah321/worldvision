import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Package, AlertTriangle, X, History, SlidersHorizontal } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Inventory, InventoryMovement, PaginatedResponse } from '../types'
import { formatDate, formatDateTime, cn } from '../lib/utils'
import { useHasRole } from '../store/authStore'

// ── Adjust Modal ─────────────────────────────────────────────────────────────
function AdjustModal({ inventory, onClose }: { inventory: Inventory; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ adjustment_type: 'damage', quantity: '', notes: '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/inventory/${inventory.id}/adjust`, {
      ...form,
      quantity: Number(form.quantity),
    }),
    onSuccess: () => {
      toast.success('Adjustment recorded')
      qc.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Adjustment failed'),
  })

  const canSubmit = form.quantity && Number(form.quantity) > 0 && form.notes.trim()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Adjust Stock</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
            <p className="font-medium text-gray-900">{inventory.commodity?.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">{inventory.warehouse?.name} · Available: <span className="font-semibold text-gray-800">{inventory.quantity_available.toLocaleString()} {inventory.commodity?.unit}</span></p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Adjustment Type</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.adjustment_type} onChange={(e) => set('adjustment_type', e.target.value)}>
              <option value="damage">Damage</option>
              <option value="loss">Loss</option>
              <option value="expiry">Expiry write-off</option>
              <option value="correction">Correction</option>
              <option value="transfer_out">Transfer out</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Quantity *</label>
            <input type="number" min="0.01" step="0.01"
              className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.quantity} onChange={(e) => set('quantity', e.target.value)}
              placeholder={`Max ${inventory.quantity_available}`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Reason / Notes *</label>
            <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3} value={form.notes} onChange={(e) => set('notes', e.target.value)}
              placeholder="Describe the reason for this adjustment…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Record Adjustment'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Movements Drawer ─────────────────────────────────────────────────────────
function MovementsDrawer({ inventory, onClose }: { inventory: Inventory; onClose: () => void }) {
  const { data, isLoading } = useQuery<PaginatedResponse<InventoryMovement>>({
    queryKey: ['inventory-movements', inventory.id],
    queryFn: () => api.get(`/inventory/${inventory.id}/movements`).then((r) => r.data),
  })

  const TYPE_COLORS: Record<string, string> = {
    receipt:      'bg-emerald-100 text-emerald-700',
    dispatch:     'bg-blue-100 text-blue-700',
    transfer_in:  'bg-cyan-100 text-cyan-700',
    transfer_out: 'bg-amber-100 text-amber-700',
    damage:       'bg-red-100 text-red-600',
    loss:         'bg-red-100 text-red-600',
    expiry:       'bg-gray-100 text-gray-600',
    correction:   'bg-purple-100 text-purple-700',
    adjustment:   'bg-purple-100 text-purple-700',
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-md bg-white flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-800">Movement History</h2>
            <p className="text-xs text-gray-500 mt-0.5">{inventory.commodity?.name} · {inventory.warehouse?.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-gray-400">Loading movements…</div>
          ) : !data?.data.length ? (
            <div className="p-8 text-center text-sm text-gray-400">No movements recorded</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {data.data.map((mv) => (
                <div key={mv.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize shrink-0', TYPE_COLORS[mv.movement_type] ?? 'bg-gray-100 text-gray-600')}>
                      {mv.movement_type.replace('_', ' ')}
                    </span>
                    <span className={cn('text-sm font-semibold', mv.quantity < 0 ? 'text-red-600' : 'text-emerald-600')}>
                      {mv.quantity > 0 ? '+' : ''}{mv.quantity.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">Balance after: <span className="font-medium text-gray-800">{mv.balance_after.toLocaleString()}</span></p>
                  {mv.notes && <p className="text-xs text-gray-600 mt-1 italic">{mv.notes}</p>}
                  <div className="flex items-center justify-between mt-1.5 text-xs text-gray-400">
                    <span>{mv.performedBy?.name ?? 'System'}</span>
                    <span>{formatDateTime(mv.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type WarehouseOption = { id: number; name: string }

export default function InventoryPage() {
  const [warehouseId, setWarehouseId] = useState('')
  const [page, setPage] = useState(1)
  const [adjusting, setAdjusting] = useState<Inventory | null>(null)
  const [viewingMovements, setViewingMovements] = useState<Inventory | null>(null)
  const canAdjust = useHasRole('super_admin', 'warehouse_officer')

  const { data, isLoading } = useQuery<PaginatedResponse<Inventory>>({
    queryKey: ['inventory', warehouseId, page],
    queryFn: () =>
      api.get('/inventory', { params: { warehouse_id: warehouseId || undefined, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: warehouses = [] } = useQuery<WarehouseOption[]>({
    queryKey: ['warehouses-list'],
    queryFn: () => api.get('/warehouses').then((r) => r.data.map((w: any) => ({ id: w.id, name: w.name }))),
  })

  const { data: expiryAlerts } = useQuery<Inventory[]>({
    queryKey: ['inventory-expiry'],
    queryFn: () => api.get('/inventory/alerts/expiry').then((r) => r.data),
  })

  const { data: reorderAlerts } = useQuery<Inventory[]>({
    queryKey: ['inventory-reorder'],
    queryFn: () => api.get('/inventory/alerts/reorder').then((r) => r.data),
  })

  return (
    <div className="space-y-5">
      {adjusting && <AdjustModal inventory={adjusting} onClose={() => setAdjusting(null)} />}
      {viewingMovements && <MovementsDrawer inventory={viewingMovements} onClose={() => setViewingMovements(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total.toLocaleString()} stock entries` : 'Loading…'}
          </p>
        </div>
      </div>

      {/* Alert banners */}
      {(expiryAlerts?.length || reorderAlerts?.length) ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {!!expiryAlerts?.length && (
            <div className="bg-red-50 border border-red-200 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">{expiryAlerts.length} item(s) near expiry</p>
                <p className="text-xs text-red-600 mt-0.5">Expiring within the next 30 days</p>
              </div>
            </div>
          )}
          {!!reorderAlerts?.length && (
            <div className="bg-orange-50 border border-orange-200 p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-orange-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-orange-800">{reorderAlerts.length} item(s) below reorder level</p>
                <p className="text-xs text-orange-600 mt-0.5">Stock replenishment needed</p>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Filter */}
      <div className="bg-white border border-gray-200 p-4">
        <select className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={warehouseId} onChange={(e) => { setWarehouseId(e.target.value); setPage(1) }}>
          <option value="">All warehouses</option>
          {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading inventory…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <Package size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No inventory records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Commodity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Warehouse</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Batch</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Available</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Distributed</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Damaged</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Expiry</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((inv) => {
                  const nearExpiry = inv.expiry_date && new Date(inv.expiry_date) <= new Date(Date.now() + 30 * 86400_000)
                  const belowReorder = inv.reorder_level != null && inv.quantity_available <= inv.reorder_level
                  return (
                    <tr key={inv.id} className={cn('hover:bg-gray-50 transition-colors', nearExpiry && 'bg-red-50/40')}>
                      <td className="px-4 py-3 font-medium text-gray-900">{inv.commodity?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{inv.warehouse?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{inv.batch_number ?? '—'}</td>
                      <td className={cn('px-4 py-3 text-right font-medium', belowReorder ? 'text-orange-600' : 'text-gray-900')}>
                        {inv.quantity_available.toLocaleString()}
                        {belowReorder && <AlertTriangle size={12} className="inline ml-1" />}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{inv.quantity_distributed.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{inv.quantity_damaged.toLocaleString()}</td>
                      <td className={cn('px-4 py-3', nearExpiry ? 'text-red-600 font-medium' : 'text-gray-600')}>
                        {formatDate(inv.expiry_date)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-medium capitalize',
                          inv.status === 'available' ? 'bg-emerald-100 text-emerald-700'
                            : inv.status === 'expired' ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3 text-xs font-medium">
                          {canAdjust && (
                            <button onClick={() => setAdjusting(inv)}
                              className="text-amber-600 hover:text-amber-800 flex items-center gap-1">
                              <SlidersHorizontal size={12} /> Adjust
                            </button>
                          )}
                          <button onClick={() => setViewingMovements(inv)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <History size={12} /> History
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {data && data.last_page > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">Page {data.current_page} of {data.last_page}</span>
            <div className="flex gap-2">
              <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Previous</button>
              <button disabled={page >= data.last_page} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
