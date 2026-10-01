export type UserRole = 'owner' | 'resident';

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerProfile {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  hostelName: string;
  address: string;
  createdAt: string;
}

export type RoomType = 'Single' | 'Double' | 'Triple' | 'Dormitory' | 'Deluxe';
export type BedStatus = 'available' | 'occupied' | 'maintenance';
export type ResidentStatus = 'active' | 'inactive' | 'transferred' | 'left';

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  totalBeds: number;
  monthlyRent: number;
  amenities: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number;
  status: BedStatus;
  residentId?: string | null;
  createdAt: string;
}

export interface Resident {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  emergencyContact: string;
  permanentAddress: string;
  city: string;
  idType: string;
  idNumber: string;
  joiningDate: string;
  roomId: string;
  bedId: string;
  monthlyRent: number;
  securityDeposit: number;
  status: ResidentStatus;
  profilePhoto?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI/Online' | 'Bank Transfer' | 'Cheque' | 'Card';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface Payment {
  id: string;
  residentId: string;
  roomId: string;
  monthYear: string; // e.g. "October 2026"
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  paymentDate?: string;
  paymentMethod?: PaymentMethod;
  status: PaymentStatus;
  receiptNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';
export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface ComplaintImage {
  id: string;
  complaintId: string;
  imageUrl: string;
  fileName: string;
  createdAt: string;
}

export interface Complaint {
  id: string;
  residentId: string;
  roomId: string;
  title: string;
  description: string;
  category: string; // Plumbing, Electrical, Wi-Fi, Food, Cleanliness, Other
  priority: ComplaintPriority;
  status: ComplaintStatus;
  ownerResponse?: string;
  responseDate?: string;
  images: ComplaintImage[];
  createdAt: string;
  updatedAt: string;
}

export type NoticePriority = 'normal' | 'high' | 'urgent';

export interface Notice {
  id: string;
  title: string;
  content: string;
  targetAudience: string; // 'all' or specific floor
  priority: NoticePriority;
  isPinned: boolean;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  owners: OwnerProfile[];
  rooms: Room[];
  beds: Bed[];
  residents: Resident[];
  payments: Payment[];
  complaints: Complaint[];
  notices: Notice[];
}
