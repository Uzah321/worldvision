import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Home, Search, X, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { Household, PaginatedResponse } from '../types'
import { cn, exportToCsv } from '../lib/utils'

interface District { id: number; name: string }
interface Ward { id: number; name: string; district_id: number }

const EMPTY_FORM = {
  household_number: '', head_name: '', head_national_id: '', head_phone: '',
  head_gender: 'male', head_dob: '', total_members: '1',
  male_members: '0', female_members: '0', children_under5: '0',
  children_5_17: '0', elderly_60plus: '0', disabled_members: '0',
  pregnant_lactating: '0', vulnerability_score: '0',
  district_id: '', ward_id: '', address: '', notes: '',
}

function HouseholdModal({
  household, districts, wards, onClose,
}: {
  household?: Household
  districts: District[]
  wards: Ward[]
  onClose: () => void
}) {
  const qc = useQueryClient()
  const isEdit = !!household
  const [form, setForm] = useState(isEdit ? {
    household_number: household.household_number,
    head_name: household.head_name,
    head_national_id: household.head_national_id ?? '',
    head_phone: household.head_phone ?? '',
    head_gender: household.head_gender,
    head_dob: household.head_dob ?? '',
    total_members: String(household.total_members),
    male_members: String(household.male_members),
    female_members: String(household.female_members),
    children_under5: String(household.children_under5),
    children_5_17: String(household.children_5_17),
    elderly_60plus: String(household.elderly_60plus),
    disabled_members: String(household.disabled_members),
    pregnant_lactating: String(household.pregnant_lactating),
    vulnerability_score: String(household.vulnerability_score),
    district_id: String(household.district?.id ?? ''),
    ward_id: String(household.ward?.id ?? ''),
    address: household.address ?? '',
    notes: household.notes ?? '',
  } : EMPTY_FORM)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const filteredWards = wards.filter((w) => String(w.district_id) === form.district_id)

  const { mutate, isPending } = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        total_members: Number(form.total_members),
        male_members: Number(form.male_members),
        female_members: Number(form.female_members),
        children_under5: Number(form.children_under5),
        children_5_17: Number(form.children_5_17),
        elderly_60plus: Number(form.elderly_60plus),
        disabled_members: Number(form.disabled_members),
        pregnant_lactating: Number(form.pregnant_lactating),
        vulnerability_score: Number(form.vulnerability_score),
        district_id: Number(form.district_id),
        ward_id: form.ward_id ? Number(form.ward_id) : undefined,
        head_national_id: form.head_national_id || undefined,
        head_phone: form.head_phone || undefined,
        head_dob: form.head_dob || undefined,
        address: form.address || undefined,
        notes: form.notes || undefined,
      }
      return isEdit
        ? api.put(`/households/${household.id}`, payload)
        : api.post('/households', payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Household updated' : 'Household created')
      qc.invalidateQueries({ queryKey: ['households'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to save household'),
  })

  const canSubmit = form.household_number && form.head_name && form.district_id && Number(form.total_members) >= 1

  const Field = ({ label, children, span2 = false }: { label: string; children: React.ReactNode; span2?: boolean }) => (
    <div className={span2 ? 'col-span-2' : ''}>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input {...props} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" />
  )
  const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) => (
    <select {...props} className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
  )

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-10">
      <div className="bg-white w-full max-w-2xl relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">{isEdit ? 'Edit Household' : 'Register Household'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Household Identity</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Household Number *">
              <Input value={form.household_number} onChange={(e) => set('household_number', e.target.value)}
                placeholder="HH-00001" disabled={isEdit} />
            </Field>
            <Field label="Head of Household *">
              <Input value={form.head_name} onChange={(e) => set('head_name', e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="National ID">
              <Input value={form.head_national_id} onChange={(e) => set('head_national_id', e.target.value)} placeholder="63-123456 A 00" />
            </Field>
            <Field label="Phone">
              <Input value={form.head_phone} onChange={(e) => set('head_phone', e.target.value)} placeholder="+263-77-..." />
            </Field>
            <Field label="Gender *">
              <Select value={form.head_gender} onChange={(e) => set('head_gender', e.target.value)}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Date of Birth">
              <Input type="date" value={form.head_dob} onChange={(e) => set('head_dob', e.target.value)} />
            </Field>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 pt-2">Location</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="District *">
              <Select value={form.district_id} onChange={(e) => { set('district_id', e.target.value); set('ward_id', '') }}>
                <option value="">Select district…</option>
                {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Ward">
              <Select value={form.ward_id} onChange={(e) => set('ward_id', e.target.value)} disabled={!form.district_id}>
                <option value="">Select ward…</option>
                {filteredWards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </Field>
            <Field label="Address" span2>
              <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street / village" />
            </Field>
          </div>

          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 pt-2">Composition</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Total Members *', 'total_members'],
              ['Male', 'male_members'],
              ['Female', 'female_members'],
              ['Children <5', 'children_under5'],
              ['Children 5–17', 'children_5_17'],
              ['Elderly 60+', 'elderly_60plus'],
              ['Disabled', 'disabled_members'],
              ['Pregnant/Lactating', 'pregnant_lactating'],
            ].map(([label, key]) => (
              <Field key={key} label={label}>
                <Input type="number" min="0" value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)} />
              </Field>
            ))}
            <Field label="Vulnerability Score (0–10)">
              <Input type="number" min="0" max="10" step="0.1" value={form.vulnerability_score}
                onChange={(e) => set('vulnerability_score', e.target.value)} />
            </Field>
          </div>

          <Field label="Notes" span2={false}>
            <textarea className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Register Household'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  active:    'bg-emerald-100 text-emerald-700',
  graduated: 'bg-blue-100 text-blue-700',
  suspended: 'bg-amber-100 text-amber-700',
  deceased:  'bg-gray-100 text-gray-500',
}

export default function HouseholdsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<Household | null | 'new'>(null)

  const { data, isLoading } = useQuery<PaginatedResponse<Household>>({
    queryKey: ['households', search, districtFilter, page],
    queryFn: () => api.get('/households', {
      params: { search: search || undefined, district_id: districtFilter || undefined, page },
    }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then((r) => r.data),
  })

  const { data: wards = [] } = useQuery<Ward[]>({
    queryKey: ['wards'],
    queryFn: () => api.get('/wards').then((r) => r.data),
  })

  const { mutate: deleteHh } = useMutation({
    mutationFn: (id: number) => api.delete(`/households/${id}`),
    onSuccess: () => { toast.success('Household deleted'); qc.invalidateQueries({ queryKey: ['households'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Delete failed'),
  })

  const handleExport = () => {
    if (!data?.data.length) return
    exportToCsv('households', data.data as unknown as Record<string, unknown>[], [
      { key: 'household_number', label: 'HH Number' },
      { key: 'head_name', label: 'Head of Household' },
      { key: 'head_gender', label: 'Gender' },
      { key: 'total_members', label: 'Total Members' },
      { key: 'vulnerability_score', label: 'Vulnerability Score' },
      { key: 'district.name', label: 'District' },
      { key: 'ward.name', label: 'Ward' },
      { key: 'status', label: 'Status' },
    ])
  }

  return (
    <div className="space-y-5">
      {modal === 'new' && (
        <HouseholdModal districts={districts} wards={wards} onClose={() => setModal(null)} />
      )}
      {modal && modal !== 'new' && (
        <HouseholdModal household={modal as Household} districts={districts} wards={wards} onClose={() => setModal(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Households</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? `${data.total.toLocaleString()} registered households` : 'Loading…'}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors">
            <Download size={15} /> Export CSV
          </button>
          <button onClick={() => setModal('new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
            <Plus size={16} /> Register Household
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by number or head name…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
        <select className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          value={districtFilter} onChange={(e) => { setDistrictFilter(e.target.value); setPage(1) }}>
          <option value="">All districts</option>
          {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading households…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <Home size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No households found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">HH Number</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Head of Household</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">District / Ward</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Members</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-600">Vuln. Score</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((hh) => (
                  <tr key={hh.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{hh.household_number}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{hh.head_name}</p>
                      <p className="text-xs text-gray-400 capitalize">{hh.head_gender}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <p>{hh.district?.name ?? '—'}</p>
                      {hh.ward && <p className="text-xs text-gray-400">{hh.ward.name}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{hh.total_members}</td>
                    <td className="px-4 py-3 text-right">
                      {(() => { const v = Number(hh.vulnerability_score); return (
                        <span className={cn('font-semibold', v >= 8 ? 'text-red-600' : v >= 5 ? 'text-amber-600' : 'text-gray-700')}>
                          {v.toFixed(1)}
                        </span>
                      )})()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-medium capitalize', STATUS_COLORS[hh.status] ?? 'bg-gray-100 text-gray-500')}>
                        {hh.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-xs font-medium">
                        <button onClick={() => setModal(hh)} className="text-blue-600 hover:text-blue-800">Edit</button>
                        <button onClick={() => { if (confirm('Delete this household?')) deleteHh(hh.id) }}
                          className="text-red-500 hover:text-red-700">Delete</button>
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
