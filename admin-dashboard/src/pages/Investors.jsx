import { useEffect, useState } from 'react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import Card from '../components/Card';
import { subscribeToInvestors, updateUser, deleteUser } from '../services/userService';

export default function Investors() {
  const [investors, setInvestors] = useState([]);
  const [filteredInvestors, setFilteredInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    angels: 0,
    firms: 0,
    pending: 0
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInvestor, setEditingInvestor] = useState(null);
  
  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingInvestorId, setDeletingInvestorId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToInvestors((err, data) => {
      if (err) {
        setError(err.message || 'Failed to sync investors.');
      } else {
        setInvestors(data);
        
        // Calculate Stats
        const total = data.length;
        const angels = data.filter(i => i.investorType === 'Angel Investor').length;
        const firms = data.filter(i => ['Venture Capital', 'Private Equity', 'Institutional'].includes(i.investorType)).length;
        const pending = data.filter(i => i.status === 'pending').length;
        
        setStats({ total, angels, firms, pending });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = investors;

    if (typeFilter !== 'All') {
      result = result.filter(inv => inv.investorType === typeFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(inv => 
        (inv.fullName || '').toLowerCase().includes(query) || 
        (inv.email || '').toLowerCase().includes(query) ||
        (inv.company || '').toLowerCase().includes(query)
      );
    }

    setFilteredInvestors(result);
  }, [investors, searchQuery, typeFilter]);

  const handleEditClick = (investor) => {
    setEditingInvestor({ ...investor });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingInvestor;
      await updateUser(id, data);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update investor.');
    }
  };

  const handleDeleteClick = (uid) => {
    setDeletingInvestorId(uid);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deletingInvestorId);
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Failed to delete investor.');
    }
  };

  const columns = ['Investor', 'Contact', 'Classification', 'Organization', 'Status', 'Actions'];

  const rows = filteredInvestors.map((inv) => [
    <div key={`name-${inv.id}`} className="user-info-cell">
      <div className="user-avatar" style={{ border: '2px solid rgba(255,255,255,0.1)' }}>
        {(inv.fullName || inv.name || 'I').charAt(0)}
      </div>
      <div style={{ display: 'grid' }}>
        <span style={{ fontWeight: '700', color: '#e2e8f0' }}>{inv.fullName || inv.name || 'Unknown'}</span>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>ID: {inv.id.slice(0, 8)}...</span>
      </div>
    </div>,
    <div key={`contact-${inv.id}`} style={{ display: 'grid' }}>
      <span style={{ fontSize: '0.9rem' }}>{inv.email || 'N/A'}</span>
      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{inv.phone || 'No phone'}</span>
    </div>,
    <span key={`type-${inv.id}`} className="badge" style={{ 
      background: 'rgba(56, 189, 248, 0.1)', 
      color: '#7dd3fc', 
      border: '1px solid rgba(125, 211, 252, 0.2)',
      padding: '4px 10px'
    }}>
      {inv.investorType || 'Individual'}
    </span>,
    <span key={`company-${inv.id}`} style={{ fontWeight: '500', color: '#94a3b8' }}>
      {inv.company || '—'}
    </span>,
    <span key={`status-${inv.id}`} className={`status-pill ${inv.status || 'active'}`}>
      {(inv.status || 'active').toUpperCase()}
    </span>,
    <div className="project-actions" key={`actions-${inv.id}`}>
      <button 
        className="approve-btn" 
        style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: '10px' }}
        onClick={() => handleEditClick(inv)}
      >
        Manage
      </button>
      <button 
        className="reject-btn"
        style={{ padding: '8px 16px', fontSize: '0.75rem', borderRadius: '10px' }}
        onClick={() => handleDeleteClick(inv.id)}
      >
        Delete
      </button>
    </div>
  ]);

  const investorTypes = ['All', 'Angel Investor', 'Venture Capital', 'Private Equity', 'Institutional', 'Other'];

  return (
    <div className="investors-page" style={{ display: 'grid', gap: '24px' }}>
      <section className="page-card" style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}>
        <div className="settings-header" style={{ marginBottom: '24px' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.02em', background: 'linear-gradient(135deg, #fff 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Investor Ecosystem
            </h2>
            <p style={{ color: '#94a3b8', marginTop: '4px' }}>Strategic management of capital providers and institutional partners.</p>
          </div>
        </div>

        <div className="stat-grid" style={{ marginBottom: '24px' }}>
          <Card title="Global Network" value={stats.total} trend="Total Investors" tone="teal" />
          <Card title="Angel Network" value={stats.angels} trend="Private Capital" tone="blue" />
          <Card title="Institutional" value={stats.firms} trend="VC & PE Firms" tone="amber" />
          <Card title="Pending Vetting" value={stats.pending} trend="Access Requests" tone="rose" />
        </div>

        <div className="navbar" style={{ 
          marginBottom: '16px', 
          background: 'rgba(30, 41, 59, 0.4)', 
          border: '1px solid rgba(148, 163, 184, 0.1)',
          padding: '12px 20px'
        }}>
          <div className="header-actions" style={{ width: '100%', justifyContent: 'space-between' }}>
            <div className="search-box">
              <input 
                type="text" 
                placeholder="Find investor by name, email or firm..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: '350px', background: 'rgba(15, 23, 42, 0.6)' }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '600' }}>FILTER BY TYPE:</span>
              <select 
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="outline-btn"
                style={{ padding: '8px 16px', background: 'rgba(15, 23, 42, 0.6)' }}
              >
                {investorTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <section className="page-card">
          {error ? <div className="form-error" style={{ marginBottom: '16px' }}>{error}</div> : null}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <div className="loading-spinner"></div>
              <p style={{ marginTop: '12px', color: '#64748b' }}>Synchronizing investor records...</p>
            </div>
          ) : (
            <>
              {filteredInvestors.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: '#64748B', background: 'rgba(148, 163, 184, 0.05)', borderRadius: '16px' }}>
                  <p>No investment profiles match your current search parameters.</p>
                </div>
              ) : (
                <Table columns={columns} rows={rows} />
              )}
            </>
          )}
        </section>
      </section>

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Investor Governance"
      >
        {editingInvestor && (
          <form className="notify-form" onSubmit={handleSaveEdit}>
            <div style={{ background: 'rgba(148, 163, 184, 0.05)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(148, 163, 184, 0.1)', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <label>
                  Legal Name
                  <input 
                    value={editingInvestor.fullName || ''} 
                    onChange={(e) => setEditingInvestor({...editingInvestor, fullName: e.target.value})}
                    required
                  />
                </label>
                <label>
                  System Email (Locked)
                  <input 
                    value={editingInvestor.email || ''} 
                    disabled
                    style={{ background: 'rgba(15, 23, 42, 0.8)', opacity: 0.7 }}
                  />
                </label>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                <label>
                  Account Classification
                  <select 
                    value={editingInvestor.investorType || ''} 
                    onChange={(e) => setEditingInvestor({...editingInvestor, investorType: e.target.value})}
                  >
                    <option value="Angel Investor">Angel Investor</option>
                    <option value="Venture Capital">Venture Capital</option>
                    <option value="Private Equity">Private Equity</option>
                    <option value="Institutional">Institutional</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Organization / Firm
                  <input 
                    value={editingInvestor.company || ''} 
                    onChange={(e) => setEditingInvestor({...editingInvestor, company: e.target.value})}
                    placeholder="Enter firm name"
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
                <label>
                  Direct Contact
                  <input 
                    value={editingInvestor.phone || ''} 
                    onChange={(e) => setEditingInvestor({...editingInvestor, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                  />
                </label>
                <label>
                  System Access Level
                  <select 
                    value={editingInvestor.status || 'active'} 
                    onChange={(e) => setEditingInvestor({...editingInvestor, status: e.target.value})}
                  >
                    <option value="active">Active (Full Access)</option>
                    <option value="pending">Pending Verification</option>
                    <option value="suspended">Suspended / Restricted</option>
                  </select>
                </label>
              </div>
            </div>

            <label style={{ marginTop: '10px' }}>
              Investment Thesis & Bio
              <textarea 
                value={editingInvestor.bio || ''} 
                onChange={(e) => setEditingInvestor({...editingInvestor, bio: e.target.value})}
                placeholder="Outline the investor's focus areas, ticket sizes, and preferred stages..."
                style={{ minHeight: '120px' }}
              />
            </label>

            <div className="form-actions" style={{ marginTop: '24px' }}>
              <button type="submit" className="primary-btn" style={{ minWidth: '160px' }}>Sync Profile</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Identity Deletion"
      >
        <div style={{ textAlign: 'center', padding: '10px' }}>
          <p style={{ color: '#fca5a5', fontWeight: '600', fontSize: '1.1rem' }}>Warning: Permanent Removal</p>
          <p style={{ color: '#94a3b8', marginTop: '12px', lineHeight: '1.6' }}>
            You are about to permanently purge this investor profile from the ecosystem. 
            All portfolios, messages, and historical records associated with this ID will be orphaned.
          </p>
        </div>
        <div className="form-actions" style={{ marginTop: '32px', gap: '12px', justifyContent: 'center' }}>
          <button className="outline-btn" style={{ minWidth: '140px' }} onClick={() => setIsDeleteModalOpen(false)}>Abort Action</button>
          <button className="reject-btn" style={{ minWidth: '140px' }} onClick={confirmDelete}>Confirm Purge</button>
        </div>
      </Modal>
    </div>
  );
}
