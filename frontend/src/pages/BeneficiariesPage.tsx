import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, User, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Beneficiary, PaginatedResponse } from '../types'
import { cn } from '../lib/utils'

const STATUS_COLORS: Record<string, string> = {
  active:      'bg-emerald-100 text-emerald-700',
  graduated:   'bg-blue-100 text-blue-700',
  suspended:   'bg-amber-100 text-amber-700',
  deceased:    'bg-gray-100 text-gray-500',
  transferred: 'bg-purple-100 text-purple-700',
}

interface Household { id: number; household_number: string; head_name: string }

const EMPTY_FORM = {
  household_id: '',
  first_name: '', last_name: '',
  gender: 'female',
  date_of_birth: '', national_id: '', phone: '',
  is_household_head: false,
  is_disabled: false, is_pregnant: false,
  is_lactating: false, is_malnourished: false,
}

function RegisterModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_FORM)
  const [hhSearch, setHhSearch] = useState('')

  const { data: households } = useQuery<Household[]>({
    queryKey: ['households', hhSearch],
    queryFn: () => api.get('/households', { params: { search: hhSearch || undefined } }).then((r) => r.data),
    enabled: hhSearch.length > 1 || hhSearch === '',
  })

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/beneficiaries', {
      ...form,
      household_id: Number(form.household_id),
    }),
    onSuccess: () => {
      toast.success('Beneficiary registered')
      qc.invalidateQueries({ queryKey: ['beneficiaries'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Registration failed'),
  })

  const canSubmit = form.household_id && form.first_name && form.last_name && form.gender

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12">
      <div className="bg-white w-full max-w-lg relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Register Beneficiary</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {/* Household */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Household *</label>
            <input
              className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-1"
              placeholder="Search by household number or head name…"
              value={hhSearch}
              onChange={(e) => setHhSearch(e.target.value)}
            />
            {households && households.length > 0 && (
              <div className="border border-gray-200 max-h-36 overflow-y-auto">
                {households.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { set('household_id', String(h.id)); setHhSearch(`${h.household_number} — ${h.head_name}`) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b border-gray-100 last:border-0',
                      form.household_id === String(h.id) && 'bg-blue-50 font-medium'
                    )}
                  >
                    <span className="font-mono text-xs text-gray-500">{h.household_number}</span>
                    {' '}— {h.head_name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gender *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.gender} onChange={(e) => set('gender', e.target.value)}>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
              <input type="date" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.date_of_birth} onChange={(e) => set('date_of_birth', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">National ID</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.national_id} onChange={(e) => set('national_id', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {(['is_household_head', 'is_disabled', 'is_pregnant', 'is_lactating', 'is_malnourished'] as const).map((field) => (
              <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" checked={form[field] as boolean}
                  onChange={(e) => set(field, e.target.checked)}
                  className="w-4 h-4 text-blue-600" />
                {field.replace('is_', '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </label>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Register'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BeneficiariesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [showRegister, setShowRegister] = useState(false)

  const { data, isLoading } = useQuery<PaginatedResponse<Beneficiary>>({
    queryKey: ['beneficiaries', search, status, page],
    queryFn: () =>
      api.get('/beneficiaries', { params: { search: search || undefined, status: status || undefined, page } })
         .then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-5">
      {showRegister && <RegisterModal onClose={() => setShowRegister(false)} />}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Beneficiaries</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {data ? `${data.total.toLocaleString()} total records` : 'Loading…'}
          </p>
        </div>
        <button onClick={() => setShowRegister(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Register Beneficiary
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name, ID or QR code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
          <option value="deceased">Deceased</option>
          <option value="transferred">Transferred</option>
        </select>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading beneficiaries…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <User size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No beneficiaries found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">ID / Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Gender</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Age</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Household</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors cursor-pointer">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.full_name || `${b.first_name} ${b.last_name}`}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                      <div>{b.beneficiary_number}</div>
                      {b.national_id && <div className="text-gray-400">{b.national_id}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{b.gender}</td>
                    <td className="px-4 py-3 text-gray-600">{b.age ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">{b.household?.household_number ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600')}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {b.is_malnourished && <AlertCircle size={14} className="text-red-500" aria-label="Malnourished" />}
                        {b.is_disabled    && <AlertCircle size={14} className="text-amber-500" aria-label="Disabled" />}
                        {b.is_pregnant    && <AlertCircle size={14} className="text-pink-500" aria-label="Pregnant" />}
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
