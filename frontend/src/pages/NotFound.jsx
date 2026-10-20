import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="container" style={{ maxWidth: "600px", padding: "80px 24px", textAlign: "center" }}>
      <div className="state-box" style={{ padding: "48px 32px" }}>
        <div style={{ fontSize: "4rem", marginBottom: "16px" }}>🔍</div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "8px", fontFamily: "var(--font-heading)" }}>
          404 — Page Not Found
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", marginBottom: "32px", lineHeight: "1.6" }}>
          We couldn't find the page or article you were looking for. It may have been moved, unpublished, or the URL might be mistyped.
        </p>

        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/" className="btn btn-primary">
            🏠 Return Home
          </Link>
          <Link to="/explore" className="btn btn-secondary">
            🧭 Explore Articles
          </Link>
        </div>
      </div>
    </main>
  );
}
