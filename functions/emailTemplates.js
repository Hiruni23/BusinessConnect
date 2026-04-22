/**
 * Professional HTML Email Templates for BusinessConnect
 */

const baseStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #1e293b;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f8fafc;
`;

const headerStyle = `
  background-color: #4f46e5;
  color: #ffffff;
  padding: 30px;
  border-radius: 12px 12px 0 0;
  text-align: center;
`;

const contentStyle = `
  background-color: #ffffff;
  padding: 30px;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const buttonStyle = `
  display: inline-block;
  background-color: #4f46e5;
  color: #ffffff;
  padding: 12px 24px;
  text-decoration: none;
  border-radius: 8px;
  font-weight: bold;
  margin-top: 20px;
`;

module.exports = {
  /**
   * Weekly Market Pulse Template
   */
  weeklyPulse: (data) => `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">Market Pulse Weekly</h1>
        <p style="margin:5px 0 0; opacity: 0.8;">${new Date().toLocaleDateString()}</p>
      </div>
      <div style="${contentStyle}">
        <h2 style="color: #4f46e5;">Oversight Summary</h2>
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; border-bottom: 1px solid #e2e8f0; padding-bottom: 15px;">
          <div>
            <p style="margin:0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Active Projects</p>
            <p style="margin:0; font-size: 20px; font-weight: bold;">${data.activeProjects}</p>
          </div>
          <div>
            <p style="margin:0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Pending Vetting</p>
            <p style="margin:0; font-size: 20px; font-weight: bold; color: #f59e0b;">${data.pendingMilestones}</p>
          </div>
          <div>
            <p style="margin:0; color: #64748b; font-size: 12px; font-weight: bold; text-transform: uppercase;">Capital Under Oversight</p>
            <p style="margin:0; font-size: 20px; font-weight: bold; color: #10b981;">$${data.totalCapital.toLocaleString()}</p>
          </div>
        </div>

        <h3 style="font-size: 16px; margin-bottom: 10px;">New Market Activity</h3>
        <p>There were <strong>${data.newPitches}</strong> new project submissions this week requiring initial vetting.</p>

        <a href="https://businessconnect.app/stakeholder/dashboard" style="${buttonStyle}">Open Oversight Dashboard</a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #94a3b8; text-align: center;">
          You are receiving this because you are an authorized Stakeholder on BusinessConnect.
        </p>
      </div>
    </div>
  `,

  /**
   * Milestone Notification Template
   */
  milestoneAlert: (data) => `
    <div style="${baseStyle}">
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">Governance Alert</h1>
      </div>
      <div style="${contentStyle}">
        <h2 style="color: #4f46e5;">${data.type === 'completed' ? 'Vetting Required' : 'Milestone Update'}</h2>
        <p>Project: <strong>${data.pitchTitle}</strong></p>
        <p>Phase: <strong>${data.milestoneTitle}</strong></p>
        <p>Status: <span style="color: #4f46e5; font-weight: bold;">${data.status.toUpperCase()}</span></p>

        <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 15px;">
          <p style="margin:0; font-style: italic;">"${data.description}"</p>
        </div>

        <a href="https://businessconnect.app/stakeholder/milestones" style="${buttonStyle}">Review Progress</a>
      </div>
    </div>
  `
};
