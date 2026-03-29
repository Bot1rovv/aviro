// Using global Jest functions

import * as cache from '../cache'

// Mock environment variables
const originalEnv = process.env

describe('Cache Utilities (sync)', () => {
	beforeEach(() => {
		jest.resetModules()
		process.env = { ...originalEnv }
		// Clear cache between tests
		cache.clearCache()
	})

	afterAll(() => {
		process.env = originalEnv
	})

	describe('getFromCache / setToCache', () => {
		it('should store and retrieve a value', () => {
			const key = 'test-key'
			const value = { foo: 'bar' }
			cache.setToCache(key, value)
			const retrieved = cache.getFromCache(key)
			expect(retrieved).toEqual(value)
		})

		it('should return undefined for missing key', () => {
			expect(cache.getFromCache('nonexistent')).toBeUndefined()
		})

		it('should respect TTL', () => {
			jest.useFakeTimers()
			const key = 'ttl-key'
			cache.setToCache(key, 'value', 100) // 100 ms TTL
			expect(cache.getFromCache(key)).toBe('value')
			jest.advanceTimersByTime(150)
			expect(cache.getFromCache(key)).toBeUndefined()
			jest.useRealTimers()
		})
	})

	describe('deleteFromCache', () => {
		it('should delete a key', () => {
			const key = 'delete-key'
			cache.setToCache(key, 'value')
			expect(cache.getFromCache(key)).toBe('value')
			cache.deleteFromCache(key)
			expect(cache.getFromCache(key)).toBeUndefined()
		})
	})

	describe('hasKey', () => {
		it('should return true for existing key', () => {
			const key = 'has-key'
			cache.setToCache(key, 'value')
			expect(cache.hasKey(key)).toBe(true)
		})

		it('should return false for missing key', () => {
			expect(cache.hasKey('missing')).toBe(false)
		})
	})

	describe('clearCache', () => {
		it('should clear all keys', () => {
			cache.setToCache('key1', 'value1')
			cache.setToCache('key2', 'value2')
			expect(cache.getCacheSize()).toBe(2)
			cache.clearCache()
			expect(cache.getCacheSize()).toBe(0)
			expect(cache.getFromCache('key1')).toBeUndefined()
			expect(cache.getFromCache('key2')).toBeUndefined()
		})
	})

	describe('generateCacheKey', () => {
		it('should generate a key from URL only', () => {
			const key = cache.generateCacheKey('https://api.example.com/data')
			expect(key).toBe('https://api.example.com/data?')
		})

		it('should include sorted params', () => {
			const params = { b: 2, a: 1 }
			const key = cache.generateCacheKey('https://api.example.com/data', params)
			expect(key).toBe('https://api.example.com/data?a=1&b=2')
		})

		it('should handle empty params', () => {
			const key = cache.generateCacheKey('https://api.example.com/data', {})
			expect(key).toBe('https://api.example.com/data?')
		})
	})
})
