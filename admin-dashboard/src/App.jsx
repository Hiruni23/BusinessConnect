import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';
import { getAdminProfile, loginAdmin } from './services/authService';
import LoginForm from './components/LoginForm';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Projects from './pages/Projects';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import MainLayout from './layout/MainLayout';

const tabs = ['Dashboard', 'Users', 'Projects', 'Reports', 'Notifications', 'Settings'];

function Settings() {
  return (
    <section className="page-card">
      <h3>Settings</h3>
      <p>Configure admin dashboard preferences and organization-level controls.</p>
      <div className="form-error">Settings panel is coming soon.</div>
    </section>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminUser(null);
        setLoading(false);
        return;
      }

      try {
        const profile = await getAdminProfile(user.uid);
        if (profile?.role !== 'admin') {
          await signOut(auth);
          setAuthError('Access denied: only admin accounts can use this dashboard.');
          setAdminUser(null);
        } else {
          setAdminUser({ uid: user.uid, email: user.email, ...profile });
        }
      } catch (error) {
        setAuthError(error.message || 'Failed to validate admin access.');
        setAdminUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const CurrentPage = useMemo(() => {
    if (activeTab === 'Users') {
      return Users;
    }

    if (activeTab === 'Projects') {
      return Projects;
    }

    if (activeTab === 'Reports') {
      return Reports;
    }

    if (activeTab === 'Notifications') {
      return Notifications;
    }

    if (activeTab === 'Settings') {
      return Settings;
    }

    return Dashboard;
  }, [activeTab]);

  const handleLogin = async (email, password) => {
    setAuthError('');
    setAuthLoading(true);

    try {
      await loginAdmin(email, password);
    } catch (error) {
      setAuthError(error.message || 'Unable to sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('Dashboard');
  };

  if (loading) {
    return <main className="login-shell"><section className="login-card"><h1>Checking access...</h1></section></main>;
  }

  if (!adminUser) {
    return <LoginForm onSubmit={handleLogin} loading={authLoading} errorMessage={authError} />;
  }

  return (
    <MainLayout
      tabs={tabs}
      activeTab={activeTab}
      onChangeTab={setActiveTab}
      title={activeTab}
      email={adminUser.email}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      onLogout={handleLogout}
    >
      <CurrentPage searchQuery={searchQuery} />
    </MainLayout>
  );
}