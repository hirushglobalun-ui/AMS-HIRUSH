# HIRUSH GLOBAL AMS (Attendance & Enterprise Management System)
## Complete Technical Architecture & Codebase Documentation Manual

**Project Name:** Hirush Global AMS / EMS  
**Framework:** Next.js 16 (App Router with Turbopack)  
**Core Technologies:** React 19, TypeScript 5.8, Tailwind CSS 3.4, Firebase v12 (Auth, Firestore), WebAuthn (FIDO2), Leaflet 1.9.4, PWA  
**System Version:** 2.0.0 (Native Next.js Production Release)  
**Last Updated:** September 2026  

---

## 1. Executive System Overview

Hirush Global AMS is an enterprise-grade Attendance and Enterprise Management System purpose-built for **Hirush Global LLP**. It unifies HR operations, attendance tracking with hardware-level biometric verification and GPS geofencing, leave workflows, employee credential issuance, client CRM, and enterprise domain health monitoring into a single unified application.

### Key Capabilities & Workflows
1. **Multi-Tier Role-Based Access Control (RBAC):** Seven distinct permission tiers:
   - **Super Admin & Admin:** Full system authority, geofence configuration, user CRUD, device approval, CRM oversight, audit trails.
   - **HR (Human Resources):** Employee directory administration, leave approval/rejection, attendance auditing, holiday calendar management, broadcast messaging.
   - **Employee & Intern:** Biometric self-check-in, GPS-validated attendance, WFH requests, leave applications, downloadable digital ID card, company announcements.
   - **Sales:** Specialized access to B2B Lead CRM, lead activities, calendar, Google Sheets webhook synchronization, and client domain monitoring.
   - **Visitor:** Restricted read-only view of organization directory, self-profile, and public announcements.
2. **Biometric Anti-Buddy Punching (WebAuthn / FIDO2):** Leverages device hardware authenticators (Fingerprint / Touch ID / Face ID) via the browser's `navigator.credentials` API. Up to 3 fingerprint slots per employee with administrative approval workflows.
3. **GPS Geofencing & Work From Home (WFH):** Haversine spherical distance calculations determine if an employee is physically located within the office perimeter. Includes department-based bypass rules (e.g. Media/Developers) and explicit WFH request submissions.
4. **Leave Management Engine:** Automated leave balance deductions, multi-day and half-day duration support, automatic exclusion of Sundays and public holidays from deductions, and protection against deducting days on which the employee physically worked.
5. **B2B Lead Management CRM:** Comprehensive sales pipeline tracking (Pending, Ongoing, Completed, On Hold, Proposal Sent, Disposed), activity logs (Tasks, Calls, Meetings, Emails, Notes), Google Sheets real-time webhook sync, and Excel/CSV bulk import/export.
6. **Domain & Hosting Health Monitor:** Tracks domain expirations, runs automated DNS and SSL validity checks, generates preformatted WhatsApp notifications, and automates email alerts via EmailJS.
7. **Digital ID Card Issuance:** Client-side vector rendering of employee badges with company branding, employee details, and dynamic QR verification codes, exportable as high-resolution PNGs via `html2canvas`.
8. **Progressive Web App (PWA):** Offline asset caching, service worker lifecycle management, and standalone installation prompts for mobile and desktop environments.

---

## 2. Technology Stack & Dependencies

```text
HIRUSH GLOBAL AMS TECHNOLOGY STACK
├── Framework: Next.js 16.3.6 (App Router, Turbopack)
├── UI Layer: React 19.2.0, React DOM 19.2.0
├── Language: TypeScript 5.8.2 (Strict Mode)
├── Styling: Tailwind CSS 3.4.19, PostCSS 8.5.28, Autoprefixer 10.6.1
├── Icons: Lucide React 0.548.0
├── Backend & Database: Firebase 12.4.0 (Authentication, Cloud Firestore)
├── Cloud Administration: Firebase Admin 14.3.0
├── Hardware & Sensors: WebAuthn (FIDO2 / navigator.credentials), Browser Geolocation API
├── Mapping & GIS: Leaflet 1.9.4, React-Leaflet 5.0.0
├── Storage & Uploads: @vercel/blob 2.0.0
├── Data & Reports: SheetJS (xlsx 0.18.5), PapaParse 5.5.4
├── Image Generation: html2canvas 1.4.1
├── AI & Documents: Google GenAI SDK (@google/genai 1.27.0)
├── Messaging & Alerts: @emailjs/browser 4.4.1, Nodemailer 10.0.1
├── Charts & KPIs: Recharts 3.8.1
├── UI Feedback: react-hot-toast 2.6.0
└── Test Suite: tsx 4.19.3, Node.js Native Test Runner (node:test, node:assert)
```

---

## 3. Complete Code Structure & Visual Directory Tree

