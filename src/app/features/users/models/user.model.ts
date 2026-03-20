import { UUID } from "../../../core/models/api-response.model"

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
  country: Country;
}

export interface City {
  code: string;
  name: string;
  state: State;
}

export interface Gender {
  code: string;
  name: string;
}

export interface Person {
  id: UUID;
  document_type: DocumentType;
  document_number: string;
  person_type: 'N' | 'J';
  first_name: string;
  second_name?: string;
  last_name: string;
  second_last_name?: string;
  legal_name?: string;
  email: string;
  phone_number?: string;
  address?: string;
  country?: Country;
  state?: State;
  city?: City;
  gender?: Gender;
  legal_representative?: Person;
  full_name?: string;
}

export interface PersonSimple {
  id: UUID;
  document_number: string;
  full_name: string;
  email: string;
  phone_number?: string;
  // Opcionales: el serializer podría incluirlos o no
  document_type?: DocumentType;
  person_type?: 'N' | 'J';
}

export interface SearchFilters {
  document_type: string;
  person_type: string;
}

export interface PersonSearchParams {
  q: string;
  document_type?: string;
  person_type?: 'N' | 'J' | '';
}

