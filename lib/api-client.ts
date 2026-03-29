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

// Флаг для включения отладочного логирования (только в dev режиме)
const DEBUG = process.env.NODE_ENV !== 'production'

function log(...args: unknown[]) {
	if (DEBUG) console.log(...args)
}

function error(...args: unknown[]) {
	if (DEBUG) console.log(...args)
}

/**
 * Определяет, является ли endpoint Taobao API.
 */
function isTaobaoEndpoint(endpoint: string): boolean {
	return endpoint.includes('/taobao/')
}

/**
 * Определяет, является ли endpoint Poizon API.
 */
function isPoizonEndpoint(endpoint: string): boolean {
	return endpoint.includes('/poizon/')
}

/**
 * Добавляет необходимые параметры аутентификации для 1688 API.
 * Согласно документации Daji API.
 */
function enrichParams1688(params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	log('enrichParams1688 input params:', params)

	const enriched: Record<string, string | number | boolean> = { ...params }

	// Добавляем appKey и appSecret
	if (API_CONFIG.ACCESS_KEY) enriched.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) enriched.appSecret = API_CONFIG.ACCESS_SECRET

	// Генерируем подпись
	if (API_CONFIG.ACCESS_SECRET) {
		const sign = generateSign(enriched, API_CONFIG.ACCESS_SECRET)
		enriched.sign = sign
	}

	log('Enriched params (1688):', enriched)
	return enriched
}

/**
 * Добавляет необходимые параметры аутентификации для Taobao API.
 */
function enrichParamsTaobao(params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	log('enrichParamsTaobao input params:', params)

	const enriched: Record<string, string | number | boolean> = {
		...params,
		language: params.language || 'ru'
	}

	// Добавляем appKey и appSecret
	if (API_CONFIG.ACCESS_KEY) enriched.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) enriched.appSecret = API_CONFIG.ACCESS_SECRET

	// Генерируем подпись
	if (API_CONFIG.ACCESS_SECRET) {
		const sign = generateSign(enriched, API_CONFIG.ACCESS_SECRET)
		enriched.sign = sign
	}

	log('Enriched params (Taobao):', enriched)
	return enriched
}

/**
 * Endpoints, где аутентификация передается в body, и query-параметры не нужны.
 */
const NO_QUERY_ENDPOINTS = [
	'/alibaba/product/freightEstimate',
	'/taobao/traffic/item/logisticPrice/get',
	'/alibaba/upload/image',
	'/taobao/upload/image'
]

/**
 * Выбирает стратегию обогащения параметров в зависимости от endpoint.
 */
function enrichParams(endpoint: string, params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
	// Если endpoint в списке NO_QUERY_ENDPOINTS, возвращаем пустой объект (не добавляем параметры в query)
	if (NO_QUERY_ENDPOINTS.includes(endpoint)) {
		return {}
	}
	if (isTaobaoEndpoint(endpoint)) {
		return enrichParamsTaobao(params)
	}
	if (isPoizonEndpoint(endpoint)) {
		return enrichParams1688(params)
	}
	return enrichParams1688(params)
}

/**
 * Универсальный клиент для запросов к API Daji.
 */
export async function dajiFetch<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
	const { method = 'GET', headers = {}, body, params = {} } = options

	// Если ключи отсутствуют, используем mock-данные для демонстрации
	if (!API_CONFIG.ACCESS_KEY || !API_CONFIG.ACCESS_SECRET) {
		log('API keys missing, returning mock data')
		return mockResponse(endpoint, params) as T
	}

	// Обогащаем параметры подписью
	log('dajiFetch params before enrichment:', params)
	const enrichedParams = enrichParams(endpoint, params)
	log('dajiFetch enrichedParams:', enrichedParams)

	// Строим URL с query-параметрами
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

	log('API Request:', { url, method, params: enrichedParams })

	const defaultHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...headers
	}

	const config: RequestInit = {
		method,
		headers: defaultHeaders
	}

	if (body) {
		config.body = body instanceof FormData ? body : JSON.stringify(body)
		// Для FormData не устанавливаем Content-Type
		if (body instanceof FormData && config.headers) {
			delete (config.headers as Record<string, string>)['Content-Type']
		}
	}

	try {
		const response = await fetch(url, config)
		if (!response.ok) {
			const errorText = await response.text()
			error('API error response:', errorText)
			throw Error(`API error: ${response.status} ${response.statusText}: ${errorText}`)
		}
		const data = await response.json()
		log('API response:', data)
		return data as T
	} catch (err) {
		error('API request failed:', err)
		throw err
	}
}

