// Purchase Store Enterprise API Service Layer
// Communicates with backend Node/Express server using NEXT_PUBLIC_API_URL

import { 
  DatabaseState, 
  User, 
  Project, 
  Vendor, 
  Category, 
  Item, 
  PurchaseRequest, 
  PurchaseOrder, 
  GRN, 
  Stock, 
  StoreOutward, 
  VendorBill, 
  PaymentRequest, 
  PaymentEntry, 
  AuditLog, 
  Notification,
  RolePermission 
} from './storeData';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005/api';

// Helper for HTTP requests
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || json.error || `HTTP ${response.status} request failed`);
  }
  return json;
}

// Authentication Service
export const authApi = {
  login: async (email: string, password: string = '123456') => {
    return request<{ status: string; token: string; user: User; message?: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  getMe: async () => {
    return request<{ status: string; user: User }>('/auth/me', {
      method: 'GET',
    });
  },
};

// Database Synchronization & Full Persistence Service
export const syncApi = {
  fetchState: async () => {
    return request<{ status: string; data?: DatabaseState; message?: string }>('/sync', {
      method: 'GET',
    });
  },
  saveState: async (state: DatabaseState) => {
    return request<{ status: string; message: string }>('/sync', {
      method: 'POST',
      body: JSON.stringify(state),
    });
  },
};

// Users & Staff Management API
export const usersApi = {
  getAll: async () => {
    return request<{ status: string; data: User[] }>('/users', { method: 'GET' });
  },
  create: async (user: Omit<User, 'id'>) => {
    return request<{ status: string; data: User }>('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  },
  update: async (id: string, user: Partial<User>) => {
    return request<{ status: string; data: User }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  },
  delete: async (id: string) => {
    return request<{ status: string; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Export consolidated API client
export const api = {
  auth: authApi,
  sync: syncApi,
  users: usersApi,
};

export default api;
