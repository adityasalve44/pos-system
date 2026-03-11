"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { Table } from "@/types";

/** Returns the poll interval only when the browser tab is visible */
// function useVisibleInterval(ms: number) {
//   const [visible, setVisible] = useState(true);
//   useEffect(() => {
//     const cb = () => setVisible(document.visibilityState === "visible");
//     document.addEventListener("visibilitychange", cb);
//     return () => document.removeEventListener("visibilitychange", cb);
//   }, []);
//   return visible ? ms : false;
// }                                                                    

export function useTables() {
  // const interval = useVisibleInterval(15_000);
  return useQuery<Table[]>({
    queryKey: ["tables"],
    queryFn: async () => {
      const res = await fetch("/api/tables");
      if (!res.ok) throw new Error("Failed to fetch tables");
      return (await res.json()).data;
    },
    refetchInterval: 10_000,
  });
}

export function useCreateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; capacity: number }) => {
      const res = await fetch("/api/tables", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create table");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useUpdateTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; capacity?: number }) => {
      const res = await fetch(`/api/tables/${id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update table");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}

export function useDeleteTable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete table");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
  });
}


// "use client";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import { useEffect, useRef } from "react";
// import type { Table } from "@/types";

// /**
//  * Returns a refetchInterval that pauses when the browser tab is hidden.
//  * Uses a ref instead of state to avoid SSR hydration mismatches.
//  */
// function useVisibleInterval(ms: number): number | false {
//   const intervalRef = useRef<number | false>(ms);

//   useEffect(() => {
//     const update = () => {
//       intervalRef.current = document.visibilityState === "visible" ? ms : false;
//     };
//     document.addEventListener("visibilitychange", update);
//     return () => document.removeEventListener("visibilitychange", update);
//   }, [ms]);

//   // Always return the ms value — React Query reads refetchInterval once per render.
//   // The visibilitychange listener will stop background fetches naturally because
//   // refetchIntervalInBackground: false handles that case.
//   return ms;
// }

// export function useTables() {
//   return useQuery<Table[]>({
//     queryKey: ["tables"],
//     queryFn: async () => {
//       const res = await fetch("/api/tables");
//       if (!res.ok) throw new Error("Failed to fetch tables");
//       const json = await res.json();
//       return json.data;
//     },
//     refetchInterval: 15_000,
//     refetchIntervalInBackground: false, // pauses polling when tab is hidden
//     // No staleTime — always fetch fresh on mount
//   });
// }

// export function useCreateTable() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: { name: string; capacity: number }) => {
//       const res = await fetch("/api/tables", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error("Failed to create table");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
//   });
// }

// export function useUpdateTable() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ id, ...data }: { id: string; name?: string; capacity?: number }) => {
//       const res = await fetch(`/api/tables/${id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error("Failed to update table");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
//   });
// }

// export function useDeleteTable() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (id: string) => {
//       const res = await fetch(`/api/tables/${id}`, { method: "DELETE" });
//       if (!res.ok) throw new Error("Failed to delete table");
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["tables"] }),
//   });
// }