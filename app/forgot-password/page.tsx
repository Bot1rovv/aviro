'use client'

import { Button, FormInput } from '@/components/ui'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function ForgotPasswordPage() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [emailError, setEmailError] = useState('')
	const [loading, setLoading] = useState(false)
	const [emailSent, setEmailSent] = useState(false)

	const validateEmail = (value: string): string => {
		if (!value) return 'Email обязателен'
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(value)) return 'Введите корректный email'
		return ''
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setEmailError('')

		const err = validateEmail(email)
		if (err) {
			setEmailError(err)
			return
		}

		setLoading(true)

		try {
			// Отправляем запрос на отправку email для сброса пароля
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, action: 'send' })
			})

			const data = await response.json()

			if (data.success) {
				// Письмо отправлено (или имитировано)
				setEmailSent(true)
			} else {
				// Ошибка от API
				setEmailError(data.error || 'Не удалось отправить письмо. Попробуйте позже.')
			}
		} catch (error) {
			console.error('Error:', error)
			setEmailError('Произошла ошибка. Попробуйте позже.')
		} finally {
			setLoading(false)
		}
	}

	if (emailSent) {
		return (
			<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
				<div className="text-center max-w-md">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<span className="text-3xl">✉️</span>
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Инструкции отправлены</h1>
					<p className="text-gray-600 mb-8">Если аккаунт с таким email существует, мы отправили инструкции по восстановлению пароля на вашу почту.</p>
					<Link
						href="/login"
						className="inline-block text-amber-600 hover:text-amber-700 font-medium"
					>
						Вернуться к входу
					</Link>
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
			<div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md">
				<Link
					href="/login"
					className="inline-flex items-center text-gray-600 hover:text-amber-600 mb-6 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Назад к входу
				</Link>

				<h1 className="text-2xl font-bold text-gray-900 mb-2">Восстановление пароля</h1>
				<p className="text-gray-600 mb-6">Введите email, указанный при регистрации. Мы отправим вам ссылку для восстановления пароля.</p>

				<form onSubmit={handleSubmit}>
					<FormInput
						label="Email"
						type="email"
						placeholder="example@mail.ru"
						value={email}
						onChange={setEmail}
						onBlur={() => setEmailError(validateEmail(email))}
						error={emailError}
						disabled={loading}
					/>

					<Button
						type="submit"
						variant="primary"
						className="w-full mt-4"
						disabled={loading}
					>
						{loading ? 'Отправка...' : 'Отправить инструкции'}
					</Button>
				</form>
			</div>
		</div>
	)
}
