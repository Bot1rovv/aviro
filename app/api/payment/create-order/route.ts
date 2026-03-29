import { yandexPayConfig } from '@/config/yandex-pay.config'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { order } from '@/lib/db/schema'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

interface CartItem {
	id: string
	title: string
	price: number
	quantity: number
	image?: string
}

interface CreateOrderRequest {
	items: CartItem[]
	shippingCost?: number
	moscowShippingCost?: number
	userInfo: {
		email: string
		phone: string
		firstName: string
		lastName: string
		patronymic?: string
		city: string
		address: string
		addressExtra?: string
	}
}

export async function POST(request: NextRequest) {
	try {
		const session = await getServerSession(authOptions)
		const userId = session?.user?.id || 'guest'

		const body: CreateOrderRequest = await request.json()

		if (!body.items || body.items.length === 0) {
			return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 })
		}

		const { email, phone, firstName, lastName, city, address } = body.userInfo
		if (!email || !phone || !firstName || !lastName || !city || !address) {
			return NextResponse.json({ error: 'Не все обязательные поля заполнены' }, { status: 400 })
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
		}

		const cleanedPhone = phone.replace(/\D/g, '')
		const phoneRegex = /^(7|8)?\d{10}$/
		if (!phoneRegex.test(cleanedPhone)) {
			return NextResponse.json({ error: 'Некорректный номер телефона. Ожидается российский номер (10 или 11 цифр)' }, { status: 400 })
		}

		const mergedItemsMap = new Map<string, CartItem>()
		for (const item of body.items) {
			const existing = mergedItemsMap.get(item.id)
			if (existing) {
				existing.quantity += item.quantity
			} else {
				mergedItemsMap.set(item.id, { ...item })
			}
		}
		const mergedItems = Array.from(mergedItemsMap.values())

		const productsTotal = mergedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
		const chinaShippingCost = Number(body.shippingCost || 0)
		const moscowShippingCost = Number(body.moscowShippingCost || 0)
		const total = productsTotal + chinaShippingCost + moscowShippingCost

		if (total <= 0) {
			return NextResponse.json({ error: 'Сумма заказа должна быть больше нуля' }, { status: 400 })
		}

		const orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
		const yandexOrderId = `yandex_${orderId}`

		const cart = mergedItems.map(item => {
			const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price
			return {
				productId: item.id,
				title: item.title,
				quantity: {
					count: item.quantity.toString()
				},
				unitPrice: price.toFixed(2),
				total: (price * item.quantity).toFixed(2)
			}
		})

		if (chinaShippingCost > 0) {
			cart.push({
				productId: 'shipping_china',
				title: 'Доставка по Китаю',
				quantity: {
					count: '1'
				},
				unitPrice: chinaShippingCost.toFixed(2),
				total: chinaShippingCost.toFixed(2)
			})
		}

		if (moscowShippingCost > 0) {
			cart.push({
				productId: 'shipping_moscow',
				title: 'Доставка Китай → Москва',
				quantity: {
					count: '1'
				},
				unitPrice: moscowShippingCost.toFixed(2),
				total: moscowShippingCost.toFixed(2)
			})
		}

		const totalAmount = total.toFixed(2)

		const successUrl = new URL(yandexPayConfig.redirectUrls.success)
		successUrl.searchParams.set('orderId', orderId)

		const errorUrl = new URL(yandexPayConfig.redirectUrls.error)
		errorUrl.searchParams.set('orderId', orderId)

		const yandexPayload = {
			orderId: yandexOrderId,
			merchantId: yandexPayConfig.merchantId,
			currencyCode: yandexPayConfig.currencyCode,
			amount: {
				value: totalAmount,
				currency: yandexPayConfig.currencyCode
			},
			cart: {
				items: cart,
				total: {
					amount: totalAmount,
					currency: yandexPayConfig.currencyCode
				}
			},
			availablePaymentMethods: yandexPayConfig.availablePaymentMethods,
			orderTtl: yandexPayConfig.orderTtl,
			isPrepayment: false,
			metadata: JSON.stringify({
				internalOrderId: orderId,
				userId
			}),
			confirmation: {
				type: 'redirect',
				returnUrl: successUrl.toString(),
				cancelUrl: errorUrl.toString()
			},
			customer: {
				email: body.userInfo.email,
				phone: body.userInfo.phone,
				fullName: `${body.userInfo.lastName} ${body.userInfo.firstName} ${body.userInfo.patronymic || ''}`.trim(),
				deliveryAddress: {
					city: body.userInfo.city,
					street: body.userInfo.address,
					extra: body.userInfo.addressExtra || ''
				}
			},
			fiscalContact: body.userInfo.email,
			redirectUrls: {
				onSuccess: successUrl.toString(),
				onError: errorUrl.toString(),
				onAbort: errorUrl.toString()
			}
		}

		const response = await fetch(`${yandexPayConfig.baseUrl}/v1/orders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `API-Key ${yandexPayConfig.apiKey}`,
				'X-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
			},
			body: JSON.stringify(yandexPayload)
		})

		if (!response.ok) {
			const errorText = await response.text()
			console.error('Yandex.Pay API error:', response.status, errorText)
			return NextResponse.json({ error: 'Ошибка при создании заказа в Яндекс.Пэй', details: errorText }, { status: response.status })
		}

		const yandexResponse = await response.json()
		console.log('Yandex.Pay API response:', yandexResponse)

		const paymentData = yandexResponse.data || yandexResponse
		let paymentUrl = paymentData.paymentUrl
		const externalOrderId = paymentData.id || paymentData.orderId || yandexResponse.orderId

		if (!paymentUrl) {
			console.warn('Yandex.Pay response missing paymentUrl, using fallback')
			paymentUrl = paymentData.confirmationUrl || (externalOrderId ? `https://sandbox.pay.yandex.ru/pay/${externalOrderId}` : undefined)
		}

		if (!paymentUrl) {
			throw new Error('Не удалось получить paymentUrl от Яндекс.Пэй')
		}

		const { user } = await import('@/lib/db/schema')
		const { eq } = await import('drizzle-orm')

		if (userId === 'guest') {
			const existingUser = await db.select().from(user).where(eq(user.id, 'guest')).limit(1)
			if (existingUser.length === 0) {
				console.log('Creating guest user...')
				await db.insert(user).values({
					id: 'guest',
					email: 'guest@example.com',
					emailVerified: false,
					password: null,
					phone: null,
					addressData: null,
					createdAt: new Date(),
					updatedAt: new Date()
				})
			}
		}

		const now = new Date()
		const orderItemsForDb = {
			items: body.items,
			shippingCost: chinaShippingCost,
			moscowShippingCost
		}

		console.log('Inserting order into DB:', {
			id: orderId,
			userId,
			status: 'pending',
			total: totalAmount,
			items: JSON.stringify(orderItemsForDb),
			customerEmail: body.userInfo.email,
			trackingNumber: null,
			createdAt: now,
			updatedAt: now
		})

		try {
			await db.insert(order).values({
				id: orderId,
				userId,
				status: 'pending',
				total: totalAmount,
				items: JSON.stringify(orderItemsForDb),
				customerEmail: body.userInfo.email,
				trackingNumber: null,
				createdAt: now,
				updatedAt: now
			})
		} catch (dbError) {
			console.error('Database insertion error:', dbError)
			throw dbError
		}

		return NextResponse.json({
			success: true,
			orderId,
			yandexOrderId: externalOrderId,
			paymentUrl,
			status: yandexResponse.status || 'success'
		})
	} catch (error) {
		console.error('Error creating order:', error)
		return NextResponse.json({ error: 'Внутренняя ошибка сервера', details: String(error) }, { status: 500 })
	}
}