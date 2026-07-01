# 🍰 Bakery Login App

A full-stack bakery e-commerce app with authentication, a customer-facing shop, order checkout, and an admin dashboard for managing inventory and orders.

Built with **React (Vite)** on the frontend and **Express + MongoDB** on the backend.

## Features

- **User authentication** — JWT-based login with hashed passwords (bcrypt)
- **Role-based access** — `customer` and `admin` roles, with admin-only routes protected by middleware
- **Shop** — browse products by category, add items to a cart, and check out
- **Orders** — customers submit orders with contact/delivery info; admins view and update order status
- **Admin inventory** — create, update, and delete products from a dedicated admin panel
- **Profile** — view account details, bio, and avatar

## Tech Stack

**Frontend**
- React 19 + Vite
- React Router for client-side routing
- Plain CSS (no UI framework)

**Backend**
- Node.js + Express 5
- MongoDB with Mongoose
- JSON Web Tokens (`jsonwebtoken`) for auth
- `bcryptjs` for password hashing
- `dotenv` for environment configuration
- `cors` for cross-origin requests

## Project Structure

```
Bakery-login-app-main/
├── backend/
│   ├── server.js       # Express app, routes, and MongoDB models
│   ├── seed.js         # Seeds the database with demo users and products
│   ├── products.json   # Sample product data (legacy/reference)
│   ├── orders.json     # Sample order data (legacy/reference)
│   └── package.json
└── my-react-app/
    ├── src/
    │   ├── App.jsx            # Route definitions
    │   ├── login.jsx          # Login page
    │   ├── shop.jsx           # Storefront + cart + checkout
    │   ├── profile.jsx        # User profile page
    │   ├── AdminInventory.jsx # Admin product/order management
    │   └── main.jsx           # App entry point
    ├── vite.config.js         # Dev server + /api proxy to backend
    └── package.json
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- A MongoDB database (local instance or a hosted cluster, e.g. [MongoDB Atlas](https://www.mongodb.com/atlas))

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/Bakery-login-app-main.git
cd Bakery-login-app-main
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

Seed the database with demo users and products:

```bash
node seed.js
```

This creates two demo accounts (password for both: `password123`):

| Role     | Email               |
|----------|---------------------|
| Admin    | jeet@example.com    |
| Customer | john@example.com    |

Start the backend server:

```bash
npm start
```

The API runs on `http://localhost:5000` by default.

### 3. Set up the frontend

In a new terminal:

```bash
cd my-react-app
npm install
npm run dev
```

The Vite dev server proxies any request to `/api` through to `http://localhost:5000`, so the frontend and backend can run side by side without CORS configuration during development.

Open the app at the URL Vite prints (typically `http://localhost:5173`).

## API Overview

| Method | Endpoint              | Description                          | Auth required     |
|--------|------------------------|---------------------------------------|--------------------|
| POST   | `/api/login`            | Log in and receive a JWT              | No                 |
| GET    | `/api/profile`          | Get the logged-in user's profile      | Yes                |
| GET    | `/api/products`         | List all products                     | No                 |
| POST   | `/api/products`         | Create a product                      | Yes (admin)        |
| PUT    | `/api/products/:id`     | Update a product                      | Yes (admin)        |
| DELETE | `/api/products/:id`     | Delete a product                      | Yes (admin)        |
| GET    | `/api/orders`           | List all orders                       | Yes (admin)        |
| POST   | `/api/orders`           | Submit a new order                    | No                 |
| PUT    | `/api/orders/:id`       | Update an order's status              | Yes (admin)        |

Protected routes expect a bearer token:

```
Authorization: Bearer <token>
```

## Scripts

**Backend** (`backend/package.json`)
- `npm start` — start the Express server

**Frontend** (`my-react-app/package.json`)
- `npm run dev` — start the Vite dev server
- `npm run build` — build for production
- `npm run preview` — preview the production build
- `npm run lint` — lint the code with oxlint

## Notes

- `.env` files are git-ignored — never commit real secrets or database credentials.
- `products.json` and `orders.json` in the `backend/` folder appear to be legacy sample data from an earlier file-based version of the app; the live app now reads/writes to MongoDB via Mongoose.

## License

No license specified. Add a `LICENSE` file if you intend to open-source this project.
