import { api } from './axios';

export type PublicUser = {
  id: string;
  username: string;
  email: string;
  role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  firstName: string;
  lastName: string;
  avatar?: string;
  isEmailVerified: boolean;
};

type AuthResponse = { user: PublicUser; accessToken: string };

export async function registerRequest(payload: {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  const res = await api.post<{ success: true; data: AuthResponse }>('/auth/register', payload);
  return res.data.data;
}

export async function loginRequest(payload: { email: string; password: string }) {
  const res = await api.post<{ success: true; data: AuthResponse }>('/auth/login', payload);
  return res.data.data;
}

export async function googleLoginRequest(idToken: string) {
  const res = await api.post<{ success: true; data: AuthResponse }>('/auth/google', { idToken });
  return res.data.data;
}

export async function meRequest() {
  const res = await api.get<{ success: true; data: PublicUser }>('/auth/me');
  return res.data.data;
}

export async function logoutRequest() {
  await api.post('/auth/logout');
}
