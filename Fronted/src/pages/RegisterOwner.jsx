import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";

/* Register As Fleet Owner
   Creates a user with OWNER role AND their fleet in one step.
*/
export default function RegisterOwner() {
    const { registerOwner, user, loading } = useAuth();
    const navigate = useNavigate();
    const { effective } = useTheme();

    const [form, setForm] = useState({
        name: "", email: "", password: "", fleetName: "",
    });
    const [error, setError] = useState("");
    const [showPass, setShowPass] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const isLight = effective === "light";

    /* Already logged in → go home */
    useEffect(() => {
        if (user) navigate("/home", { replace: true });
    }, [user, navigate]);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        const { name, email, password, fleetName } = form;
        if (!name.trim() || !email.trim() || !password.trim() || !fleetName.trim()) {
            return setError("All fields are required.");
        }
        if (password.length < 6) return setError("Password must be at least 6 characters.");
        setError(""); setSubmitting(true);

        const res = await registerOwner(
            name.trim(), email.trim(), password, fleetName.trim()
        );

        setSubmitting(false);
        if (res.ok) navigate("/dashboard");
        else setError(res.message);
    };

    /* ─── Styles ─── */
    const bg = isLight ? "#F8FAFC" : "#0D1117";
    const card = isLight ? "#FFFFFF" : "#161B22";
    const txt = isLight ? "#0F172A" : "#E2E8F0";
    const muted = isLight ? "#64748B" : "#94A3B8";
    const border = isLight ? "#CBD5E1" : "#30363D";

    const inputStyle = {
        width: "100%", borderRadius: "10px",
        padding: "10px 14px", fontSize: "0.9rem",
        background: isLight ? "#F8FAFC" : "#0D1117",
        border: `1px solid ${border}`, color: txt,
        outline: "none", transition: "border-color 0.2s",
        fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box",
    };

    const label = {
        display: "block", fontSize: "0.7rem",
        fontWeight: 700, letterSpacing: "0.12em",
        textTransform: "uppercase", color: muted,
        marginBottom: "6px", fontFamily: "'Syne', sans-serif",
    };

    return (
        <div style={{
            minHeight: "100vh", background: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "2rem", fontFamily: "'DM Sans', sans-serif",
        }}>
            <div style={{
                width: "100%", maxWidth: "440px",
                background: card, borderRadius: "20px",
                border: `1px solid ${border}`,
                boxShadow: isLight
                    ? "0 8px 30px rgba(0,0,0,0.08)"
                    : "0 8px 40px rgba(0,0,0,0.5)",
                padding: "2.5rem",
            }}>
                {/* ── HEADER ── */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏢</div>
                    <h1 style={{
                        margin: 0, fontSize: "1.5rem", fontWeight: 800, color: txt,
                        fontFamily: "'Syne', sans-serif"
                    }}>
                        Register as Fleet Owner
                    </h1>
                    <p style={{ margin: "0.5rem 0 0", color: muted, fontSize: "0.875rem" }}>
                        Create your account and your fleet in one step
                    </p>
                </div>

                {/* ── FORM ── */}
                <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

                    <label style={label} htmlFor="ro-fleet-name">
                        Fleet / Company Name
                    </label>
                    <div style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        background: isLight ? "#F8FAFC" : "#0D1117",
                        border: `1px solid ${border}`, borderRadius: "10px", padding: "2px 14px"
                    }}>
                        <span style={{ fontSize: "1.1rem" }}>🚛</span>
                        <input
                            id="ro-fleet-name"
                            type="text"
                            placeholder="e.g. Apex Logistics"
                            value={form.fleetName}
                            onChange={set("fleetName")}
                            style={{ ...inputStyle, border: "none", background: "transparent", padding: "10px 0" }}
                        />
                    </div>

                    <div>
                        <label style={label} htmlFor="ro-name">Full Name</label>
                        <input id="ro-name" type="text" placeholder="Your full name"
                            value={form.name} onChange={set("name")} style={inputStyle} />
                    </div>

                    <div>
                        <label style={label} htmlFor="ro-email">Email Address</label>
                        <input id="ro-email" type="email" placeholder="owner@company.com"
                            value={form.email} onChange={set("email")} style={inputStyle} />
                    </div>

                    <div>
                        <label style={label} htmlFor="ro-password">Password</label>
                        <div style={{ position: "relative" }}>
                            <input
                                id="ro-password"
                                type={showPass ? "text" : "password"}
                                placeholder="At least 6 characters"
                                value={form.password}
                                onChange={set("password")}
                                style={{ ...inputStyle, paddingRight: "44px" }}
                            />
                            <button type="button"
                                onClick={() => setShowPass(v => !v)}
                                style={{
                                    position: "absolute", right: "10px", top: "50%",
                                    transform: "translateY(-50%)", background: "none",
                                    border: "none", cursor: "pointer", fontSize: "1rem", color: muted,
                                }}
                            >
                                {showPass ? "🙈" : "👁️"}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
                            borderRadius: "8px", padding: "10px 14px", color: "#EF4444",
                            fontSize: "0.85rem",
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        id="register-owner-submit"
                        type="submit"
                        disabled={submitting || loading}
                        style={{
                            width: "100%", padding: "12px",
                            borderRadius: "10px", border: "none", cursor: "pointer",
                            background: "linear-gradient(135deg, #F59E0B, #F97316)",
                            color: "#fff", fontWeight: 700, fontSize: "1rem",
                            fontFamily: "'Syne', sans-serif", letterSpacing: "0.05em",
                            opacity: submitting || loading ? 0.7 : 1,
                            transition: "opacity 0.2s, transform 0.1s",
                        }}
                    >
                        {submitting || loading ? "Creating Fleet…" : "🚀 Create My Fleet"}
                    </button>
                </form>

                {/* ── FOOTER ── */}
                <p style={{ textAlign: "center", color: muted, fontSize: "0.85rem", marginTop: "1.5rem" }}>
                    Already have an account?{" "}
                    <Link to="/login" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>
                        Sign In
                    </Link>
                </p>
                <p style={{ textAlign: "center", color: muted, fontSize: "0.85rem", marginTop: "0.5rem" }}>
                    Joining an existing fleet?{" "}
                    <Link to="/register" style={{ color: "#F59E0B", fontWeight: 600, textDecoration: "none" }}>
                        Register here
                    </Link>
                </p>
            </div>
        </div>
    );
}
