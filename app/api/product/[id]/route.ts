import { getPoizonProductDetail, getProductDetails, getTaobaoProductDetails } from '@/lib/api-client'
import { translate } from '@/lib/translations'
import { getFromCache, setToCache } from '@/lib/utils/cache'
import { cnyToRub } from '@/lib/utils/format'
import { NextRequest, NextResponse } from 'next/server'

/**
 * Обрабатывает description из API.
 * Определяет тип контента и возвращает обработанное значение.
 */
function processDescription(description: unknown): {
	plain: string
	html: string
	type: 'html' | 'base64' | 'text'
} {
	const desc = String(description || '')

	if (!desc) {
		return { plain: '', html: '', type: 'text' }
	}

	try {
		const isBase64 = /^[A-Za-z0-9+/=]+$/.test(desc) && desc.length % 4 === 0
		if (isBase64 || desc.startsWith('data:') || desc.includes(';base64,')) {
			try {
				const decoded = Buffer.from(desc, 'base64').toString('utf-8')
				if (decoded && decoded.length > 0) {
					const isHtml = decoded.includes('<') && decoded.includes('>')
					return {
						plain: isHtml ? decodeHtmlEntities(decoded) : decoded,
						html: isHtml ? decoded : `<p>${escapeHtml(decoded)}</p>`,
						type: 'base64'
					}
				}
			} catch {
				// ignore
			}
		}
	} catch {
		// ignore
	}

	const isHtml = desc.includes('<') && desc.includes('>')

	if (isHtml) {
		return {
			plain: decodeHtmlEntities(desc),
			html: desc,
			type: 'html'
		}
	}

	return {
		plain: desc,
		html: `<p>${escapeHtml(desc)}</p>`,
		type: 'text'
	}
}

/**
 * Экранирует HTML символы
 */
