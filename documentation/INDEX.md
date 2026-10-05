# Hirush Global AMS — Documentation Suite

Welcome to the centralized documentation suite for the **Hirush Global Attendance & Enterprise Management System (AMS)**.

This folder contains the complete, authoritative technical documentation covering architecture, component inventories, security, routing, environment configuration, testing, and production deployment following the full migration from React 19 + Vite 6 to native **Next.js 16 (App Router)**.

---

## 📑 Documentation Index

| Document | Purpose & Scope | Target Audience |
| :--- | :--- | :--- |
| [PROJECT_DOCUMENTATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/PROJECT_DOCUMENTATION.md) | **Master System Reference (800+ lines):** Complete visual code directory tree, component catalog with file paths and line counts, layered architecture, data models, and hydration patterns. | All Engineers & Auditors |
| [AI_COPILOT_DOCUMENTATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/AI_COPILOT_DOCUMENTATION.md) | **AI Copilot & Intelligence Engine:** Full architectural guide, multi-tier Gemini failover cascade, optimization mechanisms, consumer capability catalog, and prompt guide. | Engineers, Product Managers & Admins |
| [ARCHITECTURE.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ARCHITECTURE.md) | **Next.js Architecture Guide:** Server vs. Client component boundaries (`"use client"`), safe browser API hydration (`window`, `navigator`, `localStorage`), WebAuthn isolation, and Leaflet integration. | Architects & Frontend Engineers |
| [ROUTE_MIGRATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ROUTE_MIGRATION.md) | **Route & RBAC Matrix:** Comprehensive catalog of all 14 application routes (`/attendance`, `/crm`, `/domains`, etc.), mapping from legacy active tabs to App Router paths, and role access permissions. | Frontend Engineers & QA |
| [MIGRATION_AUDIT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/MIGRATION_AUDIT.md) | **Technical Migration & Handover Audit:** Historical record of the migration from Vite to Next.js, code modularization (<200 lines target), security hardening, and final production cleanup pass. | Tech Leads & Client Auditors |
| [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ENVIRONMENT.md) | **Environment Configuration Guide:** Complete matrix of environment variables (`NEXT_PUBLIC_FIREBASE_*`, `NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN`, Gmail scheduler credentials) and `.env` setup. | DevOps & Backend Engineers |
| [TESTING.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/TESTING.md) | **Quality Assurance & Verification:** Four-tier quality gate matrix (`tsc`, `eslint`, `tsx --test`, `next build`), unit test suite documentation (17/17 tests), and live route HTTP status records. | QA & Release Engineers |
| [DEPLOYMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/DEPLOYMENT.md) | **Production Deployment Playbook:** Step-by-step instructions for hosting on Vercel, self-hosted Node.js / Docker servers, and Firebase Hosting integration. | DevOps & System Administrators |

---

## 🧭 Recommended Reading Paths

### 1. New Developer Onboarding
1. Start with [PROJECT_DOCUMENTATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/PROJECT_DOCUMENTATION.md) for a complete visual overview of the codebase.
2. Review [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ENVIRONMENT.md) to set up your local `.env`.
3. Read [ARCHITECTURE.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ARCHITECTURE.md) to understand `"use client"` boundaries and SSR hydration safeguards.
4. Run `npm test` and review [TESTING.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/TESTING.md).

### 2. Client / Audit Review
1. Review [MIGRATION_AUDIT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/MIGRATION_AUDIT.md) Section 11 for the final production readiness and security audit.
2. Review [TESTING.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/TESTING.md) for quality gate verification results.
3. Review [ROUTE_MIGRATION.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ROUTE_MIGRATION.md) for role permissions.

### 3. Production Deployment & DevOps
1. Follow [DEPLOYMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/DEPLOYMENT.md) for your target cloud environment (Vercel / Node.js).
2. Populate environment variables specified in [ENVIRONMENT.md](file:///c:/Users/HP/Downloads/hirushGlobalAMS-main%20%283%29/ams/documentation/ENVIRONMENT.md).
3. Validate production build via `npm run build`.