```text
ams/
├── .env.example                             # Environment variable template
├── .firebaserc                              # Firebase project environment mapping
├── .gitignore                               # Git ignored paths and build artifacts
├── eslint.config.js                         # ESLint 9 configuration
├── firebase.json                            # Firebase rules & hosting setup
├── firebase.ts                              # Firebase Client SDK initialization
├── firestore.rules                          # Cloud Firestore RBAC rules
├── global.d.ts                              # Ambient TypeScript declarations
├── index.css                                # Global Tailwind CSS base & utilities
├── metadata.json                            # System metadata
├── next.config.mjs                          # Next.js configuration
├── next-env.d.ts                            # Next.js type declarations
├── package.json                             # NPM scripts and dependencies
├── package-lock.json                        # Locked dependencies tree
├── postcss.config.js                        # PostCSS configuration
├── README.md                                # Project summary & quickstart
├── setup-windows-scheduler.bat              # Task scheduler batch script
├── tailwind.config.js                       # Tailwind CSS color tokens & theme
├── tsconfig.json                            # TypeScript configuration
├── types.ts                                 # Global TypeScript types & enums
│
├── documentation/                           # Master Documentation Suite
│   ├── INDEX.md                             # Documentation index & reading paths
│   ├── PROJECT_DOCUMENTATION.md             # Complete project manual & catalog (this document)
│   ├── ARCHITECTURE.md                      # Framework architecture & SSR hydration guide
│   ├── ROUTE_MIGRATION.md                   # App Router route mapping & RBAC matrix
│   ├── MIGRATION_AUDIT.md                   # Vite-to-Next.js migration log & handover audit
│   ├── ENVIRONMENT.md                       # Environment variables configuration matrix
│   ├── TESTING.md                           # Automated test suite & quality gate records
│   └── DEPLOYMENT.md                        # Production hosting deployment playbook
│
├── app/                                     # Next.js Native App Router
│   ├── globals.css                          # App-wide styles
│   ├── layout.tsx                           # Master HTML & AuthProvider shell
│   ├── page.tsx                             # Root landing / role-aware router
│   ├── attendance/                          # Attendance route
│   │   └── page.tsx                         # /attendance
│   ├── biometrics/                          # Biometrics management route
│   │   └── page.tsx                         # /biometrics
│   ├── crm/                                 # B2B Lead CRM route
│   │   └── page.tsx                         # /crm
│   ├── dashboard/                           # Main dashboard route
│   │   └── page.tsx                         # /dashboard
│   ├── domains/                             # Domain & hosting monitor route
│   │   └── page.tsx                         # /domains
│   ├── holidays/                            # Holidays calendar route
│   │   └── page.tsx                         # /holidays
│   ├── leave/                               # Leave management route
│   │   └── page.tsx                         # /leave
│   ├── login/                               # Authentication route
│   │   └── page.tsx                         # /login
│   ├── messages/                            # Real-time messages route
│   │   └── page.tsx                         # /messages
│   ├── profile/                             # Employee profile & ID card route
│   │   └── page.tsx                         # /profile
│   ├── settings/                            # Geofence & admin settings route
│   │   └── page.tsx                         # /settings
│   ├── setup/                               # First-time Super Admin setup
│   │   └── page.tsx                         # /setup
│   └── users/                               # Team directory route
│       └── page.tsx                         # /users
│
├── components/                              # Modular Component System
│   ├── Login.tsx                            # Primary login component
│   │
│   ├── layout/                              # Layout Shell & Navigation
│   │   ├── AuthGuard.tsx                    # Client-side RBAC guard
│   │   ├── DashboardLayout.tsx              # Master layout (sidebar, header, content)
│   │   └── navConfig.ts                     # Navigation definitions & allowed roles
│   │
│   ├── common/                              # Reusable Atomic UI Elements
│   │   ├── Button.tsx                       # Variant button (primary, outline, danger)
│   │   ├── Card.tsx                         # Surface container
│   │   ├── DocumentUploadField.tsx          # Drag-and-drop file uploader
│   │   ├── FormInput.tsx                    # Form field with label & validation
│   │   ├── Header.tsx                       # Dashboard top bar & notifications
│   │   ├── Modal.tsx                        # Accessible dialog backdrop modal
│   │   ├── PWAInstallPrompt.tsx             # PWA installation banner
│   │   ├── SplashScreen.tsx                 # Animated auth splash screen
│   │   └── SWRegister.tsx                   # Service worker registration component
│   │
│   ├── setup/                               # System Onboarding
│   │   └── FirstTimeSetup.tsx               # Super Admin creation wizard
│   │
│   ├── admin/                               # Super Admin & Admin Views
│   │   ├── AdminSettings.tsx                # Geofence Leaflet map & bypass config
│   │   ├── Dashboard.tsx                    # Master executive KPI overview
│   │   ├── IDCard.tsx                       # Digital ID card renderer & PNG exporter
│   │   ├── ManageHolidays.tsx               # Holiday calendar manager
│   │   ├── ManageMessages.tsx               # Announcement broadcast console
│   │   ├── ManageUsers.tsx                  # User administration & role assignment
│   │   ├── Profile.tsx                      # Administrator personal profile
│   │   │
│   │   ├── biometrics/                      # Biometrics Sub-Module (<200 lines)
│   │   │   ├── BiometricFilterBar.tsx       # Search and department filter controls
│   │   │   ├── BiometricModeCard.tsx        # Mode policy card (GPS vs Biometric)
│   │   │   ├── BiometricStatsCards.tsx      # Device statistics cards
│   │   │   ├── BiometricUserRow.tsx         # User row & slot approval buttons
│   │   │   ├── ManageBiometrics.tsx         # Master orchestrator view
│   │   │   ├── types.ts                     # Biometric component types
│   │   │   └── useBiometricsData.ts         # Biometrics state & approval actions hook
│   │   │
│   │   └── crm/                             # Lead CRM Sub-Module (<200 lines)
│   │       ├── GlobalLeadCalendar.tsx       # Calendar for tasks and meetings
│   │       ├── ImportLeadsModal.tsx         # CSV bulk import wizard
│   │       ├── LeadActivityManager.tsx      # Activity timeline (Calls, Tasks, Notes)
│   │       ├── LeadCategoryTabs.tsx         # Company vs Raw Scraped switcher
│   │       ├── LeadDetailView.tsx           # Lead metadata slide-over
│   │       ├── LeadFormClientSection.tsx    # Client contact form section
│   │       ├── LeadFormGeneralSection.tsx   # Status and scheduling section
│   │       ├── LeadFormModal.tsx            # Multi-section lead edit modal
│   │       ├── LeadFormProjectSection.tsx   # Project & POC form section
│   │       ├── leadFormUtils.ts             # Validation helpers & initial states
│   │       ├── LeadStatsCards.tsx           # Sales pipeline metric cards
│   │       ├── LeadTable.tsx                # Responsive CRM data table
│   │       ├── ManageLeads.tsx              # Master CRM orchestrator view
│   │       └── useManageLeadsData.ts        # Lead queries & Google Sheets hook
│   │
│   ├── hr/                                  # Human Resources Views
│   │   ├── Dashboard.tsx                    # HR dashboard (attendance, leave queue)
│   │   ├── HRSettings.tsx                   # Office boundary settings view
│   │   ├── ManageMessages.tsx               # HR announcement console
│   │   ├── ManageUsers.tsx                  # HR team directory management
│   │   └── Profile.tsx                      # HR personal profile
│   │
│   ├── user/                                # Employee & Intern Views
│   │   ├── Attendance.tsx                   # Employee attendance hub
│   │   ├── Holidays.tsx                     # Employee holiday calendar
│   │   ├── Leave.tsx                        # Employee leave hub
│   │   ├── Messages.tsx                     # Employee notice board & alerts
│   │   ├── Profile.tsx                      # Employee profile & digital ID badge
│   │   ├── UserHome.tsx                     # Employee home landing
│   │   │
│   │   ├── attendance/                      # Employee Attendance Sub-Module
│   │   │   ├── AttendanceCheckIn.tsx        # Punch clock, WebAuthn & GPS validator
│   │   │   ├── AttendanceDetailModal.tsx    # Session breakdown modal
│   │   │   ├── AttendanceTimeline.tsx       # Daily visual punch timeline
│   │   │   ├── LeaveQuotaTracker.tsx        # Progress meters for leave balances
│   │   │   ├── useAttendanceActions.ts      # Punch-in/out and WFH action hook
│   │   │   ├── useAttendanceStats.ts        # Monthly metrics calculation hook
│   │   │   └── utils.ts                     # Haversine distance & session math
│   │   │
│   │   ├── home/                            # Employee Home Widgets
│   │   │   ├── HomeAnnouncementsWidget.tsx  # Carousel of recent notices
│   │   │   ├── HomeAttendanceWidget.tsx     # Quick punch shortcut & today's hours
│   │   │   ├── HomeCelebrationsWidget.tsx   # Birthdays and work anniversaries
│   │   │   └── useUserHomeData.ts           # Home feed state and subscription hook
│   │   │
│   │   └── leave/                           # Employee Leave Sub-Module
│   │       ├── LeaveApplyForm.tsx           # Leave submission form
│   │       ├── LeaveHistoryTable.tsx        # Submitted requests table
│   │       ├── LeaveQuotaSummaryCards.tsx   # Quota balance cards
│   │       ├── leaveUtils.ts                # Working days & deduction math
│   │       └── useLeaveData.ts              # Leave applications & quotas hook
│   │
│   └── shared/                              # Shared Enterprise Features
│       ├── DomainManager.tsx                # Enterprise domain monitor orchestrator
│       ├── DomainManager/                   # Domain Manager Sub-Module
│       │   ├── DomainCard.tsx               # Domain card with health indicators
│       │   ├── DomainFilterBar.tsx          # Search & status filter controls
│       │   ├── DomainModal.tsx              # Add/edit custom domain modal
│       │   ├── DomainStatsCards.tsx         # Domain summary statistics
│       │   ├── domainUtils.ts               # Days remaining & WhatsApp link math
│       │   ├── types.ts                     # Domain component types
│       │   └── useDomainData.ts             # Domain query & health audit hook
│       │
│       ├── ManageAttendance/                # Attendance Management Sub-Module
│       │   ├── AttendanceDetailModal.tsx    # Punch session breakdown dialog
│       │   ├── AttendanceOverviewCards.tsx  # Executive overview cards
│       │   ├── AttendanceTable.tsx          # Full team attendance table
│       │   ├── EditAttendanceModal.tsx      # Admin manual timestamp adjustment
│       │   ├── index.tsx                    # Attendance management orchestrator
│       │   ├── useManageAttendanceData.ts   # Filter, date, and query hook
│       │   └── utils.ts                     # Format hours to HH:MM:SS
│       │
│       ├── ManageLeave/                     # Leave Administration Sub-Module
│       │   ├── index.tsx                    # Leave admin container
│       │   ├── LeaveActionModal.tsx         # Approve / reject dialog with remarks
│       │   ├── LeaveDetailModal.tsx         # Full leave request detail view
│       │   ├── LeaveTable.tsx               # Multi-status leave requests table
│       │   └── utils.ts                     # Leave status badge color helpers
│       │
│       ├── UserDetailView/                  # Deep-Dive Employee Drawer
│       │   ├── AttendanceTab.tsx            # Personal attendance calendar tab
│       │   ├── index.tsx                    # Slide-over profile drawer shell
│       │   ├── PersonalInfoTab.tsx          # Bank, emergency contacts, documents
│       │   ├── UserHeader.tsx               # Avatar, designation, status pill
│       │   └── utils.ts                     # Monthly attendance rate calculations
│       │
│       ├── user-modals/                     # Shared User Dialogs
│       │   ├── IDCardModal.tsx              # Digital ID badge preview & download
│       │   ├── UserDeleteModal.tsx          # Safe user deletion confirmation
│       │   └── UserFormModal.tsx            # Multi-tab user onboarding modal
│       │
│       └── user-tables/                     # Shared User Tables
│           ├── ManageUsersStats.tsx         # Staff counts summary
│           └── UsersTable.tsx               # Paginated employee directory table
│
├── contexts/                                # State Contexts
│   └── AuthContext.tsx                      # Global session & SSR-safe hydration
│
├── hooks/                                   # Application Custom Hooks
│   ├── useNotifications.ts                  # Real-time messages & unread counter
│   └── usePWAInstall.ts                     # PWA install prompt handler
│
├── services/                                # Business Logic & External Services
│   ├── auditService.ts                      # Immutable audit logging to Firestore
│   ├── blobService.ts                       # Document uploads via Vercel Blob
│   ├── crmService.ts                        # Lead CRUD & Google Sheets webhook sync
│   ├── dataService.ts                       # Paginated Firestore operations
│   ├── exportService.ts                     # Excel/CSV generation via SheetJS
│   └── geminiService.ts                     # AI SRS generation via Google GenAI SDK
│
├── utils/                                   # Core Pure Utilities
│   ├── biometricService.ts                  # WebAuthn hardware registration & verify
│   ├── userUtils.ts                         # User display formatting helpers
│   └── wfhHelper.ts                         # Haversine distance & geofence validation
│
├── tests/                                   # Automated Unit Test Suite
│   ├── attendance.test.ts                   # 8h workday, split shifts, auto-checkout
│   ├── domain.test.ts                       # Expiry countdown & boundary timezone math
│   ├── geofence.test.ts                     # Haversine distance & perimeter checks
│   └── leave.test.ts                        # Half-day, multi-day, holiday exemptions
│
├── public/                                  # Static Assets & PWA
│   ├── generate-icons.html                  # Icon generator utility
│   ├── manifest.json                        # PWA Web App Manifest
│   ├── pwa-192x192.svg                      # PWA compact icon
│   ├── pwa-512x512.svg                      # PWA high-res icon
│   ├── sw.js                                # Network-First service worker
│   └── assets/                              # Brand logos and favicons
│
├── scripts/                                 # Operational & Diagnostics Scripts
│   └── auto-domain-checker.js               # Scheduled domain DNS/SSL auditor
│
└── functions/                               # Cloud Backend
    ├── package.json                         # Cloud Functions dependencies
    ├── tsconfig.json                        # Functions TypeScript configuration
    └── src/
        └── index.ts                         # Scheduled crons for auto-checkout & alerts
```

