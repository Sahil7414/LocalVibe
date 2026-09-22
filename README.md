# 📍 LocalVibe — Hyperlocal Event Discovery & Social Platform

LocalVibe is a full-stack, production-grade hyperlocal event discovery and social participation web application. It connects locals with gatherings, indie music gigs, flea markets, food pop-ups, and workshops within their immediate vicinity.

---

## 📖 Master Documentation
For full details on everything built in the project, architecture, schemas, API references, test results, and implementation breakdown, see:
👉 **[PROJECT_MASTER_DOCUMENTATION.md](./PROJECT_MASTER_DOCUMENTATION.md)**

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Seed MongoDB Atlas Database
```bash
cd backend
npm run seed
```

### 3. Run Development Servers
```bash
# From the root workspace:
npm run dev
```

- **Frontend App**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api`

---

## 🧪 Run Automated Tests
```bash
cd backend
node src/test/testFullIntegrationPass.js  # Live Atlas E2E Integration Check
node src/test/testProfile.js             # User Profile & Security Tests
node src/test/testMyEvents.js            # My Events Hub Tests
node src/test/testRSVP.js                # Social RSVP Lifecycle Tests
node src/test/testAuth.js                # Auth, Bcrypt & JWT Tests
```
