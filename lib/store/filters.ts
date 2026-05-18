'use client'

import { create } from 'zustand'

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'popular'

interface FilterState {
  selectedCategories: string[]
  selectedSizes: string[]
  priceRange: [number, number]
  searchQuery: string
  sortBy: SortOption

  setCategories: (categories: string[]) => void
  setSizes: (sizes: string[]) => void
  setPriceRange: (range: [number, number]) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: SortOption) => void
  resetFilters: () => void
}

const DEFAULT_PRICE_RANGE: [number, number] = [0, 20000000]

export const useFilters = create<FilterState>((set) => ({
  selectedCategories: [],
  selectedSizes: [],
  priceRange: DEFAULT_PRICE_RANGE,
  searchQuery: '',
  sortBy: 'newest',

  setCategories: (categories: string[]) =>
    set({ selectedCategories: categories }),

  setSizes: (sizes: string[]) =>
    set({ selectedSizes: sizes }),

  setPriceRange: (range: [number, number]) => set({ priceRange: range }),

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  setSortBy: (sort: SortOption) => set({ sortBy: sort }),

  resetFilters: () =>
    set({
      selectedCategories: [],
      selectedSizes: [],
      priceRange: DEFAULT_PRICE_RANGE,
      searchQuery: '',
      sortBy: 'newest',
    }),
}))