/**
 * Mock-ответ для демонстрации.
 */
function mockResponse(endpoint: string, params: Record<string, string | number | boolean>): unknown {
	log('Mock response for', endpoint, params)
	const isTaobao = endpoint.includes('/taobao/')
	const isPoizon = endpoint.includes('/poizon/')
	const source = isTaobao ? 'Taobao' : isPoizon ? 'Poizon' : '1688'

	// Поиск по ключевому слову (1688 и Taobao)
	if (endpoint.includes('keywordQuery') || endpoint.includes('/traffic/item/search')) {
		const keyword = params.keyword || 'phone'
		return {
			code: 200,
			message: 'success',
			data: Array.from({ length: 8 }, (_, i) => ({
				productId: `mock_${i + 1}`,
				title: `${keyword} mock product ${i + 1} (${source})`,
				price: (i + 1) * 100,
				imageUrl: `https://via.placeholder.com/150?text=Product+${i + 1}`,
				source
			})),
			timestamp: Date.now(),
			traceId: 'mock_trace_id',
			cost: 0
		}
	}
	// Детали товара (1688, Taobao, Poizon)
	if (endpoint.includes('queryProductDetail') || endpoint.includes('/traffic/item/get') || endpoint.includes('queryDetail')) {
		if (isPoizon) {
			// Poizon имеет вложенную структуру: { success, data: { code, data } }
			return {
				success: true,
				data: {
					code: 200,
					data: {
						dwSpuId: params.dwSpuId,
						distSpuTitle: 'Mock Poizon Product - Nike Air Max',
						dwSpuTitle: 'Mock Poizon 产品',
						authPrice: 59900, // 599.00 юаней (в копейках)
						originalPrice: 89900,
						image: 'https://via.placeholder.com/400x400?text=Poizon+Product',
						baseImage: ['https://via.placeholder.com/400x400?text=Poizon+Product', 'https://via.placeholder.com/400x400?text=Poizon+Product+2'],
						distBrandName: 'Nike',
						dwDesignerId: 'AQ4545-001',
						sales: 1250,
						description: 'This is a mock Poizon product for demonstration.',
						specifications: {
							Бренд: 'Nike',
							Стиль: 'AQ4545-001',
							Размер: '42'
						}
					}
				}
			}
		}
		return {
			code: 200,
			message: 'success',
			data: {
				productId: params.productId || params.offerId || params.item_id,
				title: `Mock ${source} Product Detail`,
				price: 999,
				description: `This is a mock ${source} product for demonstration.`,
				images: ['https://via.placeholder.com/400x300'],
				specifications: []
			}
		}
	}
	// Поиск по изображению
	if (endpoint.includes('imageQuery') || endpoint.includes('/imgsearch') || endpoint.includes('image-search')) {
		return {
			code: 200,
			message: 'success',
			data: Array.from({ length: 5 }, (_, i) => ({
				productId: `img_mock_${i + 1}`,
				title: `Image search result ${i + 1} (${source})`,
				price: (i + 1) * 150,
				imageUrl: `https://via.placeholder.com/150?text=Image+${i + 1}`,
				source
			})),
			timestamp: Date.now(),
			traceId: 'mock_trace_id',
			cost: 0
		}
	}
	// Поиск магазинов
	if (endpoint.includes('/shop/search')) {
		return {
			code: 200,
			message: 'success',
			data: Array.from({ length: 3 }, (_, i) => ({
				shopId: `shop_${i + 1}`,
				name: `Mock Shop ${i + 1}`,
				rating: 4.5 + i * 0.1,
				productCount: 100 + i * 50,
				source
			}))
		}
	}
	// Расчет стоимости доставки 1688
	if (endpoint.includes('/freight')) {
		return {
			code: 200,
			message: 'success',
			data: {
				offerId: params.offerId || 'unknown',
				freight: '15.50',
				templateName: '中通',
				firstFee: '15.5',
				nextFee: '5.0',
				productFreightSkuInfoModels: []
			}
		}
	}
	// Расчет стоимости доставки Taobao
	if (endpoint.includes('/logisticPrice')) {
		return {
			code: 200,
			message: 'success',
			data: {
				postFee: '10.00',
				currency: 'CNY'
			}
		}
	}
	// Остальные endpoints возвращают пустой массив
	return {
		code: 200,
		message: 'success',
		data: []
	}
}

