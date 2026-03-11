import { useEffect } from "react";
import { createPortal } from "react-dom";

// ─── Status Badge ──────────────────────────────────────────────────────────────
export function StatusBadge({ status }) {
  const map = {
    AVAILABLE: { dot: "bg-jade", bg: "bg-jade/10  border-jade/25", text: "text-jade" },
    ON_TRIP: { dot: "bg-sky", bg: "bg-sky/10   border-sky/25", text: "text-sky" },
    IN_SHOP: { dot: "bg-amber", bg: "bg-amber/10 border-amber/25", text: "text-amber" },
    RETIRED: { dot: "bg-dim", bg: "bg-dim/10   border-dim/25", text: "text-dim" },
    ON_DUTY: { dot: "bg-jade", bg: "bg-jade/10  border-jade/25", text: "text-jade" },
    OFF_DUTY: { dot: "bg-dim", bg: "bg-dim/10   border-dim/25", text: "text-dim" },
    SUSPENDED: { dot: "bg-rose", bg: "bg-rose/10  border-rose/25", text: "text-rose" },
    DRAFT: { dot: "bg-dim", bg: "bg-dim/10   border-dim/25", text: "text-dim" },
    DISPATCHED: { dot: "bg-sky", bg: "bg-sky/10   border-sky/25", text: "text-sky" },
    COMPLETED: { dot: "bg-jade", bg: "bg-jade/10  border-jade/25", text: "text-jade" },
    CANCELLED: { dot: "bg-rose", bg: "bg-rose/10  border-rose/25", text: "text-rose" },
  };
  const c = map[status] || { dot: "bg-dim", bg: "bg-dim/10 border-dim/25", text: "text-dim" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-display font-semibold border ${c.bg} ${c.text}`}>
      <span className={`dot animate-blink ${c.dot}`} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
export function Spinner({ size = "md", className = "" }) {
  const s = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" }[size];
  return (
    <svg className={`animate-spin-slow text-amber ${s} ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = "max-w-lg" }) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  const widthMap = {
    "max-w-sm": "480px",
    "max-w-md": "560px",
    "max-w-lg": "640px",
    "max-w-xl": "720px",
    "max-w-2xl": "840px",
  };
  const maxW = widthMap[width] || "640px";

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "rgba(4,4,12,0.75)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
        }}
      />

      {/* Modal card */}
      <div
        style={{
          position: "fixed", zIndex: 9999,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: `min(calc(100vw - 1.5rem), ${maxW})`,
          maxHeight: "90vh",
          display: "flex", flexDirection: "column",
          borderRadius: "0.875rem",
          border: "1px solid var(--bg-wire)",
          background: "var(--bg-deck)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px var(--bg-plate)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem",
          borderBottom: "1px solid var(--bg-plate)",
          flexShrink: 0,
          background: "var(--bg-hull)",
        }}>
          <h2 style={{
            margin: 0, fontFamily: "'Syne', sans-serif",
            fontWeight: 700, fontSize: "0.9375rem",
            color: "var(--c-snow)", letterSpacing: "-0.01em",
          }}>{title}</h2>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ padding: "0.375rem", borderRadius: "0.5rem", lineHeight: 1 }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{
          padding: "1.25rem 1.5rem",
          overflowY: "auto", flex: 1,
          background: "var(--bg-deck)",
          color: "var(--c-light)",
        }}>
          {children}
        </div>
      </div>
    </>,
    document.body
  );
}

// ─── DataTable ────────────────────────────────────────────────────────────────
export function DataTable({ columns, data, loading, empty = "No records found." }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead className="t-head">
          <tr>{columns.map((c) => <th key={c.key} className="t-th">{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {!data?.length ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: "center", padding: "4rem 1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                  <svg style={{ width: "32px", height: "32px", color: "var(--c-dim)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span style={{ color: "var(--c-ghost)", fontSize: "0.875rem" }}>{empty}</span>
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id ?? i} className="t-row animate-fade-up">
                {columns.map((c) => (
                  <td key={c.key} className="t-td">
                    {c.render ? c.render(row[c.key], row) : (row[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
export function KPICard({ title, value, sub, icon, accent = "amber", anim = "" }) {
  const a = {
    amber: { border: "border-amber/20", icon: "bg-amber/10  text-amber", val: "text-amber" },
    jade: { border: "border-jade/20", icon: "bg-jade/10   text-jade", val: "text-jade" },
    sky: { border: "border-sky/20", icon: "bg-sky/10    text-sky", val: "text-sky" },
    rose: { border: "border-rose/20", icon: "bg-rose/10   text-rose", val: "text-rose" },
    violet: { border: "border-violet/20", icon: "bg-violet/10 text-violet", val: "text-violet" },
    ghost: { border: "border-ghost/20", icon: "bg-ghost/10  text-ghost", val: "text-ghost" },
  }[accent] || {};

  return (
    <div className={`card card-body border ${a.border} shadow-card ${anim} transition-all`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="field-label">{title}</p>
          <p className={`text-mono text-3xl font-bold mt-1 ${a.val}`}>{value ?? "—"}</p>
          {sub && <p className="text-xs text-ghost mt-1 truncate">{sub}</p>}
        </div>
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── Page Header ──────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, children }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
      <div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: "1.25rem", color: "var(--c-snow)" }}>{title}</h1>
        {sub && <p style={{ fontSize: "0.875rem", color: "var(--c-ghost)", marginTop: "2px" }}>{sub}</p>}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────
export function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span className="text-rose ml-1">*</span>}
      </label>
      {children}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message, danger = true }) {
  return (
    <Modal open={open} onClose={onClose} title={title} width="max-w-sm">
      <p style={{ fontSize: "0.875rem", color: "var(--c-ghost)", marginBottom: "1.5rem" }}>{message}</p>
      <div className="flex justify-end gap-3">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={onConfirm} className={danger ? "btn-danger" : "btn-primary"}>Confirm</button>
      </div>
    </Modal>
  );
}