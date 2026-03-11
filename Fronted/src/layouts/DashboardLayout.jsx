import { useState } from "react";
import { useLocation, Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../contexts/ThemeContext";

const PAGE_INFO = {
  "/dashboard": ["Command Center", "Live fleet overview"],
  "/team": ["Team & Roles", "Fleet members & permissions"],
  "/vehicles": ["Vehicle Registry", "Asset management"],
  "/drivers": ["Driver Profiles", "Compliance & scheduling"],
  "/trips": ["Trip Dispatcher", "Routes & assignments"],
  "/maintenance": ["Service Logs", "Maintenance tracking"],
  "/fuel": ["Fuel Logs", "Fuel expense records"],
  "/analytics": ["Analytics", "Performance reports"],
};

const THEME_ICONS = { dark: "🌙", light: "☀️", system: "💻" };

export default function DashboardLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { theme, toggle } = useTheme();

  // 🔹 match by prefix so /vehicles/5 still works
  const match = Object.keys(PAGE_INFO).find((p) =>
    pathname === p || pathname.startsWith(p + "/")
  );
  const [title, sub] = PAGE_INFO[match] || ["FleetFlow", ""];

  const { effective } = useTheme();
  const isLight = effective === "light";

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--bg-void)", color: "var(--c-light)" }}
    >
      {open && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: isLight ? "rgba(15,23,42,0.4)" : "rgba(7,9,15,0.75)", backdropFilter: "blur(4px)" }}
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-40 lg:static lg:flex transform transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
      >
        <Sidebar onClose={() => setOpen(false)} />
      </div>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{
            borderBottom: "1px solid var(--bg-plate)",
            background: "var(--bg-hull)",
            backdropFilter: "blur(8px)",
          }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => setOpen(true)}
              className="lg:hidden btn-ghost p-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div>
              <h1
                className="font-display font-bold text-base leading-none"
                style={{ color: "var(--c-snow)" }}
              >
                {title}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--c-ghost)" }}>{sub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle button */}
            <button
              onClick={toggle}
              title={`Theme: ${theme} — click to cycle`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background: "var(--bg-plate)",
                border: "1px solid var(--bg-wire)",
                color: "var(--c-ghost)",
                cursor: "pointer",
              }}
              onMouseOver={e => e.currentTarget.style.background = "var(--bg-rim)"}
              onMouseOut={e => e.currentTarget.style.background = "var(--bg-plate)"}
            >
              <span>{THEME_ICONS[theme]}</span>
              <span className="hidden sm:inline capitalize">{theme}</span>
            </button>

            {/* Date badge */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ background: "var(--bg-plate)", border: "1px solid var(--bg-wire)" }}
            >
              <span className="dot" style={{ background: "var(--c-jade)", boxShadow: "0 0 6px var(--c-jade)", animation: "blink 2s ease-in-out infinite", display: "inline-block", width: "6px", height: "6px", borderRadius: "50%" }} />
              <span className="text-mono text-xs" style={{ color: "var(--c-ghost)" }}>
                {new Date().toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </header>

        <main
          className="flex-1 overflow-y-auto p-5 lg:p-6"
          style={{ background: "var(--bg-void)" }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}