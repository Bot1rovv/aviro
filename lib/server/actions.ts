'use server'

import { ProductItem } from '@/types/product'
import { searchAllProducts } from './product-service'

const KEYWORDS = ['одежда', 'обувь', 'телефон']
const PER_PAGE = 12

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
		const keyword = KEYWORDS[(page - 1) % KEYWORDS.length]
		const result = await searchAllProducts(keyword, page)

		return {
			success: result.success,
			data: result.data.slice(0, PER_PAGE),
			sources: result.sources
		}
	} catch (error) {
		console.error('Server Action loadProductsPage error:', error)
		return {
			success: false,
			data: []
		}
	}
}

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
