# Environment Variables Guide: Hirush Global AMS
**Project:** Hirush Global Attendance & Enterprise Management System (AMS)  
**Date:** September 2026  

---

## 1. Overview

Next.js separates environment variables between client-exposed variables (`NEXT_PUBLIC_*`) and server-only variables.

The application uses standard Next.js environment variable conventions:
* Client-accessible keys use the `NEXT_PUBLIC_*` prefix.
* Server-only keys (e.g. `GEMINI_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `GMAIL_APP_PASS`) are protected from browser exposure.

---

## 2. Environment Variables Matrix

| Variable Name | Scope | Required | Description | Example / Format |
| :--- | :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Public (Client) | Yes | Firebase Web Client API Key | `AIzaSy...` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Public (Client) | Yes | Firebase Authentication Domain | `hirush-global-ams.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Public (Client) | Yes | Firebase Cloud Project ID | `hirush-global-ams` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Public (Client) | Yes | Cloud Storage Bucket Name | `hirush-global-ams.appspot.com` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Public (Client) | Yes | FCM Messaging Sender ID | `100000000000` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Public (Client) | Yes | Firebase Web Application ID | `1:100000000000:web:abcdef` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Public (Client) | No | Google Analytics Measurement ID | `G-XXXXXXXXXX` |
| `CLOUDINARY_CLOUD_NAME` | Server / API | Yes | Cloudinary Cloud Name (Server upload) | `my-cloud` |
| `CLOUDINARY_API_KEY` | Server / API | Yes | Cloudinary API Key | `1234567890` |
| `CLOUDINARY_API_SECRET` | Server / API | Yes | Cloudinary API Secret | `abcdef12345` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Public (Client) | No | Cloudinary Cloud Name (Client fallback) | `my-cloud` |
| `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`| Public (Client) | No | Unsigned Upload Preset for direct client upload | `ams_preset` |
| `GMAIL_USER` | Server / Script | Yes | Gmail username for Nodemailer alerts | `user@gmail.com` |
| `GMAIL_APP_PASS` | Server / Script | Yes | Gmail app password for Nodemailer alerts | `xxxx xxxx xxxx xxxx` |
| `ALERT_TO_EMAIL` | Server / Script | No | Recipient email for domain health alerts | `admin@hirush.com` |
| `GEMINI_API_KEY` | Server / Client | No | Google Gemini API Key | `AIzaSy...` |

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
# CLOUDINARY CONFIGURATION (For Photos & Document Management)
# =================================================================
# Option A: Server-Side API upload (/api/upload - Recommended)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Option B: Client-Side Direct Unsigned Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset

# =================================================================
# NODEMAILER GMAIL SMTP (For Domain & System Email Alerts)
# =================================================================
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASS=your_16_char_app_password
ALERT_TO_EMAIL=admin@company.com

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
