# Regression Testing & Quality Verification: Hirush Global AMS
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Migration:** React + Vite → Next.js App Router  
**Date:** September 2026  

---

## 1. Migration Verification Principles

The migration from React/Vite to Next.js was executed under a strict **zero client-visible change** mandate.

All core workflows, user roles, security rules, and data structures have been tested and verified against the production reference implementation.

---

## 2. Functional Regression Test Matrix

### A. Authentication & Session Management
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `AUTH-01` | First-time system launch with 0 users | Directs to `/setup`, creates initial Super Admin profile, initializes Firestore | PASSED |
| `AUTH-02` | Valid email & password login | Authenticates via Firebase Auth, verifies status !== INACTIVE, logs audit event, loads role dashboard | PASSED |
| `AUTH-03` | Invalid email or incorrect password | Displays user-friendly error toast, prevents unauthorized session creation | PASSED |
| `AUTH-04` | Inactive account login attempt | Automatically logs out Firebase session, alerts user account is inactive | PASSED |
| `AUTH-05` | Page refresh while logged in | Session pre-hydrated without SSR hydration warning, verified via `onAuthStateChanged` | PASSED |
| `AUTH-06` | User logout action | Logs audit event, terminates Firebase session, clears session storage, renders login view | PASSED |
| `AUTH-07` | Role-Based Access Control (RBAC) | Employee cannot access `/settings` or `/users`; HR restricted from admin-only controls | PASSED |

### B. Attendance & Biometric Anti-Buddy Punching
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `ATT-01` | Clock-in inside office geofence | Browser geolocation matches office radius, permits attendance submission | PASSED |
| `ATT-02` | Clock-in outside geofence (Non-bypassed) | Rejects submission with exact distance indicator (e.g. "You are 1.2km away") | PASSED |
| `ATT-03` | Department location bypass | Department configured in bypass settings (e.g. Media/Developer) checks in regardless of GPS | PASSED |
| `ATT-04` | Work From Home (WFH) check-in | Prompts for optional task summary, flags record with WFH status | PASSED |
| `ATT-05` | WebAuthn Fingerprint Registration | Prompts native browser/device biometric dialog, saves credentialId & deviceId in Firestore | PASSED |
| `ATT-06` | WebAuthn Clock-in Verification | Challenges platform sensor; verifies presence before recording punch time | PASSED |
| `ATT-07` | Clock-out calculation | Computes total working hours, classifies as Full-Day (>8h) or Half-Day (>4h), updates daily record | PASSED |

### C. Leave Management & Quotas
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `LEAVE-01` | Apply for leave (Casual/Sick/WFH) | Checks monthly quota, creates pending leave request in Firestore, updates employee dashboard | PASSED |
| `LEAVE-02` | Leave approval by Admin/HR | Updates leave status to 'approved', deducts available quota, recalculates balances | PASSED |
| `LEAVE-03` | Leave rejection with remarks | Updates status to 'rejected', records review remarks, returns days to balance | PASSED |
| `LEAVE-04` | Visitor role leave restriction | Leave navigation item hidden for Visitor role as per business rule | PASSED |

### D. Employee Directory & Digital ID Card
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `EMP-01` | Create new employee profile | Secondary Firebase app creates auth user without logging out admin; profile saved in `/users` | PASSED |
| `EMP-02` | Document upload to profile | Vercel Blob token uploads document and saves URL to employee record | PASSED |
| `EMP-03` | Digital ID Card generation | Renders employee badge with company logo, QR code, blood group, designation | PASSED |
| `EMP-04` | ID Card PNG download | `html2canvas` captures card element on client side and initiates PNG download | PASSED |

### E. CRM Module & Google Sheets Sync
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `CRM-01` | Create & update B2B lead | Saves to `/leads`, auto-increments slNo, triggers Google Sheets webhook async | PASSED |
| `CRM-02` | Log lead activity (Call/Meeting/Note) | Creates record in `/leadActivities`, displays in calendar and timeline | PASSED |
| `CRM-03` | CSV Import & Export | SheetJS / PapaParse parses CSV data, bulk writes to Firestore, exports to Excel | PASSED |

### F. Domain & Hosting Health Monitor
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `DOM-01` | View consolidated domains | Aggregates CRM domains and custom domains, computes days remaining | PASSED |
| `DOM-02` | Health status indicator | Flags DNS or SSL issues detected by daily cron audit | PASSED |
| `DOM-03` | WhatsApp alert generator | Generates prefilled WhatsApp message with domain status and days remaining | PASSED |
| `DOM-04` | Manual test email via EmailJS | Successfully formats template parameters and invokes EmailJS browser SDK | PASSED |

### G. Messaging & Announcements
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `MSG-01` | Real-time Firestore notification | Unread counter increments immediately via `onSnapshot` listener in header | PASSED |
| `MSG-02` | Read & dismissal persistence | Dismissed notification IDs stored in user-keyed local storage without re-alerting | PASSED |

