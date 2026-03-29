'use client'

import { QuantitySelector } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface CartItemProps {
	productId: string
	title: string
	price: string
	imageUrl?: string
	quantity: number
	source?: 'taobao' | '1688' | 'poizon'
	color?: string
	size?: string
	skuId?: string
}

export default function CartItem({ productId, title, price, imageUrl, quantity, source, color, size, skuId }: CartItemProps) {
	const { updateQuantity, removeItem } = useCartStore()

	const itemTotal = (parseFloat(price) * quantity).toFixed(2)
	const desktopTitle = title.length > 50 ? `${title.slice(0, 50)}...` : title
	const mobileTitle = title.length > 20 ? `${title.slice(0, 20)}...` : title

	return (
		<div className="p-2 md:p-2.5 border border-gray-300 rounded-lg">
			<div
				className="flex items-start gap-2 md:gap-4"
				id="cart-item"
			>
				<div className="relative w-16 h-16 md:w-24 md:h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
					<Link
						href={`/product/${productId}`}
						id="item-image"
						className="block w-full h-full"
					>
						{imageUrl ? (
							<Image
								src={imageUrl}
								alt={title}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 64px, 96px"
								loading="lazy"
							/>
						) : (
							<div className="flex items-center justify-center h-full text-gray-400 text-xs">Нет фото</div>
						)}
					</Link>
				</div>

				<div
					id="item-description"
					className="flex-1 flex flex-col gap-1.5 md:gap-2.5"
				>
					<div className="flex justify-end">
						<button
							onClick={() => removeItem(productId, color, size, skuId)}
							className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors hover:cursor-pointer"
							title="Удалить"
							aria-label="Удалить товар"
						>
							<Trash2 size={18} />
						</button>
					</div>

					<div className="flex-1 gap-2.5 flex flex-col">
						<div className="item-price flex items-center justify-between lg:gap-5 w-full">
							<span className="text-sm md:text-lg font-bold text-black">Товар:</span>

							<Link
								href={`/product/${productId}`}
								id="item-title"
								className="font-medium text-black text-sm md:text-lg mb-0 md:mb-2.5 ml-2 hidden sm:block text-right hover:underline hover:text-blue-600 transition-colors cursor-pointer"
							>
								{desktopTitle}
							</Link>

							<Link
								href={`/product/${productId}`}
								className="font-medium text-black text-sm md:text-lg mb-0 md:mb-2.5 text-start ml-2 sm:hidden hover:underline hover:text-blue-600 transition-colors cursor-pointer"
							>
								{mobileTitle}
							</Link>
						</div>

						{color && (
							<div className="item-price flex items-center justify-between w-full">
								<span className="text-sm md:text-lg font-bold text-black">Цвет:</span>
								<span className="text-black font-semibold text-sm md:text-lg">{color}</span>
							</div>
						)}

						{size && (
							<div className="item-price flex items-center justify-between w-full">
								<span className="text-sm md:text-lg font-bold text-black">Размер:</span>
								<span className="text-black font-semibold text-sm md:text-lg">{size}</span>
							</div>
						)}

						<div className="item-price flex items-center justify-between w-full">
							<span className="text-sm md:text-lg font-bold text-black">Цена:</span>
							<span
								id="item-price"
								className="text-black font-semibold text-sm md:text-lg"
							>
								{price} ₽
							</span>
						</div>

						<div className="item-price flex items-center justify-between w-full">
							<span className="text-sm md:text-lg font-bold text-black">Кол-во:</span>
							<div
								id="item-count"
								className="text-black font-semibold text-sm md:text-lg"
							>
								<QuantitySelector
									value={quantity}
									onChange={newQuantity => updateQuantity(productId, newQuantity, color, size, skuId)}
									min={1}
									max={99}
								/>
							</div>
						</div>

						<div className="item-price flex items-center justify-between w-full">
							<span className="text-sm md:text-lg font-bold text-black">Итого:</span>
							<span
								id="item-total"
								className="text-gray-600 font-semibold text-sm md:text-lg"
							>
								{itemTotal} ₽
							</span>
						</div>
					</div>

					{source && (
						<div className="text-xs md:text-sm text-gray-500">
							Источник: <span className="font-medium">{source.toUpperCase()}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}