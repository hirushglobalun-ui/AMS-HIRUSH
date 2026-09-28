# Deployment Guide: Hirush Global AMS (Next.js)
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Date:** September 2026  

---

## 1. Overview & Phased Rollout Plan

As defined in the migration requirements:
```text
Current Production (Vite)
        │
        ├── Remains active during verification
        │
        ▼
Next.js Migration Environment
        │
        ▼
Regression Verification
        │
        ▼
Production Cutover
```

Do not decommission the existing Vite production deployment until the Next.js migration passes full regression verification in staging/testing.

---

## 2. Local Production Testing

To test the production build locally before deployment:

```bash
# 1. Clean build
npm run build

# 2. Run Next.js production server on port 3005
npm run start
```

Open `http://localhost:3005` in your browser.

---

## 3. Deploying to Vercel (Recommended)

Vercel provides native, zero-configuration hosting for Next.js App Router applications.

### Steps:
1. Connect the GitHub repository to your Vercel project.
2. In the Vercel dashboard:
   - **Framework Preset:** `Next.js` (automatically detected)
   - **Build Command:** `npm run build`
   - **Output Directory:** `.next`
   - **Install Command:** `npm install`
3. In **Settings → Environment Variables**, add your configuration variables (e.g. `NEXT_PUBLIC_FIREBASE_API_KEY`, etc. as documented in [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ENVIRONMENT.md)).
4. Deploy to a Preview / Staging URL.
5. Verify workflows and promote to the production domain.

---

## 4. Deploying with Node.js / PM2 / Self-Hosted Server

To host on an enterprise VPS or Windows/Linux server:

1. Install Node.js (v20+ recommended).
2. Clone repository and install dependencies:
   ```bash
   npm install --production=false
   npm run build
   ```
3. Start using PM2:
   ```bash
   npm install -g pm2
   pm2 start npm --name "hirush-ams" -- start -- -p 3005
   pm2 save
   pm2 startup
   ```
4. Configure Nginx or Caddy as a reverse proxy:
   ```nginx
   server {
       listen 443 ssl http2;
       server_name ams.hirushglobal.com;

       ssl_certificate /etc/letsencrypt/live/ams.hirushglobal.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/ams.hirushglobal.com/privkey.pem;

       location / {
           proxy_pass http://127.0.0.1:3005;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

---

## 5. Deploying to Firebase App Hosting / Cloud Run

If deploying within the Google Cloud / Firebase ecosystem:

1. Ensure Firebase CLI is installed:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
2. Deploy with Firebase web frameworks support:
   ```bash
   firebase deploy --only hosting
   ```
3. Deploy backend scheduled Cloud Functions if updated:
   ```bash
   firebase deploy --only functions
   ```

---

---

## 6. Pre-Deployment Security & Credential Checklist

Complete every step before cutover:
* [ ] **Rotate Gmail App Password**: Revoke any existing Google App Password and generate a new 16-character password in Google Account Security. Populate `GMAIL_APP_PASS` in the hosting environment variables.
* [ ] **Rotate Cloudinary API Secret**: Generate or verify fresh Cloudinary credentials (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_CLOUD_NAME`). Set strictly in server environment.
* [ ] **Firebase Authorized Domains**: In Firebase Console → Authentication → Settings → Authorized domains, add your production domain (e.g. `ams.hirushglobal.com`).
* [ ] **Google Cloud API Key Restrictions**: In Google Cloud Console → APIs & Services → Credentials, restrict `NEXT_PUBLIC_FIREBASE_API_KEY` with HTTP Referrer restrictions to `https://ams.hirushglobal.com/*`.
* [ ] **Deploy Firestore Security Rules**: Deploy the updated rules enforcing role-based permissions and initial self-setup:
  ```bash
  firebase deploy --only firestore:rules
  ```
  *(Note: Hirush Global AMS operates as a secure single-company enterprise deployment).*
* [ ] **Configure Production Environment Variables**: Ensure all required keys from `.env.example` are populated in your hosting provider (Vercel / PM2 / Cloud Run).
* [ ] **Configure DNS & SSL**: Verify SSL/TLS termination is active (HTTPS is mandatory for WebAuthn and Geolocation).

---

## 7. Deployment Procedure

```bash
# 1. Install production dependencies
npm install --frozen-lockfile

# 2. Run quality checks
npm test
npx tsc --noEmit
npm run lint

# 3. Build production bundle
npm run build

# 4. Start production server
npm run start
```

---

## 8. Post-Deployment Verification Checklist

* [ ] SSL Certificate active (HTTPS is mandatory for WebAuthn and Geolocation).
* [ ] Login flow operates with email/password.
* [ ] First-time setup creates initial Super Admin safely (if fresh installation).
* [ ] Protected route redirection works for unauthenticated users.
* [ ] Attendance check-in / check-out records accurately.
* [ ] Office GPS distance calculation validates accurately against office geofence.
* [ ] Leave requests can be submitted and approved/rejected by Admin/HR.
* [ ] CRM leads and activities can be viewed, created, and updated.
* [ ] Profile photo upload via `/api/upload` uploads securely and updates avatar.
* [ ] Real-time messages update without page reload.
* [ ] PWA install prompt appears and service worker registers successfully.
* [ ] Digital ID card downloads as PNG image.
* [ ] Server logs confirm no unhandled exceptions or secret leakage.

