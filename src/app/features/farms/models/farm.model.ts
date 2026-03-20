export interface Farm {
  id: string;
  code: string;
  name: string;
  farm_type: string;
  farm_type_display?: string;
  status: string;
  status_display?: string;
  country?: string;
  state?: string;
  city?: string;
  address?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  total_area: number;
  usable_area?: number;
  cattle_capacity: number;
  current_cattle_count: number;
  occupancy_percentage: number;
  available_capacity: number;
  owner?: string;
  owner_name?: string;
  phone?: string;
  email?: string;
  description?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface FarmsSimple {
  id: string;
  code: string;
  name: string;
}

export interface FarmSummary {
  farm: {
    id: string;
    code: string;
    name: string;
    type: string;
    status: string;
    location: string;
  };
  area: {
    total: number;
    usable: number;
    pasture: number;
    forest: number;
  };
  capacity: {
    total: number;
    current: number;
    available: number;
    occupancy_percentage: number;
  };
  cattle: {
    count: number;
    total_weight: number;
    total_value: number;
    average_weight: number;
    by_category: { category: string; count: number }[];
  };
  paddocks: {
    total: number;
    available: number;
    occupied: number;
    resting: number;
  };
  employees: {
    active_count: number;
  };
}

export interface Paddock {
  id: string;
  code: string;
  name: string;
  farm: string;
  farm_code?: string;
  paddock_type: string;
  status: string;
  area: number;
  grass_type: string;
  capacity: number;
  current_cattle_count: number;
  occupancy_percentage: number;
  is_available: boolean;
  days_until_available: number;
  available_date?: string;
  has_water_source: boolean;
  has_shade: boolean;
  rest_days: number;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  person_id: string;
  full_name: string;
  farm_id: string;
  farm_code?: string;
  role: string;
  role_display?: string;
  job_title?: string;
  status: string;
  hire_date: string;
  termination_date?: string;
  tenure_years: number;
  salary?: number;
  salary_frequency?: string;
  lives_on_farm: boolean;
  phone?: string;
  created_at: string;
}

export const FARM_TYPES = [
  { value: 'fattening', label: 'Ganadería de Engorde' },
  { value: 'breeding', label: 'Ganadería de Cría' },
  { value: 'dual', label: 'Doble Propósito' },
  { value: 'dairy', label: 'Lechería' },
  { value: 'mixed', label: 'Mixta' },
];

export const FARM_STATUS = [
  { value: 'active', label: 'Activa' },
  { value: 'inactive', label: 'Inactiva' },
  { value: 'leased', label: 'Arrendada' },
];

export const PADDOCK_TYPES = [
  { value: 'grazing', label: 'Pastoreo' },
  { value: 'fattening', label: 'Engorde' },
  { value: 'breeding', label: 'Cría' },
  { value: 'quarantine', label: 'Cuarentena' },
  { value: 'maternity', label: 'Maternidad' },
  { value: 'weaning', label: 'Destete' },
];

export const PADDOCK_STATUS = [
  { value: 'available', label: 'Disponible' },
  { value: 'occupied', label: 'Ocupado' },
  { value: 'resting', label: 'En Descanso' },
  { value: 'maintenance', label: 'En Mantenimiento' },
];

export const EMPLOYEE_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'foreman', label: 'Capataz' },
  { value: 'cowboy', label: 'Vaquero' },
  { value: 'vet', label: 'Veterinario' },
  { value: 'guard', label: 'Vigilante' },
  { value: 'general', label: 'Trabajador General' },
];