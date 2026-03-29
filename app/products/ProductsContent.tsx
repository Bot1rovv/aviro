'use client'

import Product from '@/components/product/Product'
import { Button, LoadingSkeleton } from '@/components/ui'
import { searchProductsByKeywordAction } from '@/lib/server/actions'
import { ProductItem } from '@/types/product'
import { useCallback, useState } from 'react'

interface ProductsContentProps {
	initialProducts: ProductItem[]
	categoryId: string | null
	subcategoryId: string | null
	initialPage: number
}

export function ProductsContent({ initialProducts, categoryId, subcategoryId, initialPage }: ProductsContentProps) {
	const [products, setProducts] = useState<ProductItem[]>(initialProducts)
	const [page, setPage] = useState(initialPage)
	const [loading, setLoading] = useState(false)

	const handleLoadMore = useCallback(async () => {
		const nextPage = page + 1
		setLoading(true)
		try {
			// Определяем ключевое слово для поиска (можно вынести в хук, но упростим)
			let keyword = 'товары'
			// В реальном приложении нужно вынести логику определения ключевого слова в отдельную функцию
			// Для простоты используем тот же алгоритм, что и на сервере (можно передать keyword из пропсов)
			// Пока что используем заглушку
			if (categoryId) {
				// В реальности нужно получить keyword из categoryId, но для демо используем 'товары'
				keyword = 'товары'
			}

			const result = await searchProductsByKeywordAction(keyword, nextPage)
			if (result.success) {
				const newProducts = result.data
				// Фильтруем дубликаты по productId
				setProducts(prev => {
					const existingIds = new Set(prev.map(p => p.productId))
					const uniqueProducts = newProducts.filter(p => !existingIds.has(p.productId))
					return [...prev, ...uniqueProducts]
				})
				setPage(nextPage)
			}
		} catch (error) {
			console.error('Failed to load more products:', error)
		} finally {
			setLoading(false)
		}
	}, [page, categoryId])

	if (products.length === initialProducts.length && page === initialPage) {
		// Нет дополнительных товаров для отображения
		return null
	}

	return (
		<>
			{/* Дополнительные продукты, загруженные клиентом */}
			{products.length > initialProducts.length && (
				<div className="mt-6">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-6">
						{products.slice(initialProducts.length).map(product => (
							<Product
								key={product.productId}
								productId={product.productId}
								title={product.title}
								price={product.price}
								imageUrl={product.imageUrl}
								shopName={product.shopName}
								source={product.source}
							/>
						))}
					</div>
				</div>
			)}

			{/* Скелетоны при загрузке */}
			{loading && (
				<div className="mt-6">
					<LoadingSkeleton type="product" />
				</div>
			)}

			<div className="mt-10 text-center mb-5">
				<Button
					variant="primary"
					onClick={handleLoadMore}
					loading={loading}
					disabled={loading}
				>
					<span>Загрузить ещё</span>
				</Button>
			</div>
		</>
	)
}
