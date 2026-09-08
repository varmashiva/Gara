import { api } from '@/api/axios';

export type SellerApplication = {
  _id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
};

export type AdminProduct = {
  _id: string;
  name: string;
  price: number;
  status: string;
  sellerId: string;
  createdAt: string;
};

export type AdminReturn = {
  _id: string;
  orderId: string;
  productId: string;
  reason: string;
  status: string;
  requestedAt: string;
};

export async function fetchApplications(status?: string) {
  const res = await api.get<{ success: true; data: SellerApplication[] }>('/admin/sellers/applications', {
    params: status ? { status } : undefined,
  });
  return res.data.data;
}

export async function decideApplication(id: string, decision: 'APPROVED' | 'REJECTED', reviewNotes?: string) {
  const res = await api.patch(`/admin/sellers/applications/${id}`, { decision, reviewNotes });
  return res.data.data;
}

export async function fetchAdminProducts(status?: string) {
  const res = await api.get<{ success: true; data: AdminProduct[] }>('/admin/products', {
    params: status ? { status } : undefined,
  });
  return res.data.data;
}

export async function decideProduct(id: string, decision: 'APPROVED' | 'REJECTED', reviewNotes?: string) {
  const res = await api.patch(`/admin/products/${id}/status`, { decision, reviewNotes });
  return res.data.data;
}

export async function fetchAdminReturns() {
  const res = await api.get<{ success: true; data: AdminReturn[] }>('/admin/returns');
  return res.data.data;
}

export async function decideReturn(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string) {
  const res = await api.patch(`/admin/returns/${id}/decision`, { decision, notes });
  return res.data.data;
}
