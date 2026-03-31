import { ProductDetail } from '@/types/product'
import Link from 'next/link'
import { ProductClient } from './ProductClient'

// ISR: регенерация страницы каждые 5 минут
export const revalidate = 300

async function fetchProduct(productId: string): Promise<{ success: boolean; data?: ProductDetail; error?: string }> {
	try {
		const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/product/${productId}`, {
			next: { revalidate: 300 }
		})

		if (!res.ok) {
			return {
				success: false,
				error: `HTTP error: ${res.status}`
			}
		}

		const data = await res.json()

		if (data.success && data.data) {
			return { success: true, data: data.data }
		}

		return {
			success: false,
			error: data.error || 'Product not found'
		}
	} catch (error) {
		console.error('Failed to fetch product:', error)
		return {
			success: false,
			error: 'Failed to load product'
		}
	}
}

interface ProductPageProps {
	params: {
		id: string
	}
}

export default async function ProductPage({ params }: ProductPageProps) {
	const productId = params.id
	const { success, data: product, error } = await fetchProduct(productId)

	if (!success || !product) {
		return (
			<div className="container mx-auto px-4 py-8">
				<div className="py-12 text-center">
					<p className="text-lg text-red-500">{error || 'Товар не найден'}</p>
					<Link
						href="/"
						className="mt-4 inline-block rounded bg-[#0f6b46] px-6 py-2 text-white hover:bg-[#0a4e32]"
					>
						Вернуться на главную
					</Link>
				</div>
			</div>
		)
	}

	return <ProductClient product={product} productId={productId} />
}