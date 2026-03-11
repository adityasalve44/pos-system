"use client";
import { create } from "zustand";

interface UIState {
  activeTableId: string | null;
  setActiveTableId: (id: string | null) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openModal: string | null;
  setOpenModal: (name: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeTableId: null,
  setActiveTableId: (id) => set({ activeTableId: id }),
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  openModal: null,
  setOpenModal: (name) => set({ openModal: name }),
}));
