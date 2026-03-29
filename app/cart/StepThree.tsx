'use client'

import { Button } from '@/components/ui'
import { yandexPayConfig } from '@/config/yandex-pay.config'
import { useCartStore } from '@/lib/store'
import { CartItem } from '@/types/cart'
import { UserInfo, YandexPayPaymentData, YandexPaySession, YandexPayWindow } from '@/types/yandex-pay'
import { CheckCircle, CreditCard, Loader2, Shield } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface StepThreeProps {
	onNext?: () => void
	onBack?: () => void
	orderData?: {
		items: CartItem[]
		userInfo: UserInfo
	}
}

export default function StepThree({ onNext, onBack, orderData }: StepThreeProps) {
	const { items, totalPrice, shippingCost, moscowShippingCost } = useCartStore()
	const finalTotal = totalPrice + shippingCost + moscowShippingCost

	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [paymentSession, setPaymentSession] = useState<YandexPaySession | null>(null)
	const [widgetMounted, setWidgetMounted] = useState(false)

	const widgetContainerRef = useRef<HTMLDivElement>(null)
	const initializedRef = useRef(false)

	useEffect(() => {
		if (typeof window === 'undefined') return

		const scriptId = 'yandex-pay-sdk'

		if (document.getElementById(scriptId)) {
			setTimeout(() => {
				initializeYandexPay()
			}, 100)
			return
		}

		const script = document.createElement('script')
		script.id = scriptId
		script.src = 'https://pay.yandex.ru/sdk/v1/pay.js'
		script.async = true

		script.onload = () => {
			initializeYandexPay()
		}

		script.onerror = () => {
			setError('Не удалось загрузить Яндекс.Пэй SDK')
		}

		document.body.appendChild(script)

		return () => {
			// Скрипт не удаляем, чтобы не ломать повторный рендер
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const initializeYandexPay = () => {
		if (initializedRef.current) return
		initializedRef.current = true

		const YaPay = (window as YandexPayWindow).YaPay

		if (!YaPay) {
			setError('Яндекс.Пэй SDK не загружен')
			return
		}

		if (finalTotal <= 0) {
			setError('Сумма заказа должна быть больше нуля')
			return
		}

		const isSandbox = yandexPayConfig.baseUrl.includes('sandbox')

		const paymentData: YandexPayPaymentData = {
			env: isSandbox ? YaPay.PaymentEnv.Sandbox : YaPay.PaymentEnv.Production,
			version: 4,
			currencyCode: yandexPayConfig.currencyCode,
			merchantId: yandexPayConfig.merchantId,
			totalAmount: finalTotal.toFixed(2),
			availablePaymentMethods: yandexPayConfig.availablePaymentMethods
		}

		async function onPayButtonClick() {
			setLoading(true)

			try {
				const userInfo = orderData?.userInfo || {
					email: '',
					phone: '',
					firstName: '',
					lastName: '',
					city: '',
					address: ''
				}

				const response = await fetch('/api/payment/create-order', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						items: items.map(item => {
							let uniqueId = item.productId

							if (item.skuId) {
								uniqueId = item.skuId
							} else if (item.color || item.size) {
								const colorPart = item.color ? `_${item.color.replace(/[^a-zA-Z0-9]/g, '')}` : ''
								const sizePart = item.size ? `_${item.size.replace(/[^a-zA-Z0-9]/g, '')}` : ''
								uniqueId = `${item.productId}${colorPart}${sizePart}`
							}

							return {
								id: uniqueId,
								title: item.title + (item.color || item.size ? ` (${[item.color, item.size].filter(Boolean).join(', ')})` : ''),
								price: parseFloat(item.price) || 0,
								quantity: item.quantity,
								image: item.imageUrl
							}
						}),
						shippingCost,
						moscowShippingCost,
						userInfo
					})
				})

				if (!response.ok) {
					const errorData = await response.json()
					throw new Error(errorData.error || 'Ошибка создания заказа')
				}

				const data = await response.json()
				return data.paymentUrl
			} catch (err: unknown) {
				const message = err instanceof Error ? err.message : 'Неизвестная ошибка'
				setError(message)
				throw err
			} finally {
				setLoading(false)
			}
		}

		function onFormOpenError(reason: string) {
			setError(`Ошибка открытия формы оплаты: ${reason}`)
		}

		YaPay.createSession(paymentData, {
			onPayButtonClick,
			onFormOpenError
		})
			.then((session: YandexPaySession) => {
				setPaymentSession(session)

				if (widgetContainerRef.current) {
					session.mountButton(widgetContainerRef.current, {
						type: YaPay.ButtonType.Pay,
						theme: YaPay.ButtonTheme.Black,
						width: YaPay.ButtonWidth.Full
					})
					setWidgetMounted(true)
				}
			})
			.catch(() => {
				setError('Не удалось создать платежную сессию.')
			})
	}

	return (
		<div
			id="step-3"
			className="space-y-8"
		>
			<div className="text-center">
				<h2 className="text-3xl font-bold text-gray-900">Оплата заказа</h2>
				<p className="text-gray-600 mt-2">Выберите удобный способ оплаты. Мы поддерживаем карты и рассрочку через Яндекс.Пэй.</p>
			</div>

			<div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8">
				<div className="mb-6">
					<div className="flex items-center justify-between mb-2">
						<span className="text-lg font-bold text-black">Стоимость товаров:</span>
						<span className="text-black font-semibold text-lg">{totalPrice.toFixed(2)} ₽</span>
					</div>

					<div className="flex items-center justify-between mb-2">
						<span className="text-lg font-bold text-black">Доставка по Китаю:</span>
						<span className="text-black font-semibold text-lg">{shippingCost.toFixed(2)} ₽</span>
					</div>

					<div className="flex items-center justify-between mb-2">
						<span className="text-lg font-bold text-black">Доставка Китай → Москва:</span>
						<span className="text-black font-semibold text-lg">{moscowShippingCost.toFixed(2)} ₽</span>
					</div>

					<div className="flex items-center justify-between pt-3 border-t border-gray-200">
						<span className="text-xl font-bold text-black">Итого к оплате:</span>
						<span className="text-black font-bold text-xl">{finalTotal.toFixed(2)} ₽</span>
					</div>
				</div>

				{error && (
					<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
						<strong>Ошибка:</strong> {error}
					</div>
				)}

				<div className="flex items-center justify-between mb-6">
					<div>
						<h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
							<CreditCard className="w-6 h-6 text-blue-600" />
							Яндекс.Пэй
						</h3>
						<p className="text-gray-500 mt-1">Безопасная оплата картой или в рассрочку</p>
					</div>
					<div className="flex items-center gap-2 text-sm text-gray-500">
						<Shield className="w-4 h-4 text-green-500" />
						<span>Защищено Яндексом</span>
					</div>
				</div>

				<div className="grid md:grid-cols-3 gap-8 mb-8">
					<div className="flex items-start gap-3">
						<div className="bg-blue-100 p-2 rounded-full">
							<CheckCircle className="w-5 h-5 text-blue-600" />
						</div>
						<div>
							<h4 className="font-semibold text-gray-900">Безопасно</h4>
							<p className="text-sm text-gray-500">Ваши данные защищены шифрованием</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="bg-green-100 p-2 rounded-full">
							<CreditCard className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<h4 className="font-semibold text-gray-900">Рассрочка</h4>
							<p className="text-sm text-gray-500">Оплата частями без переплаты</p>
						</div>
					</div>

					<div className="flex items-start gap-3">
						<div className="bg-purple-100 p-2 rounded-full">
							<Shield className="w-5 h-5 text-purple-600" />
						</div>
						<div>
							<h4 className="font-semibold text-gray-900">Мгновенно</h4>
							<p className="text-sm text-gray-500">Подтверждение оплаты за секунды</p>
						</div>
					</div>
				</div>

				<div className="mb-6">
					<div className="text-sm text-gray-500 mb-2">Виджет оплаты</div>
					<div
						ref={widgetContainerRef}
						className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl bg-gray-50 p-4 sm:p-6 max-w-full overflow-hidden w-full"
					>
						{!paymentSession && !error && (
							<div className="flex flex-col items-center gap-4 text-gray-500">
								<Loader2
									className="animate-spin"
									size={32}
								/>
								<span className="text-lg">Загрузка виджета оплаты...</span>
								<p className="text-sm text-center max-w-md">Подключаем безопасный платежный виджет Яндекс.Пэй. Это может занять несколько секунд.</p>
							</div>
						)}

						{paymentSession && !widgetMounted && (
							<div className="text-yellow-600">Виджет загружен, но не отобразился. Попробуйте обновить страницу.</div>
						)}
					</div>

					{paymentSession && (
						<div className="mt-2 text-xs text-gray-500">
							Виджет Яндекс.Пэй загружен. Нажмите на кнопку оплаты внутри виджета, чтобы ввести данные карты.
						</div>
					)}
				</div>

				<div className="text-xs text-gray-400 text-center">
					Нажимая кнопку, вы соглашаетесь с{' '}
					<a
						href="https://yandex.ru/legal/pay_termsofuse/"
						target="_blank"
						rel="noopener noreferrer"
						className="underline hover:text-gray-600"
					>
						условиями использования сервиса Яндекс.Пэй
					</a>
					{' и '}
					<a
						href="/privacy-policy"
						className="underline hover:text-gray-600"
					>
						политикой конфиденциальности
					</a>
					.
				</div>
			</div>

			<div className="flex flex-col sm:flex-row gap-4">
				{onBack && (
					<Button
						variant="secondary"
						onClick={onBack}
						className="flex-1"
					>
						← Назад к оформлению
					</Button>
				)}

				{onNext && process.env.NODE_ENV !== 'production' && (
					<Button
						variant="ghost"
						onClick={onNext}
						className="flex-1"
					>
						Пропустить оплату (тест)
					</Button>
				)}
			</div>

			<div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
				<strong>Важно:</strong> После успешной оплаты вы будете автоматически перенаправлены на страницу подтверждения заказа. Если возникли проблемы,
				свяжитесь с нашей поддержкой.
			</div>
		</div>
	)
}