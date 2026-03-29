import { ProductSource } from './product'

export interface FavoriteItem {
	productId: string
	title: string
	price: string
	imageUrl: string
	source: ProductSource
	addedAt: number
}

export interface FavoritesState {
	items: FavoriteItem[]
	totalItems: number
	addFavorite: (item: Omit<FavoriteItem, 'addedAt'>) => void
	removeFavorite: (productId: string) => void
	isFavorite: (productId: string) => boolean
	clearFavorites: () => void
}
