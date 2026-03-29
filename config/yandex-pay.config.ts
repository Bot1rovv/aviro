export const yandexPayConfig = {
	apiKey: process.env.NEXT_PUBLIC_YANDEX_PAY_API_KEY || process.env.YANDEX_PAY_API_KEY || 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
	merchantId: process.env.NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID || process.env.YANDEX_PAY_MERCHANT_ID || 'your_merchant_id',
	// Определяем окружение: sandbox или production
	env: (process.env.NEXT_PUBLIC_YANDEX_PAY_ENV || process.env.YANDEX_PAY_ENV || 'sandbox') as 'sandbox' | 'production',
	// Базовый URL API Яндекс.Пэй
	baseUrl: (() => {
		// Если явно задан через переменные окружения, используем его
		const explicitBaseUrl = process.env.NEXT_PUBLIC_YANDEX_PAY_BASE_URL || process.env.YANDEX_PAY_BASE_URL
		if (explicitBaseUrl) return explicitBaseUrl
		// Иначе определяем по окружению
		const env = process.env.NEXT_PUBLIC_YANDEX_PAY_ENV || process.env.YANDEX_PAY_ENV || 'sandbox'
		return env === 'production' ? 'https://pay.yandex.ru/api/merchant' : 'https://sandbox.pay.yandex.ru/api/merchant'
	})(),
	redirectUrls: {
		success:
			process.env.NEXT_PUBLIC_YANDEX_PAY_REDIRECT_SUCCESS_URL ||
			process.env.YANDEX_PAY_REDIRECT_SUCCESS_URL ||
			'https://arivoo-hazel.vercel.app/cart/status/success',
		error:
			process.env.NEXT_PUBLIC_YANDEX_PAY_REDIRECT_ERROR_URL ||
			process.env.YANDEX_PAY_REDIRECT_ERROR_URL ||
			'https://arivoo-hazel.vercel.app/cart/status/error'
	},
	// TTL заказа в секундах (24 часа)
	orderTtl: 86400,
	// Доступные методы оплаты
	availablePaymentMethods: ['CARD'] as const,
	// Валюта
	currencyCode: 'RUB' as const
} as const

export type YandexPayConfig = typeof yandexPayConfig
