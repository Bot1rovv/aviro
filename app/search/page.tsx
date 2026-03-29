import { Pagination, ProductGrid, SortFilter } from '@/components/ui'
import { searchAllProducts, SearchOptions, UnifiedProduct } from '@/lib/api-client'
import { ProductItem } from '@/types/product'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Результаты поиска',
	description: 'Найдите товары на платформе'
}

interface SearchPageParams {
	q?: string
	page?: string
	sort?: string // price_asc, price_desc, title_asc, title_desc
	minPrice?: string
	maxPrice?: string
	sources?: string // через запятую: taobao,1688,poizon
}

export default async function SearchPage(props: { searchParams: Promise<SearchPageParams> }) {
	const resolvedSearchParams = await props.searchParams
	const query = resolvedSearchParams.q || ''
	const page = parseInt(resolvedSearchParams.page || '1', 10)
	const sort = resolvedSearchParams.sort
	const minPrice = resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined
	const maxPrice = resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined
	const sources = resolvedSearchParams.sources
		? (resolvedSearchParams.sources.split(',').filter(s => ['taobao', '1688', 'poizon'].includes(s)) as ('taobao' | '1688' | 'poizon')[])
		: undefined

	// Преобразуем sort в sortByPrice и sortByName для API
	let sortByPrice: 'asc' | 'desc' | undefined = undefined
	let sortByName: 'asc' | 'desc' | undefined = undefined
	if (sort === 'price_asc') sortByPrice = 'asc'
	if (sort === 'price_desc') sortByPrice = 'desc'
	if (sort === 'title_asc') sortByName = 'asc'
	if (sort === 'title_desc') sortByName = 'desc'

	let results: ProductItem[] = []
	let error: string | null = null
	const currentPage = page
	let sourceCounts = { taobao: 0, '1688': 0, poizon: 0 }

	if (query) {
		try {
			// Опции сортировки и фильтрации
			const options: SearchOptions = {
				sortByPrice,
				sortByName,
				minPrice,
				maxPrice,
				sources
			}

			const searchResult = await searchAllProducts(query, page, 10, options)

			// Преобразуем результаты в формат для отображения
			results = searchResult.products.map((p: UnifiedProduct) => ({
				productId: p.id,
				title: p.title,
				price: Math.round(p.price).toString(),
				imageUrl: p.image,
				shopName: p.shopName,
				sales: p.sales,
				source: p.source
			}))

			sourceCounts = searchResult.sources
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка'
			console.error('Search error:', err)
		}
	}

	// Параметры для передачи в компоненты (чтобы сохранять в URL)
	const queryParams: Record<string, string> = { q: query }
	if (sort) queryParams.sort = sort
	if (minPrice !== undefined) queryParams.minPrice = minPrice.toString()
	if (maxPrice !== undefined) queryParams.maxPrice = maxPrice.toString()
	if (sources) queryParams.sources = sources.join(',')

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="text-3xl font-bold mb-6">{query ? `Результаты поиска: "${query}"` : 'Поиск товаров'}</h1>

			{!query && <p className="text-gray-600">Введите запрос в поле поиска выше.</p>}

			{error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">Ошибка при загрузке результатов: {error}</div>}

			{query && !error && (
				<>
					<SortFilter className="flex-1" />
					<ProductGrid
						products={results}
						emptyMessage="Товары не найдены. Попробуйте изменить запрос."
					/>

					{results.length > 0 && (
						<Pagination
							currentPage={currentPage}
							baseUrl="/search"
							queryParams={queryParams}
						/>
					)}
				</>
			)}
		</div>
	)
}
