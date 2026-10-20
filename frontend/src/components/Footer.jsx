import { Link } from "react-router";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <div className="footer-brand-col">
            <div className="brand">
              <div className="brand-icon">✍</div>
              <span className="brand-text">Bloggin</span>
            </div>
            <p className="footer-tagline">
              A modern full-stack blogging platform built for developers, writers,
              and storytellers. Powered by React and Django REST Framework.
            </p>
          </div>

          <div className="footer-links-col">
            <div>
              <h4 className="footer-group-title">Navigation</h4>
              <ul className="footer-links-list">
                <li><Link to="/" className="footer-link">Home</Link></li>
                <li><Link to="/explore" className="footer-link">Explore Stories</Link></li>
                <li><Link to="/create" className="footer-link">Write an Article</Link></li>
                <li><a href="http://127.0.0.1:8000/api/v1/blogs/" target="_blank" rel="noreferrer" className="footer-link">API (DRF)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-group-title">Tech Stack</h4>
              <ul className="footer-links-list">
                <li><span className="footer-link">React 19 + Vite</span></li>
                <li><span className="footer-link">Django 4.2+</span></li>
                <li><span className="footer-link">Django REST Framework</span></li>
                <li><span className="footer-link">SQLite3 / MySQL</span></li>
              </ul>
            </div>

            <div>
              <h4 className="footer-group-title">Account</h4>
              <ul className="footer-links-list">
                <li><Link to="/login" className="footer-link">Sign In</Link></li>
                <li><Link to="/register" className="footer-link">Register</Link></li>
                <li><a href="http://127.0.0.1:8000/admin/" target="_blank" rel="noreferrer" className="footer-link">Django Admin</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {currentYear} Bloggin Platform. All rights reserved.</p>
          <p>Full-Stack B.Tech Project Showcase</p>
        </div>
      </div>
    </footer>
  );
}
