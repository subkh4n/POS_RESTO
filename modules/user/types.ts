// User Module Types

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  email?: string;
  phone?: string;
  avatar?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export enum UserRole {
  ADMIN = "ADMIN",
  KASIR = "KASIR",
  MANAGER = "MANAGER",
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user?: User;
  token?: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface UserSession {
  userId: string;
  username: string;
  role: UserRole;
  loginTime: string;
  expiresAt: string;
}
