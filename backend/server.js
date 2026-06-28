const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = "replace_this_with_a_real_secret_in_env_file";

// --- Fake "database" for demo purposes (use real DB like MongoDB/Postgres in production) ---
const users = [
  {
    id: 1,
    name: "Jeet Kumar",
    email: "jeet@example.com",
    // bcrypt hash of "password123" - verified working hash
    passwordHash: "$2b$10$NKmqwkiBSTP6VdN8nNvbnuNUsix6D.7fUCB6DPnQXJbniI5fDgvnW",
    bio: "Full-stack dev in progress.",
    avatar: "https://i.pravatar.cc/150?img=12",
  },
];

// ---------- ROUTE 1: LOGIN ----------
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt - Email:", email, "Password:", password);

  // 1. Find user by email
  const user = users.find((u) => u.email === email);
  if (!user) {
    console.log("User not found with email:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  // 2. Compare password with stored hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    console.log("Password did not match for:", email);
    return res.status(401).json({ message: "Invalid email or password" });
  }

  console.log("Login successful for:", email);

  // 3. Create JWT token (this is the "proof of identity")
  const token = jwt.sign(
    { userId: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  // 4. Send token + basic user info back to React
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
});

// ---------- MIDDLEWARE: VERIFY TOKEN ----------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization; // "Bearer <token>"
  if (!authHeader) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId; // attach userId to request for next handler
    next(); // token valid, proceed to the actual route
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
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
  });
});

app.listen(5000, () => console.log("Server running on port 5000"));
