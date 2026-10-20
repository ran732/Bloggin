import { useState } from "react";
import { Link } from "react-router";
import { authService } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your account email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch (err) {
      console.error("Password reset request error:", err);
      setError("Unable to process request. Please check your network connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container" style={{ maxWidth: "480px", padding: "64px 24px 80px" }}>
      <div className="state-box" style={{ textAlign: "left", padding: "36px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-icon" style={{ margin: "0 auto 12px", width: "48px", height: "48px", fontSize: "1.4rem" }}>
            🔑
          </div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>Reset Password</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
            Enter your email and we'll send you a secure link to reset your password.
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        {submitted ? (
          <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>✉️</div>
            <h3 style={{ fontSize: "1.15rem", color: "#16a34a", marginBottom: "8px" }}>Check your inbox</h3>
            <p style={{ fontSize: "0.925rem", color: "var(--text-main)", lineHeight: "1.5", marginBottom: "20px" }}>
              If an account with <strong>{email}</strong> exists, we've dispatched a password reset link.
              Please check your email and click the link to set a new password.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Link to="/login" className="btn btn-primary" style={{ fontSize: "0.9rem" }}>
                Return to Sign In
              </Link>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ fontSize: "0.9rem" }}
                onClick={() => setSubmitted(false)}
              >
                Send Again
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                Registered Email Address
              </label>
              <input
                type="email"
                className="search-input"
                style={{ paddingLeft: "14px" }}
                placeholder="e.g. author@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "8px", width: "100%", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Sending link..." : "Send Password Reset Link"}
            </button>
          </form>
        )}

        <p style={{ marginTop: "24px", fontSize: "0.9rem", textAlign: "center" }}>
          Remember your credentials?{" "}
          <Link to="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>
            Sign In here
          </Link>
        </p>
      </div>
    </main>
  );
}