---

## 4. Layered System Architecture & Data Flow

```text
+---------------------------------------------------------------------------------------+
|                                1. PRESENTATION LAYER                                  |
|  - Next.js 16 App Router (/dashboard, /attendance, /leave, /crm, /domains, etc.)      |
|  - Tailwind CSS 3.4 Responsive Design (Dark/Light Modes, Desktop Sidebar, Mobile Draw)|
|  - Client Components ("use client"): WebAuthn, Leaflet Maps, html2canvas, Recharts    |
|  - Server Layout (app/layout.tsx): SEO Metadata, Viewport, Inter Font, Service Worker |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                             2. ROUTING & ACCESS CONTROL                               |
|  - AuthGuard.tsx: Intercepts unauthorized route access and redirects by role          |
|  - navConfig.ts: Centralized role-based navigation dictionary                         |
|  - DashboardLayout.tsx: Frame containing Header, Mobile Navigation, and Sidebar       |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                             3. STATE & SUBSCRIPTION LAYER                             |
|  - AuthContext.tsx: Firebase Auth listener, SSR-safe hydration, User session memory   |
|  - useNotifications.ts: Real-time onSnapshot listener for messages and unread counter|
|  - Domain, CRM, Attendance & Leave Custom Hooks (Encapsulated state & mutations)      |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                            4. BUSINESS LOGIC & SERVICES                               |
|  - dataService.ts: Centralized Firestore queries, user CRUD, batch attendance writes  |
|  - crmService.ts: Lead management, activity logs, asynchronous Google Sheets webhook  |
|  - biometricService.ts: WebAuthn FIDO2 navigator.credentials creation & authentication|
|  - wfhHelper.ts / utils.ts: Haversine geodesic distance validation & work credit math |
|  - exportService.ts: SheetJS (.xlsx/.csv) generation                                  |
|  - blobService.ts: Vercel Blob storage integration                                    |
|  - geminiService.ts: Google GenAI SDK integration                                     |
|  - auditService.ts: Immutable security audit log recorder                             |
+------------------------------------------+--------------------------------------------+
                                           |
                                           v
+---------------------------------------------------------------------------------------+
|                         5. PERSISTENCE & HARDWARE INTEGRATIONS                        |
|  - Cloud Firestore: 11 Collections guarded by strict firestore.rules                  |
|  - Firebase Authentication: Primary + Secondary apps for non-destructive user creation|
|  - Platform Biometric Sensor: Windows Hello, Apple Touch ID/Face ID, Android Sensors   |
|  - Device Geolocation: navigator.geolocation GPS coordinate validation                |
|  - External APIs: EmailJS, WhatsApp URL Scheme, Vercel Blob, Google Sheets Webhook    |
+---------------------------------------------------------------------------------------+
```

