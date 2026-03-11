import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { Spinner } from "../components/UI";

const ROLES = [
  { id: "MANAGER", icon: "🎯", desc: "Full system access" },
  { id: "DISPATCHER", icon: "📡", desc: "Fleet & trip ops" },
  { id: "DRIVER", icon: "🚗", desc: "Trip management" },
  { id: "FINANCE", icon: "💰", desc: "Cost & analytics" },
];

export default function Register() {
  const { register, user, loading } = useAuth();
  const navigate = useNavigate();
  const { theme, effective, setDark, setLight, setSystem } = useTheme();

  const [form, setForm] = useState({ name: "", email: "", password: "", role: "DISPATCHER" });
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);

  const isLight = effective === "light";

  useEffect(() => {
    if (user) navigate("/home", { replace: true });
  }, [user, navigate]);


  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("");
    const res = await register(form.name.trim(), form.email.trim(), form.password, form.role);
    if (res.ok) navigate("/dashboard");

    else setError(res.message);
  };

  const inputStyle = {
    width: "100%", borderRadius: "10px",
    padding: "10px 14px", fontSize: "0.9rem",
    background: isLight ? "#F8FAFC" : "var(--bg-hull)",
    border: `1px solid ${isLight ? "#CBD5E1" : "var(--bg-wire)"}`,
    color: isLight ? "#0F172A" : "var(--c-light)",
    outline: "none", transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "'DM Sans', sans-serif",
  };

  const labelStyle = {
    display: "block", fontSize: "0.7rem",
    fontFamily: "'Syne', sans-serif", fontWeight: 600,
    letterSpacing: "0.12em", textTransform: "uppercase",
    color: isLight ? "#64748B" : "#637898",
    marginBottom: "6px",
  };

  const handleFocus = (e) => { e.target.style.borderColor = "#F59E0B"; e.target.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)"; };
  const handleBlur = (e) => { e.target.style.borderColor = isLight ? "#CBD5E1" : "var(--bg-wire)"; e.target.style.boxShadow = "none"; };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      background: isLight
        ? "linear-gradient(135deg, #EEF2FC 0%, #E8F0FE 40%, #F0FDF4 100%)"
        : "linear-gradient(135deg, #07090F 0%, #0C0F1A 60%, #07090F 100%)",
      backgroundAttachment: "fixed", transition: "background 0.3s",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "1rem clamp(1rem, 4vw, 2.5rem)",
        borderBottom: `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)"}`,
        background: isLight ? "rgba(255,255,255,0.7)" : "rgba(7,9,15,0.7)",
        backdropFilter: "blur(12px)",
      }}>
        <button onClick={() => navigate("/home")} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          <span style={{ fontSize: "1.25rem" }}>⚡</span>
          <span style={{
            fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1rem",
            background: isLight ? "linear-gradient(135deg,#1E3A5F,#2563EB)" : "none",
            WebkitBackgroundClip: isLight ? "text" : "unset",
            WebkitTextFillColor: isLight ? "transparent" : "var(--c-snow)",
            color: isLight ? "transparent" : "var(--c-snow)",
          }}>
            Fleet<span style={{ background: "linear-gradient(135deg,#F59E0B,#F97316)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Sync</span>
          </span>
        </button>

        <div style={{ display: "flex", gap: "2px", background: isLight ? "rgba(0,0,0,0.06)" : "var(--bg-plate)", borderRadius: "8px", padding: "3px" }}>
          {[{ mode: "light", icon: "☀️" }, { mode: "system", icon: "💻" }, { mode: "dark", icon: "🌙" }].map(({ mode, icon }) => (
            <button key={mode} onClick={() => mode === "light" ? setLight() : mode === "dark" ? setDark() : setSystem()}
              style={{
                border: "none", cursor: "pointer", padding: "4px 9px", borderRadius: "6px", fontSize: "0.8rem",
                background: theme === mode ? (isLight ? "rgba(255,255,255,0.9)" : "var(--bg-rim)") : "transparent", transition: "background 0.2s"
              }}
            >{icon}</button>
          ))}
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem clamp(1rem, 5vw, 2rem)" }}>
        <div style={{
          width: "100%", maxWidth: "460px",
          background: isLight ? "rgba(255,255,255,0.85)" : "rgba(12,15,26,0.9)",
          border: `1px solid ${isLight ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.07)"}`,
          borderRadius: "20px",
          padding: "clamp(1.5rem, 5vw, 2.5rem)",
          boxShadow: isLight ? "0 20px 60px rgba(0,0,0,0.1)" : "0 20px 60px rgba(0,0,0,0.5)",
          backdropFilter: "blur(16px)",
          animation: "fadeUp 0.35s ease-out both",
        }}>

          {/* Header */}
          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: "linear-gradient(135deg,rgba(245,158,11,0.2),rgba(249,115,22,0.2))",
              border: "1px solid rgba(245,158,11,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: "1rem", fontSize: "1.25rem",
            }}>🚀</div>
            <h1 style={{
              fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.6rem",
              color: isLight ? "#0A0F1E" : "#EEF3FA",
              letterSpacing: "-0.02em", marginBottom: "6px",
            }}>Create account</h1>
            <p style={{ fontSize: "0.9rem", color: isLight ? "#475569" : "#637898" }}>
              Join FleetSync and manage your fleet smarter
            </p>
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {/* Name */}
            <div>
              <label style={labelStyle}>Full Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="John Smith" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            {/* Email */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" autoComplete="email" value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
            </div>

            {/* Password */}
            <div>
              <label style={labelStyle}>Password</label>
              <div style={{ position: "relative" }}>
                <input type={showPass ? "text" : "password"} value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min. 6 characters"
                  style={{ ...inputStyle, paddingRight: "40px" }}
                  onFocus={handleFocus} onBlur={handleBlur} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{
                  position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  color: isLight ? "#94A3B8" : "#637898", fontSize: "0.8rem", padding: "4px",
                }}>{showPass ? "🙈" : "👁"}</button>
              </div>
            </div>

            {/* Role picker */}
            <div>
              <label style={labelStyle}>Your Role</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {ROLES.map(({ id, icon, desc }) => (
                  <button key={id} type="button"
                    onClick={() => setForm(f => ({ ...f, role: id }))}
                    style={{
                      padding: "10px 12px", borderRadius: "10px", cursor: "pointer",
                      border: `2px solid ${form.role === id ? "#F59E0B" : (isLight ? "#CBD5E1" : "var(--bg-wire)")}`,
                      background: form.role === id
                        ? (isLight ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.1)")
                        : (isLight ? "#F8FAFC" : "var(--bg-hull)"),
                      boxShadow: form.role === id ? "0 0 0 3px rgba(245,158,11,0.12)" : "none",
                      textAlign: "left", transition: "all 0.15s",
                    }}
                  >
                    <div style={{ fontSize: "1.1rem", marginBottom: "2px" }}>{icon}</div>
                    <div style={{
                      fontSize: "0.75rem", fontFamily: "'Syne',sans-serif", fontWeight: 700,
                      color: form.role === id ? (isLight ? "#B45309" : "#F59E0B") : (isLight ? "#334155" : "var(--c-light)"),
                    }}>{id}</div>
                    <div style={{ fontSize: "0.65rem", color: isLight ? "#64748B" : "#637898", marginTop: "1px" }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: "8px",
                background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)",
                color: isLight ? "#B91C1C" : "#F43F5E", fontSize: "0.875rem",
                display: "flex", alignItems: "center", gap: "8px",
              }}>⚠️ {error}</div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                background: "linear-gradient(135deg,#F59E0B,#F97316)",
                color: "#fff", border: "none",
                padding: "12px", borderRadius: "10px",
                fontSize: "0.95rem", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                fontFamily: "'Syne', sans-serif",
                boxShadow: "0 4px 14px rgba(245,158,11,0.35)",
                opacity: loading ? 0.7 : 1,
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                marginTop: "4px", width: "100%", transition: "opacity 0.2s, transform 0.15s",
              }}
              onMouseOver={e => { if (!loading) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}
            >
              {loading ? <><Spinner size="sm" /> Creating…</> : "Create Account →"}
            </button>
          </form>

          <div style={{
            marginTop: "1.25rem", paddingTop: "1.25rem",
            borderTop: `1px solid ${isLight ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.06)"}`,
            textAlign: "center",
          }}>
            <p style={{ fontSize: "0.875rem", color: isLight ? "#64748B" : "#637898" }}>
              Already have an account?{" "}
              <span onClick={() => navigate("/login")} style={{ color: isLight ? "#D97706" : "#F59E0B", cursor: "pointer", fontWeight: 600 }}>
                Sign in →
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}