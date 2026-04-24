const badgeClassMap = {
  open: 'badge pending',
  pending: 'badge pending',
  approved: 'badge approved',
  accepted: 'badge approved',
  rejected: 'badge rejected',
};

export default function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();
  const badgeClass = badgeClassMap[normalized] || 'badge pending';

  return <span className={badgeClass}>{String(status || 'pending').toUpperCase()}</span>;
}
