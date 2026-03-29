import { verifyToken } from '@/lib/auth/email-verification'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const token = searchParams.get('token')
		const email = searchParams.get('email')

		if (!token) {
			return NextResponse.json({ success: false, error: 'Токен отсутствует' }, { status: 400 })
		}

		const verification = await verifyToken(token, email || undefined)

		if (!verification.valid) {
			return NextResponse.json({ success: false, error: verification.error || 'Неверный или истёкший токен' }, { status: 400 })
		}

		const verifiedEmail = verification.email!
		// Обновляем пользователя как подтверждённого
		const [updatedUser] = await db.update(user).set({ emailVerified: true }).where(eq(user.email, verifiedEmail)).returning()

		if (!updatedUser) {
			return NextResponse.json({ success: false, error: 'Пользователь не найден' }, { status: 404 })
		}

		// Перенаправляем на страницу успеха
		const redirectUrl = `${process.env.NEXTAUTH_URL}/registration-success?verified=true`
		return NextResponse.redirect(redirectUrl)
	} catch (error) {
		console.error('[Verify Email API] Error:', error)
		return NextResponse.json({ success: false, error: 'Ошибка при подтверждении email' }, { status: 500 })
	}
}
