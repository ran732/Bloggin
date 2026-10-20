import { useEffect, useState } from "react";
import { Link } from "react-router";
import { blogService } from "../services/api";
import { useToast } from "../context/ToastContext";
import BlogCard from "../components/BlogCard";

export default function ReadingList() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    let ignore = false;
    async function loadBookmarks() {
      try {
        setError("");
        const response = await blogService.getBookmarks();
        if (!ignore) {
          const data = Array.isArray(response.data) ? response.data : (response.data?.results || []);
          setBookmarks(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to load reading list:", err);
          setError("Unable to load your Reading List. Please try again.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadBookmarks();
    return () => {
      ignore = true;
    };
  }, []);

  async function handleRemoveBookmark(blogId) {
    try {
      await blogService.toggleBookmark(blogId);
      setBookmarks((prev) => prev.filter((b) => b.blog !== blogId && b.blog_details?.id !== blogId));
      showToast("Removed from your Reading List", "info");
    } catch (err) {
      console.error("Error removing bookmark:", err);
      showToast("Could not remove bookmark.", "error");
    }
  }

  return (
    <main className="container" style={{ padding: "48px 24px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: "36px", borderBottom: "1px solid var(--border-color)", paddingBottom: "24px" }}>
        <div className="card-category-badge" style={{ marginBottom: "8px", display: "inline-block" }}>
          🔖 Personal Library
        </div>
        <h1 style={{ fontSize: "2.4rem", marginBottom: "6px" }}>Reading List</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.05rem", margin: 0 }}>
          Articles and stories you have saved for later reading.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "8px", marginBottom: "24px" }}>
          ⚠️ {error}
        </div>
      )}

      {loading && (
        <div className="blog-grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-line skeleton-title"></div>
              <div className="skeleton-line skeleton-text"></div>
              <div className="skeleton-line skeleton-text"></div>
            </div>
          ))}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="state-box" style={{ maxWidth: "600px", margin: "40px auto", padding: "48px 32px" }}>
          <div style={{ fontSize: "3.5rem", marginBottom: "16px" }}>📚</div>
          <h2 className="state-title">Your Reading List is empty</h2>
          <p className="state-desc" style={{ marginBottom: "28px" }}>
            Click the bookmark icon on any story while browsing to save it to your personal Reading List.
          </p>
          <Link to="/explore" className="btn btn-primary">
            Explore Stories →
          </Link>
        </div>
      )}

      {!loading && bookmarks.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <span style={{ fontSize: "0.95rem", color: "var(--text-dim)", fontWeight: 600 }}>
              {bookmarks.length} {bookmarks.length === 1 ? "story" : "stories"} saved
            </span>
          </div>

          <div className="blog-grid">
            {bookmarks.map((bm) => {
              const blogData = bm.blog_details || { id: bm.blog };
              return (
                <div key={bm.id} style={{ position: "relative" }}>
                  <BlogCard blog={blogData} />
                  <button
                    type="button"
                    className="btn-icon-subtle"
                    onClick={() => handleRemoveBookmark(blogData.id)}
                    title="Remove from Reading List"
                    style={{ position: "absolute", top: "14px", right: "14px", zIndex: 10, background: "var(--bg-card)", borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-sm)" }}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
