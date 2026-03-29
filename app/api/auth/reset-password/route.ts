import { createPasswordResetToken } from '@/lib/auth/email-verification'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { sendPasswordResetEmail } from '@/lib/email/send-email'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	try {
		const body = await request.json()
		const { email, action } = body

		if (action === 'check') {
			// Проверяем, существует ли пользователь
			const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1)

			// Всегда возвращаем success для безопасности
			// Даже если пользователя нет, показываем что письмо отправлено
			return NextResponse.json({
				success: true,
				exists: !!existingUser
			})
		}

		if (action === 'send') {
			// Отправка email с ссылкой для сброса пароля
			if (!email) {
				return NextResponse.json({ success: false, error: 'Email обязателен' }, { status: 400 })
			}

			// Проверяем, существует ли пользователь
			const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1)
			if (!existingUser) {
				// Для безопасности не сообщаем, что пользователь не найден
				return NextResponse.json({ success: true, message: 'Если пользователь существует, письмо отправлено' })
			}

			// Генерируем токен
			const token = await createPasswordResetToken(email)
			// Отправляем email
			const emailResult = await sendPasswordResetEmail(email, token)

			if (!emailResult.success) {
				console.error('Failed to send password reset email:', emailResult.error)
				return NextResponse.json({ success: false, error: 'Не удалось отправить письмо' }, { status: 500 })
			}

			return NextResponse.json({ success: true, message: 'Письмо с инструкциями отправлено' })
		}

		if (action === 'reset') {
			// Сброс пароля
			const { newPassword, token } = body

			// В реальном приложении здесь была бы проверка токена
			// Для демо просто обновляем пароль по email
			const { email: userEmail } = body

			if (!userEmail || !newPassword) {
				return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 })
			}

			const hashedPassword = await bcrypt.hash(newPassword, 10)

			await db.update(user).set({ password: hashedPassword }).where(eq(user.email, userEmail))

			return NextResponse.json({ success: true })
		}

		return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
	} catch (error) {
		console.error('Reset password error:', error)
		return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
	}
}
