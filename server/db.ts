import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
  DatabaseSchema,
  User,
  OwnerProfile,
  Room,
  Bed,
  Resident,
  Payment,
  Complaint,
  Notice,
  ComplaintImage,
} from './types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hostel.json');

function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

class Database {
  private data: DatabaseSchema = {
    users: [],
    owners: [],
    rooms: [],
    beds: [],
    residents: [],
    payments: [],
    complaints: [],
    notices: [],
  };

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const content = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(content);
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading database, initializing with seed data:', err);
      this.seedInitialData();
      this.save();
    }
  }

  public save() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to save database to disk:', err);
    }
  }

  public resetToSeed() {
    this.seedInitialData();
    this.save();
  }

  private seedInitialData() {
    const adminPass = hashPassword('admin123');
    const resPass = hashPassword('resident123');

    const adminUser: User = {
      id: 'usr_admin_1',
      username: 'admin',
      email: 'admin@hostel.com',
      passwordHash: adminPass.hash,
      salt: adminPass.salt,
      role: 'owner',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-08-01T09:00:00.000Z',
    };

    const rahulUser: User = {
      id: 'usr_res_1',
      username: 'rahul_sharma',
      email: 'rahul@hostel.com',
      passwordHash: resPass.hash,
      salt: resPass.salt,
      role: 'resident',
      createdAt: '2026-08-10T10:00:00.000Z',
      updatedAt: '2026-08-10T10:00:00.000Z',
    };

    const priyaUser: User = {
      id: 'usr_res_2',
      username: 'priya_patel',
      email: 'priya@hostel.com',
      passwordHash: resPass.hash,
      salt: resPass.salt,
      role: 'resident',
      createdAt: '2026-08-15T11:00:00.000Z',
      updatedAt: '2026-08-15T11:00:00.000Z',
    };

    const amitUser: User = {
      id: 'usr_res_3',
      username: 'amit_verma',
      email: 'amit@hostel.com',
      passwordHash: resPass.hash,
      salt: resPass.salt,
      role: 'resident',
      createdAt: '2026-08-20T12:00:00.000Z',
      updatedAt: '2026-08-20T12:00:00.000Z',
    };

    const ownerProfile: OwnerProfile = {
      id: 'own_1',
      userId: adminUser.id,
      fullName: 'Vikramaditya Singhania',
      phone: '+1 (555) 234-5678',
      hostelName: 'Grand Oak Residency & PG',
      address: '742 Evergreen Terrace, Sector 4, University District',
      createdAt: '2026-08-01T09:00:00.000Z',
    };

    const rooms: Room[] = [
      {
        id: 'rm_101',
        roomNumber: '101',
        floor: 1,
        roomType: 'Double',
        totalBeds: 2,
        monthlyRent: 400,
        amenities: ['Air Conditioning', 'Attached Bathroom', 'High-Speed Wi-Fi', 'Study Desks'],
        notes: 'East facing with morning natural light',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'rm_102',
        roomNumber: '102',
        floor: 1,
        roomType: 'Triple',
        totalBeds: 3,
        monthlyRent: 320,
        amenities: ['Ceiling Fan', 'Attached Bathroom', 'Wi-Fi', 'Lockers'],
        notes: 'Spacious balcony access',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'rm_201',
        roomNumber: '201',
        floor: 2,
        roomType: 'Single',
        totalBeds: 1,
        monthlyRent: 600,
        amenities: ['Air Conditioning', 'Private Bathroom', 'Mini Fridge', 'Smart TV', 'Wi-Fi'],
        notes: 'Executive single studio',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'rm_202',
        roomNumber: '202',
        floor: 2,
        roomType: 'Double',
        totalBeds: 2,
        monthlyRent: 420,
        amenities: ['Air Conditioning', 'Attached Bathroom', 'Wi-Fi', 'Wardrobes'],
        notes: 'Quiet corner room',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
      {
        id: 'rm_301',
        roomNumber: '301',
        floor: 3,
        roomType: 'Deluxe',
        totalBeds: 2,
        monthlyRent: 500,
        amenities: ['Air Conditioning', 'Ensuite Bathroom', 'Balcony', 'Geyser', 'Wi-Fi'],
        notes: 'Top floor scenic view',
        createdAt: '2026-08-01T10:00:00.000Z',
        updatedAt: '2026-08-01T10:00:00.000Z',
      },
    ];

    const beds: Bed[] = [
      { id: 'bed_101_1', roomId: 'rm_101', bedNumber: 1, status: 'occupied', residentId: 'res_1', createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_101_2', roomId: 'rm_101', bedNumber: 2, status: 'occupied', residentId: 'res_3', createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_102_1', roomId: 'rm_102', bedNumber: 1, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_102_2', roomId: 'rm_102', bedNumber: 2, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_102_3', roomId: 'rm_102', bedNumber: 3, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_201_1', roomId: 'rm_201', bedNumber: 1, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_202_1', roomId: 'rm_202', bedNumber: 1, status: 'occupied', residentId: 'res_2', createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_202_2', roomId: 'rm_202', bedNumber: 2, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_301_1', roomId: 'rm_301', bedNumber: 1, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
      { id: 'bed_301_2', roomId: 'rm_301', bedNumber: 2, status: 'available', residentId: null, createdAt: '2026-08-01T10:00:00.000Z' },
    ];

    const residents: Resident[] = [
      {
        id: 'res_1',
        userId: rahulUser.id,
        fullName: 'Rahul Sharma',
        email: 'rahul@hostel.com',
        mobileNumber: '+1 (555) 987-6543',
        emergencyContact: '+1 (555) 432-1098 (Father - Rajesh Sharma)',
        permanentAddress: '14 B, Lakeview Heights, Civil Lines',
        city: 'Jaipur',
        idType: 'National ID / Passport',
        idNumber: 'A9823412X',
        joiningDate: '2026-08-10',
        roomId: 'rm_101',
        bedId: 'bed_101_1',
        monthlyRent: 400,
        securityDeposit: 800,
        status: 'active',
        profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        notes: 'Engineering graduate student at Tech Campus',
        createdAt: '2026-08-10T10:00:00.000Z',
        updatedAt: '2026-08-10T10:00:00.000Z',
      },
      {
        id: 'res_2',
        userId: priyaUser.id,
        fullName: 'Priya Patel',
        email: 'priya@hostel.com',
        mobileNumber: '+1 (555) 765-4321',
        emergencyContact: '+1 (555) 321-0987 (Mother - Sunita Patel)',
        permanentAddress: '42 Orchid Boulevard, Green Park',
        city: 'Ahmedabad',
        idType: "Driver's License",
        idNumber: 'DL-88392019',
        joiningDate: '2026-08-15',
        roomId: 'rm_202',
        bedId: 'bed_202_1',
        monthlyRent: 420,
        securityDeposit: 840,
        status: 'active',
        profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        notes: 'Software engineer interning nearby',
        createdAt: '2026-08-15T11:00:00.000Z',
        updatedAt: '2026-08-15T11:00:00.000Z',
      },
      {
        id: 'res_3',
        userId: amitUser.id,
        fullName: 'Amit Verma',
        email: 'amit@hostel.com',
        mobileNumber: '+1 (555) 654-3210',
        emergencyContact: '+1 (555) 210-9876 (Brother - Sunil Verma)',
        permanentAddress: '88 Rose Garden Street, Sector 12',
        city: 'Chandigarh',
        idType: 'Aadhar / Resident Card',
        idNumber: 'RC-99210042',
        joiningDate: '2026-08-20',
        roomId: 'rm_101',
        bedId: 'bed_101_2',
        monthlyRent: 400,
        securityDeposit: 800,
        status: 'active',
        profilePhoto: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
        notes: 'Medical research intern',
        createdAt: '2026-08-20T12:00:00.000Z',
        updatedAt: '2026-08-20T12:00:00.000Z',
      },
    ];

    const payments: Payment[] = [
      {
        id: 'pay_1',
        residentId: 'res_1',
        roomId: 'rm_101',
        monthYear: 'August 2026',
        amountDue: 400,
        amountPaid: 400,
        remainingAmount: 0,
        paymentDate: '2026-08-10',
        paymentMethod: 'UPI/Online',
        status: 'Paid',
        receiptNumber: 'RCP-2026-0801',
        notes: 'August rent paid on arrival',
        createdAt: '2026-08-10T10:30:00.000Z',
        updatedAt: '2026-08-10T10:30:00.000Z',
      },
      {
        id: 'pay_2',
        residentId: 'res_1',
        roomId: 'rm_101',
        monthYear: 'September 2026',
        amountDue: 400,
        amountPaid: 400,
        remainingAmount: 0,
        paymentDate: '2026-09-02',
        paymentMethod: 'Bank Transfer',
        status: 'Paid',
        receiptNumber: 'RCP-2026-0901',
        notes: 'September monthly rent received',
        createdAt: '2026-09-02T14:15:00.000Z',
        updatedAt: '2026-09-02T14:15:00.000Z',
      },
      {
        id: 'pay_3',
        residentId: 'res_2',
        roomId: 'rm_202',
        monthYear: 'August 2026',
        amountDue: 420,
        amountPaid: 420,
        remainingAmount: 0,
        paymentDate: '2026-08-15',
        paymentMethod: 'Card',
        status: 'Paid',
        receiptNumber: 'RCP-2026-0802',
        notes: 'Paid via card terminal',
        createdAt: '2026-08-15T11:45:00.000Z',
        updatedAt: '2026-08-15T11:45:00.000Z',
      },
      {
        id: 'pay_4',
        residentId: 'res_2',
        roomId: 'rm_202',
        monthYear: 'September 2026',
        amountDue: 420,
        amountPaid: 200,
        remainingAmount: 220,
        paymentDate: '2026-09-05',
        paymentMethod: 'UPI/Online',
        status: 'Partial',
        receiptNumber: 'RCP-2026-0902',
        notes: 'Partial payment made, balance due by Sept 15',
        createdAt: '2026-09-05T16:20:00.000Z',
        updatedAt: '2026-09-05T16:20:00.000Z',
      },
      {
        id: 'pay_5',
        residentId: 'res_3',
        roomId: 'rm_101',
        monthYear: 'September 2026',
        amountDue: 400,
        amountPaid: 0,
        remainingAmount: 400,
        status: 'Pending',
        receiptNumber: 'RCP-2026-0903',
        notes: 'Pending rent payment for current month',
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z',
      },
    ];

    const complaints: Complaint[] = [
      {
        id: 'cmp_1',
        residentId: 'res_1',
        roomId: 'rm_101',
        title: 'Geyser heating element not working in bathroom',
        description: 'Water is lukewarm even after switching on the heater for 30 minutes. Please send a technician to inspect.',
        category: 'Plumbing',
        priority: 'High',
        status: 'In Progress',
        ownerResponse: 'Plumber has been scheduled for inspection tomorrow morning between 10 AM and 12 PM.',
        responseDate: '2026-09-08T15:30:00.000Z',
        images: [
          {
            id: 'img_1',
            complaintId: 'cmp_1',
            imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600&auto=format&fit=crop&q=80',
            fileName: 'geyser_switch.jpg',
            createdAt: '2026-09-08T11:20:00.000Z',
          },
        ],
        createdAt: '2026-09-08T11:20:00.000Z',
        updatedAt: '2026-09-08T15:30:00.000Z',
      },
      {
        id: 'cmp_2',
        residentId: 'res_2',
        roomId: 'rm_202',
        title: '2nd Floor Wi-Fi router frequent dropouts',
        description: 'Wi-Fi connection keeps dropping every 15 minutes especially during peak evening hours (8 PM - 11 PM).',
        category: 'Wi-Fi',
        priority: 'Medium',
        status: 'Pending',
        images: [],
        createdAt: '2026-09-09T18:45:00.000Z',
        updatedAt: '2026-09-09T18:45:00.000Z',
      },
      {
        id: 'cmp_3',
        residentId: 'res_3',
        roomId: 'rm_101',
        title: 'Ceiling fan making clicking sound',
        description: 'The fan bearing produces a loud clicking sound on speed setting 3 and 4. Fixed immediately by electrician.',
        category: 'Electrical',
        priority: 'Low',
        status: 'Resolved',
        ownerResponse: 'Electrician replaced the fan regulator and lubricated the motor bearing on Sept 4th.',
        responseDate: '2026-09-04T17:00:00.000Z',
        images: [],
        createdAt: '2026-09-03T10:15:00.000Z',
        updatedAt: '2026-09-04T17:00:00.000Z',
      },
    ];

    const notices: Notice[] = [
      {
        id: 'not_1',
        title: 'Hostel High-Speed Fiber Upgrade Notice',
        content: 'We are upgrading our hostel internet to a 1 Gbps dedicated enterprise optical fiber connection on Saturday, Sept 12 between 2:00 PM and 5:00 PM. Brief 15-minute connection fluctuations may occur during router changeovers.',
        targetAudience: 'all',
        priority: 'high',
        isPinned: true,
        authorName: 'Vikramaditya Singhania (Hostel Warden)',
        createdAt: '2026-09-07T08:00:00.000Z',
        updatedAt: '2026-09-07T08:00:00.000Z',
      },
      {
        id: 'not_2',
        title: 'Main Gate Curfew & Visitor Entry Guidelines',
        content: 'Kindly note that hostel main gates are secured at 10:30 PM daily. All external visitors must register at the reception desk with valid government photo ID and depart by 8:00 PM.',
        targetAudience: 'all',
        priority: 'normal',
        isPinned: true,
        authorName: 'Management Office',
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z',
      },
      {
        id: 'not_3',
        title: 'Monthly Water Tank Deep Cleaning & Sanitation',
        content: 'Overhead water tank sterilization and solar water heating filter maintenance will take place on Wednesday morning 9:00 AM - 1:00 PM. Please store sufficient drinking and utility water in advance.',
        targetAudience: 'all',
        priority: 'urgent',
        isPinned: false,
        authorName: 'Hostel Operations',
        createdAt: '2026-09-08T14:00:00.000Z',
        updatedAt: '2026-09-08T14:00:00.000Z',
      },
    ];

    this.data = {
      users: [adminUser, rahulUser, priyaUser, amitUser],
      owners: [ownerProfile],
      rooms,
      beds,
      residents,
      payments,
      complaints,
      notices,
    };
  }

  // --- User Queries ---
  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByUsername(username: string): User | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }

  public createUser(user: User): User {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.findUserById(id);
    if (!user) return undefined;
    Object.assign(user, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return user;
  }

  // --- Owner Profile ---
  public getOwnerProfile(): OwnerProfile | undefined {
    return this.data.owners[0];
  }

  public updateOwnerProfile(updates: Partial<OwnerProfile>): OwnerProfile {
    if (this.data.owners.length === 0) {
      const newOwner: OwnerProfile = {
        id: 'own_1',
        userId: 'usr_admin_1',
        fullName: updates.fullName || 'Hostel Admin',
        phone: updates.phone || '',
        hostelName: updates.hostelName || 'My Hostel',
        address: updates.address || '',
        createdAt: new Date().toISOString(),
      };
      this.data.owners.push(newOwner);
    } else {
      Object.assign(this.data.owners[0], updates);
    }
    this.save();
    return this.data.owners[0];
  }

  // --- Rooms ---
  public getRooms(): Room[] {
    return this.data.rooms;
  }

  public getRoomById(id: string): Room | undefined {
    return this.data.rooms.find(r => r.id === id);
  }

  public getRoomByNumber(roomNumber: string): Room | undefined {
    return this.data.rooms.find(r => r.roomNumber.trim().toLowerCase() === roomNumber.trim().toLowerCase());
  }

  public createRoom(room: Room): Room {
    this.data.rooms.push(room);
    // Create corresponding beds for this room
    for (let i = 1; i <= room.totalBeds; i++) {
      const bed: Bed = {
        id: `bed_${room.id}_${i}_${Date.now()}`,
        roomId: room.id,
        bedNumber: i,
        status: 'available',
        residentId: null,
        createdAt: new Date().toISOString(),
      };
      this.data.beds.push(bed);
    }
    this.save();
    return room;
  }

  public updateRoom(id: string, updates: Partial<Room>): Room | undefined {
    const room = this.getRoomById(id);
    if (!room) return undefined;

    const oldTotalBeds = room.totalBeds;
    Object.assign(room, updates, { updatedAt: new Date().toISOString() });

    // If totalBeds increased, add new available beds
    if (updates.totalBeds && updates.totalBeds > oldTotalBeds) {
      for (let i = oldTotalBeds + 1; i <= updates.totalBeds; i++) {
        const bed: Bed = {
          id: `bed_${room.id}_${i}_${Date.now()}`,
          roomId: room.id,
          bedNumber: i,
          status: 'available',
          residentId: null,
          createdAt: new Date().toISOString(),
        };
        this.data.beds.push(bed);
      }
    }
    this.save();
    return room;
  }

  public deleteRoom(id: string): boolean {
    const index = this.data.rooms.findIndex(r => r.id === id);
    if (index === -1) return false;

    // Check if any beds have active residents
    const occupiedBed = this.data.beds.find(b => b.roomId === id && b.status === 'occupied');
    if (occupiedBed) {
      throw new Error('Cannot delete room with active residents. Please transfer or remove residents first.');
    }

    this.data.rooms.splice(index, 1);
    this.data.beds = this.data.beds.filter(b => b.roomId !== id);
    this.save();
    return true;
  }

  // --- Beds ---
  public getBeds(): Bed[] {
    return this.data.beds;
  }

  public getBedsByRoomId(roomId: string): Bed[] {
    return this.data.beds.filter(b => b.roomId === roomId).sort((a, b) => a.bedNumber - b.bedNumber);
  }

  public getBedById(id: string): Bed | undefined {
    return this.data.beds.find(b => b.id === id);
  }

  public updateBed(id: string, updates: Partial<Bed>): Bed | undefined {
    const bed = this.getBedById(id);
    if (!bed) return undefined;
    Object.assign(bed, updates);
    this.save();
    return bed;
  }

  // --- Residents ---
  public getResidents(): Resident[] {
    return this.data.residents;
  }

  public getResidentById(id: string): Resident | undefined {
    return this.data.residents.find(r => r.id === id);
  }

  public getResidentByUserId(userId: string): Resident | undefined {
    return this.data.residents.find(r => r.userId === userId);
  }

  public createResident(resident: Resident): Resident {
    this.data.residents.push(resident);
    // Mark the bed as occupied
    const bed = this.getBedById(resident.bedId);
    if (bed) {
      bed.status = 'occupied';
      bed.residentId = resident.id;
    }
    this.save();
    return resident;
  }

  public updateResident(id: string, updates: Partial<Resident>): Resident | undefined {
    const resident = this.getResidentById(id);
    if (!resident) return undefined;

    // Handle bed change if bedId or roomId is updated
    if (updates.bedId && updates.bedId !== resident.bedId) {
      // Free old bed
      const oldBed = this.getBedById(resident.bedId);
      if (oldBed) {
        oldBed.status = 'available';
        oldBed.residentId = null;
      }
      // Occupy new bed
      const newBed = this.getBedById(updates.bedId);
      if (newBed) {
        newBed.status = 'occupied';
        newBed.residentId = resident.id;
      }
    }

    Object.assign(resident, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return resident;
  }

  public removeResident(id: string): boolean {
    const resident = this.getResidentById(id);
    if (!resident) return false;

    // Free bed
    const bed = this.getBedById(resident.bedId);
    if (bed) {
      bed.status = 'available';
      bed.residentId = null;
    }

    // Change status to 'left' instead of deleting records to preserve audit trail
    resident.status = 'left';
    resident.updatedAt = new Date().toISOString();
    this.save();
    return true;
  }

  public hardDeleteResident(id: string): boolean {
    const index = this.data.residents.findIndex(r => r.id === id);
    if (index === -1) return false;

    const resident = this.data.residents[index];
    const bed = this.getBedById(resident.bedId);
    if (bed && bed.residentId === id) {
      bed.status = 'available';
      bed.residentId = null;
    }

    // Delete associated user
    this.data.users = this.data.users.filter(u => u.id !== resident.userId);
    this.data.residents.splice(index, 1);
    this.save();
    return true;
  }

  // --- Payments ---
  public getPayments(): Payment[] {
    return this.data.payments;
  }

  public getPaymentById(id: string): Payment | undefined {
    return this.data.payments.find(p => p.id === id);
  }

  public getPaymentsByResidentId(residentId: string): Payment[] {
    return this.data.payments.filter(p => p.residentId === residentId);
  }

  public createPayment(payment: Payment): Payment {
    this.data.payments.push(payment);
    this.save();
    return payment;
  }

  public updatePayment(id: string, updates: Partial<Payment>): Payment | undefined {
    const payment = this.getPaymentById(id);
    if (!payment) return undefined;
    Object.assign(payment, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return payment;
  }

  public deletePayment(id: string): boolean {
    const index = this.data.payments.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.payments.splice(index, 1);
    this.save();
    return true;
  }

  // --- Complaints ---
  public getComplaints(): Complaint[] {
    return this.data.complaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getComplaintById(id: string): Complaint | undefined {
    return this.data.complaints.find(c => c.id === id);
  }

  public getComplaintsByResidentId(residentId: string): Complaint[] {
    return this.data.complaints
      .filter(c => c.residentId === residentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createComplaint(complaint: Complaint): Complaint {
    this.data.complaints.unshift(complaint);
    this.save();
    return complaint;
  }

  public updateComplaint(id: string, updates: Partial<Complaint>): Complaint | undefined {
    const complaint = this.getComplaintById(id);
    if (!complaint) return undefined;
    Object.assign(complaint, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return complaint;
  }

  public deleteComplaint(id: string): boolean {
    const index = this.data.complaints.findIndex(c => c.id === id);
    if (index === -1) return false;
    this.data.complaints.splice(index, 1);
    this.save();
    return true;
  }

  // --- Notices ---
  public getNotices(): Notice[] {
    return this.data.notices.sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public getNoticeById(id: string): Notice | undefined {
    return this.data.notices.find(n => n.id === id);
  }

  public createNotice(notice: Notice): Notice {
    this.data.notices.unshift(notice);
    this.save();
    return notice;
  }

  public updateNotice(id: string, updates: Partial<Notice>): Notice | undefined {
    const notice = this.getNoticeById(id);
    if (!notice) return undefined;
    Object.assign(notice, updates, { updatedAt: new Date().toISOString() });
    this.save();
    return notice;
  }

  public deleteNotice(id: string): boolean {
    const index = this.data.notices.findIndex(n => n.id === id);
    if (index === -1) return false;
    this.data.notices.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new Database();
