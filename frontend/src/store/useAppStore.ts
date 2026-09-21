import { create } from 'zustand';

export type UserRole = 'YAPIM_MUHENDISI' | 'SAHA_EKIBI';

interface AppState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  // Simulating the current date of the app (default to today, but can be changed for testing timeline)
  currentDate: string; 
  setCurrentDate: (date: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: 'YAPIM_MUHENDISI',
  setRole: (role) => set({ role }),
  currentDate: '2026-09-21',
  setCurrentDate: (date) => set({ currentDate: date }),
}));
