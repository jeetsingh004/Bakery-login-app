import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Shop.css";

// ---------- PRODUCT DATA ----------
const PRODUCTS = [
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

const CATEGORIES = ["All", "Cakes", "Tarts", "Pastries", "Cookies"];

export default function Shop() {
  const [productsList, setProductsList] = useState(PRODUCTS);
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]); // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const [user, setUser] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState("cart"); // "cart" | "checkout" | "success"
  const [orderForm, setOrderForm] = useState({
    name: "",
    phone: "",
    address: ""
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setOrderForm((prev) => ({ ...prev, name: user.name }));
    }
  }, [user]);

  // Fetch the current product list from the backend. This is the single
  // source of truth — no localStorage cache, no polling. The backend's
  // products.json file is what's authoritative, so we just ask it fresh
  // whenever we need to know the current state.
  const loadProductsFromServer = () => {
    fetch(`/api/products?cb=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch products");
        return res.json();
      })
      .then((data) => setProductsList(data))
      .catch((err) => {
        console.warn("Could not load products from server:", err.message);
      });
  };

  // Fetch products from backend on mount
  useEffect(() => {
    loadProductsFromServer();

    const savedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (token) {
      fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error("Profile fetch failed");
          return res.json();
        })
        .then((profile) => {
          setUser(profile);
          localStorage.setItem("user", JSON.stringify(profile));
        })
        .catch(() => {
          if (savedUser) {
            try {
              setUser(JSON.parse(savedUser));
            } catch (e) {
              console.error("Failed to parse user details:", e);
            }
          }
        });
    } else if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user details:", e);
      }
    }
  }, []);

  // Refetch products whenever the user comes back to this tab — covers
  // the common case of "admin edited it in another tab, now check here."
  // No polling interval, no custom events, no storage listeners — those
  // were all trying to work around products.json not existing; now that
  // the backend actually persists data, a simple refetch-on-focus is enough.
  useEffect(() => {
    window.addEventListener("focus", loadProductsFromServer);
    return () => window.removeEventListener("focus", loadProductsFromServer);
  }, []);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return productsList;
    return productsList.filter((p) => p.category === activeCategory);
  }, [activeCategory, productsList]);

  const addToCart = (id) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing) {
        return prev.map((item) =>
          item.id === id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { id, qty: 1 }];
    });
    setJustAdded(id);
    setTimeout(() => setJustAdded(null), 900);
  };

  const updateQty = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === id ? { ...item, qty: item.qty + delta } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const handlePlaceOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address || cartItems.length === 0) return;

    const orderPayload = {
      customerName: orderForm.name,
      phone: orderForm.phone,
      address: orderForm.address,
      items: cartItems.map(({ id, qty, product }) => ({
        id,
        name: product.name,
        qty,
        price: product.price,
        subtotal: product.price * qty,
      })),
      total: totalPrice,
      createdAt: new Date().toISOString(),
    };

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to place order.");
      }

      setCheckoutStep("success");
      setCart([]);
      setOrderForm({
        name: user?.name || "",
        phone: "",
        address: "",
      });
      window.localStorage.setItem("orders-last-updated", Date.now().toString());
      window.dispatchEvent(new Event("orders-updated"));
    } catch (err) {
      alert(err.message);
    }
  };

  const cartItems = useMemo(() => {
    return cart
      .map((item) => {
        const foundProduct = productsList.find((p) => p.id === item.id);
        if (!foundProduct) return null;
        return {
          ...item,
          product: foundProduct,
        };
      })
      .filter(Boolean);
  }, [cart, productsList]);

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  
  const totalPrice = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  }, [cartItems]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/login");
  };

  return (
    <div className="shop">
      {/* ---------- HEADER ---------- */}
      <header className="shop-header">
        <div className="shop-header-inner">
          <span className="shop-logo" onClick={() => navigate("/shop")} style={{ cursor: "pointer" }}>7s Bakes</span>
          <nav className="shop-nav">
            {user ? (
              <>
                <span className="user-welcome" style={{ color: "var(--caramel-light)", fontSize: "14px", marginRight: "10px" }}>
                  Hello, <strong>{user.name.split(" ")[0]}</strong>
                </span>
                {user.role === "admin" && (
                  <button onClick={() => navigate("/admin/inventory")} className="logout-btn" style={{ borderColor: "var(--cinnamon)", color: "var(--caramel-light)", backgroundColor: "rgba(184, 84, 31, 0.15)" }}>
                    Admin Panel
                  </button>
                )}
                <button onClick={() => navigate("/profile")} className="logout-btn">
                  Profile
                </button>
                <button onClick={handleLogout} className="logout-btn">
                  Log out
                </button>
              </>
            ) : (
              <button onClick={() => navigate("/login")} className="logout-btn">
                Log in
              </button>
            )}
            <button
              className="cart-trigger"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 4h2l2.4 12.4a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="9" cy="20" r="1.4" fill="currentColor" />
                <circle cx="17" cy="20" r="1.4" fill="currentColor" />
              </svg>
              {totalItems > 0 && (
                <span className="cart-count">{totalItems}</span>
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* ---------- HERO ---------- */}
      <section className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">Handmade with love, baked fresh daily</p>
          <h1 className="hero-title">
            Every Celebration,
            <br />
            Starts With Something Sweet
          </h1>
          <p className="hero-sub">
          Order Now and Get 10% Off on Your First Purchase!
          </p>
          <a href="#shop" className="hero-cta">
            Order now
          </a>
        </div>
      </section>

      {/* ---------- SCALLOPED DIVIDER (signature element) ---------- */}
      <svg
        className="scallop-divider"
        viewBox="0 0 1200 40"
        preserveAspectRatio="none"
      >
        <path
          d="M0,40 L0,20 Q15,0 30,20 Q45,40 60,20 Q75,0 90,20 Q105,40 120,20 Q135,0 150,20 Q165,40 180,20 Q195,0 210,20 Q225,40 240,20 Q255,0 270,20 Q285,40 300,20 Q315,0 330,20 Q345,40 360,20 Q375,0 390,20 Q405,40 420,20 Q435,0 450,20 Q465,40 480,20 Q495,0 510,20 Q525,40 540,20 Q555,0 570,20 Q585,40 600,20 Q615,0 630,20 Q645,40 660,20 Q675,0 690,20 Q705,40 720,20 Q735,0 750,20 Q765,40 780,20 Q795,0 810,20 Q825,40 840,20 Q855,0 870,20 Q885,40 900,20 Q915,0 930,20 Q945,40 960,20 Q975,0 990,20 Q1005,40 1020,20 Q1035,0 1050,20 Q1065,40 1080,20 Q1095,0 1110,20 Q1125,40 1140,20 Q1155,0 1170,20 Q1185,40 1200,20 L1200,40 Z"
          fill="var(--cream)"
        />
      </svg>

      {/* ---------- SHOP ---------- */}
      <main className="shop-main" id="shop">
        <div className="category-bar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${
                activeCategory === cat ? "active" : ""
              }`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-img-wrap">
                <img src={product.img} alt={product.name} loading="lazy" />
                {product.tag && (
                  <span className="product-tag">{product.tag}</span>
                )}
              </div>
              <div className="product-info">
                <div className="product-head">
                  <h3>{product.name}</h3>
                  <span className="product-price">₹{product.price}</span>
                </div>
                <p className="product-blurb">{product.blurb}</p>
                <button
                  className={`add-btn ${
                    justAdded === product.id ? "added" : ""
                  }`}
                  onClick={() => addToCart(product.id)}
                >
                  {justAdded === product.id ? "Added" : "Add to box"}
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>

      {/* ---------- CART DRAWER ---------- */}
      <div
        className={`cart-overlay ${cartOpen ? "visible" : ""}`}
        onClick={() => setCartOpen(false)}
      />
      <aside className={`cart-drawer ${cartOpen ? "open" : ""}`}>
        <div className="cart-drawer-header">
          <h2>Your order</h2>
          <button
            className="cart-close"
            onClick={() => setCartOpen(false)}
            aria-label="Close cart"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 5l14 14M19 5L5 19"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {checkoutStep === "cart" && (
          cartItems.length === 0 ? (
            <div className="cart-empty">
              <p>Your box is empty.</p>
              <span>Add something warm from the case.</span>
            </div>
          ) : (
            <>
              <ul className="cart-list">
                {cartItems.map(({ id, qty, product }) => (
                  <li className="cart-item" key={id}>
                    <img src={product.img} alt={product.name} />
                    <div className="cart-item-info">
                      <span className="cart-item-name">{product.name}</span>
                      <span className="cart-item-price">
                        ₹{product.price} each
                      </span>
                    </div>
                    <div className="cart-qty">
                      <button onClick={() => updateQty(id, -1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{qty}</span>
                      <button onClick={() => updateQty(id, 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                <button className="checkout-btn" onClick={() => setCheckoutStep("checkout")}>
                  Checkout
                </button>
              </div>
            </>
          )
        )}

        {checkoutStep === "checkout" && (
          <div className="cart-checkout-form" style={{ padding: "24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "20px", color: "var(--chocolate)", margin: "0 0 8px" }}>Delivery Details</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em" }}>Your Name *</label>
              <input
                type="text"
                value={orderForm.name}
                onChange={(e) => setOrderForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Full Name"
                required
                style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--line)", outline: "none", fontSize: "14px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em" }}>Phone Number *</label>
              <input
                type="tel"
                value={orderForm.phone}
                onChange={(e) => setOrderForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="e.g., +91 98765 43210"
                required
                style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--line)", outline: "none", fontSize: "14px" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <label style={{ fontSize: "12px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.03em" }}>Delivery Location / Address *</label>
              <textarea
                value={orderForm.address}
                onChange={(e) => setOrderForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter complete building address, street name, pincode"
                rows="4"
                required
                style={{ padding: "10px", borderRadius: "10px", border: "1px solid var(--line)", outline: "none", fontSize: "14px", fontFamily: "inherit", resize: "none" }}
              />
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingTop: "20px", borderTop: "1px solid var(--line)" }}>
              <div className="cart-total" style={{ margin: "0 0 10px", display: "flex", justifyContent: "space-between", alignItems: "baseline", fontFamily: "Fraunces, serif" }}>
                <span style={{ fontSize: "15px", fontFamily: "Inter, sans-serif", color: "rgba(61, 43, 31, 0.7)" }}>Grand Total</span>
                <span style={{ fontSize: "24px", color: "var(--cocoa)", fontWeight: "500" }}>₹{totalPrice.toFixed(2)}</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                className="checkout-btn"
                disabled={!orderForm.name || !orderForm.phone || !orderForm.address}
                style={{ opacity: (!orderForm.name || !orderForm.phone || !orderForm.address) ? 0.6 : 1 }}
              >
                Place Order
              </button>
              <button
                onClick={() => setCheckoutStep("cart")}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(61, 43, 31, 0.6)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  padding: "8px"
                }}
              >
                ← Back to Cart
              </button>
            </div>
          </div>
        )}

        {checkoutStep === "success" && (
          <div className="cart-success" style={{ padding: "40px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: "16px" }}>
            <span style={{ fontSize: "60px" }}>🎉</span>
            <h3 style={{ fontFamily: "Fraunces, serif", fontSize: "24px", color: "var(--chocolate)", margin: "0" }}>Order Placed!</h3>
            <p style={{ fontSize: "15px", lineHeight: "1.6", color: "rgba(61, 43, 31, 0.8)", margin: "0 0 10px" }}>
              Thank you, <strong>{orderForm.name}</strong>! Your freshly baked goodies will be delivered to:
            </p>
            <div style={{ backgroundColor: "#ffffff", padding: "12px 18px", borderRadius: "12px", border: "1px dashed var(--line)", fontSize: "14px", color: "var(--cocoa)", width: "100%", wordBreak: "break-word" }}>
              {orderForm.address}
            </div>
            <p style={{ fontSize: "13px", color: "rgba(61, 43, 31, 0.55)", margin: "0" }}>
              Our delivery partner will contact you at <strong>{orderForm.phone}</strong> when they arrive.
            </p>
            <button
              onClick={() => {
                setCheckoutStep("cart");
                setCartOpen(false);
              }}
              className="checkout-btn"
              style={{ marginTop: "24px", width: "100%" }}
            >
              Close & Continue Shopping
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
