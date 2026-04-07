'use client'

import CartItem from '@/components/cart/CartItem'
import { Button } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { useEffect, useMemo, useState } from 'react'

interface StepOneProps {
	onNext?: () => void
}

const MIN_ORDER_AMOUNT = 5000

export default function StepOne({ onNext }: StepOneProps) {
	const {
		items,
		totalItems,
		totalPrice,
		shippingCost,
		moscowShippingCost,
		setShippingCost,
		setMoscowShippingCost
	} = useCartStore()

	const [loading, setLoading] = useState(false)

	useEffect(() => {
		if (items.length === 0) {
			setShippingCost(0)
			setMoscowShippingCost(0)
			return
		}

		const calculateShipping = async () => {
			setLoading(true)

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
					setShippingCost(0)
					setMoscowShippingCost(0)
				}
			} catch (error) {
				console.error('Shipping API error:', error)
				setShippingCost(0)
				setMoscowShippingCost(0)
			} finally {
				setLoading(false)
			}
		}

		calculateShipping()
	}, [items, setShippingCost, setMoscowShippingCost])

	const totalWithShipping = totalPrice + shippingCost + moscowShippingCost
	const minOrderLeft = useMemo(() => Math.max(0, MIN_ORDER_AMOUNT - totalPrice), [totalPrice])
	const isMinOrderReached = totalPrice >= MIN_ORDER_AMOUNT

	return (
		<div id="step-1">
			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center rounded-lg bg-gray-50 py-20">
					<p className="mb-4 text-lg text-gray-500">Корзина пуста</p>
					<Button variant="primary" onClick={() => (window.location.href = '/')}>
						Перейти в каталог
					</Button>
				</div>
			) : (
				<>
					<div className="mt-5 flex flex-col gap-2.5 rounded-lg border border-gray-100">
						{items.map(item => (
							<CartItem
								key={`${item.productId}-${item.color || ''}-${item.size || ''}-${item.skuId || ''}`}
								productId={item.productId}
								title={item.title}
								price={item.price}
								imageUrl={item.imageUrl}
								quantity={item.quantity}
								source={item.source}
								color={item.color}
								size={item.size}
								skuId={item.skuId}
							/>
						))}
					</div>

					<div className="mt-2.5 rounded-lg border border-b border-gray-300 p-2.5">
						<h2 className="border-b border-b-gray-200 text-center text-lg font-semibold uppercase text-black">
							Всего в корзине: {totalItems}{' '}
							{totalItems === 1 ? 'товар' : totalItems > 1 && totalItems < 5 ? 'товара' : 'товаров'}
						</h2>

						<div className="mt-2.5 flex w-full items-center justify-between">
							<span className="text-lg font-bold text-black">Стоимость товаров:</span>
							<span className="text-lg font-semibold text-black">{totalPrice.toFixed(2)} ₽</span>
						</div>

						<div className="mt-2 flex w-full items-center justify-between">
							<span className="text-lg font-bold text-black">Доставка по Китаю:</span>
							<span className="text-lg font-semibold text-black">{loading ? 'Расчет...' : `${shippingCost.toFixed(2)} ₽`}</span>
						</div>

						<div className="mt-2 flex w-full items-center justify-between">
							<span className="text-lg font-bold text-black">Доставка Китай → Москва:</span>
							<span className="text-lg font-semibold text-black">{loading ? 'Расчет...' : `${moscowShippingCost.toFixed(2)} ₽`}</span>
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
							<span className="text-xl font-bold text-black">Итого:</span>
							<span id="item-price" className="text-xl font-bold text-black">
								{loading ? '...' : `${totalWithShipping.toFixed(2)} ₽`}
							</span>
						</div>

						{onNext && (
							<Button
								variant="primary"
								onClick={onNext}
								className="mt-4 flex w-full flex-shrink-0 items-center justify-center gap-2.5"
								disabled={loading || !isMinOrderReached}
							>
								<span>
									{!isMinOrderReached
										? `Минимум ${MIN_ORDER_AMOUNT.toLocaleString('ru-RU')} ₽`
										: 'Оформить заказ'}
								</span>
							</Button>
						)}
					</div>
				</>
			)}
		</div>
	)
}
