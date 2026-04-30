export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error_code?: string;
  pagination?: Pagination;
  errors?: string[];
}

export interface Pagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
}

export interface SelectOption {
  value: string;
  label: string;
}

export type UUID = string;
