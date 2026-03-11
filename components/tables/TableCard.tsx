"use client";
import { useRouter } from "next/navigation";
import { useCreateOrder } from "@/lib/hooks/useOrders";
import type { Table } from "@/types";
import { formatCurrency, formatRelative } from "@/lib/utils/format";
import { Users } from "lucide-react";

interface Props { table: Table; }

export function TableCard({ table }: Props) {
  const router = useRouter();
  const createOrder = useCreateOrder();

  const statusColors = {
    available: "bg-green-50 border-green-200 hover:border-green-400",
    occupied: "bg-orange-50 border-orange-200 hover:border-orange-400",
    reserved: "bg-yellow-50 border-yellow-200",
  };

  const statusBadge = {
    available: "bg-green-100 text-green-700",
    occupied: "bg-orange-100 text-orange-700",
    reserved: "bg-yellow-100 text-yellow-700",
  };

  async function handleClick() {
    if (table.status === "available") {
      const order = await createOrder.mutateAsync({ tableId: table.id, orderType: "dine_in" });
      router.push(`/orders/${order.id}`);
    } else if (table.activeOrder) {
      router.push(`/orders/${table.activeOrder.id}`);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={createOrder.isPending}
      className={`w-full text-left border-2 rounded-xl p-4 transition-all ${statusColors[table.status]} ${
        table.status !== "reserved" ? "cursor-pointer" : "cursor-not-allowed"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-900">{table.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${statusBadge[table.status]}`}>
          {table.status}
        </span>
      </div>

      <div className="flex items-center gap-1 text-gray-500 text-sm">
        <Users size={14} />
        <span>{table.capacity} seats</span>
      </div>

      {table.activeOrder && (
        <div className="mt-3 pt-3 border-t border-orange-200 text-sm">
          <div className="text-orange-700 font-medium">
            {formatCurrency(table.activeOrder.totalAmount || table.activeOrder.subtotal || "0")}
          </div>
          <div className="text-gray-500 text-xs">
            Opened {formatRelative(table.activeOrder.openedAt)}
          </div>
        </div>
      )}

      {table.status === "available" && (
        <div className="mt-3 text-xs text-green-600 font-medium">Tap to open order</div>
      )}
    </button>
  );
}