---

## 5. Master Directory & File Catalog

Below is the complete, exhaustive catalog of every source file in the repository, organized by folder with exact relative paths, line counts, and technical responsibilities.

### 5.1. Project Root & Configuration Files


| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `package.json` | 51 | Project metadata, build scripts (`dev`, `build`, `start`, `test`), and dependencies. |
| `package-lock.json` | 9,831 | Locked dependency tree ensuring deterministic installations across environments. |
| `tsconfig.json` | 42 | TypeScript compiler configuration (strict mode, path alias `@/*`, Next.js plugin). |
| `next.config.mjs` | 10 | Next.js configuration (Turbopack optimization, image domains, headers). |
| `tailwind.config.js` | 40 | Tailwind CSS configuration, custom color palette (`hirush-navy`, `hirush-gold`), animations. |
| `postcss.config.js` | 6 | PostCSS plugin declarations (`tailwindcss`, `autoprefixer`). |
| `eslint.config.js` | 34 | ESLint 9 configuration with React and TypeScript linting rules. |
| `firebase.ts` | 39 | Primary and Secondary Firebase Client SDK initialization with environment fallbacks. |
| `firebase.json` | 22 | Firebase hosting and Cloud Firestore rules deployment definitions. |
| `firestore.rules` | 167 | Cloud Firestore security rules enforcing strict role-based collection permissions. |
| `.firebaserc` | 5 | Firebase project target identifier (`hirush-global-ams`). |
| `.gitignore` | 29 | Version control exclusions (dependencies, `.next`, `.tsbuildinfo`, environment files). |
| `global.d.ts` | 27 | Ambient TypeScript declarations for WebAuthn, Leaflet, and PWA events. |
| `next-env.d.ts` | 7 | Next.js generated type declarations. |
| `types.ts` | 263 | Global TypeScript domain models, enums (`Role`, `LeaveType`, `LeadStatus`), and interfaces. |
| `index.css` | 48 | Global Tailwind base, components, utilities, and custom scrollbar definitions. |
| `setup-windows-scheduler.bat`| 16 | Windows Task Scheduler batch script for automated daily domain health audits. |

---

### 3.2. Next.js App Router (`app/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `app/layout.tsx` | 49 | Root HTML layout, Inter font import, PWA viewport meta tags, and `AuthProvider` wrapper. |
| `app/globals.css` | 48 | App-wide Tailwind and custom responsive CSS rules. |
| `app/page.tsx` | 31 | Root entry point; evaluates authentication state and directs to role-based dashboard. |
| `app/login/page.tsx` | 28 | Dedicated authentication page for unauthenticated users. |
| `app/setup/page.tsx` | 23 | First-time installation and Super Admin creation route. |
| `app/dashboard/page.tsx` | 33 | Role-based dashboard shell; renders Admin, HR, or User KPI views. |
| `app/attendance/page.tsx` | 30 | Attendance tracking, GPS validation, biometrics, and history logs. |
| `app/leave/page.tsx` | 34 | Leave quota overview, leave application form, and approval tables. |
| `app/users/page.tsx` | 32 | Team directory, user creation modal, document viewer, and profile editor. |
| `app/biometrics/page.tsx` | 20 | WebAuthn hardware registration, device management, and approval panel. |
| `app/messages/page.tsx` | 34 | System announcements, real-time message broadcasting, and department targeting. |
| `app/crm/page.tsx` | 36 | B2B Lead CRM, pipeline categorization, activity calendar, and Google Sheets sync. |
| `app/domains/page.tsx` | 36 | Enterprise domain expiry tracker, DNS/SSL status, and automated alert trigger. |
| `app/settings/page.tsx` | 20 | Office GPS geofencing radius, coordinate configuration, and bypass settings. |
| `app/holidays/page.tsx` | 34 | Company holiday calendar, national holidays, and leave planning. |
| `app/profile/page.tsx` | 32 | Personal profile settings, document uploads, and digital ID card export. |

