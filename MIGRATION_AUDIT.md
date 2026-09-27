# Migration Audit: React + Vite → Next.js (App Router)
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Date:** September 2026  
**Scope:** Complete framework migration from React 19 + Vite 6 to Next.js App Router (zero UI redesign, zero feature removal, production preservation).

---

## 1. Executive Summary & Objective

The primary objective is to migrate Hirush Global AMS from a Client-Side Single Page Application (SPA) driven by Vite 6 and React 19 to a modern Next.js App Router application.

The migration must maintain **zero client-visible change** and **strict functional parity**:
* **Preserve all visual styling:** Tailwind CSS 3.4 tokens, layout containers, animations, modals, typography, colors, and responsive breakpoints.
* **Preserve all enterprise workflows:** WebAuthn biometric attendance, office GPS geofencing & WFH flow, Leave Management, Team Directory & RBAC, Digital ID Card generation, CRM module with Google Sheets webhook, Domain & Hosting Health Monitor, Real-time Announcements, and PWA installability.
* **Preserve Firebase architecture:** Cloud Firestore schema, Firebase Authentication (primary & secondary apps), and security rules.
* **Protect against SSR pitfalls:** Safe hydration and browser API isolation (`window`, `navigator`, `localStorage`, `sessionStorage`, `PublicKeyCredential`, `geolocation`, `Leaflet`).

---

## 2. Current Architecture & Technology Stack

| Layer | Current Implementation (Vite) | Target Implementation (Next.js) | Notes |
| :--- | :--- | :--- | :--- |
| **Framework** | Vite 6.2.0 | Next.js 15+ (App Router) | Maintain React 19 compatibility |
| **Language** | TypeScript ~5.8.2 | TypeScript ~5.8.2 | Strict typing preserved |
| **Styling** | Tailwind CSS 3.4.19 + PostCSS | Tailwind CSS 3.4 + PostCSS | Identical `tailwind.config.js` and `globals.css` |
| **Authentication** | Firebase Auth v12 (Client SDK) | Firebase Auth v12 (Client SDK) | Primary + Secondary app instance for user creation |
| **Database** | Cloud Firestore v12 | Cloud Firestore v12 | Real-time `onSnapshot` & batch writes |
| **Biometrics** | WebAuthn (FIDO2) Navigator API | WebAuthn Navigator API | Client-only execution, anti-buddy punching |
| **Maps & GPS** | Browser Geolocation + Leaflet 1.9.4 | Browser Geolocation + Leaflet 1.9.4 | Dynamically loaded on client to avoid SSR crashes |
| **PWA** | `vite-plugin-pwa` + `virtual:pwa-register` | Next.js Web App Manifest + Service Worker | No stale asset caching; standalone install prompt |
| **ID Card Export** | `html2canvas` | `html2canvas` | Dynamic client-side rendering & image download |
| **Data Processing** | SheetJS (`xlsx`), `papaparse` | SheetJS (`xlsx`), `papaparse` | CSV/Excel import and export workflows |
| **External APIs** | EmailJS, Google GenAI, Vercel Blob | EmailJS, Google GenAI, Vercel Blob | Environment variable naming aligned |

---

## 3. Route & View Mapping

In the current Vite architecture, the entire application was structured as an SPA driven by `App.tsx` and `AuthContext.tsx`. Users logged in and were routed by their role:
- **Admin**: `AdminDashboard.tsx` with 11 sub-views (Dashboard, Attendance, Leave, Users, Biometrics, Messages, Settings, Holidays, CRM Leads, Domain Manager, Profile).
- **HR**: `HRDashboard.tsx` with 9 sub-views (Dashboard, Attendance, Leave, Users, Biometrics, Messages, Holidays, Domain Manager, Profile).
- **Employee / Intern / Visitor / Sales**: `UserDashboard.tsx` with 4-6 sub-views (UserHome, Attendance, Leave, Profile, CRM, Domains).

### Next.js App Router Structure
To maintain URL consistency, deep linking, and backward compatibility without breaking existing user flows, we support both:
1. Standard clean URL routes mapped to Next.js App Router pages:
   - `/` - Main landing / role-aware entry point
   - `/login` - Authentication entry point
   - `/setup` - First-time admin setup (checked via Firestore user count)
   - `/dashboard` - Role-aware dashboard shell
   - `/attendance` - Attendance tracking and history
   - `/leave` - Leave management and requests
   - `/users` - Team directory and employee management
   - `/biometrics` - WebAuthn registration and device approvals
   - `/messages` - System announcements and messages
   - `/crm` - Lead management and CRM calendar
   - `/domains` - Domain & SSL/DNS health monitor
   - `/holidays` - Holiday calendar management
   - `/settings` - Office location geofence and system settings
   - `/profile` - User profile and ID card generation
2. Active tab fallback within `/` and `/dashboard` to ensure identical behavior for users accessing the app via existing saved state or PWA shortcuts.

---

## 4. Components Breakdown & Reuse Strategy

