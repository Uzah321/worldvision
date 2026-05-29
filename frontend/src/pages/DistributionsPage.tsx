import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Truck, X, Trash2, ClipboardCheck, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Distribution, DistributionRecord, PaginatedResponse, Programme } from '../types'
import { formatDate, formatDateTime, cn, exportToCsv } from '../lib/utils'
import { useHasRole } from '../store/authStore'

const STATUS_COLORS: Record<string, string> = {
  planned:     'bg-blue-100 text-blue-700',
  approved:    'bg-cyan-100 text-cyan-700',
  in_progress: 'bg-amber-100 text-amber-700',
  completed:   'bg-emerald-100 text-emerald-700',
  cancelled:   'bg-red-100 text-red-600',
}
const MODE_LABELS: Record<string, string> = { in_kind: 'In-Kind', cash: 'Cash', voucher: 'Voucher' }

interface Commodity { id: number; name: string; unit: string }
interface Site { id: number; name: string }
interface Warehouse { id: number; name: string }
interface Project { id: number; name: string; code: string }
interface BeneficiaryOption { id: number; first_name: string; last_name: string; beneficiary_number: string; household_id: number; household?: { id: number; head_name: string } }

const EMPTY_ITEM = { commodity_id: '', planned_qty: '', unit: '' }

