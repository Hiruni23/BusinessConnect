import { useEffect, useState } from 'react';
import { auth } from '../firebase/firebaseConfig';
import StatusBadge from '../components/StatusBadge';
import Table from '../components/Table';
import { subscribeToAllProjects, updateProjectStatus } from '../services/projectService';
import { sendProjectStatusNotification } from '../services/notificationService';

export default function Projects({ searchQuery = '' }) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToAllProjects((err, data) => {
      if (err) {
        setError(err.message || 'Failed to sync projects.');
      } else {
        setProjects(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDecision = async (projectId, nextStatus) => {
    const adminUid = auth.currentUser?.uid;
    if (!adminUid) {
      setError('Admin session expired. Please log in again.');
      return;
    }

    setUpdatingId(projectId);
    setError('');

    try {
      const project = projects.find((item) => item.id === projectId);
      await updateProjectStatus(projectId, nextStatus, adminUid);

      const ownerId =
        project?.userId ||
        project?.entrepreneurId ||
        project?.ownerId ||
        project?.createdByUid ||
        project?.createdBy;

      if (ownerId) {
        await sendProjectStatusNotification({
          userId: ownerId,
          projectId,
          projectTitle: project?.title || project?.name,
          status: nextStatus,
        });
      }

      // No need to manually filter projects here, the listener will handle it!
    } catch (updateError) {
      setError(updateError.message || 'Failed to update project status.');
    } finally {
      setUpdatingId('');
    }
  };

  const normalizedSearch = String(searchQuery).trim().toLowerCase();
  const filteredProjects = projects.filter((project) => {
    if (!normalizedSearch) {
      return true;
    }

    const title = String(project.title || project.name || '').toLowerCase();
    const owner = String(project.ownerName || project.owner || project.createdByEmail || '').toLowerCase();
    return title.includes(normalizedSearch) || owner.includes(normalizedSearch);
  });

  const rows = filteredProjects.map((project) => [
    project.title || project.name || 'Untitled Project',
    project.ownerName || project.owner || project.createdByEmail || 'Unknown Owner',
    <StatusBadge key={`status-${project.id}`} status={project.status || 'pending'} />,
    <div className="project-actions" key={`action-${project.id}`}>
      {(project.status === 'Open' || project.status === 'pending') ? (
        <>
          <button
            className="approve-btn"
            type="button"
            onClick={() => handleDecision(project.id, 'approved')}
            disabled={updatingId === project.id}
          >
            {updatingId === project.id ? 'Updating...' : 'Approve'}
          </button>
          <button
            className="reject-btn"
            type="button"
            onClick={() => handleDecision(project.id, 'rejected')}
            disabled={updatingId === project.id}
          >
            Reject
          </button>
        </>
      ) : (
        <span className="text-muted" style={{ fontSize: '13px', color: '#64748B', fontWeight: '600' }}>
          Moderated
        </span>
      )}
    </div>,
  ]);

  return (
    <section className="page-card">
      <h3>Projects</h3>
      <p>Review project submissions and take moderation actions.</p>

      {error ? <div className="form-error">{error}</div> : null}

      {loading ? <p>Loading projects...</p> : null}

      {!loading && rows.length === 0 ? <p>No projects found.</p> : null}

      {!loading && rows.length > 0 ? (
        <Table columns={['Project Name', 'Owner', 'Status', 'Actions']} rows={rows} />
      ) : null}
    </section>
  );
}