---

### 3.3. Navigation & Layout Components (`components/layout/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/layout/DashboardLayout.tsx` | 239 | Master application frame: desktop sidebar, mobile header, hamburger menu, notification popup, and user badge. |
| `components/layout/AuthGuard.tsx` | 59 | Client-side security wrapper checking authentication status, redirecting unauthorized roles. |
| `components/layout/navConfig.ts` | 70 | Centralized navigation configuration mapping routes, labels, icons, and allowed roles. |

---

### 3.4. Common Atomic Components (`components/common/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/common/Button.tsx` | 41 | Reusable button supporting variants (`primary`, `secondary`, `danger`, `outline`), loading spinners, and disabled states. |
| `components/common/Card.tsx` | 27 | Surface container with standard padding, border, and elevation styling. |
| `components/common/FormInput.tsx` | 29 | Standard form input with integrated label, validation errors, and icon slots. |
| `components/common/Modal.tsx` | 70 | Accessible dialog modal with backdrop blur, exit transitions, and header/footer slots. |
| `components/common/Header.tsx` | 253 | Top dashboard header with search, real-time notification bell, role pill, and user profile drawer. |
| `components/common/DocumentUploadField.tsx`| 92 | Drag-and-drop file upload component connecting to Vercel Blob storage. |
| `components/common/PWAInstallPrompt.tsx` | 129 | Standalone installation banner intercepting browser `beforeinstallprompt` event. |
| `components/common/SplashScreen.tsx` | 89 | Animated company splash screen presented during initial authentication verification. |
| `components/common/SWRegister.tsx` | 24 | Service worker client registrar registering `public/sw.js` on mount. |

---

### 3.5. Admin Module Components (`components/admin/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/admin/Dashboard.tsx` | 534 | Master administrative executive overview: KPI metric cards, quick actions, attendance chart, leave queue. |
| `components/admin/AdminSettings.tsx` | 416 | Geofence configuration: Interactive Leaflet map, GPS coordinates, allowed radius (meters), department bypass. |
| `components/admin/ManageUsers.tsx` | 345 | Team member directory, role assignment, active/inactive toggling, profile inspection. |
| `components/admin/ManageMessages.tsx` | 417 | Broadcast announcement composer with department targeting and historical message list. |
| `components/admin/ManageHolidays.tsx` | 211 | Calendar manager to add, edit, and delete organization and national holidays. |
| `components/admin/Profile.tsx` | 200 | Administrator profile editor with document attachments and security settings. |
| `components/admin/IDCard.tsx` | 115 | High-resolution employee ID card generator with QR code and company branding. |

#### Biometrics Sub-Module (`components/admin/biometrics/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `ManageBiometrics.tsx` | 132 | Master biometrics orchestrator view coordinating stats, filters, and user device lists. |
| `BiometricModeCard.tsx` | 128 | Interactive policy card to toggle between GPS-Only vs GPS + Biometric verification. |
| `BiometricStatsCards.tsx` | 85 | High-level summary of total registered devices, pending approvals, and active sensors. |
| `BiometricFilterBar.tsx` | 93 | Filter controls for search query, department selection, and device approval status. |
| `BiometricUserRow.tsx` | 258 | Individual employee device row rendering registered slots (Thumb, Index, Backup), status pills, and approval buttons. |
| `useBiometricsData.ts` | 278 | Custom React hook managing Firestore subscription for biometric devices and status mutations. |
| `types.ts` | 15 | Type definitions for biometric device filters and slot status representations. |

#### CRM & Lead Sub-Module (`components/admin/crm/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `ManageLeads.tsx` | 184 | Master CRM pipeline manager coordinating statistics, search, categories, and table views. |
| `LeadStatsCards.tsx` | 96 | Pipeline KPI cards (Total Leads, Converted, Ongoing, Proposals Sent, Disposed). |
| `LeadCategoryTabs.tsx` | 105 | Category switcher separating Company Leads from Raw Scraped Leads with badge counts. |
| `LeadTable.tsx` | 197 | Responsive CRM data table with status badges, assignee pills, contact shortcuts, and actions. |
| `LeadFormModal.tsx` | 217 | Multi-section modal dialog for creating and editing B2B leads. |
| `LeadFormGeneralSection.tsx`| 100 | Form sub-section for lead status, start date, and work commencement date. |
| `LeadFormClientSection.tsx` | 180 | Form sub-section for client name, phone, email, client type (B2B, Referral, Sales), and details. |
| `LeadFormProjectSection.tsx`| 134 | Form sub-section for project name, POC contacts, domain name, expiry date, and remarks. |
| `leadFormUtils.ts` | 54 | Default lead values, validation helpers, and status enum options. |
| `useManageLeadsData.ts` | 252 | Custom hook encapsulating lead fetching, filtering, pagination, deletion, and Google Sheets sync. |
| `GlobalLeadCalendar.tsx` | 330 | Full calendar view showing scheduled follow-ups, calls, client meetings, and project milestones. |
| `LeadActivityManager.tsx` | 445 | Activity timeline panel for logging tasks, phone calls, meetings, notes, and completion toggles. |
| `LeadDetailView.tsx` | 221 | Comprehensive slide-over or modal viewing all metadata, activities, and history for a single lead. |
| `ImportLeadsModal.tsx` | 383 | CSV import wizard utilizing PapaParse with column mapping, preview, and batch Firestore insertion. |

---

### 3.6. HR Module Components (`components/hr/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/hr/Dashboard.tsx` | 390 | HR-tailored executive dashboard: daily attendance overview, leave approvals queue, upcoming birthdays. |
| `components/hr/HRSettings.tsx` | 434 | HR view for reviewing office location boundaries and department bypasses. |
| `components/hr/ManageUsers.tsx` | 294 | Employee directory management for HR personnel with editing capabilities. |
| `components/hr/ManageMessages.tsx` | 417 | Announcement broadcast console matching Admin capabilities. |
| `components/hr/Profile.tsx` | 200 | Personal profile management for HR team members. |

---

