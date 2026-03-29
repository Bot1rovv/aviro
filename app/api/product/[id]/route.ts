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

	// Проверяем, является ли строка base64
	try {
		// Проверяем на base64 паттерн (начинается с определённых префиксов или содержит только base64 символы)
		const isBase64 = /^[A-Za-z0-9+/=]+$/.test(desc) && desc.length % 4 === 0
		if (isBase64 || desc.startsWith('data:') || desc.includes(';base64,')) {
			// Пробуем декодировать
			try {
				const decoded = Buffer.from(desc, 'base64').toString('utf-8')
				if (decoded && decoded.length > 0) {
					// Проверяем, является ли декодированный текст HTML
					const isHtml = decoded.includes('<') && decoded.includes('>')
					return {
						plain: isHtml ? decodeHtmlEntities(decoded) : decoded,
						html: isHtml ? decoded : `<p>${escapeHtml(decoded)}</p>`,
						type: 'base64'
					}
				}
			} catch {
				// Не удалось декодировать, продолжаем как есть
			}
		}
	} catch {
		// Игнорируем ошибки проверки base64
	}

	// Проверяем, является ли текст HTML
	const isHtml = desc.includes('<') && desc.includes('>')

	if (isHtml) {
		return {
			plain: decodeHtmlEntities(desc),
			html: desc,
			type: 'html'
		}
	}

	// Обычный текст
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
 * (чтобы исключить их из блока спецификаций, так как они отображаются отдельно)
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
// Функция преобразования данных 1688 в нужный формат
function transform1688Product(data: Record<string, unknown>) {
	const priceInfo = data.priceInfo as Record<string, unknown> | undefined

	// Изображения из productImage.images
	const productImage = data.productImage as Record<string, unknown> | undefined
	const imagesArray = productImage?.images as string[] | undefined
	const mainImage = String(data.imageUrl || data.whiteImage || '')

	// Формируем массив изображений
	const images = [mainImage, ...(imagesArray || [])].filter(Boolean)

	// Характеристики из productAttribute (только переведённые)
	const productAttribute = data.productAttribute as Array<Record<string, unknown>> | undefined
	const specifications: Record<string, string> = {}

	if (productAttribute && Array.isArray(productAttribute)) {
		productAttribute.forEach(attr => {
			// Используем только переводы (Trans), без китайского
			const name = translate(String(attr.attributeNameTrans || ''))
			const value = translate(String(attr.valueTrans || ''))
			// Пропускаем если название содержит китайские символы (CJK диапазон)
			const hasChinese = /[\u4e00-\u9fff]/.test(name)
			if (name && value && !hasChinese && !isColorOrSizeKey(name)) {
				specifications[name] = value
			}
		})
	}

	// Данные о продавце (для повторных покупок и рейтинга)
	const sellerDataInfo = data.sellerDataInfo as Record<string, unknown> | undefined
	const repeatPurchasePercent = sellerDataInfo?.repeatPurchasePercent ? parseFloat(String(sellerDataInfo.repeatPurchasePercent)) : undefined

	// Рейтинг продавца
	const tradeScore = data.tradeScore ? parseFloat(String(data.tradeScore)) : undefined
	const sellerRating = tradeScore
		? {
				overall: tradeScore,
				compositeService: sellerDataInfo?.compositeServiceScore ? parseFloat(String(sellerDataInfo.compositeServiceScore)) : undefined,
				logistics: sellerDataInfo?.logisticsExperienceScore ? parseFloat(String(sellerDataInfo.logisticsExperienceScore)) : undefined,
				disputeComplaint: sellerDataInfo?.disputeComplaintScore ? parseFloat(String(sellerDataInfo.disputeComplaintScore)) : undefined,
				offerExperience: sellerDataInfo?.offerExperienceScore ? parseFloat(String(sellerDataInfo.offerExperienceScore)) : undefined,
				consultingExperience: sellerDataInfo?.consultingExperienceScore ? parseFloat(String(sellerDataInfo.consultingExperienceScore)) : undefined,
				afterSalesExperience: sellerDataInfo?.afterSalesExperienceScore ? parseFloat(String(sellerDataInfo.afterSalesExperienceScore)) : undefined
			}
		: undefined

	// Месячные продажи
	const monthlySales = data.monthlySold ? Number(data.monthlySold) : undefined

	// Варианты (SKU) из productSkuInfos
	const productSkuInfos = data.productSkuInfos as Array<Record<string, unknown>> | undefined
	const skuOptions: Array<{
		skuId: string
		price: number
		originalPrice?: number
		stock: number
		attributes: Record<string, string>
		image?: string
	}> = []

	// Минимальная цена для расчёта основной цены товара
	let minSkuPrice = 0

	if (productSkuInfos && Array.isArray(productSkuInfos)) {
		productSkuInfos.forEach(sku => {
			const skuAttributes: Record<string, string> = {}
			const skuAttrList = sku.skuAttributes as Array<Record<string, unknown>> | undefined
			let skuImageUrl: string | undefined

			if (skuAttrList && Array.isArray(skuAttrList)) {
				skuAttrList.forEach(attr => {
					// Используем только переводы
					const name = translate(String(attr.attributeNameTrans || ''))
					const value = translate(String(attr.valueTrans || ''))
					const hasChinese = /[\u4e00-\u9fff]/.test(name)
					if (name && !hasChinese) {
						skuAttributes[name] = value
					}
					// Сохраняем изображение SKU если есть
					if (attr.skuImageUrl && !skuImageUrl) {
						skuImageUrl = String(attr.skuImageUrl)
					}
				})
			}

			// Цена: сначала fenxiaoPriceInfo.offerPrice, потом consignPrice
			const fenxiaoPriceInfo = sku.fenxiaoPriceInfo as Record<string, unknown> | undefined
			const skuPrice = fenxiaoPriceInfo?.offerPrice
				? parseFloat(String(fenxiaoPriceInfo.offerPrice))
				: parseFloat(String(sku.consignPrice || sku.price || 0))

			// Обновляем минимальную цену
			if (skuPrice > 0 && (minSkuPrice === 0 || skuPrice < minSkuPrice)) {
				minSkuPrice = skuPrice
			}

			skuOptions.push({
				skuId: String(sku.skuId || ''),
				price: Math.ceil(cnyToRub(skuPrice)),
				originalPrice: undefined,
				stock: Number(sku.amountOnSale || 0),
				attributes: skuAttributes,
				image: skuImageUrl
			})
		})
	}

	// Видео
	const mainVideo = data.mainVideo as string | null
	const detailVideo = data.detailVideo as string | null

	// Описание - используем descriptionTrans если есть, иначе description
	const descriptionSource = data.descriptionTrans || data.description
	const desc = processDescription(descriptionSource)
	const translatedPlain = translate(desc.plain)

	// Цена - пробуем получить из нескольких источников (в юанях, конвертируем в рубли):
	// 1. productSaleInfo.priceRangeList[0].price
	// 2. minSkuPrice (минимальная цена из SKU)
	// 3. priceInfo.price/consignPrice
	const productSaleInfo = data.productSaleInfo as Record<string, unknown> | undefined
	const priceRangeList = productSaleInfo?.priceRangeList as Array<Record<string, unknown>> | undefined

	let currentPrice = 0
	let originalPrice = 0

	// Пробуем получить из priceRangeList
	if (priceRangeList && Array.isArray(priceRangeList) && priceRangeList.length > 0) {
		const firstPriceRange = priceRangeList[0] as Record<string, unknown>
		currentPrice = parseFloat(String(firstPriceRange.price || 0))
	}

	// Если нет цены из priceRangeList, пробуем из minSkuPrice
	if (currentPrice === 0 && minSkuPrice > 0) {
		currentPrice = minSkuPrice
	}

	// Фоллбек на priceInfo
	if (currentPrice === 0) {
		currentPrice = parseFloat(String(priceInfo?.price || priceInfo?.consignPrice || 0))
	}

	// Пробуем получить старую цену (вторая строка в priceRangeList)
	if (priceRangeList && Array.isArray(priceRangeList) && priceRangeList.length > 1) {
		const secondPriceRange = priceRangeList[1] as Record<string, unknown>
		originalPrice = parseFloat(String(secondPriceRange.price || 0))
	}

	// Если нет старой цены из priceRangeList, используем priceInfo.originalPrice
	if (originalPrice === 0) {
		originalPrice = parseFloat(String(priceInfo?.originalPrice || 0))
	}

	// Цены за количество
	const priceRanges: Array<{
		minQuantity: number
		price: number
		promotionPrice?: number
	}> = []

	if (priceRangeList && Array.isArray(priceRangeList)) {
		priceRangeList.forEach(range => {
			const minQty = Number(range.startQuantity || 0)
			const priceCny = parseFloat(String(range.price || 0))
			const promotionPriceCny = range.promotionPrice ? parseFloat(String(range.promotionPrice)) : undefined

			priceRanges.push({
				minQuantity: minQty,
				price: Math.ceil(cnyToRub(priceCny)),
				promotionPrice: promotionPriceCny !== undefined ? Math.ceil(cnyToRub(promotionPriceCny)) : undefined
			})
		})
	}

	return {
		productId: `1688_${data.offerId}`,
		title: translate(String(data.subjectTrans || data.subject || '')),
		price: Math.ceil(cnyToRub(currentPrice) || 0),
		originalPrice: originalPrice > currentPrice ? Math.ceil(cnyToRub(originalPrice)) : undefined,
		image: mainImage,
		images: images.slice(0, 10), // Ограничиваем до 10 изображений
		shopName: translate(String(data.companyName || '')),
		sales: Number(data.soldOut || 0),
		monthlySales,
		repeatPurchasePercent: repeatPurchasePercent,
		sellerRating,
		priceRanges,
		source: '1688' as const,
		description: translatedPlain,
		descriptionHtml: desc.html,
		descriptionType: desc.type,
		specifications,
		// Новые поля
		videos: [mainVideo, detailVideo].filter(Boolean),
		skuOptions: skuOptions.slice(0, 50), // Ограничиваем до 50 SKU
		productUrl: data.offerDetailUrl ? String(data.offerDetailUrl) : undefined,
		category: data.categoryName ? translate(String(data.categoryName)) : undefined
	}
}

