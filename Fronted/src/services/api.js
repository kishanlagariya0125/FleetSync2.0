import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

/* ─── JWT auto-attach ─── */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ff_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname !== "/login") {
      localStorage.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

/* ─── AUTH ─── */
export const authAPI = {
  login: (d) => api.post("/auth/login", d),
  register: (d) => api.post("/auth/register", d),          // regular account (no fleet)
  registerOwner: (d) => api.post("/auth/register-owner", d),    // OWNER + fleet in one step
  me: () => api.get("/auth/me"),
  lookup: (email) => api.get("/auth/lookup", { params: { email } }),
  listUsers: () => api.get("/auth/users"),
  setUserActive: (id, is_active) => api.patch(`/auth/users/${id}/status`, { is_active }),
};

/* ─── FLEET ─── */
export const fleetAPI = {
  create: (d) => api.post("/fleet", d),                  // OWNER creates fleet
  getMyFleet: () => api.get("/fleet/me"),
  listMembers: () => api.get("/fleet/members"),
  assign: (d) => api.post("/fleet/assign", d),           // { email, role }
  addDriver: (d) => api.post("/fleet/drivers", d),          // { email, name, license_number, license_expiry }
  removeMember: (userId) => api.delete(`/fleet/members/${userId}`),
};

/* ─── VEHICLES ─── */
export const vehiclesAPI = {
  getAll: (params) => api.get("/vehicles", { params }),
  getOne: (id) => api.get(`/vehicles/${id}`),
  create: (data) => api.post("/vehicles", data),
  update: (id, data) => api.put(`/vehicles/${id}`, data),
  setStatus: (id, status) => api.patch(`/vehicles/${id}/status`, { status }),
  delete: (id) => api.delete(`/vehicles/${id}`),
};

/* ─── DRIVERS ─── */
export const driversAPI = {
  getAll: (params) => api.get("/drivers", { params }),
  getOne: (id) => api.get(`/drivers/${id}`),
  lookupByEmail: (email) => api.get("/drivers/lookup", { params: { email } }),
  create: (data) => api.post("/drivers", data),
  update: (id, data) => api.put(`/drivers/${id}`, data),
  setStatus: (id, status) => api.patch(`/drivers/${id}/status`, { status }),
  delete: (id) => api.delete(`/drivers/${id}`),
};

/* ─── TRIPS ─── */
export const tripsAPI = {
  getAll: (params) => api.get("/trips", { params }),
  getOne: (id) => api.get(`/trips/${id}`),
  create: (data) => api.post("/trips", data),
  dispatch: (id) => api.post(`/trips/${id}/dispatch`),
  complete: (id) => api.post(`/trips/${id}/complete`),
  cancel: (id) => api.post(`/trips/${id}/cancel`),
};

/* ─── MAINTENANCE ─── */
export const maintenanceAPI = {
  getAll: (params) => api.get("/maintenance", { params }),
  getOne: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post("/maintenance", data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  releaseVehicle: (vehicle_id) => api.post(`/maintenance/release/${vehicle_id}`),
};

/* ─── FUEL ─── */
export const fuelAPI = {
  getAll: (params) => api.get("/fuel", { params }),
  getOne: (id) => api.get(`/fuel/${id}`),
  create: (data) => api.post("/fuel", data),
  delete: (id) => api.delete(`/fuel/${id}`),
};

/* ─── ANALYTICS ─── */
export const analyticsAPI = {
  dashboard: () => api.get("/analytics/dashboard"),
  fuelSummary: () => api.get("/analytics/fuel-summary"),
  maintenanceSummary: () => api.get("/analytics/maintenance-summary"),
  tripStats: () => api.get("/analytics/trip-stats"),
  monthlyCosts: (year) => api.get("/analytics/monthly-costs", { params: { year } }),
};

export default api;