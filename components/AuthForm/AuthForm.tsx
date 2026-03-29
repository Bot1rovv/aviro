'use client'

import { Button, FormInput } from '@/components/ui'
import { useTermsModalStore } from '@/lib/store/terms-modal'
import { useUserStore } from '@/lib/store/user'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthFormProps {
	mode: 'login' | 'registration'
	onSubmit?: (data: { email: string; password: string; name?: string }) => void
}

export default function AuthForm({ mode, onSubmit }: AuthFormProps) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [name, setName] = useState('')
	const [rememberMe, setRememberMe] = useState(false)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [emailError, setEmailError] = useState('')
	const [passwordError, setPasswordError] = useState('')
	const [nameError, setNameError] = useState('')
	const { open: openTerms } = useTermsModalStore()
	const { setUser } = useUserStore()
	const router = useRouter()
	const searchParams = useSearchParams()

	const isLogin = mode === 'login'

	useEffect(() => {
		const errorParam = searchParams.get('error')
		const registeredParam = searchParams.get('registered')

		// Показываем сообщение об успешной регистрации
		if (registeredParam === 'true') {
			setError(null)
			// Можно использовать toast или другое уведомление
		}

		if (errorParam) {
			// Преобразуем код ошибки в читаемое сообщение
			let message = errorParam
			if (errorParam.includes('Пользователь не найден')) {
				message = 'Пользователь не найден'
			} else if (errorParam.includes('Неверный пароль')) {
				message = 'Неверный пароль'
			} else if (errorParam.includes('Учетная запись не настроена')) {
				message = 'Учетная запись не настроена'
			} else if (errorParam === 'CredentialsSignin') {
				message = 'Неверный email или пароль'
			}
			setError(message)
		}
	}, [searchParams])

	const validateEmail = (value: string): string => {
		if (!value) return 'Email обязателен'
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(value)) return 'Введите корректный email'
		return ''
	}

	const validatePassword = (value: string): string => {
		if (!value) return 'Пароль обязателен'
		if (value.length < 6) return 'Пароль должен быть не менее 6 символов'
		return ''
	}

	const validateName = (value: string): string => {
		if (!value) return 'Имя обязательно'
		return ''
	}

	const handleEmailChange = (value: string) => {
		setEmail(value)
		setEmailError(validateEmail(value))
	}

	const handlePasswordChange = (value: string) => {
		setPassword(value)
		setPasswordError(validatePassword(value))
	}

	const handleNameChange = (value: string) => {
		setName(value)
		setNameError(validateName(value))
	}

	const handleEmailBlur = () => {
		setEmailError(validateEmail(email))
	}

	const handlePasswordBlur = () => {
		setPasswordError(validatePassword(password))
	}

	const handleNameBlur = () => {
		setNameError(validateName(name))
	}

	const validateForm = (): boolean => {
		const emailErr = validateEmail(email)
		const passwordErr = validatePassword(password)
		const nameErr = isLogin ? '' : validateName(name)

		setEmailError(emailErr)
		setPasswordError(passwordErr)
		if (!isLogin) setNameError(nameErr)

		return !emailErr && !passwordErr && (isLogin || !nameErr)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!validateForm()) {
			setError('Пожалуйста, исправьте ошибки в форме')
			return
		}

		// Если передан внешний обработчик, вызываем его
		if (onSubmit) {
			onSubmit({ email, password, name })
			return
		}

		setLoading(true)

		try {
			if (isLogin) {
				// Логин — используем NextAuth
				const result = await signIn('credentials', {
					email,
					password,
					redirect: false,
					callbackUrl: '/'
				})

				if (result?.error) {
					throw Error(result.error)
				}

				if (result?.ok) {
					setUser({
						id: email,
						email,
						name: ''
					})
					router.push('/')
					router.refresh()
				}
			} else {
				// Регистрация — используем отдельный API
				const res = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email, password, name })
				})

				const data = await res.json()

				if (!data.success) {
					throw new Error(data.error || 'Ошибка при регистрации')
				}

				// После успешной регистрации — перенаправляем на страницу успеха
				router.push('/registration-success')
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
			// Парсим сообщение об ошибке для красивого отображения
			let displayMessage = errorMessage
			if (errorMessage.includes('Пользователь не найден')) {
				displayMessage = 'Такого пользователя не существует'
			} else if (errorMessage.includes('Неверный пароль')) {
				displayMessage = 'Неверный пароль'
			} else if (errorMessage.includes('Учетная запись не настроена')) {
				displayMessage = 'Учетная запись не настроена'
			}
			setError(displayMessage)
			console.error('Auth error:', err)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="bg-white rounded-lg border border-gray-200 p-5">
			<form
				onSubmit={handleSubmit}
				className="shadow-lg border border-gray-100 rounded-lg p-2.5"
			>
				<h2 className="text-black font-semibold text-2xl mb-5">{isLogin ? 'Войти' : 'Регистрация'}</h2>

				{error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}

				<div className="flex flex-col w-full gap-5">
					{!isLogin && (
						<FormInput
							label="Имя"
							type="text"
							placeholder=""
							value={name}
							onChange={handleNameChange}
							onBlur={handleNameBlur}
							error={nameError}
							disabled={loading}
						/>
					)}

					<FormInput
						label="Email"
						type="email"
						placeholder=""
						required
						value={email}
						onChange={handleEmailChange}
						onBlur={handleEmailBlur}
						error={emailError}
						disabled={loading}
					/>

					<FormInput
						label="Пароль"
						type="password"
						placeholder=""
						required
						value={password}
						onChange={handlePasswordChange}
						onBlur={handlePasswordBlur}
						error={passwordError}
						disabled={loading}
					/>

					{isLogin && (
						<label className="flex items-center cursor-pointer">
							<input
								type="checkbox"
								checked={rememberMe}
								onChange={e => setRememberMe(e.target.checked)}
								className="mr-3 lg:cursor-pointer"
								disabled={loading}
							/>
							<span className="lg:cursor-pointer transition-colors duration-300 hover:text-amber-600">Запомнить меня</span>
						</label>
					)}
				</div>

				{isLogin && (
					<Link
						href="/forgot-password"
						className="flex justify-center mt-2.5 underline lg:cursor-pointer transition-colors duration-300 hover:text-amber-600"
					>
						<span>Забыли пароль?</span>
					</Link>
				)}

				<Button
					type="submit"
					variant="primary"
					className="mt-4 w-full flex-shrink-0 flex items-center justify-center gap-2.5"
					disabled={loading}
				>
					{loading ? (
						<>
							<svg
								className="animate-spin h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span>Обработка...</span>
						</>
					) : (
						<span>{isLogin ? 'Войти' : 'Зарегистрироваться'}</span>
					)}
				</Button>

				<div className="flex flex-col gap-1 justify-center items-center mt-2.5">
					<span>{isLogin ? 'Ещё нет аккаунта?' : 'Уже есть аккаунт?'}</span>
					<Link
						href={isLogin ? '/registration' : '/login'}
						className="flex justify-center mt-1.5 underline lg:cursor-pointer transition-colors duration-300 hover:text-amber-600"
					>
						<span>{isLogin ? 'Завести аккаунт' : 'Войти'}</span>
					</Link>
				</div>
			</form>

			<button
				onClick={openTerms}
				className="flex mt-2.5 underline lg:cursor-pointer transition-colors duration-300 hover:text-amber-600 text-left"
			>
				<span>Публичная оферта</span>
			</button>
		</div>
	)
}
