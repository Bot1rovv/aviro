import { getPoizonProducts, searchProductsByKeyword, searchTaobaoProductsByKeyword } from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import type { TaobaoProductResponse } from '@/types/api'
import { ProductItem } from '@/types/product'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const PER_SOURCE_LIMIT = 6
const TOTAL_LIMIT = 12
const SOURCE_TIMEOUT_MS = 3500

const safeConvert = (cny: number | null | undefined | typeof NaN) => {
	if (cny === null || cny === undefined || Number.isNaN(cny)) return 0

	try {
		const rub = cnyToRub(cny)
		return rub && rub > 0 ? rub : cny * 13.5
	} catch {
		return cny * 13.5
	}
}

function normalizeRemoteImage(url: unknown): string {
	if (!url) return ''

	const value = String(url).trim()
	if (!value) return ''

	if (value.startsWith('//')) return `https:${value}`
	if (value.startsWith('http://') || value.startsWith('https://')) return value

	return value
}

function pickFirstImage(...candidates: unknown[]): string {
	for (const candidate of candidates) {
		if (Array.isArray(candidate)) {
			for (const item of candidate) {
				const normalized = normalizeRemoteImage(item)
				if (normalized) return normalized
			}
			continue
		}

		const normalized = normalizeRemoteImage(candidate)
		if (normalized) return normalized
	}

	return ''
}

async function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
	return await Promise.race([
		promise,
		new Promise<T>((_, reject) =>
			setTimeout(() => reject(new Error(`${label} timeout after ${SOURCE_TIMEOUT_MS}ms`)), SOURCE_TIMEOUT_MS)
		)
	])
}

async function searchTaobao(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await withTimeout(
			searchTaobaoProductsByKeyword(keyword, {
				page_no: page,
				page_size: PER_SOURCE_LIMIT
			}),
			'taobao'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return items.map((item: TaobaoProductResponse) => {
					const itemAny = item as any
					const rawPrice = String(
						itemAny.price || itemAny.promotionPrice || itemAny.promotion_price || '0'
					).replace(/[^0-9.]/g, '')

					const priceCny = parseFloat(rawPrice) || 0
					const imageUrl = pickFirstImage(
						itemAny.mainImageUrl,
						itemAny.pictUrl,
						itemAny.picUrl,
						itemAny.imageUrl,
						itemAny.image,
						itemAny.images,
						itemAny.picUrls
					)

					return {
						productId: item.itemId ? `taobao_${item.itemId}` : `mock_taobao_${Date.now()}`,
						title: getTaobaoTitle(item),
						price: Math.ceil(safeConvert(priceCny)).toString(),
						imageUrl,
						shopName: item.shopName,
						sales: item.sales,
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

async function search1688(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await withTimeout(
			searchProductsByKeyword(keyword, {
				beginPage: page,
				pageSize: PER_SOURCE_LIMIT
			}),
			'1688'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return items.map((item: Record<string, unknown>) => {
					let price = String(item.price || item.showPrice || item.currentPrice || '0')
					const priceInfo = item.priceInfo

					if (priceInfo && typeof priceInfo === 'object') {
						price = String(
							(priceInfo as Record<string, unknown>).price ||
								(priceInfo as Record<string, unknown>).consignPrice ||
								price
						)
					} else if (priceInfo && typeof priceInfo === 'string') {
						const match = priceInfo.match(/price[=\s]*(\d+\.?\d*)/i)
						if (match) price = match[1]
					}

					price = price.replace(/[^0-9.]/g, '')
					const priceCny = parseFloat(price) || 0
					const title = String(item.subjectTrans || item.subject || '')
					const imageUrl = pickFirstImage(
						item.imageUrl,
						item.whiteImage,
						item.mainImage,
						item.image,
						item.thumbnailUrl,
						item.images
					)

					return {
						productId: item.offerId ? `1688_${item.offerId}` : `mock_1688_${Date.now()}`,
						title,
						price: Math.ceil(safeConvert(priceCny)).toString(),
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

async function searchPoizon(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const startId = (page - 1) * PER_SOURCE_LIMIT + 1

		const result = await withTimeout(
			getPoizonProducts(keyword, undefined, undefined, {
				startId: String(startId),
				pageSize: PER_SOURCE_LIMIT
			}),
			'poizon'
		)

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.spuList) ? data.spuList : []

				return items.map((item: Record<string, unknown>) => {
					const priceCny = Number(item.authPrice || item.price || 0) / 100
					const imageUrl = pickFirstImage(
						item.image,
						Array.isArray(item.baseImage) ? item.baseImage : [],
						item.imageUrl
					)

					return {
						productId: item.dwSpuId ? `poizon_${item.dwSpuId}` : `mock_poizon_${Date.now()}`,
						title: String(item.distSpuTitle || item.dwSpuTitle || ''),
						price: Math.ceil(safeConvert(priceCny)).toString(),
						imageUrl,
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

export async function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams

	const keyword =
		searchParams.get('q') ||
		searchParams.get('keyword') ||
		searchParams.get('query') ||
		'товары'

	const page = parseInt(searchParams.get('page') || '1', 10)
	const fastMode = searchParams.get('fast') === '1'

	try {
		const promises: Promise<ProductItem[]>[] = [searchTaobao(keyword, page), search1688(keyword, page)]

		if (!fastMode) {
			promises.push(searchPoizon(keyword, page))
		}

		const results = await Promise.all(promises)
		const taobaoProducts = results[0] || []
		const products1688 = results[1] || []
		const poizonProducts = results[2] || []

		const allProducts: ProductItem[] = [...taobaoProducts, ...products1688, ...poizonProducts].slice(
			0,
			TOTAL_LIMIT
		)

		return NextResponse.json(
			{
				success: true,
				data: allProducts,
				sources: {
					taobao: taobaoProducts.length,
					'1688': products1688.length,
					poizon: poizonProducts.length
				}
			},
			{
				headers: {
					'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120'
				}
			}
		)
	} catch (error) {
		console.error('[/api/search-all] Error:', error)

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				data: [],
				sources: {
					taobao: 0,
					'1688': 0,
					poizon: 0
				}
			},
			{ status: 500 }
		)
	}
}