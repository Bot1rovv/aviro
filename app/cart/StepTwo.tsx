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
import { useEffect, useState } from 'react'

interface StepTwoProps {
	onNext?: (data: { items: CartItem[]; userInfo: UserInfo }) => void
	onBack?: () => void
}

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
				<div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
					<ShoppingBag
						size={64}
						className="text-gray-300 mb-4"
					/>
					<p className="text-gray-500 text-lg">Корзина пуста</p>
					<Link
						href="/"
						className="mt-4 text-blue-700 hover:text-blue-800 font-semibold"
					>
						Перейти в каталог
					</Link>
				</div>
			) : (
				<>
					<div className="bg-white rounded-lg border border-gray-200 p-5 flex flex-col gap-5">
						<FormCart onNext={handleFormSubmit} />
					</div>

					<h2 className="text-black font-semibold text-2xl mb-5 mt-5">Ваш заказ</h2>

					<div className="mt-5 border border-gray-100 rounded-lg flex flex-col gap-2.5">
						{items.map(item => (
							<div
								key={`${item.productId}-${item.color || ''}-${item.size || ''}-${item.skuId || ''}`}
								className="p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
							>
								<div className="flex gap-4">
									<Link
										href={`/product/${item.productId}`}
										className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 block"
									>
										{item.imageUrl ? (
											<Image
												src={item.imageUrl}
												alt={item.title}
												fill
												className="object-cover"
												sizes="96px"
												loading="lazy"
											/>
										) : (
											<div className="flex items-center justify-center h-full text-gray-400 text-xs">Нет фото</div>
										)}
									</Link>

									<div className="flex-1 min-w-0">
										<Link
											href={`/product/${item.productId}`}
											className="block"
										>
											<h3
												className="font-medium text-gray-900 mb-2 truncate hover:text-blue-600 transition-colors"
												title={item.title}
											>
												{item.title}
											</h3>
										</Link>

										<div className="flex items-center justify-between mb-2">
											<span className="text-red-500 font-bold">{item.price} ₽</span>
											<span className="text-sm text-gray-500">{item.source.toUpperCase()}</span>
										</div>

										{item.color && <div className="text-sm text-gray-500 mb-1">Цвет: {item.color}</div>}
										{item.size && <div className="text-sm text-gray-500 mb-1">Размер: {item.size}</div>}

										<div className="flex items-center justify-between">
											<div className="flex items-center gap-2">
												<span className="text-gray-700 font-medium">Количество:</span>
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

					<div className="lg:grid lg:grid-cols-2 gap-5 mt-5">
						<div>
							<div className="text-xs mb-2.5">
								<span>
									Ваши личные данные будут использоваться для обработки ваших заказов, упрощения вашей работы с сайтом и для других целей, описанных в
									нашей
								</span>{' '}
								<Link
									href="#"
									className="underline"
								>
									политике конфиденциальности.
								</Link>
							</div>

							<label
								htmlFor="yandex"
								className="flex items-center gap-2.5"
							>
								<input
									type="radio"
									id="yandex"
									name="paymentMethod"
									defaultChecked
									value="yandex"
								/>
								<span className="text-sm text-gray-600">Оплата через Яндекс Пэй.</span>
							</label>
						</div>

						<div className="p-2.5 border border-b border-gray-300 rounded-lg mt-2.5">
							<h2 className="uppercase font-semibold text-lg text-black text-center border-b border-b-gray-200 pb-2">
								Всего в корзине: {totalItems} {totalItems === 1 ? 'товар' : totalItems > 1 && totalItems < 5 ? 'товара' : 'товаров'}
							</h2>

							<div className="flex items-center justify-between w-full mt-2.5">
								<span className="text-lg font-bold text-black">Стоимость товаров:</span>
								<span className="text-black font-semibold text-lg">{totalPrice.toFixed(2)} ₽</span>
							</div>

							<div className="flex items-center justify-between w-full mt-2">
								<span className="text-lg font-bold text-black">Доставка по Китаю:</span>
								<span className="text-black font-semibold text-lg">
									{shippingLoading ? 'Расчет...' : `${shippingCost.toFixed(2)} ₽`}
								</span>
							</div>

							<div className="flex items-center justify-between w-full mt-2">
								<span className="text-lg font-bold text-black">Доставка Китай → Москва:</span>
								<span className="text-black font-semibold text-lg">
									{shippingLoading ? 'Расчет...' : `${moscowShippingCost.toFixed(2)} ₽`}
								</span>
							</div>

							<div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-200">
								<span className="text-lg font-bold text-black">Итого:</span>
								<span
									id="item-price"
									className="text-black font-semibold text-lg"
								>
									{shippingLoading ? '...' : `${finalTotal.toFixed(2)} ₽`}
								</span>
							</div>

							<Button
								variant="primary"
								onClick={handleSubmitFromButton}
								className="mt-4 w-full flex-shrink-0 flex items-center justify-center gap-2.5"
								loading={loading}
								disabled={loading || shippingLoading}
							>
								<span>{loading ? 'Отправка...' : 'Подтвердить заказ'}</span>
							</Button>

							<Button
								variant="ghost"
								size="sm"
								onClick={handleClearCart}
								className="w-full mt-2 text-gray-600 hover:text-red-500"
							>
								Очистить корзину
							</Button>
						</div>
					</div>

					{onBack && (
						<Button
							variant="secondary"
							onClick={onBack}
							className="mt-2 w-full lg:w-[300px]"
						>
							← Назад
						</Button>
					)}
				</>
			)}
		</div>
	)
}