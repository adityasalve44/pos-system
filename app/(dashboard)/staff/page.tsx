"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Plus,
  Pencil,
  Key,
  ShieldCheck,
  Shield,
  User,
  UserX,
  UserCheck,
  X,
  ChevronRight,
  Search,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types";

// ─── Domain types ─────────────────────────────────────────────────────────────

interface StaffMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: number;
  createdAt: string;
}

type ModalMode = "create" | "edit" | "reset_pw" | null;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROLE_META: Record<
  UserRole,
  {
    label: string;
    Icon: React.ElementType;
    badge: string;
    pill: string;
    ring: string;
    desc: string;
  }
> = {
  admin: {
    label: "Admin",
    Icon: ShieldCheck,
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    pill: "bg-rose-100 text-rose-700",
    ring: "ring-rose-300",
    desc: "Full system access",
  },
  manager: {
    label: "Manager",
    Icon: Shield,
    badge: "bg-blue-50 text-blue-700 ring-blue-200",
    pill: "bg-blue-100 text-blue-700",
    ring: "ring-blue-300",
    desc: "Tables, orders & reports",
  },
  staff: {
    label: "Staff",
    Icon: User,
    badge: "bg-gray-50 text-gray-600 ring-gray-200",
    pill: "bg-gray-100 text-gray-600",
    ring: "ring-gray-300",
    desc: "Create & manage orders",
  },
};

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "staff" as "manager" | "staff",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Avatar({
  name,
  role,
  size = "md",
}: {
  name: string;
  role: UserRole;
  size?: "sm" | "md" | "lg";
}) {
  const { ring } = ROLE_META[role];
  const sizeClass = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
  }[size];
  return (
    <span
      className={`${sizeClass} rounded-full ring-2 ${ring} bg-white flex items-center justify-center font-semibold text-gray-700 shrink-0`}
    >
      {initials(name)}
    </span>
  );
}

