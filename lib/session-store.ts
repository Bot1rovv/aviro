/**
 * In-memory store for temporary search results.
 * Keys are session IDs, values are search results and metadata.
 * Automatically cleans up expired entries.
 * Uses globalThis to persist across serverless function invocations in development.
 */

import { ProductItem } from '@/types/product'

interface SessionData {
	results: ProductItem[]
	imageIds?: {
		'1688'?: string
		taobao?: string
	}
	sources: ('1688' | 'taobao')[]
	pageSize: number
	currentPage: number
	totalPages?: number
	expiresAt: number // timestamp in milliseconds
}

const TTL = 10 * 60 * 1000 // 10 minutes

// Use globalThis to store the map across hot reloads and function invocations
const globalKey = '__IMAGE_SEARCH_SESSION_STORE__'
declare global {
	var __IMAGE_SEARCH_SESSION_STORE__: Map<string, SessionData> | undefined
}

function getStore(): Map<string, SessionData> {
	if (typeof globalThis !== 'undefined') {
		if (!globalThis[globalKey]) {
			globalThis[globalKey] = new Map<string, SessionData>()
		}
		return globalThis[globalKey]
	}
	// Fallback for environments where globalThis is not available
	return new Map<string, SessionData>()
}

const STORE = getStore()

/**
 * Create a new session with given results.
 * Returns session ID.
 */
export function createSession(
	results: ProductItem[],
	options?: {
		imageIds?: { '1688'?: string; taobao?: string }
		sources?: ('1688' | 'taobao')[]
		pageSize?: number
		currentPage?: number
		totalPages?: number
	}
): string {
	const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
	STORE.set(sessionId, {
		results,
		imageIds: options?.imageIds,
		sources: options?.sources || ['1688', 'taobao'],
		pageSize: options?.pageSize || 20,
		currentPage: options?.currentPage || 1,
		totalPages: options?.totalPages,
		expiresAt: Date.now() + TTL
	})
	console.log(`[session-store] Created session ${sessionId} with ${results.length} items, store size: ${STORE.size}`)
	// Schedule cleanup (optional)
	setTimeout(() => {
		if (STORE.has(sessionId)) {
			STORE.delete(sessionId)
			console.log(`[session-store] Deleted expired session ${sessionId}`)
		}
	}, TTL)
	return sessionId
}

/**
 * Retrieve session data by ID.
 * Returns results or null if not found/expired.
 */
export function getSession(sessionId: string): SessionData | null {
	console.log(`[session-store] Getting session ${sessionId}, store size: ${STORE.size}`)
	const data = STORE.get(sessionId)
	if (!data) {
		console.log(`[session-store] Session ${sessionId} not found`)
		return null
	}
	if (Date.now() > data.expiresAt) {
		console.log(`[session-store] Session ${sessionId} expired`)
		STORE.delete(sessionId)
		return null
	}
	console.log(`[session-store] Session ${sessionId} returned ${data.results.length} items`)
	return data
}

/**
 * Update session with new results and metadata.
 */
export function updateSession(sessionId: string, updates: Partial<Omit<SessionData, 'expiresAt'>>): boolean {
	const data = STORE.get(sessionId)
	if (!data) return false
	STORE.set(sessionId, { ...data, ...updates })
	console.log(`[session-store] Updated session ${sessionId}`)
	return true
}

/**
 * Delete session (optional).
 */
export function deleteSession(sessionId: string): void {
	STORE.delete(sessionId)
	console.log(`[session-store] Deleted session ${sessionId}`)
}

/**
 * Clean up all expired sessions (call periodically if needed).
 */
export function cleanupExpiredSessions(): void {
	const now = Date.now()
	for (const [sessionId, data] of STORE.entries()) {
		if (now > data.expiresAt) {
			STORE.delete(sessionId)
			console.log(`[session-store] Cleanup deleted session ${sessionId}`)
		}
	}
}
