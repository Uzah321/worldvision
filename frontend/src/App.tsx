import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import HouseholdsPage from './pages/HouseholdsPage'
import BeneficiariesPage from './pages/BeneficiariesPage'
import DistributionsPage from './pages/DistributionsPage'
import InventoryPage from './pages/InventoryPage'
import WarehousesPage from './pages/WarehousesPage'
import ProcurementPage from './pages/ProcurementPage'
import ProgrammesPage from './pages/ProgrammesPage'
import CatalogPage from './pages/CatalogPage'
import ReportsPage from './pages/ReportsPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'
import { useHasRole } from './store/authStore'

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

/** Redirects to / if the user doesn't have one of the required roles */
function RoleRoute({ roles, element }: { roles: string[]; element: ReactElement }) {
  const allowed = useHasRole(...roles)
  return allowed ? element : <Navigate to="/" replace />
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />

              {/* Households & Beneficiaries — hidden from warehouse/procurement/auditor */}
              <Route path="households"
                element={<RoleRoute roles={['super_admin','programme_manager','distribution_officer','data_officer','field_officer','auditor']} element={<HouseholdsPage />} />}
              />
              <Route path="beneficiaries"
                element={<RoleRoute roles={['super_admin','programme_manager','distribution_officer','data_officer','field_officer','auditor']} element={<BeneficiariesPage />} />}
              />

              {/* Distributions — hidden from warehouse/procurement/data roles */}
              <Route path="distributions"
                element={<RoleRoute roles={['super_admin','programme_manager','distribution_officer','field_officer','auditor']} element={<DistributionsPage />} />}
              />

              {/* Inventory & Warehouses — supply chain roles */}
              <Route path="inventory"
                element={<RoleRoute roles={['super_admin','programme_manager','warehouse_officer','procurement_officer','auditor']} element={<InventoryPage />} />}
              />
              <Route path="warehouses"
                element={<RoleRoute roles={['super_admin','warehouse_officer','auditor']} element={<WarehousesPage />} />}
              />

              {/* Procurement — supply chain + programme oversight */}
              <Route path="procurement"
                element={<RoleRoute roles={['super_admin','programme_manager','procurement_officer','warehouse_officer','auditor']} element={<ProcurementPage />} />}
              />

              {/* Programmes, Catalog, Reports — visible to all */}
              <Route path="programmes" element={<ProgrammesPage />} />
              <Route path="catalog"    element={<CatalogPage />} />
              <Route path="reports"    element={<ReportsPage />} />

              {/* Users — super_admin only */}
              <Route path="users"
                element={<RoleRoute roles={['super_admin']} element={<UsersPage />} />}
              />

              <Route path="profile" element={<ProfilePage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  )
}
