import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, ShoppingCart, CheckCircle, XCircle, Package, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { ProcurementOrder, PaginatedResponse, Programme } from '../types'
import { formatDate, formatCurrency, cn } from '../lib/utils'
import { useHasRole } from '../store/authStore'

const STATUS_COLORS: Record<string, string> = {
  draft:               'bg-gray-100 text-gray-600',
  submitted:           'bg-blue-100 text-blue-700',
  approved:            'bg-emerald-100 text-emerald-700',
  rejected:            'bg-red-100 text-red-600',
  partially_received:  'bg-amber-100 text-amber-700',
  received:            'bg-violet-100 text-violet-700',
}
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-500', medium: 'bg-blue-100 text-blue-600',
  high: 'bg-amber-100 text-amber-700', urgent: 'bg-red-100 text-red-600',
}

interface Supplier { id: number; name: string }
interface Warehouse { id: number; name: string }
interface Commodity { id: number; name: string; unit: string }
interface Project { id: number; name: string }
interface POItem { id: number; commodity_id: number; commodity?: { name: string; unit: string }; quantity_ordered: number; quantity_received: number }
interface PODetail { id: number; po_number: string; warehouse?: { name: string }; items: POItem[] }

// ── New Order Modal ──────────────────────────────────────────────────────────

const EMPTY_ITEM = { commodity_id: '', quantity_ordered: '', unit_price: '', unit_of_measure: '' }

function NewOrderModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', currency: 'USD',
    required_date: '', programme_id: '', project_id: '', supplier_id: '', warehouse_id: '',
  })
  const [items, setItems] = useState([{ ...EMPTY_ITEM }])
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { data: programmes } = useQuery<{ data: Programme[] }>({
    queryKey: ['programmes-list'],
    queryFn: () => api.get('/programmes', { params: { per_page: 100 } }).then((r) => r.data),
  })
  const { data: projects } = useQuery<Project[]>({
    queryKey: ['projects', form.programme_id],
    queryFn: () => api.get(`/programmes/${form.programme_id}/projects`).then((r) => r.data),
    enabled: !!form.programme_id,
  })
  const { data: suppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/suppliers').then((r) => r.data),
  })
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses-list'],
    queryFn: () => api.get('/warehouses', { params: { active: '1' } }).then((r) => r.data),
  })
  const { data: commodities } = useQuery<Commodity[]>({
    queryKey: ['commodities'],
    queryFn: () => api.get('/commodities').then((r) => r.data),
  })

  const setItem = (i: number, k: string, v: string) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/procurement', {
      ...form,
      programme_id: Number(form.programme_id),
      project_id: Number(form.project_id),
      supplier_id: Number(form.supplier_id),
      warehouse_id: Number(form.warehouse_id),
      items: items.map((it) => ({
        commodity_id: Number(it.commodity_id),
        quantity_ordered: Number(it.quantity_ordered),
        unit_price: Number(it.unit_price),
        unit_of_measure: it.unit_of_measure,
      })),
    }),
    onSuccess: () => {
      toast.success('Order created')
      qc.invalidateQueries({ queryKey: ['procurement'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create order'),
  })

  const canSubmit = form.title && form.required_date && form.programme_id && form.project_id &&
    form.supplier_id && form.warehouse_id && form.currency &&
    items.every((it) => it.commodity_id && it.quantity_ordered && it.unit_price && it.unit_of_measure)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10">
      <div className="bg-white w-full max-w-2xl relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">New Procurement Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Food Supplies Q1" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Required By *</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.required_date} onChange={(e) => set('required_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Programme *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.programme_id} onChange={(e) => { set('programme_id', e.target.value); set('project_id', '') }}>
                <option value="">Select programme…</option>
                {programmes?.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Project *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.project_id} onChange={(e) => set('project_id', e.target.value)} disabled={!form.programme_id}>
                <option value="">Select project…</option>
                {projects?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.supplier_id} onChange={(e) => set('supplier_id', e.target.value)}>
                <option value="">Select supplier…</option>
                {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Warehouse *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.warehouse_id} onChange={(e) => set('warehouse_id', e.target.value)}>
                <option value="">Select warehouse…</option>
                {warehouses?.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency *</label>
              <input maxLength={3} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} placeholder="USD" />
            </div>
          </div>

          {/* Line items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Items *</label>
              <button type="button" onClick={() => setItems((p) => [...p, { ...EMPTY_ITEM }])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Plus size={12} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_90px_100px_32px] gap-2 items-end">
                  <div>
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Commodity</label>}
                    <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={item.commodity_id} onChange={(e) => setItem(i, 'commodity_id', e.target.value)}>
                      <option value="">Select…</option>
                      {commodities?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Qty</label>}
                    <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.quantity_ordered} onChange={(e) => setItem(i, 'quantity_ordered', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Unit Price</label>}
                    <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.unit_price} onChange={(e) => setItem(i, 'unit_price', e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Unit</label>}
                    <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.unit_of_measure} onChange={(e) => setItem(i, 'unit_of_measure', e.target.value)} placeholder="kg" />
                  </div>
                  <button type="button" onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}
                    disabled={items.length === 1} className="pb-1 text-gray-400 hover:text-red-500 disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Create Order'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Reject Modal ─────────────────────────────────────────────────────────────

function RejectModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [reason, setReason] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/procurement/${orderId}/reject`, { rejection_reason: reason }),
    onSuccess: () => {
      toast.success('Order rejected')
      qc.invalidateQueries({ queryKey: ['procurement'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Rejection failed'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Reject Order</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">
          <label className="block text-xs font-medium text-gray-600 mb-1">Rejection Reason *</label>
          <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows={3} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this order is being rejected…" />
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!reason.trim() || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Rejecting…' : 'Reject Order'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Receive Modal ─────────────────────────────────────────────────────────────

interface ItemMeta { qty: string; batch: string; lot: string; expiry: string }

function ReceiveModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const qc = useQueryClient()
  const [meta, setMeta] = useState<Record<number, ItemMeta>>({})
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')

  const { data: order, isLoading } = useQuery<PODetail>({
    queryKey: ['procurement-detail', orderId],
    queryFn: () => api.get(`/procurement/${orderId}`).then((r) => r.data),
  })

  const getItemMeta = (item: POItem): ItemMeta =>
    meta[item.id] ?? { qty: String(item.quantity_ordered - item.quantity_received), batch: '', lot: '', expiry: '' }

  const setField = (id: number, field: keyof ItemMeta, value: string) =>
    setMeta((m) => ({ ...m, [id]: { ...getItemMeta({ id } as POItem), ...m[id], [field]: value } }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/procurement/${orderId}/receive`, {
      delivery_date: deliveryDate || undefined,
      notes: notes || undefined,
      items: order!.items.map((item) => {
        const m = getItemMeta(item)
        return {
          id: item.id,
          quantity_received: Number(m.qty),
          batch_number: m.batch || undefined,
          lot_number: m.lot || undefined,
          expiry_date: m.expiry || undefined,
        }
      }),
    }),
    onSuccess: (res) => {
      const status = res.data?.status
      toast.success(status === 'partially_received' ? 'Partially received — inventory updated' : 'All goods received — inventory updated')
      qc.invalidateQueries({ queryKey: ['procurement'] })
      qc.invalidateQueries({ queryKey: ['inventory'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Receive failed'),
  })

  const pending = order?.items.filter((i) => i.quantity_received < i.quantity_ordered) ?? []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div>
            <h2 className="font-semibold text-gray-800">Goods Received Note</h2>
            {order && <p className="text-xs text-gray-400 mt-0.5">{order.po_number}{order.warehouse && ` → ${order.warehouse.name}`}</p>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          {isLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading order details…</p>
          ) : (
            <>
              {/* Delivery header */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Date</label>
                  <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Delivery Notes</label>
                  <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Condition of goods, remarks…"
                    className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              {/* Per-item rows */}
              <div>
                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 text-xs font-medium text-gray-500 pb-1 border-b border-gray-100">
                  <span>Commodity</span><span>Qty Received *</span><span>Batch #</span><span>Lot #</span><span>Expiry Date</span>
                </div>
                <div className="space-y-2 mt-2">
                  {pending.length === 0 && (
                    <p className="text-sm text-gray-400 py-2">All items on this order have already been received.</p>
                  )}
                  {order?.items.map((item) => {
                    const remaining = item.quantity_ordered - item.quantity_received
                    if (remaining <= 0) return (
                      <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center opacity-40">
                        <span className="text-sm text-gray-700 truncate">{item.commodity?.name ?? `Item #${item.id}`}</span>
                        <span className="text-xs text-gray-400 text-center">Fully received</span>
                        <span /><span /><span />
                      </div>
                    )
                    const m = getItemMeta(item)
                    return (
                      <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 items-center">
                        <div>
                          <p className="text-sm text-gray-800 font-medium truncate">{item.commodity?.name ?? `Item #${item.id}`}</p>
                          <p className="text-xs text-gray-400">ordered {item.quantity_ordered} {item.commodity?.unit ?? ''} · prev. received {item.quantity_received}</p>
                        </div>
                        <input type="number" min="0" max={remaining} step="0.01"
                          className="px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          value={m.qty}
                          onChange={(e) => setField(item.id, 'qty', e.target.value)} />
                        <input type="text" placeholder="e.g. B2024-01"
                          className="px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          value={m.batch}
                          onChange={(e) => setField(item.id, 'batch', e.target.value)} />
                        <input type="text" placeholder="e.g. L001"
                          className="px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          value={m.lot}
                          onChange={(e) => setField(item.id, 'lot', e.target.value)} />
                        <input type="date"
                          className="px-2 py-1.5 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          value={m.expiry}
                          onChange={(e) => setField(item.id, 'expiry', e.target.value)} />
                      </div>
                    )
                  })}
                </div>
              </div>

              <p className="text-xs text-gray-400">
                Inventory will be updated immediately on confirmation. Items received less than ordered will mark the order as <em>Partially Received</em>.
              </p>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3 shrink-0">
          <button disabled={isLoading || isPending || pending.length === 0} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Confirm Receipt & Update Inventory'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProcurementPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showNew, setShowNew] = useState(false)
  const [rejectId, setRejectId] = useState<number | null>(null)
  const [receiveId, setReceiveId] = useState<number | null>(null)
  const canCreate  = useHasRole('super_admin', 'procurement_officer')
  const canApprove = useHasRole('super_admin', 'programme_manager')
  const canReceive = useHasRole('super_admin', 'warehouse_officer', 'procurement_officer')

  const { data, isLoading } = useQuery<PaginatedResponse<ProcurementOrder>>({
    queryKey: ['procurement', status, page],
    queryFn: () =>
      api.get('/procurement', { params: { status: status || undefined, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { mutate: approve } = useMutation({
    mutationFn: (id: number) => api.post(`/procurement/${id}/approve`),
    onSuccess: () => { toast.success('Order approved'); qc.invalidateQueries({ queryKey: ['procurement'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Approval failed'),
  })

  return (
    <div className="space-y-5">
      {showNew && <NewOrderModal onClose={() => setShowNew(false)} />}
      {rejectId !== null && <RejectModal orderId={rejectId} onClose={() => setRejectId(null)} />}
      {receiveId !== null && <ReceiveModal orderId={receiveId} onClose={() => setReceiveId(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Procurement</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? `${data.total.toLocaleString()} purchase orders` : 'Loading…'}</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
            <Plus size={16} /> New Order
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'draft', 'submitted', 'approved', 'rejected', 'partially_received', 'received'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={cn('px-3 py-1.5 text-xs font-medium border transition-colors',
              status === s ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading orders…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No procurement orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">PO Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Supplier</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Priority</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Amount</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Required By</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((po) => (
                  <tr key={po.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{po.po_number}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{po.title}</td>
                    <td className="px-4 py-3 text-gray-600">{po.supplier?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', PRIORITY_COLORS[po.priority] ?? 'bg-gray-100')}>
                        {po.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(po.total_amount, po.currency)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(po.required_date)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[po.status] ?? 'bg-gray-100')}>
                        {po.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs font-medium">
                        {po.status === 'submitted' && canApprove && (
                          <>
                            <button onClick={() => approve(po.id)} className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1">
                              <CheckCircle size={12} /> Approve
                            </button>
                            <button onClick={() => setRejectId(po.id)} className="text-red-600 hover:text-red-800 flex items-center gap-1">
                              <XCircle size={12} /> Reject
                            </button>
                          </>
                        )}
                        {(po.status === 'approved' || po.status === 'partially_received') && canReceive && (
                          <button onClick={() => setReceiveId(po.id)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                            <Package size={12} /> {po.status === 'partially_received' ? 'Receive More' : 'Receive'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
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
