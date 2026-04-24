import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

export default function MainLayout({
  tabs,
  activeTab,
  onChangeTab,
  title,
  email,
  searchQuery,
  onSearchChange,
  onLogout,
  children,
}) {
  return (
    <div className="app-shell">
      <Sidebar tabs={tabs} activeTab={activeTab} onChangeTab={onChangeTab} />

      <section className="content-shell">
        <Navbar
          title={title}
          email={email}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onLogout={onLogout}
        />
        {children}
      </section>
    </div>
  );
}
