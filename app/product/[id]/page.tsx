import { ProductDetail } from '@/types/product'
import Link from 'next/link'
import { ProductClient } from './ProductClient'

// ISR: регенерация страницы каждые 5 минут
export const revalidate = 300

async function fetchProduct(productId: string): Promise<{ success: boolean; data?: ProductDetail; error?: string }> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/product/${productId}`, {
			next: { revalidate: 300 } // кэширование на 5 минут
		})
		const data = await res.json()
		if (data.success && data.data) {
			return { success: true, data: data.data }
		} else {
			return { success: false, error: data.error || 'Product not found' }
		}
	} catch (error) {
		console.error('Failed to fetch product:', error)
		return { success: false, error: 'Failed to load product' }
	}
}

interface ProductPageProps {
	params: {
		id: string
	}
}

export default async function ProductPage({ params }: ProductPageProps) {
	const { id } = await params
	const productId = id
	const { success, data: product, error } = await fetchProduct(productId)

	if (!success || !product) {
		// Обработка ошибки - можно показать страницу с ошибкой
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="text-center py-12">
					<p className="text-red-500 text-lg">{error || 'Товар не найден'}</p>
					<Link
						href="/"
						className="inline-block mt-4 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					>
						Вернуться на главную
					</Link>
				</div>
			</div>
		)
	}

	return (
		<ProductClient
			product={product}
			productId={productId}
		/>
	)
}