// Функция преобразования данных Taobao в нужный формат
function transformTaobaoProduct(data: Record<string, unknown>) {
	// Мультиязычная информация (приоритет для русского)
	const multiLanguageInfo = data.multiLanguageInfo as Record<string, unknown> | undefined

	// Изображения - используем mainImageUrl из multiLanguageInfo если есть
	const picUrls = data.picUrls as string[] | undefined
	const mainImage = String((multiLanguageInfo?.mainImageUrl as string) || data.mainImageUrl || data.pictUrl || '')

	const images = [mainImage, ...(picUrls || [])].filter(Boolean)

	// Характеристики - ПРИОРИТЕТ у multiLanguageInfo.properties (на русском!)
	const specifications: Record<string, string> = {}

	// Сначала пробуем взять из multiLanguageInfo.properties
	if (multiLanguageInfo?.properties && Array.isArray(multiLanguageInfo.properties)) {
		;(multiLanguageInfo.properties as Array<Record<string, unknown>>).forEach(prop => {
			const name = translate(String(prop.propName || ''))
			const value = translate(String(prop.valueName || ''))
			// Пропускаем китайские названия
			const hasChinese = /[\u4e00-\u9fff]/.test(name)
			if (name && value && !hasChinese && !isColorOrSizeKey(name)) {
				specifications[name] = value
			}
		})
	}

	// Если характеристик из multiLanguageInfo нет, используем обычные properties
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

	// Варианты (SKU) из skuList - используем skuProperties из multiLanguageInfo если есть
	const skuList = data.skuList as Array<Record<string, unknown>> | undefined
	const skuOptions: Array<{
		skuId: string
		price: number
		originalPrice?: number
		stock: number
		attributes: Record<string, string>
		image?: string
	}> = []

	// Получаем соответствие skuId -> properties из multiLanguageInfo
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

	// Подсчитываем общее количество продаж из всех SKU
	const totalSales = skuList?.reduce((sum, sku) => sum + Number(sku.sales || 0), 0) || 0

	if (skuList && Array.isArray(skuList)) {
		skuList.forEach(sku => {
			const skuId = String(sku.skuId || '')

			// Пробуем получить переведённые свойства из map
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
				// Фоллбек на обычные properties
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
				originalPrice: skuOriginalCny !== undefined ? Math.ceil(cnyToRub(skuOriginalCny)) : undefined,
				stock: Number(sku.quantity || 0),
				attributes: skuAttributes,
				image: sku.picUrl ? String(sku.picUrl) : undefined
			})
		})
	}

	// Название - используем multiLanguageInfo.title если есть
	const titleRaw = multiLanguageInfo?.title ? String(multiLanguageInfo.title) : String(data.title || '')
	const title = translate(titleRaw)

	// Обрабатываем description (на китайском, перевода обычно нет)
	const desc = processDescription(data.description)
	const translatedPlain = translate(desc.plain)

	// Цена (в юанях, конвертируем в рубли)
	const promotionPrice = parseFloat(String(data.promotionPrice || 0)) / 100
	const price = parseFloat(String(data.price || 0)) / 100
	const mainPriceCny = promotionPrice || price || 0
	const mainOriginalCny = price > promotionPrice ? price : undefined

	return {
		productId: `taobao_${data.itemId}`,
		title,
		price: Math.ceil(cnyToRub(mainPriceCny)),
		originalPrice: mainOriginalCny !== undefined ? Math.ceil(cnyToRub(mainOriginalCny)) : undefined,
		image: mainImage,
		images: images.slice(0, 10),
		shopName: translate(String(data.shopName || data.nick || '')),
		sales: totalSales || Number(data.sales || 0),
		source: 'taobao' as const,
		description: translatedPlain,
		descriptionHtml: desc.html,
		descriptionType: desc.type,
		specifications,
		// Новые поля
		videos: [],
		skuOptions: skuOptions.slice(0, 50),
		productUrl: data.itemUrl ? String(data.itemUrl) : undefined,
		category: data.categoryName ? translate(String(data.categoryName)) : undefined
	}
}

