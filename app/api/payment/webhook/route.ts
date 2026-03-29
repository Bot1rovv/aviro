import { db } from '@/lib/db'
import { order } from '@/lib/db/schema'
import { sendReceiptEmail } from '@/lib/email/send-email'
import crypto from 'crypto'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

// Типы уведомления от Яндекс.Пэй (согласно документации)
interface YandexPayWebhookPayload {
	event:
		| 'payment.succeeded'
		| 'payment.canceled'
		| 'payment.waiting_for_capture'
		| 'refund.succeeded'
		| 'payment.captured'
		| 'payment.refunded'
		| 'payment.partially_refunded'
		| 'payment.confirmed'
	orderId: string
	paymentId?: string
	status:
		| 'succeeded'
		| 'canceled'
		| 'waiting_for_capture'
		| 'pending'
		| 'captured'
		| 'refunded'
		| 'partially_refunded'
		| 'confirmed'
		| 'authorized'
		| 'voided'
	amount: {
		value: string
		currency: string
	}
	metadata?: {
		internalOrderId?: string
		userId?: string
	}
	createdAt: string
}

// Тип товара в корзине (совместим с CreateOrderRequest)
interface CartItem {
	id: string
	title: string
	price: number
	quantity: number
	image?: string
}

// Функция для проверки подписи вебхука Яндекс.Пэй
function verifySignature(body: string, signature: string | null): boolean {
	// Если подпись не передана, в продакшене отклоняем, в разработке пропускаем
	if (!signature) {
		// В режиме разработки разрешаем пропуск проверки
		if (process.env.NODE_ENV === 'production') {
			console.warn('Missing signature in production')
			return false
		}
		return true
	}

	const secret = process.env.YANDEX_PAY_WEBHOOK_SECRET || process.env.YANDEX_PAY_API_KEY
	if (!secret) {
		console.error('YANDEX_PAY_WEBHOOK_SECRET or YANDEX_PAY_API_KEY is not set')
		// В разработке пропускаем, в продакшене лучше отклонять
		return process.env.NODE_ENV !== 'production'
	}

	// Ожидаемая подпись: HMAC-SHA256 от тела запроса с секретом, закодированная в hex
	const hmac = crypto.createHmac('sha256', secret)
	const expectedSignature = hmac.update(body).digest('hex')
	// Сравниваем с переданной подписью (может быть в формате hex или base64)
	// Яндекс.Пэй обычно отправляет в заголовке X-Yandex-Pay-Signature значение в формате hex
	if (signature.length === 64) {
		// Предполагаем hex
		return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
	}
	// Если подпись в другом формате, просто сравниваем строки (небезопасно, но для совместимости)
	return expectedSignature === signature
}

export async function POST(request: NextRequest) {
	try {
		const bodyText = await request.text()
		const signature = request.headers.get('X-Yandex-Pay-Signature')

		// Проверяем подпись (если требуется)
		if (!verifySignature(bodyText, signature)) {
			console.warn('Invalid signature in webhook')
			return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
		}

		const payload: YandexPayWebhookPayload = JSON.parse(bodyText)

		console.log('Yandex.Pay webhook received:', { event: payload.event, status: payload.status, orderId: payload.orderId })

		// Определяем внутренний ID заказа
		let internalOrderId = payload.metadata?.internalOrderId
		if (!internalOrderId) {
			// Если internalOrderId нет в metadata, попробуем извлечь из orderId (префикс yandex_)
			const match = payload.orderId.match(/^yandex_(.+)/)
			if (match) {
				internalOrderId = match[1]
			} else {
				// Если не удалось, считаем что orderId равен internalOrderId (без префикса)
				internalOrderId = payload.orderId
			}
		}

		if (!internalOrderId) {
			console.error('Cannot determine internal order ID from payload:', payload)
			return NextResponse.json({ error: 'Missing internal order ID' }, { status: 400 })
		}

		// Преобразуем статус Яндекс.Пэй в наш внутренний статус
		let newStatus: string
		switch (payload.status) {
			case 'captured':
			case 'succeeded':
				newStatus = 'paid' // новый статус для успешной оплаты
				break
			case 'canceled':
			case 'voided':
				newStatus = 'cancelled'
				break
			case 'waiting_for_capture':
				newStatus = 'pending'
				break
			case 'confirmed':
				newStatus = 'confirmed' // для сплита с оплатой при получении
				break
			case 'refunded':
				newStatus = 'refunded'
				break
			case 'partially_refunded':
				newStatus = 'partially_refunded'
				break
			case 'authorized':
				newStatus = 'authorized'
				break
			case 'pending':
			default:
				newStatus = 'pending'
		}

		// Обновляем заказ в БД с возвратом обновленной строки
		const updatedAt = new Date()
		const updatedOrders = await db
			.update(order)
			.set({
				status: newStatus,
				updatedAt
			})
			.where(eq(order.id, internalOrderId))
			.returning()

		if (updatedOrders.length === 0) {
			console.warn(`Order ${internalOrderId} not found in database`)
			// Можно создать новый заказ, но в нашем случае заказ должен быть создан ранее
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		console.log(`Order ${internalOrderId} updated to status ${newStatus}`)

		// Дополнительные действия в зависимости от события
		if (payload.event === 'payment.succeeded' || payload.event === 'payment.captured') {
			// Оплата успешно завершена
			// Отправляем email с чеком
			const orderRecord = updatedOrders[0]
			const customerEmail = orderRecord.customerEmail
			if (customerEmail) {
				try {
					const items = JSON.parse(orderRecord.items) as CartItem[] // массив CartItem
					await sendReceiptEmail(customerEmail, {
						id: orderRecord.id,
						total: orderRecord.total,
						items: items.map(item => ({
							title: item.title,
							price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
							quantity: item.quantity,
							image: item.image
						})),
						createdAt: orderRecord.createdAt.toISOString()
					})
					console.log(`Receipt email sent to ${customerEmail} for order ${orderRecord.id}`)
				} catch (emailError) {
					console.error('Failed to send receipt email:', emailError)
					// Не прерываем выполнение вебхука из-за ошибки email
				}
			} else {
				console.warn(`No customer email for order ${orderRecord.id}, skipping receipt email`)
			}
			// Очистка корзины будет выполнена на фронтенде после успешного редиректа
		}
		if (payload.event === 'payment.refunded' || payload.event === 'payment.partially_refunded') {
			// Возврат средств
			// Логирование возврата
		}
		if (payload.event === 'payment.confirmed') {
			// Подтверждение для сплита с оплатой при получении
			// Можно обновить заказ как ожидающий оплаты при получении
		}

		// Возвращаем успешный ответ
		return NextResponse.json({ success: true, orderId: internalOrderId, status: newStatus })
	} catch (error) {
		console.error('Error processing webhook:', error)
		return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
	}
}

// Яндекс.Пэй может также отправлять GET запросы для проверки вебхука (верификация)
export async function GET(_request: NextRequest) {
	return NextResponse.json({ message: 'Yandex.Pay webhook endpoint is active' })
}
