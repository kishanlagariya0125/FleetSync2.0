import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useAuth } from "../contexts/AuthContext";

/* ── Stats data ──────────────────────────────────────────────── */
const STATS = [
    { value: "99.9%", label: "Uptime SLA" },
    { value: "2.4s", label: "Avg Response" },
    { value: "50K+", label: "Trips Managed" },
    { value: "340+", label: "Fleet Operators" },
];

/* ── Features ─────────────────────────────────────────────────── */
const FEATURES = [
    {
        icon: "🚚",
        title: "Real-Time Dispatch",
        desc: "Assign vehicles and drivers instantly. Track every trip from DRAFT to COMPLETED with one click.",
        color: "#F59E0B",
    },
    {
        icon: "👤",
        title: "Driver Management",
        desc: "Manage driver profiles, license expiry alerts, and status tracking — all in one place.",
        color: "#10B981",
    },
    {
        icon: "⛽",
        title: "Fuel & Maintenance",
        desc: "Log every fuel fill-up and service record. Spot spending patterns before they become problems.",
        color: "#38BDF8",
    },
    {
        icon: "📊",
        title: "Analytics Dashboard",
        desc: "Monthly cost breakdowns, trip stats, and fleet utilisation — visualised clearly.",
        color: "#8B5CF6",
    },
    {
        icon: "🔒",
        title: "Role-Based Access",
        desc: "Managers, Dispatchers, Drivers, and Finance — each role sees exactly what they need.",
        color: "#F43F5E",
    },
    {
        icon: "🌐",
        title: "Cloud Deployed",
        desc: "Always available. Hosted on enterprise infrastructure with automatic failover.",
        color: "#F59E0B",
    },
];

/* ── How it works steps ──────────────────────────────────────── */
const STEPS = [
    { step: "01", title: "Register & Assign Roles", desc: "Create your team accounts and assign Manager, Dispatcher, Driver or Finance roles." },
    { step: "02", title: "Add Fleet & Drivers", desc: "Register your vehicles and driver profiles with license details for compliance tracking." },
    { step: "03", title: "Dispatch Trips", desc: "Create trips, assign drivers and vehicles, then dispatch with a single click." },
    { step: "04", title: "Track & Analyse", desc: "Monitor live status, log fuel and maintenance, and review analytics reports." },
];

