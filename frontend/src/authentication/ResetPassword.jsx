import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router";
import { authService } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = searchParams.get("token") || "";

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [verifying, setVerifying] = useState(!!tokenFromUrl);
  const [tokenValid, setTokenValid] = useState(!tokenFromUrl); // true if manual entry needed
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!tokenFromUrl) return;

    let ignore = false;
    async function verify() {
      try {
        const response = await authService.verifyPasswordResetToken(tokenFromUrl);
        if (!ignore) {
          if (response.data?.valid) {
            setTokenValid(true);
            setUsername(response.data.username);
          } else {
            setTokenValid(false);
            setError(response.data?.error || "This reset link is invalid or has expired.");
          }
        }
      } catch (err) {
        if (!ignore) {
          setTokenValid(false);
          setError(
            err.response?.data?.error ||
            "This password reset link is invalid or has expired."
          );
        }
      } finally {
        if (!ignore) {
          setVerifying(false);
        }
      }
    }

    verify();
    return () => {
      ignore = true;
    };
  }, [tokenFromUrl]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!token.trim()) {
      setError("Please provide a valid reset token.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await authService.confirmPasswordReset(token.trim(), newPassword);
      setSuccess(true);
    } catch (err) {
      console.error("Password reset confirmation error:", err);
      setError(
        err.response?.data?.error ||
        "Failed to update password. Link may have expired."
      );
    } finally {
      setLoading(false);
    }
  }

  if (verifying) {
    return (
      <main className="container" style={{ maxWidth: "480px", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "var(--text-muted)" }}>Verifying your secure password reset token...</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ maxWidth: "480px", padding: "64px 24px 80px" }}>
      <div className="state-box" style={{ textAlign: "left", padding: "36px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="brand-icon" style={{ margin: "0 auto 12px", width: "48px", height: "48px", fontSize: "1.4rem" }}>
            🔒
          </div>
          <h1 style={{ fontSize: "1.8rem", marginBottom: "6px" }}>Set New Password</h1>
          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
            {username ? `Choose a strong new password for @${username}` : "Enter your reset token and new password"}
          </p>
        </div>

        {error && (
          <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "20px", fontSize: "0.9rem" }}>
            ⚠️ {error}
          </div>
        )}

        {success ? (
          <div style={{ background: "rgba(34, 197, 94, 0.1)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "10px", padding: "24px 20px", textAlign: "center" }}>
            <div style={{ fontSize: "2rem", marginBottom: "10px" }}>🎉</div>
            <h3 style={{ fontSize: "1.2rem", color: "#16a34a", marginBottom: "8px" }}>Password Updated!</h3>
            <p style={{ fontSize: "0.95rem", color: "var(--text-main)", lineHeight: "1.5", marginBottom: "20px" }}>
              Your account password has been successfully reset. You can now log in using your new credentials.
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate("/login")}
              style={{ width: "100%", padding: "12px" }}
            >
              Sign In Now →
            </button>
          </div>
        ) : !tokenValid && tokenFromUrl ? (
          <div style={{ textAlign: "center", padding: "16px 0" }}>
            <p style={{ marginBottom: "20px", color: "var(--text-muted)" }}>
              The link you clicked has expired or was already used. Please request a new password reset link.
            </p>
            <Link to="/forgot-password" className="btn btn-primary">
              Request New Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
            {!tokenFromUrl && (
              <div>
                <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                  Reset Token
                </label>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: "14px" }}
                  placeholder="Paste token from email"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                New Password (min. 6 characters)
              </label>
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: "14px" }}
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontWeight: 600, marginBottom: "6px", fontSize: "0.9rem" }}>
                Confirm New Password
              </label>
              <input
                type="password"
                className="search-input"
                style={{ paddingLeft: "14px" }}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ marginTop: "8px", width: "100%", padding: "12px" }}
              disabled={loading}
            >
              {loading ? "Updating..." : "Save New Password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
