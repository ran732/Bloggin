import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Please fill in both fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await login(username.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Login failure:", err);
      setError(
        err.response?.data?.error ||
        "Invalid username or password. Please verify your credentials."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: "480px", padding: "64px 24px 80px" }}>
      <div className="state-box" style={{ textAlign: "left", padding: "36px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-icon" style={{ margin: "0 auto 12px", width: "48px", height: "48px", fontSize: "1.4rem" }}>
            ✍
          </div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>Welcome Back</h1>
          <p style={{ fontSize: "0.95rem" }}>Sign in to publish, manage, and engage with articles</p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
              Username
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="e.g. ranjeet"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Password
              </label>
              <Link to="/forgot-password" style={{ fontSize: "0.825rem", color: "var(--color-primary)" }}>
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>


          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "8px", width: "100%", padding: "12px" }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In to Bloggin"}
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "0.9rem", textAlign: "center" }}>
          Don't have an author account?{" "}
          <Link to="/register" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Create one here
          </Link>
        </p>
      </div>
    </main>
  );
}
