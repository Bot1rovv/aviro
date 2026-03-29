// In-memory кэш на основе LRU
// После удаления Redis используется только память

import { LRUCache } from 'lru-cache'

type CacheKey = string

// Настройки in-memory кэша (fallback)
const cacheMaxSize = parseInt(process.env.CACHE_MAX_SIZE || '100', 10)
const cacheTtlMs = parseInt(process.env.CACHE_TTL_MS || '300000', 10)

const defaultOptions = {
	max: Number.isNaN(cacheMaxSize) ? 100 : cacheMaxSize,
	ttl: Number.isNaN(cacheTtlMs) ? 1000 * 60 * 5 : cacheTtlMs // 5 минут по умолчанию
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const memoryCache = new LRUCache<CacheKey, any>(defaultOptions)

/**
 * Синхронное получение значения из кэша (только память)
 */
export function getFromCache<T>(key: CacheKey): T | undefined {
	return memoryCache.get(key) as T | undefined
}

/**
 * Асинхронное получение значения из кэша (для совместимости)
 */
export async function getFromCacheAsync<T>(key: CacheKey): Promise<T | undefined> {
	return memoryCache.get(key) as T | undefined
}

/**
 * Синхронное сохранение значения в кэш (только память)
 */
export function setToCache<T>(key: CacheKey, value: T, ttl?: number): void {
	memoryCache.set(key, value, { ttl })
}

/**
 * Асинхронное сохранение значения в кэш (для совместимости)
 */
export async function setToCacheAsync<T>(key: CacheKey, value: T, ttl?: number): Promise<void> {
	memoryCache.set(key, value, { ttl })
}

/**
 * Удалить значение из кэша (синхронно, только память)
 */
export function deleteFromCache(key: CacheKey): void {
	memoryCache.delete(key)
}

/**
 * Асинхронное удаление значения из кэша (для совместимости)
 */
export async function deleteFromCacheAsync(key: CacheKey): Promise<void> {
	memoryCache.delete(key)
}

/**
 * Очистить весь кэш (синхронно, только память)
 */
export function clearCache(): void {
	memoryCache.clear()
}

/**
 * Асинхронная очистка кэша (для совместимости)
 */
export async function clearCacheAsync(): Promise<void> {
	memoryCache.clear()
}

/**
 * Проверить наличие ключа в кэше (синхронно, только память)
 */
export function hasKey(key: CacheKey): boolean {
	return memoryCache.has(key)
}

/**
 * Асинхронная проверка наличия ключа (для совместимости)
 */
export async function hasKeyAsync(key: CacheKey): Promise<boolean> {
	return memoryCache.has(key)
}

/**
 * Получить количество элементов в кэше (только память)
 */
export function getCacheSize(): number {
	return memoryCache.size
}

/**
 * Генератор ключа для API-запроса на основе URL и параметров
 */
export function generateCacheKey(url: string, params?: Record<string, unknown>): string {
	const sortedParams = params
		? Object.keys(params)
				.sort()
				.map(k => `${k}=${JSON.stringify(params[k])}`)
				.join('&')
		: ''
	return `${url}?${sortedParams}`
}
