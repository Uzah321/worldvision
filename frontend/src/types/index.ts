export interface User {
  id: number
  name: string
  email: string
  employee_id?: string
  phone?: string
  job_title?: string
  is_active: boolean
  last_login_at?: string
  district?: { id: number; name: string }
  roles: Array<{ id: number; name: string }>
  permissions: Array<{ id: number; name: string }>
}

export interface Beneficiary {
  id: number
  beneficiary_number: string
  first_name: string
  last_name: string
  full_name: string
  national_id?: string
  date_of_birth?: string
  age?: number
  gender: 'male' | 'female' | 'other'
  phone?: string
  status: 'active' | 'graduated' | 'suspended' | 'deceased' | 'transferred'
  is_disabled: boolean
  is_pregnant: boolean
  is_lactating: boolean
  is_malnourished: boolean
  qr_code?: string
  household?: Household
}

export interface Household {
  id: number
  household_number: string
  head_name: string
  head_national_id?: string
  head_phone?: string
  head_gender: 'male' | 'female' | 'other'
  head_dob?: string
  total_members: number
  male_members: number
  female_members: number
  children_under5: number
  children_5_17: number
  elderly_60plus: number
  disabled_members: number
  pregnant_lactating: number
  vulnerability_score: number
  address?: string
  status: 'active' | 'graduated' | 'suspended' | 'deceased'
  notes?: string
  district?: { id: number; name: string }
  ward?: { id: number; name: string }
  beneficiaries?: Beneficiary[]
}

export interface Programme {
  id: number
  name: string
  code: string
  donor?: string
  start_date: string
  end_date: string
  budget?: number
  currency: string
  status: string
  country?: { id: number; name: string }
}

export interface Distribution {
  id: number
  distribution_number: string
  name: string
  distribution_date: string
  status: 'planned' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
  mode: 'in_kind' | 'cash' | 'voucher'
  planned_beneficiaries: number
  actual_beneficiaries?: number
  project?: { id: number; name: string }
  programme?: { id: number; name: string }
  site?: { id: number; name: string }
  created_by?: Partial<User>
}

export interface Inventory {
  id: number
  batch_number?: string
  expiry_date?: string
  quantity_available: number
  quantity_received: number
  quantity_distributed: number
  quantity_damaged: number
  reorder_level?: number
  status: string
  warehouse?: { id: number; name: string }
  commodity?: { id: number; name: string; unit: string }
}

export interface Warehouse {
  id: number
  name: string
  code: string
  is_active: boolean
  district?: { id: number; name: string }
  manager?: Partial<User>
}

export interface ProcurementOrder {
  id: number
  po_number: string
  title: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'partially_received' | 'received'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  total_amount: number
  currency: string
  required_date: string
  supplier?: { id: number; name: string }
  programme?: { id: number; name: string }
}

export interface PaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

export interface CommodityCategory {
  id: number
  name: string
  type: 'food' | 'non_food' | 'medical' | 'other'
  description?: string
}

export interface CommodityFull {
  id: number
  name: string
  code: string
  unit: string
  description?: string
  is_active: boolean
  category?: CommodityCategory
}

export interface DistributionSite {
  id: number
  name: string
  code: string
  address?: string
  capacity?: number
  is_active: boolean
  district?: { id: number; name: string }
  ward?: { id: number; name: string }
}

export interface InventoryMovement {
  id: number
  movement_type: string
  quantity: number
  balance_after: number
  notes?: string
  reference_number?: string
  created_at: string
  performedBy?: { id: number; name: string }
}

export interface DistributionRecord {
  id: number
  collected_at: string
  verification_method: string
  collected_by_proxy: boolean
  proxy_name?: string
  is_flagged: boolean
  rations_received?: Record<string, number>
  beneficiary?: Partial<Beneficiary>
  household?: Partial<Household>
  recordedBy?: { id: number; name: string }
}

export interface EnrollmentPivot {
  programme_id: number
  enrollment_date: string
  exit_date?: string
  status: 'active' | 'graduated' | 'exited'
  pivot?: { enrollment_date: string; exit_date?: string; status: string }
}

export interface DashboardStats {
  beneficiaries: { total: number; active: number; this_month: number }
  distributions: { planned: number; in_progress: number; completed: number; this_month: number }
  inventory: { near_expiry: number; below_reorder: number }
  procurement: { pending_approval: number; this_month: number }
}
