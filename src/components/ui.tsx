"use client";

export function PageHead({
  kicker,
  title,
  lede,
  action,
}: {
  kicker: string;
  title: string;
  lede?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="page-head">
      <div>
        <p className="page-kicker">{kicker}</p>
        <h1 className="page-title">{title}</h1>
        {lede ? <p className="lede">{lede}</p> : null}
      </div>
      {action ? <div className="page-actions no-print">{action}</div> : null}
    </header>
  );
}

export function StatStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <section className="stat-row" aria-label="Summary">
      {items.map((item) => (
        <div className="stat" key={item.label}>
          <b className="num">{item.value}</b>
          <span>{item.label}</span>
        </div>
      ))}
    </section>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Drawer({
  title,
  onClose,
  children,
  wide = false,
  headerAction,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
  headerAction?: React.ReactNode;
}) {
  return (
    <div className="drawer-backdrop">
      <aside className={wide ? "drawer wide" : "drawer"} role="dialog" aria-modal="true" aria-label={title}>
        <div className="drawer-top">
          <h2>{title}</h2>
          <div className="drawer-actions">
            {headerAction}
            <button type="button" className="text-btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        {children}
      </aside>
    </div>
  );
}

export function Badge({ value }: { value: string }) {
  const tone = value.toLowerCase().replace("+", " plus").replace(/[^a-z ]/g, "").trim().replace(/\s+/g, "-");
  return <span className={`badge ${tone}`}>{value || "—"}</span>;
}

export function Empty({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}
