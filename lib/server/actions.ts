'use server'

import { ProductItem } from '@/types/product'
import { searchAllProducts } from './product-service'

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
		// Используем фиксированные ключевые слова для главной страницы
		const keywords = ['одежда', 'обувь', 'телефон']
		const promises = keywords.map(async keyword => {
			const result = await searchAllProducts(keyword, page)
			return result.data
		})
		const results = await Promise.all(promises)
		const products: ProductItem[] = []
		results.forEach(items => {
			items.forEach(item => {
				products.push(item)
			})
		})
		// Перемешиваем и ограничиваем
		const shuffled = products.sort(() => Math.random() - 0.5).slice(0, 18)
		return {
			success: true,
			data: shuffled,
			sources: {
				taobao: 0,
				'1688': 0,
				poizon: 0
			}
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
