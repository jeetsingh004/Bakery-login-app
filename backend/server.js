require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  next();
});

const JWT_SECRET = process.env.JWT_SECRET;
const MONGO_URI = process.env.MONGO_URI;

if (!JWT_SECRET || !MONGO_URI) {
  console.error("Missing JWT_SECRET or MONGO_URI in .env file. Server cannot start.");
  process.exit(1);
}

// =====================================================================
// MONGODB CONNECTION
// =====================================================================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// =====================================================================
// SCHEMAS
// =====================================================================

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["admin", "customer"], default: "customer" },
  bio: { type: String, default: "" },
  avatar: { type: String, default: "https://i.pravatar.cc/150?img=12" },
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  blurb: { type: String, default: "" },
  img: {
    type: String,
    default: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80",
  },
  tag: { type: String, default: null },
});

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  items: { type: Array, required: true },
  total: { type: Number, default: 0 },
  status: { type: String, default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);

// ---------- ROUTE 1: LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
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
app.get("/api/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error fetching profile" });
  }
});

// ---------- ROUTES: PRODUCTS CRUD (ADMIN PROTECTED FOR WRITE) ----------

// 1. GET ALL PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching products" });
  }
});

// 2. CREATE PRODUCT (Admin only)
app.post("/api/products", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, category, price, blurb, img, tag } = req.body;
  if (!name || !category || price === undefined) {
    return res.status(400).json({ message: "Name, category, and price are required." });
  }

  try {
    const newProduct = await Product.create({
      name,
      category,
      price: Number(price),
      blurb: blurb || "",
      img: img || undefined,
      tag: tag || null,
    });
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: "Server error creating product" });
  }
});

// 3. UPDATE PRODUCT (Admin only)
app.put("/api/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { name, category, price, blurb, img, tag } = req.body;

  try {
    const existing = await Product.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Product not found." });
    }

    if (name !== undefined) existing.name = name;
    if (category !== undefined) existing.category = category;
    if (price !== undefined) existing.price = Number(price);
    if (blurb !== undefined) existing.blurb = blurb;
    if (img !== undefined && img !== "") existing.img = img;
    if (tag !== undefined) existing.tag = tag === "" ? null : tag;

    await existing.save();
    res.json(existing);
  } catch (err) {
    res.status(500).json({ message: "Server error updating product" });
  }
});

// 4. DELETE PRODUCT (Admin only)
app.delete("/api/products/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found." });
    }
    res.json({ message: "Product deleted successfully.", product: deletedProduct });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting product" });
  }
});

// ---------- ROUTES: ORDER MANAGEMENT ----------

// 1. GET ALL ORDERS (Admin only)
app.get("/api/orders", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching orders" });
  }
});

// 2. SUBMIT NEW ORDER (Customers)
app.post("/api/orders", async (req, res) => {
  const { customerName, phone, address, items, total, createdAt } = req.body;

  if (!customerName || !phone || !address) {
    return res.status(400).json({ message: "Customer name, phone, and address are required." });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "At least one cart item is required." });
  }

  try {
    const newOrder = await Order.create({
      customerName,
      phone,
      address,
      items,
      total: Number(total) || 0,
      status: "pending",
      createdAt: createdAt || new Date(),
    });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ message: "Server error creating order" });
  }
});

// ---------- ROUTE: UPDATE ORDER STATUS (Admin only) ----------
app.put("/api/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found." });
    }
    if (status !== undefined) order.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Server error updating order" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
