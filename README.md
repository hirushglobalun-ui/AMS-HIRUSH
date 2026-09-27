# Hirush Global EMS / AMS (Attendance & Enterprise Management System)

A comprehensive, full-stack Employee and Enterprise Management System developed for Hirush Global LLP. This application provides robust tools for HR administration, employee attendance tracking with WebAuthn biometrics and GPS geofencing, leave management, digital ID card issuance, and CRM/lead management.

> **Framework Migration Notice:**  
> The application was migrated from **React 19 + Vite 6 to Next.js App Router**.  
> The migration was performed without intentional changes to the existing UI, business workflows, data model, or user-facing functionality.

---

## 🚀 Features

- **Role-Based Access Control (RBAC):** Distinct dashboards and strict permission boundaries for Super Admin, Admin, HR, Employee, Intern, Visitor, and Sales roles.
- **Biometric WebAuthn Attendance:** Hardware platform authenticator integration (Fingerprint / TouchID / FaceID) for anti-buddy-punching security.
- **GPS Geofencing & WFH:** High-accuracy office coordinate validation, allowed radius checks, department location bypass, and Work From Home request workflows.
- **Leave Management:** Request and approve various leave types (Casual, Sick, Earned, WFH) with automatic monthly quota tracking and balance deductions.
- **Employee Directory & Profiles:** Secure storage of employee details, including bank information, emergency contacts, document attachments, and user status.
- **Digital ID Card:** Printable and downloadable photo ID badge generation with company branding and QR verification via `html2canvas`.
- **B2B Lead Management (CRM):** Track leads from 'Pending' to 'Converted'/'Disposed', log activities (Calls, Meetings, Emails), manage client relationships, and automatically synchronize with Google Sheets webhook.
- **Domain & Hosting Health Monitor:** Track domain and hosting expirations, run automated DNS and SSL audits, receive 5:00 AM IST scheduled alerts, and send preformatted WhatsApp warnings.
- **Internal Messaging & Announcements:** Real-time Firestore communication system for company-wide broadcasts or department-targeted announcements with unread badge tracking.
- **Progressive Web App (PWA):** Installable web application with service worker caching for quick access and offline reliability on desktop and mobile.

---

## 🛠️ Tech Stack

- **Framework:** Next.js (App Router, Turbopack)
- **Core:** React 19, TypeScript
- **Styling:** Tailwind CSS 3.4, Lucide React (Icons)
- **Database & Auth:** Firebase v12 (Authentication, Cloud Firestore)
- **Hardware & Web APIs:** WebAuthn (FIDO2), Browser Geolocation API, Leaflet 1.9.4
- **Hosting:** Vercel / Firebase Hosting / Node.js
- **Charts & Visualization:** Recharts
- **Data Export & Import:** SheetJS (`xlsx`), PapaParse, `html2canvas`
- **Integrations:** EmailJS, Google GenAI SDK (`@google/genai`), Vercel Blob Storage

---

## 📚 Migration & Technical Documentation

Detailed architecture, environment configuration, route mapping, and testing documentation are available:

* 📋 [MIGRATION_AUDIT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/MIGRATION_AUDIT.md) — Comprehensive technical audit of architecture, dependencies, and risks.
* 🗺️ [ROUTE_MIGRATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/ROUTE_MIGRATION.md) — Mapping from Vite SPA tabs to Next.js App Router paths.
* 🏛️ [ARCHITECTURE.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/ARCHITECTURE.md) — Server vs. Client component boundaries, WebAuthn, Leaflet, and PWA setup.
* 🔐 [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/ENVIRONMENT.md) — Environment variables matrix (`NEXT_PUBLIC_*` and legacy `VITE_*` fallbacks).
* 🚢 [DEPLOYMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/DEPLOYMENT.md) — Deployment instructions for Vercel, Node.js, and Firebase.
* 🧪 [TESTING.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/TESTING.md) — Full regression test suite covering all 28 requirements.

---

## 👨‍💻 Developer Profile

**Developed by Sayed Shahloo**

- 📧 Email: [sayedshahloobp@gmail.com](mailto:sayedshahloobp@gmail.com) / [sayedshahloobpofficial@gmail.com](mailto:sayedshahloobpofficial@gmail.com)
- 📄 **Resume:** [Click here to view my Resume](#) *(Add your resume link here)*
- 🌐 **Portfolio:** [Click here to view my Portfolio](#) *(Add your portfolio link here)*

---

## 📦 Getting Started

### Prerequisites
- Node.js (v20+ recommended)
- Firebase Project with Firestore and Auth enabled

### Installation

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd ams
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env` (refer to [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/ENVIRONMENT.md)):
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. Start development server:
   ```bash
   npm run dev
   ```
   Access the app at `http://localhost:3005`.

5. Build for production:
   ```bash
   npm run build
   npm run start
   ```

---

## 📄 License
Private - All Rights Reserved by Hirush Global LLP  
Contact: sayedshahloobp@gmail.com / sayedshahloobpofficial@gmail.com