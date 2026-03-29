'use client'

import { Button, FormInput, Modal } from '@/components/ui'
import {
	getActionIcon,
	getActionIconColor,
	getActionLabel,
	getOrderStatusColor,
	getOrderStatusIcon,
	getOrderStatusText
} from '@/lib/functions/user-history'
import { useUserStore } from '@/lib/store/user'
import { formatDate } from '@/lib/utils/format'
import { CartItem } from '@/types/cart'
import { ChevronDown, Eye, RefreshCw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { use, useEffect, useState } from 'react'

// Типы данных из API
interface HistoryRecord {
	id: string
	action: string
	productId: string | null
	productTitle: string | null
	productPrice: string | null
	productImage: string | null
	details: string | null
	createdAt: string
}

interface Order {
	id: string
	status: string
	total: string
	items: CartItem[] // массив товаров
	customerEmail?: string
	trackingNumber?: string | null
	createdAt: string
	updatedAt: string
}

// Компонент вкладки
function TabButton({ children, tabKey, isActive }: { children: React.ReactNode; tabKey: string; isActive: boolean }) {
	const router = useRouter()
	const pathname = usePathname()
	const searchParams = useSearchParams()

	const handleClick = () => {
		const params = new URLSearchParams(searchParams ?? undefined)
		params.set('tab', tabKey)
		router.push(`${pathname}?${params.toString()}`)
	}

	return (
		<button
			type="button"
			onClick={handleClick}
			className={`px-4 py-2 md:px-6 md:py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
				isActive ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 lg:cursor-pointer'
			}`}
		>
			{children}
		</button>
	)
}

// Контент вкладки
function TabContent({ children }: { children: React.ReactNode }) {
	return <div className="mt-6 bg-white shadow rounded-lg p-6">{children}</div>
}

interface UserPageProps {
	params: Promise<{
		id: string
	}>
}

export default function UserPage({ params }: UserPageProps) {
	const { id } = use(params)
	const searchParams = useSearchParams()
	const tab = searchParams?.get('tab')
	const activeTab = ['orders', 'history', 'settings', 'logout'].includes(tab || '') ? tab! : 'orders'

	const { user, logout, isAuthenticated } = useUserStore()
	const [name, setName] = useState(user?.name || '')
	const [email, setEmail] = useState(user?.email || '')
	const [phone, setPhone] = useState(user?.phone || '')

	// Адрес доставки
	const [lastName, setLastName] = useState('')
	const [patronymic, setPatronymic] = useState('')
	const [city, setCity] = useState('')
	const [address, setAddress] = useState('')
	const [addressExtra, setAddressExtra] = useState('')

	// Ошибки валидации
	const [emailError, setEmailError] = useState('')
	const [phoneError, setPhoneError] = useState('')

	const [loading, setLoading] = useState(false)
	const [saveSuccess, setSaveSuccess] = useState(false)
	const router = useRouter()

	// Данные истории из API
	const [history, setHistory] = useState<HistoryRecord[]>([])
	const [loadingHistory, setLoadingHistory] = useState(false)
	const [showClearModal, setShowClearModal] = useState(false)

	// Данные заказов из API
	const [orders, setOrders] = useState<Order[]>([])
	const [loadingOrders, setLoadingOrders] = useState(false)
	const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)

	// Загрузка истории при переключении на вкладку
	useEffect(() => {
		if (!isAuthenticated || !user) return

		if (activeTab === 'history') {
			setLoadingHistory(true)
			fetch('/api/user/history')
				.then(res => res.json())
				.then(data => {
					if (data.success) {
						setHistory(data.data || [])
					}
				})
				.catch(console.error)
				.finally(() => setLoadingHistory(false))
		}
	}, [isAuthenticated, user, activeTab])

	// Загрузка заказов при переключении на вкладку
	useEffect(() => {
		if (!isAuthenticated || !user) return

		if (activeTab === 'orders') {
			setLoadingOrders(true)
			fetch('/api/user/orders')
				.then(res => res.json())
				.then(data => {
					if (data.success) {
						setOrders(data.data || [])
					}
				})
				.catch(console.error)
				.finally(() => setLoadingOrders(false))
		}
	}, [isAuthenticated, user, activeTab])

	// Проверка соответствия ID пользователя
	useEffect(() => {
		if (!isAuthenticated || !user) {
			// Если не авторизован, перенаправить на логин
			router.push('/login')
			return
		}
		if (user.id !== id) {
			// Если ID не совпадает, показать предупреждение или перенаправить на свой профиль
			// Можно также просто показать сообщение, что это не ваш профиль
			console.warn('Вы пытаетесь просмотреть чужой профиль')
			// В реальном приложении можно редиректить на свой профиль
			// router.push(`/user/${user.id}`)
		}
	}, [isAuthenticated, user, id, router])

	const handleLogout = async () => {
		setLoading(true)
		try {
			// Вызов API выхода NextAuth
			await fetch('/api/auth/signout', { method: 'GET' })
		} catch (error) {
			console.error('Logout error:', error)
			// Продолжаем выход даже при ошибке сети
		} finally {
			// Очистка хранилища
			logout()
			// Перенаправление на главную
			router.push('/')
			setLoading(false)
		}
	}

	// Валидация email
	const validateEmail = (value: string): string => {
		if (!value) return ''
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
		if (!emailRegex.test(value)) return 'Введите корректный email'
		return ''
	}

	// Валидация телефона
	const validatePhone = (value: string): string => {
		if (!value) return ''
		const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/
		if (!phoneRegex.test(value.replace(/\s/g, ''))) return 'Введите корректный номер телефона'
		return ''
	}

	const handleSaveSettings = async (e: React.FormEvent) => {
		e.preventDefault()
		setLoading(false)
		setSaveSuccess(false)

		// Валидация
		const emailErr = validateEmail(email)
		const phoneErr = validatePhone(phone)
		setEmailError(emailErr)
		setPhoneError(phoneErr)

		if (emailErr || phoneErr) {
			return
		}

		try {
			const res = await fetch('/api/user/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name,
					email,
					phone,
					lastName,
					patronymic,
					city,
					address,
					addressExtra
				})
			})

			const data = await res.json()

			if (data.success) {
				setSaveSuccess(true)
				setTimeout(() => setSaveSuccess(false), 3000)
			} else {
				alert(data.error || 'Ошибка сохранения')
			}
		} catch (error) {
			console.error('Save settings error:', error)
			alert('Ошибка сохранения настроек')
		} finally {
			setLoading(false)
		}
	}

	// Создаем компоненты иконок статусов с нужным размером
	const StatusIcon = ({ status }: { status: string }) => {
		const Icon = getOrderStatusIcon(status)
		return (
			<Icon
				className="text-green-500"
				size={20}
			/>
		)
	}

	if (!isAuthenticated || !user) {
		return (
			<div className="container py-10 text-center">
				<h1 className="text-2xl font-bold text-gray-900 mb-4">Загрузка...</h1>
				<p>Проверка авторизации...</p>
			</div>
		)
	}

	return (
		<div className="container py-10 overflow-x-hidden">
			<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-4 md:mb-6">Профиль пользователя {user.name}</h1>
			<p className="text-sm md:text-base text-gray-600 mb-2">ID: {id}</p>

			{/* Вкладки */}
			<div className="border-b border-gray-200">
				<nav className="-mb-px flex space-x-4 md:space-x-8 overflow-x-auto">
					<TabButton
						tabKey="orders"
						isActive={activeTab === 'orders'}
					>
						Заказы
					</TabButton>
					<TabButton
						tabKey="history"
						isActive={activeTab === 'history'}
					>
						История
					</TabButton>
					<TabButton
						tabKey="settings"
						isActive={activeTab === 'settings'}
					>
						Настройки
					</TabButton>
					<TabButton
						tabKey="logout"
						isActive={activeTab === 'logout'}
					>
						Выход
					</TabButton>
				</nav>
			</div>

			{/* Содержимое вкладок */}
			<TabContent>
				{activeTab === 'orders' && (
					<>
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Ваши заказы</h2>
						<p className="text-gray-600 mb-6">Здесь отображаются все ваши заказы с возможностью отслеживания статуса.</p>
						{loadingOrders ? (
							<p className="text-gray-500">Загрузка заказов...</p>
						) : orders.length === 0 ? (
							<div className="text-center py-8">
								<Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-500">Заказов пока нет</p>
								<p className="text-sm text-gray-400">Совершите покупку, и ваши заказы появятся здесь</p>
							</div>
						) : (
							<div className="space-y-4">
								{orders.map(order => {
									const isExpanded = expandedOrderId === order.id
									return (
										<div
											key={order.id}
											className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
										>
											{/* Заголовок заказа */}
											<div
												className="p-4 cursor-pointer flex flex-col md:flex-row md:justify-between md:items-start"
												onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
											>
												<div className="flex-1">
													<div className="flex flex-wrap items-center gap-2">
														<StatusIcon status={order.status} />
														<h3 className="font-semibold text-lg">{order.id}</h3>
														<span
															className={`px-1 md:px-2 py-1 text-xs rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[80px] md:max-w-none ${getOrderStatusColor(order.status)}`}
														>
															{getOrderStatusText(order.status)}
														</span>
													</div>
													<p className="text-sm text-gray-500 mt-1">Дата: {formatDate(order.createdAt)}</p>
													<p className="text-sm text-gray-500">Товаров: {order.items.length}</p>
													{order.trackingNumber && (
														<p className="text-sm text-gray-500">
															Трек-номер: <span className="font-mono">{order.trackingNumber}</span>
														</p>
													)}
												</div>
												<div className="mt-4 md:mt-0 text-left md:text-right flex flex-col md:items-end">
													<p className="text-2xl font-bold text-gray-900">{parseFloat(order.total).toLocaleString()} ₽</p>
													<div className="flex items-center gap-2 mt-2">
														<button
															className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
															onClick={e => {
																e.stopPropagation()
																// Действие отслеживания
															}}
														>
															<RefreshCw size={14} />
															Отследить
														</button>
														<ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
													</div>
												</div>
											</div>

											{/* Детали заказа (раскрывающийся блок) */}
											{isExpanded && (
												<div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
													<h4 className="font-semibold text-gray-900 mb-3">Состав заказа</h4>
													{/* Таблица для десктопа (скрыта на мобильных) */}
													<div className="hidden md:block overflow-x-auto">
														<table className="min-w-full divide-y divide-gray-200">
															<thead>
																<tr className="bg-gray-100">
																	<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Товар</th>
																	<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Цена</th>
																	<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Количество</th>
																	<th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
																</tr>
															</thead>
															<tbody className="bg-white divide-y divide-gray-200">
																{order.items.map((item, idx) => (
																	<tr key={idx}>
																		<td className="px-4 py-3">
																			<div className="flex items-center gap-3">
																				{item.imageUrl && (
																					<Image
																						src={item.imageUrl}
																						alt={item.title}
																						className="w-12 h-12 object-cover rounded"
																					/>
																				)}
																				<div>
																					<p className="font-medium text-gray-900">{item.title}</p>
																					{item.color && <p className="text-sm text-gray-500">Цвет: {item.color}</p>}
																					{item.size && <p className="text-sm text-gray-500">Размер: {item.size}</p>}
																				</div>
																			</div>
																		</td>
																		<td className="px-4 py-3 text-gray-900">{item.price} ₽</td>
																		<td className="px-4 py-3 text-gray-900">{item.quantity}</td>
																		<td className="px-4 py-3 font-semibold text-gray-900">{parseFloat(item.price) * item.quantity} ₽</td>
																	</tr>
																))}
															</tbody>
														</table>
													</div>
													{/* Карточки для мобильных (скрыты на десктопе) */}
													<div className="block md:hidden space-y-4">
														{order.items.map((item, idx) => (
															<div
																key={idx}
																className="bg-white border border-gray-200 rounded-lg p-4"
															>
																<div className="flex items-start gap-3">
																	{item.imageUrl && (
																		<Image
																			src={item.imageUrl}
																			alt={item.title}
																			className="w-16 h-16 object-cover rounded"
																		/>
																	)}
																	<div className="flex-1">
																		<p className="font-medium text-gray-900">{item.title}</p>
																		{item.color && <p className="text-sm text-gray-500">Цвет: {item.color}</p>}
																		{item.size && <p className="text-sm text-gray-500">Размер: {item.size}</p>}
																		<div className="mt-2 grid grid-cols-2 gap-2 text-sm">
																			<div>
																				<span className="text-gray-500">Цена:</span>
																				<span className="ml-2 font-medium">{item.price} ₽</span>
																			</div>
																			<div>
																				<span className="text-gray-500">Кол-во:</span>
																				<span className="ml-2 font-medium">{item.quantity}</span>
																			</div>
																			<div className="col-span-2">
																				<span className="text-gray-500">Сумма:</span>
																				<span className="ml-2 font-bold text-gray-900">{parseFloat(item.price) * item.quantity} ₽</span>
																			</div>
																		</div>
																	</div>
																</div>
															</div>
														))}
													</div>
													<div className="mt-4 pt-4 border-t border-gray-300 flex flex-col md:flex-row justify-between items-start md:items-center">
														<div className="mb-4 md:mb-0">
															<p className="text-sm text-gray-600">Email для уведомлений: {order.customerEmail || 'не указан'}</p>
															<p className="text-sm text-gray-600">
																Статус: <span className={`font-medium ${getOrderStatusColor(order.status)}`}>{getOrderStatusText(order.status)}</span>
															</p>
														</div>
														<div className="text-left md:text-right">
															<p className="text-lg font-bold text-gray-900">Итого: {parseFloat(order.total).toLocaleString()} ₽</p>
															<p className="text-sm text-gray-500">Обновлено: {formatDate(order.updatedAt)}</p>
														</div>
													</div>
												</div>
											)}
										</div>
									)
								})}
							</div>
						)}
					</>
				)}

				{activeTab === 'history' && (
					<>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold text-gray-900">История действий</h2>
							{history.length > 0 && (
								<Button
									variant="ghost"
									size="sm"
									onClick={() => setShowClearModal(true)}
									className="text-gray-600 hover:text-red-500"
								>
									Очистить историю
								</Button>
							)}
						</div>
						{loadingHistory ? (
							<p className="text-gray-500">Загрузка истории...</p>
						) : history.length === 0 ? (
							<div className="text-center py-8">
								<Eye className="w-16 h-16 text-gray-300 mx-auto mb-4" />
								<p className="text-gray-500">История пока пуста</p>
								<p className="text-sm text-gray-400">Начните просматривать товары, и они появятся здесь</p>
							</div>
						) : (
							<div className="space-y-3">
								{history.map(record => (
									<div
										key={record.id}
										className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0"
									>
										<div className="p-2 bg-gray-100 rounded-full">
											{(() => {
												const Icon = getActionIcon(record.action)
												return (
													<Icon
														size={18}
														className={getActionIconColor(record.action)}
													/>
												)
											})()}
										</div>
										<div className="flex-1">
											<p className="font-medium">{getActionLabel(record.action)}</p>
											{record.productTitle && <p className="text-sm text-gray-600">{record.productTitle}</p>}
											{record.details && <p className="text-sm text-gray-500">{record.details}</p>}
											<p className="text-xs text-gray-400 mt-1">{formatDate(record.createdAt)}</p>
										</div>
									</div>
								))}
							</div>
						)}
					</>
				)}

				{activeTab === 'settings' && (
					<>
						<h2 className="text-xl font-semibold text-gray-900 mb-4">Настройки профиля</h2>
						{saveSuccess && <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">Настройки сохранены</div>}
						<form
							onSubmit={handleSaveSettings}
							className="flex w-full flex-col gap-6"
						>
							{/* Основные данные */}
							<div className="flex flex-col md:flex-row gap-6">
								<div className="flex-1">
									<FormInput
										label="Имя"
										type="text"
										value={name}
										onChange={setName}
									/>
								</div>
								<div className="flex-1">
									<FormInput
										label="Email"
										type="email"
										value={email}
										onChange={val => {
											setEmail(val)
											setEmailError('')
										}}
										error={emailError}
									/>
								</div>
								<div className="flex-1">
									<FormInput
										label="Телефон"
										type="tel"
										value={phone}
										onChange={val => {
											setPhone(val)
											setPhoneError('')
										}}
										error={phoneError}
									/>
								</div>
							</div>

							{/* Адрес доставки */}
							<div className="border-t pt-4">
								<h3 className="text-lg font-medium text-gray-900 mb-4">Адрес доставки</h3>
								<div className="flex flex-col  md:flex-row gap-6">
									<div className="flex-1">
										<FormInput
											label="Фамилия"
											type="text"
											value={lastName}
											onChange={setLastName}
										/>
									</div>
									<div className="flex-1">
										<FormInput
											label="Отчество"
											type="text"
											value={patronymic}
											onChange={setPatronymic}
										/>
									</div>
									<div className="flex-1">
										<FormInput
											label="Город (Населённый пункт)"
											type="text"
											value={city}
											onChange={setCity}
										/>
									</div>
								</div>
								<div className="flex flex-col  md:flex-row gap-6 mt-4">
									<div className="flex-1">
										<FormInput
											label="Адрес - Номер дома и название улицы"
											type="text"
											value={address}
											onChange={setAddress}
										/>
									</div>
									<div className="flex-1">
										<FormInput
											label="Крыло, подъезд, этаж, квартира"
											type="text"
											value={addressExtra}
											onChange={setAddressExtra}
										/>
									</div>
								</div>
							</div>

							<div className="flex justify-end mt-1">
								<Button
									type="submit"
									variant="primary"
									disabled={loading}
								>
									{loading ? 'Сохранение...' : 'Сохранить'}
								</Button>
							</div>
						</form>
					</>
				)}

				{activeTab === 'logout' && (
					<>
						<h2 className="text-xl font-semibold text-red-600 mb-4">Выход из аккаунта</h2>
						<p>Вы уверены, что хотите выйти из своего аккаунта?</p>
						<div className="mt-4 flex flex-col md:flex-row gap-4">
							<Button
								variant="danger"
								onClick={handleLogout}
								disabled={loading}
								className="w-full md:w-auto"
							>
								{loading ? 'Выход...' : 'Выйти'}
							</Button>
							<Link
								href="/"
								className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition cursor-pointer text-center w-full md:w-auto"
							>
								Отмена
							</Link>
						</div>
					</>
				)}
			</TabContent>

			{/* Модальное окно подтверждения очистки истории */}
			<Modal
				isOpen={showClearModal}
				onClose={() => setShowClearModal(false)}
				title="Очистка истории"
				width="max-w-sm"
			>
				<p className="text-gray-600 mb-6">Вы уверены, что хотите очистить всю историю? Это действие нельзя отменить.</p>
				<div className="flex gap-4 justify-end">
					<Button
						variant="secondary"
						onClick={() => setShowClearModal(false)}
					>
						Отмена
					</Button>
					<Button
						variant="danger"
						onClick={async () => {
							await fetch('/api/user/history', { method: 'DELETE' })
							setHistory([])
							setShowClearModal(false)
						}}
					>
						Очистить
					</Button>
				</div>
			</Modal>
		</div>
	)
}
