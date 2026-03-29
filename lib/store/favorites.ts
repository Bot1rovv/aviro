import { FavoriteItem, FavoritesState } from '@/types/favorites'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Функция для записи в историю
async function addToHistory(action: string, item?: Omit<FavoriteItem, 'addedAt'>) {
	try {
		await fetch('/api/user/history', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				productId: item?.productId,
				productTitle: item?.title,
				productPrice: item?.price,
				productImage: item?.imageUrl
			})
		})
	} catch (e) {
		console.error('Failed to add to history:', e)
	}
}

export const useFavoritesStore = create<FavoritesState>()(
	persist(
		(set, get) => ({
			items: [],
			totalItems: 0,

			addFavorite: item =>
				set(state => {
					const existingItem = state.items.find(i => i.productId === item.productId)
					if (existingItem) {
						return state // Уже в избранном
					}

					// Записываем в историю
					addToHistory('add_to_favorites', item)

					const newItem = { ...item, addedAt: Date.now() }
					const newItems = [...state.items, newItem]

					return {
						items: newItems,
						totalItems: newItems.length
					}
				}),

			removeFavorite: productId =>
				set(state => {
					// Находим item для записи в историю
					const removedItem = state.items.find(i => i.productId === productId)
					if (removedItem) {
						addToHistory('remove_from_favorites', removedItem)
					}

					const newItems = state.items.filter(i => i.productId !== productId)
					return {
						items: newItems,
						totalItems: newItems.length
					}
				}),

			isFavorite: productId => {
				return get().items.some(i => i.productId === productId)
			},

			clearFavorites: () =>
				set({
					items: [],
					totalItems: 0
				})
		}),
		{
			name: 'favorites-storage'
		}
	)
)

export type { FavoriteItem, FavoritesState } from '@/types/favorites'
