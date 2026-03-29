import { createVerificationToken } from '@/lib/auth/email-verification'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { sendVerificationEmail } from '@/lib/email/send-email'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
	try {
		const { email, password, name } = await request.json()

		// Валидация
		if (!email || !password || !name) {
			return NextResponse.json({ success: false, error: 'Email, пароль и имя обязательны' }, { status: 400 })
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(email)) {
			return NextResponse.json({ success: false, error: 'Введите корректный email' }, { status: 400 })
		}

		if (password.length < 6) {
			return NextResponse.json({ success: false, error: 'Пароль должен быть не менее 6 символов' }, { status: 400 })
		}

		// Проверяем, существует ли пользователь
		const [existingUser] = await db.select().from(user).where(eq(user.email, email)).limit(1)

		if (existingUser) {
			return NextResponse.json({ success: false, error: 'Пользователь с таким email уже существует' }, { status: 409 })
		}

		// Создаём нового пользователя
		const hashedPassword = await bcrypt.hash(password, 10)
		const newUser = {
			id: crypto.randomUUID(),
			email: email.toLowerCase().trim(),
			name: name.trim(),
			password: hashedPassword,
			emailVerified: false,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		await db.insert(user).values({
			id: newUser.id,
			email: newUser.email,
			name: newUser.name,
			password: newUser.password,
			emailVerified: newUser.emailVerified,
			createdAt: newUser.createdAt,
			updatedAt: newUser.updatedAt
		})

		// Генерация токена и отправка email подтверждения
		const token = await createVerificationToken(newUser.email)
		const emailResult = await sendVerificationEmail(newUser.email, token)

		if (!emailResult.success) {
			console.error('Failed to send verification email:', emailResult.error)
			// Пользователь создан, но email не отправлен — можно записать в лог
			// Не прерываем регистрацию, но уведомляем
		}

		return NextResponse.json({
			success: true,
			message: 'Аккаунт создан. Пожалуйста, проверьте вашу почту для подтверждения email.',
			emailSent: emailResult.success
		})
	} catch (error) {
		console.error('[Register API] Error:', error)
		return NextResponse.json({ success: false, error: 'Ошибка при создании аккаунта' }, { status: 500 })
	}
}
