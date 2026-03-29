/**
 * Утилита для условного объединения классов.
 * Принимает любое количество аргументов (строк, объектов, массивов).
 * @example cn('foo', { bar: true }, ['baz'])
 */
export function cn(...classes: (string | number | boolean | undefined | null | Record<string, boolean> | (string | number)[])[]): string {
	const result: string[] = []

	for (const cls of classes) {
		if (!cls) continue

		if (typeof cls === 'string' || typeof cls === 'number') {
			result.push(String(cls))
		} else if (Array.isArray(cls)) {
			const inner = cn(...cls)
			if (inner) result.push(inner)
		} else if (typeof cls === 'object') {
			for (const [key, value] of Object.entries(cls)) {
				if (value) result.push(key)
			}
		}
	}

	return result.join(' ')
}

/**
 * Нормализует URL изображения для Next.js Image.
 * Преобразует протокольно-относительные URL (//example.com) в https://example.com.
 * Оставляет абсолютные URL как есть, а относительные пути (начинающиеся с /) не изменяет.
 * @param url Исходный URL изображения
 * @returns Нормализованный URL, пригодный для Next.js Image
 */
export function normalizeImageUrl(url: string): string {
	if (!url || typeof url !== 'string') return url

	// Убираем пробелы
	const trimmed = url.trim()
	if (!trimmed) return trimmed

	// Если URL начинается с //, добавляем https:
	if (trimmed.startsWith('//')) {
		return `https:${trimmed}`
	}

	// Если URL начинается с http:// или https://, оставляем как есть
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed
	}

	// Относительные пути (например, /no-image.jpg) оставляем как есть
	return trimmed
}
