import { db } from '@/lib/db'
import { order } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const { id } = await params

		if (!id) {
			return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
		}

		const orders = await db.select().from(order).where(eq(order.id, id)).limit(1)

		if (orders.length === 0) {
			return NextResponse.json({ error: 'Order not found' }, { status: 404 })
		}

		const orderData = orders[0]

		let parsedItems: unknown = []

		try {
			parsedItems = typeof orderData.items === 'string' ? JSON.parse(orderData.items) : orderData.items
		} catch {
			parsedItems = []
		}

		let items: unknown[] = []
		let shippingCost = 0
		let moscowShippingCost = 0

		if (Array.isArray(parsedItems)) {
			items = parsedItems
		} else if (parsedItems && typeof parsedItems === 'object') {
			const parsedObject = parsedItems as {
				items?: unknown[]
				shippingCost?: number
				moscowShippingCost?: number
			}

			items = Array.isArray(parsedObject.items) ? parsedObject.items : []
			shippingCost = Number(parsedObject.shippingCost || 0)
			moscowShippingCost = Number(parsedObject.moscowShippingCost || 0)
		}

		return NextResponse.json({
			success: true,
			order: {
				...orderData,
				items,
				shippingCost,
				moscowShippingCost
			}
		})
	} catch (error) {
		console.error('Error fetching order:', error)
		return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 })
	}
}