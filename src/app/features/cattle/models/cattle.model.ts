export interface Breed {
  id: string;
  code: string;
  name: string;
  description?: string;
  typical_adult_weight_male?: number;
  typical_adult_weight_female?: number;
  is_active: boolean;
}

export interface Color {
  id: string;
  code: string;
  name: string;
  hex_color?: string;
  is_active: boolean;
}

export interface Lot {
  id: string;
  code: string;
  name: string;
  description?: string;
  farm: string;
  farm_code?: string;
  farm_name?: string;
  paddock?: string;
  lot_type: string;
  lot_type_display?: string;
  status: string;
  status_display?: string;
  start_date: string;
  end_date?: string;
  max_capacity?: number;
  current_head_count: number;
  total_weight: number;
  total_value: number;
  average_weight: number;
  average_value: number;
  occupancy_percentage: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Animal {
  id: string;
  tag_number: string;
  name?: string;
  electronic_id?: string;
  registry_number?: string;
  breed: string | Breed;
  breed_name?: string;
  breed_secondary?: string | Breed;
  breed_percentage: number;
  color?: string | Color;
  gender: string;
  gender_display?: string;
  category: string;
  category_display?: string;
  birth_date?: string;
  entry_date: string;
  exit_date?: string;
  mother?: string;
  mother_tag?: string;
  father?: string;
  father_tag?: string;
  lot?: string | Lot;
  lot_code?: string;
  farm?: string;
  farm_name?: string;
  birth_weight?: number;
  entry_weight?: number;
  current_weight?: number;
  last_weight_date?: string;
  purchase_price: number;
  current_value: number;
  status: string;
  status_display?: string;
  is_pregnant: boolean;
  expected_calving_date?: string;
  total_calvings: number;
  is_castrated: boolean;
  castration_date?: string;
  brand_mark?: string;
  distinctive_marks?: string;
  photo?: string;
  notes?: string;
  age_months?: number;
  age_years?: number;
  weight_gain?: number;
  weight_gain_percentage?: number;
  daily_gain?: number;
  value_appreciation?: number;
  created_at: string;
  updated_at: string;
}

export interface AnimalSummary {
  animal: {
    id: string;
    tag_number: string;
    name?: string;
    breed: string;
    gender: string;
    category: string;
    age_months?: number;
    status: string;
  };
  weight: {
    current?: number;
    entry?: number;
    gain?: number;
    gain_percentage?: number;
    daily_gain?: number;
    last_date?: string;
    min?: number;
    max?: number;
    average?: number;
    total_records: number;
  };
  value: {
    purchase: number;
    current: number;
    appreciation: number;
  };
  location: {
    lot?: string;
    farm?: string;
  };
  recent_health_events: HealthEventSummary[];
  recent_movements: MovementSummary[];
}

export interface WeightRecord {
  id: string;
  animal: string;
  animal_tag?: string;
  record_date: string;
  weight: number;
  price_per_kg?: number;
  estimated_value?: number;
  body_condition_score?: number;
  notes?: string;
  recorded_by?: string;
  created_at: string;
}

export interface Movement {
  id: string;
  animal: string;
  animal_tag?: string;
  movement_type: string;
  movement_type_display?: string;
  movement_date: string;
  from_lot?: string;
  from_lot_code?: string;
  to_lot?: string;
  to_lot_code?: string;
  weight?: number;
  value?: number;
  third_party?: string;
  description?: string;
  notes?: string;
  created_at: string;
}

export interface HealthEvent {
  id: string;
  animal: string;
  animal_tag?: string;
  event_type: string;
  event_type_display?: string;
  event_date: string;
  product_name?: string;
  product_batch?: string;
  dosage?: string;
  administration_route?: string;
  withdrawal_days: number;
  withdrawal_end_date?: string;
  next_event_date?: string;
  cost: number;
  veterinarian?: string;
  result?: string;
  notes?: string;
  created_at: string;
}

export interface HealthEventSummary {
  date: string;
  type: string;
  product?: string;
}

export interface MovementSummary {
  date: string;
  type: string;
  description?: string;
}

export interface LotSummary {
  lot: {
    id: string;
    code: string;
    name: string;
    type: string;
    status: string;
    paddock?: string;
  };
  totals: {
    head_count: number;
    total_weight: number;
    total_value: number;
    average_weight: number;
    average_value: number;
  };
  capacity: {
    max?: number;
    occupancy_percentage: number;
  };
  by_category: { category: string; count: number; weight?: number; value?: number }[];
  by_gender: Record<string, number>;
  weight_stats: {
    min?: number;
    max?: number;
    average?: number;
  };
}

export interface InventorySummary {
  totals: {
    heads: number;
    weight: number;
    value: number;
    average_weight: number;
  };
  by_category: {
    category: string;
    code: string;
    count: number;
    weight: number;
    value: number;
  }[];
  by_breed: { breed: string; count: number }[];
  by_gender: Record<string, number>;
}

// ==================== CONSTANTS ====================

export const ANIMAL_STATUS = [
  { value: 'active', label: 'Activo' },
  { value: 'sold', label: 'Vendido' },
  { value: 'deceased', label: 'Fallecido' },
  { value: 'transferred', label: 'Transferido' },
  { value: 'lost', label: 'Perdido' },
];

export const ANIMAL_GENDER = [
  { value: 'M', label: 'Macho' },
  { value: 'F', label: 'Hembra' },
];

export const ANIMAL_CATEGORIES = [
  { value: 'calf_m', label: 'Ternero' },
  { value: 'calf_f', label: 'Ternera' },
  { value: 'weaned_m', label: 'Desteto Macho' },
  { value: 'weaned_f', label: 'Desteto Hembra' },
  { value: 'steer', label: 'Novillo' },
  { value: 'heifer', label: 'Novilla' },
  { value: 'cow', label: 'Vaca' },
  { value: 'bull', label: 'Toro' },
  { value: 'bull_breed', label: 'Toro Reproductor' },
];

export const LOT_STATUS = [
  { value: 'active', label: 'Activo' },
  { value: 'closed', label: 'Cerrado' },
  { value: 'sold', label: 'Vendido' },
];

export const LOT_TYPES = [
  { value: 'fattening', label: 'Engorde' },
  { value: 'breeding', label: 'Cría' },
  { value: 'rearing', label: 'Levante' },
  { value: 'quarantine', label: 'Cuarentena' },
  { value: 'sale', label: 'Para Venta' },
];

export const MOVEMENT_TYPES = [
  { value: 'purchase', label: 'Compra' },
  { value: 'sale', label: 'Venta' },
  { value: 'birth', label: 'Nacimiento' },
  { value: 'death', label: 'Muerte' },
  { value: 'transfer_in', label: 'Ingreso por Transferencia' },
  { value: 'transfer_out', label: 'Salida por Transferencia' },
  { value: 'lot_change', label: 'Cambio de Lote' },
];

export const HEALTH_EVENT_TYPES = [
  { value: 'vaccination', label: 'Vacunación' },
  { value: 'deworming', label: 'Desparasitación' },
  { value: 'treatment', label: 'Tratamiento' },
  { value: 'surgery', label: 'Cirugía' },
  { value: 'checkup', label: 'Revisión' },
  { value: 'pregnancy', label: 'Chequeo de Preñez' },
  { value: 'insemination', label: 'Inseminación' },
  { value: 'other', label: 'Otro' },
];

export const BODY_CONDITION_SCORES = [
  { value: 1, label: '1 - Muy Flaco' },
  { value: 2, label: '2 - Flaco' },
  { value: 3, label: '3 - Delgado' },
  { value: 4, label: '4 - Moderadamente Delgado' },
  { value: 5, label: '5 - Moderado' },
  { value: 6, label: '6 - Bueno' },
  { value: 7, label: '7 - Muy Bueno' },
  { value: 8, label: '8 - Gordo' },
  { value: 9, label: '9 - Muy Gordo' },
];