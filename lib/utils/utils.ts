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
 * Нормализует URL изображения для Next.js/Image и обычного <img>.
 * Поддерживает:
 * - //img.alicdn.com/...
 * - http://...
 * - https://...
 * - /imgextra/...
 * - imgextra/...
 * - /bao/uploaded/...
 * - data:image/...
 * - локальные /no-image.jpg
 */
export function normalizeImageUrl(url: string): string {
	if (!url || typeof url !== 'string') return '/no-image.jpg'

	const trimmed = url.trim()
	if (!trimmed) return '/no-image.jpg'

	// base64 / data uri
	if (trimmed.startsWith('data:image/')) {
		return trimmed
	}

	// protocol-relative
	if (trimmed.startsWith('//')) {
		return `https:${trimmed}`
	}

	// absolute
	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return trimmed
	}

	// локальные public-файлы
	if (trimmed.startsWith('/no-image') || trimmed.startsWith('/images/') || trimmed.startsWith('/favicons/')) {
		return trimmed
	}

	// частые пути Alibaba/Taobao без домена
	if (trimmed.startsWith('/imgextra/') || trimmed.startsWith('imgextra/')) {
		return `https://img.alicdn.com/${trimmed.replace(/^\/+/, '')}`
	}

	if (trimmed.startsWith('/bao/uploaded/') || trimmed.startsWith('bao/uploaded/')) {
		return `https://img.alicdn.com/${trimmed.replace(/^\/+/, '')}`
	}

	if (trimmed.startsWith('/uploaded/') || trimmed.startsWith('uploaded/')) {
		return `https://img.alicdn.com/${trimmed.replace(/^\/+/, '')}`
	}

	if (trimmed.startsWith('/i') || trimmed.startsWith('i')) {
		return `https://img.alicdn.com/${trimmed.replace(/^\/+/, '')}`
	}

	// если пришёл домен без протокола
	if (
		trimmed.startsWith('img.alicdn.com/') ||
		trimmed.startsWith('gview.alicdn.com/') ||
		trimmed.startsWith('gw.alicdn.com/') ||
		trimmed.startsWith('img.taobao.com/') ||
		trimmed.startsWith('img.china.alibaba.com/')
	) {
		return `https://${trimmed}`
	}

	// если это другой относительный путь, не ломаем сайт
	if (trimmed.startsWith('/')) {
		return trimmed
	}

	return `https://${trimmed}`
}