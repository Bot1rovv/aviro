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

export default function ProductGrid({ products, loading = false, emptyMessage = 'Товары не найдены', gridClassName = '' }: ProductGridProps) {
	if (loading) {
		return <LoadingSkeleton type="product" />
	}

	return (
		<>
			{products.length > 0 ? (
				<div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6 gap-2.5 lg:gap-6 ${gridClassName}`}>
					{products.map((product, index) => (
						<Product
							key={product.productId || index}
							productId={product.productId}
							title={product.title}
							price={product.price}
							imageUrl={product.imageUrl}
							shopName={product.shopName}
							source={product.source}
						/>
					))}
				</div>
			) : (
				<div className="col-span-6 text-center py-10">
					<p className="text-gray-500">{emptyMessage}</p>
				</div>
			)}
		</>
	)
}
