import type {
  AuthSession,
  Building,
  BuildingComparison,
  CreateLeaseRequest,
  DashboardResponse,
  GenerateInvoicesRequest,
  GenerateInvoicesResponse,
  Invoice,
  InvoiceDetail,
  InvoiceListResponse,
  Lease,
  LeaseOptionsResponse,
  RecordPaymentRequest,
  Room,
  RoomLookupResponse,
  RoomReading,
  SaveReadingsRequest,
  Tenant,
  UpsertBuildingRequest,
  UpsertRoomRequest,
  UpsertTenantRequest,
  TenantDocument,
  RevenueReportResponse,
  OccupancyReportResponse,
  OutstandingReportResponse,
  SystemSetting,
  AppNotification,
  AuditLog,
  MaintenanceTicket,
  UpsertMaintenanceRequest,
  UpdateMaintenanceRequest,
  TenantDashboard,
  TenantInvoice,
  VerifyPaymentRequest,
  SetupLinkRequest,
  CompleteSetupRequest,
  RegisterRequest,

  AiIntelligencePayload,
} from '../types';

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export const onUnauthorized = (handler: UnauthorizedHandler) => {
  unauthorizedHandler = handler;
};

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(path, {
    credentials: 'same-origin',
    ...init,
    headers,
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const payload = await response.json();
      if (payload?.message) {
        message = payload.message;
      }
    } catch {
      // Ignore parse errors and keep the fallback message.
    }

    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(username: string, password: string, rememberMe = false) {
    return request<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, rememberMe }),
    });
  },

  register(payload: RegisterRequest) {
    return request<AuthSession>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getSession() {
    return request<AuthSession>('/api/auth/me');
  },

  logout() {
    return request<void>('/api/auth/logout', { method: 'POST' });
  },

  getDashboard() {
    return request<DashboardResponse>('/api/dashboard');
  },

  getBuildingComparisons() {
    return request<BuildingComparison[]>('/api/dashboard/buildings');
  },

  getBuildings() {
    return request<Building[]>('/api/buildings');
  },

  createBuilding(payload: UpsertBuildingRequest) {
    return request<Building>('/api/buildings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateBuilding(id: number, payload: UpsertBuildingRequest) {
    return request<Building>(`/api/buildings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getTenants() {
    return request<Tenant[]>('/api/tenants');
  },

  createTenant(payload: UpsertTenantRequest) {
    return request<Tenant>('/api/tenants', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateTenant(id: number, payload: UpsertTenantRequest) {
    return request<Tenant>(`/api/tenants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getTenantDocuments(tenantId: number) {
    return request<TenantDocument[]>(`/api/tenants/${tenantId}/documents`);
  },

  uploadTenantDocument(tenantId: number, formData: FormData) {
    return request<TenantDocument>(`/api/tenants/${tenantId}/documents/upload`, {
      method: 'POST',
      body: formData,
      // Note: We don't set Content-Type header here because fetch will set it correctly with the boundary for FormData.
    });
  },

  deleteTenantDocument(tenantId: number, documentId: number) {
    return request<void>(`/api/tenants/${tenantId}/documents/${documentId}`, {
      method: 'DELETE',
    });
  },

  getRooms() {
    return request<Room[]>('/api/rooms');
  },

  getRoomLookups() {
    return request<RoomLookupResponse>('/api/rooms/lookups');
  },

  createRoom(payload: UpsertRoomRequest) {
    return request<Room>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateRoom(id: number, payload: UpsertRoomRequest) {
    return request<Room>(`/api/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getLeaseOptions() {
    return request<LeaseOptionsResponse>('/api/leases/options');
  },

  createLease(payload: CreateLeaseRequest) {
    return request<Lease>('/api/leases', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getReadings(buildingId: number) {
    return request<RoomReading[]>(`/api/readings/${buildingId}`);
  },

  saveReadings(payload: SaveReadingsRequest) {
    return request<RoomReading[]>('/api/readings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getInvoices(year: number, month: number) {
    return request<InvoiceListResponse>(`/api/invoices?year=${year}&month=${month}`);
  },

  getInvoice(id: number) {
    return request<InvoiceDetail>(`/api/invoices/${id}`);
  },

  generateInvoices(payload: GenerateInvoicesRequest) {
    return request<GenerateInvoicesResponse>('/api/invoices/generate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  recordPayment(invoiceId: number, payload: RecordPaymentRequest) {
    return request<Invoice>(`/api/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  deleteBuilding(id: number) {
    return request<void>(`/api/buildings/${id}`, {
      method: 'DELETE',
    });
  },

  deleteRoom(id: number) {
    return request<void>(`/api/rooms/${id}`, {
      method: 'DELETE',
    });
  },

  deleteTenant(id: number) {
    return request<void>(`/api/tenants/${id}`, {
      method: 'DELETE',
    });
  },

  deleteInvoice(id: number) {
    return request<void>(`/api/invoices/${id}`, {
      method: 'DELETE',
    });
  },

  downloadInvoice(id: number) {
    window.open(`/api/invoices/${id}/download`, '_blank');
  },

  exportInvoices(year: number, month: number) {
    window.open(`/api/invoices/export?year=${year}&month=${month}`, '_blank');
  },

  getRevenueReport(year?: number) {
    const query = year ? `?year=${year}` : '';
    return request<RevenueReportResponse>(`/api/reports/revenue${query}`);
  },

  getOccupancyReport() {
    return request<OccupancyReportResponse>('/api/reports/occupancy');
  },

  getOutstandingReport() {
    return request<OutstandingReportResponse>('/api/reports/outstanding');
  },

  getSettings() {
    return request<SystemSetting>('/api/settings');
  },

  updateSettings(payload: SystemSetting) {
    return request<SystemSetting>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  getNotifications(unreadOnly: boolean = false) {
    return request<AppNotification[]>(`/api/notifications?unreadOnly=${unreadOnly}`);
  },

  markNotificationAsRead(id: number) {
    return request<void>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllNotificationsAsRead() {
    return request<void>('/api/notifications/read-all', {
      method: 'PUT',
    });
  },

  getAuditLogs(entityName?: string, entityId?: string, limit: number = 100) {
    const params = new URLSearchParams();
    if (entityName) params.append('entityName', entityName);
    if (entityId) params.append('entityId', entityId);
    if (limit) params.append('limit', limit.toString());
    
    const query = params.toString();
    return request<AuditLog[]>(`/api/audit-logs${query ? `?${query}` : ''}`);
  },

  getMaintenanceTickets(buildingId?: number, status?: string) {
    const params = new URLSearchParams();
    if (buildingId) params.append('buildingId', buildingId.toString());
    if (status) params.append('status', status);
    const query = params.toString();
    return request<MaintenanceTicket[]>(`/api/maintenance${query ? `?${query}` : ''}`);
  },

  getMaintenanceTicket(id: number) {
    return request<MaintenanceTicket>(`/api/maintenance/${id}`);
  },

  createMaintenanceTicket(payload: UpsertMaintenanceRequest) {
    return request<MaintenanceTicket>('/api/maintenance', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateMaintenanceTicket(id: number, payload: UpdateMaintenanceRequest) {
    return request<MaintenanceTicket>(`/api/maintenance/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteMaintenanceTicket(id: number) {
    return request<void>(`/api/maintenance/${id}`, {
      method: 'DELETE',
    });
  },

  // Auth Portal Methods
  createSetupLink(tenantId: number, payload: SetupLinkRequest) {
    return request<{ token: string }>(`/api/auth/tenants/${tenantId}/setup-link`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  completeSetup(payload: CompleteSetupRequest) {
    return request<{ message: string }>('/api/auth/setup-complete', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Payment Verification
  verifyPayment(paymentId: number, payload: VerifyPaymentRequest) {
    return request<{ message: string }>(`/api/invoices/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Tenant Portal Methods
  getPortalDashboard() {
    return request<TenantDashboard>('/api/portal/dashboard');
  },

  getPortalInvoices() {
    return request<TenantInvoice[]>('/api/portal/invoices');
  },

  submitPortalPayment(formData: FormData) {
    return request<{ message: string }>('/api/portal/payments', {
      method: 'POST',
      body: formData,
    });
  },

  getIntelligenceData() {
    return request<AiIntelligencePayload>('/api/ai/intelligence-data');
  },

  // Billing / Subscription Methods
  getBillingOverview() {
    return request<any>('/api/billing/overview');
  },

  getBillingHistory() {
    return request<any[]>('/api/billing/history');
  },

  changeBillingPlan(newTier: string, testCardNumber?: string) {
    return request<{ message: string }>('/api/billing/change-plan', {
      method: 'POST',
      body: JSON.stringify({ newTier, testCardNumber }),
    });
  },

  simulateBillingPayment(testCardNumber?: string) {
    return request<{ message: string; transactionId?: string; cardLast4?: string }>('/api/billing/pay', {
      method: 'POST',
      body: JSON.stringify({ testCardNumber }),
    });
  },

  cancelBillingSubscription() {
    return request<{ message: string }>('/api/billing/cancel', { method: 'POST' });
  },
};
