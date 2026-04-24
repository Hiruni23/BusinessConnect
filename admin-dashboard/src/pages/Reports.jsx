import { useEffect, useState } from 'react';
import { getAllProjects } from '../services/projectService';

export default function Reports() {
  const [summary, setSummary] = useState({
    totalFundingGoal: 0,
    totalRaised: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    const loadSummary = async () => {
      const projects = await getAllProjects();
      const totalFundingGoal = projects.reduce((sum, project) => sum + Number(project.fundingGoal || 0), 0);
      const totalRaised = projects.reduce((sum, project) => sum + Number(project.raisedAmount || 0), 0);
      const approved = projects.filter((project) => ['approved', 'accepted'].includes(String(project.status).toLowerCase())).length;
      const rejected = projects.filter((project) => String(project.status).toLowerCase() === 'rejected').length;

      setSummary({ totalFundingGoal, totalRaised, approved, rejected });
    };

    loadSummary();
  }, []);

  return (
    <section className="page-card">
      <h3>Reports</h3>
      <p>Quick operational snapshot from live project records.</p>
      <div className="stat-grid">
        <article>
          <span>Funding Goal Total</span>
          <strong>${summary.totalFundingGoal.toLocaleString()}</strong>
        </article>
        <article>
          <span>Raised Total</span>
          <strong>${summary.totalRaised.toLocaleString()}</strong>
        </article>
        <article>
          <span>Approved Projects</span>
          <strong>{summary.approved}</strong>
        </article>
      </div>
      <p>Rejected projects: {summary.rejected}</p>
    </section>
  );
}