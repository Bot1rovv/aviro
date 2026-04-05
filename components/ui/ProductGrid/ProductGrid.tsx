'use client'

import Product from '@/components/product/Product'
import { LoadingSkeleton } from '@/components/ui'
import { ProductItem } from '@/types/product'

interface ProductGridProps {
	products: ProductItem[]
	loading?: boolean
	emptyMessage?: string
	gridClassName?: string
}

export default function ProductGrid({
	products,
	loading = false,
	emptyMessage = 'Товары не найдены',
	gridClassName = ''
}: ProductGridProps) {
	if (loading) {
		return <LoadingSkeleton type="product" />
	}

	if (!products || products.length === 0) {
		return (
			<div className="col-span-6 py-10 text-center">
				<p className="text-gray-500">{emptyMessage}</p>
			</div>
		)
	}

	return (
		<div
			className={`grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 2xl:grid-cols-6 ${gridClassName}`}
		>
			{products.map((product, index) => (
				<Product
					key={`${product.productId}-${product.source}`}
					productId={product.productId}
					title={product.title}
					price={product.price}
					imageUrl={product.imageUrl}
					shopName={product.shopName}
					source={product.source}
					sales={product.sales}
					index={index}
				/>
			))}
		</div>
	)
}