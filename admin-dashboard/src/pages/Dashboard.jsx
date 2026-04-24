import { useEffect, useState } from 'react';
import { getAllProjects, testProjectsCollection } from '../services/projectService';
import { getUsers } from '../services/userService';
import Card from '../components/Card';
import Table from '../components/Table';
import Charts from '../components/Charts';

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

function toDate(value) {
  if (!value) {
    return null;
  }

  if (value?.toDate && typeof value.toDate === 'function') {
    const converted = value.toDate();
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  const direct = new Date(value);
  return Number.isNaN(direct.getTime()) ? null : direct;
}

function getUserDate(user) {
  return (
    toDate(user?.createdAt) ||
    toDate(user?.createdOn) ||
    toDate(user?.signUpDate) ||
    toDate(user?.registeredAt) ||
    toDate(user?.updatedAt)
  );
}

function buildUserGrowthData(users) {
  const byMonth = new Map();

  users.forEach((user) => {
    const parsedDate = getUserDate(user);
    if (!parsedDate) {
      return;
    }

    const key = `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}`;
    const count = byMonth.get(key) || 0;
    byMonth.set(key, count + 1);
  });

  const keys = Array.from(byMonth.keys()).sort();
  if (keys.length === 0) {
    return [{ month: monthFormatter.format(new Date()), users: users.length }];
  }

  let runningTotal = 0;
  return keys.map((key) => {
    runningTotal += byMonth.get(key) || 0;
    const [year, month] = key.split('-').map(Number);

    return {
      month: monthFormatter.format(new Date(year, month - 1, 1)),
      users: runningTotal,
    };
  });
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();

  if (['approved', 'accepted'].includes(status)) {
    return 'Approved';
  }

  if (['open', 'pending', 'in review', 'review'].includes(status)) {
    return 'Pending';
  }

  return 'Rejected';
}

function buildProjectStatusData(projects) {
  const grouped = { Approved: 0, Pending: 0, Rejected: 0 };

  projects.forEach((project) => {
    const key = normalizeStatus(project.status);
    grouped[key] += 1;
  });

  return Object.entries(grouped).map(([name, value]) => ({ name, value }));
}

function normalizeRole(value) {
  const role = String(value || '').toLowerCase();

  if (role.includes('entrepreneur')) {
    return 'Entrepreneurs';
  }

  if (role.includes('investor')) {
    return 'Investors';
  }

  if (role.includes('stakeholder')) {
    return 'Stakeholders';
  }

  return 'Other';
}

function buildRoleData(users) {
  const grouped = new Map();

  users.forEach((user) => {
    const label = normalizeRole(user.role);
    grouped.set(label, (grouped.get(label) || 0) + 1);
  });

  return Array.from(grouped.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value);
}

export default function Dashboard({ searchQuery = '' }) {
  const [stats, setStats] = useState({ users: 0, projects: 0, pending: 0, reports: 0, approved: 0, rejected: 0 });
  const [recentRows, setRecentRows] = useState([]);
  const [chartData, setChartData] = useState({
    userGrowthData: [],
    projectStatusData: [],
    roleData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);

      try {
        testProjectsCollection();
        const [projects, users] = await Promise.all([getAllProjects(), getUsers()]);
        const pending = projects.filter((item) => ['open', 'pending'].includes(String(item.status).toLowerCase())).length;
        const approved = projects.filter((item) => ['approved', 'accepted'].includes(String(item.status).toLowerCase())).length;
        const rejected = projects.filter((item) => ['rejected', 'declined', 'flagged'].includes(String(item.status).toLowerCase())).length;

        setStats({
          users: users.length,
          projects: projects.length,
          pending,
          reports: rejected,
          approved,
          rejected,
        });

        setChartData({
          userGrowthData: buildUserGrowthData(users),
          projectStatusData: buildProjectStatusData(projects),
          roleData: buildRoleData(users),
        });

        const normalizedSearch = String(searchQuery).trim().toLowerCase();
        const recent = projects
          .slice(0, 7)
          .filter((item) => {
            if (!normalizedSearch) {
              return true;
            }

            const title = String(item.title || item.name || '').toLowerCase();
            const owner = String(item.ownerName || item.owner || item.createdByEmail || '').toLowerCase();
            return title.includes(normalizedSearch) || owner.includes(normalizedSearch);
          })
          .map((item) => [
            item.title || item.name || 'Untitled Project',
            item.ownerName || item.owner || item.createdByEmail || 'Unknown Owner',
            String(item.status || 'pending'),
          ]);

        setRecentRows(recent);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [searchQuery]);

  return (
    <section className="page-card">
      <h3>Dashboard Overview</h3>
      <p>Modern admin workspace with live platform metrics and project monitoring.</p>

      <div className="stat-grid">
        <Card title="Total Users" value={stats.users} trend="All registered users" tone="teal" />
        <Card title="Total Projects" value={stats.projects} trend="Live submissions" tone="blue" />
        <Card title="Pending Approvals" value={stats.pending} trend="Needs review" tone="amber" />
        <Card title="Reports" value={stats.reports} trend="Flagged or rejected" tone="rose" />
      </div>

      <Charts
        userGrowthData={chartData.userGrowthData}
        projectStatusData={chartData.projectStatusData}
        roleData={chartData.roleData}
      />

      <article>
        <h4>Recent Projects</h4>
        {loading ? <p>Loading recent projects...</p> : <Table columns={['Project Name', 'Owner', 'Status']} rows={recentRows} />}
      </article>
    </section>
  );
}