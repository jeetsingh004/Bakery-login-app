import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // Save token — React now "remembers" this user is logged in
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect to profile page
      navigate("/profile");
    } catch (err) {
      setError("Something went wrong. Try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 320, margin: "60px auto" }}>
      <h2>Log in</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        style={{ width: "100%", marginBottom: 10, padding: 8 }}
      />
      <button type="submit" style={{ width: "100%", padding: 8 }}>
        Log in
      </button>
    </form>
  );
}