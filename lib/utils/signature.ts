import crypto from 'crypto'

/**
 * Генерация строки для подписи согласно документации Daji API.
 */
export function generateSignString(params: Record<string, string | number | boolean>, secret: string): string {
	const filteredParams = { ...params }
	delete filteredParams.sign
	const sortedKeys = Object.keys(filteredParams).sort()
	const signString = sortedKeys.map(key => `${key}=${filteredParams[key]}`).join('&') + `&secret=${secret}`
	return signString
}

/**
 * Вычисление MD5 хэша строки и возврат в верхнем регистре.
 */
export function md5(str: string): string {
	return crypto.createHash('md5').update(str).digest('hex').toUpperCase()
}

/**
 * Генерация подписи (sign) для запроса.
 */
export function generateSign(params: Record<string, string | number | boolean>, secret: string): string {
	return md5(generateSignString(params, secret))
}
