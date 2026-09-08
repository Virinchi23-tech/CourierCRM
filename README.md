# 📦 CourierCRM

> A full-stack Customer Relationship Management system built for **international courier & logistics companies**.  
> Manage enquiries, bookings, customers, payments, and team settings — all in one place.

---

## ✨ Features

| Module | Highlights |
|---|---|
| **Dashboard** | KPI cards, revenue charts, shipment status overview |
| **Leads** | Lead pipeline, CSV import, status tracking |
| **Enquiries** | Rate enquiries with volumetric/chargeable weight calculator, admin delete |
| **Bookings** | Booking management, dispatcher assignment, search & filter |
| **Customers** | Customer profiles, shipment history |
| **Payments** | Payment recording and status tracking |
| **Settings** | User management, company preferences, integrations, audit logs |
| **Auth** | JWT-based login, protected routes, role-aware UI |

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** [Turso](https://turso.tech/) (libSQL / SQLite-compatible, cloud-hosted)
- **Auth:** JSON Web Tokens (JWT) + bcryptjs
- **Security:** Helmet, CORS, express-rate-limit
- **Validation:** express-validator

### Frontend
- **Framework:** React 18 (Vite)
- **Routing:** React Router v6
- **Data Fetching:** TanStack Query v5 + Axios
- **Styling:** Tailwind CSS v3
- **Icons:** Lucide React
- **Charts:** Recharts

---

## 📁 Project Structure

```
CourierCRM/
├── backend/                  # Node/Express API server
│   ├── src/
│   │   ├── controllers/      # Route handlers (auth, bookings, customers …)
│   │   ├── db/               # Database client, init, seed scripts
│   │   ├── middleware/        # Auth guard, error handler
│   │   ├── routes/           # Express router definitions
│   │   └── server.js         # App entry point
│   ├── .env.example          # Environment variable template
│   └── package.json
│
└── frontend/                 # React + Vite SPA
    ├── src/
    │   ├── components/       # Shared UI components (Layout, Modal, etc.)
    │   ├── pages/            # Feature pages (Dashboard, Leads, Bookings …)
    │   ├── services/         # Axios API service layer
    │   └── main.jsx          # React entry point
    ├── index.html
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18 or later
- **npm** v9 or later
- A **Turso** account and database (or a local libSQL-compatible DB)

---

### 1. Clone the repository

```bash
git clone https://github.com/your-org/CourierCRM.git
cd CourierCRM
```

---

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in your values:

```env
PORT=5000
JWT_SECRET=your_super_secret_jwt_key

# Turso cloud database
TURSO_DATABASE_URL=libsql://<your-db>.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

Install dependencies and initialise the database:

```bash
npm install
npm run db:init   # Creates tables
npm run seed      # (Optional) Loads demo data
```

---

### 3. Configure the Frontend

```bash
cd ../frontend
```

If your backend runs on a port other than `5000`, update the proxy in `vite.config.js`:

```js
proxy: {
  '/api': 'http://localhost:5000'
}
```

Install dependencies:

```bash
npm install
```

---

### 4. Run in Development Mode

Open **two terminals**:

**Terminal 1 — Backend**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# App running on http://localhost:3000
```

Open your browser at **http://localhost:3000**.

---

## 🔑 Default Credentials (seeded demo data)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@couriercrm.com` | `admin123` |

> ⚠️ Change the default password immediately after first login.

---

## 📜 Available Scripts

### Backend (`cd backend`)
| Script | Description |
|---|---|
| `npm run dev` | Start server with hot-reload (`node --watch`) |
| `npm start` | Start server (production) |
| `npm run db:init` | Initialise database tables |
| `npm run seed` | Seed demo data |

### Frontend (`cd frontend`)
| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Build production bundle to `dist/` |
| `npm run preview` | Preview the production build locally |

---

## 🌐 API Overview

All API routes are prefixed with `/api`.

| Resource | Base Path |
|---|---|
| Auth | `/api/auth` |
| Dashboard | `/api/dashboard` |
| Leads | `/api/leads` |
| Enquiries | `/api/enquiries` |
| Bookings | `/api/bookings` |
| Customers | `/api/customers` |
| Payments | `/api/payments` |
| Settings | `/api/settings` |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.

---

<p align="center">Built with ❤️ for logistics teams everywhere</p>
