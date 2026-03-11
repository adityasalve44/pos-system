"use client";
import { useState } from "react";
import { usePayOrder, useOrder } from "@/lib/hooks/useOrders";
import { formatCurrency } from "@/lib/utils/format";
import type { PaymentMethod } from "@/types";

interface Props {
  orderId: string;
  onClose: () => void;
  onPaid: () => void; // called after successful payment — opens receipt
}

const methods: { value: PaymentMethod; label: string; emoji: string }[] = [
  { value: "cash", label: "Cash", emoji: "💵" },
  { value: "upi", label: "UPI", emoji: "📱" },
  { value: "card", label: "Card", emoji: "💳" },
  { value: "other", label: "Other", emoji: "🔄" },
];

export function PaymentModal({ orderId, onClose, onPaid }: Props) {
  const { data: order } = useOrder(orderId);
  const payOrder = usePayOrder();
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [referenceNo, setReferenceNo] = useState("");

  if (!order) return null;

  async function handlePay() {
    await payOrder.mutateAsync({
      orderId,
      amount: parseFloat(order!.totalAmount),
      paymentMethod: method,
      referenceNo: referenceNo || undefined,
    });
    onPaid(); // open receipt immediately — no navigation
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Record Payment</h2>
        <div className="text-3xl font-bold text-blue-600 mb-6">
          {formatCurrency(order.totalAmount)}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {methods.map((m) => (
            <button
              key={m.value}
              onClick={() => setMethod(m.value)}
              className={`p-3 rounded-xl border-2 text-left transition-colors ${
                method === m.value
                  ? "border-blue-600 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-xl mb-1">{m.emoji}</div>
              <div className="font-medium text-sm">{m.label}</div>
            </button>
          ))}
        </div>

        {(method === "upi" || method === "card") && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference No.
            </label>
            <input
              type="text"
              value={referenceNo}
              onChange={(e) => setReferenceNo(e.target.value)}
              placeholder="Transaction ID / UPI ref"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePay}
            disabled={payOrder.isPending}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {payOrder.isPending ? "Processing..." : "Confirm Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}
