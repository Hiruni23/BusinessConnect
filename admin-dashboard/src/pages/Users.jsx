import { useEffect, useState } from 'react';
import Table from '../components/Table';
import Modal from '../components/Modal';
import { subscribeToUsers, updateUser, deleteUser } from '../services/userService';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Delete State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToUsers((err, data) => {
      if (err) {
        setError(err.message || 'Failed to sync users.');
      } else {
        setUsers(data);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (user) => {
    setEditingUser({ ...user });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingUser;
      await updateUser(id, data);
      setIsEditModalOpen(false);
    } catch (err) {
      setError('Failed to update user.');
    }
  };

  const handleDeleteClick = (uid) => {
    setDeletingUserId(uid);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteUser(deletingUserId);
      setIsDeleteModalOpen(false);
    } catch (err) {
      setError('Failed to delete user.');
    }
  };

  const columns = ['Name', 'Email', 'Role', 'Status', 'Actions'];

  const rows = users.map((user) => [
    user.fullName || user.name || 'Unknown',
    user.email || 'N/A',
    user.role || 'unknown',
    user.status || 'active',
    <div className="project-actions" key={`actions-${user.id}`}>
      <button 
        className="approve-btn" 
        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        onClick={() => handleEditClick(user)}
      >
        Edit
      </button>
      <button 
        className="reject-btn"
        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
        onClick={() => handleDeleteClick(user.id)}
      >
        Delete
      </button>
    </div>
  ]);

  return (
    <section className="page-card">
      <div className="settings-header">
        <h3>User Management</h3>
        <p>Review, update roles, or manage platform access for all users.</p>
      </div>

      {error ? <div className="form-error">{error}</div> : null}
      {loading ? <p>Loading users...</p> : <Table columns={columns} rows={rows} />}

      {/* Edit Modal */}
      <Modal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        title="Edit User Profile"
      >
        {editingUser && (
          <form className="notify-form" onSubmit={handleSaveEdit}>
            <label>
              Full Name
              <input 
                value={editingUser.fullName || ''} 
                onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
              />
            </label>
            <label>
              Role
              <select 
                value={editingUser.role || ''} 
                onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
              >
                <option value="Entrepreneur">Entrepreneur</option>
                <option value="Investor">Investor</option>
                <option value="Stakeholder">Stakeholder</option>
                <option value="Customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Status
              <select 
                value={editingUser.status || 'active'} 
                onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </label>
            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button type="submit" className="primary-btn">Save Changes</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Confirm Deletion"
      >
        <p>Are you sure you want to permanently delete this user? This action cannot be undone.</p>
        <div className="form-actions" style={{ marginTop: '20px', gap: '10px' }}>
          <button className="outline-btn" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
          <button className="reject-btn" onClick={confirmDelete}>Delete User</button>
        </div>
      </Modal>
    </section>
  );
}