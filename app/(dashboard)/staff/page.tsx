"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { formatDateTime } from "@/lib/utils/format";
import {
  Plus,
  Pencil,
  UserX,
  UserCheck,
  Key,
  X,
  ShieldCheck,
  Shield,
  User,
  Users2,
} from "lucide-react";

type StaffMember = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "staff";
  isActive: number;
  createdAt: string;
};

const ROLE_META = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    color: "bg-red-100 text-red-700",
    border: "border-red-200",
  },
  manager: {
    label: "Manager",
    icon: Shield,
    color: "bg-blue-100 text-blue-700",
    border: "border-blue-200",
  },
  staff: {
    label: "Staff",
    icon: User,
    color: "bg-gray-100 text-gray-700",
    border: "border-gray-200",
  },
};

type FormMode = "create" | "edit" | "reset_password" | null;

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "staff" as "manager" | "staff",
};

export default function StaffPage() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [mode, setMode] = useState<FormMode>(null);
  const [target, setTarget] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pwForm, setPwForm] = useState({ password: "", confirm: "" });
  const [pwError, setPwError] = useState("");
  const [toast, setToast] = useState("");

  // ── Data ──────────────────────────────────────────────────────────────────
  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: async () => {
      const res = await fetch("/api/staff");
      return (await res.json()).data;
    },
  });

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  }
  function closeModal() {
    setMode(null);
    setTarget(null);
    setForm(EMPTY_FORM);
    setPwForm({ password: "", confirm: "" });
    setPwError("");
  }

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createStaff = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        return j.data;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
      showToast("Staff member created");
    },
    onError: (e: Error) => showToast(e.message),
  });

  const updateStaff = useMutation({
    mutationFn: ({ id, ...data }: Partial<StaffMember> & { id: string }) =>
      fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        return j.data;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      closeModal();
      showToast("Updated");
    },
    onError: (e: Error) => showToast(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: number }) =>
      fetch(`/api/staff/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      }).then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.error);
        return j.data;
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff"] });
      showToast("Status updated");
    },
    onError: (e: Error) => showToast(e.message),
  });

  // ── Helpers ──────────────────────────────────────────────────────────────
  function openCreate() {
    setMode("create");
    setTarget(null);
    setForm(EMPTY_FORM);
  }
  function openEdit(s: StaffMember) {
    setMode("edit");
    setTarget(s);
    setForm({
      name: s.name,
      email: s.email,
      password: "",
      role: s.role as "manager" | "staff",
    });
  }
  function openResetPw(s: StaffMember) {
    setMode("reset_password");
    setTarget(s);
    setPwForm({ password: "", confirm: "" });
  }

  async function handleCreate() {
    if (!form.name || !form.email || !form.password) return;
    await createStaff.mutateAsync(form);
  }

  async function handleEdit() {
    if (!target) return;
    const update: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      role: form.role,
    };
    await updateStaff.mutateAsync({ id: target.id, ...update });
  }

  async function handleResetPw() {
    if (!target) return;
    if (pwForm.password.length < 6) {
      setPwError("Password must be at least 6 characters");
      return;
    }
    if (pwForm.password !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    await updateStaff.mutateAsync({
      id: target.id,
      password: pwForm.password,
    } as any);
    showToast("Password updated");
    closeModal();
  }

  const admins = staff.filter((s) => s.role === "admin");
  const managers = staff.filter((s) => s.role === "manager");
  const staffers = staff.filter((s) => s.role === "staff");

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-60 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg animate-in slide-in-from-top-2">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users2 size={22} className="text-blue-600" /> Staff Management
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {staff.filter((s) => s.isActive).length} active · {staff.length}{" "}
            total
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 active:scale-95"
        >
          <Plus size={16} /> Add Member
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {[
            { label: "Administrators", members: admins },
            { label: "Managers", members: managers },
            { label: "Staff", members: staffers },
          ].map(({ label, members }) =>
            members.length === 0 ? null : (
              <div key={label}>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  {label}
                </h2>
                <div className="bg-white rounded-xl border divide-y">
                  {members.map((member) => {
                    const meta = ROLE_META[member.role];
                    const isSelf = member.id === currentUserId;
                    const isAdmin = member.role === "admin";
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 p-4 ${!member.isActive ? "opacity-50" : ""}`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-9 h-9 rounded-full border-2 ${meta.border} flex items-center justify-center shrink-0`}
                        >
                          <meta.icon
                            size={16}
                            className={meta.color.split(" ")[1]}
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">
                                You
                              </span>
                            )}
                            {!member.isActive && (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                                Inactive
                              </span>
                            )}
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${meta.color}`}
                            >
                              {meta.label}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {member.email}
                          </div>
                          <div className="text-xs text-gray-300">
                            Added {formatDateTime(member.createdAt)}
                          </div>
                        </div>

                        {/* Actions — cannot edit admin, cannot self-deactivate */}
                        {!isAdmin && (
                          <div className="flex gap-1 shrink-0">
                            <button
                              onClick={() => openEdit(member)}
                              title="Edit"
                              className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => openResetPw(member)}
                              title="Reset password"
                              className="p-2 rounded-lg text-gray-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            >
                              <Key size={14} />
                            </button>
                            {!isSelf && (
                              <button
                                onClick={() =>
                                  toggleActive.mutate({
                                    id: member.id,
                                    isActive: member.isActive ? 0 : 1,
                                  })
                                }
                                title={
                                  member.isActive ? "Deactivate" : "Activate"
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  member.isActive
                                    ? "text-gray-400 hover:text-red-500 hover:bg-red-50"
                                    : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                                }`}
                              >
                                {member.isActive ? (
                                  <UserX size={14} />
                                ) : (
                                  <UserCheck size={14} />
                                )}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {/* ── Create / Edit modal ── */}
      {(mode === "create" || mode === "edit") && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">
                {mode === "create" ? "Add Staff Member" : "Edit Member"}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  autoFocus
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jane@restaurant.com"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {mode === "create" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["manager", "staff"] as const).map((r) => {
                    const m = ROLE_META[r];
                    return (
                      <button
                        key={r}
                        onClick={() => setForm({ ...form, role: r })}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-colors ${
                          form.role === r
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <m.icon size={16} className={m.color.split(" ")[1]} />
                        <div>
                          <div className="text-sm font-medium">{m.label}</div>
                          <div className="text-xs text-gray-400">
                            {r === "manager"
                              ? "Tables + Reports"
                              : "Orders only"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {createStaff.error && (
              <p className="text-red-500 text-xs mb-3">
                {(createStaff.error as Error).message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border rounded-xl text-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={mode === "create" ? handleCreate : handleEdit}
                disabled={
                  !form.name ||
                  !form.email ||
                  (mode === "create" && !form.password) ||
                  createStaff.isPending ||
                  updateStaff.isPending
                }
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                {mode === "create" ? "Create" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset password modal ── */}
      {mode === "reset_password" && target && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Reset Password</h2>
              <button
                onClick={closeModal}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-400"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Setting new password for{" "}
              <span className="font-semibold text-gray-800">{target.name}</span>
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  autoFocus
                  type="password"
                  value={pwForm.password}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, password: e.target.value })
                  }
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={pwForm.confirm}
                  onChange={(e) =>
                    setPwForm({ ...pwForm, confirm: e.target.value })
                  }
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {pwError && <p className="text-red-500 text-xs">{pwError}</p>}
            </div>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border rounded-xl text-gray-700 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPw}
                disabled={updateStaff.isPending}
                className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
