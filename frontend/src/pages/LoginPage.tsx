import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => api.post('/login', data),
    onSuccess: ({ data }) => {
      setAuth(data.token, data.user)
      navigate('/')
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message ?? 'Login failed. Please try again.'
      toast.error(msg)
    },
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 to-blue-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white shadow-lg mb-4">
            <span className="text-2xl font-black text-blue-700">WV</span>
          </div>
          <h1 className="text-3xl font-bold text-white">WorldVision AMS</h1>
          <p className="text-blue-200 mt-1 text-sm">Aid Management System</p>
        </div>

        {/* Card */}
        <div className="bg-white shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit((d) => mutate(d))} noValidate className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
              <input
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@worldvision.org"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-semibold transition-colors text-sm"
            >
              {isPending ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-blue-300 text-xs mt-6">
          © {new Date().getFullYear()} World Vision International
        </p>
      </div>
    </div>
  )
}
