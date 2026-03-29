'use client'

import { Button, QuantitySelector } from '@/components/ui'
import { useFavorites } from '@/hooks'
import { useCartStore } from '@/lib/store'
import { useUserStore } from '@/lib/store/user'
import { getColorHex, normalizeColor } from '@/lib/utils/color'
import { normalizeImageUrl } from '@/lib/utils/utils'
import { ProductDetail } from '@/types/product'
import { ArrowLeft, Check, CircleCheckBig, Heart, PackageCheck, ShoppingBag, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

// Хук для определения медиа-запроса с использованием useSyncExternalStore
function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(callback: () => void) => {
			const media = window.matchMedia(query)
			media.addEventListener('change', callback)
			return () => media.removeEventListener('change', callback)
		},
		[query]
	)

	const getSnapshot = () => window.matchMedia(query).matches

	return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

// Хелпер для получения валидного изображения (не пустого)
function getValidImage(img: string | undefined | null): string {
	if (img && img.trim() !== '') {
		return normalizeImageUrl(img.trim())
	}
	return '/no-image.jpg'
}

type MediaItem = { type: 'image'; url: string } | { type: 'video'; url: string; poster?: string }

// Извлекает числовое значение размера из строки (первое найденное число)
function extractNumericSize(size: string): string {
	// Ищем последовательность цифр
	const match = size.match(/\d+/)
	if (match) {
		return match[0]
	}
	// Если чисел нет, возвращаем первую строку без лишнего текста
	const firstLine = size.split('\n')[0].trim()
	if (firstLine.length > 10) {
		return firstLine.substring(0, 10) + '...'
	}
	return firstLine
}

// Нормализует название цвета: удаляет скобки, оттенки, фильтрует некорректные значения, переводит, приводит к синонимам

// Нормализует размер: удаляет скобки, суффиксы, стоп-слова, приводит к единому формату (число или буквенный размер)
function normalizeSize(size: string): string {
	if (!size) return ''
	let cleaned = size.trim()
	// Удаляем все скобки и их содержимое (круглые, квадратные, китайские)
	cleaned = cleaned.replace(/[()【】\[\]]/g, ' ').trim()
	// Удаляем суффиксы типа EU, US, UK, CM, см (после числа)
	cleaned = cleaned.replace(/\s*(EU|US|UK|EUR|CM|см)\b/gi, '').trim()
	// Удаляем стоп-слова (размер, код, г, g, см, sm) в начале или конце
	cleaned = cleaned.replace(/^(размер|код|г|g|см|sm)\s*/gi, '').trim()
	cleaned = cleaned.replace(/\s*(размер|код|г|g|см|sm)$/gi, '').trim()
	// Заменяем запятую на точку для десятичных чисел
	cleaned = cleaned.replace(/,/g, '.')
	// Разделяем по запятой, дефису, пробелу
	const parts = cleaned.split(/[,\-\s]+/)
	// Ищем первую значимую часть
	let significantPart = ''
	for (const part of parts) {
		if (!part) continue
		// Пропускаем пустые и стоп-слова
		if (/^(размер|код|г|g|см|sm)$/i.test(part)) continue
		significantPart = part
		break
	}
	if (!significantPart) return ''
	cleaned = significantPart
	// Приводим к нижнему регистру для сравнения
	const lower = cleaned.toLowerCase()
	// Маппинг русских и английских вариантов (точные совпадения)
	const sizeMap: Record<string, string> = {
		xs: 'XS',
		s: 'S',
		м: 'M',
		m: 'M',
		л: 'L',
		l: 'L',
		xl: 'XL',
		хл: 'XL',
		xxl: 'XXL',
		ххл: 'XXL',
		xxxl: 'XXXL',
		хххл: 'XXXL',
		'2': '2',
		'3': '3',
		'4': '4',
		'5': '5',
		'6': '6',
		'7': '7',
		'8': '8',
		'9': '9',
		'10': '10'
	}
	// Проверяем точное совпадение
	if (sizeMap[lower]) {
		return sizeMap[lower]
	}
	// Проверяем, содержит ли число (включая дробное)
	const numericMatch = cleaned.match(/^\d*\.?\d+/)
	if (numericMatch) {
		let num = numericMatch[0]
		if (num.includes('.')) {
			num = parseFloat(num).toString()
		}
		return num
	}
	// Проверяем, содержит ли буквенные размеры (S, M, L и т.д.)
	const letterMatch = cleaned.match(/^(xs|s|m|l|xl|xxl|xxxl)/i)
	if (letterMatch) {
		return letterMatch[0].toUpperCase()
	}
	// Если ничего не найдено, возвращаем в верхнем регистре
	return cleaned.toUpperCase()
}

