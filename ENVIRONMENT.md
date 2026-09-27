# Environment Variables Guide: Hirush Global AMS
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Date:** September 2026  

---

## 1. Overview

Next.js separates environment variables between client-exposed variables (`NEXT_PUBLIC_*`) and server-only variables.

To guarantee zero disruption during the migration from Vite to Next.js, the codebase has been structured with **bidirectional compatibility**:
* The system checks `NEXT_PUBLIC_*` first (Next.js standard).
* If missing, it transparently falls back to `VITE_*` (legacy Vite standard) or `process.env.*`.

Existing `.env` files can be used directly or updated to the `NEXT_PUBLIC_*` convention.

---

## 2. Environment Variables Matrix

| Variable Name (Recommended) | Legacy Variable Name | Scope | Required | Description | Example / Format |
| :--- | :--- | :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `VITE_FIREBASE_API_KEY` | Public (Client) | Yes | Firebase Web Client API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `VITE_FIREBASE_AUTH_DOMAIN` | Public (Client) | Yes | Firebase Authentication Domain | `hirush-ams.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `VITE_FIREBASE_PROJECT_ID` | Public (Client) | Yes | Firebase Cloud Project ID | `hirush-global-ams` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `VITE_FIREBASE_STORAGE_BUCKET` | Public (Client) | Yes | Cloud Storage Bucket Name | `hirush-ams.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `VITE_FIREBASE_MESSAGING_SENDER_ID` | Public (Client) | Yes | FCM Messaging Sender ID | `123456789012` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `VITE_FIREBASE_APP_ID` | Public (Client) | Yes | Firebase Web Application ID | `1:123456789:web:abcdef` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | `VITE_FIREBASE_MEASUREMENT_ID` | Public (Client) | No | Google Analytics Measurement ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | `VITE_EMAILJS_PUBLIC_KEY` | Public (Client) | No | EmailJS Account Public Key | `user_abcdef12345` |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | `VITE_EMAILJS_SERVICE_ID` | Public (Client) | No | EmailJS Service Identifier | `service_ams` |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | `VITE_EMAILJS_TEMPLATE_ID` | Public (Client) | No | EmailJS Template Identifier | `template_domain_alert` |
| `BLOB_READ_WRITE_TOKEN` | `VITE_BLOB_READ_WRITE_TOKEN` | Server / Client | No | Vercel Blob Storage Token | `vercel_blob_rw_...` |
| `GEMINI_API_KEY` | `API_KEY` | Server / Client | No | Google Gemini API Key | `AIzaSy...` |

---

## 3. Example `.env` Configuration File

Create or populate `.env` in the project root:

```env
# =================================================================
# FIREBASE WEB CONFIGURATION (Required for Auth & Firestore)
# =================================================================
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=hirush-global-ams.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=hirush-global-ams
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=hirush-global-ams.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=100000000000
NEXT_PUBLIC_FIREBASE_APP_ID=1:100000000000:web:abcdef123456
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX

# =================================================================
# EMAILJS CONFIGURATION (For Domain Expiry Alerts)
# =================================================================
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id

# =================================================================
# VERCEL BLOB STORAGE (For Document & Receipt Uploads)
# =================================================================
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...

# =================================================================
# GOOGLE GEMINI AI SDK (For AI SRS Document Generation)
# =================================================================
GEMINI_API_KEY=your_gemini_api_key
```

---

## 4. Security Rules & Protection

1. **No Sensitive Private Keys in Public Variables:** Never prefix database service account private keys or backend administrative secrets with `NEXT_PUBLIC_`.
2. **Firebase Rules Enforcement:** Public client Firebase keys are intended for browser access; data access is securely guarded by Firestore Security Rules (`firestore.rules`).
3. **Build Fallbacks:** During automated CI/CD builds where `.env` is omitted, the application uses safe build placeholders to successfully pre-render static shells without leaking or failing.
