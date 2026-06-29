import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login"); // no token at all, don't even try
      return;
    }

    fetch("http://localhost:5000/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`, // <-- proving who we are
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          // token invalid/expired
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          navigate("/login");
          return;
        }
        const data = await res.json();
        setProfile(data);
      })
      .catch(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#fff8f0" }}>
        <p style={{ fontFamily: "System-UI, sans-serif", color: "#3d2b1f", fontSize: "1.2rem" }}>Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  const isAdmin = profile.role === "admin";

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#fff8f0",
      padding: "40px 20px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Inter', sans-serif",
      color: "#3d2b1f"
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        maxWidth: 450,
        width: "100%",
        padding: "40px 30px",
        borderRadius: "24px",
        boxShadow: "0 10px 30px rgba(45, 24, 16, 0.08)",
        textAlign: "center",
        border: "1px solid rgba(61, 43, 31, 0.08)"
      }}>
        <div style={{ position: "relative", display: "inline-block" }}>
          <img
            src={profile.avatar || "https://i.pravatar.cc/150?img=12"}
            alt="avatar"
            style={{
              borderRadius: "50%",
              width: 110,
              height: 110,
              objectFit: "cover",
              border: "3px solid #e8c4a0",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
            }}
          />
          {isAdmin && (
            <span style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              backgroundColor: "#b8541f",
              color: "#ffffff",
              fontSize: "11px",
              fontWeight: 600,
              padding: "4px 10px",
              borderRadius: "100px",
              textTransform: "uppercase",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}>
              Admin
            </span>
          )}
        </div>

        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: "28px",
          margin: "18px 0 6px",
          color: "#2d1810",
          fontWeight: 500
        }}>
          {profile.name}
        </h2>
        <p style={{
          fontSize: "14px",
          color: "rgba(61, 43, 31, 0.6)",
          margin: "0 0 16px"
        }}>
          {profile.email}
        </p>
        
        <p style={{
          fontSize: "15px",
          lineHeight: "1.6",
          color: "rgba(61, 43, 31, 0.8)",
          margin: "0 auto 28px",
          maxWidth: "320px"
        }}>
          {profile.bio || "No biography provided."}
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {isAdmin && (
            <button
              onClick={() => navigate("/admin/inventory")}
              style={{
                width: "100%",
                backgroundColor: "#b8541f",
                color: "#ffffff",
                border: "none",
                fontSize: "15px",
                fontWeight: 600,
                padding: "14px",
                borderRadius: "100px",
                cursor: "pointer",
                transition: "background 0.2s",
                boxShadow: "0 4px 12px rgba(184, 84, 31, 0.25)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#934213"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#b8541f"}
            >
              Manage Inventory Dashboard
            </button>
          )}

          <button
            onClick={() => navigate("/shop")}
            style={{
              width: "100%",
              backgroundColor: "#3d2b1f",
              color: "#f3ddc4",
              border: "none",
              fontSize: "15px",
              fontWeight: 600,
              padding: "14px",
              borderRadius: "100px",
              cursor: "pointer",
              transition: "background 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#2d1810"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#3d2b1f"}
          >
            Go to Shop
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              backgroundColor: "transparent",
              color: "rgba(61, 43, 31, 0.6)",
              border: "1.5px solid rgba(61, 43, 31, 0.15)",
              fontSize: "14px",
              fontWeight: 500,
              padding: "12px",
              borderRadius: "100px",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#2d1810";
              e.currentTarget.style.color = "#2d1810";
              e.currentTarget.style.backgroundColor = "rgba(45, 24, 16, 0.03)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "rgba(61, 43, 31, 0.15)";
              e.currentTarget.style.color = "rgba(61, 43, 31, 0.6)";
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}