/**
 * Поиск товаров по ключевому слову (1688).
 * @param country — язык ответа: ru, en, vi и т.д. (документация Dajisaas, раздел «Языки»)
 */
export function searchProductsByKeyword(keyword: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.KEYWORD_SEARCH, {
		method: 'GET',
		params: { keyword, country: 'ru', ...params }
	})
}

/**
 * Поиск товаров по изображению (загрузка изображения).
 */
export function searchProductsByImage(imageFile: File, params?: Record<string, string | number | boolean>) {
	const formData = new FormData()
	formData.append('image', imageFile)
	// Для FormData нужно отдельно обрабатывать подпись, упростим пока.
	return dajiFetch(ENDPOINTS.IMAGE_SEARCH, {
		method: 'POST',
		body: formData,
		headers: {} // Content-Type будет multipart/form-data
	})
}

/**
 * Загрузка изображения на 1688 и получение imageId.
 * @param imageBase64 - Base64 закодированное изображение (JPG, PNG, WEBP до 3MB)
 */
export function uploadImage1688(imageBase64: string, params?: Record<string, string | number | boolean>) {
	// Создаем объект параметров для подписи
	const paramsObj: Record<string, string | number | boolean> = {
		image_base64: imageBase64,
		...params
	}
	// Добавляем appKey и appSecret
	if (API_CONFIG.ACCESS_KEY) paramsObj.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) paramsObj.appSecret = API_CONFIG.ACCESS_SECRET
	// Генерируем подпись
	if (API_CONFIG.ACCESS_SECRET) {
		const sign = generateSign(paramsObj, API_CONFIG.ACCESS_SECRET)
		paramsObj.sign = sign
	}
	// Создаем FormData и добавляем все параметры
	const formData = new FormData()
	Object.entries(paramsObj).forEach(([key, value]) => {
		formData.append(key, String(value))
	})
	return dajiFetch(ENDPOINTS.UPLOAD_IMAGE_1688, {
		method: 'POST',
		body: formData,
		params: {} // query параметры не нужны
	})
}

/**
 * Поиск товаров на 1688 по imageId.
 * @param imageId - ID изображения, полученный от uploadImage1688
 */
export function searchProductsByImageId1688(imageId: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.IMAGE_SEARCH, {
		method: 'GET',
		params: { imageId, ...params }
	})
}

/**
 * Утилита для конвертации File в Base64 (для Node.js/Server-side).
 * @param file - файл изображения
 * @returns Promise с Base64 строкой
 */
export async function fileToBase64(file: File): Promise<string> {
	// Для Node.js (API routes) используем arrayBuffer + Buffer
	const arrayBuffer = await file.arrayBuffer()
	const buffer = Buffer.from(arrayBuffer)
	return buffer.toString('base64')
}

/**
 * Получение деталей товара 1688 по offerId.
 * @param offerId - ID товара (получить из списка поиска)
 * @param country - язык/страна (по умолчанию ru)
 */
export function getProductDetails(offerId: string, country: string = 'ru', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.PRODUCT_DETAILS, {
		method: 'GET',
		params: { offerId, country, ...params }
	})
}

/**
 * Расчет стоимости доставки для товара 1688.
 * @param offerId - ID товара
 * @param toCityCode - код города получателя (склада)
 * @param toCountryCode - код района получателя (склада) (в примере это код района, не страны)
 * @param toProvinceCode - код провинции получателя (склада)
 * @param totalNum - общее количество товаров
 * @param logisticsSkuNumModels - массив объектов { skuId?, number? } (опционально)
 * @param params - дополнительные параметры
 */
