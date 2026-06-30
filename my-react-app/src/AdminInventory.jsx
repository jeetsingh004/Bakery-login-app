import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminInventory.css";

const CATEGORIES = ["Cakes", "Tarts", "Pastries", "Cookies"];

export default function AdminInventory() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [toast, setToast] = useState(null); // { message, type: 'success' | 'error' }

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null if adding new
  const [formData, setFormData] = useState({
    name: "",
    category: "Cakes",
    price: "",
    blurb: "",
    img: "",
    tag: "",
  });
  const [currentImage, setCurrentImage] = useState("");
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);

  // Delete Confirmation states
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const navigate = useNavigate();

  // Show toast utility
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch the current product list from the backend. This is the single
  // source of truth — no localStorage cache. The backend's products.json
  // file is authoritative, so a fresh fetch always reflects reality.
  const syncProductsFromServer = () => {
    setLoading(true);
    return fetch(`/api/products?cb=${Date.now()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Could not load products.");
        return res.json();
      })
      .then((data) => {
        setProducts(data);
        return data;
      })
      .catch((err) => {
        showToast(err.message, "error");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Auth and initial fetch
  useEffect(() => {
    let isMounted = true;

    const verifyAdminAccess = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (!isMounted) return;
        showToast("Access Denied. Please log in first.", "error");
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      try {
        const res = await fetch("/api/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          if (!isMounted) return;
          showToast("Access Denied. Please log in first.", "error");
          setTimeout(() => navigate("/login"), 1500);
          return;
        }

        const profile = await res.json();

        if (profile.role !== "admin") {
          if (!isMounted) return;
          showToast("Access Denied. Admins only.", "error");
          setTimeout(() => navigate("/shop"), 1500);
          return;
        }

        if (!isMounted) return;
        localStorage.setItem("user", JSON.stringify(profile));
        setAuthorized(true);
        syncProductsFromServer();
        syncOrdersFromServer();
      } catch (e) {
        if (!isMounted) return;
        showToast("Session error.", "error");
        setTimeout(() => navigate("/login"), 1500);
      }
    };

    verifyAdminAccess();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const syncOrdersFromServer = async () => {
    setOrdersLoading(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Could not load orders.");
      }

      const data = await res.json();
      setOrders(data);
      setOrdersError(null);
      return data;
    } catch (err) {
      setOrdersError(err.message);
      showToast(err.message, "error");
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchProducts = () => {
    return syncProductsFromServer();
  };

  // Form submission: Create or Update
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!formData.name || !formData.category || !formData.price) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    const payload = {
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      blurb: formData.blurb,
      tag: formData.tag.trim() === "" ? null : formData.tag.trim(),
    };

    if (formData.img) {
      payload.img = formData.img;
    }

    const url = editingProduct
      ? `/api/products/${editingProduct.id}`
      : "/api/products";
    const method = editingProduct ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to save product.");
      }

      showToast(
        editingProduct
          ? "Product updated successfully!"
          : "Product added successfully!"
      );
      setModalOpen(false);
      await fetchProducts();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  // Open modal for editing
  const handleEditClick = (product) => {
    setEditingProduct(product);
    setCurrentImage(product.img || "");
    setFormData({
      name: product.name,
      category: product.category,
      price: product.price.toString(),
      blurb: product.blurb || "",
      img: "",
      tag: product.tag || "",
    });
    setModalOpen(true);
  };

  // Open modal for adding
  const handleAddClick = () => {
    setEditingProduct(null);
    setCurrentImage("");
    setFormData({
      name: "",
      category: "Cakes",
      price: "",
      blurb: "",
      img: "",
      tag: "",
    });
    setModalOpen(true);
  };

  // Trigger custom delete dialog
  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setDeleteConfirmOpen(true);
  };

  useEffect(() => {
    const handleOrdersUpdated = () => {
      syncOrdersFromServer();
    };

    const handleStorageUpdated = (event) => {
      if (event.key === "orders-last-updated" && event.newValue) {
        syncOrdersFromServer();
      }
    };

    window.addEventListener("orders-updated", handleOrdersUpdated);
    window.addEventListener("storage", handleStorageUpdated);

    return () => {
      window.removeEventListener("orders-updated", handleOrdersUpdated);
      window.removeEventListener("storage", handleStorageUpdated);
    };
  }, []);

  // Perform delete operation
  const confirmDelete = async () => {
    if (!productToDelete) return;
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete product.");
      }

      showToast("Product deleted successfully!");
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
      await fetchProducts();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Image size must be less than 5MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, img: reader.result }));
        setCurrentImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Search and filter logic
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.blurb.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === "All" || product.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, activeCategory]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = products.length;
    const value = products.reduce((acc, p) => acc + p.price, 0);
    const avg = total > 0 ? (value / total).toFixed(2) : 0;
    
    // category counts
    const counts = products.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    const topCategory = Object.entries(counts).reduce(
      (max, curr) => (curr[1] > max[1] ? curr : max),
      ["None", 0]
    )[0];

    return { total, value, avg, topCategory };
  }, [products]);

  if (!authorized) {
    return (
      <div className="admin-loading-screen">
        <div className="spinner"></div>
        <p>Verifying admin permissions...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Toast Alert */}
      {toast && (
        <div className={`toast-alert ${toast.type}`}>
          <span className="toast-icon">
            {toast.type === "success" ? "✓" : "⚠"}
          </span>
          <span className="toast-message">{toast.message}</span>
        </div>
      )}

      {/* ---------- HEADER ---------- */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="logo-group">
            <span className="admin-logo-text" onClick={() => navigate("/shop")}>7s Bakes</span>
            <span className="admin-tagline">Inventory Control Panel</span>
          </div>
          <div className="header-actions">
            <button className="back-store-btn" onClick={() => navigate("/shop")}>
              ← Customer View
            </button>
            <button className="back-store-btn" onClick={() => navigate("/profile")}>
              Admin Profile
            </button>
          </div>
        </div>
      </header>

      {/* ---------- STATS BAR ---------- */}
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-icon-wrap blue">📦</div>
          <div className="stat-details">
            <h3>Total Items</h3>
            <p className="stat-value">{stats.total}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap green">💰</div>
          <div className="stat-details">
            <h3>Asset Value</h3>
            <p className="stat-value">₹{stats.value.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap gold">🏷</div>
          <div className="stat-details">
            <h3>Average Price</h3>
            <p className="stat-value">₹{stats.avg}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon-wrap orange">✨</div>
          <div className="stat-details">
            <h3>Top Category</h3>
            <p className="stat-value">{stats.topCategory}</p>
          </div>
        </div>
      </section>

      {/* ---------- MAIN DASHBOARD ---------- */}
      <main className="dashboard-content">
        <div className="dashboard-controls">
          <div className="search-box-wrap">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="Search products by name or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-pills-bar">
            {["All", ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                className={`filter-pill ${activeCategory === cat ? "active" : ""}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <button className="add-product-btn" onClick={handleAddClick}>
            + Add New Product
          </button>
        </div>

        {/* ---------- PRODUCTS GRID/TABLE ---------- */}
        <div className="table-card">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="spinner"></div>
              <p>Fetching inventory...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-inventory">
              <p className="empty-title">No products found</p>
              <p className="empty-sub">Try adjusting your search filters or add a new recipe.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Tag</th>
                    <th>Short Blurb</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="product-cell">
                          <img
                            src={product.img || "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=80"}
                            alt={product.name}
                            className="table-product-thumb"
                          />
                          <div className="product-meta">
                            <span className="product-cell-name">{product.name}</span>
                            <span className="product-cell-id">ID: #{product.id}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-tag">{product.category}</span>
                      </td>
                      <td>
                        <span className="price-tag">₹{product.price.toFixed(2)}</span>
                      </td>
                      <td>
                        {product.tag ? (
                          <span className="promo-badge">{product.tag}</span>
                        ) : (
                          <span className="none-text">-</span>
                        )}
                      </td>
                      <td>
                        <p className="blurb-cell" title={product.blurb}>{product.blurb || "No blurb provided."}</p>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEditClick(product)}
                            aria-label="Edit product"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="action-btn delete"
                            onClick={() => handleDeleteClick(product)}
                            aria-label="Delete product"
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ---------- ORDERS PANEL ---------- */}
        <section className="orders-card">
          <div className="orders-card-header">
            <div>
              <h2>Recent Customer Orders</h2>
              <p className="orders-subtitle">Orders placed by customers appear here for admin review.</p>
            </div>
            <button className="refresh-orders-btn" onClick={syncOrdersFromServer}>
              Refresh Orders
            </button>
          </div>

          {ordersLoading ? (
            <div className="orders-loading">
              <div className="spinner"></div>
              <p>Loading orders...</p>
            </div>
          ) : ordersError ? (
            <div className="orders-error">{ordersError}</div>
          ) : orders.length === 0 ? (
            <div className="orders-empty">
              <p>No orders have been placed yet.</p>
              <span>Customers will see their orders here once they check out.</span>
            </div>
          ) : (
            <div className="orders-list">
              {orders.slice(0, 8).map((order) => (
                <div className="order-card" key={order.id}>
                  <div className="order-card-top">
                    <div>
                      <span className="order-label">Order #{order.id}</span>
                      <span className="order-date">{new Date(order.createdAt).toLocaleString()}</span>
                    </div>
                    <span className="order-status">{order.status}</span>
                  </div>
                  <div className="order-customer">
                    <strong>{order.customerName}</strong>
                    <span>{order.phone}</span>
                  </div>
                  <div className="order-address">{order.address}</div>
                  <div className="order-items">
                    {order.items.map((item) => (
                      <div className="order-item" key={`${order.id}-${item.id}`}>
                        <span>{item.qty}× {item.name}</span>
                        <strong>₹{item.subtotal.toFixed(2)}</strong>
                      </div>
                    ))}
                  </div>
                  <div className="order-total">
                    <span>Total</span>
                    <strong>₹{order.total.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ---------- FORM MODAL (ADD / EDIT) ---------- */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingProduct ? "Edit Product" : "Add New Bakery Product"}</h2>
              <button className="close-modal-btn" onClick={() => setModalOpen(false)}>×</button>
            </div>
            
            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-name">Product Name *</label>
                  <input
                    type="text"
                    id="form-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Raspberry Glazed Cronut"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-category">Category *</label>
                  <select
                    id="form-category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="form-price">Price (₹) *</label>
                  <input
                    type="number"
                    id="form-price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g., 6.50"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="form-tag">Promo Tag (Optional)</label>
                  <input
                    type="text"
                    id="form-tag"
                    name="tag"
                    value={formData.tag}
                    onChange={handleInputChange}
                    placeholder="e.g., Bestseller, Chef's Choice"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="form-img">Product Image *</label>
                <input
                  type="file"
                  id="form-img"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ padding: "8px" }}
                />
                {editingProduct && formData.img && (
                  <span style={{ fontSize: "12.5px", color: "var(--success)", marginTop: "4px", fontWeight: "500" }}>
                    ✓ Image currently set (upload another to replace)
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="form-blurb">Product Blurb / Description</label>
                <textarea
                  id="form-blurb"
                  name="blurb"
                  value={formData.blurb}
                  onChange={handleInputChange}
                  placeholder="Describe the texture, key ingredients, glaze etc."
                  rows="3"
                ></textarea>
              </div>

              {(formData.img || currentImage) && (
                <div className="image-preview-box">
                  <p>Image Preview</p>
                  <img
                    src={formData.img || currentImage}
                    alt="Preview"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80";
                    }}
                  />
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingProduct ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------- CONFIRM DELETE DIALOG ---------- */}
      {deleteConfirmOpen && productToDelete && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmOpen(false)}>
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon">⚠️</div>
            <h2>Remove Product?</h2>
            <p>
              Are you sure you want to delete <strong>{productToDelete.name}</strong> from the inventory? This action is permanent and will remove it from the customer shop page.
            </p>
            <div className="confirm-actions">
              <button className="confirm-cancel" onClick={() => setDeleteConfirmOpen(false)}>
                No, Keep It
              </button>
              <button className="confirm-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
