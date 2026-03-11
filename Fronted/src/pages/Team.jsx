import { useEffect, useState } from "react";
import { fleetAPI } from "../services/api";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import {
    DataTable,
    Modal,
    Spinner,
    PageHeader,
    Field,
    ConfirmModal,
    StatusBadge,
} from "../components/UI";

const EMPTY_DRIVER = { email: "", name: "", license_number: "", license_expiry: "" };
const EMPTY_ASSIGN = { email: "", role: "MANAGER" };

export default function Team() {
    const { user, can } = useAuth();
    const toast = useToast();

    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modals state
    const [driverModal, setDriverModal] = useState(false);
    const [assignModal, setAssignModal] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(null); // user obj to remove

    const [dForm, setDForm] = useState(EMPTY_DRIVER);
    const [aForm, setAForm] = useState(EMPTY_ASSIGN);

    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState({});

    const load = () => {
        setLoading(true);
        fleetAPI.listMembers()
            .then((r) => setMembers(r.data.data))
            .catch((e) => toast.error(e.response?.data?.message || "Failed to load team"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    // Drivers form mapping
    const dChange = (e) => setDForm(p => ({ ...p, [e.target.name]: e.target.value }));
    const aChange = (e) => setAForm(p => ({ ...p, [e.target.name]: e.target.value }));

    // Add Driver
    const saveDriver = () => {
        const e = {};
        if (!dForm.email.trim()) e.email = "Required";
        if (!dForm.name.trim()) e.name = "Required";
        if (!dForm.license_number.trim()) e.license_number = "Required";
        if (!dForm.license_expiry.trim()) e.license_expiry = "Required";
        setErr(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        fleetAPI.addDriver(dForm)
            .then(() => {
                toast.success("Driver added successfully");
                setDriverModal(false);
                setDForm(EMPTY_DRIVER);
                load();
            })
            .catch((err) => toast.error(err.response?.data?.message || "Failed to add driver"))
            .finally(() => setSaving(false));
    };

    // Assign Role
    const saveAssign = () => {
        const e = {};
        if (!aForm.email.trim()) e.email = "Required";
        setErr(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        fleetAPI.assign(aForm)
            .then(() => {
                toast.success("Role assigned successfully");
                setAssignModal(false);
                setAForm(EMPTY_ASSIGN);
                load();
            })
            .catch((err) => toast.error(err.response?.data?.message || "Failed to assign role"))
            .finally(() => setSaving(false));
    };

    // Remove Member
    const removeUser = () => {
        if (!confirmRemove) return;
        setSaving(true);
        fleetAPI.removeMember(confirmRemove.id)
            .then(() => {
                toast.success("Member removed");
                load();
            })
            .catch((e) => toast.error(e.response?.data?.message || "Failed to remove"))
            .finally(() => {
                setSaving(false);
                setConfirmRemove(null);
            });
    };

    const cols = [
        { key: "name", label: "Name", render: (val) => <span className="font-semibold text-c-light">{val}</span> },
        { key: "email", label: "Email", render: (val) => <span className="text-c-ghost">{val}</span> },
        {
            key: "role", label: "Role", render: (val) => (
                <span className="px-2 py-0.5 rounded uppercase text-xs font-mono font-bold"
                    style={{
                        background: val === 'OWNER' ? 'rgba(220,38,38,0.15)' :
                            (val === 'MANAGER' ? 'rgba(245,158,11,0.15)' :
                                (val === 'DISPATCHER' ? 'rgba(56,189,248,0.15)' :
                                    (val === 'FINANCE' ? 'rgba(139,92,246,0.15)' : 'rgba(16,185,129,0.15)'))),
                        color: val === 'OWNER' ? '#EF4444' :
                            (val === 'MANAGER' ? '#F59E0B' :
                                (val === 'DISPATCHER' ? '#38BDF8' :
                                    (val === 'FINANCE' ? '#A78BFA' : '#34D399'))),
                    }}
                >
                    {val}
                </span>
            )
        },
        { key: "is_active", label: "Status", render: (val) => <StatusBadge status={val ? "AVAILABLE" : "SUSPENDED"} /> },
    ];

    const canEdit = can("OWNER");

    if (canEdit) {
        cols.push({
            key: "actions",
            label: "Actions",
            render: (_, r) => (
                r.id !== user.id ? (
                    <button
                        className="btn-ghost text-xs text-rose/70 hover:text-rose"
                        onClick={() => setConfirmRemove(r)}
                    >
                        Remove
                    </button>
                ) : null
            )
        });
    }

    return (
        <div className="space-y-6 animate-fade-up">
            <PageHeader
                title="Team & Roles"
                sub="Manage fleet personnel and permissions"
            >
                {canEdit && (
                    <button onClick={() => { setAForm(EMPTY_ASSIGN); setErr({}); setAssignModal(true); }} className="btn-outline">
                        Assign Role
                    </button>
                )}
                <button onClick={() => { setDForm(EMPTY_DRIVER); setErr({}); setDriverModal(true); }} className="btn-primary">
                    <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Driver
                </button>
            </PageHeader>

            <div className="card">
                {loading ? (
                    <div className="py-20 flex justify-center"><Spinner size="lg" /></div>
                ) : (
                    <DataTable data={members} columns={cols} empty="No members found in this fleet." />
                )}
            </div>

            {/* ── Assign Role Modal ── */}
            <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Fleet Role" width="max-w-md">
                <div className="space-y-4 pt-4">
                    <p className="text-sm text-c-ghost">Assign an existing user to a role setting. If the user is currently in another fleet, this will fail.</p>
                    <Field label="User Email" error={err.email}>
                        <input name="email" value={aForm.email} onChange={aChange} placeholder="user@company.com" className={`field-input ${err.email ? "border-rose/50" : ""}`} />
                    </Field>
                    <Field label="Select Role" error={err.role}>
                        <select name="role" value={aForm.role} onChange={aChange} className={`field-select ${err.role ? "border-rose/50" : ""}`}>
                            <option value="MANAGER">Manager</option>
                            <option value="DISPATCHER">Dispatcher</option>
                            <option value="FINANCE">Finance</option>
                        </select>
                    </Field>
                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-plate">
                        <button onClick={() => setAssignModal(false)} className="btn-outline">Cancel</button>
                        <button onClick={saveAssign} disabled={saving} className="btn-primary">
                            {saving && <Spinner size="sm" />}
                            Assign Role
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Add Driver Modal ── */}
            <Modal open={driverModal} onClose={() => setDriverModal(false)} title="Add Driver" width="max-w-md">
                <div className="space-y-4 pt-4">
                    <p className="text-sm text-c-ghost">Provide the email of an existing user or assign a new driver account. The driver profile will be created automatically.</p>

                    <Field label="Driver Email" error={err.email}>
                        <input name="email" value={dForm.email} onChange={dChange} placeholder="driver@company.com" className={`field-input ${err.email ? "border-rose/50" : ""}`} />
                    </Field>
                    <Field label="Full Name" error={err.name}>
                        <input name="name" value={dForm.name} onChange={dChange} placeholder="John Doe" className={`field-input ${err.name ? "border-rose/50" : ""}`} />
                    </Field>
                    <Field label="License Number" error={err.license_number}>
                        <input name="license_number" value={dForm.license_number} onChange={dChange} placeholder="DL-XXXX-XXXX" className={`field-input ${err.license_number ? "border-rose/50" : ""}`} />
                    </Field>
                    <Field label="License Expiry" error={err.license_expiry}>
                        <input type="date" name="license_expiry" value={dForm.license_expiry} onChange={dChange} className={`field-input ${err.license_expiry ? "border-rose/50" : ""}`} />
                    </Field>

                    <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-plate">
                        <button onClick={() => setDriverModal(false)} className="btn-outline">Cancel</button>
                        <button onClick={saveDriver} disabled={saving} className="btn-primary">
                            {saving && <Spinner size="sm" />}
                            Add Driver
                        </button>
                    </div>
                </div>
            </Modal>

            {/* ── Confirm Remove Modal ── */}
            <ConfirmModal
                open={!!confirmRemove}
                onClose={() => !saving && setConfirmRemove(null)}
                onConfirm={removeUser}
                title="Remove Member"
                msg={`Are you sure you want to remove ${confirmRemove?.name} from your fleet?`}
                loading={saving}
            />
        </div>
    );
}
