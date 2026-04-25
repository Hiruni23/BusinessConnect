import { useEffect, useState } from 'react';
import { subscribeToAllInvestments, releaseInvestment } from '../services/investmentService';
import Card from '../components/Card';
import Table from '../components/Table';

export default function Investments({ searchQuery = '' }) {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const unsub = subscribeToAllInvestments((err, data) => {
      if (err) {
        setError('Failed to sync investments.');
        return;
      }
      setInvestments(data);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const handleRelease = async (investment) => {
    if (!window.confirm(`Are you sure you want to release $${investment.amount.toLocaleString()} to the entrepreneur?`)) {
      return;
    }

    setActionLoading(investment.id);
    try {
      await releaseInvestment(investment);
      alert('Funds released successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to release funds: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInvestments = investments.filter((item) => {
    const search = searchQuery.toLowerCase().trim();
    if (!search) return true;
    
    return (
      item.projectTitle?.toLowerCase().includes(search) ||
      item.investorEmail?.toLowerCase().includes(search) ||
      item.status?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: investments.reduce((sum, i) => sum + (i.amount || 0), 0),
    escrow: investments.filter(i => i.status === 'escrow').reduce((sum, i) => sum + (i.amount || 0), 0),
    released: investments.filter(i => i.status === 'released').reduce((sum, i) => sum + (i.amount || 0), 0),
    count: investments.length
  };

  const rows = filteredInvestments.map((i) => [
    i.projectTitle || 'Untitled Project',
    i.investorEmail || 'Anonymous',
    `$${Number(i.amount || 0).toLocaleString()}`,
    <span className={`status-pill ${i.status}`}>{i.status?.toUpperCase()}</span>,
    i.status === 'escrow' ? (
      <button 
        className="action-btn approve" 
        onClick={() => handleRelease(i)}
        disabled={actionLoading === i.id}
      >
        {actionLoading === i.id ? 'Releasing...' : 'Release Funds'}
      </button>
    ) : (
      <span className="text-muted">Released</span>
    )
  ]);

  return (
    <section className="page-card">
      <div className="page-header">
        <div>
          <h3>Investment Management</h3>
          <p>Monitor and release funds from escrow to entrepreneurs.</p>
        </div>
      </div>

      <div className="stat-grid">
        <Card title="Total Volume" value={`$${stats.total.toLocaleString()}`} trend={`${stats.count} transactions`} tone="teal" />
        <Card title="Held in Escrow" value={`$${stats.escrow.toLocaleString()}`} trend="Pending release" tone="amber" />
        <Card title="Released Funds" value={`$${stats.released.toLocaleString()}`} trend="Completed payouts" tone="emerald" />
      </div>

      <article style={{ marginTop: '30px' }}>
        <h4>Investment Records</h4>
        {loading ? (
          <p>Loading investments...</p>
        ) : error ? (
          <p className="error">{error}</p>
        ) : (
          <Table 
            columns={['Project', 'Investor', 'Amount', 'Status', 'Actions']} 
            rows={rows} 
          />
        )}
      </article>
    </section>
  );
}
