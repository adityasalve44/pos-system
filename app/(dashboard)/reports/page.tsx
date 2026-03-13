"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import { format } from "date-fns";
import type { Order, OrderItem } from "@/types";
import {
  BarChart2,
  Calendar,
  Eye,
  Printer,
  X,
  Package,
  UtensilsCrossed,
  TrendingUp,
  ShoppingBag,
} from "lucide-react";

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [summaryDate, setSummaryDate] = useState(today);
  const [detailOrder, setDetailOrder] = useState<
    (Order & { items: OrderItem[] }) | null
  >(null);
  const [bulkPrinting, setBulkPrinting] = useState(false);

  const { data: daily } = useQuery({
    queryKey: ["reports", "daily", summaryDate],
    queryFn: async () =>
      (await (await fetch(`/api/reports/daily?date=${summaryDate}`)).json())
        .data,
  });

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["reports", "orders", dateFrom, dateTo],
    queryFn: async () =>
      (
        await (
          await fetch(
            `/api/reports/orders?date_from=${dateFrom}&date_to=${dateTo}&status=paid&limit=200`,
          )
        ).json()
      ).data,
  });

  async function viewDetail(order: Order) {
    const data = await (await fetch(`/api/orders/${order.id}`)).json();
    setDetailOrder(data.data);
  }

  async function printOne(orderId: string) {
    const html = await (
      await fetch(`/api/orders/${orderId}/print`, { method: "POST" })
    ).text();
    const w = window.open("", "_blank", "width=420,height=640");
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      w.print();
    }
  }

  async function bulkPrint() {
    if (!orders?.length) return;
    setBulkPrinting(true);
    const htmls = await Promise.all(
      orders.map((o) =>
        fetch(`/api/orders/${o.id}/print`, { method: "POST" }).then((r) =>
          r.text(),
        ),
      ),
    );
    const body = htmls
      .map(
        (h, i) =>
          `<div style="${i < htmls.length - 1 ? "page-break-after:always" : ""}">${h.replace(/<(!DOCTYPE|html|head|body)[^>]*>/gi, "").replace(/<\/(html|body)>/gi, "")}</div>`,
      )
      .join("");
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<!DOCTYPE html><html><body>${body}</body></html>`);
      w.document.close();
      w.focus();
      w.print();
    }
    setBulkPrinting(false);
  }

  const totalRevenue =
    orders?.reduce((s, o) => s + parseFloat(o.totalAmount || "0"), 0) ?? 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Reports</h1>

      {/* Daily summary */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
            <BarChart2 size={15} style={{ color: "var(--brand)" }} /> Daily
            Summary
          </div>
          <input
            type="date"
            value={summaryDate}
            onChange={(e) => setSummaryDate(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--brand-light)" }}
          >
            <div
              className="flex items-center gap-1.5 text-xs font-medium mb-2"
              style={{ color: "var(--brand)" }}
            >
              <TrendingUp size={12} /> Revenue
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(daily?.totalRevenue ?? 0)}
            </div>
          </div>
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-2">
              <ShoppingBag size={12} /> Orders
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {daily?.orderCount ?? 0}
            </div>
          </div>
        </div>

        {daily?.byPaymentMethod &&
          Object.keys(daily.byPaymentMethod).length > 0 && (
            <div className="pt-3 border-t">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                By Payment Method
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(daily.byPaymentMethod).map(
                  ([method, amount]) => (
                    <div
                      key={method}
                      className="bg-gray-50 border rounded-lg px-3 py-2 text-center min-w-16"
                    >
                      <div className="text-xs text-gray-500 capitalize">
                        {method}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm">
                        {formatCurrency(String(amount))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
      </div>

      {/* Order history */}
      <div className="bg-white rounded-xl border p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 font-semibold text-gray-900 text-sm">
            <Calendar size={15} className="text-purple-500" /> Order History
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span className="text-gray-400 text-sm">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            {(orders?.length ?? 0) > 0 && (
              <button
                onClick={bulkPrint}
                disabled={bulkPrinting}
                className="flex items-center gap-1.5 text-sm bg-gray-800 text-white px-3 py-1.5 rounded-lg hover:bg-gray-900 disabled:opacity-50 active:scale-95"
              >
                <Printer size={13} />{" "}
                {bulkPrinting ? "…" : `Print All (${orders!.length})`}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-14 bg-gray-100 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : !orders?.length ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            No paid orders in this period
          </div>
        ) : (
          <>
            <div className="text-xs text-gray-400 mb-2">
              {orders.length} orders · {formatCurrency(totalRevenue)} total
            </div>
            <div className="space-y-2 max-h-420 overflow-y-auto">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    order.orderType === "takeout"
                      ? "bg-purple-50 border-purple-100"
                      : "bg-teal-50 border-teal-100"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      order.orderType === "takeout"
                        ? "bg-purple-200"
                        : "bg-teal-200"
                    }`}
                  >
                    {order.orderType === "takeout" ? (
                      <Package size={13} className="text-purple-700" />
                    ) : (
                      <UtensilsCrossed size={13} className="text-teal-700" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900">
                      #{order.orderNumber}
                      {order.customerName ? ` — ${order.customerName}` : ""}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateTime(order.openedAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    <div
                      className={`text-xs font-medium ${order.orderType === "takeout" ? "text-purple-600" : "text-teal-600"}`}
                    >
                      {order.orderType === "takeout" ? "Takeout" : "Dine In"}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => viewDetail(order)}
                      title="View detail"
                      className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Eye size={14} />
                    </button>
                    <button
                      onClick={() => printOne(order.id)}
                      title="Print receipt"
                      className="p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t flex justify-between text-sm font-bold">
              <span>Total</span>
              <span>{formatCurrency(totalRevenue)}</span>
            </div>
          </>
        )}
      </div>

      {/* Detail modal */}
      {detailOrder && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
              <div>
                <h2 className="font-bold text-gray-900">
                  Order #{detailOrder.orderNumber}
                </h2>
                <p className="text-xs text-gray-500">
                  {formatDateTime(detailOrder.openedAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => printOne(detailOrder.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 text-white rounded-lg text-xs font-medium hover:bg-gray-900 active:scale-95"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  onClick={() => setDetailOrder(null)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-5">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${
                  detailOrder.orderType === "takeout"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-teal-100 text-teal-700"
                }`}
              >
                {detailOrder.orderType === "takeout" ? (
                  <Package size={11} />
                ) : (
                  <UtensilsCrossed size={11} />
                )}
                {detailOrder.orderType === "takeout" ? "Takeout" : "Dine In"}
                {detailOrder.customerName && ` · ${detailOrder.customerName}`}
              </span>
              <div className="space-y-2 mb-4">
                {detailOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">
                      {item.productName}{" "}
                      <span className="text-gray-400">×{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-3 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(detailOrder.subtotal)}</span>
                </div>
                {parseFloat(detailOrder.taxAmount) > 0 && (
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>GST</span>
                    <span>{formatCurrency(detailOrder.taxAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-gray-900 pt-1 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(detailOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
