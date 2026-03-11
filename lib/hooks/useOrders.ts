"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Order, OrderItem } from "@/types";

export class TableConflictError extends Error {
  existingOrderId: string;
  orderNumber: number;
  constructor(existingOrderId: string, orderNumber: number) {
    super("Table already has an active order");
    this.name = "TableConflictError";
    this.existingOrderId = existingOrderId;
    this.orderNumber = orderNumber;
  }
}

export function useActiveOrders() {
  return useQuery<Order[]>({
    queryKey: ["orders", "active"],
    queryFn: async () => {
      const res = await fetch("/api/orders");
      return (await res.json()).data;
    },
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}

export function useOrder(id: string) {
  return useQuery<Order & { items: OrderItem[] }>({
    queryKey: ["orders", id],
    queryFn: async () => {
      const res = await fetch(`/api/orders/${id}`);
      return (await res.json()).data;
    },
    refetchInterval: 6_000,
    refetchIntervalInBackground: false,
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      tableId?: string;
      orderType: "dine_in" | "takeout";
      customerName?: string;
    }) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (res.status === 409) {
        // Another user already opened an order on this table — surface it clearly
        throw new TableConflictError(json.existingOrderId, json.orderNumber);
      }
      if (!res.ok) throw new Error(json.error ?? "Failed to create order");
      return json.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (err) => {
      // On conflict, refresh tables so the UI shows the occupied state immediately
      if (err instanceof TableConflictError) {
        qc.invalidateQueries({ queryKey: ["tables"] });
      }
    },
  });
}

export function useAddItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      productId,
      quantity = 1,
    }: {
      orderId: string;
      productId: string;
      quantity?: number;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity }),
      });
      if (!res.ok) throw new Error("Failed to add item");
      return (await res.json()).data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId] }),
  });
}

export function useUpdateItemQty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
      quantity,
    }: {
      orderId: string;
      itemId: string;
      quantity: number;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity }),
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data;
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId] }),
  });
}

export function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      itemId,
    }: {
      orderId: string;
      itemId: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove item");
    },
    onSuccess: (_, vars) =>
      qc.invalidateQueries({ queryKey: ["orders", vars.orderId] }),
  });
}

export function useBillOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/bill`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to bill order");
      return (await res.json()).data;
    },
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["orders", id] });
      qc.invalidateQueries({ queryKey: ["tables"] });
    },
  });
}

export function usePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      orderId,
      ...data
    }: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      referenceNo?: string;
    }) => {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId: string) => {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tables"] });
      qc.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
