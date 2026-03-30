'use client'

import { Button, EmptyState, PageHeader, ProductGrid } from '@/components/ui'
import { useFavoritesStore } from '@/lib/store'
import { Heart } from 'lucide-react'

export default function FavoritesPage() {
	const { items, clearFavorites } = useFavoritesStore()

	const favoriteProducts = items.map(item => ({
		productId: item.productId,
		title: item.title,
		price: item.price,
		imageUrl: item.imageUrl,
		source: item.source,
		shopName: '',
		sales: 0
	}))

	return (
		<div className="container mx-auto px-4 py-6">
			<div className="flex items-center justify-center">
				<div className="w-full py-4">
					<PageHeader
						title="Мой список желаний"
						actions={
							items.length > 0 ? (
								<Button
									variant="ghost"
									size="sm"
									onClick={clearFavorites}
									className="text-gray-600 hover:text-red-500"
								>
									Очистить список
								</Button>
							) : undefined
						}
					/>

					{items.length === 0 ? (
						<div className="rounded-xl bg-gray-100/70 p-10">
							<EmptyState
								icon={Heart}
								title="У вас пока нет избранных товаров"
							/>
						</div>
					) : (
						<ProductGrid products={favoriteProducts} />
					)}
				</div>
			</div>
		</div>
	)
}