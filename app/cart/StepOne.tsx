'use client'

import CartItem from '@/components/cart/CartItem'
import { Button } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { useEffect, useState } from 'react'

interface StepOneProps {
	onNext?: () => void
}

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

	return (
		<div id="step-1">
			{items.length === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-lg">
					<p className="text-gray-500 text-lg mb-4">Корзина пуста</p>
					<Button
						variant="primary"
						onClick={() => (window.location.href = '/')}
					>
						Перейти в каталог
					</Button>
				</div>
			) : (
				<>
					<div className="mt-5 border border-gray-100 rounded-lg flex flex-col gap-2.5">
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

					<div className="p-2.5 border border-b border-gray-300 rounded-lg mt-2.5">
						<h2 className="uppercase font-semibold text-lg text-black text-center border-b border-b-gray-200">
							Всего в корзине: {totalItems} {totalItems === 1 ? 'товар' : totalItems > 1 && totalItems < 5 ? 'товара' : 'товаров'}
						</h2>

						<div className="flex items-center justify-between w-full mt-2.5">
							<span className="text-lg font-bold text-black">Стоимость товаров:</span>
							<span className="text-black font-semibold text-lg">{totalPrice.toFixed(2)} ₽</span>
						</div>

						<div className="flex items-center justify-between w-full mt-2">
							<span className="text-lg font-bold text-black">Доставка по Китаю:</span>
							<span className="text-black font-semibold text-lg">{loading ? 'Расчет...' : `${shippingCost.toFixed(2)} ₽`}</span>
						</div>

						<div className="flex items-center justify-between w-full mt-2">
							<span className="text-lg font-bold text-black">Доставка Китай → Москва:</span>
							<span className="text-black font-semibold text-lg">{loading ? 'Расчет...' : `${moscowShippingCost.toFixed(2)} ₽`}</span>
						</div>

						<div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-200">
							<span className="text-xl font-bold text-black">Итого:</span>
							<span
								id="item-price"
								className="text-black font-bold text-xl"
							>
								{loading ? '...' : `${totalWithShipping.toFixed(2)} ₽`}
							</span>
						</div>

						{onNext && (
							<Button
								variant="primary"
								onClick={onNext}
								className="mt-4 w-full flex-shrink-0 flex items-center justify-center gap-2.5"
								disabled={loading}
							>
								<span>Оформить заказ</span>
							</Button>
						)}
					</div>
				</>
			)}
		</div>
	)
}