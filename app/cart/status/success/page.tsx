'use client'

import { Button } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { Check, CreditCard, Package, Truck } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

interface OrderItem {
	id: string
	title: string
	price: number
	quantity: number
	image?: string
}

interface OrderResponse {
	id: string
	status: string
	total: string
	items: OrderItem[] | { items: OrderItem[]; shippingCost?: number; moscowShippingCost?: number } | string
	createdAt: string
}

function parseOrderItems(rawItems: OrderResponse['items']) {
	let parsed = rawItems

	if (typeof parsed === 'string') {
		try {
			parsed = JSON.parse(parsed)
		} catch {
			parsed = []
		}
	}

	if (Array.isArray(parsed)) {
		return {
			items: parsed,
			shippingCost: 0,
			moscowShippingCost: 0
		}
	}

	if (parsed && typeof parsed === 'object' && 'items' in parsed) {
		return {
			items: Array.isArray(parsed.items) ? parsed.items : [],
			shippingCost: Number(parsed.shippingCost || 0),
			moscowShippingCost: Number(parsed.moscowShippingCost || 0)
		}
	}

	return {
		items: [],
		shippingCost: 0,
		moscowShippingCost: 0
	}
}

export default function PaymentSuccessPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const clearCart = useCartStore(state => state.clearCart)

	const [order, setOrder] = useState<OrderResponse | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const orderId = searchParams.get('orderId')

	useEffect(() => {
		clearCart()
		console.log('Корзина очищена после успешной оплаты')
	}, [clearCart])

	useEffect(() => {
		if (!orderId) {
			setError('Order ID not found in URL')
			setLoading(false)
			return
		}

		async function fetchOrder() {
			try {
				const response = await fetch(`/api/order/${orderId}`)
				if (!response.ok) {
					throw new Error('Failed to fetch order')
				}

				const data = await response.json()
				if (data.success) {
					setOrder(data.order)
				} else {
					setError(data.error || 'Unknown error')
				}
			} catch (err) {
				console.error('Error fetching order:', err)
				setError('Не удалось загрузить данные заказа')
			} finally {
				setLoading(false)
			}
		}

		fetchOrder()
	}, [orderId])

	const parsedOrder = useMemo(() => {
		if (!order) {
			return {
				items: [],
				shippingCost: 0,
				moscowShippingCost: 0
			}
		}
		return parseOrderItems(order.items)
	}, [order])

	const totalItems = parsedOrder.items.reduce((sum, item) => sum + item.quantity, 0)
	const totalAmount = order?.total || '0'

	return (
		<div className="container mx-auto px-3 sm:px-4 py-8 sm:py-16">
			<div className="max-w-4xl mx-auto">
				<div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
					<div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 sm:p-8 text-white text-center">
						<div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-white/20 rounded-full flex items-center justify-center">
							<Check className="w-8 h-8 sm:w-12 sm:h-12" />
						</div>
						<h1 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Оплата прошла успешно!</h1>
						<p className="text-sm sm:text-lg opacity-90">
							Ваш заказ успешно оплачен. Мы отправили вам подтверждение на email и начали обработку заказа.
						</p>
					</div>

					<div className="p-4 sm:p-8">
						{loading && (
							<div className="text-center py-8 sm:py-12">
								<div className="inline-block animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-t-2 border-b-2 border-green-500"></div>
								<p className="mt-3 sm:mt-4 text-gray-600">Загружаем информацию о заказе...</p>
							</div>
						)}

						{error && (
							<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
								<strong>Ошибка:</strong> {error}
							</div>
						)}

						{order && (
							<>
								<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
									<div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
										<div className="flex items-center gap-3 mb-2 sm:mb-3">
											<Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
											<h3 className="text-base sm:text-lg font-semibold text-gray-900">Номер заказа</h3>
										</div>
										<p className="text-xl sm:text-2xl font-mono font-bold text-gray-800 break-all">{order.id}</p>
										<p className="text-xs sm:text-sm text-gray-500 mt-1">Создан {new Date(order.createdAt).toLocaleDateString('ru-RU')}</p>
									</div>

									<div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
										<div className="flex items-center gap-3 mb-2 sm:mb-3">
											<CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
											<h3 className="text-base sm:text-lg font-semibold text-gray-900">Сумма заказа</h3>
										</div>
										<p className="text-xl sm:text-2xl font-bold text-gray-800">{parseFloat(totalAmount).toLocaleString('ru-RU')} ₽</p>
										<p className="text-xs sm:text-sm text-gray-500 mt-1">Включая товары и доставку</p>
									</div>

									<div className="bg-gray-50 p-4 sm:p-6 rounded-xl">
										<div className="flex items-center gap-3 mb-2 sm:mb-3">
											<Package className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
											<h3 className="text-base sm:text-lg font-semibold text-gray-900">Товаров</h3>
										</div>
										<p className="text-xl sm:text-2xl font-bold text-gray-800">{totalItems} шт.</p>
										<p className="text-xs sm:text-sm text-gray-500 mt-1">В заказе {parsedOrder.items.length} позиций</p>
									</div>
								</div>

								<div className="mb-8 sm:mb-10">
									<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
										<Package className="w-5 h-5 sm:w-6 sm:h-6" />
										Состав заказа
									</h2>

									<div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden">
										<table className="w-full">
											<thead className="bg-gray-50">
												<tr>
													<th className="text-left py-3 px-4 sm:py-4 sm:px-6 font-semibold text-gray-700">Товар</th>
													<th className="text-left py-3 px-4 sm:py-4 sm:px-6 font-semibold text-gray-700">Цена</th>
													<th className="text-left py-3 px-4 sm:py-4 sm:px-6 font-semibold text-gray-700">Количество</th>
													<th className="text-left py-3 px-4 sm:py-4 sm:px-6 font-semibold text-gray-700">Сумма</th>
												</tr>
											</thead>
											<tbody className="divide-y divide-gray-100">
												{parsedOrder.items.map(item => (
													<tr
														key={item.id}
														className="hover:bg-gray-50"
													>
														<td className="py-3 px-4 sm:py-4 sm:px-6">
															<div className="flex items-center gap-3 sm:gap-4">
																{item.image ? (
																	<img
																		src={item.image}
																		alt={item.title}
																		className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded-lg"
																	/>
																) : (
																	<div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-lg flex items-center justify-center">
																		<Package className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
																	</div>
																)}
																<div>
																	<h4 className="font-medium text-gray-900 text-sm sm:text-base">{item.title}</h4>
																	<p className="text-xs sm:text-sm text-gray-500">ID: {item.id}</p>
																</div>
															</div>
														</td>
														<td className="py-3 px-4 sm:py-4 sm:px-6">
															<span className="font-medium text-gray-900">{item.price.toLocaleString('ru-RU')} ₽</span>
														</td>
														<td className="py-3 px-4 sm:py-4 sm:px-6">
															<span className="font-medium text-gray-900">{item.quantity}</span>
														</td>
														<td className="py-3 px-4 sm:py-4 sm:px-6">
															<span className="font-bold text-gray-900">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
														</td>
													</tr>
												))}
											</tbody>
											<tfoot className="bg-gray-50">
												{parsedOrder.shippingCost > 0 && (
													<tr>
														<td
															colSpan={3}
															className="py-3 px-4 sm:py-4 sm:px-6 text-right font-medium text-gray-700"
														>
															Доставка по Китаю:
														</td>
														<td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900">
															{parsedOrder.shippingCost.toLocaleString('ru-RU')} ₽
														</td>
													</tr>
												)}

												{parsedOrder.moscowShippingCost > 0 && (
													<tr>
														<td
															colSpan={3}
															className="py-3 px-4 sm:py-4 sm:px-6 text-right font-medium text-gray-700"
														>
															Доставка Китай → Москва:
														</td>
														<td className="py-3 px-4 sm:py-4 sm:px-6 font-medium text-gray-900">
															{parsedOrder.moscowShippingCost.toLocaleString('ru-RU')} ₽
														</td>
													</tr>
												)}

												<tr>
													<td
														colSpan={3}
														className="py-3 px-4 sm:py-4 sm:px-6 text-right font-semibold text-gray-700"
													>
														Итого:
													</td>
													<td className="py-3 px-4 sm:py-4 sm:px-6">
														<span className="text-xl sm:text-2xl font-bold text-gray-900">{parseFloat(totalAmount).toLocaleString('ru-RU')} ₽</span>
													</td>
												</tr>
											</tfoot>
										</table>
									</div>

									<div className="md:hidden space-y-4">
										{parsedOrder.items.map(item => (
											<div
												key={item.id}
												className="border border-gray-200 rounded-xl p-4 bg-white"
											>
												<div className="flex gap-4">
													{item.image ? (
														<img
															src={item.image}
															alt={item.title}
															className="w-20 h-20 object-cover rounded-lg"
														/>
													) : (
														<div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
															<Package className="w-8 h-8 text-gray-400" />
														</div>
													)}
													<div className="flex-1">
														<h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</h4>
														<p className="text-xs text-gray-500 mt-1">ID: {item.id}</p>
														<div className="mt-3 grid grid-cols-2 gap-2 text-sm">
															<div>
																<span className="text-gray-600">Цена:</span>
																<span className="font-medium ml-2">{item.price.toLocaleString('ru-RU')} ₽</span>
															</div>
															<div>
																<span className="text-gray-600">Кол-во:</span>
																<span className="font-medium ml-2">{item.quantity}</span>
															</div>
															<div className="col-span-2">
																<span className="text-gray-600">Сумма:</span>
																<span className="font-bold ml-2">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
															</div>
														</div>
													</div>
												</div>
											</div>
										))}

										{parsedOrder.shippingCost > 0 && (
											<div className="flex justify-between text-sm">
												<span className="text-gray-700">Доставка по Китаю:</span>
												<span className="font-medium">{parsedOrder.shippingCost.toLocaleString('ru-RU')} ₽</span>
											</div>
										)}

										{parsedOrder.moscowShippingCost > 0 && (
											<div className="flex justify-between text-sm">
												<span className="text-gray-700">Доставка Китай → Москва:</span>
												<span className="font-medium">{parsedOrder.moscowShippingCost.toLocaleString('ru-RU')} ₽</span>
											</div>
										)}

										<div className="border-t border-gray-200 pt-4 mt-4">
											<div className="flex justify-between items-center">
												<span className="text-lg font-semibold text-gray-900">Итого:</span>
												<span className="text-2xl font-bold text-gray-900">{parseFloat(totalAmount).toLocaleString('ru-RU')} ₽</span>
											</div>
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<p className="text-gray-600 text-center text-sm sm:text-base">
										Мы отправили детали заказа на вашу электронную почту. Вы можете отслеживать статус заказа в личном кабинете.
									</p>
									<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
										<Button
											variant="primary"
											className="flex-1 py-3 text-base"
											onClick={() => router.push('/user')}
										>
											Перейти в личный кабинет
										</Button>
										<Button
											variant="ghost"
											className="flex-1 py-3 text-base"
											onClick={() => router.push('/')}
										>
											Вернуться на главную
										</Button>
									</div>
								</div>
							</>
						)}

						{!loading && !order && !error && (
							<div className="text-center py-8 sm:py-12">
								<p className="text-gray-600">Информация о заказе недоступна.</p>
							</div>
						)}

						<p className="mt-6 sm:mt-8 text-xs sm:text-sm text-gray-500 text-center">Если у вас есть вопросы, свяжитесь с нашей поддержкой.</p>
					</div>
				</div>
			</div>
		</div>
	)
}