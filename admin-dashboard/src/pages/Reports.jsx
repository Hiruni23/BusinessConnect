import { useEffect, useState } from 'react';
import { subscribeToAllProjects, formatCurrency } from '../services/projectService';
import Card from '../components/Card';
import Table from '../components/Table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export default function Reports() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllProjects((err, data) => {
      if (err) {
        setError('Failed to sync report data.');
      } else {
        setProjects(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const stats = {
    totalGoal: projects.reduce((sum, p) => sum + (Number(p.fundingGoal) || 0), 0),
    totalRaised: projects.reduce((sum, p) => sum + (Number(p.raisedAmount) || 0), 0),
    avgFunding: projects.length ? projects.reduce((sum, p) => sum + (Number(p.raisedAmount) || 0), 0) / projects.length : 0,
    successRate: projects.length 
      ? (projects.filter(p => (Number(p.raisedAmount) || 0) >= (Number(p.fundingGoal) || 0)).length / projects.length) * 100 
      : 0
  };

  const categoryData = projects.reduce((acc, p) => {
    const cat = p.category || 'Uncategorized';
    const existing = acc.find(item => item.name === cat);
    if (existing) {
      existing.raised += (Number(p.raisedAmount) || 0);
      existing.count += 1;
    } else {
      acc.push({ name: cat, raised: (Number(p.raisedAmount) || 0), count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.raised - a.raised);

  const topProjectsRows = projects
    .sort((a, b) => (Number(b.raisedAmount) || 0) - (Number(a.raisedAmount) || 0))
    .slice(0, 5)
    .map(p => [
      p.title || p.name || 'Untitled',
      p.category || 'N/A',
      formatCurrency(p.fundingGoal),
      <strong key={`raised-${p.id}`} style={{ color: '#34d399' }}>{formatCurrency(p.raisedAmount)}</strong>,
      `${Math.round(((Number(p.raisedAmount) || 0) / (Number(p.fundingGoal) || 1)) * 100)}%`
    ]);

  return (
    <section className="page-card">
      <div className="reports-header">
        <h3>Platform Analytics</h3>
        <p>Comprehensive financial performance and project success metrics.</p>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="stat-grid">
        <Card title="Capital Committed" value={formatCurrency(stats.totalRaised)} trend="Total across all projects" tone="teal" />
        <Card title="Funding Target" value={formatCurrency(stats.totalGoal)} trend="Total goal of all pitches" tone="blue" />
        <Card title="Avg. Investment" value={formatCurrency(stats.avgFunding)} trend="Per project average" tone="amber" />
        <Card title="Success Rate" value={`${Math.round(stats.successRate)}%`} trend="Fully funded projects" tone="rose" />
      </div>

      <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <article className="chart-card">
          <h4>Funding by Category</h4>
          <div className="chart-box" style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,0.2)', borderRadius: '12px' }}
                />
                <Bar dataKey="raised" fill="#06b6d4" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#06b6d4' : '#fbbf24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="top-performers">
        <h4>Top Performing Projects</h4>
        <Table 
          columns={['Project Name', 'Category', 'Goal', 'Raised', 'Progress']} 
          rows={topProjectsRows} 
        />
      </article>
    </section>
  );
}