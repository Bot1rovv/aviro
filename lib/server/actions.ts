'use server'

import { ProductItem } from '@/types/product'
import { searchAllProducts } from './product-service'

const KEYWORDS = ['одежда', 'обувь', 'телефон']
const PER_PAGE = 18

function shuffleArray<T>(items: T[]): T[] {
	const arr = [...items]
	for (let i = arr.length - 1; i > 0; i -= 1) {
		const j = Math.floor(Math.random() * (i + 1))
		;[arr[i], arr[j]] = [arr[j], arr[i]]
	}
	return arr
}

function dedupeProducts(items: ProductItem[]): ProductItem[] {
	const seen = new Set<string>()

	return items.filter(item => {
		const key = `${item.productId}-${item.source}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

function mixProductsBySource(items: ProductItem[], limit: number): ProductItem[] {
	const taobao = shuffleArray(items.filter(item => item.source === 'taobao'))
	const source1688 = shuffleArray(items.filter(item => item.source === '1688'))
	const poizon = shuffleArray(items.filter(item => item.source === 'poizon'))

	const result: ProductItem[] = []

	while (result.length < limit) {
		let added = false

		if (taobao.length > 0 && result.length < limit) {
			result.push(taobao.shift() as ProductItem)
			added = true
		}

		if (source1688.length > 0 && result.length < limit) {
			result.push(source1688.shift() as ProductItem)
			added = true
		}

		if (poizon.length > 0 && result.length < limit) {
			result.push(poizon.shift() as ProductItem)
			added = true
		}

		if (!added) break
	}

	if (result.length < limit) {
		const leftovers = shuffleArray([...taobao, ...source1688, ...poizon])
		for (const item of leftovers) {
			if (result.length >= limit) break
			result.push(item)
		}
	}

	return result
}

/**
 * Server Action для загрузки страницы товаров
 */
export async function loadProductsPage(page: number = 1): Promise<{
	success: boolean
	data: ProductItem[]
	sources?: {
		taobao: number
		'1688': number
		poizon: number
	}
}> {
	try {
		const promises = KEYWORDS.map(async keyword => {
			const result = await searchAllProducts(keyword, page)
			return {
				data: result.data,
				sources: result.sources
			}
		})

		const results = await Promise.all(promises)

		const allProducts = dedupeProducts(results.flatMap(result => result.data))
		const mixedProducts = mixProductsBySource(allProducts, PER_PAGE)

		const totalSources = results.reduce(
			(acc, result) => {
				acc.taobao += result.sources.taobao
				acc['1688'] += result.sources['1688']
				acc.poizon += result.sources.poizon
				return acc
			},
			{ taobao: 0, '1688': 0, poizon: 0 }
		)

		return {
			success: mixedProducts.length > 0,
			data: mixedProducts,
			sources: totalSources
		}
	} catch (error) {
		console.error('Server Action loadProductsPage error:', error)
		return {
			success: false,
			data: []
		}
	}
}

/**
 * Server Action для поиска товаров по ключевому слову
 */
export async function searchProductsByKeywordAction(
	keyword: string,
	page: number = 1
): Promise<{
	success: boolean
	data: ProductItem[]
	sources?: {
		taobao: number
		'1688': number
		poizon: number
	}
}> {
	try {
		const result = await searchAllProducts(keyword, page)
		return {
			success: result.success,
			data: result.data,
			sources: result.sources
		}
	} catch (error) {
		console.error('Server Action searchProductsByKeywordAction error:', error)
		return {
			success: false,
			data: []
		}
	}
}