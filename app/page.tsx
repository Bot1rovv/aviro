import Product from '@/components/product/Product'
import { loadProductsPage } from '@/lib/server/actions'
import { HomeClient } from './HomeClient'

export default async function Home() {
	// Загружаем первую страницу на сервере
	const initialResult = await loadProductsPage(1)
	const initialProducts = initialResult.success ? initialResult.data : []

	return (
		<div className="container mx-auto px-4 py-8">
			<div
				className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6  gap-3.5 lg:gap-6"
				id="products"
			>
				{initialProducts.length > 0 ? (
					initialProducts.map(product => (
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
					<div className="col-span-6 text-center py-10">
						<p className="text-gray-500">Товары не найдены. Попробуйте позже.</p>
					</div>
				)}
			</div>
			{/* Клиентский компонент для пагинации */}
			<HomeClient initialProducts={initialProducts} />
		</div>
	)
}
