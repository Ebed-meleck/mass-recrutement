import { create } from 'zustand';

interface ThresholdEntry {
  value: number;
  date: string;
}

interface ThresholdHistoryState {
  history: ThresholdEntry[];
  addThreshold: (value: number) => void;
  revertTo: (index: number) => void;
}

export const useThresholdHistoryStore = create<ThresholdHistoryState>((set) => ({
  history: typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('thresholdHistory') || '[]') : [],
  addThreshold: (value) => set((state) => {
    const newHistory = [...state.history, { value, date: new Date().toISOString() }];
    if (typeof window !== 'undefined') {
      localStorage.setItem('thresholdHistory', JSON.stringify(newHistory));
    }
    return { history: newHistory };
  }),
  revertTo: (index) => set((state) => {
    const newHistory = state.history.slice(0, index + 1);
    if (typeof window !== 'undefined') {
      localStorage.setItem('thresholdHistory', JSON.stringify(newHistory));
    }
    return { history: newHistory };
  })
})); 