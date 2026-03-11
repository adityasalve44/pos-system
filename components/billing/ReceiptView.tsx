"use client";
import { useState } from "react";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { Order, OrderItem } from "@/types";
import { Printer } from "lucide-react";

interface Props {
  order: Order & { items: OrderItem[] };
  restaurantName?: string;
}

export function ReceiptView({ order, restaurantName = "Restaurant" }: Props) {
  const [printing, setPrinting] = useState(false);

  async function handlePrint() {
    setPrinting(true);
    const res = await fetch(`/api/orders/${order.id}/print`, { method: "POST" });
    const html = await res.text();
    const win = window.open("", "_blank", "width=400,height=600");
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      win.print();
    }
    setPrinting(false);
  }

  return (
    <div className="bg-white rounded-xl p-4 font-mono text-sm max-w-xs mx-auto shadow-lg">
      <div className="text-center border-b pb-3 mb-3">
        <div className="font-bold text-base">{restaurantName}</div>
        <div className="text-xs text-gray-500">Receipt #{order.id.slice(-8).toUpperCase()}</div>
        <div className="text-xs text-gray-500">{formatDateTime(order.billedAt ?? new Date())}</div>
      </div>

      <div className="space-y-1 mb-3">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between gap-2">
            <span className="flex-1 truncate">{item.productName}</span>
            <span className="text-gray-500 shrink-0">{item.quantity}×</span>
            <span className="shrink-0">{formatCurrency(item.lineTotal)}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-2 space-y-1">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-gray-600">
          <span>GST</span><span>{formatCurrency(order.taxAmount)}</span>
        </div>
        <div className="flex justify-between font-bold border-t pt-1">
          <span>TOTAL</span><span>{formatCurrency(order.totalAmount)}</span>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 mt-3 border-t pt-2">
        Thank you! Please visit again.
      </div>

      <button
        onClick={handlePrint}
        disabled={printing}
        className="mt-4 w-full flex items-center justify-center gap-2 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
      >
        <Printer size={15} />
        {printing ? "Printing..." : "Print Receipt"}
      </button>
    </div>
  );
}
