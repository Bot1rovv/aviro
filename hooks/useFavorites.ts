import { useFavoritesStore } from '@/lib/store/favorites'
import { FavoriteItem } from '@/types/favorites'
import { toast } from 'sonner'

/**
 * Хук для работы с избранным, добавляющий уведомления (toast).
 * Предоставляет методы addFavorite, removeFavorite, clearFavorites,
 * а также состояние items, totalItems и проверку isFavorite.
 */
export function useFavorites() {
	const { addFavorite, removeFavorite, clearFavorites, items, totalItems, isFavorite } = useFavoritesStore()

	const addFavoriteWithToast = (item: Omit<FavoriteItem, 'addedAt'>) => {
		addFavorite(item)
		toast.success('Товар добавлен в избранное')
	}

	const removeFavoriteWithToast = (productId: string) => {
		removeFavorite(productId)
		toast.success('Товар удалён из избранного')
	}

	const clearFavoritesWithToast = () => {
		clearFavorites()
		toast.success('Избранное очищено')
	}

	return {
		items,
		totalItems,
		isFavorite,
		addFavorite: addFavoriteWithToast,
		removeFavorite: removeFavoriteWithToast,
		clearFavorites: clearFavoritesWithToast
	}
}
