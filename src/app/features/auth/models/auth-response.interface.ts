import { User } from './user.interface';

export interface AuthResponse {
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
}
