import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index               element={<DashboardPage />} />
              <Route path="households"   element={<HouseholdsPage />} />
              <Route path="beneficiaries" element={<BeneficiariesPage />} />
              <Route path="distributions" element={<DistributionsPage />} />
              <Route path="inventory"    element={<InventoryPage />} />
              <Route path="warehouses"   element={<WarehousesPage />} />
              <Route path="procurement"  element={<ProcurementPage />} />
              <Route path="programmes"   element={<ProgrammesPage />} />
              <Route path="catalog"      element={<CatalogPage />} />
              <Route path="reports"      element={<ReportsPage />} />
              <Route path="users"        element={<UsersPage />} />
              <Route path="profile"      element={<ProfilePage />} />
              <Route path="*"            element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </QueryClientProvider>
  )
}
