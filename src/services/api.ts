const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('hostel_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (credentials: { identifier: string; password: string }) =>
    request<{ token: string; user: any; profile: any; residentInfo: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  registerOwner: (data: any) =>
    request<{ token: string; user: any; profile: any }>('/auth/register-owner', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getCurrentUser: () =>
    request<{ user: any; profile: any; residentInfo: any }>('/auth/me'),

  resetDemo: () =>
    request<{ message: string }>('/auth/reset-demo', { method: 'POST' }),

  // Dashboard
  getOwnerSummary: () =>
    request<{
      stats: any;
      recentComplaints: any[];
      recentPayments: any[];
      recentNotices: any[];
    }>('/dashboard/owner-summary'),

  getResidentSummary: () =>
    request<{
      resident: any;
      roommates: any[];
      feesSummary: any;
      recentComplaints: any[];
      notices: any[];
    }>('/dashboard/resident-summary'),

  // Rooms
  getRooms: () => request<any[]>('/rooms'),
  getRoomById: (id: string) => request<any>(`/rooms/${id}`),
  createRoom: (data: any) =>
    request<any>('/rooms', { method: 'POST', body: JSON.stringify(data) }),
  updateRoom: (id: string, data: any) =>
    request<any>(`/rooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteRoom: (id: string) =>
    request<{ message: string }>(`/rooms/${id}`, { method: 'DELETE' }),
  transferResident: (data: { residentId: string; targetRoomId: string; targetBedId: string }) =>
    request<{ message: string; resident: any }>('/rooms/transfer-resident', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Residents
  getResidents: (params?: { search?: string; status?: string; roomId?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.roomId) query.set('roomId', params.roomId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/residents${qs}`);
  },
  getResidentById: (id: string) => request<any>(`/residents/${id}`),
  createResident: (data: any) =>
    request<{ resident: any; generatedCredentials: any }>('/residents', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateResident: (id: string, data: any) =>
    request<any>(`/residents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  removeResident: (id: string, hard = false) =>
    request<{ message: string }>(`/residents/${id}?hard=${hard}`, { method: 'DELETE' }),

  // Fees
  getPayments: (params?: { residentId?: string; status?: string; monthYear?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.residentId) query.set('residentId', params.residentId);
    if (params?.status) query.set('status', params.status);
    if (params?.monthYear) query.set('monthYear', params.monthYear);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/fees${qs}`);
  },
  getReceipt: (paymentId: string) => request<any>(`/fees/${paymentId}/receipt`),
  createPayment: (data: any) =>
    request<any>('/fees', { method: 'POST', body: JSON.stringify(data) }),
  updatePayment: (id: string, data: any) =>
    request<any>(`/fees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePayment: (id: string) =>
    request<{ message: string }>(`/fees/${id}`, { method: 'DELETE' }),

  // Complaints
  getComplaints: (params?: { status?: string; priority?: string; category?: string; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.priority) query.set('priority', params.priority);
    if (params?.category) query.set('category', params.category);
    if (params?.search) query.set('search', params.search);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<any[]>(`/complaints${qs}`);
  },
  getComplaintById: (id: string) => request<any>(`/complaints/${id}`),
  createComplaint: (data: any) =>
    request<any>('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  updateComplaint: (id: string, data: any) =>
    request<any>(`/complaints/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteComplaint: (id: string) =>
    request<{ message: string }>(`/complaints/${id}`, { method: 'DELETE' }),

  // Notices
  getNotices: () => request<any[]>('/notices'),
  createNotice: (data: any) =>
    request<any>('/notices', { method: 'POST', body: JSON.stringify(data) }),
  updateNotice: (id: string, data: any) =>
    request<any>(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteNotice: (id: string) =>
    request<{ message: string }>(`/notices/${id}`, { method: 'DELETE' }),
};