// ── New Distribution Modal ───────────────────────────────────────────────────
function NewDistributionModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: '', distribution_date: '', mode: 'in_kind',
    programme_id: '', project_id: '', distribution_site_id: '',
    warehouse_id: '', planned_beneficiaries: '', planned_households: '', notes: '',
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
  const { data: warehouses } = useQuery<Warehouse[]>({
    queryKey: ['warehouses-list'],
    queryFn: () => api.get('/warehouses', { params: { active: '1' } }).then((r) => r.data),
  })
  const { data: sites } = useQuery<Site[]>({
    queryKey: ['distribution-sites'],
    queryFn: () => api.get('/distribution-sites').then((r) => r.data),
  })
  const { data: commodities } = useQuery<Commodity[]>({
    queryKey: ['commodities'],
    queryFn: () => api.get('/commodities').then((r) => r.data),
  })

  const setItem = (i: number, k: string, v: string) =>
    setItems((prev) => prev.map((it, idx) => idx === i ? { ...it, [k]: v } : it))
  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }])
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/distributions', {
      ...form,
      programme_id: Number(form.programme_id),
      project_id: Number(form.project_id),
      distribution_site_id: Number(form.distribution_site_id),
      warehouse_id: Number(form.warehouse_id),
      planned_beneficiaries: Number(form.planned_beneficiaries),
      planned_households: Number(form.planned_households),
      items: items.map((it) => ({
        commodity_id: Number(it.commodity_id),
        planned_qty: Number(it.planned_qty),
        unit: it.unit,
      })),
    }),
    onSuccess: () => {
      toast.success('Distribution created')
      qc.invalidateQueries({ queryKey: ['distributions'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create distribution'),
  })

  const canSubmit = form.name && form.distribution_date && form.programme_id &&
    form.project_id && form.distribution_site_id && form.warehouse_id &&
    form.planned_beneficiaries && form.planned_households &&
    items.every((it) => it.commodity_id && it.planned_qty && it.unit)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10">
      <div className="bg-white w-full max-w-2xl relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">New Distribution</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Q1 Food Distribution" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.distribution_date} onChange={(e) => set('distribution_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mode *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.mode} onChange={(e) => set('mode', e.target.value)}>
                <option value="in_kind">In-Kind</option>
                <option value="cash">Cash</option>
                <option value="voucher">Voucher</option>
              </select>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Distribution Site *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.distribution_site_id} onChange={(e) => set('distribution_site_id', e.target.value)}>
                <option value="">Select site…</option>
                {sites?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Planned Beneficiaries *</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.planned_beneficiaries} onChange={(e) => set('planned_beneficiaries', e.target.value)} placeholder="0" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Planned Households *</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.planned_households} onChange={(e) => set('planned_households', e.target.value)} placeholder="0" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Distribution Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1">
                <Plus size={12} /> Add item
              </button>
            </div>
            <div className="space-y-2">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-[1fr_100px_100px_32px] gap-2 items-end">
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
                      value={item.planned_qty} onChange={(e) => setItem(i, 'planned_qty', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    {i === 0 && <label className="block text-xs text-gray-500 mb-1">Unit</label>}
                    <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={item.unit} onChange={(e) => setItem(i, 'unit', e.target.value)} placeholder="kg" />
                  </div>
                  <button type="button" onClick={() => removeItem(i)} disabled={items.length === 1}
                    className="pb-1 text-gray-400 hover:text-red-500 disabled:opacity-30">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Create Distribution'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Record Collection Modal ──────────────────────────────────────────────────
function RecordModal({ distribution, onClose }: { distribution: Distribution; onClose: () => void }) {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [selectedBen, setSelectedBen] = useState<BeneficiaryOption | null>(null)
  const [form, setForm] = useState({
    verification_method: 'manual',
    collected_by_proxy: false,
    proxy_name: '',
    proxy_relationship: '',
  })

  const { data: beneficiaries = [] } = useQuery<BeneficiaryOption[]>({
    queryKey: ['beneficiaries-search', search],
    queryFn: () => api.get('/beneficiaries', { params: { search, per_page: 20 } }).then((r) => r.data.data),
    enabled: search.length >= 2,
  })

  const { data: records } = useQuery<PaginatedResponse<DistributionRecord>>({
    queryKey: ['distribution-records', distribution.id],
    queryFn: () => api.get(`/distributions/${distribution.id}/records`).then((r) => r.data),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/distributions/${distribution.id}/record`, {
      beneficiary_id: selectedBen!.id,
      household_id: selectedBen!.household_id,
      verification_method: form.verification_method,
      collected_by_proxy: form.collected_by_proxy,
      proxy_name: form.collected_by_proxy ? form.proxy_name : undefined,
      proxy_relationship: form.collected_by_proxy ? form.proxy_relationship : undefined,
      rations_received: {},
    }),
    onSuccess: () => {
      toast.success('Collection recorded')
      qc.invalidateQueries({ queryKey: ['distribution-records', distribution.id] })
      qc.invalidateQueries({ queryKey: ['distributions'] })
      setSelectedBen(null)
      setSearch('')
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to record'),
  })

  const handleExportRecords = () => {
    if (!records?.data.length) return
    exportToCsv(`records-${distribution.distribution_number}`, records.data as unknown as Record<string, unknown>[], [
      { key: 'beneficiary.beneficiary_number', label: 'Beneficiary No.' },
      { key: 'beneficiary.first_name', label: 'First Name' },
      { key: 'beneficiary.last_name', label: 'Last Name' },
      { key: 'household.head_name', label: 'Household Head' },
      { key: 'verification_method', label: 'Verification' },
      { key: 'collected_by_proxy', label: 'Proxy' },
      { key: 'collected_at', label: 'Collected At' },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-white flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-semibold text-gray-800">Record Collections</h2>
            <p className="text-xs text-gray-500 mt-0.5">{distribution.name} · {records?.total ?? 0} collected</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportRecords} className="p-1.5 text-gray-400 hover:text-gray-600 border border-gray-200 hover:bg-gray-50">
              <Download size={15} />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        {/* Record new collection */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Record New Collection</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Search Beneficiary</label>
            <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={search} onChange={(e) => { setSearch(e.target.value); setSelectedBen(null) }}
              placeholder="Type name, ID or beneficiary number…" />
            {search.length >= 2 && !selectedBen && beneficiaries.length > 0 && (
              <div className="border border-gray-200 bg-white mt-1 divide-y divide-gray-100 max-h-36 overflow-y-auto">
                {beneficiaries.map((b) => (
                  <button key={b.id} onClick={() => { setSelectedBen(b); setSearch(`${b.first_name} ${b.last_name}`) }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 flex justify-between items-center">
                    <span className="font-medium text-gray-900">{b.first_name} {b.last_name}</span>
                    <span className="text-xs text-gray-400 font-mono">{b.beneficiary_number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedBen && (
            <div className="bg-blue-50 border border-blue-200 px-3 py-2 text-xs">
              <p className="font-medium text-blue-900">{selectedBen.first_name} {selectedBen.last_name} · <span className="font-mono">{selectedBen.beneficiary_number}</span></p>
              <p className="text-blue-600 mt-0.5">Household: {selectedBen.household?.head_name ?? 'Unknown'}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Verification Method</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.verification_method} onChange={(e) => setForm((f) => ({ ...f, verification_method: e.target.value }))}>
                <option value="manual">Manual</option>
                <option value="qr_code">QR Code</option>
                <option value="biometric">Biometric</option>
                <option value="id_card">ID Card</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="w-4 h-4"
                  checked={form.collected_by_proxy}
                  onChange={(e) => setForm((f) => ({ ...f, collected_by_proxy: e.target.checked }))} />
                Collected by proxy
              </label>
            </div>
          </div>

          {form.collected_by_proxy && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Proxy Name</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.proxy_name} onChange={(e) => setForm((f) => ({ ...f, proxy_name: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Relationship</label>
                <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={form.proxy_relationship} onChange={(e) => setForm((f) => ({ ...f, proxy_relationship: e.target.value }))} />
              </div>
            </div>
          )}

          <button disabled={!selectedBen || isPending} onClick={() => mutate()}
            className="w-full py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Recording…' : 'Record Collection'}
          </button>
        </div>

        {/* Records list */}
        <div className="flex-1 overflow-y-auto">
          <p className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 border-b border-gray-100">
            Collected ({records?.total ?? 0})
          </p>
          {!records?.data.length ? (
            <div className="p-8 text-center text-sm text-gray-400">No collections recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {records.data.map((rec) => (
                <div key={rec.id} className="px-6 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {rec.beneficiary?.first_name} {rec.beneficiary?.last_name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {rec.collected_by_proxy ? `Proxy: ${rec.proxy_name}` : rec.verification_method} · {formatDateTime(rec.collected_at)}
                    </p>
                  </div>
                  {rec.is_flagged && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 font-medium">Flagged</span>
                  )}
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
export default function DistributionsPage() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showNew, setShowNew] = useState(false)
  const [recording, setRecording] = useState<Distribution | null>(null)
  const canCreate   = useHasRole('super_admin', 'programme_manager', 'distribution_officer')
  const canApprove  = useHasRole('super_admin', 'programme_manager')
  const canOperate  = useHasRole('super_admin', 'distribution_officer', 'field_officer')

  const { data, isLoading } = useQuery<PaginatedResponse<Distribution>>({
    queryKey: ['distributions', status, page],
    queryFn: () =>
      api.get('/distributions', { params: { status: status || undefined, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { mutate: approve } = useMutation({
    mutationFn: (id: number) => api.post(`/distributions/${id}/approve`),
    onSuccess: () => { toast.success('Distribution approved'); qc.invalidateQueries({ queryKey: ['distributions'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })
  const { mutate: start } = useMutation({
    mutationFn: (id: number) => api.post(`/distributions/${id}/start`),
    onSuccess: () => { toast.success('Distribution started'); qc.invalidateQueries({ queryKey: ['distributions'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })
  const { mutate: complete } = useMutation({
    mutationFn: (id: number) => api.post(`/distributions/${id}/complete`),
    onSuccess: () => { toast.success('Distribution completed'); qc.invalidateQueries({ queryKey: ['distributions'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  const handleExport = () => {
    if (!data?.data.length) return
    exportToCsv('distributions', data.data as unknown as Record<string, unknown>[], [
      { key: 'distribution_number', label: 'Distribution No.' },
      { key: 'name', label: 'Name' },
      { key: 'programme.name', label: 'Programme' },
      { key: 'project.name', label: 'Project' },
      { key: 'distribution_date', label: 'Date' },
      { key: 'mode', label: 'Mode' },
      { key: 'planned_beneficiaries', label: 'Planned Beneficiaries' },
      { key: 'actual_beneficiaries', label: 'Actual Beneficiaries' },
      { key: 'status', label: 'Status' },
    ])
  }

  return (
    <div className="space-y-5">
      {showNew && <NewDistributionModal onClose={() => setShowNew(false)} />}
      {recording && <RecordModal distribution={recording} onClose={() => setRecording(null)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Distributions</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total.toLocaleString()} total` : 'Loading…'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export CSV
          </button>
          {canCreate && (
            <button onClick={() => setShowNew(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
              <Plus size={16} /> New Distribution
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'planned', 'approved', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <button key={s} onClick={() => { setStatus(s); setPage(1) }}
            className={cn('px-3 py-1.5 text-xs font-medium border transition-colors',
              status === s ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
            {s === '' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading distributions…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <Truck size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No distributions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Distribution</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Programme / Project</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Mode</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Beneficiaries</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-400 font-mono">{d.distribution_number}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{d.programme?.name ?? '—'}</p>
                      <p className="text-xs text-gray-400">{d.project?.name}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(d.distribution_date)}</td>
                    <td className="px-4 py-3 text-gray-600">{MODE_LABELS[d.mode] ?? d.mode}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="font-medium">{d.actual_beneficiaries?.toLocaleString() ?? '—'}</span>
                      <span className="text-gray-400"> / {d.planned_beneficiaries.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600')}>
                        {d.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 text-xs font-medium">
                        {d.status === 'planned' && canApprove && (
                          <button onClick={() => approve(d.id)} className="text-cyan-600 hover:text-cyan-800">Approve</button>
                        )}
                        {d.status === 'approved' && canOperate && (
                          <button onClick={() => start(d.id)} className="text-amber-600 hover:text-amber-800">Start</button>
                        )}
                        {d.status === 'in_progress' && canOperate && (
                          <>
                            <button onClick={() => setRecording(d)} className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
                              <ClipboardCheck size={12} /> Record
                            </button>
                            <button onClick={() => complete(d.id)} className="text-emerald-600 hover:text-emerald-800">Complete</button>
                          </>
                        )}
                        {d.status === 'completed' && (
                          <button onClick={() => setRecording(d)} className="text-gray-500 hover:text-gray-700 flex items-center gap-1">
                            <ClipboardCheck size={12} /> View Records
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
