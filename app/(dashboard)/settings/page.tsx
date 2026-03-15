"use client";
import { useState, useEffect, useRef } from "react";
import { useSettings, useUpdateSettings } from "@/lib/hooks/useProducts";
import {
  useTables,
} from "@/lib/hooks/useTables";
import {
  Save,
  Store,
  Receipt,
  Info,
  LayoutGrid,
  Users,
  Check,
  Loader2,
  ChevronRight,
} from "lucide-react";
import type { GstType } from "@/types";
import { useRouter } from "next/navigation";

type Panel = "restaurant" | "tax" | "tables";

export default function SettingsPage() {
  const [panel, setPanel] = useState<Panel>("restaurant");

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-5">
        Settings
      </h1>

      {/* Panel selector */}
      <div className="flex bg-gray-100 rounded-xl p-1 w-fit mb-6 gap-1">
        {(
          [
            { id: "restaurant", label: "Restaurant", icon: Store },
            { id: "tax", label: "Tax", icon: Receipt },
            { id: "tables", label: "Tables", icon: LayoutGrid },
          ] as { id: Panel; label: string; icon: React.ElementType }[]
        ).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPanel(id)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${panel === id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {panel === "restaurant" && <RestaurantPanel />}
      {panel === "tax" && <TaxPanel />}
      {panel === "tables" && <TablesPanel />}
    </div>
  );
}

/* ── Restaurant info panel ───────────────────────────────────────────── */
function RestaurantPanel() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const initialized = useRef(false);

  useEffect(() => {
    setForm(current => {
      if (settings && !initialized.current) {
        initialized.current = true;
        return {
          name: settings.name ?? "",
          address: settings.address ?? "",
          phone: settings.phone ?? "",
        };
      }
      return current;
    });
  }, [settings]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  if (isLoading) return <Spinner />;

  async function save() {
    await update.mutateAsync(form);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <SectionTitle
          icon={<Store size={15} className="text-sky-500" />}
          title="Restaurant Info"
        />
        <Field label="Restaurant Name">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input"
            placeholder="e.g. Demo Biryani House"
          />
        </Field>
        <Field label="Address">
          <input
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="input"
            placeholder="Full address"
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="input"
            placeholder="+91 98765 43210"
          />
        </Field>
      </div>
      <SaveBtn saving={update.isPending} saved={saved} onClick={save} />
    </div>
  );
}

/* ── Tax panel ───────────────────────────────────────────────────────── */
function TaxPanel() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    gstEnabled: 1 as 0 | 1,
    gstType: "GST" as GstType,
    gstNumber: "",
    taxRate: "5.00",
  });
  const initialized = useRef(false);

  useEffect(() => {
    setForm(current => {
      if (settings && !initialized.current) {
        initialized.current = true;
        return {
          gstEnabled: settings.gstEnabled as 0 | 1,
          gstType: settings.gstType as GstType,
          gstNumber: settings.gstNumber ?? "",
          taxRate: settings.taxRate ?? "5.00",
        };
      }
      return current;
    });
  }, [settings]);

  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 2500);
    return () => clearTimeout(t);
  }, [saved]);

  if (isLoading) return <Spinner />;
  async function save() {
    await update.mutateAsync(form);
    setSaved(true);
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border p-5 space-y-4">
        <SectionTitle
          icon={<Receipt size={15} className="text-green-500" />}
          title="GST / Tax Settings"
        />

        <div className="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl">
          <div>
            <div className="font-medium text-gray-900 text-sm">Enable GST</div>
            <div className="text-xs text-gray-500">Apply tax to all orders</div>
          </div>
          <button
            onClick={() =>
              setForm({ ...form, gstEnabled: form.gstEnabled ? 0 : 1 })
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.gstEnabled ? "bg-green-500" : "bg-gray-300"}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.gstEnabled ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
        </div>

        {form.gstEnabled ? (
          <div className="space-y-4">
            <Field label="GST Type">
              <div className="grid grid-cols-3 gap-2">
                {(["GST", "CGST_SGST", "IGST"] as GstType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setForm({ ...form, gstType: t })}
                    className={`py-2 rounded-xl text-xs font-medium border-2 transition-colors ${form.gstType === t ? "border-sky-500 bg-sky-50 text-sky-700" : "border-gray-200 text-gray-600"}`}
                  >
                    {t === "CGST_SGST" ? "CGST+SGST" : t}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 flex gap-1.5">
                <Info size={12} className="shrink-0 mt-0.5" />
                {form.gstType === "GST" &&
                  "Single GST for intra-state supplies (composition scheme)"}
                {form.gstType === "CGST_SGST" &&
                  "Split equally into Central (CGST) and State (SGST) for intra-state"}
                {form.gstType === "IGST" &&
                  "Integrated GST for inter-state supplies"}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GSTIN">
                <input
                  value={form.gstNumber}
                  onChange={(e) =>
                    setForm({ ...form, gstNumber: e.target.value })
                  }
                  className="input font-mono text-xs tracking-wider"
                  placeholder="27AABCU9603R1ZX"
                  maxLength={15}
                />
              </Field>
              <Field label="Tax Rate (%)">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={form.taxRate}
                  onChange={(e) =>
                    setForm({ ...form, taxRate: e.target.value })
                  }
                  className="input"
                  placeholder="5.00"
                />
              </Field>
            </div>
            {form.gstType === "CGST_SGST" && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                At {form.taxRate}% total → CGST:{" "}
                {(parseFloat(form.taxRate || "0") / 2).toFixed(2)}% + SGST:{" "}
                {(parseFloat(form.taxRate || "0") / 2).toFixed(2)}%
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
            GST is disabled. No tax will be applied to orders.
          </div>
        )}
      </div>
      <SaveBtn saving={update.isPending} saved={saved} onClick={save} />
    </div>
  );
}

/* ── Tables panel — links to dedicated management page ───────────────── */
function TablesPanel() {
  const router = useRouter();
  const { data: tables, isLoading } = useTables();
  if (isLoading) return <Spinner />;
  const available = tables?.filter((t) => t.status === "available").length ?? 0;
  const occupied = tables?.filter((t) => t.status === "occupied").length ?? 0;
  return (
    <div className="space-y-3">
      {/* Summary card + link */}
      <button
        onClick={() => router.push("/settings/tables")}
        className="w-full bg-white rounded-xl border p-5 flex items-center gap-4 hover:border-sky-300 hover:shadow-sm transition-all group text-left"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "var(--brand-light)" }}
        >
          <LayoutGrid size={20} style={{ color: "var(--brand)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm">
            Manage Tables
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {tables?.length ?? 0} tables ·{" "}
            <span className="text-emerald-600 font-medium">
              {available} available
            </span>
            {" · "}
            <span className="text-amber-600 font-medium">
              {occupied} occupied
            </span>
          </div>
        </div>
        <ChevronRight
          size={16}
          className="text-gray-300 group-hover:text-sky-400 transition-colors shrink-0"
        />
      </button>

      {/* Quick overview */}
      {!!tables?.length && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Quick Overview
            </span>
            <button
              onClick={() => router.push("/settings/tables")}
              className="text-xs font-medium"
              style={{ color: "var(--brand)" }}
            >
              Edit all →
            </button>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {tables.map((t) => (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background:
                      t.status === "available"
                        ? "var(--available)"
                        : t.status === "occupied"
                          ? "var(--occupied)"
                          : "#f59e0b",
                  }}
                />
                <span className="text-sm font-medium text-gray-900 flex-1 truncate">
                  {t.name}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={10} />
                  {t.capacity}
                </span>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${t.status === "available" ? "bg-emerald-50 text-emerald-700" : t.status === "occupied" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"}`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Shared UI atoms ─────────────────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}
function SectionTitle({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
      {icon}
      {title}
    </div>
  );
}
function SaveBtn({
  saving,
  saved,
  onClick,
}: {
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all active:scale-95 text-white disabled:opacity-50
        ${saved ? "bg-green-600" : ""}`}
      style={saved ? {} : { background: "var(--brand)" }}
    >
      {saving ? (
        <>
          <Loader2 size={15} className="animate-spin" />
          Saving…
        </>
      ) : saved ? (
        <>
          <Check size={15} />
          Saved!
        </>
      ) : (
        <>
          <Save size={15} />
          Save Changes
        </>
      )}
    </button>
  );
}
function Spinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <Loader2 size={24} className="animate-spin text-gray-400" />
    </div>
  );
}
