import { useEffect, useState } from 'react';
import { subscribeToSettings, updateSettings } from '../services/settingsService';

export default function Settings() {
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    maintenanceMode: false,
    allowNewSignups: true,
    fundingLimit: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToSettings((err, data) => {
      if (err) {
        setError('Failed to load settings.');
      } else {
        setSettings(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: name === 'fundingLimit' ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateSettings(settings);
      setSuccess('Settings updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save settings. Check permissions.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading settings...</p>;

  return (
    <section className="page-card">
      <div className="settings-header">
        <h3>Platform Settings</h3>
        <p>Configure global platform behaviors and organization-level controls.</p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-section">
          <h4>General Configuration</h4>
          <div className="input-group">
            <label>Platform Name</label>
            <input 
              type="text" 
              name="platformName" 
              value={settings.platformName} 
              onChange={handleChange}
              placeholder="BusinessConnect"
            />
          </div>
          <div className="input-group">
            <label>Support Email</label>
            <input 
              type="email" 
              name="supportEmail" 
              value={settings.supportEmail} 
              onChange={handleChange}
              placeholder="support@example.com"
            />
          </div>
          <div className="input-group">
            <label>Global Funding Limit ($)</label>
            <input 
              type="number" 
              name="fundingLimit" 
              value={settings.fundingLimit} 
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="settings-section">
          <h4>Platform Controls</h4>
          <div className="toggle-group">
            <div className="toggle-info">
              <h5>Maintenance Mode</h5>
              <p>Disable all platform features for non-admin users.</p>
            </div>
            <button 
              type="button" 
              className={`toggle-btn ${settings.maintenanceMode ? 'active' : ''}`}
              onClick={() => handleToggle('maintenanceMode')}
            >
              <div className="toggle-slider" />
            </button>
          </div>

          <div className="toggle-group">
            <div className="toggle-info">
              <h5>Allow New Signups</h5>
              <p>Enable or disable registration of new accounts.</p>
            </div>
            <button 
              type="button" 
              className={`toggle-btn ${settings.allowNewSignups ? 'active' : ''}`}
              onClick={() => handleToggle('allowNewSignups')}
            >
              <div className="toggle-slider" />
            </button>
          </div>
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="notify-success">{success}</div>}

        <div className="form-actions">
          <button type="submit" className="primary-btn" disabled={saving}>
            {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </section>
  );
}
