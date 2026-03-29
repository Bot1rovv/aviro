'use client'

import { Button, FormInput } from '@/components/ui'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, Suspense } from 'react'
import { ArrowLeft, Lock } from 'lucide-react'

function ResetPasswordForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const email = searchParams.get('email')

	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [confirmError, setConfirmError] = useState('')
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)
	const [generalError, setGeneralError] = useState('')

	const validatePassword = (value: string): string => {
		if (!value) return 'Пароль обязателен'
		if (value.length < 6) return 'Пароль должен быть не менее 6 символов'
		return ''
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setPasswordError('')
		setConfirmError('')
		setGeneralError('')

		const passErr = validatePassword(password)
		const confirmErr = password !== confirmPassword ? 'Пароли не совпадают' : ''

		if (passErr) {
			setPasswordError(passErr)
			return
		}
		if (confirmErr) {
			setConfirmError(confirmErr)
			return
		}

		if (!email) {
			setGeneralError('Отсутствует email. Используйте ссылку из письма.')
			return
		}

		setLoading(true)

		try {
			const response = await fetch('/api/auth/reset-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					action: 'reset',
					email,
					newPassword: password
				})
			})

			const data = await response.json()

			if (data.success) {
				setSuccess(true)
			} else {
				setGeneralError(data.error || 'Ошибка при сбросе пароля')
			}
		} catch (error) {
			console.error('Error:', error)
			setGeneralError('Произошла ошибка. Попробуйте позже.')
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
				<div className="text-center max-w-md">
					<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
						<Lock className="w-8 h-8 text-green-600" />
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-4">Пароль изменён</h1>
					<p className="text-gray-600 mb-8">
						Ваш пароль был успешно изменён. Теперь вы можете войти в аккаунт с новым паролем.
					</p>
					<Link
						href="/login"
						className="inline-block bg-amber-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors"
					>
						Войти в аккаунт
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

				<h1 className="text-2xl font-bold text-gray-900 mb-2">Создание нового пароля</h1>
				<p className="text-gray-600 mb-6">
					Введите новый пароль для вашего аккаунта.
				</p>

				{generalError && (
					<div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
						{generalError}
					</div>
				)}

				<form onSubmit={handleSubmit}>
					<FormInput
						label="Новый пароль"
						type="password"
						placeholder="******"
						value={password}
						onChange={setPassword}
						onBlur={() => setPasswordError(validatePassword(password))}
						error={passwordError}
						disabled={loading}
					/>

					<FormInput
						label="Подтвердите пароль"
						type="password"
						placeholder="******"
						value={confirmPassword}
						onChange={setConfirmPassword}
						onBlur={() => setConfirmError(password !== confirmPassword ? 'Пароли не совпадают' : '')}
						error={confirmError}
						disabled={loading}
					/>

					<Button
						type="submit"
						variant="primary"
						className="w-full mt-4"
						disabled={loading}
					>
						{loading ? 'Сохранение...' : 'Сохранить пароль'}
					</Button>
				</form>
			</div>
		</div>
	)
}

export default function ResetPasswordPage() {
	return (
		<Suspense fallback={
			<div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[60vh]">
				<p>Загрузка...</p>
			</div>
		}>
			<ResetPasswordForm />
		</Suspense>
	)
}
