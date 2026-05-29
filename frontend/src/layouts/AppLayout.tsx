import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  LayoutDashboard, Users, Package, Truck, ShoppingCart,
  Warehouse, BarChart3, LogOut, Menu, X, FileBarChart,
  Bell, Home, Tag, UserCircle, AlertTriangle,
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { cn } from '../lib/utils'
import type { Inventory } from '../types'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     roles: null },
  { to: '/households',    icon: Home,            label: 'Households',    roles: ['super_admin','programme_manager','distribution_officer','data_officer','field_officer','auditor'] },
  { to: '/beneficiaries', icon: Users,           label: 'Beneficiaries', roles: ['super_admin','programme_manager','distribution_officer','data_officer','field_officer','auditor'] },
  { to: '/distributions', icon: Truck,           label: 'Distributions', roles: ['super_admin','programme_manager','distribution_officer','field_officer','auditor'] },
  { to: '/inventory',     icon: Package,         label: 'Inventory',     roles: ['super_admin','programme_manager','warehouse_officer','procurement_officer','auditor'] },
  { to: '/warehouses',    icon: Warehouse,       label: 'Warehouses',    roles: ['super_admin','warehouse_officer','auditor'] },
  { to: '/procurement',   icon: ShoppingCart,    label: 'Procurement',   roles: ['super_admin','programme_manager','procurement_officer','warehouse_officer','auditor'] },
  { to: '/programmes',    icon: BarChart3,       label: 'Programmes',    roles: null },
  { to: '/catalog',       icon: Tag,             label: 'Catalog',       roles: null },
  { to: '/reports',       icon: FileBarChart,    label: 'Reports',       roles: null },
  { to: '/users',         icon: Users,           label: 'Users',         roles: ['super_admin'] },
]

function AlertsBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: expiry = [] } = useQuery<Inventory[]>({
    queryKey: ['inventory-expiry'],
    queryFn: () => api.get('/inventory/alerts/expiry').then((r) => r.data),
    staleTime: 5 * 60_000,
  })
  const { data: reorder = [] } = useQuery<Inventory[]>({
    queryKey: ['inventory-reorder'],
    queryFn: () => api.get('/inventory/alerts/reorder').then((r) => r.data),
    staleTime: 5 * 60_000,
  })

  const total = expiry.length + reorder.length

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors">
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-80 bg-white border border-gray-200 shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-sm text-gray-800">Inventory Alerts</p>
          </div>
          {total === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-gray-400">No active alerts</div>
          ) : (
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {expiry.map((inv) => (
                <div key={`exp-${inv.id}`} className="px-4 py-3 flex items-start gap-3">
                  <AlertTriangle size={15} className="text-red-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900">{inv.commodity?.name}</p>
                    <p className="text-gray-500">{inv.warehouse?.name} · Expires soon</p>
                  </div>
                </div>
              ))}
              {reorder.map((inv) => (
                <div key={`ro-${inv.id}`} className="px-4 py-3 flex items-start gap-3">
                  <AlertTriangle size={15} className="text-orange-500 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="font-medium text-gray-900">{inv.commodity?.name}</p>
                    <p className="text-gray-500">{inv.warehouse?.name} · Below reorder level ({inv.quantity_available?.toLocaleString()} left)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const userRoles = user?.roles?.map((r) => r.name) ?? []
  const visibleNav = NAV.filter((item) => !item.roles || item.roles.some((r) => userRoles.includes(r)))

  const { mutate: doLogout } = useMutation({
    mutationFn: () => api.post('/logout'),
    onSettled: () => {
      logout()
      navigate('/login')
    },
    onError: () => toast.error('Logout failed'),
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {open && (
        <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-30 w-64 bg-blue-950 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static lg:flex',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Brand */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-blue-900">
          <div className="w-9 h-9 bg-white flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-black text-blue-700">WV</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">WorldVision</p>
            <p className="text-xs text-blue-300">Aid Management</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-700 text-white'
                  : 'text-blue-200 hover:bg-blue-900 hover:text-white'
              )}
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* User / Logout */}
        <div className="px-3 py-4 border-t border-blue-900">
          <NavLink to="/profile" onClick={() => setOpen(false)}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2 mb-1 transition-colors',
              isActive ? 'bg-blue-700' : 'hover:bg-blue-900'
            )}>
            <div className="w-8 h-8 bg-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.name}</p>
              <p className="text-xs text-blue-300 truncate">{user?.roles?.[0]?.name?.replace(/_/g, ' ')}</p>
            </div>
            <UserCircle size={15} className="text-blue-400 shrink-0" />
          </NavLink>
          <button
            onClick={() => doLogout()}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-blue-200 hover:bg-blue-900 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 lg:px-6">
          <button className="lg:hidden text-gray-500" onClick={() => setOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <AlertsBell />
          <span className="text-sm text-gray-500 hidden sm:block">
            {new Date().toLocaleDateString('en-ZA', { dateStyle: 'full' })}
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
