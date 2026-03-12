"use client";
import { useState, useEffect } from "react";
import { useSettings, useUpdateSettings } from "@/lib/hooks/useProducts";
import { Save, Store, Receipt, Info } from "lucide-react";
import type { GstType } from "@/types";

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const update = useUpdateSettings();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState(() => ({
    name: settings?.name ?? "",
    address: settings?.address ?? "",
    phone: settings?.phone ?? "",
    gstEnabled: settings?.gstEnabled ?? 1,
    gstType: settings?.gstType ?? "GST" as GstType,
    gstNumber: settings?.gstNumber ?? "",
    taxRate: settings?.taxRate ?? "5.00",
  }));

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => setSaved(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [saved]);

  async function handleSave() {
    const payload = {
      name: form.name,
      address: form.address,
      phone: form.phone,
      gstEnabled: form.gstEnabled,
      gstType: form.gstType,
      gstNumber: form.gstNumber,
      taxRate: form.taxRate,
    };
    await update.mutateAsync(payload);
    setSaved(true);
  }

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Settings</h1>

      {/* Restaurant Info */}
      <section className="bg-white rounded-xl border p-4 md:p-5">
        <div className="flex items-center gap-2 font-semibold text-gray-900 mb-4 text-sm">
          <Store size={16} className="text-blue-500" /> Restaurant Info
        </div>
        <div className="space-y-3">
          <Field label="Restaurant Name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="input" placeholder="e.g. Demo Biryani House" />
          </Field>
          <Field label="Address">
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              className="input" placeholder="Full address" />
          </Field>
          <Field label="Phone">
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
              className="input" placeholder="+91 98765 43210" />
          </Field>
        </div>
      </section>

      {/* GST Settings */}
      <section className="bg-white rounded-xl border p-4 md:p-5">
        <div className="flex items-center gap-2 font-semibold text-gray-900 mb-4 text-sm">
          <Receipt size={16} className="text-green-500" /> GST Settings
        </div>

        {/* GST toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-4">
          <div>
            <div className="font-medium text-gray-900 text-sm">Enable GST</div>
            <div className="text-xs text-gray-500">Apply tax to all orders</div>
          </div>
          <button onClick={() => setForm({ ...form, gstEnabled: form.gstEnabled ? 0 : 1 })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.gstEnabled ? "bg-green-500" : "bg-gray-300"}`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.gstEnabled ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {form.gstEnabled ? (
          <div className="space-y-3">
            <Field label="GST Type">
              <div className="grid grid-cols-3 gap-2">
                {(["GST", "CGST_SGST", "IGST"] as GstType[]).map(t => (
                  <button key={t} onClick={() => setForm({ ...form, gstType: t })}
                    className={`py-2 rounded-xl text-xs font-medium border-2 transition-colors ${form.gstType === t ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                    {t === "CGST_SGST" ? "CGST+SGST" : t}
                  </button>
                ))}
              </div>
              <div className="mt-2 p-2.5 bg-blue-50 rounded-lg text-xs text-blue-700 flex gap-1.5">
                <Info size={12} className="shrink-0 mt-0.5" />
                {form.gstType === "GST" && "Single GST for intra-state supplies (composition scheme)"}
                {form.gstType === "CGST_SGST" && "Split equally into Central (CGST) and State (SGST) for intra-state"}
                {form.gstType === "IGST" && "Integrated GST for inter-state supplies"}
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="GST Number (GSTIN)">
                <input value={form.gstNumber} onChange={e => setForm({ ...form, gstNumber: e.target.value })}
                  className="input font-mono text-xs tracking-wider" placeholder="27AABCU9603R1ZX" maxLength={15} />
              </Field>
              <Field label="Tax Rate (%)">
                <input type="number" step="0.01" min="0" max="100" value={form.taxRate}
                  onChange={e => setForm({ ...form, taxRate: e.target.value })}
                  className="input" placeholder="5.00" />
              </Field>
            </div>
            {form.gstType === "CGST_SGST" && (
              <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600">
                At {form.taxRate}% total → CGST: {(parseFloat(form.taxRate || "0") / 2).toFixed(2)}% + SGST: {(parseFloat(form.taxRate || "0") / 2).toFixed(2)}%
              </div>
            )}
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-xl text-sm text-gray-500 text-center">
            GST is disabled. No tax will be applied to orders.
          </div>
        )}
      </section>

      <button onClick={handleSave} disabled={update.isPending}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors active:scale-95 ${
          saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"} disabled:opacity-50`}>
        <Save size={16} />
        {update.isPending ? "Saving…" : saved ? "✓ Saved!" : "Save Settings"}
      </button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
