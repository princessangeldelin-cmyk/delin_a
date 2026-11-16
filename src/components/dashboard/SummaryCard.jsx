function SummaryCard({ label, value, detail }) {
  return (
    <article className="summary-card">
      <p className="summary-card-label">{label}</p>
      <p className="summary-card-value">{value}</p>
      <p className="summary-card-detail">{detail}</p>
    </article>
  );
}

export default SummaryCard;
