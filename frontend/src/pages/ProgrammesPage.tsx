import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BarChart3, ChevronDown, ChevronRight, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Programme, PaginatedResponse } from '../types'
import { formatDate, formatCurrency, cn } from '../lib/utils'
import { useHasRole } from '../store/authStore'

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  completed: 'bg-blue-100 text-blue-700',
  suspended: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-600',
  inactive:  'bg-gray-100 text-gray-500',
}

interface Project { id: number; name: string; code: string; status: string; start_date: string; end_date: string }
interface Country { id: number; name: string }

const EMPTY_FORM = {
  name: '', code: '', donor: '', country_id: '',
  start_date: '', end_date: '', budget: '', currency: 'USD',
  status: 'active', description: '',
}

function NewProgrammeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { data: countries } = useQuery<Country[]>({
    queryKey: ['countries'],
    queryFn: () => api.get('/countries').then((r) => r.data),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/programmes', {
      ...form,
      country_id: Number(form.country_id),
      budget: form.budget ? Number(form.budget) : undefined,
    }),
    onSuccess: () => {
      toast.success('Programme created')
      qc.invalidateQueries({ queryKey: ['programmes'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create programme'),
  })

  const canSubmit = form.name && form.code && form.country_id && form.start_date && form.end_date && form.currency && form.status

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12">
      <div className="bg-white w-full max-w-lg relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">New Programme</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Emergency Food Assistance" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="EFA-2024" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Donor</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.donor} onChange={(e) => set('donor', e.target.value)} placeholder="USAID" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Country *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.country_id} onChange={(e) => set('country_id', e.target.value)}>
                <option value="">Select country…</option>
                {countries?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.start_date} onChange={(e) => set('start_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.end_date} onChange={(e) => set('end_date', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Budget</label>
              <input type="number" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.budget} onChange={(e) => set('budget', e.target.value)} placeholder="1000000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Currency *</label>
              <input maxLength={3} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                value={form.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} placeholder="USD" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.status} onChange={(e) => set('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Create Programme'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function ProjectRow({ programmeId }: { programmeId: number }) {
  const { data, isLoading } = useQuery<Project[]>({
    queryKey: ['programme-projects', programmeId],
    queryFn: () => api.get(`/programmes/${programmeId}/projects`).then((r) => r.data),
  })
  if (isLoading) return <tr><td colSpan={7} className="px-8 py-3 text-xs text-gray-400">Loading projects…</td></tr>
  if (!data?.length) return <tr><td colSpan={7} className="px-8 py-3 text-xs text-gray-400 italic">No projects</td></tr>
  return (
    <>
      {data.map((p) => (
        <tr key={p.id} className="bg-blue-50/40 border-b border-blue-100">
          <td className="px-8 py-2 text-xs text-gray-500 font-mono">{p.code}</td>
          <td className="px-4 py-2 text-xs text-gray-700 font-medium" colSpan={2}>{p.name}</td>
          <td className="px-4 py-2 text-xs text-gray-500">—</td>
          <td className="px-4 py-2 text-xs text-gray-500 whitespace-nowrap">{formatDate(p.start_date)} – {formatDate(p.end_date)}</td>
          <td className="px-4 py-2 text-xs text-gray-500">—</td>
          <td className="px-4 py-2">
            <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600')}>{p.status}</span>
          </td>
        </tr>
      ))}
    </>
  )
}

export default function ProgrammesPage() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const [showNew, setShowNew] = useState(false)
  const canWrite = useHasRole('super_admin', 'programme_manager')

  const { data, isLoading } = useQuery<PaginatedResponse<Programme>>({
    queryKey: ['programmes', statusFilter, page],
    queryFn: () =>
      api.get('/programmes', { params: { status: statusFilter || undefined, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const toggle = (id: number) =>
    setExpanded((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })

  return (
    <div className="space-y-5">
      {showNew && <NewProgrammeModal onClose={() => setShowNew(false)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programmes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? `${data.total.toLocaleString()} programmes` : 'Loading…'}</p>
        </div>
        {canWrite && (
          <button onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
            <Plus size={16} /> New Programme
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {['', 'active', 'inactive', 'completed', 'suspended'].map((s) => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1) }}
            className={cn('px-3 py-1.5 text-xs font-medium border transition-colors',
              statusFilter === s ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading programmes…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <BarChart3 size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No programmes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600 w-8"></th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Programme</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Donor</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Country</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Duration</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Budget</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((prog) => (
                  <Fragment key={prog.id}>
                    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggle(prog.id)}>
                      <td className="px-4 py-3 text-gray-400">
                        {expanded.has(prog.id) ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{prog.name}</p>
                        <p className="text-xs text-gray-400 font-mono">{prog.code}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{prog.donor ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{prog.country?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{formatDate(prog.start_date)} – {formatDate(prog.end_date)}</td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{formatCurrency(prog.budget, prog.currency)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[prog.status] ?? 'bg-gray-100 text-gray-600')}>{prog.status}</span>
                      </td>
                    </tr>
                    {expanded.has(prog.id) && <ProjectRow programmeId={prog.id} />}
                  </Fragment>
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
