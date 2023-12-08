import { create } from "zustand";

type State = {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  resetDates: () => void;
};

type InvigilatorsState = {
  invigilatorsDetails: any[];
};

export const useDateStore = create<State>((set) => ({
  startDate: null,
  endDate: null,
  setStartDate: (date) => set({ startDate: date }),
  setEndDate: (date) => set({ endDate: date }),
  resetDates: () => set({ startDate: null, endDate: null }),
}));

export const useInvigilatorsStore = create<InvigilatorsState>((set) => ({
  invigilatorsDetails: [],
}));