export function getFreight1688(
	offerId: string,
	toCityCode: string = '310115', // код Пудун, Шанхай (пример)
	toCountryCode: string = '310115', // код района Пудун (совпадает с городом?)
	toProvinceCode: string = '310000', // код Шанхая
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
	return dajiFetch(ENDPOINTS.FREIGHT_1688, {
		method: 'POST',
		body,
		params: {} // параметры передаются в body, query не нужны
	})
}

/**
 * Расчет стоимости доставки для товара Taobao.
 * @param itemId - ID товара
 * @param addressInfo - объект адреса { country, state, city, district } (будет преобразован в строку вида "{country: '中国', city: '杭州市', district: '余杭区', state: '浙江省'}")
 */
export function getLogisticPriceTaobao(
	itemId: string,
	addressInfo: { country: string; state: string; city: string; district: string },
	params?: Record<string, string | number | boolean>
) {
	// Форматируем address_info как в примере документации
	const addressInfoString = `{country: '${addressInfo.country}', city: '${addressInfo.city}', district: '${addressInfo.district}', state: '${addressInfo.state}'}`
	const body = {
		appKey: API_CONFIG.ACCESS_KEY,
		appSecret: API_CONFIG.ACCESS_SECRET,
		item_id: itemId,
		address_info: addressInfoString
	}
	return dajiFetch(ENDPOINTS.TAOBAO_LOGISTIC_PRICE, {
		method: 'POST',
		body,
		params: {} // параметры передаются в body
	})
}

/**
 * Поиск товаров на Taobao/Tmall по ключевому слову.
 * Поддерживает пагинацию через page_no и page_size.
 * Максимальный page_size = 20 (ограничение API).
 */
export function searchTaobaoProductsByKeyword(keyword: string, params?: Record<string, string | number | boolean>) {
	const defaultParams = {
		page_no: 1,
		page_size: 20, // максимальное количество товаров на странице
		...params
	}
	return dajiFetch(ENDPOINTS.TAOBAO_KEYWORD_SEARCH, {
		method: 'GET',
		params: { keyword, ...defaultParams }
	})
}

/**
 * Поиск товаров на Taobao/Tmall по изображению (V1).
 * Сначала нужно загрузить изображение через uploadImageTaobao.
 */
export function searchTaobaoProductsByImage(imageFile: File, params?: Record<string, string | number | boolean>) {
	const formData = new FormData()
	formData.append('image', imageFile)
	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH, {
		method: 'POST',
		body: formData,
		headers: {}
	})
}

/**
 * Загрузка изображения на Taobao и получение imageId.
 * @param imageBase64 - Base64 закодированное изображение (JPG, PNG, WEBP до 3MB)
 */
export function uploadImageTaobao(imageBase64: string, params?: Record<string, string | number | boolean>) {
	// Создаем объект параметров для подписи
	const paramsObj: Record<string, string | number | boolean> = {
		image_base64: imageBase64,
		...params
	}
	// Добавляем appKey и appSecret
	if (API_CONFIG.ACCESS_KEY) paramsObj.appKey = API_CONFIG.ACCESS_KEY
	if (API_CONFIG.ACCESS_SECRET) paramsObj.appSecret = API_CONFIG.ACCESS_SECRET
	// Генерируем подпись
	if (API_CONFIG.ACCESS_SECRET) {
		const sign = generateSign(paramsObj, API_CONFIG.ACCESS_SECRET)
		paramsObj.sign = sign
	}
	// Создаем FormData и добавляем все параметры
	const formData = new FormData()
	Object.entries(paramsObj).forEach(([key, value]) => {
		formData.append(key, String(value))
	})
	return dajiFetch(ENDPOINTS.TAOBAO_UPLOAD_IMAGE, {
		method: 'POST',
		body: formData,
		params: {} // query параметры не нужны
	})
}

/**
 * Поиск товаров на Taobao по imageId (V1).
 * @param imageId - ID изображения, полученный от uploadImageTaobao
 * @param language - язык: en (английский), vi (вьетнамский)
 */
