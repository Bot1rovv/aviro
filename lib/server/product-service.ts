import {
	getPoizonProductDetail,
	getPoizonProducts,
	getProductDetails as get1688ProductDetails,
	getTaobaoProductDetails,
	searchProductsByKeyword,
	searchTaobaoProductsByKeyword
} from '@/lib/api-client'
import { cnyToRub } from '@/lib/utils/format'
import { getTaobaoTitle } from '@/lib/utils/taobao'
import type { TaobaoProductResponse } from '@/types/api'
import { ProductDetail, ProductItem } from '@/types/product'

const SUSPICIOUS_PRICE_RUB = 40

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

function normalizeNumericString(value: unknown): string {
	return String(value ?? '')
		.replace(',', '.')
		.replace(/[^0-9.]/g, '')
}

function parsePrice(value: unknown): number {
	const normalized = normalizeNumericString(value)
	if (!normalized) return 0

	const parsed = parseFloat(normalized)
	return Number.isFinite(parsed) ? parsed : 0
}

function toRubNumber(cny: number): number {
	if (!Number.isFinite(cny) || cny <= 0) return 0
	return Math.ceil(cnyToRub(cny))
}

function toRubString(cny: number): string {
	return toRubNumber(cny).toString()
}

function isSuspiciousRubPrice(price: string | number): boolean {
	const numeric = typeof price === 'number' ? price : parsePrice(price)
	return numeric > 0 && numeric <= SUSPICIOUS_PRICE_RUB
}

function extractTaobaoPriceCny(item: Record<string, unknown>): number {
	const candidates = [
		item.promotionPrice,
		item.promotion_price,
		item.zkFinalPrice,
		item.price,
		item.salePrice,
		item.finalPrice
	]

	for (const candidate of candidates) {
		const price = parsePrice(candidate)
		if (price > 0) {
			return price > 10000 ? price / 100 : price
		}
	}

	return 0
}

function extract1688PriceCny(item: Record<string, unknown>): number {
	const productSaleInfo = item.productSaleInfo as Record<string, unknown> | undefined
	const priceRangeList = productSaleInfo?.priceRangeList as Array<Record<string, unknown>> | undefined

	if (Array.isArray(priceRangeList) && priceRangeList.length > 0) {
		for (const range of priceRangeList) {
			const price = parsePrice(range?.price)
			if (price > 0) return price
		}
	}

	const productSkuInfos = item.productSkuInfos as Array<Record<string, unknown>> | undefined
	if (Array.isArray(productSkuInfos) && productSkuInfos.length > 0) {
		let minSkuPrice = 0

		for (const sku of productSkuInfos) {
			const fenxiaoPriceInfo = sku.fenxiaoPriceInfo as Record<string, unknown> | undefined
			const skuPrice =
				parsePrice(fenxiaoPriceInfo?.offerPrice) ||
				parsePrice(sku.consignPrice) ||
				parsePrice(sku.price)

			if (skuPrice > 0 && (minSkuPrice === 0 || skuPrice < minSkuPrice)) {
				minSkuPrice = skuPrice
			}
		}

		if (minSkuPrice > 0) return minSkuPrice
	}

	const priceInfo = item.priceInfo as Record<string, unknown> | string | undefined

	if (priceInfo && typeof priceInfo === 'object') {
		const objectPrice =
			parsePrice((priceInfo as Record<string, unknown>).price) ||
			parsePrice((priceInfo as Record<string, unknown>).consignPrice)
		if (objectPrice > 0) return objectPrice
	}

	if (typeof priceInfo === 'string') {
		const matched = parsePrice(priceInfo)
		if (matched > 0) return matched
	}

	return (
		parsePrice(item.price) ||
		parsePrice(item.showPrice) ||
		parsePrice(item.currentPrice) ||
		parsePrice(item.referencePrice)
	)
}

function extractPoizonPriceCny(item: Record<string, unknown>): number {
	const candidates = [item.authPrice, item.price, item.minPrice, item.minBidPrice]

	for (const candidate of candidates) {
		const price = parsePrice(candidate)
		if (price > 0) {
			return price > 1000 ? price / 100 : price
		}
	}

	return 0
}

function extractTaobaoDetailPriceRub(data: Record<string, unknown>): number {
	const promotionPriceCny = parsePrice(data.promotionPrice) / 100
	const priceCny = parsePrice(data.price) / 100
	const mainPriceCny = promotionPriceCny || priceCny || 0

	if (mainPriceCny > 0) return toRubNumber(mainPriceCny)

	const skuList = data.skuList as Array<Record<string, unknown>> | undefined
	if (Array.isArray(skuList) && skuList.length > 0) {
		let minSkuPriceCny = 0

		for (const sku of skuList) {
			const skuPromotionPrice = parsePrice(sku.promotionPrice) / 100
			const skuPrice = parsePrice(sku.price) / 100
			const current = skuPromotionPrice || skuPrice || 0

			if (current > 0 && (minSkuPriceCny === 0 || current < minSkuPriceCny)) {
				minSkuPriceCny = current
			}
		}

		if (minSkuPriceCny > 0) return toRubNumber(minSkuPriceCny)
	}

	return 0
}

function extract1688DetailPriceRub(data: Record<string, unknown>): number {
	const cny = extract1688PriceCny(data)
	return toRubNumber(cny)
}

