require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGO_URI = process.env.MONGO_URI;

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  passwordHash: String,
  role: String,
  bio: String,
  avatar: String,
});

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  price: Number,
  blurb: String,
  img: String,
  tag: String,
});

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);

const SEED_PRODUCTS = [
  { name: "Honey Lavender Loaf", category: "Cakes", price: 28, blurb: "Wildflower honey, dried lavender, brown butter glaze.", img: "https://images.unsplash.com/photo-1551024506-0bccd828d307?w=600&q=80", tag: "Bestseller" },
  { name: "Salted Caramel Tart", category: "Tarts", price: 9, blurb: "Dark chocolate shell, slow-cooked caramel, sea salt.", img: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&q=80", tag: null },
  { name: "Classic Croissant", category: "Pastries", price: 5, blurb: "72-hour laminated dough, baked fresh every morning.", img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&q=80", tag: "Fresh today" },
  { name: "Pistachio Rose Cake", category: "Cakes", price: 34, blurb: "Ground pistachio sponge, rosewater cream, candied petals.", img: "https://images.unsplash.com/photo-1535141192574-5d4897c12636?w=600&q=80", tag: null },
  { name: "Brown Butter Cookies", category: "Cookies", price: 4, blurb: "Nutty brown butter, flaky salt, six to a box.", img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80", tag: null },
  { name: "Cinnamon Morning Bun", category: "Pastries", price: 6, blurb: "Coiled brioche, cinnamon sugar, vanilla bean glaze.", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&q=80", tag: "Fresh today" },
  { name: "Vanilla Bean Cupcakes", category: "Cakes", price: 12, blurb: "Soft vanilla sponge with whipped buttercream and a sugared swirl.", img: "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=600&q=80", tag: "New" },
  { name: "Chocolate Espresso Cupcakes", category: "Cakes", price: 13, blurb: "Dark chocolate cake with espresso cream and cocoa nib crunch.", img: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&q=80", tag: "Bestseller" },
  { name: "Almond Raspberry Tart", category: "Tarts", price: 10, blurb: "Buttery crust, almond cream, and bright raspberry compote.", img: "https://images.unsplash.com/photo-1519869325930-281384150729?w=600&q=80", tag: null },
  { name: "Honey Pistachio Biscotti", category: "Cookies", price: 7, blurb: "Crunchy biscotti with honey glaze and toasted pistachios.", img: "https://images.unsplash.com/photo-1607919565149-65b33f167c43?w=600&q=80", tag: null },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB for seeding...");

  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const passwordHash = await bcrypt.hash("password123", 10);
    await User.create([
      {
        name: "Jeet Singh",
        email: "jeet@example.com",
        passwordHash,
        role: "admin",
        bio: "Chief Pastry Chef & Bakery Administrator.",
        avatar: "https://i.pravatar.cc/150?img=12",
      },
      {
        name: "Customer John",
        email: "john@example.com",
        passwordHash,
        role: "customer",
        bio: "Devoted customer and dessert lover.",
        avatar: "https://i.pravatar.cc/150?img=33",
      },
    ]);
    console.log("Seeded 2 users (jeet@example.com / john@example.com, password: password123)");
  } else {
    console.log(`Users already exist (${userCount} found), skipping user seed.`);
  }

  const productCount = await Product.countDocuments();
  if (productCount === 0) {
    await Product.insertMany(SEED_PRODUCTS);
    console.log(`Seeded ${SEED_PRODUCTS.length} products.`);
  } else {
    console.log(`Products already exist (${productCount} found), skipping product seed.`);
  }

  console.log("Seeding complete.");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding error:", err);
  process.exit(1);
});