// Функция преобразования данных Poizon в нужный формат
function transformPoizonProduct(data: Record<string, unknown>) {
	// Цена - authPrice в копейках юаня (делим на 100), затем конвертируем в рубли
	const priceValueCny = Number(data.authPrice || 0) / 100
	const priceValue = cnyToRub(priceValueCny)

	// Изображения
	const mainImage = String(data.image || '')
	const baseImage = data.baseImage as string[] | undefined
	const images = [mainImage, ...(baseImage || [])].filter(Boolean)

	// Описание - используем productDesc (китайский)
	const productDesc = data.productDesc as string | undefined
	const desc = processDescription(productDesc)
	const translatedPlain = translate(desc.plain)

	// Характеристики - собираем из доступных полей (English优先)
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

	// SKU варианты - новая структура с saleAttr
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
					// Используем английские названия и значения
					const name = translate(String(attr.enName || attr.cnName || ''))
					const value = translate(String(attr.enValue || attr.cnValue || ''))
					if (name && value) {
						skuAttributes[name] = value
					}
				})
			}

			// Суммируем продажи всех SKU для общего числа
			const skuSales = Number(sku.sales || 0)

			// Цена SKU - minBidPrice в копейках юаня (делим на 100), конвертируем в рубли
			const minBidPriceCny = Number(sku.minBidPrice || 0) / 100

			skuOptions.push({
				skuId: String(sku.dwSkuId || sku.distSkuId || ''),
				price: Math.ceil(cnyToRub(minBidPriceCny) || priceValue || 0),
				originalPrice: undefined,
				stock: skuSales, // В Poizon sales = stock (количество на складе)
				attributes: skuAttributes,
				image: sku.image ? String(sku.image) : undefined
			})
		})
	}

	// Подсчитываем общий остаток (сумма всех SKU sales)
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
	const productId = request.nextUrl.pathname.split('/').pop() || ''

	if (!productId) {
		return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 })
	}

	// Определяем источник по префиксу ID
	let source: 'taobao' | '1688' | 'poizon' = '1688'
	if (productId.startsWith('taobao_')) source = 'taobao'
	if (productId.startsWith('poizon_')) source = 'poizon'

	// Извлекаем чистый ID без префикса
	const cleanId = productId.replace(/^(taobao_|1688_|poizon_)/, '')

	// Проверяем параметр debug
	const debug = request.nextUrl.searchParams.get('debug')
	// Проверяем кэш, если не debug
	const cacheKey = `product:${productId}`
	let cached = null
	if (!debug) {
		cached = await getFromCache(cacheKey)
		if (cached) {
			return NextResponse.json({ success: true, data: cached, _debug: { source, cached: true } })
		}
	}

	try {
		let result
		let transformedData: Record<string, unknown>
		let apiError: unknown = undefined

		try {
			switch (source) {
				case 'taobao':
					// Taobao: item_id (обязательно), language (по умолчанию ru)
					result = await getTaobaoProductDetails(cleanId, 'ru')
					if (result && typeof result === 'object') {
						const obj = result as Record<string, unknown>
						if (obj.code === 200 && obj.data) {
							transformedData = transformTaobaoProduct(obj.data as Record<string, unknown>)
							await setToCache(cacheKey, transformedData, 1000 * 60 * 5) // 5 минут

							return NextResponse.json({ success: true, data: transformedData, _debug: { source, rawData: obj.data } })
						}
					}
					break
				case 'poizon':
					// Poizon: dwSpuId (обязательно), dwDesignerId (опционально)
					try {
						result = await getPoizonProductDetail(cleanId)
						if (result && typeof result === 'object') {
							const obj = result as Record<string, unknown>

							// Формат 1: { success: true, data: { code: 200, data: {...} } }
							if (obj.success === true && obj.data) {
								const innerData = obj.data as Record<string, unknown>
								if (innerData.code === 200 && innerData.data) {
									transformedData = transformPoizonProduct(innerData.data as Record<string, unknown>)
									await setToCache(cacheKey, transformedData, 1000 * 60 * 5) // 5 минут
									return NextResponse.json({ success: true, data: transformedData, _debug: { source, rawData: innerData.data } })
								}
							}

							// Формат 2: { code: 200, data: {...} }
							if (obj.code === 200 && obj.data) {
								transformedData = transformPoizonProduct(obj.data as Record<string, unknown>)
								await setToCache(cacheKey, transformedData, 1000 * 60 * 5) // 5 минут
								return NextResponse.json({ success: true, data: transformedData, _debug: { source, rawData: obj.data } })
							}

							// Формат 3: данные напрямую (без wrapper)
							// Проверяем наличие ключевых полей Poizon
							if (obj.dwSpuId || obj.distSpuId) {
								transformedData = transformPoizonProduct(obj)
								await setToCache(cacheKey, transformedData, 1000 * 60 * 5) // 5 минут
								return NextResponse.json({ success: true, data: transformedData, _debug: { source, rawData: obj } })
							}
						}
					} catch (poizonError) {
						console.error('[/api/product/[id]] Poizon API error:', poizonError)
						// Fall through to mock data
					}
					break
				default:
					// 1688: offerId (обязательно), country (по умолчанию ru)
					result = await getProductDetails(cleanId, 'ru')
					if (result && typeof result === 'object') {
						const obj = result as Record<string, unknown>
						if (obj.code === 200 && obj.data) {
							transformedData = transform1688Product(obj.data as Record<string, unknown>)
							await setToCache(cacheKey, transformedData, 1000 * 60 * 5) // 5 минут
							return NextResponse.json({ success: true, data: transformedData, _debug: { source, rawData: obj.data } })
						}
					}
			}
		} catch (err) {
			apiError = err
			console.error('[/api/product/[id]] API error:', err)
			// При ошибке API возвращаем mock данные
		}

		// Если API вернул ошибку - возвращаем mock данные с информацией об источнике
		const mockData = {
			productId,
			title: `Товар ${cleanId} с ${source === 'taobao' ? 'Taobao' : source === 'poizon' ? 'Poizon' : '1688'}`,
			price: Math.floor(Math.random() * 5000) + 500,
			originalPrice: Math.floor(Math.random() * 8000) + 1000,
			image: 'https://via.placeholder.com/600x400?text=Product',
			images: [
				'https://via.placeholder.com/600x400?text=Product+1',
				'https://via.placeholder.com/600x400?text=Product+2',
				'https://via.placeholder.com/600x400?text=Product+3'
			],
			shopName: `Магазин ${source}`,
			sales: Math.floor(Math.random() * 10000),
			source,
			description: 'Подробное описание товара. Это демонстрационные данные, так как API временно недоступен.',
			specifications: {
				'Страна производитель': 'Китай',
				Материал: 'Текстиль',
				Сезон: 'Всесезонный'
			},
			// Добавляем mock SKU данные для демонстрации выбора цвета и размера
			skuOptions: [
				{ skuId: '1', price: 1500, stock: 100, attributes: { Color: 'Red', Size: 'S' } },
				{ skuId: '2', price: 1500, stock: 80, attributes: { Color: 'Red', Size: 'M' } },
				{ skuId: '3', price: 1500, stock: 50, attributes: { Color: 'Red', Size: 'L' } },
				{ skuId: '4', price: 1600, stock: 90, attributes: { Color: 'Blue', Size: 'S' } },
				{ skuId: '5', price: 1600, stock: 120, attributes: { Color: 'Blue', Size: 'M' } },
				{ skuId: '6', price: 1600, stock: 60, attributes: { Color: 'Blue', Size: 'L' } },
				{ skuId: '7', price: 1700, stock: 40, attributes: { Color: 'Black', Size: 'S' } },
				{ skuId: '8', price: 1700, stock: 70, attributes: { Color: 'Black', Size: 'M' } },
				{ skuId: '9', price: 1700, stock: 30, attributes: { Color: 'Black', Size: 'L' } }
			]
		}

		return NextResponse.json({
			success: true,
			data: mockData,
			_debug: { source, mock: true, error: String(apiError) }
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
