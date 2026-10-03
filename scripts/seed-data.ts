/**
 * File: scripts/seed-data.ts
 * Purpose: Enterprise 3-Month Comprehensive Database Seeder for Hirush Global AMS
 * Seeds 3 Full Months (July, August, September, October 2026) across ALL modules:
 *  1. Multi-Department Staff & Users (Management, HR, Dev, Sales, SEO, Product, Media, Visitor) with KYC, Banking & Biometrics
 *  2. 3 Months (~92 Days) of Realistic Daily Attendance with Shifts, Overtime, WFH, Biometric Verification, and GPS Geofencing
 *  3. 3 Months of Leave Requests (Approved, Rejected, and Pending) across Casual, Sick, WFH, Full Day & Half Day
 *  4. Full Official 2026 Holidays Calendar (National & Company)
 *  5. 3 Months of CRM Enterprise Leads (Ongoing, Proposal Sent, Completed, Pending, On Hold, Disposed)
 *  6. 3 Months of Linked CRM Lead Activities (Meetings, Calls, Tasks, Emails, Notes - Past Completed & Upcoming Open)
 *  7. CRM Companies Directory
 *  8. Custom Domains & DNS/SSL Reachability Health Records in Domain Manager
 *  9. 3 Months of Company Announcements & Broadcast Messages (HR, Management & Team notices)
 *  10. Research & Technical Knowledge Resources
 *  11. General System & Biometric Settings
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, writeBatch } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > -1) {
        const key = trimmed.substring(0, idx).trim();
        const val = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Secondary app to create Auth accounts without losing Admin session
const secondaryApp = initializeApp(firebaseConfig, `SecondarySeeder-${Date.now()}`);
const secondaryAuth = getAuth(secondaryApp);

interface SeedUserDef {
  name: string;
  email: string;
  department: string;
  role: 'Employee' | 'Intern' | 'HR' | 'Admin' | 'Visitor';
  position: string;
  phone: string;
  bloodGroup: string;
  employeeId: string;
  profilePhoto: string;
  joiningDate: string;
  dob: string;
  biometricDevices?: any[];
  biometricExempt?: boolean;
}

const SEED_USERS: SeedUserDef[] = [
  // 1. Management
  {
    name: 'Vikramaditya Singhania',
    email: 'vikram.singh@hirush.com',
    department: 'Management',
    role: 'Employee',
    position: 'Chief Operations Officer',
    phone: '+91 98201 11223',
    bloodGroup: 'O+',
    employeeId: 'EMP001',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    joiningDate: '2025-01-15',
    dob: '1988-06-12',
    biometricExempt: false,
    biometricDevices: [
      {
        id: 'bio_emp001_1',
        credentialId: 'cred_bio_singhania_thumb_01',
        deviceId: 'dev_sm_s24_ultra',
        deviceName: 'Samsung Galaxy S24 Ultra',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-15T10:00:00Z',
        approvedAt: '2026-06-15T10:30:00Z',
        approvedBy: 'Super Admin'
      }
    ]
  },
  // 2. HR Department
  {
    name: 'Priya Nambiar',
    email: 'priya.hr@hirush.com',
    department: 'HR',
    role: 'HR',
    position: 'Senior HR Manager',
    phone: '+91 98202 22334',
    bloodGroup: 'B+',
    employeeId: 'HR001',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    joiningDate: '2025-02-01',
    dob: '1992-04-18',
    biometricDevices: [
      {
        id: 'bio_hr001_1',
        credentialId: 'cred_bio_priya_thumb_01',
        deviceId: 'dev_iphone_15_pro',
        deviceName: 'iPhone 15 Pro',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-10T09:15:00Z',
        approvedAt: '2026-06-10T09:45:00Z',
        approvedBy: 'Super Admin'
      },
      {
        id: 'bio_hr001_2',
        credentialId: 'cred_bio_priya_index_02',
        deviceId: 'dev_iphone_15_pro',
        deviceName: 'iPhone 15 Pro',
        slotIndex: 2,
        slotLabel: 'Finger 2 (Index)',
        status: 'approved',
        registeredAt: '2026-07-02T14:10:00Z',
        approvedAt: '2026-07-02T14:30:00Z',
        approvedBy: 'Super Admin'
      }
    ]
  },
  {
    name: 'Rohan Deshmukh',
    email: 'rohan.hr@hirush.com',
    department: 'HR',
    role: 'HR',
    position: 'Talent Acquisition Specialist',
    phone: '+91 98203 33445',
    bloodGroup: 'A+',
    employeeId: 'HR002',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    joiningDate: '2025-05-10',
    dob: '1995-11-23',
    biometricDevices: [
      {
        id: 'bio_hr002_1',
        credentialId: 'cred_bio_rohan_thumb_01',
        deviceId: 'dev_oneplus_12',
        deviceName: 'OnePlus 12',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-12T11:00:00Z',
        approvedAt: '2026-06-12T11:20:00Z',
        approvedBy: 'Super Admin'
      }
    ]
  },
  // 3. Development Department
  {
    name: 'Arjun Swaminathan',
    email: 'arjun.dev@hirush.com',
    department: 'Development',
    role: 'Employee',
    position: 'Principal Fullstack Architect',
    phone: '+91 98204 44556',
    bloodGroup: 'AB+',
    employeeId: 'EMP002',
    profilePhoto: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    joiningDate: '2025-01-10',
    dob: '1991-08-30',
    biometricDevices: [
      {
        id: 'bio_emp002_1',
        credentialId: 'cred_bio_arjun_thumb_01',
        deviceId: 'dev_pixel_9_pro',
        deviceName: 'Google Pixel 9 Pro',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-05T08:50:00Z',
        approvedAt: '2026-06-05T09:10:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Ananya Sharma',
    email: 'ananya.dev@hirush.com',
    department: 'Development',
    role: 'Employee',
    position: 'Senior Frontend Engineer',
    phone: '+91 98205 55667',
    bloodGroup: 'O+',
    employeeId: 'EMP003',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    joiningDate: '2025-03-15',
    dob: '1996-02-14',
    biometricDevices: [
      {
        id: 'bio_emp003_1',
        credentialId: 'cred_bio_ananya_thumb_01',
        deviceId: 'dev_macbook_touch_id',
        deviceName: 'MacBook Pro Touch ID',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-18T10:00:00Z',
        approvedAt: '2026-06-18T10:30:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Tanmay Kulkarni',
    email: 'tanmay.dev@hirush.com',
    department: 'Development',
    role: 'Employee',
    position: 'Backend & Cloud Systems Engineer',
    phone: '+91 98206 66778',
    bloodGroup: 'B-',
    employeeId: 'EMP004',
    profilePhoto: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    joiningDate: '2025-04-01',
    dob: '1994-09-05',
    biometricDevices: [
      {
        id: 'bio_emp004_1',
        credentialId: 'cred_bio_tanmay_thumb_01',
        deviceId: 'dev_galaxy_a55',
        deviceName: 'Samsung Galaxy A55 5G',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-20T12:00:00Z',
        approvedAt: '2026-06-20T12:15:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Ishaan Verma',
    email: 'ishaan.intern@hirush.com',
    department: 'Development',
    role: 'Intern',
    position: 'Software Engineering Intern',
    phone: '+91 98207 77889',
    bloodGroup: 'A-',
    employeeId: 'INT001',
    profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    joiningDate: '2026-06-01',
    dob: '2002-12-08',
    biometricDevices: [
      {
        id: 'bio_int001_1',
        credentialId: 'cred_bio_ishaan_thumb_01',
        deviceId: 'dev_redmi_note_13',
        deviceName: 'Redmi Note 13 Pro',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-02T10:00:00Z',
        approvedAt: '2026-06-02T10:30:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  // 4. Sales Department (SM)
  {
    name: 'Siddharth Malhotra',
    email: 'siddharth.sales@hirush.com',
    department: 'Sales',
    role: 'Employee',
    position: 'Head of Enterprise Sales',
    phone: '+91 98208 88990',
    bloodGroup: 'O+',
    employeeId: 'EMP005',
    profilePhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    joiningDate: '2025-02-15',
    dob: '1990-07-22',
    biometricDevices: [
      {
        id: 'bio_emp005_1',
        credentialId: 'cred_bio_sid_thumb_01',
        deviceId: 'dev_iphone_16_pro',
        deviceName: 'iPhone 16 Pro Max',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-08T09:00:00Z',
        approvedAt: '2026-06-08T09:30:00Z',
        approvedBy: 'Super Admin'
      }
    ]
  },
  {
    name: 'Meera Rajput',
    email: 'meera.sales@hirush.com',
    department: 'Sales',
    role: 'Employee',
    position: 'Senior Business Development Lead',
    phone: '+91 98209 99001',
    bloodGroup: 'B+',
    employeeId: 'EMP006',
    profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    joiningDate: '2025-04-10',
    dob: '1993-03-29',
    biometricDevices: [
      {
        id: 'bio_emp006_1',
        credentialId: 'cred_bio_meera_thumb_01',
        deviceId: 'dev_vivo_x100',
        deviceName: 'Vivo X100 Pro',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-14T09:30:00Z',
        approvedAt: '2026-06-14T09:50:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Kabir Mehta',
    email: 'kabir.sales@hirush.com',
    department: 'Sales',
    role: 'Employee',
    position: 'Client Acquisition Specialist',
    phone: '+91 98210 10112',
    bloodGroup: 'A+',
    employeeId: 'EMP007',
    profilePhoto: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150',
    joiningDate: '2025-07-01',
    dob: '1997-10-15',
    biometricDevices: [
      {
        id: 'bio_emp007_1',
        credentialId: 'cred_bio_kabir_thumb_01',
        deviceId: 'dev_nothing_phone_2',
        deviceName: 'Nothing Phone (2)',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-15T11:20:00Z',
        approvedAt: '2026-06-15T11:45:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  // 5. SEO Department
  {
    name: 'Divya Iyer',
    email: 'divya.seo@hirush.com',
    department: 'SEO',
    role: 'Employee',
    position: 'Lead Technical SEO Strategist',
    phone: '+91 98211 11223',
    bloodGroup: 'AB-',
    employeeId: 'EMP008',
    profilePhoto: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    joiningDate: '2025-03-01',
    dob: '1994-01-25',
    biometricDevices: [
      {
        id: 'bio_emp008_1',
        credentialId: 'cred_bio_divya_thumb_01',
        deviceId: 'dev_galaxy_s23',
        deviceName: 'Samsung Galaxy S23 FE',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-19T09:25:00Z',
        approvedAt: '2026-06-19T09:40:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Gaurav Banerjee',
    email: 'gaurav.seo@hirush.com',
    department: 'SEO',
    role: 'Employee',
    position: 'Senior Content & Search Analyst',
    phone: '+91 98212 22334',
    bloodGroup: 'O-',
    employeeId: 'EMP009',
    profilePhoto: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=150',
    joiningDate: '2025-06-15',
    dob: '1995-05-19',
    biometricDevices: [
      {
        id: 'bio_emp009_1',
        credentialId: 'cred_bio_gaurav_thumb_01',
        deviceId: 'dev_realme_gt_6',
        deviceName: 'Realme GT 6',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'pending_approval',
        registeredAt: '2026-10-01T10:15:00Z'
      }
    ]
  },
  // 6. Product Department
  {
    name: 'Nisha Sundaram',
    email: 'nisha.product@hirush.com',
    department: 'Product',
    role: 'Employee',
    position: 'Principal Product Manager',
    phone: '+91 98213 33445',
    bloodGroup: 'A+',
    employeeId: 'EMP010',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    joiningDate: '2025-02-10',
    dob: '1991-11-04',
    biometricDevices: [
      {
        id: 'bio_emp010_1',
        credentialId: 'cred_bio_nisha_thumb_01',
        deviceId: 'dev_iphone_14',
        deviceName: 'iPhone 14 Plus',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-07T10:00:00Z',
        approvedAt: '2026-06-07T10:20:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Varun Joshi',
    email: 'varun.product@hirush.com',
    department: 'Product',
    role: 'Employee',
    position: 'Senior UI/UX Product Designer',
    phone: '+91 98214 44556',
    bloodGroup: 'B+',
    employeeId: 'EMP011',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    joiningDate: '2025-04-18',
    dob: '1993-08-11',
    biometricDevices: [
      {
        id: 'bio_emp011_1',
        credentialId: 'cred_bio_varun_thumb_01',
        deviceId: 'dev_pixel_8a',
        deviceName: 'Google Pixel 8a',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-11T11:40:00Z',
        approvedAt: '2026-06-11T12:00:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  // 7. Media Department
  {
    name: 'Sneha Kapoor',
    email: 'sneha.media@hirush.com',
    department: 'Media',
    role: 'Employee',
    position: 'Creative Director & Video Producer',
    phone: '+91 98215 55667',
    bloodGroup: 'O+',
    employeeId: 'EMP012',
    profilePhoto: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    joiningDate: '2025-05-01',
    dob: '1995-03-17',
    biometricDevices: [
      {
        id: 'bio_emp012_1',
        credentialId: 'cred_bio_sneha_thumb_01',
        deviceId: 'dev_iphone_15_pink',
        deviceName: 'iPhone 15',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'approved',
        registeredAt: '2026-06-17T09:10:00Z',
        approvedAt: '2026-06-17T09:30:00Z',
        approvedBy: 'Priya Nambiar'
      }
    ]
  },
  {
    name: 'Aditya Roy',
    email: 'aditya.media@hirush.com',
    department: 'Media',
    role: 'Employee',
    position: 'Motion Graphics & Visual Specialist',
    phone: '+91 98216 66778',
    bloodGroup: 'A-',
    employeeId: 'EMP013',
    profilePhoto: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=150',
    joiningDate: '2025-08-10',
    dob: '1997-07-29',
    biometricDevices: [
      {
        id: 'bio_emp013_1',
        credentialId: 'cred_bio_aditya_thumb_01',
        deviceId: 'dev_moto_edge_50',
        deviceName: 'Motorola Edge 50 Ultra',
        slotIndex: 1,
        slotLabel: 'Finger 1 (Thumb)',
        status: 'pending_approval',
        registeredAt: '2026-10-02T11:00:00Z'
      }
    ]
  },
  // 8. Visitor
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@techadvisory.com',
    department: 'Visitor',
    role: 'Visitor',
    position: 'External Security & Compliance Auditor',
    phone: '+1 415 555 0199',
    bloodGroup: 'O+',
    employeeId: 'VIS001',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    joiningDate: '2026-07-01',
    dob: '1985-09-14',
    biometricExempt: true
  },
];

async function seed() {
  console.log("=================================================");
  console.log(" HIRUSH GLOBAL AMS: 3-MONTH ENTERPRISE SEEDER    ");
  console.log("=================================================");

  // Step 1: Sign in as Super Admin
  console.log("\n[Step 1/11] Authenticating as Admin...");
  const adminEmail = 'superadmin@hirush.com';
  const adminPwd = 'password123';
  let adminUid = '';

  try {
    const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPwd);
    adminUid = adminCred.user.uid;
    console.log(`✓ Authenticated as ${adminEmail} (UID: ${adminUid})`);
  } catch (err: any) {
    try {
      const newCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPwd);
      adminUid = newCred.user.uid;
      console.log(`✓ Created & Authenticated new Admin ${adminEmail} (UID: ${adminUid})`);
    } catch {
      adminUid = 'cRkplms1DOgFOM8Muq5tc5vFn7F3';
      console.log(`✓ Using fallback admin UID: ${adminUid}`);
    }
  }

  // Step 2: Global System & Biometric Settings
  console.log("\n[Step 2/11] Configuring Global AMS & Biometric Settings...");
  await setDoc(doc(db, 'settings', 'general'), {
    companyName: 'Hirush Global LLP',
    contactEmail: 'contact@hirush.com',
    companyAddress: 'Level 14, Tower B, Peninsula Business Park, Lower Parel, Mumbai, Maharashtra 400013',
    workHours: {
      standardCheckIn: '09:00:00',
      standardCheckOut: '18:00:00',
      gracePeriodMinutes: 15,
      fullDayHoursThreshold: 7.0,
      halfDayHoursThreshold: 4.0
    },
    biometricSettings: {
      enabled: true,
      verificationMode: 'location_and_biometric',
      autoApproveFirstDevice: false
    },
    updatedAt: new Date().toISOString()
  }, { merge: true });
  console.log("✓ Settings configured.");

  // Step 3: Create / Sync Staff Profiles
  console.log("\n[Step 3/11] Provisioning staff across all 8 departments with KYC & Biometrics...");
  const createdUsers: { uid: string; name: string; department: string; role: string; employeeId: string; email: string }[] = [];

  // Super Admin profile
  await setDoc(doc(db, 'users', adminUid), {
    name: 'Super Admin',
    email: adminEmail,
    department: 'Management',
    role: 'Admin',
    position: 'Chief Executive Administrator',
    status: 'Active',
    employeeId: 'HRA001',
    phone: '+91 98200 00001',
    bloodGroup: 'O+',
    companyName: 'Hirush Global LLP',
    joiningDate: '2025-01-01',
    profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    accountHolderName: 'Hirush Super Admin',
    bankName: 'HDFC Bank',
    accountNumber: '50100998877665',
    ifscCode: 'HDFC0000001',
    accountType: 'Salary',
    panNumber: 'HRA001ADMIN',
    aadharNumber: '9999 8888 7777',
    biometricExempt: true
  }, { merge: true });

  createdUsers.push({
    uid: adminUid,
    name: 'Super Admin',
    department: 'Management',
    role: 'Admin',
    employeeId: 'HRA001',
    email: adminEmail
  });

  const defaultUserPassword = 'password123';

  for (const u of SEED_USERS) {
    let uid = '';
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, u.email, defaultUserPassword);
      uid = cred.user.uid;
      console.log(`  + Created Auth for ${u.name} (${u.email}) [${u.department}]`);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(secondaryAuth, u.email, defaultUserPassword);
          uid = cred.user.uid;
          console.log(`  ~ Reusing existing Auth for ${u.name} (${u.email})`);
        } catch {
          uid = `user_${u.employeeId.toLowerCase()}`;
          console.log(`  ! Using fallback uid for ${u.name}`);
        }
      } else {
        uid = `user_${u.employeeId.toLowerCase()}`;
      }
    }

    const primaryBioDevice = u.biometricDevices && u.biometricDevices.length > 0 ? u.biometricDevices[0] : null;

    const userProfile = {
      name: u.name,
      email: u.email,
      department: u.department,
      role: u.role,
      position: u.position,
      status: 'Active',
      employeeId: u.employeeId,
      phone: u.phone,
      bloodGroup: u.bloodGroup,
      profilePhoto: u.profilePhoto,
      joiningDate: u.joiningDate,
      dob: u.dob,
      companyName: 'Hirush Global LLP',
      accountHolderName: u.name,
      bankName: 'HDFC Bank',
      accountNumber: `50100${Math.floor(1000000 + Math.random() * 9000000)}`,
      ifscCode: 'HDFC0001234',
      accountType: 'Salary',
      panNumber: `ABCDE${Math.floor(1000 + Math.random() * 9000)}F`,
      aadharNumber: `4523 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`,
      biometricDevice: primaryBioDevice,
      biometricDevices: u.biometricDevices || [],
      biometricExempt: !!u.biometricExempt
    };

    await setDoc(doc(db, 'users', uid), userProfile, { merge: true });
    createdUsers.push({ uid, name: u.name, department: u.department, role: u.role, employeeId: u.employeeId, email: u.email });
  }

  console.log(`✓ Total ${createdUsers.length} staff accounts synced!`);

  // Step 4: Full Official Holidays (2026 Calendar including 3-month window)
  console.log("\n[Step 4/11] Seeding Full Official Holidays Calendar...");
  const SEED_HOLIDAYS = [
    { date: '2026-01-26', name: 'Republic Day', type: 'National', description: 'Celebration of the Constitution of India' },
    { date: '2026-03-25', name: 'Holi Festival', type: 'National', description: 'Festival of colours and spring arrival' },
    { date: '2026-04-14', name: 'Dr. B.R. Ambedkar Jayanti', type: 'National', description: 'Birth anniversary of Dr. B.R. Ambedkar' },
    { date: '2026-05-01', name: 'Maharashtra Day & May Day', type: 'Company', description: 'Labour Day and state formation celebration' },
    { date: '2026-07-28', name: 'Muharram (Ashura)', type: 'National', description: 'Observance of Islamic calendar New Year milestone' },
    { date: '2026-08-15', name: 'Independence Day', type: 'National', description: 'National Independence Day Celebration' },
    { date: '2026-08-28', name: 'Raksha Bandhan', type: 'Company', description: 'Festival celebrating sibling bonding' },
    { date: '2026-09-14', name: 'Ganesh Chaturthi', type: 'Company', description: 'Auspicious arrival of Lord Ganesha' },
    { date: '2026-09-25', name: 'Eid-e-Milad', type: 'National', description: 'Prophet Muhammad birthday observance' },
    { date: '2026-10-02', name: 'Mahatma Gandhi Jayanti', type: 'National', description: 'Birth anniversary of Father of the Nation' },
    { date: '2026-10-20', name: 'Dussehra (Vijaya Dashami)', type: 'National', description: 'Triumph of righteousness and good over evil' },
    { date: '2026-11-08', name: 'Diwali (Lakshmi Puja)', type: 'National', description: 'Grand Festival of Lights' },
    { date: '2026-11-09', name: 'Govardhan Puja', type: 'Company', description: 'Diwali post-festival observance' },
    { date: '2026-11-10', name: 'Bhai Dooj', type: 'Company', description: 'Celebration of sibling affection' },
    { date: '2026-11-24', name: 'Guru Nanak Jayanti', type: 'National', description: 'Birth anniversary of Guru Nanak Dev Ji' },
    { date: '2026-12-25', name: 'Christmas Day', type: 'National', description: 'Christmas worldwide holiday' },
  ];

  for (const h of SEED_HOLIDAYS) {
    const hId = `hol_${h.date}`;
    await setDoc(doc(db, 'holidays', hId), h, { merge: true });
  }
  console.log(`✓ Seeded ${SEED_HOLIDAYS.length} holidays for 2026!`);

  // Step 5: Seed 3 Months (~92 Days: July 1, 2026 to October 3, 2026) of Attendance
  console.log("\n[Step 5/11] Generating 3 full months (~92 days) of realistic attendance records...");
  const eligibleStaff = createdUsers.filter(u => u.role !== 'Visitor');
  const holidayDates = new Set(SEED_HOLIDAYS.map(h => h.date));

  // Current simulation target date is Oct 3, 2026
  const targetDate = new Date('2026-10-03T12:00:00Z');
  let totalAttendanceRecords = 0;

  let attBatch = writeBatch(db);
  let attBatchOps = 0;

  // 92 days backwards from Oct 3 to July 4 / July 1
  for (let offset = 94; offset >= 0; offset--) {
    const curDate = new Date(targetDate);
    curDate.setDate(curDate.getDate() - offset);
    const dateStr = curDate.toISOString().split('T')[0];
    const dayOfWeek = curDate.getDay(); // 0: Sun, 6: Sat

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // Alternate Saturdays off: 2nd and 4th Saturdays of month
    const dayOfMonth = curDate.getDate();
    const isSecondOrFourthSat = dayOfWeek === 6 && ((dayOfMonth >= 8 && dayOfMonth <= 14) || (dayOfMonth >= 22 && dayOfMonth <= 28));
    if (isSecondOrFourthSat) continue;

    // Skip official holidays
    if (holidayDates.has(dateStr)) continue;

    for (const staff of eligibleStaff) {
      // 93% attendance probability on working days
      const isAbsent = Math.random() < 0.07;
      if (isAbsent) continue;

      // Realistic checkIn: 08:50 AM to 09:35 AM
      const inHour = 8 + (Math.random() < 0.65 ? 1 : 0);
      const inMin = inHour === 8 ? 50 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 35);
      const inSec = Math.floor(Math.random() * 60);
      const checkInStr = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:${String(inSec).padStart(2, '0')}`;

      // CheckOut: 18:05 PM to 19:40 PM
      const outHour = 18 + (Math.random() < 0.40 ? 1 : 0);
      const outMin = outHour === 18 ? 5 + Math.floor(Math.random() * 55) : Math.floor(Math.random() * 40);
      const outSec = Math.floor(Math.random() * 60);
      const checkOutStr = `${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:${String(outSec).padStart(2, '0')}`;

      // Calculate total work hours
      const [hIn, mIn, sIn] = checkInStr.split(':').map(Number);
      const [hOut, mOut, sOut] = checkOutStr.split(':').map(Number);
      const diffSecs = (hOut * 3600 + mOut * 60 + sOut) - (hIn * 3600 + mIn * 60 + sIn);
      const totalHours = parseFloat((diffSecs / 3600).toFixed(2));

      // Approved WFH for Dev, SEO, Product on occasional days
      const isWfh = (staff.department === 'Development' || staff.department === 'SEO' || staff.department === 'Product') && Math.random() < 0.14;

      const recordId = `att_${staff.uid}_${dateStr}`;
      const session = {
        id: `sess_${staff.uid}_${dateStr}`,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        autoCheckedOut: false,
        isManuallyEdited: false,
        biometricVerified: true,
        isWFH: isWfh,
        wfhStatus: isWfh ? 'approved' : null,
        location: {
          latitude: 19.0760 + (Math.random() - 0.5) * 0.008,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.008,
          accuracy: 11 + Math.floor(Math.random() * 6)
        },
        checkOutLocation: {
          latitude: 19.0760 + (Math.random() - 0.5) * 0.008,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.008,
          accuracy: 12
        }
      };

      const recordDoc = {
        userId: staff.uid,
        date: dateStr,
        sessions: [session],
        totalHours,
        isWFH: isWfh,
        wfhStatus: isWfh ? 'approved' : null,
        isManuallyEdited: false
      };

      attBatch.set(doc(db, 'attendance', recordId), recordDoc);
      attBatchOps++;
      totalAttendanceRecords++;

      if (attBatchOps >= 350) {
        await attBatch.commit();
        attBatch = writeBatch(db);
        attBatchOps = 0;
        process.stdout.write('.');
      }
    }
  }

  if (attBatchOps > 0) {
    await attBatch.commit();
  }
  console.log(`\n✓ Seeded ${totalAttendanceRecords} attendance records across past 3 months!`);

  // Step 6: 3 Months of Realistic Leave Requests (July, August, September, October 2026)
  console.log("\n[Step 6/11] Seeding 3 months of Leave Requests (Approved, Pending & Rejected)...");
  const findStaff = (empId: string) => createdUsers.find(u => u.employeeId === empId) || createdUsers[1];

  const SEED_LEAVE_REQUESTS = [
    // July 2026
    {
      empId: 'EMP002', // Arjun Swaminathan
      leaveType: 'Sick',
      duration: 'Full Day',
      startDate: '2026-07-08',
      endDate: '2026-07-09',
      reason: 'Suffering from viral fever and throat infection. Medical certificate submitted.',
      status: 'Approved',
      createdAt: '2026-07-07T18:20:00Z'
    },
    {
      empId: 'EMP003', // Ananya Sharma
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-07-17',
      endDate: '2026-07-17',
      reason: 'Attending cousin’s wedding ceremony in Pune.',
      status: 'Approved',
      createdAt: '2026-07-14T11:00:00Z'
    },
    {
      empId: 'EMP004', // Tanmay Kulkarni
      leaveType: 'WFH',
      duration: 'Full Day',
      startDate: '2026-07-22',
      endDate: '2026-07-24',
      reason: 'Heavy waterlogging in Thane route due to torrential monsoon rains.',
      status: 'Approved',
      createdAt: '2026-07-21T20:30:00Z'
    },
    {
      empId: 'HR001', // Priya Nambiar
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-07-27',
      endDate: '2026-07-27',
      reason: 'Personal urgent banking work and home registry documentation.',
      status: 'Approved',
      createdAt: '2026-07-24T14:15:00Z'
    },

    // August 2026
    {
      empId: 'EMP005', // Siddharth Malhotra
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-08-13',
      endDate: '2026-08-14',
      reason: 'Extended family gathering ahead of Independence Day weekend.',
      status: 'Approved',
      createdAt: '2026-08-08T09:40:00Z'
    },
    {
      empId: 'EMP006', // Meera Rajput
      leaveType: 'Sick',
      duration: 'Full Day',
      startDate: '2026-08-18',
      endDate: '2026-08-18',
      reason: 'Food poisoning and migraine. Doctor advised 24h bed rest.',
      status: 'Approved',
      createdAt: '2026-08-18T07:15:00Z'
    },
    {
      empId: 'EMP008', // Divya Iyer
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-08-25',
      endDate: '2026-08-26',
      reason: 'Family temple visit in Tirupati.',
      status: 'Approved',
      createdAt: '2026-08-19T16:00:00Z'
    },
    {
      empId: 'EMP009', // Gaurav Banerjee
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-08-27',
      endDate: '2026-08-29',
      reason: 'Personal holiday trip to Goa with college friends.',
      status: 'Rejected',
      statusReason: 'Client deliverable for Starlight Logistics SEO report due on Aug 28.',
      createdAt: '2026-08-24T11:20:00Z'
    },
    {
      empId: 'EMP010', // Nisha Sundaram
      leaveType: 'WFH',
      duration: 'Full Day',
      startDate: '2026-08-31',
      endDate: '2026-08-31',
      reason: 'Home plumbing repairs and broadband technician visit.',
      status: 'Approved',
      createdAt: '2026-08-29T15:00:00Z'
    },

    // September 2026
    {
      empId: 'EMP012', // Sneha Kapoor
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      reason: 'Ganesh Chaturthi celebrations and family puja at hometown.',
      status: 'Approved',
      createdAt: '2026-09-10T12:00:00Z'
    },
    {
      empId: 'INT001', // Ishaan Verma
      leaveType: 'Sick',
      duration: 'Full Day',
      startDate: '2026-09-18',
      endDate: '2026-09-18',
      reason: 'Wisdom tooth extraction surgery and post-procedure recovery.',
      status: 'Approved',
      createdAt: '2026-09-17T17:30:00Z'
    },
    {
      empId: 'EMP007', // Kabir Mehta
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-09-22',
      endDate: '2026-09-23',
      reason: 'Personal emergency at ancestral home.',
      status: 'Approved',
      createdAt: '2026-09-21T08:00:00Z'
    },
    {
      empId: 'EMP011', // Varun Joshi
      leaveType: 'Casual',
      duration: 'Half Day',
      halfDayType: 'Morning',
      startDate: '2026-09-28',
      endDate: '2026-09-28',
      reason: 'RTO vehicle fitness inspection and registration.',
      status: 'Approved',
      createdAt: '2026-09-26T10:15:00Z'
    },
    {
      empId: 'HR002', // Rohan Deshmukh
      leaveType: 'Sick',
      duration: 'Half Day',
      halfDayType: 'Morning',
      startDate: '2026-09-30',
      endDate: '2026-09-30',
      reason: 'Annual comprehensive preventive health checkup at SRL Diagnostics.',
      status: 'Approved',
      createdAt: '2026-09-29T14:40:00Z'
    },

    // October 2026 (Recent & Pending review)
    {
      empId: 'EMP002', // Arjun Swaminathan
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-10-06',
      endDate: '2026-10-07',
      reason: 'Visiting parents in Chennai for pre-festive family ceremonies.',
      status: 'Pending',
      createdAt: '2026-10-02T16:00:00Z'
    },
    {
      empId: 'EMP006', // Meera Rajput
      leaveType: 'Casual',
      duration: 'Full Day',
      startDate: '2026-10-09',
      endDate: '2026-10-09',
      reason: 'Attending younger sister’s formal engagement function.',
      status: 'Pending',
      createdAt: '2026-10-03T09:30:00Z'
    },
    {
      empId: 'EMP003', // Ananya Sharma
      leaveType: 'WFH',
      duration: 'Full Day',
      startDate: '2026-10-05',
      endDate: '2026-10-06',
      reason: 'Building society civil maintenance and electrical rewiring.',
      status: 'Pending',
      createdAt: '2026-10-03T11:15:00Z'
    }
  ];

  let leaveCount = 0;
  for (const lr of SEED_LEAVE_REQUESTS) {
    const user = findStaff(lr.empId);
    const leaveDocId = `leave_${user.uid}_${lr.startDate}`;
    await setDoc(doc(db, 'leaveRequests', leaveDocId), {
      userId: user.uid,
      userName: user.name,
      leaveType: lr.leaveType,
      duration: lr.duration,
      halfDayType: (lr as any).halfDayType || null,
      startDate: lr.startDate,
      endDate: lr.endDate,
      reason: lr.reason,
      status: lr.status,
      statusReason: (lr as any).statusReason || null,
      createdAt: lr.createdAt,
      updatedAt: lr.createdAt
    }, { merge: true });
    leaveCount++;
  }
  console.log(`✓ Seeded ${leaveCount} Leave Requests across 3 months!`);

  // Step 7: CRM Leads across 3 Months (July, August, September, October 2026)
  console.log("\n[Step 7/11] Seeding 3-Month Enterprise CRM Pipeline (16 Leads)...");
  const salesUsers = createdUsers.filter(u => u.department === 'Sales');
  const getSalesUid = (idx: number) => salesUsers[idx % salesUsers.length]?.uid || adminUid;

  const SEED_LEADS = [
    // 1. Ongoing
    {
      id: 'lead_hg_ld_001',
      slNo: 'HG-LD-001',
      category: 'Company',
      projectName: 'Nexus Omnichannel E-Commerce Suite',
      status: 'Ongoing',
      clientName: 'Apex Horizon Retailers Ltd',
      clientType: 'B2B',
      clientTypeDetail: 'Apex Horizon Global',
      pocName: 'Rajesh Singhania',
      pocEmail: 'rajesh@apexhorizon.com',
      pocPhone: '+91 98200 12345',
      firstStartDate: '2026-07-10',
      workCommencementDate: '2026-07-25',
      expiryDate: '2027-07-25',
      domainDetail: 'https://shop.apexhorizon.com',
      department: ['Sales', 'Development', 'Product'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 184,
      remark: 'High-value enterprise tier. Phase 1 storefront successfully live on production.',
      activities: [
        { type: 'Meeting', title: 'Sprint Review & Live Demo', description: 'Presented storefront wireframes and product sync API.', completed: true, scheduledAt: '2026-07-28T14:00:00Z' },
        { type: 'Call', title: 'Payment Gateway Integration Check', description: 'Aligned with Razorpay enterprise team for escrow payout.', completed: true, scheduledAt: '2026-08-12T11:30:00Z' },
        { type: 'Task', title: 'Deliver Phase 2 UAT Build to Client', description: 'Deploy staging build on Vercel preview domain.', completed: true, scheduledAt: '2026-09-18T17:00:00Z' },
        { type: 'Meeting', title: 'Q4 Scale & Black Friday Readiness', description: 'Stress-test load balancers for 50,000 peak concurrent users.', completed: false, scheduledAt: '2026-10-15T15:00:00Z' },
      ]
    },
    // 2. Proposal Sent
    {
      id: 'lead_hg_ld_002',
      slNo: 'HG-LD-002',
      category: 'Company',
      projectName: 'FinEdge AI Wealth Intelligence Platform',
      status: 'Proposal Sent',
      clientName: 'Kaveri Capital Advisory',
      clientType: 'Referral',
      clientTypeDetail: 'Referred by Aditya Singhania',
      pocName: 'Sunita Krishnan',
      pocEmail: 'sunita.k@kavericapital.in',
      pocPhone: '+91 98199 54321',
      firstStartDate: '2026-08-02',
      workCommencementDate: '2026-09-05',
      expiryDate: '2027-09-05',
      domainDetail: 'https://invest.kavericapital.in',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 220,
      remark: 'Commercial proposal sent for ₹18,50,000. Client legal team reviewing master service agreement.',
      activities: [
        { type: 'Email', title: 'Commercial Proposal & Scope Dispatch', description: 'Sent detailed PDF proposal with milestone architecture.', completed: true, scheduledAt: '2026-08-15T10:00:00Z' },
        { type: 'Call', title: 'Follow-up with Managing Partner', description: 'Discussed SLA terms and multi-tenant security architecture.', completed: true, scheduledAt: '2026-09-10T16:00:00Z' },
        { type: 'Task', title: 'Finalize Security Compliance Appendix', description: 'Attach SOC2 and ISO27001 data residency documentation.', completed: false, scheduledAt: '2026-10-08T14:30:00Z' }
      ]
    },
    // 3. Completed
    {
      id: 'lead_hg_ld_003',
      slNo: 'HG-LD-003',
      category: 'Company',
      projectName: 'MediPulse Telehealth & EHR System',
      status: 'Completed',
      clientName: 'Dr. Anand Healthcare Network',
      clientType: 'B2B',
      clientTypeDetail: 'Anand Care Hospitals',
      pocName: 'Dr. Ramesh Anand',
      pocEmail: 'ramesh@anandcare.org',
      pocPhone: '+91 98205 99887',
      firstStartDate: '2026-07-01',
      workCommencementDate: '2026-07-15',
      expiryDate: '2027-07-15',
      domainDetail: 'https://portal.anandcare.org',
      department: ['Sales', 'Development', 'Product'],
      assignedTo: getSalesUid(2),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 290,
      remark: 'Production release live. Full handover complete and 12-month AMC active.',
      activities: [
        { type: 'Meeting', title: 'Go-Live Handover & Training', description: 'Trained 45 hospital staff members on patient queuing.', completed: true, scheduledAt: '2026-08-20T10:00:00Z' },
        { type: 'Task', title: 'Q3 Maintenance Review & Security Scan', description: 'Ran OWASP security audit on patient record storage.', completed: true, scheduledAt: '2026-09-12T12:00:00Z' },
      ]
    },
    // 4. Ongoing SEO
    {
      id: 'lead_hg_ld_004',
      slNo: 'HG-LD-004',
      category: 'Company',
      projectName: 'Global Brand Identity & Organic SEO Domination',
      status: 'Ongoing',
      clientName: 'Starlight Sustainable Logistics',
      clientType: 'Sales',
      clientTypeDetail: 'Direct Inbound Inquiry',
      pocName: 'Marcus Sterling',
      pocEmail: 'marcus@starlight-logistics.com',
      pocPhone: '+44 20 7946 0912',
      firstStartDate: '2026-07-18',
      workCommencementDate: '2026-08-01',
      expiryDate: '2027-02-01',
      domainDetail: 'https://starlight-logistics.com',
      department: ['Sales', 'SEO', 'Media'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 110,
      remark: 'Technical audit executed. Organic impressions surged +82% across EU queries.',
      activities: [
        { type: 'Call', title: 'Keyword Strategy Alignment', description: 'Reviewed top 20 high-intent shipping keywords for EU market.', completed: true, scheduledAt: '2026-08-10T15:30:00Z' },
        { type: 'Task', title: 'Publish 8 Technical Whitepapers & Backlinks', description: 'Guest post outreach executed on 5 freight tech journals.', completed: true, scheduledAt: '2026-09-14T18:00:00Z' },
        { type: 'Meeting', title: 'Monthly Executive SEO Review', description: 'Review Google Search Console rankings and conversions.', completed: false, scheduledAt: '2026-10-10T16:00:00Z' }
      ]
    },
    // 5. Pending / Inbound Lead
    {
      id: 'lead_hg_ld_005',
      slNo: 'HG-LD-005',
      category: 'Raw / Scraped',
      projectName: 'Hyperion Hospitality Cloud POS Migration',
      status: 'Pending',
      clientName: 'Hyperion Resorts & Luxury Villas',
      clientType: 'B2B',
      clientTypeDetail: 'Apollo Hospitality Group',
      pocName: 'Tarun Chawla',
      pocEmail: 'tarun.c@hyperionresorts.in',
      pocPhone: '+91 99300 87654',
      firstStartDate: '2026-09-18',
      workCommencementDate: '2026-10-15',
      expiryDate: '2027-09-18',
      domainDetail: 'https://hyperionresorts.in',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 75,
      remark: 'Cold inbound from LinkedIn. Showcase live table reservation & QR billing.',
      activities: [
        { type: 'Call', title: 'Introductory Discovery Call', description: 'Assessed existing legacy Micros Oracle POS pain points.', completed: true, scheduledAt: '2026-09-22T11:00:00Z' },
        { type: 'Meeting', title: 'Live Product Demo for General Manager', description: 'Showcase table reservation and QR billing module.', completed: false, scheduledAt: '2026-10-06T14:00:00Z' },
      ]
    },
    // 6. On Hold
    {
      id: 'lead_hg_ld_006',
      slNo: 'HG-LD-006',
      category: 'Raw / Scraped',
      projectName: 'BioClean Green Energy Portal & IoT Telemetry',
      status: 'On Hold',
      clientName: 'BioClean Solarpower Industries',
      clientType: 'Other',
      clientTypeDetail: 'CleanTech Expo Lead',
      pocName: 'Deepak Narang',
      pocEmail: 'deepak@biocleansolar.com',
      pocPhone: '+91 97690 34567',
      firstStartDate: '2026-08-05',
      workCommencementDate: '2026-09-01',
      expiryDate: '2027-09-01',
      domainDetail: 'https://biocleansolar.com',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(2),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 140,
      remark: 'Client budget frozen until Q4 board approval. Follow up mid October.',
      activities: [
        { type: 'Call', title: 'Budget Status Check-in', description: 'Client confirmed budget sanction moved to next quarter.', completed: true, scheduledAt: '2026-08-25T10:30:00Z' },
        { type: 'Task', title: 'Re-engage Managing Director', description: 'Send updated solar tariff analytics ROI calculator.', completed: false, scheduledAt: '2026-10-18T11:00:00Z' },
      ]
    },
    // 7. Ongoing 3D Media
    {
      id: 'lead_hg_ld_007',
      slNo: 'HG-LD-007',
      category: 'Company',
      projectName: 'VividMotion 3D Video Campaign & Creative Studio',
      status: 'Ongoing',
      clientName: 'Zephyr Electric Mobility',
      clientType: 'B2B',
      clientTypeDetail: 'Zephyr Auto Corp',
      pocName: 'Natasha Fernandez',
      pocEmail: 'natasha@zephyrmobility.com',
      pocPhone: '+91 98333 44556',
      firstStartDate: '2026-08-20',
      workCommencementDate: '2026-09-01',
      expiryDate: '2027-03-01',
      domainDetail: 'https://zephyrmobility.com',
      department: ['Sales', 'Media'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 245,
      remark: '3D vehicle rendering in progress. Storyboard and voiceover approved.',
      activities: [
        { type: 'Meeting', title: 'Storyboard Review', description: 'Approved 60s teaser storyboard and sound design.', completed: true, scheduledAt: '2026-08-28T15:00:00Z' },
        { type: 'Task', title: 'Deliver First Cut 4K Render', description: 'Render Blender scenes with realistic automotive studio lighting.', completed: true, scheduledAt: '2026-09-24T19:00:00Z' },
        { type: 'Meeting', title: 'Final Color Grading & Delivery', description: 'Deliver ProRes 422 masters for TV commercial and YouTube.', completed: false, scheduledAt: '2026-10-09T17:00:00Z' }
      ]
    },
    // 8. Proposal Sent B2B Supply Chain
    {
      id: 'lead_hg_ld_008',
      slNo: 'HG-LD-008',
      category: 'Company',
      projectName: 'Zenith B2B Supply Chain Analytics',
      status: 'Proposal Sent',
      clientName: 'Zenith Logistics International',
      clientType: 'Friend',
      clientTypeDetail: 'Contact via CEO Network',
      pocName: 'Alok Goenka',
      pocEmail: 'alok.g@zenithlogistics.com',
      pocPhone: '+91 99201 67890',
      firstStartDate: '2026-09-02',
      workCommencementDate: '2026-10-15',
      expiryDate: '2027-10-15',
      domainDetail: 'https://zenithlogistics.com',
      department: ['Sales', 'Product', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 198,
      remark: 'Proposal dispatched with multi-warehouse dashboard architecture.',
      activities: [
        { type: 'Email', title: 'SLA and Scope Document Sent', description: 'Dispatched complete requirements traceability matrix.', completed: true, scheduledAt: '2026-09-15T09:30:00Z' },
        { type: 'Call', title: 'Pricing Negotiation Call', description: 'Review tiered licensing versus upfront enterprise buyout.', completed: false, scheduledAt: '2026-10-07T11:30:00Z' }
      ]
    },
    // 9. Ongoing ERP
    {
      id: 'lead_hg_ld_009',
      slNo: 'HG-LD-009',
      category: 'Company',
      projectName: 'Titan Forge Industrial ERP & Inventory Cloud',
      status: 'Ongoing',
      clientName: 'Titan Forge Steel Industries',
      clientType: 'B2B',
      clientTypeDetail: 'Titan Group',
      pocName: 'Harishankar Pillai',
      pocEmail: 'harishankar@titanforgesteel.com',
      pocPhone: '+91 98400 98765',
      firstStartDate: '2026-07-05',
      workCommencementDate: '2026-07-20',
      expiryDate: '2027-07-20',
      domainDetail: 'https://erp.titanforgesteel.com',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(2),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 280,
      remark: 'Custom inventory barcodes and weighing scale IoT bridge deployed.',
      activities: [
        { type: 'Meeting', title: 'Factory Floor User Acceptance Testing', description: 'Tested RFID gate scanners and weighing scale serial port API.', completed: true, scheduledAt: '2026-08-14T11:00:00Z' },
        { type: 'Task', title: 'Release Sprint 3 Patch to Production', description: 'Fixed scrap steel recalculation formula bug.', completed: true, scheduledAt: '2026-09-08T18:00:00Z' },
        { type: 'Call', title: 'Plant Manager Quarterly Review', description: 'Review uptime and shift productivity metrics.', completed: false, scheduledAt: '2026-10-12T15:30:00Z' }
      ]
    },
    // 10. Completed Media Brand
    {
      id: 'lead_hg_ld_010',
      slNo: 'HG-LD-010',
      category: 'Company',
      projectName: 'LuxeLiving Interior Architectural Showcase',
      status: 'Completed',
      clientName: 'LuxeLiving Designs LLP',
      clientType: 'Referral',
      clientTypeDetail: 'Referred by Sneha Kapoor',
      pocName: 'Kavita Chidambaram',
      pocEmail: 'kavita@luxeliving.co.in',
      pocPhone: '+91 98111 22334',
      firstStartDate: '2026-07-12',
      workCommencementDate: '2026-07-25',
      expiryDate: '2027-01-25',
      domainDetail: 'https://luxeliving.co.in',
      department: ['Sales', 'Media', 'Development'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 112,
      remark: 'Immersive portfolio site launched with virtual 360 showroom tour.',
      activities: [
        { type: 'Meeting', title: 'Final Review & High-Res Render Signoff', description: 'Signed off on high-resolution showroom photography.', completed: true, scheduledAt: '2026-08-18T16:00:00Z' },
        { type: 'Task', title: 'DNS Cutover to Cloudflare CDN', description: 'Migrated name servers to Cloudflare Pro for caching.', completed: true, scheduledAt: '2026-08-25T20:00:00Z' }
      ]
    },
    // 11. Disposed / Lost
    {
      id: 'lead_hg_ld_011',
      slNo: 'HG-LD-011',
      category: 'Raw / Scraped',
      projectName: 'SwiftPay Micro-Lending Mobile App',
      status: 'Disposed',
      clientName: 'SwiftPay NeoFinance Corp',
      clientType: 'Sales',
      clientTypeDetail: 'Outbound Cold Email',
      pocName: 'Nitin Agarwal',
      pocEmail: 'nitin@swiftpay.finance',
      pocPhone: '+91 97110 55667',
      firstStartDate: '2026-08-01',
      workCommencementDate: '',
      expiryDate: '2027-08-01',
      domainDetail: 'https://swiftpay.finance',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Issue Detected',
      sslStatus: 'Healthy',
      sslDaysLeft: 42,
      remark: 'Disposed: Client wanted pure offshore agency at unviable cut-rate pricing.',
      activities: [
        { type: 'Call', title: 'Commercial Budget Negotiation', description: 'Client unwilling to commit beyond ₹2,00,000 for full flutter app.', completed: true, scheduledAt: '2026-08-16T14:00:00Z' }
      ]
    },
    // 12. Pending High-Priority Lead
    {
      id: 'lead_hg_ld_012',
      slNo: 'HG-LD-012',
      category: 'Company',
      projectName: 'AeroGlide EV Charging Station Mesh Network',
      status: 'Pending',
      clientName: 'AeroGlide Green Infrastructure',
      clientType: 'B2B',
      clientTypeDetail: 'AeroGlide Mobility Ltd',
      pocName: 'Sanjay Deshmukh',
      pocEmail: 'sanjay@aeroglide.io',
      pocPhone: '+91 98230 45678',
      firstStartDate: '2026-09-25',
      workCommencementDate: '2026-10-20',
      expiryDate: '2027-10-20',
      domainDetail: 'https://aeroglide.io',
      department: ['Sales', 'Development', 'Product'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 310,
      remark: 'High-potential EV charging network. Requesting OCPP protocol integration.',
      activities: [
        { type: 'Email', title: 'Capabilities Deck & Case Studies Dispatched', description: 'Shared IoT telemetry case study for Zephyr EV.', completed: true, scheduledAt: '2026-09-27T10:00:00Z' },
        { type: 'Meeting', title: 'Technical Architecture Discovery', description: 'Review OCPP 2.0.1 MQTT broker architecture.', completed: false, scheduledAt: '2026-10-08T15:00:00Z' }
      ]
    }
  ];

  let leadCount = 0;
  let totalActivities = 0;

  for (const lead of SEED_LEADS) {
    const { activities, ...leadData } = lead;
    await setDoc(doc(db, 'leads', lead.id), {
      ...leadData,
      createdAt: `${lead.firstStartDate}T10:00:00Z`,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    leadCount++;

    for (let i = 0; i < activities.length; i++) {
      const act = activities[i];
      const actId = `act_${lead.id}_${i + 1}`;
      await setDoc(doc(db, 'leadActivities', actId), {
        id: actId,
        leadId: lead.id,
        type: act.type,
        title: act.title,
        description: act.description,
        scheduledAt: act.scheduledAt,
        completed: act.completed,
        createdAt: act.scheduledAt
      }, { merge: true });
      totalActivities++;
    }
  }
  console.log(`✓ Seeded ${leadCount} CRM leads and ${totalActivities} activities!`);

  // Step 8: CRM Companies Directory
  console.log("\n[Step 8/11] Seeding CRM Companies Directory...");
  const CRM_COMPANIES = [
    'Apex Horizon Global',
    'Kaveri Capital Advisory',
    'Anand Care Hospitals',
    'Starlight Sustainable Logistics',
    'Apollo Hospitality Group',
    'Zephyr Auto Corp',
    'Zenith Logistics International',
    'Titan Group',
    'LuxeLiving Designs LLP',
    'AeroGlide Mobility Ltd'
  ];

  for (const comp of CRM_COMPANIES) {
    const cId = `comp_${comp.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    await setDoc(doc(db, 'crm_companies', cId), {
      id: cId,
      name: comp,
      status: 'Active',
      industry: 'Enterprise Solutions',
      createdAt: '2026-07-01T10:00:00Z'
    }, { merge: true });
  }
  console.log(`✓ Seeded ${CRM_COMPANIES.length} CRM Companies!`);

  // Step 9: Custom Domains (Domain Manager Module)
  console.log("\n[Step 9/11] Seeding Domain Manager with DNS/SSL Health Audit Records...");
  const SEED_DOMAINS = [
    {
      id: 'dom_hirush_cloud',
      projectName: 'Hirush Global Core Cloud Infrastructure',
      domainDetail: 'https://cloud.hirushglobal.com',
      expiryDate: '2027-09-15',
      pocName: 'Arjun Swaminathan',
      pocEmail: 'arjun.dev@hirush.com',
      pocPhone: '+91 98204 44556',
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 345,
      remark: 'Primary production Kubernetes ingress and microservices cluster.',
      createdAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'dom_ams_portal',
      projectName: 'Hirush Enterprise AMS & Biometric Gateway',
      domainDetail: 'https://ams.hirushglobal.com',
      expiryDate: '2027-08-20',
      pocName: 'Priya Nambiar',
      pocEmail: 'priya.hr@hirush.com',
      pocPhone: '+91 98202 22334',
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 318,
      remark: 'Attendance management system and WebAuthn biometric FIDO2 endpoint.',
      createdAt: '2026-07-01T10:00:00Z'
    },
    {
      id: 'dom_brand_vault',
      projectName: 'Creative Media & Brand Asset Vault',
      domainDetail: 'https://design.hirushcreative.io',
      expiryDate: '2026-10-18', // Expiring in ~15 days for alert triggering
      pocName: 'Sneha Kapoor',
      pocEmail: 'sneha.media@hirush.com',
      pocPhone: '+91 98215 55667',
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 15,
      remark: 'Expiring in 15 days! Renew with Namecheap before auto-grace period.',
      createdAt: '2026-07-15T12:00:00Z'
    },
    {
      id: 'dom_api_partners',
      projectName: 'Partner Integration & Webhook Gateway',
      domainDetail: 'https://api.hirushpartners.net',
      expiryDate: '2027-04-10',
      pocName: 'Tanmay Kulkarni',
      pocEmail: 'tanmay.dev@hirush.com',
      pocPhone: '+91 98206 66778',
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 188,
      remark: 'REST & GraphQL public partner gateway with Cloudflare WAF protection.',
      createdAt: '2026-08-01T11:00:00Z'
    },
    {
      id: 'dom_urgent_notice',
      projectName: 'Legacy Client Demo Portal (Staging)',
      domainDetail: 'https://demo-staging.hirushbeta.com',
      expiryDate: '2026-10-05', // Expiring in 2 days (Critical Warning)
      pocName: 'Vikramaditya Singhania',
      pocEmail: 'vikram.singh@hirush.com',
      pocPhone: '+91 98201 11223',
      dnsStatus: 'Healthy',
      sslStatus: 'Issue Detected',
      sslDaysLeft: 2,
      healthError: 'SSL Certificate expires in 48 hours. Auto-renewal failed due to DNS challenge failure.',
      remark: 'CRITICAL ALERT: SSL certificate renewal requires manual DNS TXT record validation.',
      createdAt: '2026-08-10T14:00:00Z'
    }
  ];

  for (const dom of SEED_DOMAINS) {
    await setDoc(doc(db, 'domains', dom.id), {
      ...dom,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  }
  console.log(`✓ Seeded ${SEED_DOMAINS.length} Custom Domains in Domain Manager!`);

  // Step 10: 3 Months of Internal Announcements & Broadcast Messages
  console.log("\n[Step 10/11] Seeding 3 months of Internal Messages & Broadcast Notices...");
  const SEED_MESSAGES = [
    // July 2026
    {
      id: 'msg_2026_07_01',
      title: 'Welcome to Q3 2026: Vision, Growth & Strategic Milestones',
      content: 'Dear Hirush Global Team,\n\nAs we kick off Q3 2026, we extend our heartfelt appreciation for your outstanding work during the first half of the year. Our core focus for this quarter remains enterprise customer delight, high system reliability across AMS and client projects, and fostering an exceptional workplace culture.\n\nLet’s make this quarter our most productive yet!',
      recipient: 'all',
      recipientType: 'all',
      senderId: adminUid,
      senderName: 'Super Admin',
      timestamp: new Date('2026-07-01T09:30:00Z')
    },
    {
      id: 'msg_2026_07_20',
      title: 'Monsoon Safety Advisory & Flexible WFH Guidelines',
      content: 'Attention All Employees,\n\nIn light of the heavy rainfall warnings issued by the meteorological department for Greater Mumbai, management has enabled flexible Work-From-Home (WFH) options for the Development, SEO, and Product teams.\n\nPlease coordinate with your department managers and submit your WFH requests via AMS.',
      recipient: 'all',
      recipientType: 'all',
      senderId: findStaff('HR001').uid,
      senderName: 'Priya Nambiar (Senior HR Manager)',
      timestamp: new Date('2026-07-20T08:00:00Z')
    },

    // August 2026
    {
      id: 'msg_2026_08_14',
      title: '79th Independence Day Office Gathering & Holiday Notice',
      content: 'Greetings Everyone,\n\nPlease note that our offices will remain closed tomorrow, Saturday, August 15, in observance of Independence Day.\n\nWe invite all team members present in the office today to join us in the 14th Floor Cafeteria at 4:30 PM for high tea and a flag hoisting ceremony.',
      recipient: 'all',
      recipientType: 'all',
      senderId: findStaff('HR001').uid,
      senderName: 'Priya Nambiar (Senior HR Manager)',
      timestamp: new Date('2026-08-14T11:00:00Z')
    },
    {
      id: 'msg_2026_08_25',
      title: 'Congratulations Sales Team: MediPulse Telehealth Contract Handover',
      content: 'Kudos to Siddharth Malhotra, Meera Rajput, and Kabir Mehta from our Enterprise Sales team for successfully closing and delivering the MediPulse Telehealth & EHR platform for Dr. Anand Healthcare Network!\n\nThe 12-month maintenance SLA has also been signed. Exemplary effort by everyone involved!',
      recipient: 'Sales',
      recipientType: 'department',
      senderId: adminUid,
      senderName: 'Super Admin',
      timestamp: new Date('2026-08-25T15:30:00Z')
    },

    // September 2026
    {
      id: 'msg_2026_09_05',
      title: 'AMS Biometric Fingerprint Registration Drive',
      content: 'Dear Staff Members,\n\nWe have enhanced AMS with WebAuthn FIDO2 Biometric Authentication to ensure seamless one-touch check-ins. If you haven’t yet registered your secondary finger slot, please visit the Biometrics page in AMS or speak to HR.\n\nBiometric verification ensures instant and tamper-proof attendance recording.',
      recipient: 'all',
      recipientType: 'all',
      senderId: findStaff('HR001').uid,
      senderName: 'Priya Nambiar (Senior HR Manager)',
      timestamp: new Date('2026-09-05T10:00:00Z')
    },
    {
      id: 'msg_2026_09_22',
      title: 'Scheduled Cloud Infrastructure Maintenance Notice',
      content: 'Hello Engineers & Designers,\n\nPlease be advised that our primary Cloud Kubernetes cluster will undergo a rolling node upgrade this Saturday, September 26, between 11:00 PM and 02:00 AM IST.\n\nAll production staging endpoints will remain unaffected through our secondary failover proxy.',
      recipient: 'Development',
      recipientType: 'department',
      senderId: findStaff('EMP002').uid,
      senderName: 'Arjun Swaminathan (Principal Architect)',
      timestamp: new Date('2026-09-22T14:15:00Z')
    },

    // October 2026 (Recent)
    {
      id: 'msg_2026_10_01',
      title: 'Mahatma Gandhi Jayanti Office Holiday Reminder',
      content: 'Dear Hirush Global Family,\n\nThis is a friendly reminder that our offices will be closed on Friday, October 2, 2026, in honor of Mahatma Gandhi Jayanti.\n\nEnjoy the long weekend with your families!',
      recipient: 'all',
      recipientType: 'all',
      senderId: findStaff('HR001').uid,
      senderName: 'Priya Nambiar (Senior HR Manager)',
      timestamp: new Date('2026-10-01T10:00:00Z')
    },
    {
      id: 'msg_2026_10_03',
      title: 'Q4 All-Hands Town Hall: Strategic Review & Roadmap',
      content: 'Team,\n\nMark your calendars for our upcoming Q4 All-Hands Town Hall scheduled for Wednesday, October 7, at 3:00 PM in the Main Conference Boardroom and on Google Meet.\n\nWe will be discussing our Q3 performance results, major upcoming client onboardings, and the roadmap for the holiday season ahead.',
      recipient: 'all',
      recipientType: 'all',
      senderId: adminUid,
      senderName: 'Super Admin',
      timestamp: new Date('2026-10-03T11:00:00Z')
    }
  ];

  for (const msg of SEED_MESSAGES) {
    await setDoc(doc(db, 'messages', msg.id), {
      ...msg,
      createdAt: msg.timestamp.toISOString()
    }, { merge: true });
  }
  console.log(`✓ Seeded ${SEED_MESSAGES.length} Internal Announcements & Broadcasts!`);

  // Step 11: Research & Technical Resources
  console.log("\n[Step 11/11] Seeding Research & Knowledge Base Resources...");
  const SEED_RESEARCH = [
    {
      id: 'res_001',
      title: 'Next.js 16 App Router & Edge Server Rendering Best Practices',
      description: 'Comprehensive engineering guidelines on partial prerendering, streaming React 19 server components, and sub-100ms TTFB optimization.',
      category: 'Development',
      url: 'https://nextjs.org/docs',
      date: '2026-07-15',
      authorName: 'Arjun Swaminathan'
    },
    {
      id: 'res_002',
      title: 'B2B Enterprise SaaS Sales Playbook & Multi-Stakeholder Discovery',
      description: 'Systematic approach to handling enterprise procurement, legal review hurdles, and closing multi-year high ACV contracts.',
      category: 'Sales',
      url: 'https://hirushglobal.com/playbooks/sales',
      date: '2026-08-05',
      authorName: 'Siddharth Malhotra'
    },
    {
      id: 'res_003',
      title: 'Google Core Web Vitals 2026 & Interaction to Next Paint (INP)',
      description: 'Tactical guide to passing the INP metric on complex client single page applications and dynamic headless e-commerce storefronts.',
      category: 'SEO',
      url: 'https://web.dev/explore/core-web-vitals',
      date: '2026-08-22',
      authorName: 'Divya Iyer'
    },
    {
      id: 'res_004',
      title: 'Modern Workplace Ergonomics & Digital Attendance Governance',
      description: 'HR policy manual outlining biometric data confidentiality, geofencing privacy standards, and employee wellness initiatives.',
      category: 'HR',
      url: 'https://hirushglobal.com/hr/policies',
      date: '2026-09-10',
      authorName: 'Priya Nambiar'
    }
  ];

  for (const res of SEED_RESEARCH) {
    await setDoc(doc(db, 'research', res.id), {
      ...res,
      createdAt: new Date(`${res.date}T10:00:00Z`).toISOString()
    }, { merge: true });
  }
  console.log(`✓ Seeded ${SEED_RESEARCH.length} Knowledge Base Resources!`);

  console.log("\n=================================================");
  console.log("     3-MONTH ENTERPRISE SEEDING COMPLETE!        ");
  console.log("=================================================");
  console.log(`• Users & Staff Members:        ${createdUsers.length} (across 8 departments)`);
  console.log(`• 3-Month Attendance Records:   ${totalAttendanceRecords} (July - Oct 2026)`);
  console.log(`• 3-Month Leave Requests:       ${leaveCount} (Approved, Pending & Rejected)`);
  console.log(`• Holidays:                     ${SEED_HOLIDAYS.length} (2026 official calendar)`);
  console.log(`• Enterprise CRM Leads:         ${leadCount} (Active, Won, Proposals)`);
  console.log(`• CRM Lead Activities:          ${totalActivities} (Timeline of Meetings/Calls/Tasks)`);
  console.log(`• CRM Companies:                ${CRM_COMPANIES.length}`);
  console.log(`• Custom Domains Tracked:       ${SEED_DOMAINS.length} (with DNS/SSL health flags)`);
  console.log(`• Announcements / Messages:     ${SEED_MESSAGES.length} (across past 3 months)`);
  console.log(`• Research & Knowledge Items:   ${SEED_RESEARCH.length}`);
  console.log(`• Default Login Password:       ${defaultUserPassword}`);
  console.log(`• Super Admin:                  ${adminEmail} / ${adminPwd}`);
  console.log("=================================================\n");
}

seed().catch(err => {
  console.error("Seeder encountered fatal error:", err);
  process.exit(1);
});
