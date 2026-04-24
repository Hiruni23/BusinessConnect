import { FaBell, FaChartBar, FaCog, FaFolderOpen, FaHome, FaUsers } from 'react-icons/fa';

const iconMap = {
  Dashboard: FaHome,
  Users: FaUsers,
  Projects: FaFolderOpen,
  Reports: FaChartBar,
  Notifications: FaBell,
  Settings: FaCog,
};

export default function Sidebar({ tabs, activeTab, onChangeTab }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <p className="brand-eyebrow">BusinessConnect</p>
        <h1>Admin Panel</h1>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => {
          const Icon = iconMap[tab];

          return (
            <button
              className={tab === activeTab ? 'nav-item active' : 'nav-item'}
              key={tab}
              onClick={() => onChangeTab(tab)}
              type="button"
            >
              {Icon ? (
                <span className="nav-icon">
                  <Icon />
                </span>
              ) : null}
              <span>{tab}</span>
            </button>
          );
        })}
      </nav>

      <p className="sidebar-footer">Control users, projects, and reporting workflows.</p>
    </aside>
  );
}