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
          navigate("/login");
          return;
        }
        const data = await res.json();
        setProfile(data);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) return <p>Loading...</p>;
  if (!profile) return null;

  return (
    <div style={{ maxWidth: 400, margin: "60px auto", textAlign: "center" }}>
      <img
        src={profile.avatar}
        alt="avatar"
        style={{ borderRadius: "50%", width: 100 }}
      />
      <h2>{profile.name}</h2>
      <p>{profile.email}</p>
      <p>{profile.bio}</p>
    </div>
  );
}