"use client";
import { useState } from "react";
import { usePayOrder, useOrder } from "@/lib/hooks/useOrders";
import { formatCurrency } from "@/lib/utils/format";
import {
  Banknote,
  Smartphone,
  CreditCard,
  MoreHorizontal,
  X,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import type { PaymentMethod } from "@/types";

interface Props {
  orderId: string;
  onClose: () => void;
  onPaid: () => void;
}

const methods: {
  value: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  color: string;
  selectedColor: string;
}[] = [
  {
    value: "cash",
    label: "Cash",
    icon: <Banknote size={22} />,
    color: "text-emerald-600",
    selectedColor: "border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200",
  },
  {
    value: "upi",
    label: "UPI",
    icon: <Smartphone size={22} />,
    color: "text-violet-600",
    selectedColor: "border-violet-500 bg-violet-50 ring-2 ring-violet-200",
  },
  {
    value: "card",
    label: "Card",
    icon: <CreditCard size={22} />,
    color: "text-blue-600",
    selectedColor: "border-blue-500 bg-blue-50 ring-2 ring-blue-200",
  },
  {
    value: "other",
    label: "Other",
    icon: <MoreHorizontal size={22} />,
    color: "text-gray-500",
    selectedColor: "border-gray-400 bg-gray-50 ring-2 ring-gray-200",
  },
];

export function PaymentModal({ orderId, onClose, onPaid }: Props) {
  const { data: order } = useOrder(orderId);
  const payOrder = usePayOrder();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [referenceNo, setReferenceNo] = useState("");

  if (!order) return null;

  const selected = methods.find((m) => m.value === method)!;

  async function handlePay() {
    await payOrder.mutateAsync({
      orderId,
      amount: parseFloat(order!.totalAmount),
      paymentMethod: method,
      referenceNo: referenceNo || undefined,
    });
    onPaid();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b">
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Collect Payment
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Select payment method
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          {/* Amount */}
          <div className="text-center mb-5">
            <div className="text-3xl font-bold text-gray-900 tracking-tight">
              {formatCurrency(order.totalAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">
              Order #{order.orderNumber}
            </div>
          </div>

          {/* Payment method grid */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {methods.map((m) => (
              <button
                key={m.value}
                onClick={() => setMethod(m.value)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                  method === m.value
                    ? m.selectedColor
                    : "border-gray-200 hover:border-gray-300 bg-white"
                }`}
              >
                <span
                  className={method === m.value ? m.color : "text-gray-400"}
                >
                  {m.icon}
                </span>
                <span
                  className={`text-xs font-medium ${method === m.value ? "text-gray-800" : "text-gray-500"}`}
                >
                  {m.label}
                </span>
              </button>
            ))}
          </div>

          {/* Reference field for UPI / Card */}
          {(method === "upi" || method === "card") && (
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Reference / Transaction ID
              </label>
              <input
                type="text"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                placeholder={
                  method === "upi" ? "UPI ref no." : "Last 4 digits or txn ID"
                }
                autoFocus
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={payOrder.isPending}
              className={`flex-1 py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60
                ${
                  method === "cash"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : method === "upi"
                      ? "bg-violet-600 hover:bg-violet-700"
                      : method === "card"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-700 hover:bg-gray-800"
                }`}
            >
              {payOrder.isPending ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Processing…
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} /> Confirm {selected.label}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
