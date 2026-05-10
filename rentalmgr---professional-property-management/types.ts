
export type BuildingStatus = 'Active' | 'Inactive' | 'Maintenance';
export type TenantStatus = 'Active' | 'Pending' | 'Former';
export type RoomStatus = 'Occupied' | 'Vacant' | 'Maintenance';
export type InvoiceStatus = 'Paid' | 'Unpaid' | 'Overdue';
export type PaymentMethod = 'Cash' | 'BankTransfer' | 'QRCode';
export type AppRole = 'Admin' | 'Manager' | 'Billing' | 'Tenant';

export interface AuthSession {
  userId: string;
  username: string;
  email: string;
  displayName: string;
  roles: AppRole[];
  sessionId: string;
  sessionExpiresAtUtc: string;
}

export interface Lookup {
  id: number;
  name: string;
}

export interface RoomTypeLookup extends Lookup {
  basePrice: number;
}

export interface Building {
  id: number;
  name: string;
  address: string;
  rooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  status: BuildingStatus;
  waterUnitPrice: number;
  electricUnitPrice: number;
  image: string;
}

export interface UpsertBuildingRequest {
  name: string;
  address: string;
  waterUnitPrice: number;
  electricUnitPrice: number;
}

export interface Tenant {
  id: number;
  name: string;
  phone: string;
  nationalId: string;
  hometown: string;
  room: string;
  leaseExpiry: string;
  status: TenantStatus;
  image: string;
}

export interface UpsertTenantRequest {
  name: string;
  phone: string;
  nationalId: string;
  hometown: string;
}

export interface Room {
  id: number;
  buildingId: number;
  roomTypeId: number;
  roomNumber: string;
  building: string;
  floor: number;
  type: string;
  rent: number;
  status: RoomStatus;
  tenant?: string | null;
  leaseEnd?: string | null;
  overdue: boolean;
}

export interface RoomLookupResponse {
  buildings: Lookup[];
  roomTypes: RoomTypeLookup[];
}

export interface UpsertRoomRequest {
  buildingId: number;
  roomTypeId: number;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
}

export interface LeaseRoomOption {
  id: number;
  buildingId: number;
  building: string;
  roomNumber: string;
  roomType: string;
  basePrice: number;
}

export interface LeaseOptionsResponse {
  tenants: Lookup[];
  rooms: LeaseRoomOption[];
}

export interface CreateLeaseRequest {
  tenantId: number;
  roomId: number;
  startDate: string;
  endDate: string;
  rentPrice: number;
  depositAmount: number;
}

export interface BaseLease {
  id: number;
  roomNumber: string;
  startDate: string;
  endDate?: string | null;
  rentPrice: number;
}

export interface Lease extends BaseLease {
  tenantId: number;
  tenantName: string;
  roomId: number;
  building: string;
  depositAmount: number;
  status: string;
}

export interface TenantDocument {
  id: number;
  title: string;
  type: string;
  contentType: string;
  size: number;
  uploadedAt: string;
}


export interface RoomReading {
  roomId: number;
  roomNumber: string;
  roomType: string;
  oldWater: number;
  newWater: number;
  oldElectric: number;
  newElectric: number;
}

export interface SaveReadingsRequest {
  buildingId: number;
  rooms: Array<{
    roomId: number;
    newWater: number;
    newElectric: number;
  }>;
}

export interface RevenuePoint {
  name: string;
  value: number;
}

export interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  at: string;
}

export interface BuildingComparison {
  id: number;
  name: string;
  address: string;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  activeTenants: number;
  collectedThisMonth: number;
  projectedRevenue: number;
  outstandingBalance: number;
  image: string;
}

export interface DashboardResponse {
  totalBuildings: number;
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  activeTenants: number;
  unpaidCount: number;
  unpaidAmount: number;
  projectedRevenue: number;
  collectedThisMonth: number;
  revenue: RevenuePoint[];
  activity: ActivityItem[];
}

export interface BaseInvoice {
  id: number;
  date: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: string;
}

