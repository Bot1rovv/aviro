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
		const res = await fetch(
			`${baseUrl}/api/search-all?keyword=${encodeURIComponent(keyword)}&page=${page}`,
			{
				next: { revalidate: 60 }
			}
		)

		if (!res.ok) {
			throw new Error(`Search API error: ${res.status}`)
		}

		return await res.json()
	} catch (error) {
		if (process.env.NODE_ENV !== 'production') {
			console.error('API fetch failed:', error)
		}

		return {
			success: false,
			data: [],
			total: 0,
			hasMore: false,
			sources: {
				taobao: 0,
				'1688': 0,
				poizon: 0
			}
		}
	}
}