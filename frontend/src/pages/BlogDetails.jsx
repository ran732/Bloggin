import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { blogService } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Reading progress state
  const [scrollProgress, setScrollProgress] = useState(0);

  // Medium Claps state (supports up to 50 claps like Medium)
  const [clapsCount, setClapsCount] = useState(0);
  const [myClaps, setMyClaps] = useState(0);
  const [clapAnim, setClapAnim] = useState(false);
  const clapTimeoutRef = useRef(null);

  // Bookmark state
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarking, setBookmarking] = useState(false);

  // Follow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // Comment state
  const [commentContent, setCommentContent] = useState("");
  const [commentAuthor, setCommentAuthor] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");

  // Deletion modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Reading progress scroll listener
  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let ignore = false;
    async function fetchBlog() {
      setError("");
      try {
        const response = await blogService.getBlog(id);
        if (!ignore) {
          const b = response.data;
          setBlog(b);
          setClapsCount(b.claps_count || b.likes_count || 0);
          setIsBookmarked(b.is_bookmarked || false);
          setIsFollowing(b.is_following_author || false);
          if (b.title) {
            document.title = `${b.title} — Bloggin`;
          }
        }
      } catch (err) {
        if (!ignore) {
          console.error("Error loading blog details:", err);
          setError("Article not found or could not be loaded.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    fetchBlog();
    return () => {
      ignore = true;
      document.title = "Bloggin — Full-Stack Blogging Platform";
    };
  }, [id]);

  // Medium Clap Handler (Multi-claps up to 50)
  async function handleClap() {
    if (myClaps >= 50) {
      showToast("You've reached the maximum 50 claps for this story!", "info");
      return;
    }

    setClapsCount((prev) => prev + 1);
    setMyClaps((prev) => prev + 1);
    setClapAnim(true);

    if (clapTimeoutRef.current) clearTimeout(clapTimeoutRef.current);
    clapTimeoutRef.current = setTimeout(() => {
      setClapAnim(false);
    }, 700);

    try {
      await blogService.clapBlog(id, 1);
    } catch (err) {
      console.error("Error sending clap:", err);
    }
  }

  // Toggle Bookmark in Reading List
  async function handleToggleBookmark() {
    if (!isAuthenticated) {
      showToast("Sign in to save stories to your Reading List.", "info");
      return;
    }
    if (bookmarking) return;
    setBookmarking(true);

    try {
      const response = await blogService.toggleBookmark(id);
      setIsBookmarked(response.data.is_bookmarked);
      showToast(response.data.message, "success");
    } catch (err) {
      console.error("Bookmark error:", err);
      showToast("Could not update bookmark.", "error");
    } finally {
      setBookmarking(false);
    }
  }

  // Follow / Unfollow Author
  async function handleToggleFollow() {
    if (!isAuthenticated) {
      showToast("Please sign in to follow authors.", "info");
      return;
    }
    if (!blog?.author_name || followLoading) return;
    setFollowLoading(true);

    try {
      const response = await blogService.toggleFollow(blog.author_name);
      setIsFollowing(response.data.is_following);
      showToast(response.data.message, "success");
    } catch (err) {
      console.error("Follow error:", err);
      showToast("Could not update follow status.", "error");
    } finally {
      setFollowLoading(false);
    }
  }

  // Handle Share Link
  function handleShare() {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      showToast("Article link copied to clipboard!", "success");
    } else {
      showToast(`Article URL: ${url}`, "info");
    }
  }

  // Confirm and Delete
  async function confirmDelete() {
    setDeleting(true);
    try {
      await blogService.deleteBlog(id);
      showToast("Post deleted successfully.", "success");
      navigate("/");
    } catch (err) {
      console.error("Error deleting blog:", err);
      showToast("Failed to delete post. You may not have permission.", "error");
      setDeleting(false);
      setShowDeleteModal(false);
    }
  }

  // Handle Submit Comment
  async function handleCommentSubmit(e) {
    e.preventDefault();
    if (!commentContent.trim()) return;

    setCommentSubmitting(true);
    setCommentError("");
    try {
      const payload = {
        content: commentContent.trim(),
        author_name: user?.username || commentAuthor.trim() || "Reader",
      };
      const response = await blogService.addComment(id, payload);
      setBlog((prev) => ({
        ...prev,
        comments_count: (prev.comments_count || 0) + 1,
        comments: [...(prev.comments || []), response.data],
      }));
      setCommentContent("");
      setCommentAuthor("");
      showToast("Your response has been published!", "success");
    } catch (err) {
      console.error("Error posting comment:", err);
      setCommentError("Could not post comment. Please try again.");
      showToast("Failed to post comment.", "error");
    } finally {
      setCommentSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="container" style={{ maxWidth: "860px", padding: "64px 24px" }}>
        <div className="skeleton-line skeleton-title" style={{ width: "30%", marginBottom: "16px" }}></div>
        <div className="skeleton-line skeleton-title" style={{ width: "90%", height: "44px", marginBottom: "24px" }}></div>
        <div className="skeleton-line skeleton-text" style={{ marginBottom: "12px" }}></div>
        <div className="skeleton-line skeleton-text" style={{ marginBottom: "12px" }}></div>
        <div className="skeleton-line skeleton-text" style={{ width: "75%" }}></div>
      </main>
    );
  }

  if (error || !blog) {
    return (
      <main className="container" style={{ maxWidth: "600px", padding: "64px 24px" }}>
        <div className="state-box">
          <div className="state-icon error">⚠️</div>
          <h2 className="state-title">{error || "Article Not Found"}</h2>
          <p className="state-desc">The article you requested might have been moved or unpublished.</p>
          <Link to="/" className="btn btn-primary">
            ← Back to All Articles
          </Link>
        </div>
      </main>
    );
  }

  const isAuthor = user && (user.id === blog.author || user.username === blog.author_name);
  const formattedDate = blog.created_at
    ? new Date(blog.created_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const words = blog.content ? blog.content.trim().split(/\s+/).length : 0;
  const readTime = Math.max(1, Math.ceil(words / 150));
  const authorInitial = blog.author_name ? blog.author_name[0].toUpperCase() : "A";

  return (
    <>
      {/* Dynamic Scroll Reading Progress Bar */}
      <div
        className="reading-progress-bar"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      <main className="container" style={{ maxWidth: "860px", padding: "48px 24px 80px" }}>
        {/* Top Navigation & Action Controls */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px", flexWrap: "wrap", gap: "12px" }}>
          <Link to="/" className="read-more-btn">
            ← Back to Articles
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleShare}
              title="Share article link"
            >
              🔗 Share
            </button>

            {isAuthor && (
              <>
                <Link to={`/edit/${blog.id}`} className="btn btn-secondary">
                  ✏️ Edit Post
                </Link>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="btn btn-danger"
                >
                  🗑️ Delete
                </button>
              </>
            )}
          </div>
        </div>

        {/* Article Header & Content */}
        <article className="article-container animate-fade-in">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span className="card-category-badge">{blog.category || "Technology"}</span>
            <span className="card-read-time">⏱ {readTime} min read</span>
            {!blog.is_published && (
              <span className="status-badge draft">
                DRAFT
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", marginBottom: "20px", lineHeight: "1.2" }}>
            {blog.title}
          </h1>

          {/* Medium Author Header Card with Follow Button */}
          <div className="article-author-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <Link to={`/author/${blog.author_name}`} style={{ textDecoration: "none" }}>
                {blog.author_avatar ? (
                  <img
                    src={blog.author_avatar}
                    alt=""
                    style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div className="author-avatar" style={{ width: "48px", height: "48px", fontSize: "1.15rem" }}>
                    {authorInitial}
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/author/${blog.author_name}`} style={{ textDecoration: "none", color: "var(--text-main)", fontWeight: 700, fontSize: "1.05rem" }}>
                  {blog.author_name}
                </Link>
                <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                  Published on {formattedDate}
                </div>
              </div>
            </div>

            {!isAuthor && (
              <button
                type="button"
                className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                style={{ fontSize: "0.85rem", padding: "6px 16px" }}
                onClick={handleToggleFollow}
                disabled={followLoading}
              >
                {isFollowing ? "✓ Following" : "+ Follow Author"}
              </button>
            )}
          </div>

          {/* Article Body */}
          <div className="article-content">
            {blog.content.split("\n").map((paragraph, index) => (
              <p key={index} style={{ marginBottom: "1.25em" }}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Medium Tags */}
          {blog.tag_list && blog.tag_list.length > 0 && (
            <div style={{ margin: "28px 0 20px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {blog.tag_list.map((tag) => (
                <Link
                  key={tag}
                  to={`/explore?search=${tag}`}
                  className="tag-pill"
                  style={{ textDecoration: "none" }}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Article Interaction Toolbar (Medium Claps + Reading List + Comments) */}
          <div className="article-toolbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Multi-Clap Button */}
              <button
                type="button"
                className={`like-button ${myClaps > 0 ? "liked" : ""}`}
                onClick={handleClap}
                title={`Clapped ${myClaps} times. Click to clap!`}
                style={{ position: "relative" }}
              >
                <span className={`like-icon ${clapAnim ? "heart-burst" : ""}`}>👏</span>
                <span>{clapsCount} Claps</span>
                {clapAnim && (
                  <span className="clap-bubble animate-slide-down">
                    +{myClaps}
                  </span>
                )}
              </button>

              <span style={{ fontSize: "0.95rem", color: "var(--text-muted)" }}>
                💬 {blog.comments_count || 0} Responses
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* Reading List / Bookmark Button */}
              <button
                type="button"
                className={`btn-icon-subtle ${isBookmarked ? "bookmarked" : ""}`}
                onClick={handleToggleBookmark}
                disabled={bookmarking}
                title={isBookmarked ? "Saved in Reading List" : "Save to Reading List"}
                style={{ color: isBookmarked ? "var(--color-primary)" : "inherit", fontSize: "1.2rem" }}
              >
                {isBookmarked ? "🔖" : "📑"}
              </button>

              <button
                type="button"
                className="btn-icon-subtle"
                onClick={handleShare}
                title="Share link"
              >
                🔗
              </button>
            </div>
          </div>
        </article>

        {/* Medium Author Bio Card at Bottom */}
        <div className="author-bio-footer-box">
          <div style={{ display: "flex", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <Link to={`/author/${blog.author_name}`}>
              {blog.author_avatar ? (
                <img
                  src={blog.author_avatar}
                  alt=""
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div className="author-avatar" style={{ width: "64px", height: "64px", fontSize: "1.6rem" }}>
                  {authorInitial}
                </div>
              )}
            </Link>

            <div style={{ flex: 1, minWidth: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "6px" }}>
                <div>
                  <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-dim)" }}>
                    Written by
                  </span>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>
                    <Link to={`/author/${blog.author_name}`} style={{ color: "var(--text-main)", textDecoration: "none" }}>
                      {blog.author_name}
                    </Link>
                  </h3>
                </div>

                {!isAuthor && (
                  <button
                    type="button"
                    className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                    style={{ fontSize: "0.85rem", padding: "6px 14px" }}
                    onClick={handleToggleFollow}
                    disabled={followLoading}
                  >
                    {isFollowing ? "✓ Following" : "+ Follow"}
                  </button>
                )}
              </div>

              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", lineHeight: "1.5", margin: "6px 0 12px" }}>
                {blog.author_bio || "Writer and thinker sharing articles on Bloggin."}
              </p>

              <Link to={`/author/${blog.author_name}`} style={{ color: "var(--color-primary)", fontSize: "0.9rem", fontWeight: 600 }}>
                View author profile & more stories →
              </Link>
            </div>
          </div>
        </div>

        {/* Discussion / Comments Section */}
        <section className="comments-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.4rem", margin: 0 }}>
              Responses ({blog.comments?.length || 0})
            </h3>
            <span style={{ fontSize: "0.85rem", color: "var(--text-dim)" }}>
              Join the conversation
            </span>
          </div>

          {/* New Comment Box */}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <h4 style={{ fontSize: "0.95rem", marginBottom: "12px", fontWeight: 600 }}>
              What are your thoughts?
            </h4>

            {commentError && (
              <div style={{ padding: "8px 12px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", borderRadius: "6px", marginBottom: "12px", fontSize: "0.85rem" }}>
                {commentError}
              </div>
            )}

            {!user && (
              <div style={{ marginBottom: "12px" }}>
                <input
                  type="text"
                  className="search-input"
                  style={{ paddingLeft: "12px" }}
                  placeholder="Your Name (e.g. Maya)"
                  value={commentAuthor}
                  onChange={(e) => setCommentAuthor(e.target.value)}
                />
              </div>
            )}

            <div style={{ marginBottom: "12px" }}>
              <textarea
                className="search-input"
                rows={3}
                style={{ paddingLeft: "12px", resize: "vertical" }}
                placeholder="What did you think of this article? Add your perspective..."
                value={commentContent}
                maxLength={600}
                onChange={(e) => setCommentContent(e.target.value)}
                required
              />
              <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "4px" }}>
                {commentContent.length} / 600
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={commentSubmitting || !commentContent.trim()}
              >
                {commentSubmitting ? "Submitting..." : "Respond"}
              </button>
            </div>
          </form>

          {/* Comments List */}
          <div className="comments-list">
            {(!blog.comments || blog.comments.length === 0) ? (
              <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "28px 0" }}>
                No responses yet. What are your thoughts on this story?
              </p>
            ) : (
              blog.comments.map((comment) => (
                <div key={comment.id} className="comment-item animate-fade-in">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div className="author-avatar" style={{ width: "28px", height: "28px", fontSize: "0.75rem" }}>
                        {comment.author_name ? comment.author_name[0].toUpperCase() : "R"}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>{comment.author_name}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
                      {new Date(comment.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.925rem", color: "var(--text-main)", margin: "0 0 0 36px", whiteSpace: "pre-line" }}>
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-backdrop" onClick={() => setShowDeleteModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="state-icon error" style={{ margin: "0 0 16px" }}>🗑️</div>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "8px" }}>Delete this article?</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "24px" }}>
                Are you sure you want to delete <strong>"{blog.title}"</strong>? This action cannot be undone.
              </p>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={confirmDelete}
                  disabled={deleting}
                >
                  {deleting ? "Deleting..." : "Permanently Delete"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
