import { db } from '@/lib/db'
import { order, user, userHistory } from '@/lib/db/schema'
import { sendOrderStatusEmail } from '@/lib/email/send-email'
import { ProductItem } from '@/types/product'
import { desc, eq } from 'drizzle-orm'

// Типы действий
export type UserAction = 'view_product' | 'add_to_favorites' | 'remove_from_favorites' | 'add_to_cart' | 'remove_from_cart'

/**
 * Добавить запись в историю пользователя
 */
export async function addToHistory(userId: string, action: UserAction, product?: ProductItem, details?: string) {
	const id = crypto.randomUUID()

	await db.insert(userHistory).values({
		id,
		userId,
		action,
		productId: product?.productId || null,
		productTitle: product?.title || null,
		productPrice: product?.price || null,
		productImage: product?.imageUrl || null,
		details: details || null,
		createdAt: new Date()
	})

	return id
}

/**
 * Получить историю пользователя
 */
export async function getUserHistory(userId: string, limit: number = 20) {
	const history = await db.select().from(userHistory).where(eq(userHistory.userId, userId)).orderBy(desc(userHistory.createdAt)).limit(limit)

	return history
}

/**
 * Очистить историю пользователя
 */
export async function clearUserHistory(userId: string) {
	await db.delete(userHistory).where(eq(userHistory.userId, userId))
}

/**
 * Получить заказы пользователя
 */
export async function getUserOrders(userId: string) {
	const orders = await db.select().from(order).where(eq(order.userId, userId)).orderBy(desc(order.createdAt))

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	return orders.map((o: any) => ({
		...o,
		items: JSON.parse(o.items)
	}))
}

/**
 * Создать заказ
 */
export async function createOrder(userId: string, items: ProductItem[], total: string) {
	const id = `ORD-${Date.now()}`
	const now = new Date()

	await db.insert(order).values({
		id,
		userId,
		status: 'pending',
		total,
		items: JSON.stringify(items),
		trackingNumber: null,
		createdAt: now,
		updatedAt: now
	})

	// Добавляем в историю
	for (const item of items) {
		await addToHistory(userId, 'view_product', item, 'Оформлен заказ')
	}

	return id
}

/**
 * Обновить статус заказа
 */
export async function updateOrderStatus(orderId: string, status: string, trackingNumber?: string) {
	// Обновляем заказ
	await db
		.update(order)
		.set({
			status,
			trackingNumber: trackingNumber || null,
			updatedAt: new Date()
		})
		.where(eq(order.id, orderId))

	// Получаем обновленный заказ и email пользователя
	const [updatedOrder] = await db.select().from(order).where(eq(order.id, orderId)).limit(1)
	if (!updatedOrder) {
		return
	}

	let customerEmail = updatedOrder.customerEmail
	if (!customerEmail && updatedOrder.userId) {
		// Получаем email пользователя из таблицы user
		const [userRecord] = await db.select().from(user).where(eq(user.id, updatedOrder.userId)).limit(1)
		if (userRecord) {
			customerEmail = userRecord.email
		}
	}

	if (!customerEmail) {
		console.warn(`No email found for order ${orderId}, skipping status email`)
		return
	}

	// Парсим items (массив объектов с title, price, quantity, image)
	let items: Array<{ title: string; price: number; quantity: number; image?: string }> = []
	try {
		const parsed = JSON.parse(updatedOrder.items)
		if (Array.isArray(parsed)) {
			items = parsed.map(item => ({
				title: item.title || '',
				price: typeof item.price === 'string' ? parseFloat(item.price) : item.price || 0,
				quantity: item.quantity || 1,
				image: item.imageUrl || item.image
			}))
		}
	} catch (e) {
		// ignore
	}

	// Отправляем email уведомление
	try {
		await sendOrderStatusEmail(customerEmail, {
			id: updatedOrder.id,
			status,
			total: updatedOrder.total,
			items,
			createdAt: updatedOrder.createdAt.toISOString(),
			trackingNumber: trackingNumber || undefined
		})
	} catch (error) {
		console.error(`Failed to send order status email for order ${orderId}:`, error)
		// Не прерываем выполнение функции из-за ошибки email
	}
}