function extractPoizonDetailPriceRub(data: Record<string, unknown>): number {
	const cny = extractPoizonPriceCny(data)
	if (cny > 0) return toRubNumber(cny)

	const skuList = data.skuList as Array<Record<string, unknown>> | undefined
	if (Array.isArray(skuList) && skuList.length > 0) {
		let minSkuPriceCny = 0

		for (const sku of skuList) {
			const current = parsePrice(sku.minBidPrice) / 100
			if (current > 0 && (minSkuPriceCny === 0 || current < minSkuPriceCny)) {
				minSkuPriceCny = current
			}
		}

		if (minSkuPriceCny > 0) return toRubNumber(minSkuPriceCny)
	}

	return 0
}

async function resolveTaobaoListPrice(itemId: string, fallbackPrice: string): Promise<string> {
	if (!itemId || !isSuspiciousRubPrice(fallbackPrice)) return fallbackPrice

	try {
		const result = await getTaobaoProductDetails(itemId, 'ru')
		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>
			if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
				const detailPrice = extractTaobaoDetailPriceRub(obj.data as Record<string, unknown>)
				if (detailPrice > 0) return String(detailPrice)
			}
		}
	} catch (error) {
		console.error('[product-service] resolveTaobaoListPrice error:', error)
	}

	return fallbackPrice
}

async function resolve1688ListPrice(offerId: string, fallbackPrice: string): Promise<string> {
	if (!offerId || !isSuspiciousRubPrice(fallbackPrice)) return fallbackPrice

	try {
		const result = await get1688ProductDetails(offerId, 'ru')
		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>
			if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
				const detailPrice = extract1688DetailPriceRub(obj.data as Record<string, unknown>)
				if (detailPrice > 0) return String(detailPrice)
			}
		}
	} catch (error) {
		console.error('[product-service] resolve1688ListPrice error:', error)
	}

	return fallbackPrice
}

async function resolvePoizonListPrice(dwSpuId: string, fallbackPrice: string): Promise<string> {
	if (!dwSpuId || !isSuspiciousRubPrice(fallbackPrice)) return fallbackPrice

	try {
		const result = await getPoizonProductDetail(dwSpuId)
		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.success === true && obj.data && typeof obj.data === 'object') {
				const innerData = obj.data as Record<string, unknown>
				if (innerData.code === 200 && innerData.data && typeof innerData.data === 'object') {
					const detailPrice = extractPoizonDetailPriceRub(innerData.data as Record<string, unknown>)
					if (detailPrice > 0) return String(detailPrice)
				}
			}

			if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
				const detailPrice = extractPoizonDetailPriceRub(obj.data as Record<string, unknown>)
				if (detailPrice > 0) return String(detailPrice)
			}
		}
	} catch (error) {
		console.error('[product-service] resolvePoizonListPrice error:', error)
	}

	return fallbackPrice
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

async function searchTaobao(keyword: string, page: number): Promise<ProductItem[]> {
	try {
		const result = await searchTaobaoProductsByKeyword(keyword, {
			page_no: page,
			page_size: 10
		})

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return await Promise.all(
					items.map(async (item: TaobaoProductResponse) => {
						const itemAny = item as unknown as Record<string, unknown>
						const priceCny = extractTaobaoPriceCny(itemAny)
						const basePrice = toRubString(priceCny)
						const resolvedPrice = await resolveTaobaoListPrice(String(item.itemId || ''), basePrice)

						return {
							productId: `taobao_${item.itemId}` || `mock_taobao_${Date.now()}`,
							title: getTaobaoTitle(item),
							price: resolvedPrice,
							imageUrl: proxifyImage(getTaobaoImage(item)),
							shopName: item.shopName,
							sales: Number(item.sales || 0),
							source: 'taobao' as const
						}
					})
				)
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
		const result = await searchProductsByKeyword(keyword, {
			beginPage: page,
			pageSize: 10
		})

		if (result && typeof result === 'object') {
			const obj = result as Record<string, unknown>

			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : []

				return await Promise.all(
					items.map(async (item: Record<string, unknown>) => {
						const title = String(item.subjectTrans || item.subject || '')
						const imageUrl = get1688Image(item)
						const priceCny = extract1688PriceCny(item)
						const basePrice = toRubString(priceCny)
						const resolvedPrice = await resolve1688ListPrice(String(item.offerId || ''), basePrice)

						return {
							productId: `1688_${item.offerId}` || `mock_1688_${Date.now()}`,
							title,
							price: resolvedPrice,
							imageUrl: proxifyImage(imageUrl),
							shopName: String(item.companyName || ''),
							sales: Number(item.monthSold || item.soldOut || 0),
							source: '1688' as const
						}
					})
				)
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

				return await Promise.all(
					items.map(async (item: Record<string, unknown>) => {
						const priceCny = extractPoizonPriceCny(item)
						const basePrice = toRubString(priceCny)
						const resolvedPrice = await resolvePoizonListPrice(String(item.dwSpuId || ''), basePrice)

						return {
							productId: `poizon_${item.dwSpuId}` || `mock_poizon_${Date.now()}`,
							title: String(item.distSpuTitle || item.dwSpuTitle || ''),
							price: resolvedPrice,
							imageUrl: proxifyImage(getPoizonImage(item)),
							shopName: String(item.distBrandName || ''),
							sales: Number(item.sales || 0),
							source: 'poizon' as const
						}
					})
				)
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
