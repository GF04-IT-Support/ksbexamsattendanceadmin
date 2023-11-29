import {create} from 'zustand';

type Store = {
    selectedId: string;
    setSelectedId: (id: string) => void;
};

export const useStoreId = create<Store>((set) => ({
    selectedId: "",
    setSelectedId: (id: string) => set({ selectedId: id }),
}));