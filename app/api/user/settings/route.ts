import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function PUT(request: Request) {
	try {
		const session = await getServerSession(authOptions)

		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, error: 'Не авторизован' },
				{ status: 401 }
			)
		}

		const body = await request.json()
		const { name, email, phone, lastName, patronymic, city, address, addressExtra } = body

		// Валидация email если передан
		if (email) {
			const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
			if (!emailRegex.test(email)) {
				return NextResponse.json(
					{ success: false, error: 'Некорректный email' },
					{ status: 400 }
				)
			}
		}

		// Собираем данные для обновления
		const updateData: Record<string, unknown> = {
			updatedAt: new Date()
		}

		if (name !== undefined) updateData.name = name
		if (email !== undefined) updateData.email = email
		if (phone !== undefined) updateData.phone = phone

		// Дополнительные поля адреса сохраняем в JSON поле или создаём отдельные поля
		// Пока сохраним как JSON в дополнительное поле
		const addressData: Record<string, string> = {}
		if (lastName !== undefined) addressData.lastName = lastName
		if (patronymic !== undefined) addressData.patronymic = patronymic
		if (city !== undefined) addressData.city = city
		if (address !== undefined) addressData.address = address
		if (addressExtra !== undefined) addressData.addressExtra = addressExtra

		if (Object.keys(addressData).length > 0) {
			updateData.addressData = JSON.stringify(addressData)
		}

		// Обновляем пользователя
		await db.update(user).set(updateData).where(eq(user.id, session.user.id))

		return NextResponse.json({
			success: true,
			message: 'Настройки сохранены'
		})
	} catch (error) {
		console.error('[UserSettings] Error:', error)
		return NextResponse.json(
			{ success: false, error: 'Ошибка сохранения настроек' },
			{ status: 500 }
		)
	}
}
