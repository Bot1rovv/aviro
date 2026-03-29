/**
 * Database-backed store for temporary search results.
 * Uses the image_search_session table in PostgreSQL/SQLite.
 */

import { db } from '@/lib/db'
import { imageSearchSession } from '@/lib/db/schema'
import { ProductItem } from '@/types/product'
import { eq } from 'drizzle-orm'

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

/**
 * Create a new session with given results.
 * Returns session ID.
 */
export async function createSession(
	results: ProductItem[],
	options?: {
		imageIds?: { '1688'?: string; taobao?: string }
		sources?: ('1688' | 'taobao')[]
		pageSize?: number
		currentPage?: number
		totalPages?: number
	}
): Promise<string> {
	const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36)
	const expiresAt = Date.now() + TTL

	await db.insert(imageSearchSession).values({
		id: sessionId,
		results: JSON.stringify(results),
		imageIds: options?.imageIds ? JSON.stringify(options.imageIds) : null,
		sources: JSON.stringify(options?.sources || ['1688', 'taobao']),
		pageSize: options?.pageSize || 20,
		currentPage: options?.currentPage || 1,
		totalPages: options?.totalPages || null,
		expiresAt: new Date(expiresAt),
		createdAt: new Date()
	})

	console.log(`[session-store-db] Created session ${sessionId} with ${results.length} items`)
	return sessionId
}

/**
 * Retrieve session data by ID.
 * Returns results or null if not found/expired.
 */
export async function getSession(sessionId: string): Promise<SessionData | null> {
	console.log(`[session-store-db] Getting session ${sessionId}`)
	const rows = await db.select().from(imageSearchSession).where(eq(imageSearchSession.id, sessionId)).limit(1)
	if (rows.length === 0) {
		console.log(`[session-store-db] Session ${sessionId} not found`)
		return null
	}
	const row = rows[0]
	const now = Date.now()
	const expiresAt = row.expiresAt.getTime()
	if (now > expiresAt) {
		console.log(`[session-store-db] Session ${sessionId} expired`)
		// Удаляем просроченную сессию
		await db.delete(imageSearchSession).where(eq(imageSearchSession.id, sessionId))
		return null
	}

	try {
		const results: ProductItem[] = JSON.parse(row.results)
		const imageIds = row.imageIds ? JSON.parse(row.imageIds) : undefined
		const sources: ('1688' | 'taobao')[] = JSON.parse(row.sources)
		const sessionData: SessionData = {
			results,
			imageIds,
			sources,
			pageSize: row.pageSize,
			currentPage: row.currentPage,
			totalPages: row.totalPages ?? undefined,
			expiresAt
		}
		console.log(`[session-store-db] Session ${sessionId} returned ${results.length} items`)
		return sessionData
	} catch (error) {
		console.error(`[session-store-db] Failed to parse session ${sessionId}:`, error)
		return null
	}
}

/**
 * Update session with new results and metadata.
 */
export async function updateSession(sessionId: string, updates: Partial<Omit<SessionData, 'expiresAt'>>): Promise<boolean> {
	const row = await db.select().from(imageSearchSession).where(eq(imageSearchSession.id, sessionId)).limit(1)
	if (row.length === 0) return false

	const current = row[0]
	const newResults = updates.results ? JSON.stringify(updates.results) : current.results
	const newImageIds = updates.imageIds !== undefined ? JSON.stringify(updates.imageIds) : current.imageIds
	const newSources = updates.sources ? JSON.stringify(updates.sources) : current.sources
	const newPageSize = updates.pageSize ?? current.pageSize
	const newCurrentPage = updates.currentPage ?? current.currentPage
	const newTotalPages = updates.totalPages ?? current.totalPages

	await db
		.update(imageSearchSession)
		.set({
			results: newResults,
			imageIds: newImageIds,
			sources: newSources,
			pageSize: newPageSize,
			currentPage: newCurrentPage,
			totalPages: newTotalPages
		})
		.where(eq(imageSearchSession.id, sessionId))

	console.log(`[session-store-db] Updated session ${sessionId}`)
	return true
}

/**
 * Delete session (optional).
 */
export async function deleteSession(sessionId: string): Promise<void> {
	await db.delete(imageSearchSession).where(eq(imageSearchSession.id, sessionId))
	console.log(`[session-store-db] Deleted session ${sessionId}`)
}

/**
 * Clean up all expired sessions (call periodically if needed).
 */
export async function cleanupExpiredSessions(): Promise<void> {
	const now = new Date()
	await db.delete(imageSearchSession).where(eq(imageSearchSession.expiresAt, now))
	console.log(`[session-store-db] Cleanup expired sessions`)
}
