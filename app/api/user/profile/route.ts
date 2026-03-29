import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { authOptions } from '@/lib/auth'
import { eq } from 'drizzle-orm'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET() {
	try {
		const session = await getServerSession(authOptions)

		if (!session?.user?.id) {
			return NextResponse.json(
				{ success: false, error: 'Не авторизован' },
				{ status: 401 }
			)
		}

		const [userData] = await db.select({
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			addressData: user.addressData
		}).from(user).where(eq(user.id, session.user.id)).limit(1)

		if (!userData) {
			return NextResponse.json(
				{ success: false, error: 'Пользователь не найден' },
				{ status: 404 }
			)
		}

		// Парсим addressData из JSON
		let addressData = null
		if (userData.addressData) {
			try {
				addressData = JSON.parse(userData.addressData)
			} catch {
				addressData = null
			}
		}

		return NextResponse.json({
			success: true,
			data: {
				name: userData.name,
				email: userData.email,
				phone: userData.phone,
				addressData
			}
		})
	} catch (error) {
		console.error('[UserProfile] Error:', error)
		return NextResponse.json(
			{ success: false, error: 'Ошибка получения профиля' },
			{ status: 500 }
		)
	}
}
