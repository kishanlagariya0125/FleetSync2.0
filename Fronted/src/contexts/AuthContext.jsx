import { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from "../services/api";

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ff_user")); }
    catch { return null; }
  });

  const [loading, setLoading] = useState(() => !!localStorage.getItem("ff_token"));

  /* ─── Verify token on load ─── */
  useEffect(() => {
    const token = localStorage.getItem("ff_token");
    if (!token) { setLoading(false); return; }

    authAPI.me()
      .then(res => {
        const u = res.data.data;
        setUser(u);
        localStorage.setItem("ff_user", JSON.stringify(u));
      })
      .catch(() => {
        localStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  /* ─── LOGIN ─── */
  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      localStorage.setItem("ff_token", data.data.token);
      localStorage.setItem("ff_user", JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Login failed." };
    } finally {
      setLoading(false);
    }
  };

  /* ─── REGISTER (regular account — no fleet) ─── */
  const register = async (name, email, password, role = "DRIVER") => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password, role });
      localStorage.setItem("ff_token", data.data.token);
      localStorage.setItem("ff_user", JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { ok: true };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Register failed." };
    } finally {
      setLoading(false);
    }
  };

  /* ─── REGISTER AS FLEET OWNER ─── */
  const registerOwner = async (name, email, password, fleetName) => {
    setLoading(true);
    try {
      const { data } = await authAPI.registerOwner({ name, email, password, fleetName });
      localStorage.setItem("ff_token", data.data.token);
      localStorage.setItem("ff_user", JSON.stringify(data.data.user));
      setUser(data.data.user);
      return { ok: true, fleet: data.data.fleet };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || "Registration failed." };
    } finally {
      setLoading(false);
    }
  };

  /* ─── LOGOUT ─── */
  const logout = () => {
    localStorage.clear();
    setUser(null);
  };

  /* ─── HELPERS ─── */
  /** can("OWNER","MANAGER") → true if user has any of these roles */
  const can = (...roles) => roles.includes(user?.role);
  /** hasFleet → true if user is linked to a fleet */
  const hasFleet = () => Boolean(user?.fleet_id);

  return (
    <Ctx.Provider value={{ user, login, register, registerOwner, logout, loading, can, hasFleet }}>
      {children}
    </Ctx.Provider>
  );
}