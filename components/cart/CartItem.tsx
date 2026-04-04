'use client'

import { QuantitySelector } from '@/components/ui'
import { useCartStore } from '@/lib/store'
import { normalizeImageUrl } from '@/lib/utils/utils'
import { Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

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

function safeImage(url?: string | null): string {
	if (!url) return ''

	const value = String(url).trim()
	if (!value) return ''

	try {
		return normalizeImageUrl(value)
	} catch {
		if (value.startsWith('//')) return `https:${value}`
		return value
	}
}

export default function CartItem({
	productId,
	title,
	price,
	imageUrl,
	quantity,
	source,
	color,
	size,
	skuId
}: CartItemProps) {
	const { updateQuantity, removeItem } = useCartStore()

	const desktopTitle = title.length > 50 ? `${title.slice(0, 50)}...` : title
	const mobileTitle = title.length > 20 ? `${title.slice(0, 20)}...` : title

	const numericPrice = useMemo(() => {
		return parseFloat(String(price).replace(/[^\d.-]/g, '')) || 0
	}, [price])

	const itemTotal = useMemo(() => {
		return (numericPrice * quantity).toFixed(2)
	}, [numericPrice, quantity])

	const initialImage = useMemo(() => {
		return safeImage(imageUrl || '')
	}, [imageUrl])

	const [resolvedImageUrl, setResolvedImageUrl] = useState(initialImage)
	const [imgError, setImgError] = useState(false)

	useEffect(() => {
		setResolvedImageUrl(initialImage)
		setImgError(false)
	}, [initialImage, productId])

	useEffect(() => {
		const needImage = !resolvedImageUrl || resolvedImageUrl.trim() === ''

		if (!needImage) return

		let cancelled = false

		fetch(`/api/product/${productId}?debug=1`, { cache: 'no-store' })
			.then(res => res.json())
			.then(json => {
				if (cancelled || !json?.success || !json?.data) return

				const data = json.data
				const fallbackImage =
					safeImage(data.image) ||
					(Array.isArray(data.images) ? safeImage(data.images[0]) : '') ||
					(Array.isArray(data.skuOptions) && data.skuOptions.length > 0
						? safeImage(data.skuOptions[0]?.image)
						: '')

				if (fallbackImage) {
					setResolvedImageUrl(fallbackImage)
					setImgError(false)
				}
			})
			.catch(() => {})

		return () => {
			cancelled = true
		}
	}, [productId, resolvedImageUrl])

	const shouldShowFallback = imgError || !resolvedImageUrl || resolvedImageUrl === '/no-image.jpg'

	return (
		<div className="rounded-lg border border-gray-300 p-2 md:p-2.5">
			<div className="flex items-start gap-2 md:gap-4" id="cart-item">
				<div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 md:h-24 md:w-24">
					<Link href={`/product/${productId}`} id="item-image" className="block h-full w-full">
						{!shouldShowFallback ? (
							<Image
								src={resolvedImageUrl}
								alt={title}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 64px, 96px"
								loading="lazy"
								unoptimized
								onError={() => {
									if (!imgError) {
										fetch(`/api/product/${productId}?debug=1`, { cache: 'no-store' })
											.then(res => res.json())
											.then(json => {
												if (!json?.success || !json?.data) {
													setImgError(true)
													return
												}

												const data = json.data
												const retryImage =
													safeImage(data.image) ||
													(Array.isArray(data.images) ? safeImage(data.images[0]) : '') ||
													(Array.isArray(data.skuOptions) && data.skuOptions.length > 0
														? safeImage(data.skuOptions[0]?.image)
														: '')

												if (retryImage && retryImage !== resolvedImageUrl) {
													setResolvedImageUrl(retryImage)
													return
												}

												setImgError(true)
											})
											.catch(() => setImgError(true))
									}
								}}
							/>
						) : (
							<div className="flex h-full items-center justify-center text-xs text-gray-400">
								Нет фото
							</div>
						)}
					</Link>
				</div>

				<div id="item-description" className="flex flex-1 flex-col gap-1.5 md:gap-2.5">
					<div className="flex justify-end">
						<button
							onClick={() => removeItem(productId, color, size, skuId)}
							className="rounded-lg p-2 text-red-500 transition-colors hover:cursor-pointer hover:bg-red-50"
							title="Удалить"
							aria-label="Удалить товар"
						>
							<Trash2 size={18} />
						</button>
					</div>

					<div className="flex flex-1 flex-col gap-2.5">
						<div className="item-price flex w-full items-center justify-between lg:gap-5">
							<span className="text-sm font-bold text-black md:text-lg">Товар:</span>

							<Link
								href={`/product/${productId}`}
								id="item-title"
								className="ml-2 mb-0 hidden text-right text-sm font-medium text-black transition-colors hover:cursor-pointer hover:text-blue-600 hover:underline sm:block md:mb-2.5 md:text-lg"
							>
								{desktopTitle}
							</Link>

							<Link
								href={`/product/${productId}`}
								className="ml-2 mb-0 text-start text-sm font-medium text-black transition-colors hover:cursor-pointer hover:text-blue-600 hover:underline sm:hidden md:mb-2.5 md:text-lg"
							>
								{mobileTitle}
							</Link>
						</div>

						{color && (
							<div className="item-price flex w-full items-center justify-between">
								<span className="text-sm font-bold text-black md:text-lg">Цвет:</span>
								<span className="text-sm font-semibold text-black md:text-lg">{color}</span>
							</div>
						)}

						{size && (
							<div className="item-price flex w-full items-center justify-between">
								<span className="text-sm font-bold text-black md:text-lg">Размер:</span>
								<span className="text-sm font-semibold text-black md:text-lg">{size}</span>
							</div>
						)}

						<div className="item-price flex w-full items-center justify-between">
							<span className="text-sm font-bold text-black md:text-lg">Цена:</span>
							<span id="item-price" className="text-sm font-semibold text-black md:text-lg">
								{numericPrice.toLocaleString('ru-RU')} ₽
							</span>
						</div>

						<div className="item-price flex w-full items-center justify-between">
							<span className="text-sm font-bold text-black md:text-lg">Кол-во:</span>
							<div id="item-count" className="text-sm font-semibold text-black md:text-lg">
								<QuantitySelector
									value={quantity}
									onChange={newQuantity =>
										updateQuantity(productId, newQuantity, color, size, skuId)
									}
									min={1}
									max={99}
								/>
							</div>
						</div>

						<div className="item-price flex w-full items-center justify-between">
							<span className="text-sm font-bold text-black md:text-lg">Итого:</span>
							<span id="item-total" className="text-sm font-semibold text-gray-600 md:text-lg">
								{itemTotal} ₽
							</span>
						</div>
					</div>

					{source && (
						<div className="text-xs text-gray-500 md:text-sm">
							Источник: <span className="font-medium">{source.toUpperCase()}</span>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
