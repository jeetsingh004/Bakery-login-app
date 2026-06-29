const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

const JWT_SECRET = "replace_this_with_a_real_secret_in_env_file";

// =====================================================================
// PERSISTENT PRODUCT STORAGE
// ---------------------------------------------------------------------
// Previously, `products` was just a JS array living in memory. That
// meant every time the server restarted (which happens constantly
// during development), all admin edits — including image changes —
// were silently wiped and replaced with the original seed data.
//
// This is the actual bug behind "image doesn't change for admin or
// customer": it WAS changing, but only until the next restart, which
// made it look random and unreliable.
//
// Fix: store products in a JSON file on disk (products.json). Every
// write (create/update/delete) saves to this file. On startup, we
// load from the file if it exists, otherwise we seed it once. From
// then on, the file IS the database — restarts no longer lose data.
// =====================================================================

const DATA_FILE = path.join(__dirname, "products.json");

const SEED_PRODUCTS = [
  {
    id: 1,
    name: "Honey Lavender Loaf",
    category: "Cakes",
    price: 28,
    blurb: "Wildflower honey, dried lavender, brown butter glaze.",
    img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80",
    tag: "Bestseller",
  },
  {
    id: 2,
    name: "Salted Caramel Tart",
    category: "Tarts",
    price: 9,
    blurb: "Dark chocolate shell, slow-cooked caramel, sea salt.",
    img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80",
    tag: null,
  },
  {
    id: 3,
    name: "Classic Croissant",
    category: "Pastries",
    price: 5,
    blurb: "72-hour laminated dough, baked fresh every morning.",
    img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80",
    tag: "Fresh today",
  },
  {
    id: 4,
    name: "Pistachio Rose Cake",
    category: "Cakes",
    price: 34,
    blurb: "Ground pistachio sponge, rosewater cream, candied petals.",
    img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&q=80",
    tag: null,
  },
  {
    id: 5,
    name: "Brown Butter Cookies",
    category: "Cookies",
    price: 4,
    blurb: "Nutty brown butter, flaky salt, six to a box.",
    img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
    tag: null,
  },
  {
    id: 6,
    name: "Cinnamon Morning Bun",
    category: "Pastries",
    price: 6,
    blurb: "Coiled brioche, cinnamon sugar, vanilla bean glaze.",
    img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    tag: "Fresh today",
  },
  {
    id: 7,
    name: "Vanilla Bean Cupcakes",
    category: "Cakes",
    price: 12,
    blurb: "Soft vanilla sponge with whipped buttercream and a sugared swirl.",
    img: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=600&q=80",
    tag: "New",
  },
  {
    id: 8,
    name: "Chocolate Espresso Cupcakes",
    category: "Cakes",
    price: 13,
    blurb: "Dark chocolate cake with espresso cream and cocoa nib crunch.",
    img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80",
    tag: "Bestseller",
  },
  {
    id: 9,
    name: "Almond Raspberry Tart",
    category: "Tarts",
    price: 10,
    blurb: "Buttery crust, almond cream, and bright raspberry compote.",
    img: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600&q=80",
    tag: null,
  },
  {
    id: 10,
    name: "Honey Pistachio Biscotti",
    category: "Cookies",
    price: 7,
    blurb: "Crunchy biscotti with honey glaze and toasted pistachios.",
    img: "https://images.unsplash.com/photo-1607919565149-65b33f167c43?w=600&q=80",
    tag: null,
  },
];

function loadProducts() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read products.json, falling back to seed data:", err.message);
      return [...SEED_PRODUCTS];
    }
  }
  // First run ever: create the file from seed data
  fs.writeFileSync(DATA_FILE, JSON.stringify(SEED_PRODUCTS, null, 2));
  return [...SEED_PRODUCTS];
}

function saveProducts(productsArray) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(productsArray, null, 2));
}

let products = loadProducts();

const ORDERS_FILE = path.join(__dirname, "orders.json");

function loadOrders() {
  if (fs.existsSync(ORDERS_FILE)) {
    try {
      const raw = fs.readFileSync(ORDERS_FILE, "utf-8");
      return JSON.parse(raw);
    } catch (err) {
      console.error("Failed to read orders.json, falling back to empty order list:", err.message);
      return [];
    }
  }

  fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  return [];
}

function saveOrders(ordersArray) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(ordersArray, null, 2));
}

let orders = loadOrders();