function RolePill({ role }: { role: UserRole }) {
  const { label, pill } = ROLE_META[role];
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${pill}`}
    >
      {label}
    </span>
  );
}

function InputField({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoFocus,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                   text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2
                   focus:ring-blue-500 focus:border-transparent transition-shadow"
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function StaffPage() {
  const qc = useQueryClient();
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [modal, setModal] = useState<ModalMode>(null);
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pw, setPw] = useState({ password: "", confirm: "" });
  const [pwErr, setPwErr] = useState("");
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [apiErr, setApiErr] = useState("");

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: staff = [], isLoading } = useQuery<StaffMember[]>({
    queryKey: ["staff"],
    queryFn: () =>
      fetch("/api/staff")
        .then((r) => r.json())
        .then((r: { data: StaffMember[] }) => r.data),
  });

  // ── Toast helper ──────────────────────────────────────────────────────────
  function flash(msg: string, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  }

  function closeModal() {
    setModal(null);
    setSelected(null);
    setForm(EMPTY_FORM);
    setPw({ password: "", confirm: "" });
    setPwErr("");
    setApiErr("");
  }

  // ── Mutations ─────────────────────────────────────────────────────────────
  async function apiCall(
    url: string,
    method: string,
    body?: object,
  ): Promise<{ ok: boolean; data?: StaffMember; error?: string }> {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const json: { data?: StaffMember; error?: string } = await res.json();
    return { ok: res.ok, ...json };
  }

  const createMutation = useMutation({
    mutationFn: () => apiCall("/api/staff", "POST", form),
    onSuccess: (r) => {
      if (!r.ok) {
        setApiErr(r.error ?? "Failed");
        return;
      }
      qc.invalidateQueries({ queryKey: ["staff"] });
      flash(`${form.name} added successfully`);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: object) =>
      apiCall(`/api/staff/${selected!.id}`, "PUT", payload),
    onSuccess: (r) => {
      if (!r.ok) {
        setApiErr(r.error ?? "Failed");
        return;
      }
      qc.invalidateQueries({ queryKey: ["staff"] });
      flash("Saved successfully");
      closeModal();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: number }) =>
      apiCall(`/api/staff/${id}`, "PUT", { isActive }),
    onSuccess: (r, vars) => {
      if (!r.ok) {
        flash(r.error ?? "Failed", false);
        return;
      }
      qc.invalidateQueries({ queryKey: ["staff"] });
      flash(vars.isActive === 1 ? "Account activated" : "Account deactivated");
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setModal("create");
  }

  function openEdit(s: StaffMember) {
    setSelected(s);
    setForm({
      name: s.name,
      email: s.email,
      password: "",
      role: s.role as "manager" | "staff",
    });
    setModal("edit");
  }

  function openResetPw(s: StaffMember) {
    setSelected(s);
    setPw({ password: "", confirm: "" });
    setModal("reset_pw");
  }

  function handleCreate() {
    if (!form.name.trim() || !form.email.trim() || !form.password) return;
    setApiErr("");
    createMutation.mutate();
  }

  function handleEdit() {
    if (!form.name.trim() || !form.email.trim()) return;
    setApiErr("");
    updateMutation.mutate({
      name: form.name,
      email: form.email,
      role: form.role,
    });
  }

  function handleResetPw() {
    if (pw.password.length < 6) {
      setPwErr("Must be at least 6 characters");
      return;
    }
    if (pw.password !== pw.confirm) {
      setPwErr("Passwords do not match");
      return;
    }
    setPwErr("");
    updateMutation.mutate({ password: pw.password });
  }

  // ── Derived data ──────────────────────────────────────────────────────────
  const filtered = search.trim()
    ? staff.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase()),
      )
    : staff;

  const grouped: Record<"admin" | "manager" | "staff", StaffMember[]> = {
    admin: filtered.filter((s) => s.role === "admin"),
    manager: filtered.filter((s) => s.role === "manager"),
    staff: filtered.filter((s) => s.role === "staff"),
  };

  const activeCount = staff.filter((s) => s.isActive).length;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-70 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium transition-all
          ${toast.ok ? "bg-gray-900 text-white" : "bg-red-600 text-white"}`}
        >
          {toast.ok ? "✓" : "✗"} {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b px-4 md:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Staff</h1>
              <p className="text-sm text-gray-400 mt-0.5">
                {activeCount} active · {staff.length} total members
              </p>
            </div>
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm active:scale-95 transition-all shrink-0"
            >
              <Plus size={16} /> Add Member
            </button>
          </div>

          {/* Search */}
          <div className="relative mt-4">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* ── Stats bar ─────────────────────────────────────────────────────── */}
      <div className="border-b bg-white">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-3 flex gap-6">
          {(["admin", "manager", "staff"] as const).map((role) => {
            const meta = ROLE_META[role];
            const count = staff.filter((s) => s.role === role).length;
            return (
              <div key={role} className="flex items-center gap-2">
                <meta.Icon size={14} className="text-gray-400" />
                <span className="text-sm text-gray-500">{meta.label}s:</span>
                <span className="text-sm font-semibold text-gray-800">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Staff lists ────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl h-20 animate-pulse border"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Users size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-400 font-medium">
              {search ? "No results found" : "No staff members yet"}
            </p>
          </div>
        ) : (
          (["admin", "manager", "staff"] as const).map((role) => {
            const members = grouped[role];
            if (!members.length) return null;
            const meta = ROLE_META[role];
            return (
              <section key={role}>
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${meta.badge}`}
                  >
                    <meta.Icon size={11} /> {meta.label}s
                  </span>
                  <span className="text-xs text-gray-400">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="bg-white rounded-2xl border overflow-hidden divide-y divide-gray-50">
                  {members.map((member) => {
                    const isSelf = member.id === currentUserId;
                    const isAdmin = member.role === "admin";
                    const inactive = !member.isActive;
                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-gray-50/60 ${inactive ? "opacity-60" : ""}`}
                      >
                        <Avatar name={member.name} role={member.role} />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 text-sm leading-tight">
                              {member.name}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-semibold">
                                You
                              </span>
                            )}
                            {inactive && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-semibold">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {member.email}
                          </p>
                          <p className="text-[11px] text-gray-300 mt-0.5">
                            Added {formatDate(member.createdAt)}
                          </p>
                        </div>

                        {/* Permission indicator */}
                        <div className="hidden sm:block text-xs text-gray-300 text-right mr-2">
                          <p>{meta.desc}</p>
                        </div>

                        {/* Actions — protected accounts get a lock icon */}
                        {isAdmin ? (
                          <div className="flex items-center gap-1 text-gray-300 px-2">
                            <ShieldCheck size={14} />
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5">
                            <ActionBtn
                              icon={<Pencil size={14} />}
                              label="Edit"
                              onClick={() => openEdit(member)}
                              hoverClass="hover:text-blue-600 hover:bg-blue-50"
                            />
                            <ActionBtn
                              icon={<Key size={14} />}
                              label="Reset password"
                              onClick={() => openResetPw(member)}
                              hoverClass="hover:text-violet-600 hover:bg-violet-50"
                            />
                            {!isSelf && (
                              <ActionBtn
                                icon={
                                  member.isActive ? (
                                    <UserX size={14} />
                                  ) : (
                                    <UserCheck size={14} />
                                  )
                                }
                                label={
                                  member.isActive ? "Deactivate" : "Activate"
                                }
                                onClick={() =>
                                  toggleMutation.mutate({
                                    id: member.id,
                                    isActive: member.isActive ? 0 : 1,
                                  })
                                }
                                hoverClass={
                                  member.isActive
                                    ? "hover:text-red-500 hover:bg-red-50"
                                    : "hover:text-green-600 hover:bg-green-50"
                                }
                              />
                            )}
                            <button
                              onClick={() => openEdit(member)}
                              className="sm:hidden p-2 rounded-lg text-gray-300"
                            >
                              <ChevronRight size={15} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* ── Create / Edit modal ────────────────────────────────────────────── */}
      {(modal === "create" || modal === "edit") && (
        <Modal
          title={
            modal === "create"
              ? "Add Staff Member"
              : `Edit ${selected?.name ?? ""}`
          }
          onClose={closeModal}
        >
          <div className="space-y-4">
            <InputField
              label="Full Name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Jane Doe"
              autoFocus
            />
            <InputField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="jane@restaurant.com"
            />
            {modal === "create" && (
              <InputField
                label="Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="Min 6 characters"
              />
            )}

            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["manager", "staff"] as const).map((r) => {
                  const meta = ROLE_META[r];
                  const active = form.role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setForm((f) => ({ ...f, role: r }))}
                      className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all
                        ${
                          active
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-100 hover:border-gray-200 bg-gray-50"
                        }`}
                    >
                      <meta.Icon
                        size={18}
                        className={active ? "text-blue-600" : "text-gray-400"}
                      />
                      <div>
                        <p
                          className={`text-sm font-semibold leading-tight ${active ? "text-blue-700" : "text-gray-700"}`}
                        >
                          {meta.label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {meta.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {apiErr && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                {apiErr}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={modal === "create" ? handleCreate : handleEdit}
                disabled={
                  !form.name.trim() ||
                  !form.email.trim() ||
                  (modal === "create" && !form.password) ||
                  createMutation.isPending ||
                  updateMutation.isPending
                }
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving…"
                  : modal === "create"
                    ? "Create Member"
                    : "Save Changes"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Reset password modal ────────────────────────────────────────────── */}
      {modal === "reset_pw" && selected && (
        <Modal title="Reset Password" onClose={closeModal}>
          <div className="flex items-center gap-3 mb-5 pb-4 border-b">
            <Avatar name={selected.name} role={selected.role} size="sm" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">
                {selected.name}
              </p>
              <p className="text-xs text-gray-400">{selected.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <InputField
              label="New Password"
              type="password"
              value={pw.password}
              onChange={(v) => setPw((p) => ({ ...p, password: v }))}
              placeholder="Min 6 characters"
              autoFocus
            />
            <InputField
              label="Confirm Password"
              type="password"
              value={pw.confirm}
              onChange={(v) => setPw((p) => ({ ...p, confirm: v }))}
              placeholder="Repeat password"
            />
            {pwErr && <p className="text-sm text-red-600">{pwErr}</p>}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResetPw}
              disabled={!pw.password || !pw.confirm || updateMutation.isPending}
              className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl font-semibold text-sm hover:bg-violet-700 disabled:opacity-40 transition-colors"
            >
              {updateMutation.isPending ? "Saving…" : "Reset Password"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Reusable action button ────────────────────────────────────────────────────

function ActionBtn({
  icon,
  label,
  onClick,
  hoverClass,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  hoverClass: string;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`p-2 rounded-xl text-gray-300 transition-colors hidden sm:flex items-center justify-center ${hoverClass}`}
    >
      {icon}
    </button>
  );
}

// ─── Modal wrapper ────────────────────────────────────────────────────────────

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-end sm:items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal body */}
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
