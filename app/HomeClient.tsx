'use client'

import Product from '@/components/product/Product'
import { Button, LoadingSkeleton } from '@/components/ui'
import { loadProductsPage } from '@/lib/server/actions'
import { ProductItem } from '@/types/product'
import { useCallback, useState } from 'react'

interface HomeClientProps {
	initialProducts: ProductItem[]
}

export function HomeClient({ initialProducts }: HomeClientProps) {
	const [products, setProducts] = useState<ProductItem[]>(initialProducts)
	const [page, setPage] = useState(1)
	const [loading, setLoading] = useState(false)

	const handleLoadMore = useCallback(async () => {
		const nextPage = page + 1
		setLoading(true)

		try {
			const result = await loadProductsPage(nextPage)

			if (result.success) {
				setProducts(prev => {
					const existingIds = new Set(prev.map(p => p.productId))
					const uniqueProducts = result.data.filter(p => !existingIds.has(p.productId))
					return [...prev, ...uniqueProducts]
				})
				setPage(nextPage)
			}
		} catch (error) {
			if (process.env.NODE_ENV !== 'production') {
				console.error('Failed to load products:', error)
			}
		} finally {
			setLoading(false)
		}
	}, [page])

	return (
		<>
			<div
				className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 2xl:grid-cols-6"
				id="products"
			>
				{products.length > 0 ? (
					products.map(product => (
						<Product
							key={product.productId}
							productId={product.productId}
							title={product.title}
							price={product.price}
							imageUrl={product.imageUrl}
							shopName={product.shopName}
							sales={product.sales}
							source={product.source}
						/>
					))
				) : (
					<div className="col-span-6 py-10 text-center">
						<p className="text-gray-500">Товары не найдены. Попробуйте позже.</p>
					</div>
				)}
			</div>

			{loading && (
				<div className="mt-6">
					<LoadingSkeleton type="product" />
				</div>
			)}

			<div className="mb-5 mt-10 text-center">
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