// --- Fake "database" for demo purposes (use real DB like MongoDB/Postgres in production) ---
const users = [
  {
    id: 1,
    name: "Jeet Kumar",
    email: "jeet@example.com",
    // bcrypt hash of "password123" - verified working hash
    passwordHash: "$2b$10$NKmqwkiBSTP6VdN8nNvbnuNUsix6D.7fUCB6DPnQXJbniI5fDgvnW",
    role: "admin",
    bio: "Chief Pastry Chef & Bakery Administrator.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
  {
    id: 2,
    name: "Customer John",
    email: "john@example.com",
    // bcrypt hash of "password123" - verified working hash
    passwordHash: "$2b$10$NKmqwkiBSTP6VdN8nNvbnuNUsix6D.7fUCB6DPnQXJbniI5fDgvnW",
    role: "customer",
    bio: "Devoted customer and dessert lover.",
    avatar: "https://i.pravatar.cc/150?img=33",
  },
];

// ---------- ROUTE 1: LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt - Email:", email);

  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  console.log("Login successful for:", email);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

// ---------- MIDDLEWARE: VERIFY TOKEN & ADMIN ----------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

function adminMiddleware(req, res, next) {
  if (req.userRole !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
}

// ---------- ROUTE 2: GET PROFILE (PROTECTED) ----------
app.get("/api/profile", authMiddleware, (req, res) => {
  const user = users.find((u) => u.id === req.userId);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    role: user.role,
  });
});

// ---------- ROUTES: PRODUCTS CRUD (ADMIN PROTECTED FOR WRITE) ----------

// 1. GET ALL PRODUCTS
app.get("/api/products", (req, res) => {
  res.json(products);
});

// 2. CREATE PRODUCT (Admin only)
app.post("/api/products", authMiddleware, adminMiddleware, (req, res) => {
  const { name, category, price, blurb, img, tag } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ message: "Name, category, and price are required." });
  }

  const newProduct = {
    id: products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1,
    name,
    category,
    price: Number(price),
    blurb: blurb || "",
    img: img || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
    tag: tag || null,
  };

  products.push(newProduct);
  saveProducts(products); // <-- persist to disk immediately
  res.status(201).json(newProduct);
});

// 3. UPDATE PRODUCT (Admin only) — this is the route that handles image changes
app.put("/api/products/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const { name, category, price, blurb, img, tag } = req.body;

  const productIdx = products.findIndex((p) => p.id === id);
  if (productIdx === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const existing = products[productIdx];
  const updatedProduct = {
    id,
    name: name !== undefined ? name : existing.name,
    category: category !== undefined ? category : existing.category,
    price: price !== undefined ? Number(price) : existing.price,
    blurb: blurb !== undefined ? blurb : existing.blurb,
    img: img !== undefined && img !== "" ? img : existing.img,
    tag: tag !== undefined ? (tag === "" ? null : tag) : existing.tag,
  };

  products[productIdx] = updatedProduct;
  saveProducts(products); // <-- persist to disk immediately, survives restarts now
  res.json(updatedProduct);
});

// 4. DELETE PRODUCT (Admin only)
app.delete("/api/products/:id", authMiddleware, adminMiddleware, (req, res) => {
  const id = Number(req.params.id);
  const productIdx = products.findIndex((p) => p.id === id);

  if (productIdx === -1) {
    return res.status(404).json({ message: "Product not found." });
  }

  const deletedProduct = products[productIdx];
  products.splice(productIdx, 1);
  saveProducts(products); // <-- persist to disk immediately
  res.json({ message: "Product deleted successfully.", product: deletedProduct });
});

// ---------- ROUTES: ORDER MANAGEMENT ----------

// 1. GET ALL ORDERS (Admin only)
app.get("/api/orders", authMiddleware, adminMiddleware, (req, res) => {
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
  res.json(sortedOrders);
});

// 2. SUBMIT NEW ORDER (Customers)
app.post("/api/orders", (req, res) => {
  const { customerName, phone, address, items, total, createdAt } = req.body;

  if (!customerName || !phone || !address) {
    return res.status(400).json({ message: "Customer name, phone, and address are required." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "At least one cart item is required." });
  }

  const newOrder = {
    id: orders.length > 0 ? Math.max(...orders.map((order) => order.id)) + 1 : 1,
    customerName,
    phone,
    address,
    items,
    total: Number(total) || 0,
    status: "pending",
    createdAt: createdAt || new Date().toISOString(),
  };

  orders.push(newOrder);
  saveOrders(orders);

  res.status(201).json(newOrder);
});

app.listen(5000, () => console.log("Server running on port 5000"));