export function searchTaobaoProductsByImageId(imageId: string, language: string = 'en', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH, {
		method: 'GET',
		params: { image_id: imageId, language, ...params }
	})
}

/**
 * Поиск товаров на Taobao/Tmall по URL изображения (V2).
 * @param imageUrl - URL изображения
 * @param categoryId - категория: 0-одежда, 1-платья, 2-брюки, 3-сумки, 4-обувь, 5-аксессуары, 6-сладости, 7-косметика, 8-напитки, 9-мебель, 20-игрушки, 21-белье, 22-техника, 88888888-другое
 * @param pageNo - номер страницы (0-499)
 * @param pageSize - количество результатов (1-20)
 * @param crop - нужно ли выделять главный объект (по умолчанию true)
 */
export function searchTaobaoProductsByImageUrl(
	imageUrl: string,
	categoryId?: string,
	pageNo: number = 0,
	pageSize: number = 10,
	crop: boolean = true,
	params?: Record<string, string | number | boolean>
) {
	// Фильтруем undefined значения
	const requestParams: Record<string, string | number | boolean> = {
		picUrl: imageUrl,
		pageNo,
		pageSize,
		crop,
		...params
	}
	if (categoryId) requestParams.categoryId = categoryId

	return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH_V2, {
		method: 'GET',
		params: requestParams
	})
}

/**
 * Получение деталей товара Taobao/Tmall по item_id.
 * @param itemId - ID товара (получить из списка поиска)
 * @param language - язык: пусто - китайский, en - английский, vi - вьетнамский
 */
export function getTaobaoProductDetails(itemId: string, language: string = 'ru', params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_PRODUCT_DETAILS, {
		method: 'GET',
		params: { item_id: itemId, language, ...params }
	})
}

/**
 * Поиск магазинов на Taobao/Tmall.
 */
export function searchTaobaoShops(keyword: string, params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_SHOP_SEARCH, {
		method: 'GET',
		params: { keyword, ...params }
	})
}

/**
 * Получение категорий товаров для 1688 API.
 * Возможные параметры: parentCategoryId (опционально) для получения подкатегорий.
 */
export function getCategories1688(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.CATEGORY_QUERY, {
		method: 'GET',
		params: { ...params }
	})
}
/**
 * Получение списка тем (категорий) товаров на Taobao/Tmall.
 * Возможные параметры: themeType (опционально) для фильтрации по типу темы.
 */
export function getTaobaoThemeList(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.TAOBAO_THEME_LIST, {
		method: 'GET',
		params: { ...params }
	})
}

/**
 * Получение деталей конкретной темы (товары внутри темы) на Taobao/Tmall.
 * Обязательный параметр: themeId (идентификатор темы).
 * Поддерживает пагинацию через page_no и page_size.
 */
export function getTaobaoThemeDetail(themeId: string, params?: Record<string, string | number | boolean>) {
	const defaultParams = {
		page_no: 1,
		page_size: 20,
		...params
	}
	return dajiFetch(ENDPOINTS.TAOBAO_THEME_DETAIL, {
		method: 'GET',
		params: { themeId, ...defaultParams }
	})
}

// ===================== POIZON API =====================

/**
 * Поиск товаров на Poizon по ключевым словам.
 * @param keyword - английские ключевые слова (distSpuTitle)
 * @param chineseKeyword - китайские ключевые слова (dwSpuTitle)
 * @param brand - бренд (distBrandName)
 * @param params - дополнительные параметры: pageSize (1-20), startId (пагинация, по умолчанию 1)
 */
export function getPoizonProducts(keyword?: string, chineseKeyword?: string, brand?: string, params?: Record<string, string | number | boolean>) {
	const defaultParams = {
		startId: '1',
		pageSize: '20',
		...params
	}
	const requestParams: Record<string, string | number | boolean> = {
		...defaultParams
	}
	if (keyword) requestParams.distSpuTitle = keyword
	if (chineseKeyword) requestParams.dwSpuTitle = chineseKeyword
	if (brand) requestParams.distBrandName = brand

	log('Poizon search params:', requestParams)

	return dajiFetch(ENDPOINTS.POIZON_KEYWORD_SEARCH, {
		method: 'GET',
		params: requestParams
	})
}

