// ─────────────────────────────────────────────────────────────────────────────
// CATTLE MODULE – Models  (aligned with Django backend field names)
// ─────────────────────────────────────────────────────────────────────────────

// ── Catalogs ──────────────────────────────────────────────────────────────────

export interface Breed {
  id: string;
  code: string;
  name: string;
  description: string;
  typical_adult_weight_male?: string | null;
  typical_adult_weight_female?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Color {
  id: string;
  code: string;
  name: string;
  hex_color: string;   // backend field name
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Lot ───────────────────────────────────────────────────────────────────────

export type LotStatus = 'active' | 'closed';
export type LotType   = 'fattening' | 'breeding' | 'dairy' | 'calf' | 'replacement';

export interface Lot {
  id: string;
  code: string;
  name: string;
  description: string;
  farm: string | null;
  farm_name?: string;
  lot_type: LotType;
  lot_type_display?: string;
  start_date: string;          // backend: start_date
  end_date?: string | null;    // backend: end_date
  max_capacity?: number | null;
  status: LotStatus;
  current_head_count: number;
  total_weight: string;
  total_value: string;
  average_weight?: string;
  average_value?: string;
  occupancy_percentage?: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface LotSummary {
  lot: Lot;
  avg_daily_gain?: number;
  total_weight_gain?: number;
  cost_per_kg?: number;
  top_animals?: AnimalListItem[];
}

// ── Animal ────────────────────────────────────────────────────────────────────

export type AnimalGender   = 'M' | 'F';
export type AnimalStatus   = 'active' | 'sold' | 'dead' | 'transferred';
export type AnimalCategory =
  | 'calf_male' | 'calf_female'
  | 'weaned_male' | 'weaned_female'
  | 'heifer' | 'cow' | 'bull' | 'steer';

export interface AnimalListItem {
  id: string;
  tag_number: string;          // backend field: tag_number (NOT tag)
  name: string;
  electronic_id?: string | null;
  breed: string;
  breed_name?: string;
  breed_secondary?: string | null;
  breed_percentage: string;
  color?: string | null;
  color_name?: string;
  color_hex?: string;
  gender: AnimalGender;
  gender_display?: string;
  category: AnimalCategory;
  category_display?: string;
  birth_date?: string | null;
  entry_date: string;
  entry_weight?: string | null;
  current_weight?: string | null;
  last_weight_date?: string | null;
  lot?: string | null;
  lot_name?: string;
  farm?: string | null;
  farm_name?: string;
  status: AnimalStatus;
  status_display?: string;
  current_value: string;
  purchase_price: string;
  created_at: string;
}

export interface AnimalDetail extends AnimalListItem {
  registry_number: string;
  brand_mark: string;
  distinctive_marks: string;
  birth_weight?: string | null;
  is_pregnant: boolean;
  expected_calving_date?: string | null;
  total_calvings: number;
  is_castrated: boolean;
  castration_date?: string | null;
  mother?: string | null;
  mother_tag?: string;
  father?: string | null;
  father_tag?: string;
  notes: string;
  // Computed @property fields from Django model
  age_months?: number | null;
  age_years?: number | null;
  weight_gain?: string;
  weight_gain_percentage?: string;
  daily_gain?: string;
  value_appreciation?: string;
}

export interface Animal extends AnimalDetail {}  // alias for backward-compat

export interface AnimalSummary {
  animal: AnimalDetail;
  weight_history: WeightRecord[];
  health_events: HealthEvent[];
  total_weight_gain?: string;
  avg_daily_gain?: string;
  days_in_farm?: number;
}

// ── Weight record ─────────────────────────────────────────────────────────────

export interface WeightRecord {
  id: string;
  animal: string;
  animal_tag?: string;
  record_date: string;          // backend: record_date (NOT date)
  weight: string;
  price_per_kg?: string | null;
  body_condition_score?: number | null;
  notes: string;
  recorded_by?: string | null;
  recorded_by_name?: string;
  created_at: string;
}

export interface BulkWeightPayload {
  weights: { animal: string; weight: number }[];
  record_date?: string;
  price_per_kg?: number;
}

// ── Health event ──────────────────────────────────────────────────────────────

export type HealthEventType =
  | 'vaccine' | 'deworming' | 'medication'
  | 'surgery' | 'checkup' | 'pregnancy_check' | 'other';

export interface HealthEvent {
  id: string;
  animal: string;
  animal_tag?: string;
  event_type: HealthEventType;
  event_type_display?: string;
  event_date: string;           // backend: event_date (NOT date)
  product_name: string;
  product_batch: string;
  dosage: string;
  administration_route: string;
  withdrawal_days: number;
  withdrawal_end_date?: string | null;
  next_event_date?: string | null;
  cost: string;
  veterinarian: string;
  result: string;
  notes: string;
  created_by?: string | null;
  created_by_name?: string;
  created_at: string;
}

export interface BatchHealthEventCreate {
  animal_ids: string[];
  lot_id?: string;
  event_type: HealthEventType;
  event_date?: string;
  product_name: string;
  dosage?: string;
  withdrawal_days?: number;
  total_cost?: number;
  veterinarian?: string;
  notes?: string;
}

export interface BatchHealthEvent {
  id: string;
  lot?: string | null;
  lot_name?: string;
  event_type: HealthEventType;
  event_type_display?: string;
  event_date: string;
  product_name: string;
  product_batch: string;
  dosage: string;
  animals_count: number;
  total_cost: string;
  veterinarian: string;
  notes: string;
  cost_per_animal?: string;
  created_at: string;
}

export interface WithdrawalAnimal {
  animal: AnimalListItem;
  health_event: HealthEvent;
  withdrawal_end_date: string;
  days_remaining: number;
}

// ── Movement ──────────────────────────────────────────────────────────────────

export type MovementType =
  | 'purchase' | 'sale' | 'birth' | 'death'
  | 'lot_change' | 'farm_transfer' | 'other';

export interface Movement {
  id: string;
  animal: string;
  animal_tag?: string;
  movement_type: MovementType;
  movement_type_display?: string;
  movement_date: string;
  from_lot?: string | null;
  from_lot_name?: string;
  to_lot?: string | null;
  to_lot_name?: string;
  weight?: string | null;
  value?: string | null;
  third_party: string;
  description: string;
  notes: string;
  created_by?: string | null;
  created_at: string;
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface InventoryReport {
  total_animals: number;
  active_animals: number;
  sold_animals: number;
  dead_animals: number;
  total_lots: number;
  active_lots: number;
  total_weight: number;
  total_value: number;
  avg_weight: number;
  by_farm: InventoryFarmRow[];
  by_breed: InventoryBreedRow[];
  by_category: InventoryCategoryRow[];
}

export interface InventoryFarmRow {
  farm_id: string;
  farm_name: string;
  animal_count: number;
  avg_weight?: number;
  total_value?: number;
}

export interface InventoryBreedRow {
  breed_id: string;
  breed_name: string;
  animal_count: number;
  percentage: number;
}

export interface InventoryCategoryRow {
  category: AnimalCategory;
  category_display: string;
  count: number;
  percentage: number;
}

export interface WeightGainReport {
  animal_id: string;
  tag_number: string;
  name: string;
  lot_name: string;
  farm_name: string;
  entry_weight?: number;
  current_weight?: number;
  total_gain?: number;
  avg_daily_gain?: number;
  days_tracked: number;
}

export interface LotsSummaryReport {
  lot_id: string;
  lot_name: string;
  lot_code: string;
  farm_name: string;
  lot_type: LotType;
  status: LotStatus;
  current_head_count: number;
  average_weight?: number;
  total_weight?: number;
  total_value?: number;
  avg_daily_gain?: number;
  start_date: string;
  end_date?: string | null;
}

// ── Filters ───────────────────────────────────────────────────────────────────

export interface AnimalFilters {
  page?: number;
  page_size?: number;
  search?: string;
  status?: AnimalStatus;
  gender?: AnimalGender;
  category?: AnimalCategory;
  breed?: string;
  lot?: string;
  farm?: string;
  ordering?: string;
}

export interface LotFilters {
  status?: LotStatus;
  lot_type?: LotType;
  farm?: string;
  search?: string;
}

export interface WeightFilters {
  page?: number;
  page_size?: number;
  animal?: string;
  record_date?: string;
  ordering?: string;
}

export interface HealthFilters {
  page?: number;
  page_size?: number;
  animal?: string;
  event_type?: HealthEventType;
  event_date?: string;
  ordering?: string;
}

// ── Display constants ─────────────────────────────────────────────────────────

export const LOT_STATUS_LABELS: Record<LotStatus, string> = {
  active: 'Activo',
  closed: 'Cerrado',
};

export const LOT_STATUS_COLORS: Record<LotStatus, string> = {
  active: 'success',
  closed: 'default',
};

export const LOT_TYPE_LABELS: Record<LotType, string> = {
  fattening:   'Engorde',
  breeding:    'Cría',
  dairy:       'Lechería',
  calf:        'Terneros',
  replacement: 'Reemplazo',
};

export const ANIMAL_STATUS_LABELS: Record<AnimalStatus, string> = {
  active:      'Activo',
  sold:        'Vendido',
  dead:        'Fallecido',
  transferred: 'Trasladado',
};

export const ANIMAL_STATUS_COLORS: Record<AnimalStatus, string> = {
  active:      'success',
  sold:        'blue',
  dead:        'danger',
  transferred: 'warning',
};

export const ANIMAL_CATEGORY_LABELS: Record<AnimalCategory, string> = {
  calf_male:     'Ternero',
  calf_female:   'Ternera',
  weaned_male:   'Maute',
  weaned_female: 'Mauta',
  heifer:        'Novilla',
  cow:           'Vaca',
  bull:          'Toro',
  steer:         'Novillo',
};

export const GENDER_LABELS: Record<AnimalGender, string> = {
  M: 'Macho',
  F: 'Hembra',
};

export const HEALTH_TYPE_LABELS: Record<HealthEventType, string> = {
  vaccine:         'Vacuna',
  deworming:       'Desparasitación',
  medication:      'Medicación',
  surgery:         'Cirugía',
  checkup:         'Revisión',
  pregnancy_check: 'Chequeo de preñez',
  other:           'Otro',
};

export const HEALTH_TYPE_COLORS: Record<HealthEventType, string> = {
  vaccine:         'blue',
  deworming:       'green',
  medication:      'warning',
  surgery:         'danger',
  checkup:         'purple',
  pregnancy_check: 'pink',
  other:           'default',
};

export const HEALTH_EVENT_LABELS: Record<HealthEventType, string> = {
  vaccine:         'Vacunación',
  deworming:       'Desparasitación',
  medication:      'Medicación',
  surgery:         'Cirugía',
  checkup:         'Revisión',
  pregnancy_check: 'Chequeo de preñez',
  other:           'Evento de salud',
};

export const HEALTH_EVENT_COLORS: Record<HealthEventType, string> = {
  vaccine:         'blue',
  deworming:       'green',
  medication:      'warning',
  surgery:         'danger',
  checkup:         'purple',
  pregnancy_check: 'pink',
  other:           'default',
};

export const SEX_LABELS: Record<AnimalGender, string> = {
  M: 'Macho',
  F: 'Hembra',
};