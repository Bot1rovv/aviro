import {
	getPoizonProducts,
	searchProductsByKeyword,
	searchTaobaoProductsByKeyword
} from '@/lib/api-client'
import { getFromCache, setToCache } from '@/lib/utils/cache'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import type { TaobaoProductResponse } from '@/types/api'
import { ProductDetail, ProductItem } from '@/types/product'

const TOTAL_LIMIT = 12
const PRIMARY_SOURCE_TIMEOUT_MS = 2200
const SECONDARY_SOURCE_TIMEOUT_MS = 1800
const SEARCH_CACHE_TTL = 1000 * 60

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
	return Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
		)
	])
}

function normalizeImage(url: unknown): string {
	if (!url) return ''

	const value = String(url).trim()
	if (!value) return ''

	if (value.startsWith('//')) return `https:${value}`

	return value
}

function getFirstImageFromArray(value: unknown): string {
	if (!Array.isArray(value) || value.length === 0) return ''
	return normalizeImage(value[0])
}

function get1688Image(item: Record<string, unknown>): string {
	const direct =
		normalizeImage(item.imageUrl) ||
		normalizeImage(item.whiteImage) ||
		normalizeImage(item.image) ||
		normalizeImage(item.picUrl)

	if (direct) return direct

	const productImage = item.productImage as Record<string, unknown> | undefined
	if (productImage) {
		const fromProductImage =
			getFirstImageFromArray(productImage.images) ||
			normalizeImage(productImage.imageUrl) ||
			normalizeImage(productImage.image)
		if (fromProductImage) return fromProductImage
	}

	const imageObj = item.image as Record<string, unknown> | undefined
	if (imageObj && typeof imageObj === 'object') {
		const fromImageObj =
			getFirstImageFromArray(imageObj.images) ||
			normalizeImage(imageObj.imageUrl) ||
			normalizeImage(imageObj.image)
		if (fromImageObj) return fromImageObj
	}

	return ''
}

function getTaobaoImage(item: TaobaoProductResponse): string {
	const itemAny = item as unknown as Record<string, unknown>

	return (
		normalizeImage(item.mainImageUrl) ||
		normalizeImage(itemAny.mainImage) ||
		normalizeImage(itemAny.mainPic) ||
		normalizeImage(itemAny.pictUrl) ||
		normalizeImage(itemAny.picUrl) ||
		getFirstImageFromArray(itemAny.picUrls) ||
		getFirstImageFromArray(itemAny.images) ||
		''
	)
}

function getPoizonImage(item: Record<string, unknown>): string {
	return (
		normalizeImage(item.image) ||
		getFirstImageFromArray(item.baseImage) ||
		getFirstImageFromArray(item.images) ||
		''
	)
}

async function searchTaobao(keyword: string, page: number, limit: number): Promise<ProductItem[]> {
	try {
		const result = await withTimeout(
			searchTaobaoProductsByKeyword(keyword, {
				page_no: page,
				page_size: limit
			}),
			SECONDARY_SOURCE_TIMEOUT_MS,
			'taobao'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return items.map((item: TaobaoProductResponse) => {
					const itemAny = item as unknown as Record<string, unknown>
					const rawPrice = String(
						itemAny.price || itemAny.promotionPrice || itemAny.promotion_price || '0'
					).replace(/[^0-9.]/g, '')

					const priceCny = parseFloat(rawPrice) || 0

					return {
						productId: `taobao_${item.itemId}` || `mock_taobao_${Date.now()}`,
						title: getTaobaoTitle(item),
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl: getTaobaoImage(item),
						shopName: item.shopName,
						sales: Number(item.sales || 0),
						source: 'taobao' as const
					}
				})
			}
		}

		return []
	} catch (error) {
		console.error('Taobao search error:', error)
		return []
	}
}

async function search1688(keyword: string, page: number, limit: number): Promise<ProductItem[]> {
	try {
		const result = await withTimeout(
			searchProductsByKeyword(keyword, {
				beginPage: page,
				pageSize: limit
			}),
			PRIMARY_SOURCE_TIMEOUT_MS,
			'1688'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return items.map((item: Record<string, unknown>) => {
					let price = '0'
					const priceInfo = item.priceInfo

					if (priceInfo && typeof priceInfo === 'object') {
						price = String(
							(priceInfo as Record<string, unknown>).price ||
								(priceInfo as Record<string, unknown>).consignPrice ||
								'0'
						)
					} else if (priceInfo && typeof priceInfo === 'string') {
						const match = priceInfo.match(/price[=\s]*(\d+\.?\d*)/i)
						if (match) price = match[1]
					}

					const title = String(item.subjectTrans || item.subject || '')
					const imageUrl = get1688Image(item)
					const priceCny = parseFloat(String(price).replace(/[^0-9.]/g, '')) || 0

					return {
						productId: `1688_${item.offerId}` || `mock_1688_${Date.now()}`,
						title,
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl,
						shopName: String(item.companyName || ''),
						sales: Number(item.monthSold || item.soldOut || 0),
						source: '1688' as const
					}
				})
			}
		}

		return []
	} catch (error) {
		console.error('1688 search error:', error)
		return []
	}
}

