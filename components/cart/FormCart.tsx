import { useUserStore } from '@/lib/store'
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface FormCartHandle {
	submit: () => void
}

interface FormCartProps {
	onNext?: (formData: FormData) => void
}

interface UserProfile {
	name?: string
	email?: string
	phone?: string
	addressData?: {
		lastName?: string
		patronymic?: string
		city?: string
		address?: string
		addressExtra?: string
	}
}

// Тип данных формы
export interface FormData {
	name: string
	family: string
	email: string
	receiver: string
	phone: string
	town: string
	address1: string
	address2: string
	paymentMethod: string
}

// Валидация email
const validateEmail = (value: string): string => {
	if (!value) return 'Email обязателен'
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	if (!emailRegex.test(value)) return 'Введите корректный email'
	return ''
}

// Валидация телефона
const validatePhone = (value: string): string => {
	if (!value) return 'Телефон обязателен'
	const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
	if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Введите корректный номер телефона'
	return ''
}

const FormCart = forwardRef<FormCartHandle, FormCartProps>(({ onNext }, ref) => {
	const formRef = useRef<HTMLFormElement>(null)
	const { user, isAuthenticated } = useUserStore()

	// Состояния для формы
	const [formData, setFormData] = useState<FormData>({
		name: '',
		family: '',
		email: '',
		receiver: '',
		phone: '',
		town: '',
		address1: '',
		address2: '',
		paymentMethod: 'yandex'
	})

	// Состояния для ошибок валидации
	const [errors, setErrors] = useState<Record<string, string>>({})

	useImperativeHandle(ref, () => ({
		submit: () => {
			formRef.current?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
		}
	}))

	// Загрузка данных профиля при авторизации
	useEffect(() => {
		if (isAuthenticated && user) {
			// Загружаем дополнительные данные профиля
			fetch('/api/user/profile')
				.then(res => res.json())
				.then(data => {
					if (data.success && data.data) {
						const profile = data.data as UserProfile
						const addr = profile.addressData || {}

						setFormData(prev => ({
							...prev,
							name: prev.name || profile.name || '',
							email: prev.email || profile.email || '',
							phone: prev.phone || profile.phone || '',
							family: prev.family || addr.lastName || '',
							receiver: prev.receiver || (profile.name ? `${addr.lastName || ''} ${profile.name} ${addr.patronymic || ''}`.trim() : ''),
							town: prev.town || addr.city || '',
							address1: prev.address1 || addr.address || '',
							address2: prev.address2 || addr.addressExtra || ''
						}))
					}
				})
				.catch(console.error)
		}
	}, [isAuthenticated, user])

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()

		// Валидация
		const newErrors: Record<string, string> = {}
		newErrors.email = validateEmail(formData.email)
		newErrors.phone = validatePhone(formData.phone)

		// Убираем пустые ошибки
		Object.keys(newErrors).forEach(key => {
			if (!newErrors[key]) delete newErrors[key]
		})

		setErrors(newErrors)

		// Если есть ошибки, не отправляем
		if (Object.keys(newErrors).length > 0) {
			return
		}

		onNext?.(formData)
	}

	return (
		<form
			ref={formRef}
			onSubmit={handleSubmit}
			action="#"
			className="shadow-lg border border-gray-100  rounded-lg p-2.5"
		>
			<h2 className="text-black font-semibold text-xl mb-5">Платежные реквизиты</h2>
			<div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 w-full">
				<label
					htmlFor="name"
					className="block"
				>
					<span>Имя*</span>
					<input
						type="text"
						id="name"
						name="name"
						value={formData.name}
						onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
						required
						placeholder=""
						className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
					/>
				</label>
				<label
					htmlFor="family"
					className="block"
				>
					<span>Фамилия*</span>
					<input
						type="text"
						id="family"
						name="family"
						value={formData.family}
						onChange={e => setFormData(prev => ({ ...prev, family: e.target.value }))}
						required
						placeholder=""
						className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
					/>
				</label>

				<label
					htmlFor="email"
					className="block"
				>
					<span>Email*</span>
					<input
						type="email"
						id="email"
						name="email"
						placeholder=""
						value={formData.email}
						onChange={e => {
							setFormData(prev => ({ ...prev, email: e.target.value }))
							setErrors(prev => ({ ...prev, email: '' }))
						}}
						className={`w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400 ${errors.email ? 'border-red-500 border-2' : ''}`}
						required
					/>
					{errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
				</label>
			</div>
			<div className="mt-10">
				<h2 className="text-black font-semibold text-xl mb-5">Адрес доставки</h2>
				<div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 w-full">
					<label
						htmlFor="receiver"
						className="block"
					>
						<span>ФИО получателя*</span>
						<input
							type="text"
							id="receiver"
							name="receiver"
							value={formData.receiver}
							onChange={e => setFormData(prev => ({ ...prev, receiver: e.target.value }))}
							required
							placeholder=""
							className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
						/>
					</label>
					<label
						htmlFor="phone"
						className="block"
					>
						<span>Телефон*</span>
						<input
							type="tel"
							id="phone"
							name="phone"
							value={formData.phone}
							onChange={e => {
								setFormData(prev => ({ ...prev, phone: e.target.value }))
								setErrors(prev => ({ ...prev, phone: '' }))
							}}
							placeholder="+7 (999) 999-99-99"
							className={`w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400 ${errors.phone ? 'border-red-500 border-2' : ''}`}
							required
						/>
						{errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
					</label>
					<label
						htmlFor="town"
						className="block"
					>
						<span>Город, населенный пункт*</span>
						<input
							type="text"
							id="town"
							name="town"
							value={formData.town}
							onChange={e => setFormData(prev => ({ ...prev, town: e.target.value }))}
							required
							placeholder=""
							className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
						/>
					</label>
					<label
						htmlFor="address1"
						className="block lg:col-span-2"
					>
						<span>Адрес - Номер дома и название улицы*</span>
						<input
							type="text"
							id="address1"
							name="address1"
							value={formData.address1}
							onChange={e => setFormData(prev => ({ ...prev, address1: e.target.value }))}
							required
							placeholder=""
							className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
						/>
					</label>
					<label
						htmlFor="address2"
						className="block"
					>
						<span>Крыло, подъезд, этаж, квартира*</span>
						<input
							type="text"
							id="address2"
							name="address2"
							value={formData.address2}
							onChange={e => setFormData(prev => ({ ...prev, address2: e.target.value }))}
							required
							placeholder=""
							className="w-full p-2.5 mt-1 shadow-lg rounded-lg focus-within:outline-none focus-within:border-b focus-within:border-blue-400"
						/>
					</label>
				</div>
			</div>
		</form>
	)
})
FormCart.displayName = 'FormCart'

export default FormCart
