import { db } from '@/lib/db'
import { verification } from '@/lib/db/schema'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'

// Генерация случайного токена
export function generateToken(length: number = 32): string {
	return crypto.randomBytes(length).toString('hex')
}

// Сохранить токен подтверждения для email
export async function createVerificationToken(email: string) {
	const token = generateToken()
	const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 часа

	// Удаляем старые токены для этого email
	await db.delete(verification).where(eq(verification.identifier, email))

	await db.insert(verification).values({
		id: crypto.randomUUID(),
		identifier: email,
		value: token,
		expiresAt: expiresAt,
		createdAt: new Date()
	})

	return token
}

// Сохранить токен для сброса пароля
export async function createPasswordResetToken(email: string) {
	const token = generateToken()
	const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 час

	// Удаляем старые токены для этого email
	await db.delete(verification).where(eq(verification.identifier, `password-reset:${email}`))

	await db.insert(verification).values({
		id: crypto.randomUUID(),
		identifier: `password-reset:${email}`,
		value: token,
		expiresAt: expiresAt,
		createdAt: new Date()
	})

	return token
}

// Найти запись по токену
export async function findVerificationByToken(token: string) {
	const [record] = await db.select().from(verification).where(eq(verification.value, token)).limit(1)
	return record || null
}

// Проверить токен (с email или без)
export async function verifyToken(token: string, email?: string) {
	let record
	if (email) {
		;[record] = await db.select().from(verification).where(eq(verification.identifier, email)).limit(1)
	} else {
		record = await findVerificationByToken(token)
	}

	if (!record) {
		return { valid: false, error: 'Токен не найден' }
	}

	if (record.value !== token) {
		return { valid: false, error: 'Неверный токен' }
	}

	if (new Date(record.expiresAt) < new Date()) {
		return { valid: false, error: 'Токен истёк' }
	}

	// Токен валиден, удаляем его
	await db.delete(verification).where(eq(verification.id, record.id))

	return { valid: true, email: record.identifier }
}

// Проверить токен сброса пароля
export async function verifyPasswordResetToken(token: string, email: string) {
	const record = await findVerificationByToken(token)
	if (!record) {
		return { valid: false, error: 'Токен не найден' }
	}
	if (record.identifier !== `password-reset:${email}`) {
		return { valid: false, error: 'Токен не соответствует email' }
	}
	if (new Date(record.expiresAt) < new Date()) {
		return { valid: false, error: 'Токен истёк' }
	}
	// Токен валиден, удаляем его
	await db.delete(verification).where(eq(verification.id, record.id))
	return { valid: true, email }
}
