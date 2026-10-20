import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
        <div className="skeleton-line skeleton-title" style={{ maxWidth: "200px", margin: "0 auto 16px" }}></div>
        <p style={{ color: "var(--text-muted)" }}>Verifying author credentials...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