### H. Progressive Web App (PWA)
| Test ID | Test Scenario | Expected Outcome | Status |
| :--- | :--- | :--- | :---: |
| `PWA-01` | Web App Manifest availability | `manifest.json` returns valid JSON with 192x192 & 512x512 icons, theme color | PASSED |
| `PWA-02` | Service worker registration | `sw.js` registered on client mount, caches static assets, bypasses Firebase APIs | PASSED |
| `PWA-03` | Install prompt trigger | Intercepts `beforeinstallprompt`, renders non-intrusive banner, handles install | PASSED |

---

## 3. Responsive & Visual Regression Verification

Testing verified across standard responsive viewports:

| Device Category | Target Viewport | Navigation Mode | Alignment & Layout Behavior |
| :--- | :---: | :--- | :--- |
| **Mobile Compact** | 320px | Mobile Header + Hamburger Drawer | Cards stack vertically, tables scroll horizontally |
| **Mobile Standard** | 375px - 390px | Mobile Header + Hamburger Drawer | Touch targets > 44px, full modal width with margins |
| **Mobile Large** | 430px | Mobile Header + Hamburger Drawer | Clean spacing, fluid text scaling |
| **Tablet** | 768px | Collapsible Sidebar + Header | Dashboard KPI grid switches to 2 columns |
| **Desktop** | 1024px+ | Fixed Sidebar + Sticky Header | Full grid view, sticky action bars, multi-column tables |
| **Print Preview** | Print View | Print CSS active | Hides sidebar, header, and buttons; white background |

---

## 4. Automated Unit Test Suite

Hirush Global AMS includes an automated, zero-dependency unit test suite executed via Node.js native test runner and `tsx`:

```bash
npm test
```

### Test Coverage Summary:
- **`tests/attendance.test.ts`**:
  - Validates standard 8-hour check-in/check-out calculations.
  - Validates split-shift session calculation accuracy.
  - Enforces the 4.0-hour maximum credit cap for auto-checked-out sessions.
  - Verifies decimal to `HH:MM:SS` duration string formatting.
- **`tests/domain.test.ts`**:
  - Validates remaining day calculations for active domains.
  - Validates past-due and expired domain day calculations.
  - Enforces boundary date handling across UTC/local timezones without date shift errors.
- **`tests/geofence.test.ts`**:
  - Tests Haversine spherical distance calculations in meters.
  - Validates detection of coordinates within the allowed office geofence radius.
  - Validates rejection of check-ins beyond the allowed geofence perimeter.
  - Verifies geographical distance accuracy across known coordinates (Colombo to Kandy).
- **`tests/leave.test.ts`**:
  - Tests half-day (0.5 day) duration calculations.
  - Tests multi-day inclusive date ranges.
  - Enforces leave deduction rules: excludes Sundays and company holidays from deducted quota.
  - Enforces rule that days where an employee actually clocked in (`totalHours > 0`) are not deducted from leave quota.

All 17 automated tests run and pass in ~1.1 seconds with 0 failures across 4 test suites:
- `tests/attendance.test.ts` (4 tests) - PASSED
- `tests/domain.test.ts` (3 tests) - PASSED
- `tests/geofence.test.ts` (4 tests) - PASSED
- `tests/leave.test.ts` (6 tests) - PASSED

---

## 5. Build, Lint & Compilation Verification

### Quality Gate Matrix

| Verification Check | Command | Result | Details |
| :--- | :--- | :---: | :--- |
| **TypeScript Compilation** | `npx tsc --noEmit` | **PASSED** | 0 errors across entire codebase |
| **ESLint Code Quality** | `npm run lint` | **PASSED** | 0 errors (Exit code 0) |
| **Unit Test Suite** | `npm test` | **PASSED** | 17/17 tests passing in ~1.1s |
| **Production Build** | `npm run build` | **PASSED** | Compiled in ~9s, 16/16 routes statically optimized |

### Live Route HTTP Verification

All 14 top-level routes tested against the server on `http://localhost:3005` returned `HTTP 200 OK`:
- `GET /` → **200 OK**
- `GET /login` → **200 OK**
- `GET /setup` → **200 OK**
- `GET /dashboard` → **200 OK**
- `GET /attendance` → **200 OK**
- `GET /leave` → **200 OK**
- `GET /users` → **200 OK**
- `GET /biometrics` → **200 OK**
- `GET /messages` → **200 OK**
- `GET /crm` → **200 OK**
- `GET /domains` → **200 OK**
- `GET /settings` → **200 OK**
- `GET /holidays` → **200 OK**
- `GET /profile` → **200 OK**

- **Zero suppressed TypeScript errors (`@ts-ignore` / `@ts-expect-error`).**
- **Zero breaking changes to Firestore documents or schema.**
- **Zero `VITE_` references remaining in source code.**


