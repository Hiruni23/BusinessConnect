import { FaBell, FaSearch, FaUserCircle } from 'react-icons/fa';

export default function Navbar({ title, email, onLogout, searchQuery, onSearchChange }) {
  return (
    <header className="navbar">
      <div className="navbar-title-wrap">
        <p className="brand-eyebrow">Web Admin</p>
        <h2>{title}</h2>
      </div>

      <div className="nav-actions">
        <label className="search-wrap" htmlFor="dashboard-search">
          <FaSearch aria-hidden="true" />
          <input
            id="dashboard-search"
            type="search"
            placeholder="Search users or projects"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
          />
        </label>

        <button className="icon-btn" type="button" aria-label="Notifications">
          <FaBell />
        </button>

        <div className="status-pill">
          <FaUserCircle aria-hidden="true" />
          <span>{email || 'Admin'}</span>
        </div>

        <button className="outline-btn" type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}