export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  createdAt: string;
}