function escapeHtml(text: string): string {
	const map: Record<string, string> = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;'
	}
	return text.replace(/[&<>"']/g, m => map[m])
}

/**
 * Декодирует HTML сущности
 */
function decodeHtmlEntities(text: string): string {
	const map: Record<string, string> = {
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&#039;': "'",
		'&nbsp;': ' '
	}
	return text.replace(/&amp;|&lt;|&gt;|&quot;|&#039;|&nbsp;/g, m => map[m])
}

/**
 * Определяет, является ли ключ характеристикой цвета или размера
 */
function isColorOrSizeKey(key: string): boolean {
	const keyLower = key.toLowerCase()
	return (
		keyLower.includes('color') ||
		keyLower.includes('цвет') ||
		keyLower.includes('颜色') ||
		keyLower.includes('size') ||
		keyLower.includes('размер') ||
		keyLower.includes('尺码')
	)
}

function normalizeRemoteImage(url: unknown): string | undefined {
	if (!url) return undefined

	const value = String(url).trim()
	if (!value) return undefined

	if (value.startsWith('//')) return `https:${value}`
	if (value.startsWith('http://') || value.startsWith('https://')) return value

	return value
}

function extract1688SkuImage(
	sku: Record<string, unknown>,
	skuAttrList?: Array<Record<string, unknown>>
): string | undefined {
	const directCandidates = [
		sku.skuImageUrl,
		sku.imageUrl,
		sku.image,
		sku.thumbUrl,
		sku.thumbnailUrl,
		sku.picUrl
	]

	for (const candidate of directCandidates) {
		const normalized = normalizeRemoteImage(candidate)
		if (normalized) return normalized
	}

	if (skuAttrList && Array.isArray(skuAttrList)) {
		for (const attr of skuAttrList) {
			const attrCandidates = [
				attr.skuImageUrl,
				attr.imageUrl,
				attr.image,
				attr.thumbUrl,
				attr.thumbnailUrl,
				attr.picUrl
			]

			for (const candidate of attrCandidates) {
				const normalized = normalizeRemoteImage(candidate)
				if (normalized) return normalized
			}
		}
	}

	return undefined
}

// Функция преобразования данных 1688 в нужный формат
function transform1688Product(data: Record<string, unknown>) {
	const priceInfo = data.priceInfo as Record<string, unknown> | undefined

	const productImage = data.productImage as Record<string, unknown> | undefined
	const imagesArray = productImage?.images as string[] | undefined
	const mainImage = normalizeRemoteImage(data.imageUrl || data.whiteImage) || ''

	const images = [
		mainImage,
		...((imagesArray || []).map(img => normalizeRemoteImage(img)).filter(Boolean) as string[])
	]
		.filter(Boolean)
		.filter((img, index, arr) => arr.indexOf(img) === index)

	const productAttribute = data.productAttribute as Array<Record<string, unknown>> | undefined
	const specifications: Record<string, string> = {}

	if (productAttribute && Array.isArray(productAttribute)) {
		productAttribute.forEach(attr => {
			const name = translate(String(attr.attributeNameTrans || ''))
			const value = translate(String(attr.valueTrans || ''))
			const hasChinese = /[\u4e00-\u9fff]/.test(name)
			if (name && value && !hasChinese && !isColorOrSizeKey(name)) {
				specifications[name] = value
			}
		})
	}

	const sellerDataInfo = data.sellerDataInfo as Record<string, unknown> | undefined
	const repeatPurchasePercent = sellerDataInfo?.repeatPurchasePercent
		? parseFloat(String(sellerDataInfo.repeatPurchasePercent))
		: undefined

	const tradeScore = data.tradeScore ? parseFloat(String(data.tradeScore)) : undefined
	const sellerRating = tradeScore
		? {
				overall: tradeScore,
				compositeService: sellerDataInfo?.compositeServiceScore
					? parseFloat(String(sellerDataInfo.compositeServiceScore))
					: undefined,
				logistics: sellerDataInfo?.logisticsExperienceScore
					? parseFloat(String(sellerDataInfo.logisticsExperienceScore))
					: undefined,
				disputeComplaint: sellerDataInfo?.disputeComplaintScore
					? parseFloat(String(sellerDataInfo.disputeComplaintScore))
					: undefined,
				offerExperience: sellerDataInfo?.offerExperienceScore
					? parseFloat(String(sellerDataInfo.offerExperienceScore))
					: undefined,
				consultingExperience: sellerDataInfo?.consultingExperienceScore
					? parseFloat(String(sellerDataInfo.consultingExperienceScore))
					: undefined,
				afterSalesExperience: sellerDataInfo?.afterSalesExperienceScore
					? parseFloat(String(sellerDataInfo.afterSalesExperienceScore))
					: undefined
			}
		: undefined

	const monthlySales = data.monthlySold ? Number(data.monthlySold) : undefined

	const productSkuInfos = data.productSkuInfos as Array<Record<string, unknown>> | undefined
	const skuOptions: Array<{
		skuId: string
		price: number
		originalPrice?: number
		stock: number
		attributes: Record<string, string>
		image?: string
	}> = []

	let minSkuPrice = 0

	if (productSkuInfos && Array.isArray(productSkuInfos)) {
		productSkuInfos.forEach(sku => {
			const skuAttributes: Record<string, string> = {}
			const skuAttrList = sku.skuAttributes as Array<Record<string, unknown>> | undefined

			if (skuAttrList && Array.isArray(skuAttrList)) {
				skuAttrList.forEach(attr => {
					const name = translate(String(attr.attributeNameTrans || ''))
					const value = translate(String(attr.valueTrans || ''))
					const hasChinese = /[\u4e00-\u9fff]/.test(name)
					if (name && !hasChinese) {
						skuAttributes[name] = value
					}
				})
			}

			const skuImageUrl = extract1688SkuImage(sku, skuAttrList)

			const fenxiaoPriceInfo = sku.fenxiaoPriceInfo as Record<string, unknown> | undefined
			const skuPrice = fenxiaoPriceInfo?.offerPrice
				? parseFloat(String(fenxiaoPriceInfo.offerPrice))
				: parseFloat(String(sku.consignPrice || sku.price || 0))

			if (skuPrice > 0 && (minSkuPrice === 0 || skuPrice < minSkuPrice)) {
				minSkuPrice = skuPrice
			}

			skuOptions.push({
				skuId: String(sku.skuId || ''),
				price: Math.ceil(cnyToRub(skuPrice)),
				originalPrice: undefined,
				stock: Number(sku.amountOnSale || 0),
				attributes: skuAttributes,
				image: skuImageUrl || mainImage
			})
		})
	}

	const mainVideo = data.mainVideo as string | null
	const detailVideo = data.detailVideo as string | null

	const descriptionSource = data.descriptionTrans || data.description
	const desc = processDescription(descriptionSource)
	const translatedPlain = translate(desc.plain)

	const productSaleInfo = data.productSaleInfo as Record<string, unknown> | undefined
	const priceRangeList = productSaleInfo?.priceRangeList as Array<Record<string, unknown>> | undefined

	let currentPrice = 0
	let originalPrice = 0

	if (priceRangeList && Array.isArray(priceRangeList) && priceRangeList.length > 0) {
		const firstPriceRange = priceRangeList[0] as Record<string, unknown>
		currentPrice = parseFloat(String(firstPriceRange.price || 0))
	}

	if (currentPrice === 0 && minSkuPrice > 0) {
		currentPrice = minSkuPrice
	}

	if (currentPrice === 0) {
		currentPrice = parseFloat(String(priceInfo?.price || priceInfo?.consignPrice || 0))
	}

	if (priceRangeList && Array.isArray(priceRangeList) && priceRangeList.length > 1) {
		const secondPriceRange = priceRangeList[1] as Record<string, unknown>
		originalPrice = parseFloat(String(secondPriceRange.price || 0))
	}

	if (originalPrice === 0) {
		originalPrice = parseFloat(String(priceInfo?.originalPrice || 0))
	}

	const priceRanges: Array<{
		minQuantity: number
		price: number
		promotionPrice?: number
	}> = []

	if (priceRangeList && Array.isArray(priceRangeList)) {
		priceRangeList.forEach(range => {
			const minQty = Number(range.startQuantity || 0)
			const priceCny = parseFloat(String(range.price || 0))
			const promotionPriceCny = range.promotionPrice
				? parseFloat(String(range.promotionPrice))
				: undefined

			priceRanges.push({
				minQuantity: minQty,
				price: Math.ceil(cnyToRub(priceCny)),
				promotionPrice:
					promotionPriceCny !== undefined
						? Math.ceil(cnyToRub(promotionPriceCny))
						: undefined
			})
		})
	}

	return {
		productId: `1688_${data.offerId}`,
		title: translate(String(data.subjectTrans || data.subject || '')),
		price: Math.ceil(cnyToRub(currentPrice) || 0),
		originalPrice:
			originalPrice > currentPrice ? Math.ceil(cnyToRub(originalPrice)) : undefined,
		image: mainImage,
		images: images.slice(0, 10),
		shopName: translate(String(data.companyName || '')),
		sales: Number(data.soldOut || 0),
		monthlySales,
		repeatPurchasePercent,
		sellerRating,
		priceRanges,
		source: '1688' as const,
		description: translatedPlain,
		descriptionHtml: desc.html,
		descriptionType: desc.type,
		specifications,
		videos: [mainVideo, detailVideo]
			.map(video => normalizeRemoteImage(video))
			.filter(Boolean),
		skuOptions: skuOptions.slice(0, 50),
		productUrl: data.offerDetailUrl ? String(data.offerDetailUrl) : undefined,
		category: data.categoryName ? translate(String(data.categoryName)) : undefined
	}
}

// Функция преобразования данных Taobao в нужный формат
function transformTaobaoProduct(data: Record<string, unknown>) {
	const multiLanguageInfo = data.multiLanguageInfo as Record<string, unknown> | undefined

	const picUrls = data.picUrls as string[] | undefined
	const mainImage =
		normalizeRemoteImage((multiLanguageInfo?.mainImageUrl as string) || data.mainImageUrl || data.pictUrl) ||
		''

	const images = [
		mainImage,
		...((picUrls || []).map(img => normalizeRemoteImage(img)).filter(Boolean) as string[])
	]
		.filter(Boolean)
		.filter((img, index, arr) => arr.indexOf(img) === index)

	const specifications: Record<string, string> = {}

	if (multiLanguageInfo?.properties && Array.isArray(multiLanguageInfo.properties)) {
		;(multiLanguageInfo.properties as Array<Record<string, unknown>>).forEach(prop => {
			const name = translate(String(prop.propName || ''))
			const value = translate(String(prop.valueName || ''))
			const hasChinese = /[\u4e00-\u9fff]/.test(name)
			if (name && value && !hasChinese && !isColorOrSizeKey(name)) {
				specifications[name] = value
			}
		})
	}

	if (Object.keys(specifications).length === 0) {
		const properties = data.properties as Array<Record<string, unknown>> | undefined
		if (properties && Array.isArray(properties)) {
			properties.forEach(prop => {
				const name = translate(String(prop.propName || ''))
				const value = translate(String(prop.valueName || ''))
				const hasChinese = /[\u4e00-\u9fff]/.test(name)
				if (name && value && !hasChinese && !isColorOrSizeKey(name)) {
					specifications[name] = value
				}
			})
		}
	}

	const skuList = data.skuList as Array<Record<string, unknown>> | undefined
	const skuOptions: Array<{
		skuId: string
		price: number
		originalPrice?: number
		stock: number
		attributes: Record<string, string>
		image?: string
	}> = []

	const skuPropertiesMap = new Map<string, Array<Record<string, unknown>>>()
	if (multiLanguageInfo?.skuProperties && Array.isArray(multiLanguageInfo.skuProperties)) {
		;(multiLanguageInfo.skuProperties as Array<Record<string, unknown>>).forEach(skuProp => {
			const skuId = String(skuProp.skuId || '')
			const props = skuProp.properties as Array<Record<string, unknown>> | undefined
			if (skuId && props) {
				skuPropertiesMap.set(skuId, props)
			}
		})
	}

	const totalSales = skuList?.reduce((sum, sku) => sum + Number(sku.sales || 0), 0) || 0

	if (skuList && Array.isArray(skuList)) {
		skuList.forEach(sku => {
			const skuId = String(sku.skuId || '')
			const translatedProps = skuPropertiesMap.get(skuId)
			const skuAttributes: Record<string, string> = {}

			if (translatedProps && Array.isArray(translatedProps)) {
				translatedProps.forEach(prop => {
					const name = translate(String(prop.propName || ''))
					const value = translate(String(prop.valueName || ''))
					const hasChinese = /[\u4e00-\u9fff]/.test(name)
					if (name && !hasChinese) {
						skuAttributes[name] = value
					}
				})
			} else {
				const skuProps = sku.properties as Array<Record<string, unknown>> | undefined
				if (skuProps && Array.isArray(skuProps)) {
					skuProps.forEach(prop => {
						const name = translate(String(prop.propName || ''))
						const value = translate(String(prop.valueName || ''))
						const hasChinese = /[\u4e00-\u9fff]/.test(name)
						if (name && !hasChinese) {
							skuAttributes[name] = value
						}
					})
				}
			}

			const promotionPrice = parseFloat(String(sku.promotionPrice || 0)) / 100
			const price = parseFloat(String(sku.price || 0)) / 100
			const skuPriceCny = promotionPrice || price || 0
			const skuOriginalCny = price > promotionPrice ? price : undefined

			skuOptions.push({
				skuId,
				price: Math.ceil(cnyToRub(skuPriceCny)),
				originalPrice:
					skuOriginalCny !== undefined ? Math.ceil(cnyToRub(skuOriginalCny)) : undefined,
				stock: Number(sku.quantity || 0),
				attributes: skuAttributes,
				image: normalizeRemoteImage(sku.picUrl) || mainImage
			})
		})
	}

	const titleRaw = multiLanguageInfo?.title
		? String(multiLanguageInfo.title)
		: String(data.title || '')
	const title = translate(titleRaw)

	const desc = processDescription(data.description)
	const translatedPlain = translate(desc.plain)

	const promotionPrice = parseFloat(String(data.promotionPrice || 0)) / 100
	const price = parseFloat(String(data.price || 0)) / 100
	const mainPriceCny = promotionPrice || price || 0
	const mainOriginalCny = price > promotionPrice ? price : undefined

	return {
		productId: `taobao_${data.itemId}`,
		title,
		price: Math.ceil(cnyToRub(mainPriceCny)),
		originalPrice:
			mainOriginalCny !== undefined ? Math.ceil(cnyToRub(mainOriginalCny)) : undefined,
		image: mainImage,
		images: images.slice(0, 10),
		shopName: translate(String(data.shopName || data.nick || '')),
		sales: totalSales || Number(data.sales || 0),
		source: 'taobao' as const,
		description: translatedPlain,
		descriptionHtml: desc.html,
		descriptionType: desc.type,
		specifications,
		videos: [],
		skuOptions: skuOptions.slice(0, 50),
		productUrl: data.itemUrl ? String(data.itemUrl) : undefined,
		category: data.categoryName ? translate(String(data.categoryName)) : undefined
	}
}

// Функция преобразования данных Poizon в нужный формат
function transformPoizonProduct(data: Record<string, unknown>) {
	const priceValueCny = Number(data.authPrice || 0) / 100
	const priceValue = cnyToRub(priceValueCny)

	const mainImage = normalizeRemoteImage(data.image) || ''
	const baseImage = data.baseImage as string[] | undefined
	const images = [
		mainImage,
		...((baseImage || []).map(img => normalizeRemoteImage(img)).filter(Boolean) as string[])
	]
		.filter(Boolean)
		.filter((img, index, arr) => arr.indexOf(img) === index)

	const productDesc = data.productDesc as string | undefined
	const desc = processDescription(productDesc)
	const translatedPlain = translate(desc.plain)

	const specifications: Record<string, string> = {}

	if (data.distBrandName) {
		specifications[translate('Brand')] = translate(String(data.distBrandName))
	}
	if (data.distCategoryl1Name) {
		specifications[translate('Category')] = translate(String(data.distCategoryl1Name))
	}
	if (data.distCategoryl2Name) {
		specifications[translate('Subcategory')] = translate(String(data.distCategoryl2Name))
	}
	if (data.distCategoryl3Name) {
		specifications[translate('Type')] = translate(String(data.distCategoryl3Name))
	}
	if (data.distFitPeopleName) {
		specifications[translate('Gender')] = translate(String(data.distFitPeopleName))
	}
	if (data.material) {
		specifications[translate('Material')] = translate(String(data.material))
	}
	if (data.season) {
		specifications[translate('Season')] = translate(String(data.season))
	}
	if (data.dwDesignerId) {
		specifications[translate('Style ID')] = translate(String(data.dwDesignerId))
	}

	const skuList = data.skuList as Array<Record<string, unknown>> | undefined
	const skuOptions: Array<{
		skuId: string
		price: number
		originalPrice?: number
		stock: number
		attributes: Record<string, string>
		image?: string
	}> = []

	if (skuList && Array.isArray(skuList)) {
		skuList.forEach(sku => {
			const saleAttr = sku.saleAttr as Array<Record<string, unknown>> | undefined
			const skuAttributes: Record<string, string> = {}

			if (saleAttr && Array.isArray(saleAttr)) {
				saleAttr.forEach(attr => {
					const name = translate(String(attr.enName || attr.cnName || ''))
					const value = translate(String(attr.enValue || attr.cnValue || ''))
					if (name && value) {
						skuAttributes[name] = value
					}
				})
			}

			const skuSales = Number(sku.sales || 0)
			const minBidPriceCny = Number(sku.minBidPrice || 0) / 100

			skuOptions.push({
				skuId: String(sku.dwSkuId || sku.distSkuId || ''),
				price: Math.ceil(cnyToRub(minBidPriceCny) || priceValue || 0),
				originalPrice: undefined,
				stock: skuSales,
				attributes: skuAttributes,
				image: normalizeRemoteImage(sku.image) || mainImage
			})
		})
	}

	const totalStock = skuOptions.reduce((sum, sku) => sum + sku.stock, 0)

	return {
		productId: `poizon_${data.dwSpuId}`,
		title: translate(String(data.distSpuTitle || data.dwSpuTitle || '')),
		price: Math.ceil(priceValue) || 0,
		originalPrice: undefined,
		image: mainImage,
		images: images.slice(0, 10),
		shopName: translate(String(data.distBrandName || '')),
		sales: totalStock || Number(data.sales || 0),
		source: 'poizon' as const,
		description: translatedPlain,
		descriptionHtml: desc.html,
		descriptionType: desc.type,
		specifications,
		videos: [],
		skuOptions: skuOptions.slice(0, 50),
		productUrl: data.skuLink ? String(data.skuLink) : undefined,
		category: data.distCategoryl1Name ? translate(String(data.distCategoryl1Name)) : undefined
	}
}

export async function GET(request: NextRequest) {
	const rawId = decodeURIComponent(request.nextUrl.pathname.split('/').pop() || '').trim()

	if (!rawId) {
		return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })
	}

	let source: 'taobao' | '1688' | 'poizon' | null = null

	if (rawId.startsWith('taobao_')) source = 'taobao'
	else if (rawId.startsWith('1688_')) source = '1688'
	else if (rawId.startsWith('poizon_')) source = 'poizon'

	if (!source) {
		return NextResponse.json(
			{ success: false, error: `Unknown product source for id: ${rawId}` },
			{ status: 400 }
		)
	}

	const cleanId = rawId.replace(/^(taobao_|1688_|poizon_)/, '')
	if (!cleanId) {
		return NextResponse.json(
			{ success: false, error: `Invalid product id: ${rawId}` },
			{ status: 400 }
		)
	}

	const debug = request.nextUrl.searchParams.get('debug')
	const cacheKey = `product:${rawId}`

	if (!debug) {
		const cached = await getFromCache(cacheKey)
		if (cached) {
			return NextResponse.json({
				success: true,
				data: cached,
				_debug: { source, cached: true }
			})
		}
	}

	try {
		let result: unknown
		let transformedData: Record<string, unknown> | null = null

		switch (source) {
			case 'taobao': {
				result = await getTaobaoProductDetails(cleanId, 'ru')
				if (result && typeof result === 'object') {
					const obj = result as Record<string, unknown>
					if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
						transformedData = transformTaobaoProduct(obj.data as Record<string, unknown>)
					}
				}
				break
			}

			case 'poizon': {
				result = await getPoizonProductDetail(cleanId)
				if (result && typeof result === 'object') {
					const obj = result as Record<string, unknown>

					if (obj.success === true && obj.data && typeof obj.data === 'object') {
						const innerData = obj.data as Record<string, unknown>
						if (innerData.code === 200 && innerData.data && typeof innerData.data === 'object') {
							transformedData = transformPoizonProduct(innerData.data as Record<string, unknown>)
							break
						}
					}

					if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
						transformedData = transformPoizonProduct(obj.data as Record<string, unknown>)
						break
					}

					if (obj.dwSpuId || obj.distSpuId) {
						transformedData = transformPoizonProduct(obj)
						break
					}
				}
				break
			}

			case '1688': {
				result = await getProductDetails(cleanId, 'ru')
				if (result && typeof result === 'object') {
					const obj = result as Record<string, unknown>
					if (obj.code === 200 && obj.data && typeof obj.data === 'object') {
						transformedData = transform1688Product(obj.data as Record<string, unknown>)
					}
				}
				break
			}
		}

		if (!transformedData) {
			return NextResponse.json(
				{
					success: false,
					error: 'Не удалось загрузить данные товара',
					_debug: { source, rawId, cleanId }
				},
				{ status: 502 }
			)
		}

		await setToCache(cacheKey, transformedData, 1000 * 60 * 5)

		return NextResponse.json({
			success: true,
			data: transformedData,
			_debug: { source, cached: false }
		})
	} catch (error) {
		console.error('[/api/product/[id]] Error:', error)
		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		)
	}
}