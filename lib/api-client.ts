import { API_CONFIG, ENDPOINTS } from '@/config/api.config'
import { cnyToRub } from '@/lib/utils/format'
import { generateSign } from '@/lib/utils/signature'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface RequestOptions {
	method?: RequestMethod
	headers?: Record<string, string>
	body?: unknown
	params?: Record<string, string | number | boolean>
}

const DEBUG = process.env.NODE_ENV !== 'production'

function log(...args: unknown[]) {
	if (DEBUG) console.log(...args)
}

function error(...args: unknown[]) {
	if (DEBUG) console.error(...args)
}

function isTaobaoEndpoint(endpoint: string): boolean {
	return endpoint.includes('/taobao/')
}

function isPoizonEndpoint(endpoint: string): boolean {
	return endpoint.includes('/poizon/')
}

function enrichParams1688(params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	const enriched: Record<string, string | number | boolean> = { ...params }
	if (API_CONFIG.ACCESS_KEY) enriched.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) enriched.appSecret = API_CONFIG.ACCESS_SECRET
	if (API_CONFIG.ACCESS_SECRET) {
		enriched.sign = generateSign(enriched, API_CONFIG.ACCESS_SECRET)
	}
	return enriched
}

function enrichParamsTaobao(params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	const enriched: Record<string, string | number | boolean> = {
		...params,
		language: params.language || 'ru'
	}
	if (API_CONFIG.ACCESS_KEY) enriched.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) enriched.appSecret = API_CONFIG.ACCESS_SECRET
	if (API_CONFIG.ACCESS_SECRET) {
		enriched.sign = generateSign(enriched, API_CONFIG.ACCESS_SECRET)
	}
	return enriched
}

const NO_QUERY_ENDPOINTS = [
	'/alibaba/product/freightEstimate',
	'/taobao/traffic/item/logisticPrice/get',
	'/alibaba/upload/image',
	'/taobao/upload/image'
]

function enrichParams(endpoint: string, params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	if (NO_QUERY_ENDPOINTS.includes(endpoint)) return {}
	if (isTaobaoEndpoint(endpoint)) return enrichParamsTaobao(params)
	if (isPoizonEndpoint(endpoint)) return enrichParams1688(params)
	return enrichParams1688(params)
}

export async function dajiFetch<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', headers = {}, body, params = {} } = options

	if (!API_CONFIG.ACCESS_KEY || !API_CONFIG.ACCESS_SECRET) {
		return mockResponse(endpoint, params) as T
	}

	const enrichedParams = enrichParams(endpoint, params)
	const queryString = new URLSearchParams(
		Object.entries(enrichedParams).reduce(
			(acc, [key, value]) => {
				acc[key] = String(value)
				return acc
			},
			{} as Record<string, string>
		)
	).toString()

	const url = `${API_CONFIG.BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`

	const defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...headers
	}

	const config: RequestInit = { method, headers: defaultHeaders }

	if (body) {
		config.body = body instanceof FormData ? body : JSON.stringify(body)
		if (body instanceof FormData && config.headers) {
			delete (config.headers as Record<string, string>)['Content-Type']
		}
	}

	try {
		const response = await fetch(url, config)

		if (!response.ok) {
			const errorText = await response.text()
			throw new Error(`API error: ${response.status} ${response.statusText}: ${errorText}`)
		}

		return (await response.json()) as T
	} catch (err) {
		error('API request failed:', err)
		throw err
	}
}

function mockResponse(endpoint: string, params: Record<string, string | number | boolean>): unknown {
	log('Mock response for:', endpoint, params)
	return {
		code: 200,
		message: 'success',
		data: []
	}
}

export function searchProductsByKeyword(keyword: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.KEYWORD_SEARCH, {
		method: 'GET',
		params: { keyword, country: 'ru', ...params }
	})
}

export function searchProductsByImage(imageFile: File, params?: Record<string, string | number | boolean>) {
	const formData = new FormData()
	formData.append('image', imageFile)
	return dajiFetch(ENDPOINTS.IMAGE_SEARCH, {
		method: 'POST',
		body: formData,
		headers: {}
	})
}

export function uploadImage1688(imageBase64: string, params?: Record<string, string | number | boolean>) {
	const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

	const paramsObj: Record<string, string | number | boolean> = {
		image_base64: cleanBase64,
		img_base64: cleanBase64,
		base64: cleanBase64,
		...params
	}

	if (API_CONFIG.ACCESS_KEY) paramsObj.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) paramsObj.appSecret = API_CONFIG.ACCESS_SECRET
	if (API_CONFIG.ACCESS_SECRET) paramsObj.sign = generateSign(paramsObj, API_CONFIG.ACCESS_SECRET)

	const formData = new FormData()
	Object.entries(paramsObj).forEach(([key, value]) => {
		formData.append(key, String(value))
	})

	return dajiFetch(ENDPOINTS.UPLOAD_IMAGE_1688, {
		method: 'POST',
		body: formData,
		params: {}
	})
}

