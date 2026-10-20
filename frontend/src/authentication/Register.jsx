import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password) {
      setError("Please provide both a username and password.");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await register(formData.username.trim(), formData.email.trim(), formData.password);
      navigate("/dashboard");
    } catch (err) {
      console.error("Registration failure:", err);
      if (err.response?.data?.username) {
        setError(err.response.data.username[0]);
      } else if (err.response?.data?.password) {
        setError(err.response.data.password[0]);
      } else {
        setError("Registration could not be completed. Please try a different username.");
      }
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
          <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>Join Bloggin</h1>
          <p style={{ fontSize: "0.95rem" }}>Create your author profile and publish your ideas</p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
              Username *
            </label>
            <input
              type="text"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="e.g. ranjeet"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
              Email Address
            </label>
            <input
              type="email"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="e.g. ranjeet@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
              Password (min. 6 characters) *
            </label>
            <input
              type="password"
              className="search-input"
              style={{ paddingLeft: "14px" }}
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: "8px", width: "100%", padding: "12px" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Register Account"}
          </button>
        </form>

        <p style={{ marginTop: "24px", fontSize: "0.9rem", textAlign: "center" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </div>
    </main>
  );
}
