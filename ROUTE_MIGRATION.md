# Route Migration Map: React + Vite → Next.js App Router
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Date:** September 2026  

---

## 1. Overview

In the existing Vite application, routing was handled primarily within `App.tsx` and the role-based dashboard shells (`AdminDashboard.tsx`, `HRDashboard.tsx`, `UserDashboard.tsx`) using active tab states. 

To provide full Next.js App Router capabilities (clean URLs, deep links, fast navigation, SEO/PWA metadata) while strictly preserving backward compatibility with the existing tab-based workflows, each logical route is mapped to the Next.js App Router under `src/app/` (or `app/`).

---

## 2. Comprehensive Route Mapping Table

| Logical Feature / View | Legacy Vite Flow | Target Next.js App Router Route | Allowed Roles / Access | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Root Entry** | `/` (Switch based on auth state & role) | `app/page.tsx` | All (Public / Authenticated) | Determines auth state; loads SplashScreen or role dashboard |
| **Authentication** | Modal / `Login.tsx` | `app/login/page.tsx` & `/` | Unauthenticated | Email & password login, audit logging |
| **First Time Setup** | `FirstTimeSetup.tsx` (Triggered when 0 users) | `app/setup/page.tsx` | Unauthenticated (First run only) | Initial Super Admin creation & onboarding |
| **Main Dashboard** | Tab: `dashboard` | `app/dashboard/page.tsx` | All Roles | Role-specific KPI metrics, charts, announcements |
| **Attendance Check-In & History** | Tab: `attendance` | `app/attendance/page.tsx` | All Roles | WebAuthn biometrics, GPS geofencing, WFH requests, logs |
| **Leave Management** | Tab: `leave` | `app/leave/page.tsx` | Employee, Intern, HR, Admin (Hidden for Visitor) | Leave applications, monthly quota calculation, approvals |
| **Team Directory / Users** | Tab: `users` | `app/users/page.tsx` | Admin, HR | Employee list, profile creation, document upload, status |
| **Biometric Management** | Tab: `biometrics` | `app/biometrics/page.tsx` | Admin, HR | Multi-fingerprint device approvals, WebAuthn resets |
| **Announcements / Messages** | Tab: `messages` | `app/messages/page.tsx` | All Roles | Broadcast alerts, department targeting, real-time unread counter |
| **CRM Leads** | Tab: `leads` / `crm` | `app/crm/page.tsx` | Admin, HR, Sales | Lead management, follow-ups, CSV import/export, Google Sheets |
| **Domain & SSL Monitor** | Tab: `domains` | `app/domains/page.tsx` | Admin, HR, Sales | Domain expiration tracking, DNS & SSL health, WhatsApp alerts |
| **Office Location Settings** | Tab: `settings` | `app/settings/page.tsx` | Admin | Office GPS coordinates, allowed radius, department bypass |
| **Holiday Calendar** | Tab: `holidays` | `app/holidays/page.tsx` | All Roles | Company holidays and upcoming leaves |
| **User Profile & ID Card** | Tab: `profile` | `app/profile/page.tsx` | All Roles | Personal info, emergency contacts, downloadable ID Card (html2canvas) |

---

## 3. Route Protection & RBAC Matrix

Next.js App Router enforces the exact existing role hierarchy:

| Route | Super Admin / Admin | HR | Employee / Intern | Visitor | Sales |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `/login` | ✅ | ✅ | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ (Full KPI) | ✅ (HR KPI) | ✅ (User Home) | ✅ (User Home) | ✅ (User Home) |
| `/attendance` | ✅ (Admin Mgmt) | ✅ (HR Mgmt) | ✅ (Self Check-in) | ✅ (Self Check-in) | ✅ (Self Check-in) |
| `/leave` | ✅ (Approvals) | ✅ (Approvals) | ✅ (Apply/Quota) | ❌ (Bypassed) | ✅ (Apply/Quota) |
| `/users` | ✅ (Full CRUD) | ✅ (Directory/Edit) | ❌ | ❌ | ❌ |
| `/biometrics` | ✅ (Approvals/Reset) | ✅ (Approvals) | ❌ | ❌ | ❌ |
| `/messages` | ✅ (Broadcast) | ✅ (Broadcast) | ✅ (View/Read) | ✅ (View/Read) | ✅ (View/Read) |
| `/crm` | ✅ (Full CRM) | ✅ (Full CRM) | ❌ | ❌ | ✅ (Full CRM) |
| `/domains` | ✅ (Full Monitor) | ✅ (Full Monitor) | ❌ | ❌ | ✅ (Full Monitor) |
| `/settings` | ✅ (GPS/Radius) | ❌ | ❌ | ❌ | ❌ |
| `/holidays` | ✅ (Manage) | ✅ (Manage) | ✅ (View) | ✅ (View) | ✅ (View) |
| `/profile` | ✅ (ID Card) | ✅ (ID Card) | ✅ (ID Card) | ✅ (ID Card) | ✅ (ID Card) |

---

## 4. Preservation of Navigation & Tabs

To guarantee **zero client-visible change**, the sidebar and header in `DashboardLayout.tsx` function seamlessly with both route navigation and active tab states. If a user enters via `/` or `/dashboard?tab=attendance`, the exact same UI, state, notifications, and animations are presented without layout shift.