// Функция для записи в историю
async function addToHistory(action: string, productId?: string, productTitle?: string, productPrice?: string, productImage?: string) {
	try {
		await fetch('/api/user/history', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				action,
				productId,
				productTitle,
				productPrice,
				productImage
			})
		})
	} catch (e) {
		console.error('Failed to add to history:', e)
	}
}

interface ProductClientProps {
	product: ProductDetail
	productId: string
}

export function ProductClient({ product, productId }: ProductClientProps) {
	const [selectedImage, setSelectedImage] = useState(0)
	const { user } = useUserStore()
	const hasRecordedView = useRef(false)

	// Запись просмотра товара в историю
	useEffect(() => {
		if (productId && product && !hasRecordedView.current) {
			addToHistory('view_product', productId, product.title, product.price.toString(), product.image)
			hasRecordedView.current = true
		}
	}, [productId, product])

	// Извлекаем уникальные цвета, размеры и другие атрибуты только из SKU с нормализацией
	const { colors, sizes, colorKey, sizeKey, otherAttributes, colorImages } = useMemo(() => {
		const skuOptions = product.skuOptions || []
		const colorMap = new Map<string, string>() // нормализованный -> оригинальный
		const sizeMap = new Map<string, string>() // нормализованный -> оригинальный
		const otherAttributesMap = new Map<string, Set<string>>() // ключ -> множество значений
		const colorImageMap = new Map<string, string>() // оригинальный цвет -> изображение
		let foundColorKey = 'Color'
		let foundSizeKey = 'Size'

		skuOptions.forEach(sku => {
			Object.entries(sku.attributes).forEach(([key, val]) => {
				const value = val as string
				const keyLower = key.toLowerCase()
				if (keyLower.includes('color') || keyLower.includes('颜色') || keyLower.includes('цвет')) {
					const normalized = normalizeColor(value)
					if (!colorMap.has(normalized)) {
						colorMap.set(normalized, value)
					}
					foundColorKey = key
					// Сохраняем изображение для этого цвета (если есть)
					if (sku.image && !colorImageMap.has(value)) {
						colorImageMap.set(value, sku.image)
					}
				} else if (keyLower.includes('size') || keyLower.includes('尺码') || keyLower.includes('размер')) {
					const normalized = normalizeSize(value)
					if (!sizeMap.has(normalized)) {
						sizeMap.set(normalized, value)
					}
					foundSizeKey = key
				} else {
					// Другие атрибуты
					if (!otherAttributesMap.has(key)) {
						otherAttributesMap.set(key, new Set())
					}
					otherAttributesMap.get(key)!.add(value)
				}
			})
		})

		// Преобразуем otherAttributesMap в массив объектов
		const otherAttributes = Array.from(otherAttributesMap.entries()).map(([key, valuesSet]) => ({
			key,
			values: Array.from(valuesSet)
		}))

		// Отладочный вывод
		if (process.env.NODE_ENV === 'development') {
			console.log('Normalized colors:', Array.from(colorMap.entries()))
			console.log('Normalized sizes:', Array.from(sizeMap.entries()))
			console.log('Original colors:', Array.from(colorMap.values()))
			console.log('Original sizes:', Array.from(sizeMap.values()))
			console.log('Other attributes:', otherAttributes)
			// Отладка для 1688: выводим все изображения SKU
			console.log(
				'SKU images (1688 debug):',
				skuOptions.map(sku => ({ skuId: sku.skuId, image: sku.image, attrs: sku.attributes }))
			)
			console.log('Color images map:', Object.fromEntries(colorImageMap))
		}

		return {
			colors: Array.from(colorMap.values()), // оригинальные значения
			sizes: Array.from(sizeMap.values()), // оригинальные значения
			colorKey: foundColorKey,
			sizeKey: foundSizeKey,
			otherAttributes,
			colorImages: Object.fromEntries(colorImageMap) // цвет -> изображение
		}
	}, [product.skuOptions])

	// Выбранные цвет и размер
	const [selectedColor, setSelectedColor] = useState<string>('')
	const [selectedSize, setSelectedSize] = useState<string>('')

	// Выбранные другие атрибуты
	const [selectedOtherAttributes, setSelectedOtherAttributes] = useState<Record<string, string>>({})

	// Количество товара
	const [quantity, setQuantity] = useState(1)

	// Функция для обновления выбранного значения атрибута
	const handleSelectOtherAttribute = (key: string, value: string) => {
		setSelectedOtherAttributes(prev => ({
			...prev,
			[key]: value
		}))
	}

	// Текущий выбранный SKU
	const selectedSku = useMemo(() => {
		if (!product.skuOptions?.length) return null
		return (
			product.skuOptions.find(sku => {
				const attrs = sku.attributes
				// Проверка цвета
				const colorMatch = !selectedColor || attrs[colorKey] === selectedColor
				// Проверка размера
				const sizeMatch = !selectedSize || attrs[sizeKey] === selectedSize
				// Проверка других атрибутов
				const otherMatch = otherAttributes.every(attr => !selectedOtherAttributes[attr.key] || attrs[attr.key] === selectedOtherAttributes[attr.key])
				return colorMatch && sizeMatch && otherMatch
			}) || null
		)
	}, [product.skuOptions, selectedColor, selectedSize, colorKey, sizeKey, otherAttributes, selectedOtherAttributes])

	// Цена выбранного SKU
	const currentPrice = selectedSku?.price || product.price
	const currentStock = selectedSku?.stock || 0

	// Эффект для сброса выбранного изображения при изменении SKU
	useEffect(() => {
		if (selectedImage !== 0) {
			// Асинхронный сброс, чтобы избежать предупреждения о синхронном setState
			requestAnimationFrame(() => setSelectedImage(0))
		}
	}, [selectedSku]) // Убрали selectedImage из зависимостей

	// Объединяем изображения и видео в единый массив медиа-элементов
	const mediaItems = useMemo(() => {
		const baseImages = product.images || []
		const descImages: string[] = []

		if (product.descriptionHtml) {
			const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
			const matches = [...product.descriptionHtml.matchAll(imgRegex)]
			const extracted = matches.map(m => m[1]).filter(Boolean)
			descImages.push(...extracted)
		}

		// Убираем дубликаты и объединяем изображения
		const combinedImages = [...baseImages]
		descImages.forEach(img => {
			if (!combinedImages.includes(img)) {
				combinedImages.push(img)
			}
		})

		// Добавляем изображение выбранного SKU, если оно есть и не дублируется
		const skuImage = selectedSku?.image
		if (skuImage && !combinedImages.includes(skuImage)) {
			combinedImages.unshift(skuImage)
		}

		// Если есть видео — оно первое, затем все изображения
		const items: MediaItem[] = []

		if (product.videos && product.videos.length > 0) {
			// Добавляем видео первым с placeholder = product.image
			items.push({
				type: 'video',
				url: product.videos[0],
				poster: product.image
			})
		}

		// Добавляем все изображения
		combinedImages.forEach(url => {
			items.push({
				type: 'image',
				url
			})
		})

		return items
	}, [product.images, product.descriptionHtml, selectedSku, product.videos, product.image])

	// Корзина
	const { addItem, removeItem, items } = useCartStore()
	const isInCart = items.some(
		item =>
			item.productId === productId &&
			item.color === (selectedColor || undefined) &&
			item.size === (selectedSize || undefined) &&
			item.skuId === selectedSku?.skuId
	)

	const handleCartClick = () => {
		if (isInCart) {
			removeItem(productId, selectedColor || undefined, selectedSize || undefined, selectedSku?.skuId)
			toast.success('Товар удалён из корзины')
			addToHistory('remove_from_cart', productId, product.title, currentPrice.toString(), selectedSku?.image || product.image)
		} else {
			addItem({
				productId,
				title: product.title,
				price: currentPrice.toString(),
				imageUrl: selectedSku?.image || product.image,
				source: product.source,
				color: selectedColor || undefined,
				size: selectedSize || undefined,
				skuId: selectedSku?.skuId,
				quantity
			})
			toast.success('Товар добавлен в корзину')
			addToHistory('add_to_cart', productId, product.title, currentPrice.toString(), selectedSku?.image || product.image)
		}
	}

	// Избранное
	const { isFavorite, addFavorite, removeFavorite } = useFavorites()
	const isFav = isFavorite(productId)

	const handleFavoriteClick = () => {
		if (isFav) {
			removeFavorite(productId)
		} else {
			addFavorite({
				productId,
				title: product.title,
				price: currentPrice.toString(),
				imageUrl: selectedSku?.image || product.image,
				source: product.source
			})
		}
	}

	const sourceColors = {
		taobao: 'bg-orange-500',
		'1688': 'bg-blue-500',
		poizon: 'bg-green-500'
	}

	const displayTitle = product.title

	return (
		<div className="container mx-auto px-4 py-8">
			<Link
				href="/"
				className="flex items-center gap-2 text-blue-600 mb-4 hover:underline"
			>
				<ArrowLeft size={20} />
				<span>На главную</span>
			</Link>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
				{/* Галерея изображений и видео */}
				<div className="space-y-4">
					<div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
						{mediaItems.length > 0 ? (
							mediaItems[selectedImage].type === 'video' ? (
								<video
									controls
									className="w-full h-full object-cover"
									preload="metadata"
									poster={mediaItems[selectedImage].poster || product.image}
									key={mediaItems[selectedImage].url}
								>
									<source
										src={mediaItems[selectedImage].url}
										type="video/mp4"
									/>
									Ваш браузер не поддерживает видео тег.
								</video>
							) : (
								<Image
									src={getValidImage(mediaItems[selectedImage].url)}
									alt={product.title}
									fill
									className="object-cover"
									sizes="(max-width: 768px) 100vw, 50vw"
									priority
								/>
							)
						) : (
							<Image
								src={getValidImage(product.image)}
								alt={product.title}
								fill
								className="object-cover"
								sizes="(max-width: 768px) 100vw, 50vw"
								priority
							/>
						)}
						{product.source && (
							<span className={`absolute top-4 right-4 px-3 py-1 text-sm text-white rounded ${sourceColors[product.source]}`}>
								{product.source.toUpperCase()}
							</span>
						)}
					</div>
					{mediaItems.length > 1 && (
						<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
							{mediaItems.map((item, idx) => (
								<button
									key={idx}
									onClick={() => setSelectedImage(idx)}
									className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${
										idx === selectedImage ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
									}`}
									title={item.type === 'video' ? 'Видео' : `Изображение ${idx + 1}`}
								>
									{item.type === 'video' ? (
										<>
											<Image
												src={getValidImage(item.poster || product.image)}
												alt="Превью видео"
												fill
												className="object-cover"
												sizes="80px"
												loading="lazy"
											/>
											<div className="absolute inset-0 flex items-center justify-center bg-black/30">
												<svg
													className="w-8 h-8 text-white"
													fill="currentColor"
													viewBox="0 0 24 24"
												>
													<path d="M8 5v14l11-7z" />
												</svg>
											</div>
										</>
									) : (
										<Image
											src={getValidImage(item.url)}
											alt={`${product.title} ${idx + 1}`}
											fill
											className="object-cover"
											sizes="80px"
											loading="lazy"
										/>
									)}
								</button>
							))}
						</div>
					)}
				</div>

				{/* Информация о товаре */}
				<div className="space-y-6">
					<div>
						<h1 className="text-md lg:text-2xl font-bold text-gray-900 mb-2">{displayTitle}</h1>
					</div>

					{product.sales !== undefined && <p className="text-sm text-gray-500">Продано: {product.sales.toLocaleString()}</p>}

					{/* Месячные продажи и повторные покупки */}
					{(product.monthlySales !== undefined || product.repeatPurchasePercent !== undefined) && (
						<div className="flex flex-col gap-1 text-sm">
							{product.monthlySales !== undefined && (
								<p className="text-gray-600">
									Месячные продажи: <span className="font-medium">{product.monthlySales.toLocaleString()}</span>
								</p>
							)}
							{product.repeatPurchasePercent !== undefined && (
								<p className="text-gray-600">
									Процент повторных покупок составляет <span className="font-medium">{product.repeatPurchasePercent.toFixed(2)}%</span>
								</p>
							)}
						</div>
					)}

					{/* Рейтинг продавца */}
					{product.sellerRating && (
						<div className="flex items-center gap-2 text-sm">
							<span className="text-gray-600">Рейтинг продавца:</span>
							<div className="flex items-center gap-1">
								<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
								<span className="font-medium">{product.sellerRating.overall.toFixed(1)}</span>
							</div>
							{product.sellerRating.compositeService !== undefined && (
								<span className="text-gray-400 text-xs">(сервис: {product.sellerRating.compositeService.toFixed(1)})</span>
							)}
						</div>
					)}

					{/* Цены за количество (для 1688) */}
					{product.priceRanges && product.priceRanges.length > 0 && (
						<div className="border rounded-lg overflow-hidden">
							<table className="w-full text-sm">
								<thead className="bg-gray-100">
									<tr>
										<th className="px-3 py-2 text-left font-medium text-gray-700">Количество:</th>
										{product.priceRanges.map((range, idx) => (
											<th
												key={idx}
												className="px-3 py-2 text-center font-medium text-gray-700"
											>
												{range.minQuantity}+ шт
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									<tr className="bg-gray-50">
										<td className="px-3 py-2 text-gray-600">Цена:</td>
										{product.priceRanges.map((range, idx) => (
											<td
												key={idx}
												className="px-3 py-2 text-center font-medium"
											>
												<span className="text-green-600">{range.promotionPrice?.toLocaleString() || range.price.toLocaleString()} ₽</span>
											</td>
										))}
									</tr>
								</tbody>
							</table>
						</div>
					)}

					<div className="flex items-baseline gap-4">
						<span className="text-3xl font-bold text-red-500">{currentPrice.toLocaleString()} ₽</span>
						{product.originalPrice && product.originalPrice > product.price && (
							<span className="text-lg text-gray-400 line-through">{product.originalPrice.toLocaleString()} ₽</span>
						)}
					</div>

					{/* Выбор цвета */}
					{colors.length > 0 && (
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">
								{colorKey}
								{selectedColor && <span className="ml-2 text-gray-900 font-medium">({selectedColor})</span>}
							</label>
							<div className="flex flex-wrap gap-3">
								{colors.map(color => {
									const colorHex = getColorHex(color)
									const isSelected = selectedColor === color
									const colorImage = colorImages[color]

									if (colorImage) {
										// Показываем картинку из SKU
										return (
											<button
												key={color}
												onClick={() => setSelectedColor(color)}
												className={`relative w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-md border-2 overflow-hidden flex items-center justify-center transition-all ${
													isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-300 hover:border-gray-400'
												}`}
												title={color}
											>
												<Image
													src={getValidImage(colorImage)}
													alt={color}
													width={56}
													height={56}
													className="object-cover w-full h-full"
												/>
												{isSelected && (
													<div className="absolute inset-0 bg-black/30 flex items-center justify-center">
														<Check className="w-5 h-5 text-white stroke-[3]" />
													</div>
												)}
											</button>
										)
									}

									// Fallback: круглая кнопка с цветом
									return (
										<button
											key={color}
											onClick={() => setSelectedColor(color)}
											className={`relative w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
												isSelected ? 'border-blue-500' : 'border-gray-300 hover:border-gray-400'
											}`}
											style={{ backgroundColor: colorHex }}
											title={color}
										>
											{isSelected && <Check className="w-5 h-5 text-white stroke-[3]" />}
										</button>
									)
								})}
							</div>
						</div>
					)}

					{/* Выбор размера */}
					{sizes.length > 0 && (
						<div className="space-y-2">
							<label className="block text-sm font-medium text-gray-700">{sizeKey}</label>
							<div className="flex flex-wrap gap-2">
								{sizes.map(size => (
									<button
										key={size}
										onClick={() => setSelectedSize(size)}
										className={`px-4 py-2 rounded-lg border-2 transition-all ${
											selectedSize === size ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
										}`}
										title={size}
									>
										{extractNumericSize(size)}
									</button>
								))}
							</div>
						</div>
					)}

					{/* Выбор других атрибутов */}
					{otherAttributes.map(attr => (
						<div
							key={attr.key}
							className="space-y-2"
						>
							<label className="block text-sm font-medium text-gray-700">{attr.key}</label>
							<div className="flex flex-wrap gap-2">
								{attr.values.map(value => {
									const isSelected = selectedOtherAttributes[attr.key] === value
									return (
										<button
											key={value}
											onClick={() => handleSelectOtherAttribute(attr.key, value)}
											className={`px-4 py-2 rounded-lg border-2 transition-all ${
												isSelected ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
											}`}
											title={value}
										>
											{value}
										</button>
									)
								})}
							</div>
						</div>
					))}

					{/* Информация о выбранном SKU */}
					{selectedSku && (
						<div className="bg-gray-50 p-3 rounded-lg">
							<p className="text-sm">
								{currentStock > 0 ? (
									<span className="text-green-600">В наличии: {currentStock} шт.</span>
								) : (
									<span className="text-red-500">Нет в наличии</span>
								)}
							</p>
						</div>
					)}

					{/* Выбор количества */}
					<div className="space-y-2">
						<label className="block text-sm font-medium text-gray-700">Количество</label>
						<QuantitySelector
							value={quantity}
							onChange={setQuantity}
							min={1}
							max={currentStock > 0 ? currentStock : 99}
						/>
					</div>

					<p className="delivery flex items-center gap-2">
						<PackageCheck />
						<span className="inline-block bg-green-100 px-3 py-1 rounded-xl text-green-800 text-sm">Доставим за 25+ дней</span>
					</p>

					<div className="flex flex-col md:flex-row gap-2">
						<Button
							variant={isInCart ? 'secondary' : 'primary'}
							onClick={handleCartClick}
							className={`w-full py-4 text-lg flex items-center justify-center gap-2 ${isInCart ? 'text-amber-600' : ''}`}
						>
							{isInCart ? <CircleCheckBig /> : <ShoppingBag />}
							<span>{isInCart ? 'В корзине' : 'В корзину'}</span>
						</Button>
						<Button
							variant={isFav ? 'secondary' : 'outline'}
							onClick={handleFavoriteClick}
							className="w-full py-4 text-lg flex items-center justify-center gap-2"
						>
							<Heart className={isFav ? 'fill-red-500 text-red-500' : ''} />
							<span>{isFav ? 'В избранном' : 'В избранное'}</span>
						</Button>
					</div>

					{/* Характеристики */}
					{product.specifications && Object.keys(product.specifications).length > 0 && (
						<div className="border-t pt-4">
							<h3 className="font-semibold mb-3">Характеристики</h3>
							<dl className="space-y-2">
								{Object.entries(product.specifications).map(([key, value]) => (
									<div
										key={key}
										className="flex flex-col sm:flex-row sm:justify-between"
									>
										<dt className="text-gray-900 font-semibold">{key}</dt>
										<dd className="font-medium">{String(value)}</dd>
									</div>
								))}
							</dl>
						</div>
					)}

					{/* Описание - только для Poizon
					{product.source === 'poizon' && product.description && (
						<div className="border-t pt-4">
							<h3 className="font-semibold mb-2">Описание</h3>
							<div className="text-gray-600 whitespace-pre-wrap">{product.description}</div>
						</div>
					)} */}

					{/* Отладочная информация */}
					{product._debug && (
						<div className="border-t pt-4 mt-8 bg-gray-50 p-4 rounded-lg">
							<h3 className="font-semibold mb-2 text-sm text-gray-500">Отладочная информация</h3>
							<p className="text-xs text-gray-400">Source: {product._debug.source}</p>
							<pre className="text-xs text-gray-400 overflow-x-auto mt-2">{JSON.stringify(product._debug.rawData, null, 2)}</pre>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
