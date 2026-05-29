import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Warehouse, CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Warehouse as WarehouseType } from '../types'
import { cn } from '../lib/utils'

interface District { id: number; name: string }

function EditWarehouseModal({ warehouse, districts, onClose }: {
  warehouse: WarehouseType; districts: District[]; onClose: () => void
}) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    name: warehouse.name ?? '',
    address: (warehouse as any).address ?? '',
    capacity_cbm: (warehouse as any).capacity_cbm ?? '',
    district_id: String(warehouse.district?.id ?? ''),
  })
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.put(`/warehouses/${warehouse.id}`, {
      name: form.name,
      address: form.address || undefined,
      capacity_cbm: form.capacity_cbm ? Number(form.capacity_cbm) : undefined,
      district_id: form.district_id ? Number(form.district_id) : undefined,
    }),
    onSuccess: () => {
      toast.success('Warehouse updated')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Update failed'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Edit Warehouse</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
            <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.name} onChange={(e) => set('name', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">District</label>
            <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={form.district_id} onChange={(e) => set('district_id', e.target.value)}>
              <option value="">Select district…</option>
              {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
            <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street, City" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Capacity (m³)</label>
            <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={form.capacity_cbm} onChange={(e) => set('capacity_cbm', e.target.value)} placeholder="5000" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!form.name || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function WarehousesPage() {
  const qc = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<WarehouseType | null>(null)
  const [form, setForm] = useState({
    name: '', code: '', district_id: '', address: '', capacity_cbm: '',
  })

  // Plain array — the API uses .get() not paginate()
  const { data, isLoading, isError } = useQuery<WarehouseType[]>({
    queryKey: ['warehouses', activeFilter],
    queryFn: () =>
      api.get('/warehouses', { params: { active: activeFilter || undefined } }).then((r) => r.data),
  })

  const { data: districts } = useQuery<District[]>({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then((r) => r.data),
  })

  const { mutate: createWarehouse, isPending: creating } = useMutation({
    mutationFn: (d: typeof form) =>
      api.post('/warehouses', {
        ...d,
        district_id: d.district_id ? Number(d.district_id) : undefined,
        capacity_cbm: d.capacity_cbm ? Number(d.capacity_cbm) : undefined,
      }),
    onSuccess: () => {
      toast.success('Warehouse created')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
      setShowForm(false)
      setForm({ name: '', code: '', district_id: '', address: '', capacity_cbm: '' })
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create warehouse'),
  })

  const { mutate: toggleActive } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      api.put(`/warehouses/${id}`, { is_active: active }),
    onSuccess: () => {
      toast.success('Warehouse updated')
      qc.invalidateQueries({ queryKey: ['warehouses'] })
    },
    onError: () => toast.error('Update failed'),
  })

  const filtered = data
    ? activeFilter === '1' ? data.filter((w) => w.is_active)
    : activeFilter === '0' ? data.filter((w) => !w.is_active)
    : data
    : []

  return (
    <div className="space-y-5">
      {editingWarehouse && (
        <EditWarehouseModal
          warehouse={editingWarehouse}
          districts={districts ?? []}
          onClose={() => setEditingWarehouse(null)}
        />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Warehouses</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.length} locations` : 'Loading…'}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Add Warehouse
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Warehouse</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Main Warehouse"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="WH-001"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">District *</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.district_id}
                onChange={(e) => setForm((f) => ({ ...f, district_id: e.target.value }))}
              >
                <option value="">Select district…</option>
                {districts?.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
              <input
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="Street, City"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Capacity (m³)</label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.capacity_cbm}
                onChange={(e) => setForm((f) => ({ ...f, capacity_cbm: e.target.value }))}
                placeholder="5000"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              disabled={creating || !form.name || !form.code || !form.district_id}
              onClick={() => createWarehouse(form)}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors"
            >
              {creating ? 'Saving…' : 'Save Warehouse'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2">
        {([['', 'All'], ['1', 'Active'], ['0', 'Inactive']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setActiveFilter(val)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium border transition-colors',
              activeFilter === val
                ? 'bg-blue-700 text-white border-blue-700'
                : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading warehouses…</div>
        ) : isError ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <AlertTriangle size={32} className="text-red-400" />
            <p className="text-sm text-red-500">Failed to load warehouses. Check that the backend is running.</p>
          </div>
        ) : !filtered.length ? (
          <div className="p-12 text-center">
            <Warehouse size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No warehouses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Code</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">District</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Manager</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((w) => (
                  <tr key={w.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">{w.code}</td>
                    <td className="px-4 py-3 text-gray-600">{w.district?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{w.manager?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium',
                        w.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        {w.is_active
                          ? <><CheckCircle size={11} /> Active</>
                          : <><XCircle size={11} /> Inactive</>
                        }
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-xs font-medium">
                        <button onClick={() => setEditingWarehouse(w)}
                          className="text-blue-600 hover:text-blue-800">Edit</button>
                        <button
                          onClick={() => toggleActive({ id: w.id, active: !w.is_active })}
                          className={w.is_active ? 'text-red-600 hover:text-red-800' : 'text-emerald-600 hover:text-emerald-800'}
                        >
                          {w.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
