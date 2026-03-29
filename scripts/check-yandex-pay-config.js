import { yandexPayConfig } from '../config/yandex-pay.config.js'

console.log('Yandex Pay Configuration:')
console.log('env:', yandexPayConfig.env)
console.log('baseUrl:', yandexPayConfig.baseUrl)
console.log('merchantId:', yandexPayConfig.merchantId ? '***' + yandexPayConfig.merchantId.slice(-4) : 'not set')
console.log('apiKey:', yandexPayConfig.apiKey ? '***' + yandexPayConfig.apiKey.slice(-4) : 'not set')
console.log('redirectUrls:', yandexPayConfig.redirectUrls)

// Проверка, является ли окружение production
if (yandexPayConfig.env === 'production') {
	console.log('✅ Окружение production — оплата реальная')
} else {
	console.log('⚠️ Окружение sandbox — тестовая оплата')
}