The components directory structure is modular:
- `components/common/`: Button, Card, FormInput, Header, Modal, SplashScreen, PWAInstallPrompt, DocumentUploadField. (Zero redesign, preserve all props).
- `components/layout/`: `DashboardLayout.tsx` providing responsive desktop sidebar, mobile header, navigation icons, and notification popovers.
- `components/admin/`: Admin views including `Dashboard.tsx`, `AdminSettings.tsx`, `ManageUsers.tsx`, `ManageMessages.tsx`, `ManageHolidays.tsx`, `Profile.tsx`, `IDCard.tsx`.
- `components/admin/crm/`: `ManageLeads.tsx`, `GlobalLeadCalendar.tsx`, `LeadFormModal.tsx`, `ImportLeadsModal.tsx`, `LeadActivityManager.tsx`, `LeadDetailView.tsx`.
- `components/admin/biometrics/`: `ManageBiometrics.tsx`.
- `components/hr/`: HR-specific views matching Admin with role boundaries.
- `components/user/`: `UserHome.tsx`, `Attendance.tsx`, `Leave.tsx`, `Messages.tsx`, `Holidays.tsx`, `Profile.tsx`, and widgets in `components/user/home/` and `components/user/attendance/`.
- `components/shared/`: `DomainManager.tsx`, `ManageAttendance/`, `ManageLeave/`, `UserDetailView/`, `user-modals/`, `user-tables/`.

**Reuse Strategy:** 
All components will be preserved. Component files that interact with browser APIs or React state will have `"use client"` directives added where appropriate to conform to Next.js App Router conventions.

---

## 5. Firebase Usage & Security

* **Firebase SDK:** v12.4.0 modular SDK (`firebase/app`, `firebase/firestore`, `firebase/auth`).
* **Firebase Config:** Stored in `firebase.ts`. Requires both `NEXT_PUBLIC_FIREBASE_*` and backwards-compatible fallback to `VITE_FIREBASE_*` so environment transitions do not break existing configurations.
* **Secondary App:** `secondaryApp` initialized with `"Secondary"` name used by admin/HR to create user auth records without logging out the active administrator. Preserved as is.
* **Firestore Collections:**
  - `users`
  - `attendance`
  - `leave_requests`
  - `messages`
  - `leads`
  - `leadActivities`
  - `crm_companies`
  - `domains`
  - `holidays`
  - `settings`
  - `audit_logs`
* **Data Safety:** No collection names or document fields will be changed. Firestore rules (`firestore.rules`) remain untouched.

---

## 6. Web Platform Features & Next.js Adaptations

### A. WebAuthn / Biometrics (`biometricService.ts`)
* WebAuthn requires `window.PublicKeyCredential`, `navigator.credentials.create()`, and `navigator.credentials.get()`.
* Must only execute in the browser. 
* Safe guards added for `typeof window !== 'undefined'` and client-side invocation.

### B. Geolocation & Leaflet (`AdminSettings.tsx`, `HRSettings.tsx`, `AttendanceCheckIn.tsx`)
* Leaflet relies on `window` and `document`. Server-side rendering crashes if Leaflet is statically evaluated during SSR.
* Solution: dynamic client-side loading or `useEffect` initialization, matching the existing robust implementation.

### C. Digital ID Card (`html2canvas`)
* Used in `Profile.tsx` and `IDCardModal.tsx` for converting DOM nodes to downloadable PNG ID badges.
* Already executed strictly inside user click handlers on the client side.

### D. PWA (`public/manifest.json`, Service Worker)
* Next.js provides native metadata manifest support.
* A robust, lightweight service worker (`sw.js`) will be placed in `public/` to handle asset caching and offline support.
* The existing `PWAInstallPrompt.tsx` and `usePWAInstall.ts` hooks listening for `beforeinstallprompt` will be preserved.

---

## 7. Environment Variables Audit

| Variable Name (Legacy) | Next.js Variable Name | Scope | Description |
| :--- | :--- | :--- | :--- |
| `VITE_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` | Public / Client | Firebase Web API Key |
| `VITE_FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public / Client | Firebase Auth Domain |
| `VITE_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public / Client | Firebase Project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public / Client | Firebase Storage Bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public / Client | Messaging Sender ID |
| `VITE_FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` | Public / Client | Firebase App ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public / Client | Firebase Measurement ID |
| `VITE_EMAILJS_PUBLIC_KEY` | `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Public / Client | EmailJS public key |
| `VITE_EMAILJS_SERVICE_ID` | `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Public / Client | EmailJS service ID |
| `VITE_EMAILJS_TEMPLATE_ID` | `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Public / Client | EmailJS template ID |
| `VITE_BLOB_READ_WRITE_TOKEN` | `BLOB_READ_WRITE_TOKEN` / `NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN` | Client / Server | Vercel Blob token |
| `GEMINI_API_KEY` / `API_KEY` | `GEMINI_API_KEY` / `API_KEY` | Server / Client | Google GenAI API Key |

*Implementation safeguard:* In `firebase.ts`, `blobService.ts`, and `DomainManager.tsx`, helper functions will look for `NEXT_PUBLIC_*` first, then fall back to `VITE_*` and `process.env.*` to guarantee zero breakage regardless of how the user environment is configured.

---

## 8. Potential Migration Risks & Mitigations

1. **Hydration Mismatch from `sessionStorage` in `AuthContext`:**
   - *Risk:* Accessing `sessionStorage` directly in initial `useState` can cause server/client render mismatch.
   - *Mitigation:* Hydrate user session on mount (`useEffect`) or ensure safe fallback.
2. **Next.js Package Dependencies with React 19:**
   - *Risk:* React 19 is installed. Ensure `next` version supports React 19 natively (Next.js 15+).
3. **Module Resolution Aliases:**
   - *Risk:* Vite used `@/*` pointing to `.`. Next.js `tsconfig.json` paths must align with `src/*` or root `./*`.
4. **CSS & Asset Paths:**
   - *Risk:* `/assets/company-logo.png` must resolve properly from the Next.js `public/` directory.

---
Audit complete. Moving to Phase 2: Route Map.
