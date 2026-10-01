export type UserRole = 'owner' | 'resident';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
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

export interface Bed {
  id: string;
  roomId: string;
  bedNumber: number;
  status: BedStatus;
  residentId?: string | null;
  resident?: {
    id: string;
    fullName: string;
    mobileNumber: string;
    profilePhoto?: string;
  } | null;
  createdAt: string;
}

export interface Room {
  id: string;
  roomNumber: string;
  floor: number;
  roomType: RoomType;
  totalBeds: number;
  monthlyRent: number;
  amenities: string[];
  notes?: string;
  beds?: Bed[];
  occupiedBeds?: number;
  availableBeds?: number;
  createdAt: string;
  updatedAt: string;
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
  roomNumber?: string;
  floor?: number;
  roomType?: string;
  bedNumber?: number;
  totalPending?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'Cash' | 'UPI/Online' | 'Bank Transfer' | 'Cheque' | 'Card';
export type PaymentStatus = 'Paid' | 'Pending' | 'Partial';

export interface Payment {
  id: string;
  residentId: string;
  residentName?: string;
  residentPhone?: string;
  roomId: string;
  roomNumber?: string;
  floor?: number;
  monthYear: string;
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
export type ComplaintCategory = 'plumbing' | 'electrical' | 'wi-fi' | 'cleanliness' | 'furniture' | 'food' | 'noise' | 'other' | string;

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
  residentName?: string;
  residentPhone?: string;
  roomId: string;
  roomNumber?: string;
  floor?: number;
  title: string;
  description: string;
  category: string;
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
  targetAudience: string;
  priority: NoticePriority;
  isPinned: boolean;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerDashboardStats {
  totalRooms: number;
  totalBeds: number;
  occupiedBeds: number;
  availableBeds: number;
  maintenanceBeds: number;
  totalResidents: number;
  monthlyCollectedFees: number;
  pendingFees: number;
  pendingComplaints: number;
  inProgressComplaints: number;
  resolvedComplaints: number;
  occupancyRate: number;
}

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  monthYear: string;
  amountDue: number;
  amountPaid: number;
  remainingAmount: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  notes: string;
  hostel: {
    name: string;
    address: string;
    phone: string;
    adminName: string;
  };
  resident: {
    name: string;
    phone: string;
    roomNumber: string;
    bedNumber: number;
    idNumber: string;
  };
}
