import { ProductItem } from '@/types/product'

export interface SearchResponse {
	success: boolean
	data: ProductItem[]
	total: number
	hasMore: boolean
	sources?: {
		taobao: number
		'1688': number
		poizon: number
	}
}

export async function searchProducts(keyword: string, page: number = 1): Promise<SearchResponse> {
	try {
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''
		const res = await fetch(`${baseUrl}/api/search-all?keyword=${encodeURIComponent(keyword)}&page=${page}`, {
			cache: 'no-store' // или 'force-cache' если можно кэшировать
		})

		return await res.json()
	} catch (error) {
		if (process.env.NODE_ENV !== 'production') {
			console.error('API fetch failed:', error)
		}
		return { success: false, data: [], total: 0, hasMore: false }
	}
}
