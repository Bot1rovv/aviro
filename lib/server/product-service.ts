import { getPoizonProducts, searchProductsByKeyword, searchTaobaoProductsByKeyword } from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import { ProductItem } from '@/types/product'
import type { TaobaoProductResponse } from '@/types/api'

function normalizeImage(url: unknown): string {
	if (!url) return ''

	const value = String(url).trim()
	if (!value) return ''

	if (value.startsWith('//')) return `https:${value}`

	return value
}

function proxifyImage(url: string): string {
	if (!url) return ''
	return `/api/image?url=${encodeURIComponent(url)}`
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

/**
 * Поиск товаров с Taobao
 */
async function searchTaobao(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await searchTaobaoProductsByKeyword(keyword, { page_no: page, page_size: 10 })

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
						imageUrl: proxifyImage(getTaobaoImage(item)),
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

/**
 * Поиск товаров с 1688
 */
async function search1688(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await searchProductsByKeyword(keyword, { beginPage: page, pageSize: 10 })

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
						imageUrl: proxifyImage(imageUrl),
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

/**
 * Поиск товаров с Poizon
 */
async function searchPoizon(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const startId = (page - 1) * 10 + 1

		const result = await getPoizonProducts(keyword, undefined, undefined, {
			startId: String(startId),
			pageSize: 10
		})

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
						imageUrl: proxifyImage(getPoizonImage(item)),
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

/**
 * Универсальный поиск товаров по всем платформам
 */
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
	const [taobaoProducts, products1688, poizonProducts] = await Promise.all([
		searchTaobao(keyword, page).catch(error => {
			console.error('[product-service] Taobao error:', error)
			return []
		}),
		search1688(keyword, page).catch(error => {
			console.error('[product-service] 1688 error:', error)
			return []
		}),
		searchPoizon(keyword, page).catch(error => {
			console.error('[product-service] Poizon error:', error)
			return []
		})
	])

	const allProducts: ProductItem[] = [...taobaoProducts, ...products1688, ...poizonProducts]

	return {
		success: allProducts.length > 0,
		data: allProducts,
		sources: {
			taobao: taobaoProducts.length,
			'1688': products1688.length,
			poizon: poizonProducts.length
		}
	}
}

/**
 * Получение деталей товара по ID (упрощённая версия)
 */
export async function getProductDetails(productId: string): Promise<{
	success: boolean
	data?: ProductItem
	error?: string
}> {
	return {
		success: true,
		data: {
			productId,
			title: 'Товар ' + productId,
			price: '1000',
			imageUrl: '/api/image?url=' + encodeURIComponent('https://via.placeholder.com/300'),
			source: productId.startsWith('taobao')
				? 'taobao'
				: productId.startsWith('poizon')
					? 'poizon'
					: '1688',
			shopName: 'Магазин',
			sales: 100
		}
	}
}