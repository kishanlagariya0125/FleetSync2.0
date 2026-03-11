import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

/* ================= ICONS ================= */
const icons = {
  team: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  dashboard: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  vehicle: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M1 3h15v13H1z" /><path d="M16 8h4l3 4v4h-7V8z" />
      <circle cx="5.5" cy="18.5" r="1.5" /><circle cx="18.5" cy="18.5" r="1.5" />
    </svg>
  ),
  driver: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  ),
  trip: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <circle cx="5" cy="6" r="2" /><circle cx="19" cy="18" r="2" />
      <path d="M5 8v5a4 4 0 004 4h6M19 16V11a4 4 0 00-4-4H9" />
    </svg>
  ),
  maintenance: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M14.7 6.3l1.6 1.6 3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z" />
    </svg>
  ),
  fuel: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <path d="M3 22V8a2 2 0 012-2h8a2 2 0 012 2v14M3 22h12M18 9l2 2v7a2 2 0 01-2 2" />
      <path d="M7 14h4M7 10h4" />
    </svg>
  ),
  analytics: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" {...props}>
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

/* ================= NAV ================= */
const NAV = [
  { group: "Overview", items: [{ to: "/dashboard", label: "Dashboard", icon: "dashboard" }] },
  {
    group: "Fleet",
    items: [
      { to: "/team", label: "Team", icon: "team" },
      { to: "/vehicles", label: "Vehicles", icon: "vehicle" },
      { to: "/drivers", label: "Drivers", icon: "driver" },
      { to: "/trips", label: "Trips", icon: "trip" },
    ],
  },
  {
    group: "Records",
    items: [
      { to: "/maintenance", label: "Maintenance", icon: "maintenance" },
      { to: "/fuel", label: "Fuel Logs", icon: "fuel" },
    ],
  },
  { group: "Reports", items: [{ to: "/analytics", label: "Analytics", icon: "analytics" }] },
];

/* ================= ROLE ACCESS ================= */
const ROLE_ACCESS = {
  OWNER: ["dashboard", "team", "vehicle", "driver", "trip", "maintenance", "fuel", "analytics"],
  MANAGER: ["dashboard", "team", "vehicle", "driver", "trip", "maintenance", "fuel", "analytics"],
  DISPATCHER: ["dashboard", "vehicle", "driver", "trip", "maintenance", "analytics"],
  DRIVER: ["dashboard", "trip"],
  FINANCE: ["dashboard", "vehicle", "maintenance", "fuel", "analytics"],
};

const ROLE_COLORS = {
  OWNER: { bg: "rgba(220,38,38,0.12)", text: "#DC2626", border: "rgba(220,38,38,0.25)" },
  MANAGER: { bg: "rgba(245,158,11,0.12)", text: "#D97706", border: "rgba(245,158,11,0.25)" },
  DISPATCHER: { bg: "rgba(56,189,248,0.12)", text: "#0284C7", border: "rgba(56,189,248,0.25)" },
  DRIVER: { bg: "rgba(16,185,129,0.12)", text: "#059669", border: "rgba(16,185,129,0.25)" },
  FINANCE: { bg: "rgba(139,92,246,0.12)", text: "#7C3AED", border: "rgba(139,92,246,0.25)" },
};