### 3.7. User / Employee Module Components (`components/user/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/user/UserHome.tsx` | 115 | Employee home landing: personal status card, clock-in shortcut, announcements, and celebrations. |
| `components/user/Attendance.tsx` | 186 | Employee attendance hub: live punch clock, geofence status indicator, and timeline logs. |
| `components/user/Leave.tsx` | 85 | Employee leave center: quota summary cards, new request form, and application history table. |
| `components/user/Messages.tsx` | 349 | Employee message inbox displaying targeted organization alerts with mark-as-read tracking. |
| `components/user/Holidays.tsx` | 108 | Employee view of company and national holidays. |
| `components/user/Profile.tsx` | 316 | Employee self-service profile, emergency contacts, bank details, and digital ID card. |

#### User Home Widgets (`components/user/home/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `HomeAttendanceWidget.tsx` | 149 | Quick punch-in widget showing today's hours, first check-in time, and status indicator. |
| `HomeAnnouncementsWidget.tsx`| 298 | Carousel of recent company announcements with unread indicators. |
| `HomeCelebrationsWidget.tsx` | 120 | Widget displaying colleague birthdays and work anniversaries for the current month. |
| `useUserHomeData.ts` | 311 | Custom React hook managing real-time subscriptions for home metrics, today's attendance, and notices. |

#### User Attendance Sub-Module (`components/user/attendance/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `AttendanceCheckIn.tsx` | 327 | Core punch-in interface: WebAuthn sensor invocation, GPS geolocation coordinates capture, and WFH prompt. |
| `AttendanceTimeline.tsx` | 339 | Visual daily timeline illustrating check-in and check-out punches, duration, and status. |
| `AttendanceDetailModal.tsx` | 129 | Modal displaying detailed timestamp breakdown, geolocation accuracy, and session duration. |
| `LeaveQuotaTracker.tsx` | 110 | Compact progress meters indicating available casual, sick, and earned leave balances. |
| `useAttendanceActions.ts` | 287 | Custom hook handling check-in, check-out, WebAuthn verification, and location validation actions. |
| `useAttendanceStats.ts` | 251 | Custom hook calculating monthly present days, late arrivals, average hours, and overtime. |
| `utils.ts` | 145 | Pure functions for distance calculation (Haversine), session hour math, and leave deduction rules. |

#### User Leave Sub-Module (`components/user/leave/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `LeaveQuotaSummaryCards.tsx` | 123 | Visual cards displaying Casual, Sick, and Earned leave quotas, used days, and remaining balances. |
| `LeaveApplyForm.tsx` | 194 | Interactive form for submitting full-day or half-day leave requests with reason and dates. |
| `LeaveHistoryTable.tsx` | 139 | Historical list of submitted requests with status pills (Pending, Approved, Rejected) and remarks. |
| `useLeaveData.ts` | 215 | Custom hook managing leave applications, quota calculations, and real-time Firestore synchronization. |
| `leaveUtils.ts` | 77 | Pure utility functions calculating working days, quota deductions, and date validations. |

---

### 3.8. Shared Enterprise Modules (`components/shared/`)

#### Domain Manager Suite (`components/shared/DomainManager/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `DomainManager.tsx` | 213 | Enterprise domain monitoring orchestrator coordinating stats, filter bar, modals, and card grid. |
| `DomainCard.tsx` | 187 | Individual domain presentation card: SSL/DNS health indicators, expiry countdown, WhatsApp alert button. |
| `DomainModal.tsx` | 122 | Dialog modal to add or edit custom domains, POC contacts, and expiration dates. |
| `DomainStatsCards.tsx` | 71 | Summary cards: Total Domains, Healthy, Expiring in 30 Days, Expired Domains. |
| `DomainFilterBar.tsx` | 80 | Search bar and status filters (All, Healthy, Expiring Soon, Expired). |
| `domainUtils.ts` | 75 | Pure calculations for domain days remaining, expiration status, and WhatsApp link generation. |
| `useDomainData.ts` | 183 | Custom hook consolidating domains from CRM leads and custom domain collections with automated health auditing. |
| `types.ts` | 33 | TypeScript interfaces for domain records, status filters, and modal states. |

#### Manage Attendance Suite (`components/shared/ManageAttendance/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `index.tsx` | 112 | Main attendance management container coordinating overview cards, filters, and records table. |
| `AttendanceOverviewCards.tsx`| 92 | Executive metric cards: Present Today, On Leave, Late Arrivals, Work From Home. |
| `AttendanceTable.tsx` | 310 | Comprehensive employee attendance table with date filtering, user search, hours, and edit shortcuts. |
| `AttendanceDetailModal.tsx` | 112 | Modal presenting comprehensive breakdown of all punch sessions for a specific day. |
| `EditAttendanceModal.tsx` | 202 | Admin modal allowing manual adjustment of check-in/out timestamps with audit justification. |
| `useManageAttendanceData.ts` | 361 | Custom hook managing department filters, date selection, real-time Firestore records, and exports. |
| `utils.ts` | 59 | Pure utilities for formatting decimal hours to `HH:MM:SS` and session duration aggregation. |

#### Manage Leave Suite (`components/shared/ManageLeave/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `index.tsx` | 302 | Master leave administration dashboard for reviewing employee requests across departments. |
| `LeaveTable.tsx` | 211 | Filterable table displaying pending, approved, and rejected leave requests with quick actions. |
| `LeaveActionModal.tsx` | 106 | Approval/Rejection confirmation dialog with optional administrative remarks. |
| `LeaveDetailModal.tsx` | 167 | Detailed view of employee leave request, reason, duration, and quota impact. |
| `utils.ts` | 39 | Leave status color mappings, date formatting, and duration label helpers. |

#### User Detail View Suite (`components/shared/UserDetailView/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `index.tsx` | 194 | Deep-dive profile drawer displaying comprehensive metadata for any selected team member. |
| `UserHeader.tsx` | 86 | Header card featuring profile picture, designation, employee ID, role badge, and status indicator. |
| `PersonalInfoTab.tsx` | 175 | Detailed employee data: contact numbers, address, bank details, emergency contacts, and attached documents. |
| `AttendanceTab.tsx` | 543 | Dedicated calendar and history view showing the user's personal attendance records and metrics. |
| `utils.ts` | 81 | Helper functions for monthly hour summaries, present day counts, and percentage calculations. |

