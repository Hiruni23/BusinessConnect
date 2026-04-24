import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { getUsers } from '../services/userService';

export default function Users() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await getUsers();
        setRows(
          data.map((user) => [
            user.fullName || user.name || user.email || 'Unknown',
            user.role || 'unknown',
            user.status || 'active',
          ]),
        );
      } catch (fetchError) {
        setError(fetchError.message || 'Failed to load users.');
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  const columns = ['Name', 'Role', 'Status'];

  return (
    <section className="page-card">
      <h3>Users</h3>
      <p>Manage platform users, account status, and moderation actions.</p>
      {error ? <div className="form-error">{error}</div> : null}
      {loading ? <p>Loading users...</p> : <Table columns={columns} rows={rows} />}
    </section>
  );
}