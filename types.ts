
export enum Role {
    EMPLOYEE = 'Employee',
    INTERN = 'Intern',
    ADMIN = 'Admin',
    HR = 'HR',
    VISITOR = 'Visitor',
}

export enum LeaveType {
    CASUAL = 'Casual',
    SICK = 'Sick',
    UNPAID = 'Unpaid',
    WFH = 'WFH',
}

export enum LeaveStatus {
    PENDING = 'Pending',
    APPROVED = 'Approved',
    REJECTED = 'Rejected',
}

export enum UserStatus {
    ACTIVE = 'Active',
    INACTIVE = 'Inactive',
}

export interface User {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    password?: string;
    department: string;
    phone: string;
    emergencyPhone?: string;
    profilePhoto: string;
    role: Role;
    status: UserStatus;
    // Dates
    dob?: string; // YYYY-MM-DD
    joiningDate?: string; // YYYY-MM-DD
    // Additional Info
    position?: string;
    bloodGroup?: string;
    // Bank Details
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    accountHolderName?: string;
    accountType?: 'Savings' | 'Current' | 'Salary' | 'Other';
    // ID Documents
    aadharNumber?: string;
    panNumber?: string;
    // Document Uploads (base64 or URLs)
    aadharDocument?: string;
    panDocument?: string;
    bankDocument?: string; // Cancelled cheque or passbook
    otherDocument?: string;
    companyName?: string;
    biometricDevice?: BiometricDevice;
    biometricDevices?: BiometricDevice[];
    biometricExempt?: boolean;
}

export interface BiometricDevice {
    id?: string;                // Unique slot ID
    credentialId: string;       // WebAuthn base64 credential ID
    deviceId: string;           // Persistent unique local device token
    deviceName: string;         // e.g. "Samsung Galaxy" or "iPhone 13"
    slotIndex?: number;         // 1, 2, or 3 (Slot 1: Thumb, Slot 2: Index, Slot 3: Backup)
    slotLabel?: string;         // e.g. "Finger 1 (Thumb)", "Finger 2 (Index)", "Backup Phone"
    registeredAt: string;       // ISO timestamp
    status: 'pending_approval' | 'approved' | 'rejected';
    approvedBy?: string;        // Admin user ID
    approvedAt?: string;        // ISO timestamp
    lastUsedAt?: string;
}

export interface BiometricSettings {
    enabled: boolean;               // Master toggle: Require biometric for attendance
    verificationMode?: 'location_only' | 'location_and_biometric';
    autoApproveFirstDevice: boolean; // Auto-approve the 1st phone registered by employee
}

export interface Session {
    id: string;
    checkIn: string; // HH:mm:ss
    checkOut: string | null; // HH:mm:ss
    autoCheckedOut?: boolean;
    isManuallyEdited?: boolean;
    biometricVerified?: boolean;
    deviceId?: string;
    isWFH?: boolean;
    wfhStatus?: 'approved' | 'pending';
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
    checkOutLocation?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
    };
}

export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    sessions: Session[];
    totalHours: number;
    isWFH?: boolean;
    wfhStatus?: 'approved' | 'pending';
    isManuallyEdited?: boolean;
}

export interface LeaveRequest {
    id: string;
    userId: string;
    leaveType: LeaveType;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    reason: string;
    status: LeaveStatus;
    duration?: 'Full Day' | 'Half Day';
    halfDayType?: 'Morning' | 'Afternoon';
    statusReason?: string;
    createdAt?: any;
}

export interface Message {
    id: string;
    title: string;
    content: string;
    timestamp: any;
    recipient: string | string[];
    senderId?: string;
    senderName?: string;
}

export interface Holiday {
    id: string;
    date: string; // YYYY-MM-DD
    name: string;
    description?: string;
    type: 'National' | 'Company' | 'Other';
}

export interface ResearchResource {
    id: string;
    title: string;
    description: string;
    url?: string;
    category?: string;
    date: string; // YYYY-MM-DD
    addedBy?: string; // userId
    authorName?: string;
}

export enum LeadStatus {
    PENDING = 'Pending',
    ONGOING = 'Ongoing',
    COMPLETED = 'Completed',
    ON_HOLD = 'On Hold',
    PROPOSAL_SENT = 'Proposal Sent',
    DISPOSED = 'Disposed',
}

export enum ActivityType {
    TASK = 'Task',
    CALL = 'Call',
    MEETING = 'Meeting',
    EMAIL = 'Email',
    NOTE = 'Note'
}

export enum ClientType {
    B2B = 'B2B',
    REFERRAL = 'Referral',
    FRIEND = 'Friend',
    SALES = 'Sales',
    OTHER = 'Other',
}

export enum LeadCategory {
    COMPANY = 'Company',
    RAW_SCRAPED = 'Raw / Scraped',
}

export interface Lead {
    id: string;
    slNo: string;
    category?: LeadCategory;
    projectName: string;
    firstStartDate: string; // YYYY-MM-DD
    workCommencementDate?: string; // YYYY-MM-DD
    status: LeadStatus;
    
    // Point of Contact
    pocName: string;
    pocEmail: string;
    pocPhone: string;
    
    // Client Details
    clientName: string;
    clientPhone: string;
    clientEmail: string;
    clientType: ClientType;
    clientTypeDetail?: string; // Company Name (B2B), Friend Name (Friend), Referrer Name (Referral), Sales Person (Sales), or Reference Detail
    
    department: string[];
    domainDetail: string;
    expiryDate?: string; // YYYY-MM-DD
    remark: string;
    assignedTo?: string; // User ID of the assigned Sales member
    
    // DNS/SSL Health Check Fields
    dnsStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslDaysLeft?: number;
    healthError?: string;
    lastChecked?: string;
    lastEmailed?: string;

    createdAt?: any;
    updatedAt?: any;
}

export interface LeadActivity {
    id: string;
    leadId: string;
    type: ActivityType;
    title: string;
    description: string;
    scheduledAt: string; // ISO String or YYYY-MM-DDTHH:mm
    completed: boolean;
    createdAt?: any;
}

export interface CustomDomain {
    id: string;
    projectName: string;
    domainDetail: string;
    expiryDate: string; // YYYY-MM-DD
    pocName?: string;
    pocEmail?: string;
    pocPhone?: string;
    remark?: string;
    
    // DNS/SSL Health Check Fields
    dnsStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslStatus?: 'Healthy' | 'Issue Detected' | 'Pending';
    sslDaysLeft?: number;
    healthError?: string;
    lastChecked?: string;
    lastEmailed?: string;

    createdAt?: any;
    updatedAt?: any;
}