#### User Modals & Tables (`components/shared/user-modals/` & `user-tables/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `UserFormModal.tsx` | 430 | Comprehensive modal to onboard new employees or edit existing profiles (personal, bank, documents). |
| `UserDeleteModal.tsx` | 125 | Safe deletion modal verifying administrative intention and detailing permanent implications. |
| `IDCardModal.tsx` | 107 | Dialog rendering printable ID badge with direct PNG download shortcut. |
| `UsersTable.tsx` | 392 | Searchable, paginated employee table with role filters, status toggles, and action dropdowns. |
| `ManageUsersStats.tsx` | 62 | Metric summary cards: Total Staff, Active Employees, On Leave, Inactive Accounts. |

---

### 3.9. Setup & Auth Components (`components/setup/` & `components/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `components/setup/FirstTimeSetup.tsx`| 118 | Initial configuration screen triggered when zero users exist in Firestore; creates Super Admin. |
| `components/Login.tsx` | 90 | Primary login component featuring email/password fields, loading indicators, and error handling. |

---

### 3.10. Contexts, Hooks, Services & Utilities

#### Contexts (`contexts/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `contexts/AuthContext.tsx` | 215 | Centralized authentication state: listens to Firebase `onAuthStateChanged`, reads Firestore user profile, handles login/logout, and hydrates SSR safely. |

#### Custom Hooks (`hooks/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `hooks/useNotifications.ts` | 378 | Real-time subscription to `messages` collection; maintains unread counter, filters by department, persists dismissals. |
| `hooks/usePWAInstall.ts` | 80 | Intercepts native browser `beforeinstallprompt`, tracks install state, provides trigger method. |

#### Backend & Business Services (`services/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `services/dataService.ts` | 466 | Centralized Firestore data layer: paginated queries, user operations, attendance batch writes, leave mutations. |
| `services/crmService.ts` | 397 | CRM operations: lead CRUD, lead activity logging, and asynchronous Google Sheets webhook dispatch. |
| `services/auditService.ts` | 38 | Immutable audit logger writing system actions (`LOGIN`, `LOGOUT`, `UPDATE_SETTINGS`, etc.) to `/audit_logs`. |
| `services/blobService.ts` | 44 | Client/Server integration with Vercel Blob storage for document uploads and receipt attachments. |
| `services/exportService.ts` | 40 | Spreadsheet generation: converts JSON arrays into downloadable Excel (`.xlsx`) or CSV files via SheetJS. |
| `services/geminiService.ts` | 76 | AI document synthesis: interfaces with Google GenAI SDK (`@google/genai`) to generate SRS specifications. |

#### Core Utilities (`utils/`)
| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `utils/biometricService.ts` | 246 | WebAuthn hardware engine: handles `PublicKeyCredential.create()` registration and `get()` authentication challenges. |
| `utils/wfhHelper.ts` | 74 | Geofence math: Haversine distance calculations and location verification against office boundaries. |
| `utils/userUtils.ts` | 66 | Formatting helpers for user display names, role styling, and avatar generation. |

---

### 3.11. Automated Test Suite (`tests/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `tests/attendance.test.ts` | 48 | Automated unit tests: validates standard 8h day, split shifts, auto-checkout 4h cap, and `HH:MM:SS` formatting. |
| `tests/domain.test.ts` | 42 | Automated unit tests: validates remaining days, expired handling, timezone boundary stability. |
| `tests/geofence.test.ts` | 53 | Automated unit tests: validates Haversine distance, inside radius, outside perimeter, and geographical accuracy. |
| `tests/leave.test.ts` | 118 | Automated unit tests: validates half-day calculations, multi-day ranges, weekend/holiday deduction exemptions, and worked-day credit. |

---

### 3.12. Public Assets, Scripts & Background Tasks

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `public/sw.js` | 80 | Service Worker: Network-First navigation strategy, static asset caching, offline fallback. |
| `public/manifest.json` | 25 | Progressive Web App manifest defining app name, standalone display, and icon references. |
| `public/generate-icons.html` | 96 | Canvas utility to generate high-resolution PWA icons from vector logos. |
| `scripts/auto-domain-checker.js` | 277 | Node.js scheduled script auditing domain DNS/SSL records and dispatching WhatsApp/Email alerts. |
| `functions/src/index.ts` | 258 | Firebase Cloud Functions: daily cron jobs for auto-checkout, domain health checks, and notifications. |
| `functions/package.json` | 28 | Node.js package definition for Firebase Cloud Functions. |
| `functions/tsconfig.json` | 18 | TypeScript configuration for Cloud Functions backend. |

---

### 3.13. Centralized Documentation Suite (`documentation/`)

| File Path | Lines | Purpose / Responsibility |
| :--- | :---: | :--- |
| `documentation/INDEX.md` | 55 | Master documentation index, reading paths, and overview. |
| `documentation/PROJECT_DOCUMENTATION.md` | ~830 | Complete project technical manual, file catalog, and architectural blueprint. |
| `documentation/ARCHITECTURE.md` | 137 | Server/Client component boundaries, WebAuthn, Leaflet, and PWA architecture. |
| `documentation/ROUTE_MIGRATION.md` | 60 | Next.js App Router route mapping catalog and RBAC access matrix. |
| `documentation/MIGRATION_AUDIT.md` | 265 | Technical migration audit log and final production readiness sign-off. |
| `documentation/ENVIRONMENT.md` | 98 | Environment variables configuration matrix and `.env` setup. |
| `documentation/TESTING.md` | 170 | Four-tier automated quality gate matrix, unit test suite, and route verification. |
| `documentation/DEPLOYMENT.md` | 129 | Production deployment playbook for Vercel, Node.js, and Firebase. |

---

## 6. Key Subsystem Workflows & Technical Implementation

### 6.1. WebAuthn Biometric Verification (Anti-Buddy Punching)
* **Registration Flow (`biometricService.ts`):**
  1. The user requests to register a hardware authenticator slot (e.g. Thumb, Index, or Backup phone).
  2. The browser generates a random 32-byte cryptographic challenge.
  3. `navigator.credentials.create()` requests the device's platform authenticator (Touch ID, Windows Hello, Android Biometrics).
  4. The returned public key credential ID and persistent device token are stored in Firestore under `/users/{userId}` with `pending_approval` status.
  5. An Administrator or HR manager reviews and approves the device in `/biometrics`.
* **Punch-in Verification Flow:**
  1. When punching in, `navigator.credentials.get()` challenges the platform sensor.
  2. Successful biometrics verification attaches `biometricVerified: true` and the corresponding `deviceId` to the punch session record in `/attendance`.

