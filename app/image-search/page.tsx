import { PageHeader, Pagination, ProductGrid } from '@/components/ui'
import { getSession } from '@/lib/session-store-db'
import { ProductItem } from '@/types/product'
import { headers } from 'next/headers'

const PAGE_SIZE = 20

interface ImageSearchPageProps {
	searchParams?: Promise<{
		sessionId?: string
		page?: string
	}>
}

async function fetchImageSearchPage(
	sessionId: string,
	page: number
): Promise<{
	products: ProductItem[]
	hasMore: boolean
	total: number
}> {
	// Используем NEXT_PUBLIC_BASE_URL, если задан, иначе вычисляем из headers
	let baseUrl = process.env.NEXT_PUBLIC_BASE_URL
	if (!baseUrl) {
		const headersList = await headers()
		const host = headersList.get('host')
		const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
		baseUrl = `${protocol}://${host}`
	}

	// Создаем FormData для запроса к API
	const formData = new FormData()
	formData.append('sessionId', sessionId)
	formData.append('page', page.toString())

	const response = await fetch(`${baseUrl}/api/search-image`, {
		method: 'POST',
		body: formData,
		cache: 'no-store'
	})

	if (!response.ok) {
		throw new Error(`Ошибка HTTP: ${response.status}`)
	}

	const json = await response.json()
	if (!json.success) {
		throw new Error(json.error || 'Неизвестная ошибка API')
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
				<PageHeader
					title="Поиск по изображению"
					subtitle="Сессия не указана"
				/>
				<p className="text-gray-600">Пожалуйста, выполните поиск по изображению с главной страницы.</p>
			</div>
		)
	}

	// Проверяем, существует ли сессия (для отображения ошибки, если истекла)
	const session = await getSession(sessionId)
	if (!session) {
		return (
			<div className="container mx-auto px-4 py-8">
				<PageHeader
					title="Поиск по изображению"
					subtitle="Сессия истекла"
				/>
				<p className="text-gray-600">Сессия поиска истекла или не найдена. Пожалуйста, выполните поиск заново.</p>
			</div>
		)
	}

	let products: ProductItem[] = []
	let hasMore = false
	let total = 0

	try {
		const result = await fetchImageSearchPage(sessionId, currentPage)
		products = result.products
		hasMore = result.hasMore
		total = result.total
	} catch (error) {
		console.error('Ошибка загрузки страницы:', error)
		return (
			<div className="container mx-auto px-4 py-8">
				<PageHeader
					title="Поиск по изображению"
					subtitle="Ошибка загрузки"
				/>
				<p className="text-gray-600">Не удалось загрузить результаты поиска. Пожалуйста, попробуйте позже.</p>
			</div>
		)
	}

	// Определяем источники для отображения в подзаголовке
	const sources = session.sources || ['1688', 'taobao']
	const sourceText = sources.length === 2 ? '1688 и Taobao' : sources.join(', ')

	return (
		<div className="container mx-auto px-4 py-8">
			<PageHeader
				title="Поиск по изображению"
				subtitle={`Найдено товаров: ${total} (источники: ${sourceText})`}
			/>

			<ProductGrid
				products={products}
				loading={false}
				emptyMessage="По изображению ничего не найдено. Попробуйте другое изображение."
			/>

			{(hasMore || currentPage > 1) && (
				<Pagination
					currentPage={currentPage}
					baseUrl="/image-search"
					queryParams={{ sessionId }}
					showNext={hasMore}
				/>
			)}
		</div>
	)
}
