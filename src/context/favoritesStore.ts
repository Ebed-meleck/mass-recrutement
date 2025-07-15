import { create } from 'zustand';

interface FavoritesState {
  favorites: Set<string>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: new Set<string>(typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('favorites') || '[]') : []),
  toggleFavorite: (id) => set((state) => {
    const newFavs = new Set(state.favorites);
    if (newFavs.has(id)) {
      newFavs.delete(id);
    } else {
      newFavs.add(id);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('favorites', JSON.stringify(Array.from(newFavs)));
    }
    return { favorites: newFavs };
  }),
  isFavorite: (id) => get().favorites.has(id),
})); 