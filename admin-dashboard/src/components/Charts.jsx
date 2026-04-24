import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const ROLE_COLORS = ['#22d3ee', '#a78bfa', '#fbbf24', '#34d399', '#f87171'];

function ChartCard({ title, children }) {
  return (
    <article className="chart-card">
      <h4>{title}</h4>
      <div className="chart-box">{children}</div>
    </article>
  );
}

export default function Charts({ userGrowthData, projectStatusData, roleData }) {
  return (
    <section className="charts-grid">
      <ChartCard title="User Growth">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={userGrowthData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="month" stroke="#9fb0c8" />
            <YAxis stroke="#9fb0c8" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '12px',
              }}
            />
            <Line type="monotone" dataKey="users" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Project Status">
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={projectStatusData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.25)" />
            <XAxis dataKey="name" stroke="#9fb0c8" />
            <YAxis stroke="#9fb0c8" allowDecimals={false} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '12px',
              }}
            />
            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
              {projectStatusData.map((item) => (
                <Cell
                  key={item.name}
                  fill={
                    item.name === 'Approved'
                      ? '#34d399'
                      : item.name === 'Pending'
                        ? '#fbbf24'
                        : '#f87171'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="User Roles">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={roleData} dataKey="value" nameKey="name" outerRadius={90} label>
              {roleData.map((entry, index) => (
                <Cell key={entry.name} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'rgba(15,23,42,0.96)',
                border: '1px solid rgba(148,163,184,0.2)',
                borderRadius: '12px',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </section>
  );
}