export interface Invoice extends BaseInvoice {
  contractId: number;
  tenant: string;
  phone: string;
  room: string;
  building: string;
  status: InvoiceStatus;
  initials: string;
  hasUnverifiedPayments: boolean;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface InvoiceDetail {
  id: number;
  tenantName: string;
  tenantId: string;
  phone: string;
  roomNumber: string;
  buildingName: string;
  buildingAddress: string;
  status: InvoiceStatus;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  items: InvoiceItem[];
  payments: PaymentDetail[];
}

export interface PaymentDetail {
  id: number;
  amount: number;
  date: string;
  method: string;
  isVerified: boolean;
  receiptPath?: string;
  tenantNotes?: string;
  verificationNotes?: string;
}

export interface InvoiceSummary {
  totalInvoiced: number;
  collected: number;
  pending: number;
  overdue: number;
  pendingCount: number;
  overdueCount: number;
}

export interface InvoiceListResponse {
  year: number;
  month: number;
  summary: InvoiceSummary;
  buildings: Lookup[];
  invoices: Invoice[];
}

export interface GenerateInvoicesRequest {
  buildingId: number;
  dueInDays: number;
  invoiceDate?: string;
}

export interface GenerateInvoicesResponse {
  generated: number;
  skipped: number;
  invoiceDate: string;
  buildingId: number;
}

export interface RecordPaymentRequest {
  amount: number;
  date?: string;
  method: PaymentMethod;
}

export interface RevenueReportResponse {
  totalYtd: number;
  rentalIncome: number;
  utilityIncome: number;
  monthly: RevenuePoint[];
}

export interface HistoricalOccupancy {
  name: string;
  rate: number;
}

export interface OccupancyReportResponse {
  currentRate: number;
  historical: HistoricalOccupancy[];
}

export interface OutstandingByBuilding {
  building: string;
  amount: number;
}

export interface OutstandingReportResponse {
  totalOutstanding: number;
  byBuilding: OutstandingByBuilding[];
}

export interface SystemSetting {
  companyName: string;
  currencySymbol: string;
  defaultInvoiceDueDays: number;
  defaultElectricityRate: number;
  defaultWaterRate: number;
  exchangeRateUsdToKhr: number;
}

export interface AppNotification {
  id: number;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Success' | 'Error';
  isRead: boolean;
  createdAtUtc: string;
  linkUri?: string;
}

export interface AuditLog {
  id: number;
  userId?: string;
  username?: string;
  action: string;
  entityName: string;
  entityId: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  timestampUtc: string;
}

export type MaintenanceStatus = 'Open' | 'InProgress' | 'Resolved' | 'Cancelled';
export type MaintenancePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface MaintenanceTicket {
  id: number;
  roomId: number;
  roomNumber: string;
  buildingName: string;
  buildingId: number;
  tenantId?: number;
  tenantName?: string;
  title: string;
  description: string;
  status: MaintenanceStatus;
  priority: MaintenancePriority;
  createdAtUtc: string;
  resolvedAtUtc?: string;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface UpsertMaintenanceRequest {
  roomId: number;
  tenantId?: number;
  title: string;
  description: string;
  priority: MaintenancePriority;
}

export interface UpdateMaintenanceRequest {
  title: string;
  description: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  assignedTo?: string;
  resolutionNotes?: string;
}

export interface TenantLease extends BaseLease {
  buildingName: string;
}

export interface TenantDashboard {
  activeLeases: TenantLease[];
  unpaidInvoicesCount: number;
  totalBalance: number;
}

export interface TenantInvoice extends BaseInvoice {
  invoiceNumber: string;
}

export interface VerifyPaymentRequest {
  approved: boolean;
  notes?: string;
}

export interface AiRoomMetric { roomNumber: string; building: string; type: string; currentPrice: number; status: string; }
export interface AiLeaseMetric { tenant: string; room: string; endDate: string; price: number; }
export interface AiRevenueMetric { year: number; month: number; totalCollected: number; }
export interface AiUtilityMetric { room: string; type: string; value: number; date: string; }
export interface AiIntelligencePayload {
  rooms: AiRoomMetric[];
  leases: AiLeaseMetric[];
  revenue: AiRevenueMetric[];
  utilities: AiUtilityMetric[];
}

export interface SetupLinkRequest {
  email: string;
  displayName: string;
}

export interface CompleteSetupRequest {
  token: string;
  password: string;
}

export interface RegisterRequest {
  organizationName: string;
  username: string;
  email: string;
  displayName: string;
  password: string;
}
