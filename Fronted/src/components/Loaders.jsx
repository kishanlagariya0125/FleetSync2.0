/* ── Spinner: inline, small ─────────────────────────────────── */
export function Spinner({ size = 20, color = "var(--c-amber)" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            style={{ animation: "spin 0.9s linear infinite", flexShrink: 0 }}
        >
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2.5" strokeOpacity="0.2" />
            <path d="M12 2a10 10 0 0 1 10 10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
    );
}

/* ── Page-level full-screen loader ──────────────────────────── */
export function PageLoader({ text = "Loading…" }) {
    return (
        <div
            style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                minHeight: "60vh", gap: "1rem",
            }}
        >
            <Spinner size={40} />
            <p style={{ fontSize: "0.875rem", color: "var(--c-ghost)", fontFamily: "'JetBrains Mono', monospace" }}>{text}</p>
        </div>
    );
}

/* ── Skeleton row ────────────────────────────────────────────── */
export function SkeletonRow({ cols = 5 }) {
    return (
        <tr>
            {Array.from({ length: cols }).map((_, i) => (
                <td key={i} style={{ padding: "14px 16px" }}>
                    <div className="skeleton" style={{ height: "14px", width: i === 0 ? "60%" : "80%", borderRadius: "6px" }} />
                </td>
            ))}
        </tr>
    );
}

/* ── Skeleton card grid ──────────────────────────────────────── */
export function SkeletonCards({ count = 4 }) {
    return (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px" }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="card card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div className="skeleton" style={{ height: "12px", width: "50%" }} />
                    <div className="skeleton" style={{ height: "28px", width: "70%" }} />
                    <div className="skeleton" style={{ height: "10px", width: "40%" }} />
                </div>
            ))}
        </div>
    );
}
