'use client'

import { SourceBadge } from '@/components/ui'
import { useCart, useFavorites } from '@/hooks'
import { ProductItem } from '@/types/product'
import { Heart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

type ProductProps = ProductItem

/**
 * Карточка товара для отображения в сетке.
 */
export default function Product({ productId, title, price, imageUrl, source }: ProductProps) {
	const { addItem, removeItem, isInCart } = useCart()
	const { addFavorite, removeFavorite, isFavorite } = useFavorites()

	// Проверяем, в избранном ли товар
	const favorite = isFavorite(productId)

	// Проверяем, есть ли товар в корзине
	const inCart = isInCart(productId)

	const handleCartClick = () => {
		if (inCart) {
			removeItem(productId)
		} else {
			addItem({
				productId,
				title,
				price,
				imageUrl,
				source: source || '1688'
			})
		}
	}

	const handleToggleFavorite = () => {
		if (favorite) {
			removeFavorite(productId)
		} else {
			addFavorite({
				productId,
				title,
				price,
				imageUrl,
				source: source || '1688'
			})
		}
	}

	return (
		<div className="group rounded-lg  border border-blue-100 hover:shadow-lg flex flex-col h-full transition-all duration-300 hover:translate-y-[-2px]">
			<div
				className="h-48 bg-gray-200 rounded mb-4 flex items-center justify-center relative flex-shrink-0"
				suppressHydrationWarning
			>
				<Link
					href={`/product/${productId}`}
					className="flex items-center justify-center w-full h-full bg-blue-200 rounded-lg p-2"
					id={`product-link-image-${productId}`}
				>
					{imageUrl ? (
						<Image
							src={imageUrl}
							alt={title}
							fill
							className="object-cover rounded"
							sizes="(max-width: 768px) 50vw, 25vw"
							loading="lazy"
						/>
					) : (
						<div className="flex items-center justify-center h-full text-gray-500">Нет изображения</div>
					)}
				</Link>
				{/* Бейдж источника */}
				{source && <SourceBadge source={source} />}
				{/* Кнопка избранного */}
				<button
					onClick={handleToggleFavorite}
					className="absolute cursor-pointer top-2 left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
					title={favorite ? 'Удалить из избранного' : 'Добавить в избранное'}
				>
					<Heart
						size={18}
						className={favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}
					/>
				</button>
			</div>
			<div className="flex-1 p-2.5 flex flex-col gap-2.5 justify-between">
				<Link
					href={`/product/${productId}`}
					className="font-semibold text-sm mb-2 block hover:text-amber-600 transition-colors"
					id={`product-link-title-${productId}`}
					title={title}
					// style={{
					// 	display: '-webkit-box',
					// 	WebkitLineClamp: 2,
					// 	WebkitBoxOrient: 'vertical',
					// 	overflow: 'hidden',
					// 	textOverflow: 'ellipsis'
					// }}
				>
					{title || 'Без названия'}
				</Link>
				<p className="text-red-500 font-bold text-base">{price ? `${Number(price).toLocaleString('ru-RU')} ₽` : 'Цена не указана'}</p>
			</div>
		</div>
	)
}
