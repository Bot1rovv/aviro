'use client'

import { useFavorites } from '@/hooks'
import { ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../ui/Button/Button'

interface FavItemProps {
	productId: string
	title: string
	price: string
	imageUrl?: string
	source?: 'taobao' | '1688' | 'poizon'
}

function normalizeImage(url?: string) {
	if (!url) return '/no-image.jpg'
	if (url.startsWith('//')) return `https:${url}`
	return url
}

export default function FavItem({ productId, title, price, imageUrl, source }: FavItemProps) {
	const { removeFavorite } = useFavorites()

	const displayPrice = Number(String(price).replace(/[^\d.-]/g, '')) || 0

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-all hover:border-green-100 hover:shadow-md">
			<div className="grid grid-cols-[88px_1fr] gap-3 sm:grid-cols-[110px_1fr]">
				<Link
					href={`/product/${productId}`}
					className="relative block h-[88px] w-[88px] overflow-hidden rounded-lg bg-gray-100 sm:h-[110px] sm:w-[110px]"
				>
					<Image
						src={normalizeImage(imageUrl)}
						alt={title}
						fill
						className="object-cover"
						sizes="(max-width: 640px) 88px, 110px"
						unoptimized
					/>
				</Link>

				<div className="flex min-w-0 flex-col">
					<div className="mb-2 flex items-start justify-between gap-2">
						<Link
							href={`/product/${productId}`}
							className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-[#0f6b46] sm:text-base"
						>
							{title}
						</Link>

						<button
							onClick={() => removeFavorite(productId)}
							className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
							aria-label="Удалить из избранного"
							title="Удалить из избранного"
						>
							<X size={16} />
						</button>
					</div>

					<div className="mb-1 flex items-center justify-between gap-3 text-sm">
						<span className="font-medium text-gray-500">Цена:</span>
						<span className="font-bold text-[#0f6b46]">{displayPrice.toLocaleString('ru-RU')} ₽</span>
					</div>

					<div className="mb-3 flex items-center justify-between gap-3 text-sm">
						<span className="font-medium text-gray-500">Наличие:</span>
						<span className="font-medium text-green-600">В наличии</span>
					</div>

					{source && (
						<div className="mb-3 text-xs text-gray-400">
							Источник: <span className="font-medium uppercase">{source}</span>
						</div>
					)}

					<Link href={`/product/${productId}`} className="mt-auto">
						<Button
							variant="primary"
							className="w-full flex items-center justify-center gap-2 rounded-xl"
						>
							<ShoppingBag size={18} />
							<span>Купить сейчас</span>
						</Button>
					</Link>
				</div>
			</div>
		</div>
	)
}