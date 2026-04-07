'use client'

import type { FormData as FormCartFormData } from '@/components/cart/FormCart'
import FormCart from '@/components/cart/FormCart'
import { Button } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { CartItem } from '@/types/cart'
import { UserInfo } from '@/types/yandex-pay'
import { ShoppingBag, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

interface StepTwoProps {
	onNext?: (data: { items: CartItem[]; userInfo: UserInfo }) => void
	onBack?: () => void
}

const MIN_ORDER_AMOUNT = 5000

export default function StepTwo({ onNext, onBack }: StepTwoProps) {
	const {
		items,
		totalItems,
		totalPrice,
		shippingCost,
		moscowShippingCost,
		removeItem,
		clearCart,
		setShippingCost,
		setMoscowShippingCost
	} = useCartStore()

	const router = useRouter()

	const [loading, setLoading] = useState(false)
	const [shippingLoading, setShippingLoading] = useState(false)
	const [userInfo, setUserInfo] = useState<UserInfo>({})

	useEffect(() => {
		if (items.length === 0) {
			setShippingCost(0)
			setMoscowShippingCost(0)
			return
		}

		const calculateShipping = async () => {
			setShippingLoading(true)

			try {
				const response = await fetch('/api/shipping', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						items: items.map(item => ({
							productId: item.productId,
							quantity: item.quantity,
							source: item.source,
							weightGrams: item.weightGrams ?? 0
						}))
					})
				})

				const data = await response.json()

				if (data.success) {
					setShippingCost(Number(data.data?.totalShipping || 0))
					setMoscowShippingCost(Number(data.data?.totalMoscowShipping || 0))
				} else {
					console.error('Failed to calculate shipping:', data.error)
				}
			} catch (error) {
				console.error('Shipping API error:', error)
			} finally {
				setShippingLoading(false)
			}
		}

		calculateShipping()
	}, [items, setShippingCost, setMoscowShippingCost])

	const finalTotal = totalPrice + shippingCost + moscowShippingCost
	const minOrderLeft = useMemo(() => Math.max(0, MIN_ORDER_AMOUNT - totalPrice), [totalPrice])
	const isMinOrderReached = totalPrice >= MIN_ORDER_AMOUNT

	const handleClearCart = () => {
		if (confirm('Вы уверены, что хотите очистить корзину?')) {
			clearCart()
			router.push('/')
		}
	}

	const handleFormSubmit = (data: FormCartFormData) => {
		const newUserInfo: UserInfo = {
			email: data.email,
			phone: data.phone,
			firstName: data.name,
			lastName: data.family,
			city: data.town,
			address: `${data.address1} ${data.address2}`.trim()
		}
		setUserInfo(newUserInfo)
	}

	const getFormDataFromDOM = (): FormCartFormData | null => {
		if (typeof document === 'undefined') return null

		const form = document.querySelector('form[action="#"]') as HTMLFormElement | null
		if (!form) return null

		const formData = new FormData(form)

		return {
			name: (formData.get('name') as string) || '',
			family: (formData.get('family') as string) || '',
			email: (formData.get('email') as string) || '',
			receiver: (formData.get('receiver') as string) || '',
			phone: (formData.get('phone') as string) || '',
			town: (formData.get('town') as string) || '',
			address1: (formData.get('address1') as string) || '',
			address2: (formData.get('address2') as string) || '',
			paymentMethod: (formData.get('paymentMethod') as string) || 'yandex'
		}
	}

	const handleSubmitFromButton = () => {
		if (!isMinOrderReached) {
			alert(
				`Минимальная сумма заказа ${MIN_ORDER_AMOUNT.toLocaleString(
					'ru-RU'
				)} ₽ без доставки. Добавьте товаров ещё на ${minOrderLeft.toLocaleString('ru-RU')} ₽.`
			)
			return
		}

		const formData = getFormDataFromDOM()

		if (!formData) {
			setLoading(true)
			onNext?.({ items, userInfo })
			setTimeout(() => setLoading(false), 300)
			return
		}

		const newUserInfo: UserInfo = {
			email: formData.email,
			phone: formData.phone,
			firstName: formData.name,
			lastName: formData.family,
			city: formData.town,
			address: `${formData.address1} ${formData.address2}`.trim()
		}

		setUserInfo(newUserInfo)
		setLoading(true)
		onNext?.({ items, userInfo: newUserInfo })
		setTimeout(() => setLoading(false), 300)
	}

	return (
		<div id="step-2">
			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-20">
					<ShoppingBag size={64} className="mb-4 text-gray-300" />
					<p className="text-lg text-gray-500">Корзина пуста</p>
					<Link href="/" className="mt-4 font-semibold text-blue-700 hover:text-blue-800">
						Перейти в каталог
					</Link>
				</div>
			) : (
				<>
					<div className="flex flex-col gap-5 rounded-lg border border-gray-200 bg-white p-5">
						<FormCart onNext={handleFormSubmit} />
					</div>

					<h2 className="mb-5 mt-5 text-2xl font-semibold text-black">Ваш заказ</h2>

					<div className="mt-5 flex flex-col gap-2.5 rounded-lg border border-gray-100">
						{items.map(item => (
							<div
								key={`${item.productId}-${item.color || ''}-${item.size || ''}-${item.skuId || ''}`}
								className="border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 last:border-0"
							>
								<div className="flex gap-4">
									<Link
										href={`/product/${item.productId}`}
										className="relative block h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100"
									>
										{item.imageUrl ? (
											<Image
												src={item.imageUrl}
												alt={item.title}
												fill
												className="object-cover"
												sizes="96px"
												loading="lazy"
												unoptimized
											/>
										) : (
											<div className="flex h-full items-center justify-center text-xs text-gray-400">
												Нет фото
											</div>
										)}
									</Link>

									<div className="min-w-0 flex-1">
										<Link href={`/product/${item.productId}`} className="block">
											<h3
												className="mb-2 truncate font-medium text-gray-900 transition-colors hover:text-blue-600"
												title={item.title}
											>
												{item.title}
											</h3>
										</Link>

										<div className="mb-2 flex items-center justify-between">
											<span className="font-bold text-red-500">{item.price} ₽</span>
											<span className="text-sm text-gray-500">{item.source.toUpperCase()}</span>
										</div>

										{item.color && <div className="mb-1 text-sm text-gray-500">Цвет: {item.color}</div>}
										{item.size && <div className="mb-1 text-sm text-gray-500">Размер: {item.size}</div>}

										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="font-medium text-gray-700">Количество:</span>
												<span className="text-lg font-bold">{item.quantity}</span>
											</div>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => removeItem(item.productId, item.color, item.size, item.skuId)}
												className="p-2 text-red-500 hover:bg-red-50"
												title="Удалить"
											>
												<Trash2 size={18} />
											</Button>
										</div>
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="mt-5 gap-5 lg:grid lg:grid-cols-2">
						<div>
							<div className="mb-2.5 text-xs">
								<span>
									Ваши личные данные будут использоваться для обработки ваших заказов,
									упрощения вашей работы с сайтом и для других целей, описанных в нашей
								</span>{' '}
								<Link href="#" className="underline">
									политике конфиденциальности.
								</Link>
							</div>

							<label htmlFor="yandex" className="flex items-center gap-2.5">
								<input type="radio" id="yandex" name="paymentMethod" defaultChecked value="yandex" />
								<span className="text-sm text-gray-600">Оплата через Яндекс Пэй.</span>
							</label>
						</div>

						<div className="mt-2.5 rounded-lg border border-b border-gray-300 p-2.5">
							<h2 className="border-b border-b-gray-200 pb-2 text-center text-lg font-semibold uppercase text-black">
								Всего в корзине: {totalItems}{' '}
								{totalItems === 1 ? 'товар' : totalItems > 1 && totalItems < 5 ? 'товара' : 'товаров'}
							</h2>

							<div className="mt-2.5 flex w-full items-center justify-between">
								<span className="text-lg font-bold text-black">Стоимость товаров:</span>
								<span className="text-lg font-semibold text-black">{totalPrice.toFixed(2)} ₽</span>
							</div>

							<div className="mt-2 flex w-full items-center justify-between">
								<span className="text-lg font-bold text-black">Доставка по Китаю:</span>
								<span className="text-lg font-semibold text-black">
									{shippingLoading ? 'Расчет...' : `${shippingCost.toFixed(2)} ₽`}
								</span>
							</div>

							<div className="mt-2 flex w-full items-center justify-between">
								<span className="text-lg font-bold text-black">Доставка Китай → Москва:</span>
								<span className="text-lg font-semibold text-black">
									{shippingLoading ? 'Расчет...' : `${moscowShippingCost.toFixed(2)} ₽`}
								</span>
							</div>

							{!isMinOrderReached && (
								<div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
									<p className="text-sm font-semibold text-amber-900">
										Минимальная сумма заказа: {MIN_ORDER_AMOUNT.toLocaleString('ru-RU')} ₽ без доставки.
									</p>
									<p className="mt-1 text-sm text-amber-800">
										Добавьте товаров ещё на {minOrderLeft.toLocaleString('ru-RU')} ₽.
									</p>
								</div>
							)}

							<div className="mt-2 flex w-full items-center justify-between border-t border-gray-200 pt-2">
								<span className="text-lg font-bold text-black">Итого:</span>
								<span id="item-price" className="text-lg font-semibold text-black">
									{shippingLoading ? '...' : `${finalTotal.toFixed(2)} ₽`}
								</span>
							</div>

							<Button
								variant="primary"
								onClick={handleSubmitFromButton}
								className="mt-4 flex w-full flex-shrink-0 items-center justify-center gap-2.5"
								loading={loading}
								disabled={loading || shippingLoading || !isMinOrderReached}
							>
								<span>
									{!isMinOrderReached
										? `Минимум ${MIN_ORDER_AMOUNT.toLocaleString('ru-RU')} ₽`
										: loading
											? 'Отправка...'
											: 'Подтвердить заказ'}
								</span>
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleClearCart}
								className="mt-2 w-full text-gray-600 hover:text-red-500"
							>
								Очистить корзину
							</Button>
						</div>
					</div>

					{onBack && (
						<Button variant="secondary" onClick={onBack} className="mt-2 w-full lg:w-[300px]">
							← Назад
						</Button>
					)}
				</>
			)}
		</div>
	)
}
