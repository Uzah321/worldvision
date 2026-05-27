import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, CheckCircle, XCircle, Search, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import type { User, PaginatedResponse } from '../types'
import { formatDateTime, cn } from '../lib/utils'

interface Role { id: number; name: string }
interface District { id: number; name: string }

const EMPTY_USER = {
  name: '', email: '', password: '', employee_id: '',
  phone: '', job_title: '', district_id: '', role: '',
}

function InviteModal({ roles, districts, onClose }: { roles: Role[]; districts: District[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState(EMPTY_USER)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/users', {
      ...form,
      district_id: form.district_id ? Number(form.district_id) : undefined,
    }),
    onSuccess: () => {
      toast.success('User created')
      qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Failed to create user'),
  })

  const canSubmit = form.name && form.email && form.password && form.role

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 pt-12">
      <div className="bg-white w-full max-w-lg relative">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Invite User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="John Doe" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input type="email" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="user@worldvision.org" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
              <input type="password" className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="Min. 8 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
              <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                value={form.role} onChange={(e) => set('role', e.target.value)}>
                <option value="">Select role…</option>
                {roles.map((r) => <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>)}
              </select>
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
              <label className="block text-xs font-medium text-gray-600 mb-1">Employee ID</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.employee_id} onChange={(e) => set('employee_id', e.target.value)} placeholder="EMP-001" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Job Title</label>
              <input className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={form.job_title} onChange={(e) => set('job_title', e.target.value)} placeholder="Field Officer" />
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!canSubmit || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Create User'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

function AssignRoleModal({ userId, roles, onClose }: { userId: number; roles: Role[]; onClose: () => void }) {
  const qc = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post(`/users/${userId}/assign-role`, { role: selectedRole }),
    onSuccess: () => {
      toast.success('Role assigned')
      qc.invalidateQueries({ queryKey: ['users'] })
      onClose()
    },
    onError: () => toast.error('Role assignment failed'),
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-800">Assign Role</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5">
          <select className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
            <option value="">Select role…</option>
            {roles.map((r) => <option key={r.id} value={r.name}>{r.name.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button disabled={!selectedRole || isPending} onClick={() => mutate()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {isPending ? 'Saving…' : 'Assign'}
          </button>
          <button onClick={onClose} className="px-4 py-2 border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [showInvite, setShowInvite] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<number | null>(null)

  const { data, isLoading } = useQuery<PaginatedResponse<User>>({
    queryKey: ['users', search, page],
    queryFn: () =>
      api.get('/users', { params: { search: search || undefined, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ['roles'],
    queryFn: () => api.get('/roles').then((r) => r.data),
  })

  const { data: districts = [] } = useQuery<District[]>({
    queryKey: ['districts'],
    queryFn: () => api.get('/districts').then((r) => r.data),
  })

  const { mutate: activate } = useMutation({
    mutationFn: (id: number) => api.post(`/users/${id}/activate`),
    onSuccess: () => { toast.success('User activated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  const { mutate: deactivate } = useMutation({
    mutationFn: (id: number) => api.post(`/users/${id}/deactivate`),
    onSuccess: () => { toast.success('User deactivated'); qc.invalidateQueries({ queryKey: ['users'] }) },
    onError: (err: any) => toast.error(err.response?.data?.message ?? 'Action failed'),
  })

  return (
    <div className="space-y-5">
      {showInvite && <InviteModal roles={roles} districts={districts} onClose={() => setShowInvite(false)} />}
      {assigningUserId !== null && (
        <AssignRoleModal userId={assigningUserId} roles={roles} onClose={() => setAssigningUserId(null)} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data ? `${data.total.toLocaleString()} system users` : 'Loading…'}</p>
        </div>
        <button onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium transition-colors">
          <Plus size={16} /> Invite User
        </button>
      </div>

      <div className="bg-white border border-gray-200 p-4">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name or email…"
            value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
        </div>
      </div>

      <div className="bg-white border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading users…</div>
        ) : !data?.data.length ? (
          <div className="p-12 text-center">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-medium text-gray-600">User</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Role</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">District</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Last Login</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data.data.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 capitalize text-xs">
                      {u.roles?.[0]?.name?.replace(/_/g, ' ') ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{u.district?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(u.last_login_at)}</td>
                    <td className="px-4 py-3">
                      <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium',
                        u.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500')}>
                        {u.is_active ? <><CheckCircle size={11} /> Active</> : <><XCircle size={11} /> Inactive</>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 text-xs font-medium">
                        <button onClick={() => setAssigningUserId(u.id)} className="text-blue-600 hover:text-blue-800">Role</button>
                        {u.is_active
                          ? <button onClick={() => deactivate(u.id)} className="text-red-600 hover:text-red-800">Deactivate</button>
                          : <button onClick={() => activate(u.id)} className="text-emerald-600 hover:text-emerald-800">Activate</button>
                        }
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
