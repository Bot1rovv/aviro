/**
 * Утилита для условного объединения классов.
 * Принимает любое количество аргументов (строк, объектов, массивов).
 * @example cn('foo', { bar: true }, ['baz'])
 */
export function cn(
	...classes: (
		| string
		| number
		| boolean
		| undefined
		| null
		| Record<string, boolean>
		| (string | number)[]
	)[]
): string {
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

function forceHttpsForKnownHosts(url: string): string {
	return url
		.replace(/^http:\/\/img\.alicdn\.com/i, 'https://img.alicdn.com')
		.replace(/^http:\/\/gview\.alicdn\.com/i, 'https://gview.alicdn.com')
		.replace(/^http:\/\/gw\.alicdn\.com/i, 'https://gw.alicdn.com')
		.replace(/^http:\/\/img\.taobao\.com/i, 'https://img.taobao.com')
		.replace(/^http:\/\/img\.china\.alibaba\.com/i, 'https://img.china.alibaba.com')
		.replace(/^http:\/\/cbu01\.alicdn\.com/i, 'https://cbu01.alicdn.com')
		.replace(/^http:\/\/global-img-cdn\.1688\.com/i, 'https://global-img-cdn.1688.com')
		.replace(/^http:\/\/cdn\.poizon\.com/i, 'https://cdn.poizon.com')
		.replace(/^http:\/\/img\.xqh\.me/i, 'https://img.xqh.me')
		.replace(/^http:\/\/cdn\.xqhh5\.com/i, 'https://cdn.xqhh5.com')
}

function isBrokenPlaceholder(url: string): boolean {
	const lower = url.toLowerCase()

	return (
		lower.includes('via.placeholder.com') ||
		lower.includes('placeholder.com') ||
		lower.includes('600x400?text=product') ||
		lower.includes('text=product+1') ||
		lower.includes('text=product+2') ||
		lower.includes('text=product+3')
	)
}

/**
 * Нормализует URL изображения для Next.js/Image и обычного <img>.
 */
export function normalizeImageUrl(url: string): string {
	if (!url || typeof url !== 'string') return '/no-image.jpg'

	const trimmed = url.trim()
	if (!trimmed) return '/no-image.jpg'

	if (isBrokenPlaceholder(trimmed)) {
		return '/no-image.jpg'
	}

	if (trimmed.startsWith('data:image/')) {
		return trimmed
	}

	if (trimmed.startsWith('//')) {
		const normalized = forceHttpsForKnownHosts(`https:${trimmed}`)
		return isBrokenPlaceholder(normalized) ? '/no-image.jpg' : normalized
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		const normalized = forceHttpsForKnownHosts(trimmed)
		return isBrokenPlaceholder(normalized) ? '/no-image.jpg' : normalized
	}

	if (
		trimmed.startsWith('/no-image') ||
		trimmed.startsWith('/images/') ||
		trimmed.startsWith('/favicons/')
	) {
		return trimmed
	}

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

	if (
		trimmed.startsWith('img.alicdn.com/') ||
		trimmed.startsWith('gview.alicdn.com/') ||
		trimmed.startsWith('gw.alicdn.com/') ||
		trimmed.startsWith('img.taobao.com/') ||
		trimmed.startsWith('img.china.alibaba.com/') ||
		trimmed.startsWith('cbu01.alicdn.com/') ||
		trimmed.startsWith('global-img-cdn.1688.com/') ||
		trimmed.startsWith('cdn.poizon.com/') ||
		trimmed.startsWith('img.xqh.me/') ||
		trimmed.startsWith('cdn.xqhh5.com/')
	) {
		return `https://${trimmed}`
	}

	if (trimmed.startsWith('/')) {
		return trimmed
	}

	// Если строка явно не похожа на путь к картинке — не ломаем карточку
	if (
		!trimmed.includes('.') &&
		!trimmed.includes('/') &&
		trimmed.length < 40
	) {
		return '/no-image.jpg'
	}

	const normalized = forceHttpsForKnownHosts(`https://${trimmed}`)
	return isBrokenPlaceholder(normalized) ? '/no-image.jpg' : normalized
}

export function normalizeVideoUrl(url: string): string {
	if (!url || typeof url !== 'string') return ''

	const trimmed = url.trim()
	if (!trimmed) return ''

	if (trimmed.startsWith('//')) {
		return `https:${trimmed}`
	}

	if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
		return forceHttpsForKnownHosts(trimmed)
	}

	return forceHttpsForKnownHosts(`https://${trimmed}`)
}