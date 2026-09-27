# Architecture: Hirush Global AMS (Next.js Migration)
**Application:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Framework:** Next.js App Router (React 19 + TypeScript + Tailwind CSS)  
**Date:** September 2026  

---

## 1. Architectural Statement

> **The application was migrated from React/Vite to Next.js.**
> 
> The migration was performed without intentional changes to the existing UI, business workflows, data model, or user-facing functionality.

---

## 2. Directory Structure

The Next.js App Router structure organizes responsibilities clearly while adhering to the rule of keeping source files modular:

```text
ams/
├── app/                               # Next.js App Router entry points & routes
│   ├── globals.css                    # Preserved Tailwind & custom scrollbar styles
│   ├── layout.tsx                     # Root HTML shell with Inter font, metadata & providers
│   ├── page.tsx                       # Root entry point & role-based dashboard router
│   ├── login/page.tsx                 # Dedicated authentication route
│   ├── setup/page.tsx                 # First-time Super Admin initialization
│   ├── dashboard/page.tsx             # Role-based dashboard shell
│   ├── attendance/page.tsx            # Attendance tracking, GPS & biometrics
│   ├── leave/page.tsx                 # Leave management & quotas
│   ├── users/page.tsx                 # Team directory & user administration
│   ├── biometrics/page.tsx            # WebAuthn sensor registration & approval
│   ├── messages/page.tsx              # Announcements & real-time messaging
│   ├── crm/page.tsx                   # B2B Lead CRM & activity calendar
│   ├── domains/page.tsx               # Domain & SSL/DNS health monitor
│   ├── settings/page.tsx              # Office GPS geofence configuration
│   ├── holidays/page.tsx              # Company holiday calendar
│   └── profile/page.tsx               # Employee profile & digital ID card
│
├── components/                        # Preserved UI components
│   ├── admin/                         # Admin-specific views, settings & CRM
│   ├── common/                        # Atomic UI elements (Card, Button, Modal, Header, SplashScreen)
│   ├── hr/                            # HR-specific views matching Admin boundaries
│   ├── layout/                        # AppRouteShell & DashboardLayout
│   ├── setup/                         # FirstTimeSetup onboarding
│   ├── shared/                        # DomainManager, ManageAttendance, ManageLeave, UserDetailView
│   └── user/                          # UserHome, Attendance, Leave, Messages, Profile
│
├── contexts/                          # React context providers
│   └── AuthContext.tsx                # Centralized session state with SSR-safe hydration
│
├── hooks/                             # Custom React hooks
│   ├── useNotifications.ts            # Firestore messaging subscription & local dismissal
│   └── usePWAInstall.ts               # Web install prompt listener
│
├── services/                          # Business logic & Firebase integrations
│   ├── auditService.ts                # Immutable audit trail logging in Firestore
│   ├── blobService.ts                 # Document uploads via Vercel Blob
│   ├── crmService.ts                  # Lead management & Google Sheets webhook sync
│   ├── dataService.ts                 # Paginated user, attendance, and leave queries
│   ├── exportService.ts               # Excel/CSV generation via SheetJS
│   └── geminiService.ts               # AI SRS generation via Google GenAI SDK
│
├── utils/                             # Core utilities
│   ├── biometricService.ts            # WebAuthn hardware sensor registration & verification
│   ├── userUtils.ts                   # User display helpers
│   └── wfhHelper.ts                   # Distance & geofence validation calculations
│
├── public/                            # Static assets & PWA configuration
│   ├── assets/                        # Company logos & favicons
│   ├── manifest.json                  # PWA Web App Manifest
│   ├── manifest.webmanifest           # Backward-compatible PWA manifest
│   └── sw.js                          # Service Worker with Network-First navigation caching
│
├── firebase.ts                        # Firebase SDK client initialization
├── tailwind.config.js                 # Preserved color palette and layout tokens
├── next.config.mjs                    # Next.js & Turbopack configuration
└── types.ts                           # Global TypeScript data models & enums
```

---

## 3. Server vs. Client Component Boundaries

Next.js App Router enforces explicit boundaries between Server and Client environments:

1. **Client Components (`"use client"`):**
   - Interactive UI components consuming hooks (`useState`, `useEffect`, `useContext`).
   - Browser API consumers: WebAuthn (`PublicKeyCredential`), Geolocation (`navigator.geolocation`), Leaflet maps (`window.L`), and image rendering (`html2canvas`).
   - Firebase Real-Time Listeners: `onSnapshot` queries for notifications and attendance.
   - PWA Install Prompts: `beforeinstallprompt` event handlers.

2. **Server Components:**
   - Root `layout.tsx` metadata injection (title, description, icons, viewport, and OpenGraph definitions).
   - Static asset pre-optimization.

3. **SSR Hydration Guarding:**
   - `sessionStorage` and `localStorage` accesses are guarded with `typeof window !== 'undefined'` checks to eliminate React 19 hydration mismatch warnings.

---

## 4. Authentication & RBAC Architecture

1. **State Preservation:**
   - Session authentication is managed centrally via `AuthContext.tsx`.
   - On page reload, Firebase `onAuthStateChanged` re-verifies session integrity against Cloud Firestore `/users/{uid}`.
   - Inactive accounts (`UserStatus.INACTIVE`) are automatically signed out.
2. **Dual-App Firebase Pattern:**
   - Primary `app`: Handles the active authenticated session.
   - Secondary `secondaryApp`: Enables Admin and HR personnel to create new user authentication accounts in Firebase Auth without terminating their current session.

---

## 5. Web Platform Features Architecture

### A. WebAuthn Biometrics
- **Registration:** Issues a 32-byte cryptographic challenge via `navigator.credentials.create()`, requesting platform authenticator (`authenticatorAttachment: 'platform'`).
- **Storage:** Stores the base64-encoded `credentialId`, physical `deviceId`, and `slotLabel` in Firestore under the user document.
- **Verification:** During check-in, `navigator.credentials.get()` challenges the phone/laptop sensor. Anti-buddy-punching guarantees physical user presence.

### B. GPS & Geofencing
- Acquires latitude/longitude with high accuracy (`enableHighAccuracy: true`).
- Calculates Haversine distance from configured office coordinates.
- If distance > radius and user is not in a bypassed department (or WFH approved), check-in is rejected with accurate distance feedback.

### C. Digital ID Card
- Styled using standard DOM elements with printable layout rules.
- On download request, `html2canvas` captures the element canvas on the client side and triggers a PNG download.

---

## 6. Unavoidable Technical Differences

1. **Build Tooling:** Vite HMR replaced with Next.js Turbopack compiler.
2. **Environment Variables:** `import.meta.env` replaced with `process.env.NEXT_PUBLIC_*` (with fallback to `VITE_*` maintained).
3. **PWA Registration:** `vite-plugin-pwa` replaced with native `public/manifest.json` + `public/sw.js` + client `SWRegister.tsx` to prevent stale Next.js chunk caching.