/* ================= SIDEBAR ================= */
export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { effective } = useTheme();
  const isLight = effective === "light";

  if (!user) return null;

  const allowed = ROLE_ACCESS[user.role] || [];
  const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.MANAGER;

  /* ── Sidebar design tokens ── */
  const S = {
    bg: isLight
      ? "linear-gradient(180deg, #FFFFFF 0%, #F8FAFF 100%)"
      : "linear-gradient(180deg, #0C0F1A 0%, #0D1020 100%)",
    border: isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)",
    logoText: isLight ? "#0F172A" : "#EEF3FA",
    groupLabel: isLight ? "#94A3B8" : "#445570",
    linkText: isLight ? "#475569" : "#637898",
    linkHoverBg: isLight ? "rgba(241,245,249,0.9)" : "rgba(22,29,46,0.8)",
    linkHoverText: isLight ? "#0F172A" : "#B0C4DE",
    activeBg: isLight
      ? "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(249,115,22,0.08))"
      : "rgba(245,158,11,0.1)",
    activeBorder: isLight ? "rgba(245,158,11,0.3)" : "rgba(245,158,11,0.2)",
    activeText: isLight ? "#B45309" : "#F59E0B",
    activeIcon: isLight ? "#D97706" : "#F59E0B",
    userBg: isLight
      ? "linear-gradient(135deg, rgba(241,245,249,0.9), rgba(248,250,252,0.9))"
      : "rgba(22,29,46,0.6)",
    userBorder: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)",
    userName: isLight ? "#0F172A" : "#B0C4DE",
    logoutText: isLight ? "#94A3B8" : "#637898",
    logoutHover: isLight ? "#EF4444" : "#F43F5E",
    shadow: isLight ? "2px 0 20px rgba(0,0,0,0.06)" : "2px 0 20px rgba(0,0,0,0.3)",
  };

  return (
    <aside style={{
      display: "flex", flexDirection: "column",
      width: "240px", height: "100%",
      background: S.bg,
      borderRight: `1px solid ${S.border}`,
      boxShadow: S.shadow,
    }}>

      {/* ── Logo ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "10px",
        padding: "20px 20px", borderBottom: `1px solid ${S.border}`,
      }}>
        <div style={{
          width: "34px", height: "34px", borderRadius: "10px",
          background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(249,115,22,0.15))",
          border: "1px solid rgba(245,158,11,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 12px rgba(245,158,11,0.15)",
        }}>
          <span style={{ fontSize: "1rem" }}>⚡</span>
        </div>
        <div>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800,
            fontSize: "1.05rem", color: S.logoText, lineHeight: 1.1,
          }}>
            Fleet<span style={{
              background: "linear-gradient(135deg, #F59E0B, #F97316)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>Sync</span>
          </span>
          <div style={{
            fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace",
            color: isLight ? "#94A3B8" : "#445570", letterSpacing: "0.08em",
          }}>Fleet Management v2.0</div>
        </div>
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {NAV.map((group) => {
          const visibleItems = group.items.filter((i) => allowed.includes(i.icon));
          if (!visibleItems.length) return null;
          return (
            <div key={group.group} style={{ marginBottom: "16px" }}>
              <p style={{
                padding: "0 12px", marginBottom: "4px",
                fontSize: "0.65rem", fontFamily: "'JetBrains Mono', monospace",
                fontWeight: 600, letterSpacing: "0.12em",
                textTransform: "uppercase", color: S.groupLabel,
              }}>{group.group}</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {visibleItems.map((item) => {
                  const Icon = icons[item.icon];
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/dashboard"}
                      onClick={onClose}
                      style={({ isActive }) => ({
                        display: "flex", alignItems: "center", gap: "10px",
                        padding: "9px 12px", borderRadius: "10px",
                        fontSize: "0.875rem", fontFamily: "'DM Sans', sans-serif",
                        fontWeight: isActive ? 600 : 400,
                        textDecoration: "none",
                        transition: "all 0.15s",
                        color: isActive ? S.activeText : S.linkText,
                        background: isActive ? S.activeBg : "transparent",
                        border: `1px solid ${isActive ? S.activeBorder : "transparent"}`,
                        boxShadow: isActive && isLight ? "0 2px 8px rgba(245,158,11,0.1)" : "none",
                      })}
                      onMouseOver={e => {
                        if (!e.currentTarget.getAttribute("aria-current")) {
                          e.currentTarget.style.background = S.linkHoverBg;
                          e.currentTarget.style.color = S.linkHoverText;
                        }
                      }}
                      onMouseOut={e => {
                        if (!e.currentTarget.getAttribute("aria-current")) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = S.linkText;
                        }
                      }}
                    >
                      {({ isActive }) => (
                        <>
                          <span style={{
                            color: isActive ? S.activeIcon : (isLight ? "#94A3B8" : "#445570"),
                            display: "flex", flexShrink: 0,
                          }}>
                            <Icon style={{ width: "16px", height: "16px" }} />
                          </span>
                          {item.label}
                          {isActive && (
                            <span style={{
                              marginLeft: "auto", width: "5px", height: "5px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #F59E0B, #F97316)",
                              boxShadow: "0 0 6px rgba(245,158,11,0.6)",
                            }} />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* ── User Card ── */}
      <div style={{
        padding: "10px", borderTop: `1px solid ${S.border}`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "10px 12px", borderRadius: "12px",
          background: S.userBg, border: `1px solid ${S.userBorder}`,
          backdropFilter: "blur(8px)",
        }}>
          {/* Avatar */}
          <div style={{
            width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg, #F59E0B, #F97316)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontWeight: 700, fontSize: "0.875rem",
            boxShadow: "0 2px 8px rgba(245,158,11,0.3)",
          }}>
            {user.name?.charAt(0)?.toUpperCase()}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: "0.85rem", fontWeight: 600, color: S.userName,
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            }}>{user.name}</p>
            <span style={{
              display: "inline-block", fontSize: "0.6rem",
              fontFamily: "'JetBrains Mono', monospace",
              background: roleColor.bg, color: roleColor.text,
              border: `1px solid ${roleColor.border}`,
              borderRadius: "4px", padding: "1px 6px", marginTop: "2px",
            }}>{user.role}</span>
          </div>

          {/* Logout */}
          <button
            onClick={() => { logout(); navigate("/home"); }}
            title="Sign out"
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: "1.1rem", color: S.logoutText,
              padding: "4px", borderRadius: "6px",
              transition: "color 0.15s, background 0.15s",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onMouseOver={e => { e.currentTarget.style.color = S.logoutHover; e.currentTarget.style.background = isLight ? "rgba(239,68,68,0.08)" : "rgba(244,63,94,0.1)"; }}
            onMouseOut={e => { e.currentTarget.style.color = S.logoutText; e.currentTarget.style.background = "none"; }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}