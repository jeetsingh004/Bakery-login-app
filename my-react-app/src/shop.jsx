import { useState, useMemo } from "react";
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
    name: "Dark Chocolate Babka",
    category: "Cakes",
    price: 22,
    blurb: "Braided yeasted dough, bittersweet chocolate ribbon.",
    img: "https://images.unsplash.com/photo-1606890658317-7d14490b76fd?w=600&q=80",
    tag: null,
  },
  {
    id: 8,
    name: "Lemon Curd Tartlets",
    category: "Tarts",
    price: 8,
    blurb: "Buttery shell, tangy curd, torched meringue peak.",
    img: "https://images.unsplash.com/photo-1551404973-761c83cd8335?w=600&q=80",
    tag: null,
  },
];

const CATEGORIES = ["All", "Cakes", "Tarts", "Pastries", "Cookies"];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [cart, setCart] = useState([]); // [{id, qty}]
  const [cartOpen, setCartOpen] = useState(false);
  const [justAdded, setJustAdded] = useState(null);
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") return PRODUCTS;
    return PRODUCTS.filter((p) => p.category === activeCategory);
  }, [activeCategory]);

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

  const cartItems = cart.map((item) => ({
    ...item,
    product: PRODUCTS.find((p) => p.id === item.id),
  }));

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="shop">
      {/* ---------- HEADER ---------- */}
      <header className="shop-header">
        <div className="shop-header-inner">
          <span className="shop-logo">7s Bakes</span>
          <nav className="shop-nav">
            <button onClick={handleLogout} className="logout-btn">
              Log out
            </button>
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
                  <span className="product-price">${product.price}</span>
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

        {cartItems.length === 0 ? (
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
                      ${product.price} each
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
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button className="checkout-btn">Checkout</button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
