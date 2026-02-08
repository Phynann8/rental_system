
export type Status = 'Active' | 'Inactive' | 'Pending' | 'Maintenance' | 'Overdue' | 'Paid' | 'Unpaid' | 'Former';

export interface Building {
  id: string;
  name: string;
  address: string;
  rooms: number;
  status: Status;
  image: string;
}

export interface Room {
  id: string;
  building: string;
  floor: string;
  type: string;
  rent: number;
  status: 'Occupied' | 'Vacant' | 'Maintenance';
  tenant?: string;
  leaseEnd?: string;
  issue?: string;
  overdue?: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  room: string;
  leaseExpiry: string;
  status: 'Active' | 'Pending' | 'Former';
  image?: string;
}

export interface Invoice {
  id: string;
  tenant: string;
  phone: string;
  room: string;
  status: 'Paid' | 'Unpaid' | 'Overdue';
  dueDate: string;
  amount: number;
  initials: string;
}