### 6.2. GPS Geofencing & Work From Home (WFH)
* **Office Coordinate Validation (`wfhHelper.ts`):**
  - Uses the Haversine formula to compute geodesic distance between the browser's `navigator.geolocation` coordinates and the office latitude/longitude configured in `/settings`.
  ```typescript
  const R = 6371e3; // Earth radius in metres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
  const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  ```
  - If `distance <= allowedRadius` (e.g. 100 meters), check-in is granted as Office.
  - If the employee belongs to a configured **Bypass Department**, GPS distance is waived.
  - If outside the radius, the employee must select **Work From Home (WFH)** and provide task justifications.

### 6.3. Leave Calculation & Deduction Logic
* **Deduction Engine (`components/user/attendance/utils.ts`):**
  - **Half Day:** Deducts 0.5 days, provided the day is not a Sunday or public holiday.
  - **Multi-Day Range:** Iterates day by day between `startDate` and `endDate`:
    1. If the day is a Sunday, it is skipped (0 deduction).
    2. If the day matches a record in `/holidays`, it is skipped (0 deduction).
    3. If the employee has an attendance record with `totalHours > 0` on that date, it is considered worked and **not deducted**.
    4. Otherwise, 1.0 day is deducted from the approved leave balance.

### 6.4. Domain & SSL Health Monitor
* **Automated DNS & Expiry Check (`domainUtils.ts`, `auto-domain-checker.js`):**
  - Aggregates domain records from both `/leads` (CRM domains) and `/domains` (Custom domains).
  - Calculates `daysRemaining = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24))`.
  - Categories:
    - **Healthy:** > 30 days remaining, DNS/SSL valid.
    - **Expiring Soon:** <= 30 days remaining.
    - **Expired:** <= 0 days remaining.
  - Generates preformatted WhatsApp URL scheme (`https://api.whatsapp.com/send?phone=...&text=...`) for instant client warning dispatch.
  - Triggers automated reminder emails via EmailJS.

---

## 7. Cloud Firestore Database Schema & Security Rules

The database consists of 11 collections secured by Firestore Security Rules (`firestore.rules`):

```text
Cloud Firestore (hirush-global-ams)
├── users/                     # Employee and administrator profiles
├── attendance/                # Daily attendance records and punch sessions
├── leave_requests/            # Employee leave applications and approval status
├── messages/                  # Organization-wide and department announcements
├── leads/                     # CRM B2B leads and pipeline metadata
├── leadActivities/            # Tasks, calls, meetings, and notes tied to leads
├── crm_companies/             # Saved company profiles for B2B client selection
├── domains/                   # Standalone custom domains tracked for health/SSL
├── holidays/                  # Company and national public holidays
├── settings/                  # Office coordinates, geofence radius, bypass list
└── audit_logs/                # Immutable system events (logins, status changes)
```

---

## 8. Testing, Build & Deployment Guide

### 8.1. Running the Automated Unit Test Suite
The project contains 17 automated unit tests covering business logic calculations with zero external mocking overhead:

```bash
# Execute full unit test suite
npm test
```
*Expected Output:*
```text
TAP version 13
# Subtest: Attendance Hours & Time Calculations (4 tests passed)
# Subtest: Domain Utility Tests (4 tests passed)
# Subtest: Geofence & Haversine Distance Calculations (4 tests passed)
# Subtest: Leave Calculation & Deduction Rules (5 tests passed)
1..4
# tests 17
# suites 4
# pass 17
# fail 0
```

### 8.2. Production Build & Static Page Generation
```bash
# Run Next.js production build with Turbopack
npm run build
```
Generates 16 static routes:
- `/`, `/_not-found`, `/attendance`, `/biometrics`, `/crm`, `/dashboard`, `/domains`, `/holidays`, `/leave`, `/login`, `/messages`, `/profile`, `/settings`, `/setup`, `/users`.

### 8.3. Production Deployment Commands
```bash
# Start Next.js production server on port 3005
npm run start
```

---

## 9. Component Interaction & Dependency Hierarchy

```text
app/layout.tsx (Master Layout)
 └── AuthProvider (contexts/AuthContext.tsx)
      └── app/{route}/page.tsx
           └── AuthGuard (components/layout/AuthGuard.tsx)
                └── DashboardLayout (components/layout/DashboardLayout.tsx)
                     ├── Header (components/common/Header.tsx)
                     │    ├── Notification Bell (hooks/useNotifications.ts)
                     │    └── User Profile Pill (contexts/AuthContext.tsx)
                     │
                     ├── Sidebar & Mobile Drawer (components/layout/navConfig.ts)
                     │
                     └── Page Content View (Active Route):
                          ├── /dashboard  -> AdminDashboard / HRDashboard / UserHome
                          ├── /attendance -> ManageAttendance / UserAttendance
                          ├── /leave      -> ManageLeave / UserLeave
                          ├── /users      -> ManageUsers / UsersTable / UserDetailView
                          ├── /biometrics -> ManageBiometrics / BiometricUserRow
                          ├── /crm        -> ManageLeads / LeadTable / LeadFormModal
                          ├── /domains    -> DomainManager / DomainCard / DomainModal
                          ├── /settings   -> AdminSettings / Leaflet Geofence Map
                          ├── /holidays   -> ManageHolidays / UserHolidays
                          └── /profile    -> Profile / IDCard (html2canvas)
```

---

## 10. State Management & Hydration Architecture

1. **Session Hydration Safety:**
   - In Next.js App Router, components initially evaluate on the server during build and pre-render phases.
   - `AuthContext.tsx` guards accesses to `sessionStorage` and `localStorage` with `typeof window !== 'undefined'` checks.
   - Initial state mounts with safe placeholders (`loading: true`), preventing React 19 hydration mismatch errors.
2. **Browser APIs & Dynamic Isolation:**
   - **Leaflet & OpenStreetMap:** Dynamically imported on client mount to avoid `window is not defined` crashes.
   - **WebAuthn (`navigator.credentials`):** Encapsulated within `biometricService.ts` and called strictly inside user interaction handlers.
   - **Geolocation (`navigator.geolocation`):** Invoked inside `useAttendanceActions.ts` during active clock-in events.
   - **Canvas Rendering (`html2canvas`):** Invoked inside `IDCardModal.tsx` strictly on user download button click.

---
*Manual compiled and verified for Hirush Global AMS Production Release.*
