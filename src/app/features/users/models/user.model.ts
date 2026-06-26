// src/features/users/models/user.model.ts
import { UUID } from '../../../core/models/api-response.model';

// =============================================================================
// CATÁLOGOS
// =============================================================================

export interface DocumentType {
  code: string;
  name: string;
  is_active: boolean;
}

export interface Country {
  code: string;
  name: string;
  is_active: boolean;
}

export interface State {
  code: string;
  name: string;
  country: string;       // FK → code del país
  country_name: string;  // read_only
  is_active: boolean;
}

export interface City {
  code: string;
  name: string;
  state: string;         // FK → code del estado
  state_name: string;    // read_only
  is_active: boolean;
}

export interface Gender {
  code: string;
  name: string;
  is_active: boolean;
}

// =============================================================================
// PERSON
// =============================================================================

export type PersonType = 'N' | 'J';

export interface Person {
  id: UUID;
  // Documento
  document_type: string;           // FK → code
  document_type_name?: string;     // read_only
  document_number: string;
  person_type: PersonType;
  // Nombres
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  legal_name?: string;
  // Contacto
  email: string;
  phone_number?: string;
  address?: string;
  // Ubicación
  country?: string;                // FK → code
  country_name?: string;           // read_only
  state?: string;                  // FK → code
  state_name?: string;             // read_only
  city?: string;                   // FK → code
  city_name?: string;              // read_only
  // Extras
  gender?: string;                 // FK → code
  legal_representative?: UUID;     // FK → Person.id
  // Computados (read_only)
  full_name?: string;
  short_name?: string;
  age?: number;
  // Auditoría
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PersonSimple {
  id: UUID;
  document_type: string;
  person_type?: PersonType;
  document_type_name?: string;
  document_number: string;
  full_name: string;
  email: string;
  phone_number?: string;
}

// Payload para crear persona (sin campos read_only)
export interface PersonCreatePayload {
  document_type: string;
  document_number: string;
  person_type: PersonType;
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  legal_name?: string;
  email: string;
  phone_number?: string;
  address?: string;
  country?: string;
  state?: string;
  city?: string;
  gender?: string;
  legal_representative?: UUID;
  // Flag especial del backend para crear usuario automáticamente
  create_user?: boolean;
}

export type PersonUpdatePayload = Partial<PersonCreatePayload>;

// =============================================================================
// USER
// =============================================================================

export interface UserPerson {
  id: UUID;
  document_type: string;
  document_type_name?: string;
  document_number: string;
  person_type: PersonType;
  full_name: string;
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  legal_name?: string;
  email: string;
  phone_number?: string;
  country?: string;
  state?: string;
  city?: string;
}

export interface User {
  id: UUID;
  username: string;
  email: string;
  person?: UserPerson;
  avatar?: string;
  // Computados
  full_name?: string;
  initials?: string;
  // Estado
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  verified_at?: string;
  is_locked?: boolean;
  locked_until?: string;
  failed_login_attempts?: number;
  needs_password_change?: boolean;
  // Auditoría
  last_login?: string;
  last_login_ip?: string;
  last_password_change?: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

// Para listados (UserListSerializer del backend)
export interface UserList {
  id: UUID;
  username: string;
  email: string;
  full_name: string;
  document_number: string;
  is_active: boolean;
  is_verified: boolean;
  is_staff: boolean;
  created_at?: string;
}

// =============================================================================
// PAYLOADS
// =============================================================================

/**
 * Payload para UserCreateSerializer del backend
 * Crea Person + User en una sola petición
 */
// src/features/users/models/user.model.ts

export interface UserCreatePayload {
  // Person fields
  document_type: string;
  document_number: string;
  person_type?: PersonType;
  // ✅ Opcionales porque dependen del person_type
  first_name?: string;
  second_name?: string;
  last_name?: string;
  second_last_name?: string;
  legal_name?: string;
  // Contacto
  email: string;
  phone_number?: string;
  // Ubicación
  country?: string;
  state?: string;
  city?: string;
  // Credenciales
  username?: string;
  password: string;
  password_confirm: string;
}

export interface UserUpdatePayload {
  username?: string;
  avatar?: File | null;
  metadata?: Record<string, unknown>;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

export interface SetPasswordPayload {
  new_password: string;
  new_password_confirm: string;
}

// =============================================================================
// FILTROS Y BÚSQUEDAS
// =============================================================================

export interface PersonSearchParams {
  q: string;
  document_type?: string;
  person_type?: PersonType | '';
}

export interface PersonFilterParams {
  document_type?: string;
  person_type?: PersonType;
  country?: string;
  is_active?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

export interface UserSearchParams {
  q: string;
  is_active?: boolean;
  is_verified?: boolean;
  is_staff?: boolean;
}

export interface UserFilterParams {
  is_active?: boolean;
  is_verified?: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
  search?: string;
}

// =============================================================================
// ESTADÍSTICAS
// =============================================================================

export interface PersonStats {
  total: number;
  active: number;
  inactive: number;
  by_type: Record<PersonType, number>;
  top_countries: Array<{ country__name: string; count: number }>;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  verified: number;
  unverified: number;
  staff: number;
  locked: number;
  recent_registrations?: number;
}

// =============================================================================
// VALIDACIONES
// =============================================================================

export interface EmailValidationResult {
  email: string;
  available: boolean;
}

export interface DocumentValidationResult {
  document_number: string;
  available: boolean;
}

// =============================================================================
// BULK ACTIONS
// =============================================================================

export type BulkActionType =
  | 'activate'
  | 'deactivate'
  | 'delete'
  | 'verify'
  | 'unverify';

export interface BulkActionPayload {
  action: BulkActionType;
  ids: UUID[];
}

export interface BulkActionResult {
  affected_count: number;
  action: BulkActionType;
}