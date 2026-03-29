import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { order } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const session = await getServerSession(authOptions)

		if (!session?.user?.id) {
			return NextResponse.json({ success: false, error: 'Не авторизован' }, { status: 401 })
		}

		const orders = await db
			.select({
				id: order.id,
				status: order.status,
				total: order.total,
				items: order.items,
				customerEmail: order.customerEmail,
				trackingNumber: order.trackingNumber,
				createdAt: order.createdAt,
				updatedAt: order.updatedAt
			})
			.from(order)
			.where(eq(order.userId, session.user.id))
			.orderBy(desc(order.createdAt))

		// Парсим items из JSON строки для каждого заказа
		const ordersWithParsedItems = orders.map(o => ({
			...o,
			items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items,
			// Форматируем даты в строки для удобства
			createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : o.createdAt,
			updatedAt: o.updatedAt instanceof Date ? o.updatedAt.toISOString() : o.updatedAt
		}))

		return NextResponse.json({
			success: true,
			data: ordersWithParsedItems
		})
	} catch (error) {
		console.error('[UserOrders] Error:', error)
		return NextResponse.json({ success: false, error: 'Ошибка получения заказов' }, { status: 500 })
	}
}
