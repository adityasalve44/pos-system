"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Product, Category, Restaurant } from "@/types";

export function useProducts() {
  return useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      const json = await res.json();
      return json.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      return (await res.json()).data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; sortOrder?: number }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useSettings() {
  return useQuery<Restaurant>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      return (await res.json()).data;
    },
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Restaurant>) => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      return (await res.json()).data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
}




// "use client";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import type { Product, Category, Restaurant } from "@/types";

// export function useProducts() {
//   return useQuery<Product[]>({
//     queryKey: ["products"],
//     queryFn: async () => {
//       const res = await fetch("/api/products");
//       if (!res.ok) throw new Error("Failed to fetch products");
//       return (await res.json()).data;
//     },
//     // No staleTime — always fetch fresh on mount so products render immediately
//   });
// }

// export function useCreateProduct() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: Partial<Product>) => {
//       const res = await fetch("/api/products", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error("Failed to create product");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
//   });
// }

// export function useUpdateProduct() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async ({ id, ...data }: Partial<Product> & { id: string }) => {
//       const res = await fetch(`/api/products/${id}`, {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error("Failed to update product");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
//   });
// }

// export function useCategories() {
//   return useQuery<Category[]>({
//     queryKey: ["categories"],
//     queryFn: async () => {
//       const res = await fetch("/api/categories");
//       if (!res.ok) throw new Error("Failed to fetch categories");
//       return (await res.json()).data;
//     },
//   });
// }

// export function useCreateCategory() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: { name: string; sortOrder?: number }) => {
//       const res = await fetch("/api/categories", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
//   });
// }

// export function useDeleteCategory() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (id: string) => {
//       const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
//       if (!res.ok) throw new Error("Failed");
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
//   });
// }

// export function useSettings() {
//   return useQuery<Restaurant>({
//     queryKey: ["settings"],
//     queryFn: async () => {
//       const res = await fetch("/api/settings");
//       if (!res.ok) throw new Error("Failed to fetch settings");
//       return (await res.json()).data;
//     },
//   });
// }

// export function useUpdateSettings() {
//   const qc = useQueryClient();
//   return useMutation({
//     mutationFn: async (data: Partial<Restaurant>) => {
//       const res = await fetch("/api/settings", {
//         method: "PUT",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(data),
//       });
//       if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
//       return (await res.json()).data;
//     },
//     onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
//   });
// }