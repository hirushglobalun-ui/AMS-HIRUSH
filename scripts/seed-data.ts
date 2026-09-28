/**
 * File: scripts/seed-data.ts
 * Purpose: Enterprise Database Seeder for Hirush Global AMS
 * Seeds:
 *  1. Admin and Multi-Department Users (Development, SEO, Sales, Media, Product, HR, Management, Visitor)
 *  2. 30 Days (1 Month) of Realistic Attendance for each user
 *  3. CRM Leads (Sales Management / SM) with linked Activities, assigned Sales Reps, and Domain Tracking
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
    joiningDate: '2026-09-01',
    dob: '1985-09-14',
  },
];

async function seed() {
  console.log("=================================================");
  console.log("  HIRUSH GLOBAL AMS ENTERPRISE DATABASE SEEDER   ");
  console.log("=================================================");

  // Step 1: Sign in as Super Admin
  console.log("\n[Step 1/4] Authenticating as Admin...");
  const adminEmail = 'superadmin@hirush.com';
  const adminPwd = 'password123';
  const adminCred = await signInWithEmailAndPassword(auth, adminEmail, adminPwd);
  console.log(`✓ Authenticated as ${adminEmail} (UID: ${adminCred.user.uid})`);

  // Step 2: Create / Sync Users
  console.log("\n[Step 2/4] Seeding users across all 8 departments...");
  const createdUsers: { uid: string; name: string; department: string; role: string }[] = [];

  // Also push admin
  createdUsers.push({
    uid: adminCred.user.uid,
    name: 'Super Admin',
    department: 'Management',
    role: 'Admin'
  });

  const defaultUserPassword = 'password123';

  for (const u of SEED_USERS) {
    let uid = '';
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, u.email, defaultUserPassword);
      uid = cred.user.uid;
      console.log(`  + Created Auth account for ${u.name} (${u.email}) [${u.department}]`);
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-in-use') {
        try {
          const cred = await signInWithEmailAndPassword(secondaryAuth, u.email, defaultUserPassword);
          uid = cred.user.uid;
          console.log(`  ~ Reusing existing Auth account for ${u.name} (${u.email})`);
        } catch {
          uid = `user_${u.employeeId.toLowerCase()}`;
          console.log(`  ! Using fallback uid for ${u.name}`);
        }
      } else {
        uid = `user_${u.employeeId.toLowerCase()}`;
      }
    }

    // Write profile to Firestore
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
    };

    await setDoc(doc(db, 'users', uid), userProfile);
    createdUsers.push({ uid, name: u.name, department: u.department, role: u.role });
  }

  console.log(`✓ Total ${createdUsers.length} staff members ready in Firestore!`);

  // Step 3: Seed 1 Month (Past 30 Days) Attendance
  console.log("\n[Step 3/4] Generating 30 days of realistic attendance for all staff...");
  const today = new Date('2026-09-28T12:00:00Z');
  let attendanceCount = 0;

  const eligibleUsers = createdUsers.filter(u => u.role !== 'Visitor');

  // We batch writes in chunks of 300
  let batch = writeBatch(db);
  let batchOps = 0;

  for (let i = 30; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday

    // Skip Sundays
    if (dayOfWeek === 0) continue;

    // Alternate Saturdays off
    if (dayOfWeek === 6 && d.getDate() % 2 === 0) continue;

    for (const user of eligibleUsers) {
      // 95% attendance probability
      const isAbsent = Math.random() < 0.05;
      if (isAbsent) continue;

      // Realistic random checkIn: between 08:50 and 09:35
      const inHour = 8 + Math.floor(Math.random() * 2);
      const inMin = inHour === 8 ? 50 + Math.floor(Math.random() * 10) : Math.floor(Math.random() * 35);
      const inSec = Math.floor(Math.random() * 60);
      const checkInStr = `${String(inHour).padStart(2, '0')}:${String(inMin).padStart(2, '0')}:${String(inSec).padStart(2, '0')}`;

      // Realistic random checkOut: between 18:00 and 19:30
      const outHour = 18 + (Math.random() < 0.35 ? 1 : 0);
      const outMin = outHour === 18 ? Math.floor(Math.random() * 60) : Math.floor(Math.random() * 30);
      const outSec = Math.floor(Math.random() * 60);
      const checkOutStr = `${String(outHour).padStart(2, '0')}:${String(outMin).padStart(2, '0')}:${String(outSec).padStart(2, '0')}`;

      // Calculate total hours
      const [hIn, mIn, sIn] = checkInStr.split(':').map(Number);
      const [hOut, mOut, sOut] = checkOutStr.split(':').map(Number);
      const diffMs = (hOut * 3600 + mOut * 60 + sOut) - (hIn * 3600 + mIn * 60 + sIn);
      const totalHours = parseFloat((diffMs / 3600).toFixed(2));

      // Occasional WFH
      const isWfh = (user.department === 'Development' || user.department === 'SEO' || user.department === 'Product') && Math.random() < 0.12;

      const recordId = `att_${user.uid}_${dateStr}`;
      const session: any = {
        id: `s_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        checkIn: checkInStr,
        checkOut: checkOutStr,
        autoCheckedOut: false,
        isManuallyEdited: false,
        biometricVerified: true,
        isWFH: isWfh,
        location: {
          latitude: 19.0760 + (Math.random() - 0.5) * 0.01,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
          accuracy: 10 + Math.floor(Math.random() * 8)
        },
        checkOutLocation: {
          latitude: 19.0760 + (Math.random() - 0.5) * 0.01,
          longitude: 72.8777 + (Math.random() - 0.5) * 0.01,
          accuracy: 12
        }
      };

      if (isWfh) {
        session.wfhStatus = 'approved';
      }

      const attendanceRecord: any = {
        userId: user.uid,
        date: dateStr,
        sessions: [session],
        totalHours: totalHours,
        isWFH: isWfh,
        isManuallyEdited: false
      };

      if (isWfh) {
        attendanceRecord.wfhStatus = 'approved';
      }

      batch.set(doc(db, 'attendance', recordId), attendanceRecord);
      batchOps++;
      attendanceCount++;

      if (batchOps >= 350) {
        await batch.commit();
        batch = writeBatch(db);
        batchOps = 0;
        process.stdout.write(`.`);
      }
    }
  }

  if (batchOps > 0) {
    await batch.commit();
  }

  console.log(`\n✓ Seeded ${attendanceCount} attendance records across past 30 days!`);

  // Step 4: Seed CRM Leads (Sales Management / SM)
  console.log("\n[Step 4/4] Seeding CRM Leads in Sales / SM with Activities...");
  
  const salesUsers = createdUsers.filter(u => u.department === 'Sales');
  const getSalesUid = (idx: number) => salesUsers[idx % salesUsers.length]?.uid || adminCred.user.uid;

  const SEED_LEADS = [
    {
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
      firstStartDate: '2026-08-10',
      workCommencementDate: '2026-08-25',
      expiryDate: '2027-08-25',
      domainDetail: 'https://shop.apexhorizon.com',
      department: ['Sales', 'Development', 'Product'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 184,
      remark: 'High-value enterprise tier. Phase 1 storefront successfully delivered.',
      activities: [
        { type: 'Meeting', title: 'Sprint Review & Demo', description: 'Presented storefront wireframes and product sync API.', completed: true, scheduledAt: '2026-08-28T14:00:00Z' },
        { type: 'Call', title: 'Payment Gateway Integration Check', description: 'Aligned with Razorpay enterprise team for escrow payout.', completed: true, scheduledAt: '2026-09-12T11:30:00Z' },
        { type: 'Task', title: 'Deliver UAT Build to Client', description: 'Deploy staging build on Vercel preview domain.', completed: false, scheduledAt: '2026-09-30T17:00:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-09-02',
      workCommencementDate: '2026-10-05',
      expiryDate: '2027-10-05',
      domainDetail: 'https://invest.kavericapital.in',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 220,
      remark: 'Proposal sent for ₹18,50,000. Client legal team reviewing NDA.',
      activities: [
        { type: 'Email', title: 'Commercial Proposal & Scope Dispatch', description: 'Sent detailed PDF proposal with milestone architecture.', completed: true, scheduledAt: '2026-09-15T10:00:00Z' },
        { type: 'Call', title: 'Follow-up with Managing Partner', description: 'Discuss SLA terms and multi-tenant security architecture.', completed: false, scheduledAt: '2026-09-29T16:00:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-06-15',
      workCommencementDate: '2026-07-01',
      expiryDate: '2027-07-01',
      domainDetail: 'https://portal.anandcare.org',
      department: ['Sales', 'Development', 'Product'],
      assignedTo: getSalesUid(2),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 290,
      remark: 'Production release live. Maintenance contract signed for 12 months.',
      activities: [
        { type: 'Meeting', title: 'Go-Live Handover & Training', description: 'Trained 45 hospital staff members on patient queuing.', completed: true, scheduledAt: '2026-08-30T10:00:00Z' },
        { type: 'Task', title: 'Q3 Maintenance Review & Security Scan', description: 'Run OWASP security audit on patient record storage.', completed: true, scheduledAt: '2026-09-20T12:00:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-08-20',
      workCommencementDate: '2026-09-01',
      expiryDate: '2027-03-01',
      domainDetail: 'https://starlight-logistics.com',
      department: ['Sales', 'SEO', 'Media'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 110,
      remark: 'SEO audit completed. 15 target commercial keywords identified.',
      activities: [
        { type: 'Call', title: 'Keyword Strategy Alignment', description: 'Reviewed top 20 high-intent shipping keywords for EU market.', completed: true, scheduledAt: '2026-09-05T15:30:00Z' },
        { type: 'Task', title: 'Publish 8 Technical Whitepapers & Backlinks', description: 'Outreach to freight tech blogs for guest publications.', completed: false, scheduledAt: '2026-10-02T18:00:00Z' },
      ]
    },
    {
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
      workCommencementDate: '',
      expiryDate: '2027-09-18',
      domainDetail: 'https://hyperionresorts.in',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 75,
      remark: 'Cold lead converted from LinkedIn outreach. Awaiting product demo date.',
      activities: [
        { type: 'Call', title: 'Introductory Discovery Call', description: 'Assessed existing legacy Micros Oracle POS pain points.', completed: true, scheduledAt: '2026-09-22T11:00:00Z' },
        { type: 'Meeting', title: 'Live Product Demo for General Manager', description: 'Showcase table reservation and QR billing module.', completed: false, scheduledAt: '2026-09-30T14:00:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-08-15',
      workCommencementDate: '2026-09-10',
      expiryDate: '2027-09-10',
      domainDetail: 'https://biocleansolar.com',
      department: ['Sales', 'Development'],
      assignedTo: getSalesUid(2),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 140,
      remark: 'Client budget frozen till Q4 board meeting. Re-engage on Oct 15.',
      activities: [
        { type: 'Call', title: 'Budget Status Check-in', description: 'Client confirmed budget sanction moved to next quarter.', completed: true, scheduledAt: '2026-09-14T10:30:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-09-01',
      workCommencementDate: '2026-09-12',
      expiryDate: '2027-03-12',
      domainDetail: 'https://zephyrmobility.com',
      department: ['Sales', 'Media'],
      assignedTo: getSalesUid(0),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 245,
      remark: '3D vehicle rendering in progress. Storyboard approved.',
      activities: [
        { type: 'Meeting', title: 'Storyboard Review', description: 'Approved 60s teaser storyboard and sound design.', completed: true, scheduledAt: '2026-09-16T15:00:00Z' },
        { type: 'Task', title: 'Deliver First Cut Render', description: 'Render 4K Blender scenes with automotive lighting.', completed: false, scheduledAt: '2026-10-01T19:00:00Z' },
      ]
    },
    {
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
      firstStartDate: '2026-09-10',
      workCommencementDate: '2026-10-15',
      expiryDate: '2027-10-15',
      domainDetail: 'https://zenithlogistics.com',
      department: ['Sales', 'Product', 'Development'],
      assignedTo: getSalesUid(1),
      dnsStatus: 'Healthy',
      sslStatus: 'Healthy',
      sslDaysLeft: 198,
      remark: 'Proposal sent with multi-warehouse dashboard architecture.',
      activities: [
        { type: 'Email', title: 'SLA and Scope Document Sent', description: 'Dispatched complete requirements traceability matrix.', completed: true, scheduledAt: '2026-09-21T09:30:00Z' },
      ]
    }
  ];

  let leadCount = 0;
  let activityCount = 0;

  for (const lead of SEED_LEADS) {
    const { activities, ...leadData } = lead;
    const leadRef = await addDoc(collection(db, 'leads'), {
      ...leadData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    leadCount++;

    for (const act of activities) {
      await addDoc(collection(db, 'leadActivities'), {
        leadId: leadRef.id,
        type: act.type,
        title: act.title,
        description: act.description,
        scheduledAt: act.scheduledAt,
        completed: act.completed,
        createdAt: new Date().toISOString()
      });
      activityCount++;
    }
  }

  console.log(`✓ Seeded ${leadCount} CRM leads and ${activityCount} lead activities!`);

  // Seed CRM Companies
  const crmCompanies = ['Apex Horizon Global', 'Kaveri Capital Advisory', 'Anand Care Hospitals', 'Starlight Sustainable Logistics', 'Apollo Hospitality Group', 'Zephyr Auto Corp', 'Zenith Logistics International'];
  for (const comp of crmCompanies) {
    await setDoc(doc(db, 'crm_companies', comp.toLowerCase().replace(/[^a-z0-9]/g, '_')), {
      name: comp,
      createdAt: new Date().toISOString()
    });
  }

  console.log("\n=================================================");
  console.log("             SEEDING COMPLETED SUCCESSFULLY!     ");
  console.log("=================================================");
  console.log(`• Users created across 8 departments: ${createdUsers.length}`);
  console.log(`• 1-Month Attendance records created: ${attendanceCount}`);
  console.log(`• CRM Leads created with activities: ${leadCount}`);
  console.log(`• Default Login Password for all:   ${defaultUserPassword}`);
  console.log(`• Super Admin: superadmin@hirush.com / password123`);
  console.log("=================================================\n");
}

seed().catch(err => {
  console.error("Seeder encountered fatal error:", err);
  process.exit(1);
});