async function searchPoizon(keyword: string, page: number, limit: number): Promise<ProductItem[]> {
	try {
		const startId = (page - 1) * limit + 1

		const result = await withTimeout(
			getPoizonProducts(keyword, undefined, undefined, {
				startId: String(startId),
				pageSize: limit
			}),
			SECONDARY_SOURCE_TIMEOUT_MS,
			'poizon'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.spuList) ? data.spuList : []

				return items.map((item: Record<string, unknown>) => {
					const priceCny = Number(item.authPrice || item.price || 0) / 100

					return {
						productId: `poizon_${item.dwSpuId}` || `mock_poizon_${Date.now()}`,
						title: String(item.distSpuTitle || item.dwSpuTitle || ''),
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl: getPoizonImage(item),
						shopName: String(item.distBrandName || ''),
						sales: Number(item.sales || 0),
						source: 'poizon' as const
					}
				})
			}
		}

		return []
	} catch (error) {
		console.error('Poizon search error:', error)
		return []
	}
}

export async function searchAllProducts(
	keyword: string,
	page: number = 1
): Promise<{
	success: boolean
	data: ProductItem[]
	sources: {
		taobao: number
		'1688': number
		poizon: number
	}
}> {
	const cacheKey = `search:v3:${keyword}:${page}`

	try {
		const cached = await getFromCache(cacheKey)
		if (cached) {
			return cached as {
				success: boolean
				data: ProductItem[]
				sources: {
					taobao: number
					'1688': number
					poizon: number
				}
			}
		}
	} catch {
		// ignore cache read errors
	}

	const products1688 = await search1688(keyword, page, TOTAL_LIMIT)

	if (products1688.length >= TOTAL_LIMIT) {
		const result = {
			success: true,
			data: products1688.slice(0, TOTAL_LIMIT),
			sources: {
				taobao: 0,
				'1688': products1688.length,
				poizon: 0
			}
		}

		try {
			await setToCache(cacheKey, result, SEARCH_CACHE_TTL)
		} catch {
			// ignore cache write errors
		}

		return result
	}

	const needMore = TOTAL_LIMIT - products1688.length
	const taobaoProducts = needMore > 0 ? await searchTaobao(keyword, page, needMore) : []

	let allProducts: ProductItem[] = [...products1688, ...taobaoProducts].slice(0, TOTAL_LIMIT)

	if (allProducts.length < TOTAL_LIMIT) {
		const poizonNeed = TOTAL_LIMIT - allProducts.length
		const poizonProducts = poizonNeed > 0 ? await searchPoizon(keyword, page, poizonNeed) : []
		allProducts = [...allProducts, ...poizonProducts].slice(0, TOTAL_LIMIT)

		const result = {
			success: allProducts.length > 0,
			data: allProducts,
			sources: {
				taobao: taobaoProducts.length,
				'1688': products1688.length,
				poizon: poizonProducts.length
			}
		}

		try {
			await setToCache(cacheKey, result, SEARCH_CACHE_TTL)
		} catch {
			// ignore cache write errors
		}

		return result
	}

	const result = {
		success: allProducts.length > 0,
		data: allProducts,
		sources: {
			taobao: taobaoProducts.length,
			'1688': products1688.length,
			poizon: 0
		}
	}

	try {
		await setToCache(cacheKey, result, SEARCH_CACHE_TTL)
	} catch {
		// ignore cache write errors
	}

	return result
}

export async function getProductDetails(productId: string): Promise<{
	success: boolean
	data?: ProductDetail
	error?: string
}> {
	try {
		const baseUrl =
			process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000'

		const res = await fetch(`${baseUrl}/api/product/${productId}?debug=1`, {
			cache: 'no-store'
		})

		if (!res.ok) {
			return {
				success: false,
				error: `HTTP error: ${res.status}`
			}
		}

		const json = (await res.json()) as {
			success: boolean
			data?: ProductDetail
			error?: string
		}

		if (json.success && json.data) {
			return {
				success: true,
				data: json.data
			}
		}

		return {
			success: false,
			error: json.error || 'Не удалось загрузить товар'
		}
	} catch (error) {
		console.error('getProductDetails error:', error)
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to load product'
		}
	}
}