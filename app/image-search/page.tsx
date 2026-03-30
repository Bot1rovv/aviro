import { Pagination, ProductGrid } from '@/components/ui'
import { getSession } from '@/lib/session-store-db'
import type { ProductItem } from '@/types/product'

const PAGE_SIZE = 20

interface ImageSearchPageProps {
	searchParams?: Promise<{
		sessionId?: string
		page?: string
	}>
}

type ImageSearchApiResponse = {
	success: boolean
	data?: ProductItem[]
	hasMore?: boolean
	total?: number
	error?: string
}

async function fetchImageSearchPage(sessionId: string, page: number) {
	const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

	const formData = new FormData()
	formData.append('sessionId', sessionId)
	formData.append('page', page.toString())

	const response = await fetch(`${baseUrl}/api/search-image`, {
		method: 'POST',
		body: formData,
		cache: 'no-store'
	})

	const json = (await response.json()) as ImageSearchApiResponse

	if (!response.ok || !json.success) {
		throw new Error(json.error || `Ошибка HTTP: ${response.status}`)
	}

	return {
		products: json.data || [],
		hasMore: json.hasMore || false,
		total: json.total || 0
	}
}

export default async function ImageSearchPage({ searchParams }: ImageSearchPageProps) {
	const params = await searchParams
	const sessionId = params?.sessionId
	const currentPage = parseInt(params?.page || '1', 10)

	if (!sessionId) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="mb-2 text-3xl font-bold">Поиск по изображению</h1>
				<p className="text-gray-600">Сессия не указана. Выполните поиск заново.</p>
			</div>
		)
	}

	const session = await getSession(sessionId)

	if (!session) {
		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="mb-2 text-3xl font-bold">Поиск по изображению</h1>
				<p className="text-gray-600">Сессия истекла или не найдена. Выполните поиск заново.</p>
			</div>
		)
	}

	let products: ProductItem[] = []
	let hasMore = false
	let total = 0

	try {
		if (currentPage === 1 && session.results && session.results.length > 0) {
			products = session.results
			hasMore = session.totalPages ? currentPage < session.totalPages : products.length >= PAGE_SIZE
			total = products.length
		} else {
			const result = await fetchImageSearchPage(sessionId, currentPage)
			products = result.products
			hasMore = result.hasMore
			total = result.total
		}
	} catch (error) {
		console.error('Ошибка загрузки страницы image-search:', error)

		return (
			<div className="container mx-auto px-4 py-8">
				<h1 className="mb-2 text-3xl font-bold">Поиск по изображению</h1>
				<p className="text-gray-600">Не удалось загрузить результаты поиска. Попробуйте позже.</p>
			</div>
		)
	}

	const sources = session.sources || ['1688', 'taobao']
	const sourceText = sources.length === 2 ? '1688 и Taobao' : sources.join(', ')

	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">Поиск по изображению</h1>
				<p className="mt-2 text-gray-600">
					Найдено товаров: {total} (источники: {sourceText})
				</p>
			</div>

			<ProductGrid
				products={products}
				emptyMessage="По изображению ничего не найдено. Попробуйте другое изображение."
			/>

			{(hasMore || currentPage > 1) && (
				<div className="mt-8">
					<Pagination
						currentPage={currentPage}
						baseUrl="/image-search"
						queryParams={{ sessionId }}
						showNext={hasMore}
					/>
				</div>
			)}
		</div>
	)
}