/**
 * Получение деталей товара Poizon по dwSpuId.
 * @param dwSpuId - ID товара (получить из списка)
 * @param dwDesignerId - стиль товара (опционально)
 */
export function getPoizonProductDetail(dwSpuId: string, dwDesignerId?: string, params?: Record<string, string | number | boolean>) {
	const requestParams: Record<string, string | number | boolean> = {
		dwSpuId,
		...params
	}
	if (dwDesignerId) requestParams.dwDesignerId = dwDesignerId

	return dajiFetch(ENDPOINTS.POIZON_PRODUCT_DETAIL, {
		method: 'GET',
		params: requestParams
	})
}

/**
 * Получение категорий товаров для Poizon API.
 * Возможные параметры: parentId (опционально) для получения подкатегорий.
 */
export function getPoizonCategories(params?: Record<string, string | number | boolean>) {
	return dajiFetch(ENDPOINTS.POIZON_CATEGORY_GET, {
		method: 'GET',
		params: { ...params }
	})
}

// ===================== UNIFIED SEARCH =====================

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
	/** Сортировка по цене: 'asc' - возрастание, 'desc' - убывание */
	sortByPrice?: 'asc' | 'desc'
	/** Сортировка по названию: 'asc' - А-Я, 'desc' - Я-А */
	sortByName?: 'asc' | 'desc'
	/** Минимальная цена в рублях (после конвертации) */
	minPrice?: number
	/** Максимальная цена в рублях (после конвертации) */
	maxPrice?: number
	/** Фильтр по источникам: массив источников */
	sources?: ('taobao' | '1688' | 'poizon')[]
}

