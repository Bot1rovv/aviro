import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_change_in_production'
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')

const secretKey = new TextEncoder().encode(JWT_SECRET)

/**
 * Хеширует пароль с использованием bcrypt.
 * @param password Пароль в открытом виде.
 * @returns Хеш пароля.
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Сравнивает пароль с хешем.
 * @param password Пароль в открытом виде.
 * @param hashedPassword Хешированный пароль.
 * @returns true, если пароль совпадает.
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword)
}

/**
 * Создаёт JWT токен для пользователя.
 * @param userId Идентификатор пользователя.
 * @param email Email пользователя.
 * @returns JWT токен.
 */
export async function createToken(userId: string, email: string): Promise<string> {
	const token = await new SignJWT({ userId, email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('7d').sign(secretKey)
	return token
}

/**
 * Проверяет JWT токен и возвращает payload.
 * @param token JWT токен.
 * @returns Payload токена или null, если токен невалиден.
 */
export async function verifyToken(token: string): Promise<{ userId: string; email: string } | null> {
	try {
		const { payload } = await jwtVerify(token, secretKey)
		return payload as { userId: string; email: string }
	} catch (error) {
		console.error('Token verification failed:', error)
		return null
	}
}
