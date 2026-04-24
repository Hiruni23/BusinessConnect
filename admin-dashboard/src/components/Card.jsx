export default function Card({ title, value, trend, tone = 'info' }) {
  return (
    <article className={`stats-card tone-${tone}`}>
      <span>{title}</span>
      <strong>{value}</strong>
      {trend ? <p>{trend}</p> : null}
    </article>
  );
}