export function searchProductsByImageId1688(imageId: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.IMAGE_SEARCH, {
		method: 'GET',
		params: { imageId, ...params }
	})
}

export async function fileToBase64(file: File): Promise<string> {
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	return buffer.toString('base64')
}

export function getProductDetails(offerId: string, country: string = 'ru', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.PRODUCT_DETAILS, {
		method: 'GET',
		params: { offerId, country, ...params }
	})
}

export function getFreight1688(
	offerId: string,
	toCityCode: string = '310115',
	toCountryCode: string = '310115',
	toProvinceCode: string = '310000',
	totalNum: number = 1,
	logisticsSkuNumModels: Array<{ skuId?: string; number?: number }> = [],
	params?: Record<string, string | number | boolean>
) {
	const body = {
		appKey: API_CONFIG.ACCESS_KEY,
		appSecret: API_CONFIG.ACCESS_SECRET,
		offerId: Number(offerId),
		toProvinceCode,
		toCityCode,
		toCountryCode,
		totalNum,
		logisticsSkuNumModels,
		...params
	}

	return dajiFetch(ENDPOINTS.FREIGHT_1688, { method: 'POST', body, params: {} })
}

export function getLogisticPriceTaobao(
	itemId: string,
	addressInfo: { country: string; state: string; city: string; district: string },
	params?: Record<string, string | number | boolean>
) {
	const addressInfoString = `{country: '${addressInfo.country}', city: '${addressInfo.city}', district: '${addressInfo.district}', state: '${addressInfo.state}'}`
	const body = {
		appKey: API_CONFIG.ACCESS_KEY,
		appSecret: API_CONFIG.ACCESS_SECRET,
		item_id: itemId,
		address_info: addressInfoString
	}

	return dajiFetch(ENDPOINTS.TAOBAO_LOGISTIC_PRICE, { method: 'POST', body, params: {} })
}

export function searchTaobaoProductsByKeyword(keyword: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_KEYWORD_SEARCH, {
		method: 'GET',
		params: { keyword, page_no: 1, page_size: 20, ...params }
	})
}

export function searchTaobaoProductsByImage(imageFile: File, params?: Record<string, string | number | boolean>) {
	const formData = new FormData()
	formData.append('image', imageFile)
	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH, { method: 'POST', body: formData, headers: {} })
}

export function uploadImageTaobao(imageBase64: string, params?: Record<string, string | number | boolean>) {
	const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

	const paramsObj: Record<string, string | number | boolean> = {
		image_base64: cleanBase64,
		img_base64: cleanBase64,
		base64: cleanBase64,
		...params
	}

	if (API_CONFIG.ACCESS_KEY) paramsObj.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) paramsObj.appSecret = API_CONFIG.ACCESS_SECRET
	if (API_CONFIG.ACCESS_SECRET) paramsObj.sign = generateSign(paramsObj, API_CONFIG.ACCESS_SECRET)

	const formData = new FormData()
	Object.entries(paramsObj).forEach(([key, value]) => {
		formData.append(key, String(value))
	})

	return dajiFetch(ENDPOINTS.TAOBAO_UPLOAD_IMAGE, {
		method: 'POST',
		body: formData,
		params: {}
	})
}

export function searchTaobaoProductsByImageId(imageId: string, language: string = 'en', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH, { method: 'GET', params: { image_id: imageId, language, ...params } })
}

export function searchTaobaoProductsByImageUrl(
	imageUrl: string,
	categoryId?: string,
	pageNo: number = 0,
	pageSize: number = 10,
	crop: boolean = true,
	params?: Record<string, string | number | boolean>
) {
	const requestParams: Record<string, string | number | boolean> = { picUrl: imageUrl, pageNo, pageSize, crop, ...params }
	if (categoryId) requestParams.categoryId = categoryId
	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH_V2, { method: 'GET', params: requestParams })
}

export function getTaobaoProductDetails(itemId: string, language: string = 'ru', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_PRODUCT_DETAILS, { method: 'GET', params: { item_id: itemId, language, ...params } })
}

export function searchTaobaoShops(keyword: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_SHOP_SEARCH, { method: 'GET', params: { keyword, ...params } })
}

export function getCategories1688(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.CATEGORY_QUERY, { method: 'GET', params: { ...params } })
}

export function getTaobaoThemeList(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_THEME_LIST, { method: 'GET', params: { ...params } })
}

export function getTaobaoThemeDetail(themeId: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_THEME_DETAIL, { method: 'GET', params: { themeId, page_no: 1, page_size: 20, ...params } })
}