/**
 * Универсальный поиск по всем трём API: Taobao, 1688 и Poizon
 * @param keyword - ключевое слово для поиска
 * @param page - номер страницы
 * @param pageSize - количество результатов с каждого API
 * @param options - опции сортировки и фильтрации
 */
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
	log('Searching all sources for:', keyword, 'page:', page, 'options:', options)

	const results: UnifiedProduct[] = []
	const sourceCounts = { taobao: 0, '1688': 0, poizon: 0 }

	// 1. Поиск на Taobao (поддерживает китайский)
	try {
		log('Searching Taobao...')
		const taobaoData = await searchTaobaoProductsByKeyword(keyword, { page_no: page })
		if (taobaoData && typeof taobaoData === 'object') {
			const obj = taobaoData as Record<string, unknown>
			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : Array.isArray(obj.data) ? obj.data : []
				for (const item of items.slice(0, pageSize)) {
					const p = item as Record<string, unknown>
					const ml = p.multiLanguageInfo as { title?: string; language?: string } | Array<{ title?: string; language?: string }> | undefined
					let title = String(p.title || '')
					if (ml) {
						if (Array.isArray(ml)) {
							const ru = ml.find((m: { language?: string }) => m.language === 'ru')
							if (ru?.title) title = ru.title
							else if (ml[0]?.title) title = ml[0].title
						} else if (ml.title) {
							title = ml.title
						}
					}
					const priceCny = parseFloat(String(p.price || 0)) || 0
					results.push({
						id: `taobao_${p.itemId || p.id || Math.random()}`,
						title,
						price: cnyToRub(priceCny),
						image: String(p.mainImageUrl || p.pictUrl || p.pictureUrl || ''),
						source: 'taobao',
						shopName: String(p.shopName || p.nick || ''),
						sales: Number(p.sales || p.quantity || 0),
						originalData: item
					})
					sourceCounts.taobao++
				}
			}
		}
	} catch (err) {
		error('Taobao search error:', err)
	}

	// 2. Поиск на 1688 (поддерживает китайский)
	try {
		log('Searching 1688, page:', page)
		// Для 1688 используем beginPage для пагинации
		const data1688 = await searchProductsByKeyword(keyword, { beginPage: page, pageSize: pageSize })
		if (data1688 && typeof data1688 === 'object') {
			const obj = data1688 as Record<string, unknown>
			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.data) ? data.data : Array.isArray(obj.data) ? obj.data : []
				for (const item of items.slice(0, pageSize)) {
					const p = item as Record<string, unknown>
					// 1688: priceInfo может быть объектом или строкой "{price=53.00; ...}"
					let price = 0
					const priceInfo = p.priceInfo
					if (priceInfo) {
						if (typeof priceInfo === 'object') {
							const pi = priceInfo as Record<string, unknown>
							price = parseFloat(String(pi.price || pi.consignPrice || 0)) || 0
						} else if (typeof priceInfo === 'string') {
							// Парсим строку вида "{price=53.00; ...}"
							const match = priceInfo.match(/price[=\s]*(\d+\.?\d*)/i)
							if (match) price = parseFloat(match[1]) || 0
						}
					}
					// Название - используем subjectTrans если есть, иначе subject
					const title = String(p.subjectTrans || p.subject || '')

					// Изображение - используем imageUrl или whiteImage
					const imageUrl = p.imageUrl as string | null
					const whiteImage = p.whiteImage as string | null
					const image = imageUrl || whiteImage || ''

					results.push({
						id: `1688_${p.offerId || p.productId || p.id || Math.random()}`,
						title: title,
						price: cnyToRub(price),
						image: image,
						source: '1688',
						shopName: String(p.companyName || ''),
						sales: Number(p.monthSold || 0),
						originalData: item
					})
					sourceCounts['1688']++
				}
			}
		}
	} catch (err) {
		error('1688 search error:', err)
	}

	// 3. Поиск на Poizon (только английский)
	// Переводим или используем как есть
	try {
		log('Searching Poizon, page:', page)
		// Для Poizon используем startId - это ID первой записи на странице
		// При pageSize=10, page=2 -> startId = 11 (смещение 10 записей)
		const startId = (page - 1) * pageSize + 1
		const poizonData = await getPoizonProducts(keyword, undefined, undefined, {
			startId: String(startId),
			pageSize: pageSize
		})
		if (poizonData && typeof poizonData === 'object') {
			const obj = poizonData as Record<string, unknown>
			if (obj.code === 200 && obj.data) {
				const data = obj.data as Record<string, unknown>
				const items = Array.isArray(data.spuList) ? data.spuList : []
				for (const item of items.slice(0, pageSize)) {
					const p = item as Record<string, unknown>
					const priceCny = parseFloat(String(p.authPrice || 0)) / 100 || 0
					results.push({
						id: `poizon_${p.dwSpuId || p.id || Math.random()}`,
						title: String(p.distSpuTitle || p.dwSpuTitle || ''),
						price: cnyToRub(priceCny),
						image: String(p.image || (Array.isArray(p.baseImage) ? p.baseImage[0] : '')),
						source: 'poizon',
						shopName: String(p.distBrandName || ''),
						sales: Number(p.sales || 0),
						originalData: item
					})
					sourceCounts.poizon++
				}
			}
		}
	} catch (err) {
		error('Poizon search error:', err)
	}

	// Применяем фильтрацию по источникам
	let filtered = results
	if (options?.sources && options.sources.length > 0) {
		filtered = filtered.filter(p => options.sources!.includes(p.source))
	}

	// Применяем фильтрацию по диапазону цен
	if (options?.minPrice !== undefined) {
		filtered = filtered.filter(p => p.price >= options.minPrice!)
	}
	if (options?.maxPrice !== undefined) {
		filtered = filtered.filter(p => p.price <= options.maxPrice!)
	}

	// Применяем сортировку
	if (options?.sortByPrice) {
		filtered.sort((a, b) => {
			return options.sortByPrice === 'asc' ? a.price - b.price : b.price - a.price
		})
	}
	if (options?.sortByName) {
		filtered.sort((a, b) => {
			const titleA = a.title.toLowerCase()
			const titleB = b.title.toLowerCase()
			if (options.sortByName === 'asc') {
				return titleA.localeCompare(titleB, 'ru')
			} else {
				return titleB.localeCompare(titleA, 'ru')
			}
		})
	}

	log('Search results:', { total: filtered.length, sources: sourceCounts })

	return {
		products: filtered,
		total: filtered.length,
		sources: sourceCounts
	}
}
