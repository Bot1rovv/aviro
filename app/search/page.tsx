import { Pagination, ProductGrid, SortFilter } from '@/components/ui'
import { searchAllProducts } from '@/lib/server/product-service'
import { ProductItem } from '@/types/product'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Результаты поиска',
	description: 'Найдите товары на платформе'
}

interface SearchPageParams {
	q?: string
	page?: string
	sort?: string
	minPrice?: string
	maxPrice?: string
	sources?: string
}

function parsePrice(value: string | number | undefined): number {
	if (value === undefined) return 0
	return parseFloat(String(value).replace(/[^\d.-]/g, '')) || 0
}

export default async function SearchPage(props: { searchParams: Promise<SearchPageParams> }) {
	const resolvedSearchParams = await props.searchParams

	const query = resolvedSearchParams.q || ''
	const page = parseInt(resolvedSearchParams.page || '1', 10)
	const sort = resolvedSearchParams.sort
	const minPrice = resolvedSearchParams.minPrice ? parseFloat(resolvedSearchParams.minPrice) : undefined
	const maxPrice = resolvedSearchParams.maxPrice ? parseFloat(resolvedSearchParams.maxPrice) : undefined
	const sources = resolvedSearchParams.sources
		? resolvedSearchParams.sources
				.split(',')
				.filter(s => ['taobao', '1688', 'poizon'].includes(s)) as ('taobao' | '1688' | 'poizon')[]
		: undefined

	let results: ProductItem[] = []
	let error: string | null = null

	if (query) {
		try {
			const searchResult = await searchAllProducts(query, page)
			results = [...searchResult.data]

			if (sources && sources.length > 0) {
				results = results.filter(product => product.source && sources.includes(product.source))
			}

			if (minPrice !== undefined) {
				results = results.filter(product => parsePrice(product.price) >= minPrice)
			}

			if (maxPrice !== undefined) {
				results = results.filter(product => parsePrice(product.price) <= maxPrice)
			}

			if (sort === 'price_asc') {
				results.sort((a, b) => parsePrice(a.price) - parsePrice(b.price))
			}

			if (sort === 'price_desc') {
				results.sort((a, b) => parsePrice(b.price) - parsePrice(a.price))
			}

			if (sort === 'title_asc') {
				results.sort((a, b) => String(a.title || '').localeCompare(String(b.title || ''), 'ru'))
			}

			if (sort === 'title_desc') {
				results.sort((a, b) => String(b.title || '').localeCompare(String(a.title || ''), 'ru'))
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Неизвестная ошибка'
			console.error('Search error:', err)
		}
	}

	const queryParams: Record<string, string> = { q: query }
	if (sort) queryParams.sort = sort
	if (minPrice !== undefined) queryParams.minPrice = minPrice.toString()
	if (maxPrice !== undefined) queryParams.maxPrice = maxPrice.toString()
	if (sources && sources.length > 0) queryParams.sources = sources.join(',')

	return (
		<div className="container mx-auto px-4 py-8">
			<h1 className="mb-6 text-3xl font-bold">
				{query ? `Результаты поиска: "${query}"` : 'Поиск товаров'}
			</h1>

			{!query && <p className="text-gray-600">Введите запрос в поле поиска выше.</p>}

			{error && (
				<div className="mb-4 rounded border border-red-400 bg-red-100 px-4 py-3 text-red-700">
					Ошибка при загрузке результатов: {error}
				</div>
			)}

			{query && !error && (
				<>
					<SortFilter className="flex-1" />
					<ProductGrid
						products={results}
						emptyMessage="Товары не найдены. Попробуйте изменить запрос."
					/>

					{results.length > 0 && (
						<Pagination
							currentPage={page}
							baseUrl="/search"
							queryParams={queryParams}
						/>
					)}
				</>
			)}
		</div>
	)
}