export default function Homepage() {
    const navigate = useNavigate();
    const { theme, effective, setDark, setLight, setSystem } = useTheme();
    const { user } = useAuth();
    const [mobileOpen, setMobileOpen] = useState(false);

    const isLight = effective === "light";

    /* ── colour tokens that flip per theme ── */
    const T = {
        navBg: isLight ? "rgba(255,255,255,0.92)" : "rgba(7,9,15,0.92)",
        navBorder: isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)",
        btnOutlineBg: isLight ? "#fff" : "transparent",
        btnOutlineHover: isLight ? "#F3F4F6" : "var(--bg-plate)",
        cardBg: isLight ? "rgba(255,255,255,0.7)" : "var(--bg-deck)",
        cardBorder: isLight ? "rgba(0,0,0,0.07)" : "var(--bg-plate)",
        statsBorder: isLight ? "rgba(0,0,0,0.08)" : "var(--bg-plate)",
        footerBorder: isLight ? "rgba(0,0,0,0.08)" : "var(--bg-plate)",
    };

    const themeButtons = [
        { mode: "light", icon: "☀️", label: "Light" },
        { mode: "system", icon: "💻", label: "System" },
        { mode: "dark", icon: "🌙", label: "Dark" },
    ];

    return (
        <div style={{
            background: isLight
                ? "linear-gradient(135deg, #F0F4FF 0%, #E8F0FE 30%, #FEF9EE 70%, #F0FDF4 100%)"
                : "var(--bg-void)",
            color: isLight ? "#1E293B" : "var(--c-light)",
            minHeight: "100vh",
            fontFamily: "'DM Sans', sans-serif",
            backgroundAttachment: "fixed",
        }}>

            {/* ── NAVBAR ──────────────────────────────────────────── */}
            <nav style={{
                position: "sticky", top: 0, zIndex: 100,
                background: T.navBg,
                backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                borderBottom: `1px solid ${T.navBorder}`,
                boxShadow: isLight ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
            }}>
                {/* Main bar */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "0 clamp(1rem, 4vw, 3rem)", height: "60px",
                }}>
                    {/* Logo */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "1.4rem" }}>⚡</span>
                        <span style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.05rem",
                            background: isLight ? "linear-gradient(135deg,#1E3A5F,#2563EB)" : "none",
                            WebkitBackgroundClip: isLight ? "text" : "unset",
                            WebkitTextFillColor: isLight ? "transparent" : "var(--c-snow)",
                        }}>
                            Fleet<span style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span>
                        </span>
                        <span style={{
                            fontSize: "0.6rem", fontFamily: "'JetBrains Mono', monospace",
                            background: "rgba(245,158,11,0.15)", color: "#D97706",
                            border: "1px solid rgba(245,158,11,0.3)", borderRadius: "4px",
                            padding: "1px 5px", display: "none",
                        }} className="hidden sm:inline-block">v2.0</span>
                    </div>

                    {/* Desktop nav actions */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {/* Theme toggle — desktop only, hidden on mobile */}
                        <div
                            className="hidden sm:flex"
                            style={{
                                gap: "2px",
                                background: isLight ? "rgba(0,0,0,0.06)" : "var(--bg-plate)",
                                borderRadius: "8px", padding: "3px",
                                alignItems: "center",
                            }}
                        >
                            {themeButtons.map(({ mode, icon, label }) => (
                                <button key={mode} title={label}
                                    onClick={() => mode === "light" ? setLight() : mode === "dark" ? setDark() : setSystem()}
                                    style={{
                                        border: "none", cursor: "pointer",
                                        padding: "4px 9px", borderRadius: "6px", fontSize: "0.85rem",
                                        background: theme === mode
                                            ? (isLight ? "rgba(255,255,255,0.95)" : "var(--bg-rim)")
                                            : "transparent",
                                        transition: "background 0.15s",
                                    }}
                                >{icon}</button>
                            ))}
                        </div>

                        {/* Auth CTA — desktop only, hidden on mobile */}
                        <div className="hidden sm:flex" style={{ gap: "8px", alignItems: "center" }}>
                            {user ? (
                                <button onClick={() => navigate("/dashboard")} style={{
                                    border: "none", background: "linear-gradient(135deg,#F59E0B,#F97316)",
                                    color: "#fff", padding: "8px 20px", borderRadius: "8px",
                                    fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                                    fontFamily: "'Syne',sans-serif", boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                                    transition: "all 0.2s",
                                }}>🏢 Workplace</button>
                            ) : (
                                <>
                                    <button onClick={() => navigate("/login")} style={{
                                        border: `1px solid ${isLight ? "rgba(0,0,0,0.15)" : "var(--bg-wire)"}`,
                                        background: "transparent",
                                        color: isLight ? "#1E3A5F" : "var(--c-light)",
                                        padding: "8px 16px", borderRadius: "8px",
                                        fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                                        fontFamily: "'Syne',sans-serif",
                                    }}>Sign In</button>
                                    <button onClick={() => navigate("/register")} style={{
                                        border: "none", background: "linear-gradient(135deg,#F59E0B,#F97316)",
                                        color: "#fff", padding: "8px 18px", borderRadius: "8px",
                                        fontSize: "0.875rem", fontWeight: 700, cursor: "pointer",
                                        fontFamily: "'Syne',sans-serif",
                                        boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                                    }}>Get Started</button>
                                </>
                            )}
                        </div>

                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setMobileOpen(o => !o)}
                            className="sm:hidden"
                            style={{
                                background: "none", border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "var(--bg-wire)"}`,
                                color: isLight ? "#1E293B" : "var(--c-light)",
                                padding: "6px 10px", borderRadius: "8px", cursor: "pointer",
                                fontSize: "1.1rem", lineHeight: 1,
                            }}
                        >{mobileOpen ? "✕" : "☰"}</button>
                    </div>
                </div>

                {/* Mobile dropdown */}
                {mobileOpen && (
                    <div style={{
                        borderTop: `1px solid ${T.navBorder}`,
                        padding: "1rem clamp(1rem,4vw,3rem)",
                        background: T.navBg,
                        display: "flex", flexDirection: "column", gap: "12px",
                    }}>
                        {/* Theme row */}
                        <div style={{ display: "flex", gap: "4px", background: isLight ? "rgba(0,0,0,0.05)" : "var(--bg-plate)", borderRadius: "10px", padding: "4px" }}>
                            {themeButtons.map(({ mode, icon, label }) => (
                                <button key={mode}
                                    onClick={() => { mode === "light" ? setLight() : mode === "dark" ? setDark() : setSystem(); }}
                                    style={{
                                        flex: 1, border: "none", cursor: "pointer",
                                        padding: "7px", borderRadius: "7px", fontSize: "0.85rem",
                                        fontFamily: "'DM Sans',sans-serif", fontWeight: 500,
                                        background: theme === mode ? (isLight ? "#fff" : "var(--bg-rim)") : "transparent",
                                        color: isLight ? "#334155" : "var(--c-ghost)",
                                        boxShadow: theme === mode && isLight ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                                        transition: "background 0.15s",
                                    }}
                                >{icon} {label}</button>
                            ))}
                        </div>
                        {/* Auth buttons */}
                        {user ? (
                            <button onClick={() => { navigate("/dashboard"); setMobileOpen(false); }} style={{
                                background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#fff",
                                border: "none", padding: "12px", borderRadius: "10px",
                                fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif",
                                boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                            }}>🏢 Go to Workplace →</button>
                        ) : (
                            <>
                                <button onClick={() => { navigate("/register"); setMobileOpen(false); }} style={{
                                    background: "linear-gradient(135deg,#F59E0B,#F97316)", color: "#fff",
                                    border: "none", padding: "12px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 700, cursor: "pointer", fontFamily: "'Syne',sans-serif",
                                    boxShadow: "0 4px 14px rgba(245,158,11,0.3)",
                                }}>Get Started →</button>
                                <button onClick={() => { navigate("/login"); setMobileOpen(false); }} style={{
                                    background: isLight ? "rgba(255,255,255,0.8)" : "var(--bg-plate)",
                                    color: isLight ? "#1E3A5F" : "var(--c-light)",
                                    border: `1px solid ${isLight ? "rgba(0,0,0,0.1)" : "var(--bg-wire)"}`,
                                    padding: "12px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Syne',sans-serif",
                                }}>Sign In</button>
                            </>
                        )}
                    </div>
                )}
            </nav>

            {/* ── HERO ────────────────────────────────────────────── */}
            <section style={{
                position: "relative", overflow: "hidden",
                padding: "clamp(4rem, 12vw, 9rem) clamp(1rem, 5vw, 4rem) clamp(3rem, 8vw, 7rem)",
                textAlign: "center",
            }}>
                {/* Background glows */}
                <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
                    <div style={{
                        position: "absolute", top: "-20%", left: "50%", transform: "translateX(-50%)",
                        width: "800px", height: "800px",
                        background: isLight
                            ? "radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%)"
                            : "radial-gradient(circle, rgba(245,158,11,0.12) 0%, transparent 65%)",
                    }} />
                    <div style={{
                        position: "absolute", bottom: "0", left: "10%",
                        width: "400px", height: "400px",
                        background: isLight
                            ? "radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
                    }} />
                </div>

                {/* Badge */}
                <div style={{
                    display: "inline-flex", alignItems: "center", gap: "8px",
                    background: "rgba(245,158,11,0.1)",
                    border: "1px solid rgba(245,158,11,0.3)",
                    borderRadius: "999px", padding: "6px 18px", marginBottom: "2rem",
                    fontSize: "0.8rem", fontFamily: "'JetBrains Mono', monospace",
                    color: isLight ? "#B45309" : "var(--c-amber)",
                }}>
                    <span style={{ width: "6px", height: "6px", background: "#F59E0B", borderRadius: "50%", boxShadow: "0 0 8px #F59E0B", display: "inline-block" }} />
                    Fleet Management System — v2.0 Released
                </div>

                <h1 style={{
                    fontFamily: "'Syne', sans-serif", fontWeight: 800,
                    fontSize: "clamp(2.5rem, 7vw, 5.5rem)", lineHeight: 1.05,
                    marginBottom: "1.5rem", letterSpacing: "-0.02em",
                    color: isLight ? "#0F172A" : "var(--c-snow)",
                }}>
                    Your entire fleet.<br />
                    <span style={{
                        background: "linear-gradient(135deg, #F59E0B, #F97316, #EF4444)",
                        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                    }}>
                        Smarter & faster.
                    </span>
                </h1>

                <p style={{
                    fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
                    color: isLight ? "#475569" : "var(--c-ghost)",
                    maxWidth: "600px", margin: "0 auto 2.5rem", lineHeight: 1.7,
                }}>
                    FleetSync 2.0 gives your team real-time visibility over every vehicle, driver,
                    trip and cost — in one unified command center.
                </p>

                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    {user ? (
                        <button
                            onClick={() => navigate("/dashboard")}

                            style={{
                                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                                color: "#fff", border: "none",
                                padding: "14px 40px", borderRadius: "10px",
                                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                                fontFamily: "'Syne', sans-serif",
                                boxShadow: "0 8px 30px rgba(245,158,11,0.4)",
                                transition: "all 0.2s",
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(245,158,11,0.5)"; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 30px rgba(245,158,11,0.4)"; }}
                        >
                            🏢 Go to Workplace →
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/register")}
                                style={{
                                    background: "linear-gradient(135deg, #F59E0B, #F97316)",
                                    color: "#fff", border: "none",
                                    padding: "14px 36px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                                    fontFamily: "'Syne', sans-serif",
                                    boxShadow: "0 8px 30px rgba(245,158,11,0.4)",
                                    transition: "all 0.2s",
                                }}
                                onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
                                onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; }}
                            >
                                Start Free — No Credit Card
                            </button>
                            <button
                                onClick={() => navigate("/login")}
                                style={{
                                    background: isLight ? "rgba(255,255,255,0.8)" : "var(--bg-plate)",
                                    color: isLight ? "#1E3A5F" : "var(--c-light)",
                                    border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "var(--bg-wire)"}`,
                                    padding: "14px 32px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 600, cursor: "pointer",
                                    fontFamily: "'Syne', sans-serif", transition: "all 0.2s",
                                    backdropFilter: "blur(8px)",
                                    boxShadow: isLight ? "0 2px 12px rgba(0,0,0,0.08)" : "none",
                                }}
                            >Sign In →</button>
                        </>
                    )}
                </div>

                {/* Dashboard preview mockup */}
                <div style={{ marginTop: "4rem", position: "relative", maxWidth: "880px", margin: "4rem auto 0" }}>
                    <div style={{
                        borderRadius: "16px", overflow: "hidden",
                        border: isLight ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.08)",
                        boxShadow: isLight
                            ? "0 30px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(245,158,11,0.1)"
                            : "0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1)",
                        background: isLight ? "#fff" : "var(--bg-deck)",
                    }}>
                        <div style={{
                            padding: "12px 20px",
                            background: isLight ? "#F8FAFC" : "var(--bg-hull)",
                            borderBottom: `1px solid ${isLight ? "rgba(0,0,0,0.06)" : "var(--bg-plate)"}`,
                            display: "flex", alignItems: "center", gap: "8px",
                        }}>
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F43F5E", display: "inline-block" }} />
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                            <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                            <span style={{ flex: 1, textAlign: "center", fontSize: "0.7rem", fontFamily: "'JetBrains Mono', monospace", color: isLight ? "#94A3B8" : "var(--c-ghost)" }}>fleet-sync2-0.vercel.app</span>
                        </div>
                        <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                            {[
                                { label: "Total Vehicles", value: "24", color: "#F59E0B", icon: "🚚" },
                                { label: "Active Drivers", value: "18", color: "#10B981", icon: "👤" },
                                { label: "Trips Today", value: "7", color: "#38BDF8", icon: "📍" },
                                { label: "Monthly Cost", value: "₹84K", color: "#8B5CF6", icon: "💰" },
                            ].map(({ label, value, color, icon }) => (
                                <div key={label} style={{
                                    background: isLight ? "linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.9))" : "var(--bg-plate)",
                                    borderRadius: "10px", padding: "16px 14px",
                                    border: isLight ? "1px solid rgba(0,0,0,0.06)" : "1px solid var(--bg-rim)",
                                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.05)" : "none",
                                }}>
                                    <div style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{icon}</div>
                                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.4rem", color, marginBottom: "4px" }}>{value}</div>
                                    <div style={{ fontSize: "0.7rem", color: isLight ? "#64748B" : "var(--c-ghost)", fontFamily: "'JetBrains Mono', monospace" }}>{label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── STATS BAR ───────────────────────────────────────── */}
            <section style={{
                borderTop: `1px solid ${T.statsBorder}`, borderBottom: `1px solid ${T.statsBorder}`,
                background: isLight ? "rgba(255,255,255,0.5)" : "transparent",
                backdropFilter: isLight ? "blur(10px)" : "none",
                padding: "3rem clamp(1rem, 5vw, 4rem)",
                display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "2rem",
                textAlign: "center",
            }}>
                {STATS.map(({ value, label }) => (
                    <div key={label}>
                        <div style={{
                            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "2.5rem",
                            background: "linear-gradient(135deg, #F59E0B, #F97316)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                            letterSpacing: "-0.02em",
                        }}>{value}</div>
                        <div style={{ fontSize: "0.85rem", color: isLight ? "#64748B" : "var(--c-ghost)", marginTop: "4px" }}>{label}</div>
                    </div>
                ))}
            </section>

            {/* ── FEATURES ────────────────────────────────────────── */}
            <section style={{ padding: "6rem clamp(1rem, 5vw, 4rem)", maxWidth: "1100px", margin: "0 auto" }}>
                <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", color: isLight ? "#B45309" : "var(--c-amber)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>CAPABILITIES</div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", color: isLight ? "#0F172A" : "var(--c-snow)", letterSpacing: "-0.02em" }}>
                        Everything your fleet needs
                    </h2>
                    <p style={{ color: isLight ? "#64748B" : "var(--c-ghost)", marginTop: "0.75rem", fontSize: "1rem" }}>
                        Built for real operators, not just spreadsheet warriors.
                    </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.25rem" }}>
                    {FEATURES.map(({ icon, title, desc, color }) => (
                        <div key={title}
                            style={{
                                background: T.cardBg, border: `1px solid ${T.cardBorder}`,
                                borderRadius: "14px", padding: "1.75rem",
                                backdropFilter: isLight ? "blur(10px)" : "none",
                                boxShadow: isLight ? "0 4px 20px rgba(0,0,0,0.05)" : "none",
                                transition: "transform 0.2s, border-color 0.2s, box-shadow 0.2s",
                                cursor: "default",
                            }}
                            onMouseOver={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.borderColor = color + "40"; e.currentTarget.style.boxShadow = `0 12px 40px ${color}20`; }}
                            onMouseOut={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.boxShadow = isLight ? "0 4px 20px rgba(0,0,0,0.05)" : "none"; }}
                        >
                            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>{icon}</div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1.05rem", color: isLight ? "#0F172A" : "var(--c-snow)", marginBottom: "0.5rem" }}>{title}</h3>
                            <p style={{ color: isLight ? "#64748B" : "var(--c-ghost)", fontSize: "0.9rem", lineHeight: 1.6 }}>{desc}</p>
                            <div style={{ width: "32px", height: "2px", background: color, borderRadius: "1px", marginTop: "1.25rem", opacity: 0.8 }} />
                        </div>
                    ))}
                </div>
            </section>

            {/* ── HOW IT WORKS ────────────────────────────────────── */}
            <section style={{
                padding: "5rem clamp(1rem, 5vw, 4rem)",
                background: isLight
                    ? "linear-gradient(135deg, rgba(219,234,254,0.5), rgba(254,243,199,0.4))"
                    : "var(--bg-hull)",
            }}>
                <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                    <div style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", color: isLight ? "#B45309" : "var(--c-amber)", letterSpacing: "0.15em", marginBottom: "0.75rem" }}>WORKFLOW</div>
                    <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(2rem, 4vw, 3rem)", color: isLight ? "#0F172A" : "var(--c-snow)", letterSpacing: "-0.02em" }}>
                        Up and running in minutes
                    </h2>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", maxWidth: "1000px", margin: "0 auto" }}>
                    {STEPS.map(({ step, title, desc }, i) => (
                        <div key={step} style={{ textAlign: "center" }}>
                            <div style={{
                                width: "52px", height: "52px", borderRadius: "12px",
                                background: i === 0
                                    ? "linear-gradient(135deg, #F59E0B, #F97316)"
                                    : (isLight ? "rgba(255,255,255,0.8)" : "var(--bg-plate)"),
                                border: `1px solid ${i === 0 ? "transparent" : (isLight ? "rgba(0,0,0,0.1)" : "var(--bg-wire)")}`,
                                boxShadow: i === 0 ? "0 4px 14px rgba(245,158,11,0.4)" : (isLight ? "0 2px 8px rgba(0,0,0,0.06)" : "none"),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 1.25rem",
                                fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: "0.85rem",
                                color: i === 0 ? "#fff" : (isLight ? "#B45309" : "var(--c-amber)"),
                            }}>{step}</div>
                            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "1rem", color: isLight ? "#0F172A" : "var(--c-snow)", marginBottom: "0.5rem" }}>{title}</h3>
                            <p style={{ color: isLight ? "#64748B" : "var(--c-ghost)", fontSize: "0.875rem", lineHeight: 1.6 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── CTA ─────────────────────────────────────────────── */}
            <section style={{
                margin: "4rem clamp(1rem, 5vw, 4rem)",
                borderRadius: "20px",
                background: isLight
                    ? "linear-gradient(135deg, rgba(253,230,138,0.5) 0%, rgba(253,186,116,0.3) 50%, rgba(167,243,208,0.3) 100%)"
                    : "linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(139,92,246,0.08) 100%)",
                border: isLight ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(245,158,11,0.2)",
                padding: "4rem clamp(1.5rem, 5vw, 4rem)",
                textAlign: "center", overflow: "hidden", position: "relative",
                boxShadow: isLight ? "0 8px 40px rgba(245,158,11,0.1)" : "none",
                backdropFilter: isLight ? "blur(10px)" : "none",
            }}>
                <div style={{ fontSize: "0.75rem", fontFamily: "'JetBrains Mono', monospace", color: isLight ? "#B45309" : "var(--c-amber)", letterSpacing: "0.15em", marginBottom: "1rem" }}>GET STARTED TODAY</div>
                <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "clamp(1.75rem, 4vw, 3rem)", color: isLight ? "#0F172A" : "var(--c-snow)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>
                    Ready to take control of your fleet?
                </h2>
                <p style={{ color: isLight ? "#475569" : "var(--c-ghost)", marginBottom: "2.5rem", fontSize: "1rem", maxWidth: "500px", margin: "0 auto 2rem" }}>
                    Join hundreds of fleet operators who made the switch to smarter management.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
                    {user ? (
                        <button
                            onClick={() => navigate("/dashboard")}

                            style={{
                                background: "linear-gradient(135deg, #F59E0B, #F97316)",
                                color: "#fff", border: "none",
                                padding: "14px 40px", borderRadius: "10px",
                                fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                                fontFamily: "'Syne', sans-serif",
                                boxShadow: "0 8px 30px rgba(245,158,11,0.4)", transition: "all 0.2s",
                            }}
                        >🏢 Go to Workplace →</button>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate("/register")}
                                style={{
                                    background: "linear-gradient(135deg, #F59E0B, #F97316)",
                                    color: "#fff", border: "none",
                                    padding: "14px 40px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 700, cursor: "pointer",
                                    fontFamily: "'Syne', sans-serif",
                                    boxShadow: "0 8px 30px rgba(245,158,11,0.4)", transition: "all 0.2s",
                                }}
                            >Create Free Account →</button>
                            <button
                                onClick={() => navigate("/login")}
                                style={{
                                    background: isLight ? "rgba(255,255,255,0.7)" : "var(--bg-plate)",
                                    color: isLight ? "#1E3A5F" : "var(--c-light)",
                                    border: `1px solid ${isLight ? "rgba(0,0,0,0.12)" : "var(--bg-wire)"}`,
                                    padding: "14px 32px", borderRadius: "10px",
                                    fontSize: "1rem", fontWeight: 600, cursor: "pointer",
                                    fontFamily: "'Syne', sans-serif", transition: "background 0.2s",
                                }}
                            >Sign In</button>
                        </>
                    )}
                </div>
            </section>

            {/* ── FOOTER ──────────────────────────────────────────── */}
            <footer style={{
                borderTop: `1px solid ${T.footerBorder}`,
                padding: "2rem clamp(1rem, 5vw, 4rem)",
                display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "1rem",
                background: isLight ? "rgba(255,255,255,0.5)" : "transparent",
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>⚡</span>
                    <span style={{
                        fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: "0.9rem",
                        background: isLight ? "linear-gradient(135deg, #1E3A5F, #2563EB)" : "none",
                        WebkitBackgroundClip: isLight ? "text" : "unset",
                        WebkitTextFillColor: isLight ? "transparent" : "var(--c-snow)",
                        color: isLight ? "transparent" : "var(--c-snow)",
                    }}>
                        Fleet<span style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span> 2.0
                    </span>
                </div>
                <div style={{ color: isLight ? "#64748B" : "var(--c-ghost)", fontSize: "0.8rem" }}>
                    © {new Date().getFullYear()} FleetSync. Deployed on Vercel + Render + Neon.
                </div>
                <div style={{ display: "flex", gap: "16px" }}>
                    {["Privacy", "Terms", "Docs"].map(l => (
                        <span key={l} style={{ fontSize: "0.8rem", color: isLight ? "#64748B" : "var(--c-ghost)", cursor: "pointer" }}
                            onMouseOver={e => e.currentTarget.style.color = isLight ? "#0F172A" : "var(--c-light)"}
                            onMouseOut={e => e.currentTarget.style.color = isLight ? "#64748B" : "var(--c-ghost)"}
                        >{l}</span>
                    ))}
                </div>
            </footer>
        </div>
    );
}
