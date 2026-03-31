'use client'

import { SourceBadge } from '@/components/ui'
import { useCart, useFavorites } from '@/hooks'
import { normalizeImageUrl } from '@/lib/utils/utils'
import { ProductItem } from '@/types/product'
import { Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface ProductProps extends Omit<ProductItem, 'sales' | 'rating'> {
	sales?: string | number
	rating?: string | number
	shopName?: string
}

export default function Product({
	productId,
	title,
	price,
	imageUrl,
	source,
	sales,
	rating
}: ProductProps) {
	const { addItem, removeItem, isInCart } = useCart()
	const { addFavorite, removeFavorite, isFavorite } = useFavorites()

	const favorite = isFavorite(productId)
	const inCart = isInCart(productId)

	const initialPrice = useMemo(() => {
		return parseFloat(String(price).replace(/[^\d.-]/g, '')) || 0
	}, [price])

	const normalizedImageUrl = useMemo(() => {
		return normalizeImageUrl(imageUrl || '')
	}, [imageUrl])

	const [displayPrice, setDisplayPrice] = useState(initialPrice === 0 ? 150 : initialPrice)
	const [imgError, setImgError] = useState(false)

	useEffect(() => {
		if (initialPrice > 0 && initialPrice < 40) {
			fetch(`/api/product/${productId}`)
				.then(res => res.json())
				.then(json => {
					if (json.success && json.data?.price && json.data.price > displayPrice) {
						setDisplayPrice(json.data.price)
					}
				})
				.catch(() => {})
		}
	}, [productId, initialPrice, displayPrice])

	useEffect(() => {
		setImgError(false)
	}, [normalizedImageUrl])

	const displaySales = useMemo(() => {
		if (sales !== undefined && sales !== null && sales !== '') return sales
		return 0
	}, [sales])

	const displayRating = useMemo(() => {
		if (rating !== undefined && rating !== null && rating !== '') return rating
		return '4.8'
	}, [rating])

	const handleCartClick = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (inCart) {
			removeItem(productId)
		} else {
			addItem({
				productId,
				title,
				price: displayPrice.toString(),
				imageUrl: normalizedImageUrl,
				source: source || '1688'
			})
		}
	}

	const handleToggleFavorite = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()

		if (favorite) {
			removeFavorite(productId)
		} else {
			addFavorite({
				productId,
				title,
				price: displayPrice.toString(),
				imageUrl: normalizedImageUrl,
				source: source || '1688'
			})
		}
	}

	return (
		<div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-100 bg-white transition-all duration-300 hover:border-green-100 hover:shadow-xl active:scale-[0.99]">
			<div className="relative aspect-square flex-shrink-0 overflow-hidden bg-gray-50">
				<Link href={`/product/${productId}`} className="block h-full w-full">
					{!imgError ? (
						<Image
							src={normalizedImageUrl}
							alt={title || 'Товар'}
							fill
							className="object-cover transition-transform duration-500 group-hover:scale-105"
							sizes="(max-width: 768px) 50vw, 25vw"
							loading="lazy"
							unoptimized
							onError={() => setImgError(true)}
						/>
					) : (
						<div className="flex h-full items-center justify-center text-xs text-gray-400">
							Нет фото
						</div>
					)}
				</Link>

				{source && (
					<div className="absolute left-0 top-0">
						<SourceBadge source={source} />
					</div>
				)}

				<button
					onClick={handleToggleFavorite}
					className={`absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-sm shadow-sm transition-all active:scale-90 ${
						favorite
							? 'border border-red-100 bg-red-50 text-red-500'
							: 'bg-white/90 text-gray-400 hover:text-red-500'
					}`}
					aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
				>
					<Heart size={16} className={favorite ? 'fill-red-500 text-red-500' : ''} />
				</button>
			</div>

			<div className="flex flex-1 flex-col justify-between gap-2 p-3">
				<Link href={`/product/${productId}`} className="flex flex-1 flex-col gap-1.5">
					<h3
						className="line-clamp-2 text-xs font-medium leading-tight text-gray-800 transition-colors group-hover:text-[#0f6b46] sm:text-sm"
						title={title}
					>
						{title || 'Без названия'}
					</h3>

					<div className="mt-auto flex items-center gap-1.5 text-[10px] text-gray-400 sm:text-xs">
						<span className="font-medium text-amber-500">★ {displayRating}</span>
						<span>•</span>
						<span>{displaySales}+ купили</span>
					</div>
				</Link>

				<div className="mt-1 flex items-center justify-between border-t border-gray-50 pt-2">
					<span className="text-sm font-bold text-[#0f6b46] transition-all duration-300 sm:text-lg">
						{displayPrice.toLocaleString('ru-RU')} ₽
					</span>

					<button
						onClick={handleCartClick}
						className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition-all active:scale-90 ${
							inCart
								? 'border border-green-100 bg-green-50 text-[#0f6b46]'
								: 'bg-[#0f6b46] text-white shadow-sm hover:bg-[#0a4e32]'
						}`}
						aria-label={inCart ? 'Убрать из корзины' : 'Добавить в корзину'}
						title={inCart ? 'Убрать из корзины' : 'Добавить в корзину'}
					>
						<ShoppingCart size={16} className={inCart ? 'fill-current' : ''} />
					</button>
				</div>
			</div>
		</div>
	)
}
