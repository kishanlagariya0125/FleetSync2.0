import { useEffect, useState } from "react";
import { tripsAPI, vehiclesAPI, driversAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
  DataTable,
  StatusBadge,
  Modal,
  Spinner,
  Field,
  PageHeader,
} from "../components/UI";

const EMPTY_FORM = {
  vehicle_id: "",
  driver_email: "",   // Manager enters email; we look up the driver profile
  driver_id: "",      // Resolved after email lookup
  driver_name: "",    // Display name after lookup
  origin: "",
  destination: "",
  cargo_weight: "",
};

export default function Trips() {
  const { can } = useAuth();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [looking, setLooking] = useState(false); // email lookup in progress
  const [err, setErr] = useState({});
  const [filter, setFilter] = useState("");

  /* ─── LOAD ─────────────────────────── */
  const load = () => {
    setLoading(true);
    const tripsFetch = tripsAPI.getAll(filter ? { status: filter } : {});
    const vehiclesFetch = can("MANAGER", "DISPATCHER")
      ? vehiclesAPI.getAll({ status: "AVAILABLE" })
      : Promise.resolve({ data: { data: [] } });

    Promise.all([tripsFetch, vehiclesFetch])
      .then(([t, v]) => {
        setRows(t.data.data ?? []);
        setVehicles(v.data.data ?? []);
      })
      .catch(() => toast.error("Failed to load trips. Please refresh."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  /* ─── INPUT ─────────────────────────── */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "driver_email") {
      // Clear previous lookup when email changes
      setForm((prev) => ({ ...prev, driver_email: value, driver_id: "", driver_name: "" }));
      setErr((prev) => ({ ...prev, driver_email: undefined }));
    }
  };

  const selVehicle = vehicles.find((v) => String(v.id) === String(form.vehicle_id));

  /* ─── DRIVER EMAIL LOOKUP ─────────────── */
  const lookupDriver = async () => {
    const email = form.driver_email.trim();
    if (!email) {
      setErr((prev) => ({ ...prev, driver_email: "Enter a driver email first" }));
      return;
    }
    setLooking(true);
    setErr((prev) => ({ ...prev, driver_email: undefined }));
    try {
      const res = await driversAPI.lookupByEmail(email);
      const driver = res.data.data;
      if (driver.license_expired) {
        setErr((prev) => ({ ...prev, driver_email: `⚠ Driver license expired (${new Date(driver.license_expiry).toLocaleDateString("en-IN")})` }));
        return;
      }
      if (driver.status !== "AVAILABLE") {
        setErr((prev) => ({ ...prev, driver_email: `Driver is currently ${driver.status} — not available for a new trip` }));
        return;
      }
      setForm((prev) => ({ ...prev, driver_id: driver.id, driver_name: driver.name }));
      toast.success(`✓ Driver found: ${driver.name}`);
    } catch (e) {
      const msg = e.response?.data?.message || "Driver lookup failed.";
      setErr((prev) => ({ ...prev, driver_email: msg }));
      setForm((prev) => ({ ...prev, driver_id: "", driver_name: "" }));
    } finally {
      setLooking(false);
    }
  };

  /* ─── VALIDATE ─────────────────────── */
  const validate = () => {
    const e = {};
    if (!form.vehicle_id) e.vehicle_id = "Select a vehicle";
    if (!form.driver_id) e.driver_email = "Look up a valid driver email first";
    if (!form.origin.trim()) e.origin = "Required";
    if (!form.destination.trim()) e.destination = "Required";
    if (!form.cargo_weight || parseInt(form.cargo_weight) <= 0)
      e.cargo_weight = "Must be a positive number";
    if (selVehicle && parseInt(form.cargo_weight) > selVehicle.capacity)
      e.cargo_weight = `Exceeds vehicle capacity (max ${selVehicle.capacity} kg)`;
    setErr(e);
    return !Object.keys(e).length;
  };

  /* ─── CREATE ─────────────────────── */
  const create = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await tripsAPI.create({
        vehicle_id: parseInt(form.vehicle_id),
        driver_id: parseInt(form.driver_id),
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        cargo_weight: parseInt(form.cargo_weight),
      });
      toast.success("Trip created successfully (DRAFT — dispatch to activate).");
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to create trip. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── DISPATCH ─────────────────────── */
  const dispatch = async (id) => {
    setSaving(true);
    try {
      await tripsAPI.dispatch(id);
      toast.success("Trip dispatched! Vehicle and driver are now ON_TRIP.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to dispatch trip.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── COMPLETE ─────────────────────── */
  const complete = async (id) => {
    setSaving(true);
    try {
      await tripsAPI.complete(id);
      toast.success("Trip marked as completed. Vehicle & driver are now AVAILABLE.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to complete trip.");
    } finally {
      setSaving(false);
    }
  };

  /* ─── CANCEL ─────────────────────── */
  const cancel = async (id) => {
    if (!confirm("Cancel this trip? This cannot be undone.")) return;
    try {
      await tripsAPI.cancel(id);
      toast.success("Trip cancelled. Vehicle & driver returned to AVAILABLE.");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to cancel trip.");
    }
  };

  /* ─── TABLE COLUMNS ─────────────────── */
  const columns = [
    {
      key: "id",
      label: "#",
      render: (v) => <span className="text-mono text-xs text-amber">#{v}</span>,
    },
    {
      key: "origin",
      label: "Route",
      render: (v, row) => (
        <div>
          <div className="text-sm text-light font-semibold">{v}</div>
          <div className="text-xs text-ghost">→ {row.destination}</div>
        </div>
      ),
    },
    {
      key: "vehicle_name",
      label: "Vehicle",
      render: (v, row) => (
        <div>
          <div className="text-sm text-light">{v || "—"}</div>
          <div className="text-mono text-xs text-dim">{row.plate_number}</div>
        </div>
      ),
    },
    {
      key: "driver_name",
      label: "Driver",
      render: (v) => <span className="text-sm text-light">{v || "—"}</span>,
    },
    {
      key: "cargo_weight",
      label: "Cargo",
      render: (v) => <span className="text-mono text-xs text-ghost">{v} kg</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: "actions",
      label: "Actions",
      render: (_, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          {/* MANAGER / DISPATCHER: full controls */}
          {can("MANAGER", "DISPATCHER") && (
            <>
              {row.status === "DRAFT" && (
                <button
                  className="btn-ghost text-xs text-sky"
                  disabled={saving}
                  onClick={() => dispatch(row.id)}
                >
                  Dispatch
                </button>
              )}
              {row.status === "DISPATCHED" && (
                <button
                  className="btn-ghost text-xs text-jade"
                  disabled={saving}
                  onClick={() => complete(row.id)}
                >
                  Complete
                </button>
              )}
              {["DRAFT", "DISPATCHED"].includes(row.status) && (
                <button
                  className="btn-ghost text-xs text-rose/70 hover:text-rose"
                  onClick={() => cancel(row.id)}
                >
                  Cancel
                </button>
              )}
            </>
          )}
          {/* DRIVER: can only complete their own dispatched trip */}
          {can("DRIVER") && row.status === "DISPATCHED" && (
            <button
              className="btn-ghost text-xs text-jade"
              disabled={saving}
              onClick={() => complete(row.id)}
            >
              Complete
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 animate-fade-up">
      <PageHeader
        title="Trip Dispatcher"
        sub={`${rows.filter((r) => r.status === "DISPATCHED").length} active · ${rows.length} total`}
      >
        <select
          className="field-select text-xs py-2 w-36"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">All Status</option>
          {["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>

        {can("MANAGER", "DISPATCHER") && (
          <button
            className="btn-primary"
            onClick={() => {
              setForm(EMPTY_FORM);
              setErr({});
              setModal("create");
            }}
          >
            <Plus /> New Trip
          </button>
        )}
      </PageHeader>

      <div className="card overflow-hidden">
        <DataTable
          columns={columns}
          data={rows}
          loading={loading}
          empty="No trips found."
        />
      </div>

      {/* ─── CREATE TRIP MODAL ─────────────────────── */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Create New Trip"
        width="max-w-2xl"
      >
        <div className="space-y-5">

          {/* Vehicle select */}
          <Field label="Vehicle" required error={err.vehicle_id}>
            <select
              name="vehicle_id"
              value={form.vehicle_id}
              onChange={handleChange}
              className={`field-select ${err.vehicle_id ? "border-rose/50" : ""}`}
            >
              <option value="">Select available vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} — {v.plate_number} (max {v.capacity} kg)
                </option>
              ))}
            </select>
          </Field>

          {/* Driver email lookup */}
          <Field label="Driver (by registered email)" required error={err.driver_email}>
            <div className="flex gap-2">
              <input
                name="driver_email"
                type="email"
                placeholder="driver@company.com"
                value={form.driver_email}
                onChange={handleChange}
                className={`field-input flex-1 ${err.driver_email ? "border-rose/50" : ""}`}
                onKeyDown={(e) => e.key === "Enter" && lookupDriver()}
              />
              <button
                type="button"
                onClick={lookupDriver}
                disabled={looking}
                className="btn-outline text-xs px-4 flex-shrink-0"
              >
                {looking ? <Spinner size="sm" /> : "Lookup"}
              </button>
            </div>
            {form.driver_id && (
              <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-jade/10 border border-jade/25">
                <span className="dot bg-jade animate-blink" />
                <span className="text-xs text-jade font-semibold">{form.driver_name} — Available ✓</span>
              </div>
            )}
          </Field>

          {/* Route */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Origin" required error={err.origin}>
              <input
                name="origin"
                value={form.origin}
                onChange={handleChange}
                placeholder="Departure city/location"
                className={`field-input ${err.origin ? "border-rose/50" : ""}`}
              />
            </Field>
            <Field label="Destination" required error={err.destination}>
              <input
                name="destination"
                value={form.destination}
                onChange={handleChange}
                placeholder="Arrival city/location"
                className={`field-input ${err.destination ? "border-rose/50" : ""}`}
              />
            </Field>
          </div>

          {/* Cargo weight */}
          <Field label="Cargo Weight (kg)" required error={err.cargo_weight}>
            <input
              name="cargo_weight"
              type="number"
              min="1"
              value={form.cargo_weight}
              onChange={handleChange}
              className={`field-input ${err.cargo_weight ? "border-rose/50" : ""}`}
            />
            {selVehicle && !err.cargo_weight && (
              <p className="text-xs text-ghost mt-1">Vehicle capacity: {selVehicle.capacity} kg</p>
            )}
          </Field>
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-plate">
          <button className="btn-outline" onClick={() => setModal(null)}>Cancel</button>
          <button className="btn-primary" onClick={create} disabled={saving}>
            {saving && <Spinner size="sm" />} Create Trip
          </button>
        </div>
      </Modal>
    </div>
  );
}

const Plus = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);