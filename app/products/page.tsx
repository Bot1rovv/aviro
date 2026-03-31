import { PageHeader, Pagination, ProductGrid } from '@/components/ui'
import { searchProducts } from '@/lib/api/search-product'
import categories1688 from '@/lib/data/categories_1688_translated.json'
import { getSession } from '@/lib/session-store-db'
import { getKeywordForCategory } from '@/lib/utils/category'
import type { Category1688 } from '@/types/category'
import { ProductItem } from '@/types/product'

const PRODUCTS_PAGE_SIZE = 20

async function fetchProductsByKeyword(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await searchProducts(keyword, page)

		if (result.success && result.data) {
			return result.data
		}

		return []
	} catch {
		return []
	}
}

interface ProductsPageProps {
	searchParams?: Promise<{
		category?: string
		subcategory?: string
		imageSearch?: string
		results?: string
		sessionId?: string
		page?: string
	}>
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
	const params = await searchParams
	const categoryId = params?.category || null
	const subcategoryId = params?.subcategory || null
	const imageSearch = params?.imageSearch === 'true'
	const imageResultsParam = params?.results
	const sessionId = params?.sessionId
	const currentPage = parseInt(params?.page || '1', 10)

	let imageProducts: ProductItem[] = []

	if (imageSearch) {
		if (sessionId) {
			const sessionData = await getSession(sessionId)

			if (sessionData) {
				imageProducts = sessionData.results
			} else {
				console.error('Сессия истекла или не найдена')
			}
		} else if (imageResultsParam) {
			try {
				imageProducts = JSON.parse(decodeURIComponent(imageResultsParam))
			} catch (e) {
				console.error('Failed to parse image search results:', e)
			}
		}
	}

	let keyword = 'товары'

	if (subcategoryId && categoryId) {
		const categories = categories1688 as Record<string, Category1688>
		const subcatName = categories[categoryId]?.subcategories?.[subcategoryId]

		if (subcatName) {
			const enMatch = subcatName.match(/\(([^)]+)\)/)
			keyword = enMatch ? enMatch[1].toLowerCase() : subcatName.split(' (')[0].toLowerCase()
		}
	} else if (categoryId) {
		keyword = getKeywordForCategory(categoryId, categories1688 as Record<string, Category1688>)
	}

	const initialProducts = imageSearch ? [] : await fetchProductsByKeyword(keyword, currentPage)

	const categories = categories1688 as Record<string, Category1688>
	let categoryTitle = 'Все товары'
	let subcategoryTitle = ''

	if (imageSearch) {
		categoryTitle = 'Поиск по изображению'
	} else if (categoryId && categories[categoryId]) {
		const cat = categories[categoryId]
		categoryTitle = cat.name_ru || cat.name_en || 'Категория'

		if (subcategoryId && cat.subcategories?.[subcategoryId]) {
			subcategoryTitle = cat.subcategories[subcategoryId]
		}
	}

	const displayTitle = subcategoryTitle ? `${categoryTitle} / ${subcategoryTitle}` : categoryTitle
	const displayProducts = imageSearch ? imageProducts : initialProducts

	return (
		<div className="container mx-auto px-4 py-8">
			<PageHeader
				title={displayTitle}
				subtitle={
					imageSearch
						? `Найдено товаров: ${displayProducts.length}`
						: categoryId || currentPage > 1
							? `Страница ${currentPage}`
							: undefined
				}
			/>

			<ProductGrid
				products={displayProducts}
				loading={false}
				emptyMessage={
					imageSearch
						? 'По изображению ничего не найдено. Попробуйте другое изображение.'
						: 'Товары не найдены. Попробуйте выбрать другую категорию.'
				}
			/>

			{!imageSearch && displayProducts.length > 0 && (
				<Pagination
					currentPage={currentPage}
					baseUrl="/products"
					queryParams={{
						...(categoryId && { category: categoryId }),
						...(subcategoryId && { subcategory: subcategoryId })
					}}
					showNext={displayProducts.length >= PRODUCTS_PAGE_SIZE}
				/>
			)}
		</div>
	)
}