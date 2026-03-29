export function RuntimeMetric({ label, value }) {
  return (
    <div className="desktop-RuntimeMetric">
      <span className="desktop-RuntimeLabel">{label}</span>
      <strong className="desktop-RuntimeValue">{value}</strong>
    </div>
  );
}
