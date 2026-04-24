import { useEffect, useMemo, useState } from 'react';
import Table from '../components/Table';
import { getUsers } from '../services/userService';
import {
  getRecentNotifications,
  sendBroadcastNotification,
  sendNotification,
} from '../services/notificationService';

const audienceOptions = [
  { value: 'single', label: 'Single User' },
  { value: 'all', label: 'All Users (Broadcast)' },
  { value: 'entrepreneur', label: 'Entrepreneurs Only' },
  { value: 'investor', label: 'Investors Only' },
  { value: 'stakeholder', label: 'Stakeholders Only' },
  { value: 'customer', label: 'Customers Only' },
];

function formatCreatedAt(value) {
  if (!value) {
    return 'Just now';
  }

  if (value?.toDate && typeof value.toDate === 'function') {
    return value.toDate().toLocaleString();
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Just now';
  }

  return parsed.toLocaleString();
}

export default function Notifications() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [recentNotifications, setRecentNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  const [audience, setAudience] = useState('single');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('announcement');
  const [sending, setSending] = useState(false);
  const [resultMessage, setResultMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const selectedUser = useMemo(
    () => users.find((item) => item.id === userId),
    [users, userId],
  );

  const loadUsers = async () => {
    setLoadingUsers(true);

    try {
      const data = await getUsers();
      setUsers(data);
      if (!userId && data.length > 0) {
        setUserId(data[0].id);
      }
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadRecent = async () => {
    setLoadingNotifications(true);

    try {
      const data = await getRecentNotifications(30);
      setRecentNotifications(data);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadRecent();
  }, []);

  const handleSend = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setResultMessage('');

    if (!title.trim() || !message.trim()) {
      setErrorMessage('Title and message are required.');
      return;
    }

    if (audience === 'single' && !userId) {
      setErrorMessage('Select a recipient user.');
      return;
    }

    setSending(true);

    try {
      if (audience === 'single') {
        await sendNotification(userId, title.trim(), message.trim(), { type: type.trim() || 'announcement' });
        setResultMessage(`Notification sent to ${selectedUser?.email || userId}.`);
      } else {
        const count = await sendBroadcastNotification({
          title: title.trim(),
          message: message.trim(),
          role: audience,
          type: type.trim() || 'announcement',
        });

        setResultMessage(`Broadcast sent to ${count} users.`);
      }

      setTitle('');
      setMessage('');
      await loadRecent();
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const rows = recentNotifications.map((item) => [
    item.title || 'Untitled',
    item.userId || 'N/A',
    item.type || 'system',
    formatCreatedAt(item.createdAt),
  ]);

  return (
    <section className="page-card">
      <h3>Notifications</h3>
      <p>Send announcements, notify users, and broadcast admin updates from one place.</p>

      <form className="notify-form" onSubmit={handleSend}>
        <label>
          Audience
          <select value={audience} onChange={(event) => setAudience(event.target.value)}>
            {audienceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {audience === 'single' ? (
          <label>
            Recipient
            <select value={userId} onChange={(event) => setUserId(event.target.value)} disabled={loadingUsers}>
              {users.map((item) => (
                <option key={item.id} value={item.id}>
                  {(item.email || item.fullName || item.name || item.id).slice(0, 64)}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label>
          Type
          <input
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="announcement"
            maxLength={24}
          />
        </label>

        <label>
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Project Approved"
            maxLength={90}
          />
        </label>

        <label>
          Message
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Your project has been approved by admin."
            rows={4}
            maxLength={300}
          />
        </label>

        <div className="notify-actions">
          <button className="primary-btn" type="submit" disabled={sending}>
            {sending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </form>

      {resultMessage ? <div className="notify-success">{resultMessage}</div> : null}
      {errorMessage ? <div className="form-error">{errorMessage}</div> : null}

      <article>
        <h4>Recent Notifications</h4>
        {loadingNotifications ? (
          <p>Loading notifications...</p>
        ) : (
          <Table columns={['Title', 'User ID', 'Type', 'Created']} rows={rows} />
        )}
      </article>
    </section>
  );
}