export function getPoizonProducts(
	keyword?: string,
	chineseKeyword?: string,
	brand?: string,
	params?: Record<string, string | number | boolean>
) {
	const requestParams: Record<string, string | number | boolean> = { startId: '1', pageSize: '20', ...params }
	if (keyword) requestParams.distSpuTitle = keyword
	if (chineseKeyword) requestParams.dwSpuTitle = chineseKeyword
	if (brand) requestParams.distBrandName = brand
	return dajiFetch(ENDPOINTS.POIZON_KEYWORD_SEARCH, { method: 'GET', params: requestParams })
}

export function getPoizonProductDetail(dwSpuId: string, dwDesignerId?: string, params?: Record<string, string | number | boolean>) {
	const requestParams: Record<string, string | number | boolean> = { dwSpuId, ...params }
	if (dwDesignerId) requestParams.dwDesignerId = dwDesignerId
	return dajiFetch(ENDPOINTS.POIZON_PRODUCT_DETAIL, { method: 'GET', params: requestParams })
}

export function getPoizonCategories(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.POIZON_CATEGORY_GET, { method: 'GET', params: { ...params } })
}

export interface UnifiedProduct {
	id: string
	title: string
	price: number
	image: string
	source: 'taobao' | '1688' | 'poizon'
	shopName?: string
	sales?: number
	originalData: unknown
}

export interface SearchOptions {
	sortByPrice?: 'asc' | 'desc'
	sortByName?: 'asc' | 'desc'
	minPrice?: number
	maxPrice?: number
	sources?: ('taobao' | '1688' | 'poizon')[]
}

function safeString(value: unknown, fallback = ''): string {
	if (value === null || value === undefined) return fallback
	return String(value)
}

function safeNumber(value: unknown, fallback = 0): number {
	const n = Number(value)
	return Number.isFinite(n) ? n : fallback
}

function normalizeImageUrl(url: unknown): string {
	const str = safeString(url)
	if (!str) return ''
	if (str.startsWith('//')) return `https:${str}`
	return str
}

function map1688Products(raw: unknown): UnifiedProduct[] {
	if (!raw || typeof raw !== 'object') return []

	const obj = raw as Record<string, unknown>
	if (obj.code !== 200 || !obj.data || typeof obj.data !== 'object') return []

	const data = obj.data as Record<string, unknown>
	const items = Array.isArray(data.data) ? data.data : []

	return items
		.map(item => {
			if (!item || typeof item !== 'object') return null
			const p = item as Record<string, unknown>

			let priceStr = '0'
			if (p.priceInfo && typeof p.priceInfo === 'object') {
				const priceInfo = p.priceInfo as Record<string, unknown>
				priceStr = safeString(priceInfo.price || priceInfo.consignPrice || '0')
			}

			const priceCny = parseFloat(priceStr) || 0

			return {
				id: `1688_${safeString(p.offerId)}`,
				title: safeString(p.subjectTrans || p.subject || 'Без названия'),
				price: Math.ceil(cnyToRub(priceCny)),
				image: normalizeImageUrl(p.imageUrl || p.whiteImage || ''),
				source: '1688' as const,
				shopName: safeString(p.companyName || ''),
				sales: safeNumber(p.monthSold || p.soldOut || 0),
				originalData: p
			}
		})
		.filter((item): item is UnifiedProduct => Boolean(item && item.id))
}

function mapTaobaoProducts(raw: unknown): UnifiedProduct[] {
	if (!raw || typeof raw !== 'object') return []

	const obj = raw as Record<string, unknown>
	if (obj.code !== 200 || !obj.data || typeof obj.data !== 'object') return []

	const data = obj.data as Record<string, unknown>
	const items = Array.isArray(data.data) ? data.data : []

	return items
		.map(item => {
			if (!item || typeof item !== 'object') return null
			const p = item as Record<string, unknown>

			let title = safeString(p.title || 'Без названия')
			const ml = p.multiLanguageInfo

			if (Array.isArray(ml) && ml.length > 0) {
				const ruItem = ml.find(x => x && typeof x === 'object' && (x as Record<string, unknown>).language === 'ru') as
					| Record<string, unknown>
					| undefined
				if (ruItem?.title) title = safeString(ruItem.title)
				else if (ml[0] && typeof ml[0] === 'object') title = safeString((ml[0] as Record<string, unknown>).title || title)
			} else if (ml && typeof ml === 'object') {
				title = safeString((ml as Record<string, unknown>).title || title)
			}

			const priceFen = safeNumber(p.price || p.zkFinalPrice || 0)
			const priceCny = priceFen > 1000 ? priceFen / 100 : priceFen

			return {
				id: `taobao_${safeString(p.itemId)}`,
				title,
				price: Math.ceil(cnyToRub(priceCny)),
				image: normalizeImageUrl(p.mainImageUrl || p.pictUrl || ''),
				source: 'taobao' as const,
				shopName: safeString(p.shopName || p.nick || ''),
				sales: safeNumber(p.sales || 0),
				originalData: p
			}
		})
		.filter((item): item is UnifiedProduct => Boolean(item && item.id))
}

