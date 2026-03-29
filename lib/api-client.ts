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
    if (DEBUG) console.error(...args)
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
 */
function enrichParams1688(params: Record<string, string | number | boolean>): Record<string, string | number | boolean> {
    const enriched: Record<string, string | number | boolean> = { ...params }
    if (API_CONFIG.ACCESS_KEY) enriched.appKey = API_CONFIG.ACCESS_KEY
    if (API_CONFIG.ACCESS_SECRET) enriched.appSecret = API_CONFIG.ACCESS_SECRET
    if (API_CONFIG.ACCESS_SECRET) {
        enriched.sign = generateSign(enriched, API_CONFIG.ACCESS_SECRET)
    }
    return enriched
}

/**
 * Добавляет необходимые параметры аутентификации для Taobao API.
 */
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
    if (NO_QUERY_ENDPOINTS.includes(endpoint)) return {}
    if (isTaobaoEndpoint(endpoint)) return enrichParamsTaobao(params)
    return enrichParams1688(params)
}

/**
 * Универсальный клиент для запросов к API Daji.
 */
export async function dajiFetch<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { method = 'GET', headers = {}, body, params = {} } = options

    if (!API_CONFIG.ACCESS_KEY || !API_CONFIG.ACCESS_SECRET) {
        return mockResponse(endpoint, params) as T
    }

    const enrichedParams = enrichParams(endpoint, params)
    const queryString = new URLSearchParams(
        Object.entries(enrichedParams).reduce((acc, [key, value]) => {
            acc[key] = String(value)
            return acc
        }, {} as Record<string, string>)
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
            throw Error(`API error: ${response.status} ${response.statusText}: ${errorText}`)
        }
        return await response.json() as T
    } catch (err) {
        error('API request failed:', err)
        throw err
    }
}

/**
 * Mock-ответ для демонстрации (Оставлен без изменений)
 */
function mockResponse(endpoint: string, params: Record<string, string | number | boolean>): unknown {
    // ... логика моков ...
    return { code: 200, message: 'success', data: [] }
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

/**
 * Загрузка изображения на 1688 и получение imageId.
 */
export function uploadImage1688(imageBase64: string, params?: Record<string, string | number | boolean>) {
    // СЕНЬОРСКИЙ ФИКС: Отрезаем префикс браузера data:image/...
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '')

    const paramsObj: Record<string, string | number | boolean> = {
        // Передаем в несколько полей для совместимости с разными версиями Daji API
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

export function getFreight1688(offerId: string, toCityCode: string = '310115', toCountryCode: string = '310115', toProvinceCode: string = '310000', totalNum: number = 1, logisticsSkuNumModels: Array<{ skuId?: string; number?: number }> = [], params?: Record<string, string | number | boolean>) {
    const body = { appKey: API_CONFIG.ACCESS_KEY, appSecret: API_CONFIG.ACCESS_SECRET, offerId: Number(offerId), toProvinceCode, toCityCode, toCountryCode, totalNum, logisticsSkuNumModels, ...params }
    return dajiFetch(ENDPOINTS.FREIGHT_1688, { method: 'POST', body, params: {} })
}

export function getLogisticPriceTaobao(itemId: string, addressInfo: { country: string; state: string; city: string; district: string }, params?: Record<string, string | number | boolean>) {
    const addressInfoString = `{country: '${addressInfo.country}', city: '${addressInfo.city}', district: '${addressInfo.district}', state: '${addressInfo.state}'}`
    const body = { appKey: API_CONFIG.ACCESS_KEY, appSecret: API_CONFIG.ACCESS_SECRET, item_id: itemId, address_info: addressInfoString }
    return dajiFetch(ENDPOINTS.TAOBAO_LOGISTIC_PRICE, { method: 'POST', body, params: {} })
}

export function searchTaobaoProductsByKeyword(keyword: string, params?: Record<string, string | number | boolean>) {
    return dajiFetch(ENDPOINTS.TAOBAO_KEYWORD_SEARCH, { method: 'GET', params: { keyword, page_no: 1, page_size: 20, ...params } })
}

export function searchTaobaoProductsByImage(imageFile: File, params?: Record<string, string | number | boolean>) {
    const formData = new FormData()
    formData.append('image', imageFile)
    return dajiFetch(ENDPOINTS.TAOBAO_IMAGE_SEARCH, { method: 'POST', body: formData, headers: {} })
}

/**
 * Загрузка изображения на Taobao и получение imageId.
 */
export function uploadImageTaobao(imageBase64: string, params?: Record<string, string | number | boolean>) {
    // СЕНЬОРСКИЙ ФИКС: Отрезаем префикс
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

export function searchTaobaoProductsByImageUrl(imageUrl: string, categoryId?: string, pageNo: number = 0, pageSize: number = 10, crop: boolean = true, params?: Record<string, string | number | boolean>) {
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

export function getPoizonProducts(keyword?: string, chineseKeyword?: string, brand?: string, params?: Record<string, string | number | boolean>) {
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
    id: string; title: string; price: number; image: string; source: 'taobao' | '1688' | 'poizon'; shopName?: string; sales?: number; originalData: unknown
}

export interface SearchOptions {
    sortByPrice?: 'asc' | 'desc'; sortByName?: 'asc' | 'desc'; minPrice?: number; maxPrice?: number; sources?: ('taobao' | '1688' | 'poizon')[]
}

export async function searchAllProducts(keyword: string, page: number = 1, pageSize: number = 10, options?: SearchOptions): Promise<{ products: UnifiedProduct[]; total: number; sources: { taobao: number; '1688': number; poizon: number } }> {
    // Реализация searchAllProducts осталась неизменной (убрал из ответа для компактности, так как она не влияет на картинки, но у себя в файле не удаляй)
    return { products: [], total: 0, sources: { taobao: 0, '1688': 0, poizon: 0 } }
}