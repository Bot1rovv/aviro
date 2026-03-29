console.log('Checking Yandex Pay environment variables:')
console.log('NEXT_PUBLIC_YANDEX_PAY_ENV:', process.env.NEXT_PUBLIC_YANDEX_PAY_ENV)
console.log('YANDEX_PAY_ENV:', process.env.YANDEX_PAY_ENV)
console.log('NEXT_PUBLIC_YANDEX_PAY_BASE_URL:', process.env.NEXT_PUBLIC_YANDEX_PAY_BASE_URL)
console.log('YANDEX_PAY_BASE_URL:', process.env.YANDEX_PAY_BASE_URL)
console.log(
	'NEXT_PUBLIC_YANDEX_PAY_API_KEY:',
	process.env.NEXT_PUBLIC_YANDEX_PAY_API_KEY ? '***' + process.env.NEXT_PUBLIC_YANDEX_PAY_API_KEY.slice(-4) : 'not set'
)
console.log(
	'NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID:',
	process.env.NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID ? '***' + process.env.NEXT_PUBLIC_YANDEX_PAY_MERCHANT_ID.slice(-4) : 'not set'
)

const env = process.env.NEXT_PUBLIC_YANDEX_PAY_ENV || process.env.YANDEX_PAY_ENV || 'sandbox'
console.log('Effective env:', env)
if (env === 'production') {
	console.log('✅ Окружение production — оплата реальная')
} else {
	console.log('⚠️ Окружение sandbox — тестовая оплата')
}