function mapPoizonProducts(raw: unknown): UnifiedProduct[] {
	if (!raw || typeof raw !== 'object') return []

	const obj = raw as Record<string, unknown>
	if (obj.code !== 200 || !obj.data || typeof obj.data !== 'object') return []

	const data = obj.data as Record<string, unknown>

	const possibleArrays = [
		data.data,
		data.records,
		data.list,
		data.rows,
		data.items
	]

	const items = possibleArrays.find(Array.isArray) || []

	return (items as unknown[])
		.map(item => {
			if (!item || typeof item !== 'object') return null
			const p = item as Record<string, unknown>

			const rawPrice = safeNumber(p.authPrice || p.minPrice || p.minBidPrice || 0)
			const priceCny = rawPrice > 1000 ? rawPrice / 100 : rawPrice

			return {
				id: `poizon_${safeString(p.dwSpuId || p.spuId || p.productId)}`,
				title: safeString(p.distSpuTitle || p.dwSpuTitle || p.title || 'Без названия'),
				price: Math.ceil(cnyToRub(priceCny)),
				image: normalizeImageUrl(p.image || p.mainImage || ''),
				source: 'poizon' as const,
				shopName: safeString(p.distBrandName || p.brandName || ''),
				sales: safeNumber(p.sales || 0),
				originalData: p
			}
		})
		.filter((item): item is UnifiedProduct => Boolean(item && item.id))
}

function applySearchFilters(products: UnifiedProduct[], options?: SearchOptions): UnifiedProduct[] {
	let result = [...products]

	if (options?.minPrice !== undefined) {
		result = result.filter(p => p.price >= options.minPrice!)
	}

	if (options?.maxPrice !== undefined) {
		result = result.filter(p => p.price <= options.maxPrice!)
	}

	if (options?.sortByPrice === 'asc') {
		result.sort((a, b) => a.price - b.price)
	} else if (options?.sortByPrice === 'desc') {
		result.sort((a, b) => b.price - a.price)
	} else if (options?.sortByName === 'asc') {
		result.sort((a, b) => a.title.localeCompare(b.title, 'ru'))
	} else if (options?.sortByName === 'desc') {
		result.sort((a, b) => b.title.localeCompare(a.title, 'ru'))
	}

	return result
}

function dedupeProducts(products: UnifiedProduct[]): UnifiedProduct[] {
	const seen = new Set<string>()
	return products.filter(product => {
		const key = `${product.source}_${product.id}`
		if (seen.has(key)) return false
		seen.add(key)
		return true
	})
}

export async function searchAllProducts(
	keyword: string,
	page: number = 1,
	pageSize: number = 10,
	options?: SearchOptions
): Promise<{
	products: UnifiedProduct[]
	total: number
	sources: { taobao: number; '1688': number; poizon: number }
}> {
	const selectedSources = options?.sources && options.sources.length > 0 ? options.sources : (['taobao', '1688', 'poizon'] as const)

	const sourceCounts = {
		taobao: 0,
		'1688': 0,
		poizon: 0
	}

	const tasks: Promise<UnifiedProduct[]>[] = []

	if (selectedSources.includes('1688')) {
		tasks.push(
			searchProductsByKeyword(keyword, {
				beginPage: page,
				pageSize: Math.max(pageSize, 20),
				country: 'ru'
			})
				.then(map1688Products)
				.catch(err => {
					error('1688 search failed:', err)
					return []
				})
		)
	}

	if (selectedSources.includes('taobao')) {
		tasks.push(
			searchTaobaoProductsByKeyword(keyword, {
				page_no: page,
				page_size: Math.max(pageSize, 20),
				language: 'ru'
			})
				.then(mapTaobaoProducts)
				.catch(err => {
					error('Taobao search failed:', err)
					return []
				})
		)
	}

	if (selectedSources.includes('poizon')) {
		tasks.push(
			getPoizonProducts(keyword, undefined, undefined, {
				startId: String((page - 1) * Math.max(pageSize, 20) + 1),
				pageSize: String(Math.max(pageSize, 20))
			})
				.then(mapPoizonProducts)
				.catch(err => {
					error('Poizon search failed:', err)
					return []
				})
		)
	}

	const results = await Promise.all(tasks)
	let merged = dedupeProducts(results.flat())

	sourceCounts.taobao = merged.filter(p => p.source === 'taobao').length
	sourceCounts['1688'] = merged.filter(p => p.source === '1688').length
	sourceCounts.poizon = merged.filter(p => p.source === 'poizon').length

	merged = applySearchFilters(merged, options)

	return {
		products: merged,
		total: merged.length,
		sources: sourceCounts
	}
}