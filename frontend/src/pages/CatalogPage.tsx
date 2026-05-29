import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Tag, MapPin, X, Pencil, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { CommodityCategory, CommodityFull, DistributionSite, PaginatedResponse } from '../types'
import { cn } from '../lib/utils'
import { useHasRole } from '../store/authStore'

interface District { id: number; name: string }
interface Ward { id: number; name: string; district_id: number }

// ── Commodity Category Modal ─────────────────────────────────────────────────
function CategoryModal({ category, onClose }: { category?: CommodityCategory; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({ name: category?.name ?? '', type: category?.type ?? 'food', description: category?.description ?? '' })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => category
      ? api.put(`/commodity-categories/${category.id}`, form)
      : api.post('/commodity-categories', form),
    onSuccess: () => {
      toast.success(category ? 'Category updated' : 'Category created')
      qc.invalidateQueries({ queryKey: ['commodity-categories'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{category ? 'Edit Category' : 'New Category'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Food Commodities" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.type} onChange={(e) => set('type', e.target.value)}>
              <option value="food">Food</option>
              <option value="non_food">Non-Food Items</option>
              <option value="medical">Medical</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!form.name || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Commodity Modal ──────────────────────────────────────────────────────────
function CommodityModal({ commodity, categories, onClose }: { commodity?: CommodityFull; categories: CommodityCategory[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: commodity?.name ?? '', code: commodity?.code ?? '',
    category_id: String(commodity?.category?.id ?? ''),
    unit: commodity?.unit ?? '', description: commodity?.description ?? '',
    is_active: commodity?.is_active ?? true,
  })
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = { ...form, category_id: Number(form.category_id) }
      return commodity
        ? api.put(`/commodities/list/${commodity.id}`, payload)
        : api.post('/commodities/list', payload)
    },
    onSuccess: () => {
      toast.success(commodity ? 'Commodity updated' : 'Commodity created')
      qc.invalidateQueries({ queryKey: ['commodities-list'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const canSubmit = form.name && form.code && form.category_id && form.unit

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{commodity ? 'Edit Commodity' : 'New Commodity'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Maize Meal" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="MM-01" disabled={!!commodity} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Unit *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="kg / litre / unit" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.category_id} onChange={(e) => set('category_id', e.target.value)}>
                <option value="">Select category…</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_active_com" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="is_active_com" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Distribution Site Modal ───────────────────────────────────────────────────
function SiteModal({ site, districts, wards, onClose }: { site?: DistributionSite; districts: District[]; wards: Ward[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: site?.name ?? '', code: site?.code ?? '',
    district_id: String(site?.district?.id ?? ''),
    ward_id: String(site?.ward?.id ?? ''),
    address: site?.address ?? '', capacity: String(site?.capacity ?? ''),
    is_active: site?.is_active ?? true,
  })
  const set = (k: string, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))
  const filteredWards = wards.filter((w) => String(w.district_id) === form.district_id)

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        district_id: Number(form.district_id),
        ward_id: form.ward_id ? Number(form.ward_id) : undefined,
        capacity: form.capacity ? Number(form.capacity) : undefined,
      }
      return site ? api.put(`/sites/${site.id}`, payload) : api.post('/sites', payload)
    },
    onSuccess: () => {
      toast.success(site ? 'Site updated' : 'Site created')
      qc.invalidateQueries({ queryKey: ['distribution-sites-mgmt'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed'),
  })

  const canSubmit = form.name && form.code && form.district_id

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{site ? 'Edit Site' : 'New Distribution Site'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Site Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} disabled={!!site} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Capacity (beneficiaries)</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">District *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.district_id} onChange={(e) => { set('district_id', e.target.value); set('ward_id', '') }}>
                <option value="">Select district…</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ward</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.ward_id} onChange={(e) => set('ward_id', e.target.value)} disabled={!form.district_id}>
                <option value="">Select ward…</option>
                {filteredWards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="site_active" checked={form.is_active}
                onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4" />
              <label htmlFor="site_active" className="text-sm text-gray-700">Active</label>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Save'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────────────────────
type Tab = 'commodities' | 'categories' | 'sites'

export default function CatalogPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<Tab>('commodities')
  const [modal, setModal] = useState<{ type: Tab; item?: any } | null>(null)
  const canWrite = useHasRole('super_admin', 'data_officer')

  const { data: categories = [] } = useQuery<CommodityCategory[]>({
    queryKey: ['commodity-categories'],
    queryFn: () => api.get('/commodity-categories').then((r) => r.data),
  })

  const { data: commodities = [], isLoading: loadingCom } = useQuery<CommodityFull[]>({
    queryKey: ['commodities-list'],
    queryFn: () => api.get('/commodities/list').then((r) => r.data),
  })

  const { data: sitesData, isLoading: loadingSites } = useQuery<PaginatedResponse<DistributionSite>>({
    queryKey: ['distribution-sites-mgmt'],
    queryFn: () => api.get('/sites').then((r) => r.data),
  })

  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then((r) => r.data),
  })

  const { data: wards = [] } = useQuery<any[]>({
    queryKey: ['wards'],
    queryFn: () => api.get('/wards').then((r) => r.data),
  })

  const { mutate: deleteCat } = useMutation({
    mutationFn: (id: number) => api.delete(`/commodity-categories/${id}`),
    onSuccess: () => { toast.success('Category deleted'); qc.invalidateQueries({ queryKey: ['commodity-categories'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Cannot delete'),
  })

  const { mutate: deleteCom } = useMutation({
    mutationFn: (id: number) => api.delete(`/commodities/list/${id}`),
    onSuccess: () => { toast.success('Commodity deleted'); qc.invalidateQueries({ queryKey: ['commodities-list'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Cannot delete'),
  })

  const { mutate: deleteSite } = useMutation({
    mutationFn: (id: number) => api.delete(`/sites/${id}`),
    onSuccess: () => { toast.success('Site deleted'); qc.invalidateQueries({ queryKey: ['distribution-sites-mgmt'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Cannot delete'),
  })

  const TYPE_COLORS: Record<string, string> = {
    food: 'bg-green-100 text-green-700',
    non_food: 'bg-blue-100 text-blue-700',
    medical: 'bg-red-100 text-red-600',
    other: 'bg-gray-100 text-gray-600',
  }

  const TABS: { key: Tab; label: string; icon: typeof Tag }[] = [
    { key: 'commodities', label: 'Commodities', icon: Tag },
    { key: 'categories', label: 'Categories', icon: Tag },
    { key: 'sites', label: 'Distribution Sites', icon: MapPin },
  ]

  return (
    <div className="space-y-5">
      {modal?.type === 'categories' && (
        <CategoryModal category={modal.item} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'commodities' && (
        <CommodityModal commodity={modal.item} categories={categories} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'sites' && (
        <SiteModal site={modal.item} districts={districts} wards={wards} onClose={() => setModal(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage commodities, categories and distribution sites</p>
        </div>
        {canWrite && (
          <button onClick={() => setModal({ type: tab })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
            <Plus size={16} />
            {tab === 'commodities' ? 'New Commodity' : tab === 'categories' ? 'New Category' : 'New Site'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={cn('px-5 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === key ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800')}>
            {label}
          </button>
        ))}
      </div>

      {/* Commodities */}
      {tab === 'commodities' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          {loadingCom ? <div className="p-8 text-center text-sm text-gray-400">Loading…</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Unit</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {commodities.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.code}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium', TYPE_COLORS[c.category?.type ?? 'other'] ?? 'bg-gray-100 text-gray-600')}>
                        {c.category?.name ?? '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{c.unit}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium', c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex gap-3 text-xs font-medium">
                          <button onClick={() => setModal({ type: 'commodities', item: c })} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><Pencil size={12} /> Edit</button>
                          <button onClick={() => { if (confirm('Delete commodity?')) deleteCom(c.id) }} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Categories */}
      {tab === 'categories' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Description</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3">
                    <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', TYPE_COLORS[cat.type] ?? 'bg-gray-100 text-gray-600')}>
                      {cat.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{cat.description ?? '—'}</td>
                  <td className="px-4 py-3">
                    {canWrite && (
                      <div className="flex gap-3 text-xs font-medium">
                        <button onClick={() => setModal({ type: 'categories', item: cat })} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><Pencil size={12} /> Edit</button>
                        <button onClick={() => { if (confirm('Delete category?')) deleteCat(cat.id) }} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Distribution Sites */}
      {tab === 'sites' && (
        <div className="bg-white border border-gray-200 overflow-hidden">
          {loadingSites ? <div className="p-8 text-center text-sm text-gray-400">Loading…</div> : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Site</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">District / Ward</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sitesData?.data.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.code}</td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{s.district?.name ?? '—'}</p>
                      {s.ward && <p className="text-xs text-gray-400">{s.ward.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{s.capacity?.toLocaleString() ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium', s.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {canWrite && (
                        <div className="flex gap-3 text-xs font-medium">
                          <button onClick={() => setModal({ type: 'sites', item: s })} className="text-blue-600 hover:text-blue-800 flex items-center gap-1"><Pencil size={12} /> Edit</button>
                          <button onClick={() => { if (confirm('Delete site?')) deleteSite(s.id) }} className="text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
