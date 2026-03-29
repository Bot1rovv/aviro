import { CNY_TO_RUB_RATE, PRICE_MARKUP_PERCENT, PRICE_ROUND_UP } from '@/config/constants'

/**
 * Конвертация цены из юаней (CNY) в рубли (RUB).
 * Цены с API 1688, Taobao, Poizon приходят в юанях.
 * Применяется надбавка и округление.
 */
export function cnyToRub(priceCny: number): number {
	if (!priceCny || priceCny <= 0) return 0

	// Конвертируем юани в рубли
	let priceRub = priceCny * CNY_TO_RUB_RATE

	// Добавляем надбавку
	priceRub = priceRub * (1 + PRICE_MARKUP_PERCENT / 100)

	// Округляем (без копеек или с копейками)
	if (PRICE_ROUND_UP) {
		priceRub = Math.round(priceRub)
	} else {
		priceRub = Math.round(priceRub * 100) / 100
	}

	return priceRub
}

/**
 * Форматирование цены в рублях
 * @param price - число или строка с ценой (уже в рублях)
 * @param decimals - количество знаков после запятой (по умолчанию 2)
 * @returns отформатированная строка цены
 */
export function formatPrice(price: number | string, decimals: number = 2): string {
	const numPrice = typeof price === 'string' ? parseFloat(price) : price
	if (isNaN(numPrice)) return '0 ₽'
	return `${numPrice.toFixed(decimals)} ₽`
}

/**
 * Форматирование даты для отображения
 * @param dateStr - строка даты или объект Date
 * @param options - опции форматирования
 * @returns отформатированная строка даты
 */
export function formatDate(dateStr: string | Date, options?: Intl.DateTimeFormatOptions): string {
	const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr

	const defaultOptions: Intl.DateTimeFormatOptions = {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	}

	return date.toLocaleString('ru-RU', options ?? defaultOptions)
}

/**
 * Форматирование даты без времени
 * @param dateStr - строка даты или объект Date
 * @returns отформатированная строка даты
 */
export function formatDateOnly(dateStr: string | Date): string {
	const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
	return date.toLocaleString('ru-RU', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	})
}

/**
 * Форматирование относительного времени (например, "5 минут назад")
 * @param dateStr - строка даты или объект Date
 * @returns строка относительного времени
 */
export function formatRelativeTime(dateStr: string | Date): string {
	const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
	const now = new Date()
	const diffMs = now.getTime() - date.getTime()
	const diffSec = Math.floor(diffMs / 1000)
	const diffMin = Math.floor(diffSec / 60)
	const diffHour = Math.floor(diffMin / 60)
	const diffDay = Math.floor(diffHour / 24)

	if (diffSec < 60) return 'Только что'
	if (diffMin < 60) return `${diffMin} мин. назад`
	if (diffHour < 24) return `${diffHour} ч. назад`
	if (diffDay < 7) return `${diffDay} дн. назад`

	return formatDateOnly(date)
}
