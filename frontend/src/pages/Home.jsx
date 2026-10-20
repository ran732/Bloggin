import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router";
import api, { blogService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import BlogCard from "../components/BlogCard";

const CATEGORIES = [
  "All",
  "Technology",
  "Programming",
  "Web Development",
  "Tutorials",
  "Career & Life",
];

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [feedTab, setFeedTab] = useState("for-you"); // 'for-you' | 'following'
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTag, setActiveTag] = useState("All");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'likes', 'comments'
  const [viewMode, setViewMode] = useState("grid"); // 'grid' | 'list'

  const loadBlogs = useCallback(async (isManual = false) => {
    if (isManual) setLoading(true);
    setError("");
    try {
      let response;
      if (feedTab === "following" && isAuthenticated) {
        response = await blogService.getFollowingFeed();
      } else {
        response = await api.get("blogs/");
      }
      const data = Array.isArray(response.data)
        ? response.data
        : (response.data?.results || []);
      setBlogs(data);
    } catch (err) {
      console.error("API error fetching blogs:", err);
      setError(
        "Unable to connect to the Django API server at http://127.0.0.1:8000/api/v1/blogs/. Make sure the Django development server is running."
      );
    } finally {
      setLoading(false);
    }
  }, [feedTab, isAuthenticated]);

  useEffect(() => {
    let ignore = false;
    async function init() {
      setLoading(true);
      setError("");
      try {
        let response;
        if (feedTab === "following") {
          if (!isAuthenticated) {
            setLoading(false);
            return;
          }
          response = await blogService.getFollowingFeed();
        } else {
          response = await api.get("blogs/");
        }

        if (!ignore) {
          const data = Array.isArray(response.data)
            ? response.data
            : (response.data?.results || []);
          setBlogs(data);
        }
      } catch (err) {
        if (!ignore) {
          console.error("API error fetching blogs:", err);
          setError(
            "Unable to connect to the Django API server at http://127.0.0.1:8000/api/v1/blogs/. Make sure the Django development server is running."
          );
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      ignore = true;
    };
  }, [feedTab, isAuthenticated]);

  // Compute count of articles per category for dynamic badges
  const categoryCounts = useMemo(() => {
    const counts = { All: blogs.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = blogs.filter(
          (b) => b.category && b.category.toLowerCase() === cat.toLowerCase()
        ).length;
      }
    });
    return counts;
  }, [blogs]);

  // Filter and sort blogs
  const processedBlogs = useMemo(() => {
    let result = blogs.filter((blog) => {
      const matchesSearch =
        blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        blog.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (blog.tags && blog.tags.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (blog.author_name && blog.author_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesTag =
        activeTag === "All" ||
        (blog.category && blog.category.toLowerCase() === activeTag.toLowerCase()) ||
        (blog.tags && blog.tags.toLowerCase().includes(activeTag.toLowerCase())) ||
        blog.title.toLowerCase().includes(activeTag.toLowerCase()) ||
        blog.content.toLowerCase().includes(activeTag.toLowerCase());

      return matchesSearch && matchesTag;
    });

    // Apply sorting
    if (sortBy === "likes") {
      result.sort((a, b) => (b.claps_count || b.likes_count || 0) - (a.claps_count || a.likes_count || 0));
    } else if (sortBy === "comments") {
      result.sort((a, b) => (b.comments_count || 0) - (a.comments_count || 0));
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return result;
  }, [blogs, searchTerm, activeTag, sortBy]);

  return (
    <main className="main-content">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-pill">
            <span className="hero-pill-dot"></span>
            <span>Where Good Ideas Find You — Medium Experience</span>
          </div>

          <h1 className="hero-title">
            Discover Great Stories, <span>Ideas & Code</span>
          </h1>

          <p className="hero-subtitle">
            A modern, multi-author blogging platform built with React and Django.
            Clap for your favorite writers, build your personal Reading List, and follow authors.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
            <a href="#articles" className="btn btn-primary">
              Explore Articles ↓
            </a>
            <Link to="/write" className="btn btn-secondary">
              ✍️ Write a Story
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container" id="articles">
        {/* Medium-style Feed Switcher Tabs */}
        <div className="medium-feed-tabs">
          <button
            type="button"
            className={`feed-tab-btn ${feedTab === "for-you" ? "active" : ""}`}
            onClick={() => setFeedTab("for-you")}
          >
            ✨ For You
          </button>
          <button
            type="button"
            className={`feed-tab-btn ${feedTab === "following" ? "active" : ""}`}
            onClick={() => setFeedTab("following")}
          >
            👥 Following
          </button>
        </div>

        {/* Dynamic Search & Category Pill Bar */}
        <div className="search-filter-bar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, topic, tag, or author..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="btn-clear-search"
                onClick={() => setSearchTerm("")}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="filter-tags">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`filter-tag ${activeTag === cat ? "active" : ""}`}
                onClick={() => setActiveTag(cat)}
              >
                {cat}
                <span className="filter-tag-count">{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Controls Bar: View mode, Sort, Result count */}
        <div className="feed-controls-bar">
          <div className="feed-results-info">
            <h2 className="section-title" style={{ margin: 0, fontSize: "1.25rem" }}>
              {feedTab === "following"
                ? "Stories from Authors You Follow"
                : activeTag === "All"
                ? "All Stories"
                : `${activeTag} Stories`}
            </h2>
            <span className="blog-count">
              {loading ? "Loading..." : `${processedBlogs.length} articles`}
            </span>
          </div>

          <div className="feed-actions-group">
            {/* Sort Dropdown */}
            <div className="sort-selector">
              <label htmlFor="sort-select" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Sort:
              </label>
              <select
                id="sort-select"
                className="select-input-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="likes">Most Clapped 👏</option>
                <option value="comments">Most Discussed 💬</option>
              </select>
            </div>

            {/* Grid vs List View Switcher */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`btn-view-mode ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
                aria-label="Grid View"
              >
                ⊞
              </button>
              <button
                type="button"
                className={`btn-view-mode ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
                aria-label="List View"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Unauthenticated Following Tab Notice */}
        {feedTab === "following" && !isAuthenticated && (
          <div className="state-box" style={{ maxWidth: "600px", margin: "32px auto" }}>
            <div style={{ fontSize: "3rem", marginBottom: "12px" }}>👥</div>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "8px" }}>Sign in to see your Following Feed</h3>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "20px" }}>
              Follow writers whose perspectives you appreciate to build a tailored feed of articles.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <Link to="/login" className="btn btn-primary">Sign In</Link>
              <Link to="/register" className="btn btn-secondary">Create Account</Link>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className={viewMode === "grid" ? "blog-grid" : "blog-list-container"}>
            {[1, 2, 3].map((item) => (
              <div key={item} className="skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-text"></div>
                <div className="skeleton-line skeleton-text"></div>
                <div className="skeleton-line skeleton-text-short"></div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="state-box">
            <div className="state-icon error">⚠️</div>
            <h3 className="state-title">Backend Connection Error</h3>
            <p className="state-desc">{error}</p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => loadBlogs(true)}
            >
              Retry Request
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && processedBlogs.length === 0 && (feedTab !== "following" || isAuthenticated) && (
          <div className="state-box">
            <div className="state-icon empty">📝</div>
            <h3 className="state-title">
              {feedTab === "following" ? "No stories from authors you follow yet" : "No matching articles found"}
            </h3>
            <p className="state-desc">
              {feedTab === "following"
                ? "Discover writers across topics and click '+ Follow' to receive their latest publications here."
                : searchTerm || activeTag !== "All"
                ? "Try adjusting your search terms or clearing your filters to view all published stories."
                : "No blogs have been published yet in the database."}
            </p>
            {feedTab === "following" ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setFeedTab("for-you")}
              >
                Explore All Stories
              </button>
            ) : (searchTerm || activeTag !== "All") && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSearchTerm("");
                  setActiveTag("All");
                }}
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Dynamic Blog Cards Container */}
        {!loading && !error && processedBlogs.length > 0 && (
          <div className={viewMode === "grid" ? "blog-grid" : "blog-list-container"}>
            {processedBlogs.map((blog) => (
              <BlogCard key={blog.id} blog={blog} viewMode={viewMode} />
            ))}
          </div>
        )}

        {/* Architecture & Live Pipeline Callout */}
        <div className="tech-banner">
          <div className="tech-banner-header">
            <h3 className="tech-banner-title">
              ⚡ Medium-Grade Architecture & REST API
            </h3>
            <span className="card-category-badge">Production Ready</span>
          </div>
          <p className="state-desc" style={{ margin: 0, textAlign: "left" }}>
            Engineered with React 19, Django REST Framework, and automated Mailer services.
            Includes multi-clap burst interactions, personal Reading List bookmarking, author profiles with social following feeds, and secure token-based password reset via email.
          </p>
          <div className="tech-chips">
            <div className="tech-chip">👏 Multi-Claps Engine</div>
            <div className="tech-chip">🔖 Reading List / Bookmarks</div>
            <div className="tech-chip">👥 Author Follow & Profiles</div>
            <div className="tech-chip">✉️ Auth Mailer & Password Reset</div>
            <div className="tech-chip">🏷️ Story Tags</div>
            <div className="tech-chip">🌓 Dark / Light Themes</div>
          </div>
        </div>
      </section>
    </main>
  );
}