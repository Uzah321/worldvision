import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { User, Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { formatDateTime } from '../lib/utils'

export default function ProfilePage() {
  const { user: storeUser } = useAuthStore()

  const { data: profile, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => api.get('/me').then((r) => r.data),
  })

  const me = profile ?? storeUser

  const [pwForm, setPwForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const setPw = (k: string, v: string) => setPwForm((f) => ({ ...f, [k]: v }))

  const { mutate: changePassword, isPending: changingPw } = useMutation({
    mutationFn: () => api.post('/change-password', pwForm),
    onSuccess: () => {
      toast.success('Password changed successfully')
      setPwForm({ current_password: '', password: '', password_confirmation: '' })
    },
    onError: (err: any) => {
      const msg = err.response?.data?.errors?.current_password?.[0]
        ?? err.response?.data?.errors?.password?.[0]
        ?? err.response?.data?.message
        ?? 'Failed to change password'
      toast.error(msg)
    },
  })

  const canChangePw = pwForm.current_password && pwForm.password.length >= 8 && pwForm.password === pwForm.password_confirmation

  if (isLoading) return <div className="p-8 text-center text-sm text-gray-400">Loading profile…</div>

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your account details and security settings</p>
      </div>

      {/* Account info card */}
      <div className="bg-white border border-gray-200">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <User size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">Account Information</h2>
        </div>
        <div className="px-6 py-5">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-blue-700 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {me?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">{me?.name}</p>
              <p className="text-sm text-gray-500">{me?.email}</p>
              <p className="text-xs text-blue-600 font-medium capitalize mt-0.5">
                {me?.roles?.[0]?.name?.replace(/_/g, ' ') ?? 'No role assigned'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <InfoRow label="Employee ID" value={me?.employee_id} />
            <InfoRow label="Job Title" value={me?.job_title} />
            <InfoRow label="Phone" value={me?.phone} />
            <InfoRow label="District" value={me?.district?.name} />
            <InfoRow label="Last Login" value={formatDateTime(me?.last_login_at)} />
            <InfoRow label="Account Status" value={
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle size={13} /> Active
              </span>
            } />
          </div>
        </div>
      </div>

      {/* Change password card */}
      <div className="bg-white border border-gray-200">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
          <Lock size={18} className="text-gray-500" />
          <h2 className="font-semibold text-gray-800">Change Password</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
            <input type="password"
              className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pwForm.current_password}
              onChange={(e) => setPw('current_password', e.target.value)}
              placeholder="Enter current password" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
            <input type="password"
              className="w-full px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={pwForm.password}
              onChange={(e) => setPw('password', e.target.value)}
              placeholder="Min. 8 characters" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Confirm New Password</label>
            <input type="password"
              className={`w-full px-3 py-2 text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation
                  ? 'border-red-400 bg-red-50'
                  : 'border-gray-300'
              }`}
              value={pwForm.password_confirmation}
              onChange={(e) => setPw('password_confirmation', e.target.value)}
              placeholder="Repeat new password" />
            {pwForm.password_confirmation && pwForm.password !== pwForm.password_confirmation && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-200">
          <button
            disabled={!canChangePw || changingPw}
            onClick={() => changePassword()}
            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white text-sm font-medium transition-colors">
            {changingPw ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode | string | undefined | null }) {
  return (
    <div>
      <p className="text-xs text-gray-400 font-medium">{label}</p>
      <p className="text-gray-800 mt-0.5">{value ?? '—'}</p>
    </div>
  )
}
