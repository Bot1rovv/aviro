import { getPoizonProducts, searchProductsByKeyword, searchTaobaoProductsByKeyword } from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import { ProductItem } from '@/types/product'
import type { TaobaoProductResponse } from '@/types/api'

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
					const priceCny = parseFloat(item.price) || 0

					return {
						productId: `taobao_${item.itemId}` || `mock_taobao_${Date.now()}`,
						title: getTaobaoTitle(item),
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl: item.mainImageUrl || 'https://via.placeholder.com/300',
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
					const imageUrl = String(item.imageUrl || item.whiteImage || '')
					const priceCny = parseFloat(price) || 0

					return {
						productId: `1688_${item.offerId}` || `mock_1688_${Date.now()}`,
						title,
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl: imageUrl || 'https://via.placeholder.com/300',
						shopName: String(item.companyName || ''),
						sales: Number(item.monthSold || 0),
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
					const priceCny = Number(item.authPrice || 0) / 100

					return {
						productId: `poizon_${item.dwSpuId}` || `mock_poizon_${Date.now()}`,
						title: String(item.distSpuTitle || item.dwSpuTitle || ''),
						price: cnyToRub(priceCny).toFixed(2),
						imageUrl: String(item.image || (Array.isArray(item.baseImage) ? item.baseImage[0] : '')),
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
			imageUrl: 'https://via.placeholder.com/300',
			source: productId.startsWith('taobao') ? 'taobao' : productId.startsWith('poizon') ? 'poizon' : '1688',
			shopName: 'Магазин',
			sales: 100
		}
	}
}