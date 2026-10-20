import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await logout();
    showToast("You have been logged out.", "info");
    setMobileMenuOpen(false);
    navigate("/");
  }

  function closeMobile() {
    setMobileMenuOpen(false);
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="brand" onClick={closeMobile}>
          <div className="brand-icon">✍</div>
          <span className="brand-text">Bloggin</span>
          <span className="brand-badge">PRO</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/explore"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Explore
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <NavLink
                    to="/dashboard"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/reading-list"
                    className={({ isActive }) =>
                      isActive ? "nav-link active" : "nav-link"
                    }
                    title="Saved stories in Reading List"
                  >
                    🔖 Reading List
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <NavLink
                to="/write"
                className={({ isActive }) =>
                  isActive ? "nav-link active" : "nav-link"
                }
              >
                Write
              </NavLink>
            </li>
            <li>
              <a
                href="http://127.0.0.1:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="nav-link"
                title="Open Django Admin in a new tab"
              >
                Django Admin ↗
              </a>
            </li>
          </ul>
        </nav>

        {/* Right Action Controls */}
        <div className="nav-actions">
          {/* Theme Toggle Button */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label="Toggle theme mode"
            title={`Switch to ${isDark ? "Light" : "Dark"} Mode`}
          >
            {isDark ? "☀️" : "🌙"}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="user-profile-badge" title="My Dashboard">
                <span className="user-avatar-mini">
                  {user?.username ? user.username[0].toUpperCase() : "U"}
                </span>
                <span className="user-username">{user?.username}</span>
              </Link>
              <Link to="/create" className="btn btn-primary btn-desktop-only">
                + New Post
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-secondary btn-desktop-only"
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-desktop-only">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary btn-desktop-only">
                Register
              </Link>
            </>
          )}

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Dynamic Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-slide-down">
          <ul className="mobile-nav-list">
            <li>
              <NavLink to="/" className="mobile-nav-link" onClick={closeMobile}>
                🏠 Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/explore" className="mobile-nav-link" onClick={closeMobile}>
                🧭 Explore Stories
              </NavLink>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <NavLink to="/dashboard" className="mobile-nav-link" onClick={closeMobile}>
                    📊 Author Dashboard
                  </NavLink>
                </li>
                <li>
                  <NavLink to="/reading-list" className="mobile-nav-link" onClick={closeMobile}>
                    🔖 Reading List
                  </NavLink>
                </li>
                <li>
                  <NavLink to={`/author/${user?.username}`} className="mobile-nav-link" onClick={closeMobile}>
                    👤 My Author Profile
                  </NavLink>
                </li>
              </>
            )}

            <li>
              <NavLink to="/write" className="mobile-nav-link" onClick={closeMobile}>
                ✍️ Write an Article
              </NavLink>
            </li>
            <li>
              <a
                href="http://127.0.0.1:8000/admin/"
                target="_blank"
                rel="noreferrer"
                className="mobile-nav-link"
                onClick={closeMobile}
              >
                ⚙️ Django Admin ↗
              </a>
            </li>
          </ul>

          <div className="mobile-drawer-footer">
            {isAuthenticated ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%" }}>
                <Link to="/create" className="btn btn-primary" onClick={closeMobile} style={{ width: "100%" }}>
                  + New Post
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-secondary"
                  style={{ width: "100%" }}
                >
                  Log Out ({user?.username})
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                <Link to="/login" className="btn btn-secondary" onClick={closeMobile} style={{ flex: 1 }}>
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary" onClick={closeMobile} style={{ flex: 1 }}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
