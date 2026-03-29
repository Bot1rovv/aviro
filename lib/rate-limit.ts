import { LRUCache } from 'lru-cache'

type RateLimitOptions = {
	interval: number // интервал в мс
	uniqueTokenPerInterval?: number // максимальное количество уникальных токенов за интервал
}

export default function rateLimit(options: RateLimitOptions) {
	const tokenCache = new LRUCache<string, number[]>({
		max: options.uniqueTokenPerInterval || 500,
		ttl: options.interval
	})

	return {
		check: (limit: number, token: string) => {
			const now = Date.now()
			const tokenTimestamps = tokenCache.get(token) || []
			// Удаляем старые временные метки, которые вышли за интервал
			const validTimestamps = tokenTimestamps.filter((ts: number) => now - ts < options.interval)
			if (validTimestamps.length >= limit) {
				return { pass: false, remaining: 0 }
			}
			validTimestamps.push(now)
			tokenCache.set(token, validTimestamps)
			return { pass: true, remaining: limit - validTimestamps.length }
		}
	}
}
