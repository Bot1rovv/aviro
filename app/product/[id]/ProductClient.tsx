'use client'

import { Button, QuantitySelector } from '@/components/ui'
import { useFavorites } from '@/hooks'
import { useCartStore } from '@/lib/store'
import { getColorHex, normalizeColor } from '@/lib/utils/color'
import { normalizeImageUrl } from '@/lib/utils/utils'
import { ProductDetail } from '@/types/product'
import { ArrowLeft, Check, Heart, ShoppingBag, Star, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

function useMediaQuery(query: string): boolean {
    const subscribe = useCallback(
        (callback: () => void) => {
            if (typeof window === 'undefined') return () => {}
            const media = window.matchMedia(query)
            media.addEventListener('change', callback)
            return () => media.removeEventListener('change', callback)
        },
        [query]
    )

    return useSyncExternalStore(subscribe, () => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false), () => false)
}

function getValidImage(img: string | undefined | null): string {
    if (img && img.trim() !== '') {
        return normalizeImageUrl(img.trim())
    }
    return '/no-image.jpg'
}

function getValidVideo(url: string | undefined | null): string {
    if (!url) return ''
    const trimmed = url.trim()
    if (!trimmed) return ''
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return trimmed
}

type MediaItem =
    | {
            type: 'image'
            url: string
      }
    | {
            type: 'video'
            url: string
            poster: string
      }

function extractNumericSize(size: string): string {
    const match = size.match(/\d+/)
    if (match) return match[0]

    const firstLine = size.split('\n')[0].trim()
    return firstLine.length > 10 ? `${firstLine.substring(0, 10)}...` : firstLine
}

function normalizeSize(size: string): string {
    if (!size) return ''

    let cleaned = size.trim()
    cleaned = cleaned.replace(/[()【】\[\]]/g, ' ').trim()
    cleaned = cleaned.replace(/\s*(EU|US|UK|EUR|CM|см)\b/gi, '').trim()
    cleaned = cleaned.replace(/^(размер|код|г|g|см|sm)\s*/gi, '').trim()
    cleaned = cleaned.replace(/\s*(размер|код|г|g|см|sm)$/gi, '').trim()
    cleaned = cleaned.replace(/,/g, '.')

    const parts = cleaned.split(/[,\-\s]+/)
    let significantPart = ''

    for (const part of parts) {
        if (!part) continue
        if (/^(размер|код|г|g|см|sm)$/i.test(part)) continue
        significantPart = part
        break
    }

    if (!significantPart) return ''

    const lower = significantPart.toLowerCase()

    const sizeMap: Record<string, string> = {
        xs: 'XS', s: 'S', м: 'M', m: 'M', л: 'L', l: 'L', xl: 'XL', хл: 'XL', xxl: 'XXL', ххл: 'XXL', xxxl: 'XXXL', хххл: 'XXXL', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
    }

    if (sizeMap[lower]) return sizeMap[lower]

    const numericMatch = significantPart.match(/^\d*\.?\d+/)
    if (numericMatch) {
        return numericMatch[0].includes('.') ? parseFloat(numericMatch[0]).toString() : numericMatch[0]
    }

    const letterMatch = significantPart.match(/^(xs|s|m|l|xl|xxl|xxxl)/i)
    if (letterMatch) return letterMatch[0].toUpperCase()

    return significantPart.toUpperCase()
}

async function addToHistory(action: string, productId?: string, productTitle?: string, productPrice?: string, productImage?: string) {
    try {
        const res = await fetch('/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, productId, productTitle, productPrice, productImage })
        })
        if (res.status === 401) return
    } catch (e) {
        // console.error('Failed to add to history:', e)
    }
}

interface ProductClientProps {
    product: ProductDetail
    productId: string
}

export function ProductClient({ product, productId }: ProductClientProps) {
    const router = useRouter()
    const isMobile = useMediaQuery('(max-width: 767px)')
    const [selectedImage, setSelectedImage] = useState(0)
    const [basePrice, setBasePrice] = useState(product.price)
    const [videoError, setVideoError] = useState(false)
    const hasRecordedView = useRef(false)

    // --- ДОБАВЛЕНО: Стейт для шторки ---
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const passedPrice = params.get('p')
            if (passedPrice) {
                setBasePrice(parseInt(passedPrice, 10))
            }
        }
    }, [])

    useEffect(() => {
        if (productId && product && !hasRecordedView.current) {
            addToHistory('view_product', productId, product.title, basePrice.toString(), product.image)
            hasRecordedView.current = true
        }
    }, [productId, product, basePrice])

    const { colors, sizes, colorKey, sizeKey, otherAttributes, colorImages } = useMemo(() => {
        const skuOptions = product.skuOptions || []
        const colorMap = new Map<string, string>()
        const sizeMap = new Map<string, string>()
        const otherAttributesMap = new Map<string, Set<string>>()
        const colorImageMap = new Map<string, string>()
        let foundColorKey = 'Цвет'
        let foundSizeKey = 'Размер'

        skuOptions.forEach(sku => {
            Object.entries(sku.attributes).forEach(([key, val]) => {
                const value = val as string
                const keyLower = key.toLowerCase()

                if (keyLower.includes('color') || keyLower.includes('颜色') || keyLower.includes('цвет')) {
                    const normalized = normalizeColor(value)
                    if (!colorMap.has(normalized)) colorMap.set(normalized, value)
                    foundColorKey = key
                    if (sku.image && !colorImageMap.has(value)) colorImageMap.set(value, sku.image)
                } else if (keyLower.includes('size') || keyLower.includes('尺码') || keyLower.includes('размер') || keyLower.includes('память')) {
                    const normalized = normalizeSize(value)
                    if (!sizeMap.has(normalized)) sizeMap.set(normalized, value)
                    foundSizeKey = key
                } else {
                    if (!otherAttributesMap.has(key)) otherAttributesMap.set(key, new Set())
                    otherAttributesMap.get(key)!.add(value)
                }
            })
        })

        const otherAttributes = Array.from(otherAttributesMap.entries()).map(([key, valuesSet]) => ({
            key,
            values: Array.from(valuesSet)
        }))

        return {
            colors: Array.from(colorMap.values()),
            sizes: Array.from(sizeMap.values()),
            colorKey: foundColorKey,
            sizeKey: foundSizeKey,
            otherAttributes,
            colorImages: Object.fromEntries(colorImageMap)
        }
    }, [product.skuOptions])

    const [selectedColor, setSelectedColor] = useState<string>('')
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [selectedOtherAttributes, setSelectedOtherAttributes] = useState<Record<string, string>>({})
    const [quantity, setQuantity] = useState(1)

    const handleSelectOtherAttribute = (key: string, value: string) => {
        setSelectedOtherAttributes(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const selectedSku = useMemo(() => {
        if (!product.skuOptions?.length) return null

        return (
            product.skuOptions.find(sku => {
                const attrs = sku.attributes

                const colorMatch = !selectedColor || attrs[colorKey] === selectedColor
                const sizeMatch = !selectedSize || attrs[sizeKey] === selectedSize
                const otherMatch = otherAttributes.every(
                    attr => !selectedOtherAttributes[attr.key] || attrs[attr.key] === selectedOtherAttributes[attr.key]
                )

                return colorMatch && sizeMatch && otherMatch
            }) || null
        )
    }, [product.skuOptions, selectedColor, selectedSize, colorKey, sizeKey, otherAttributes, selectedOtherAttributes])

    const currentPrice = selectedSku?.price || basePrice
    const currentStock = selectedSku?.stock || 0

    const getColorPreviewImage = useCallback((color: string) => {
        const img = colorImages[color] || product.image
        return getValidImage(img)
    }, [colorImages, product.image])

    useEffect(() => {
        if (selectedImage !== 0) {
            requestAnimationFrame(() => setSelectedImage(0))
        }
        setVideoError(false)
    }, [selectedSku])

    // --- ТВОЯ РАБОЧАЯ ЛОГИКА ОБЛОЖКИ ---
    const mediaItems = useMemo(() => {
        const baseImages = product.images || []
        const descImages: string[] = []

        if (product.descriptionHtml) {
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
            const matches = [...product.descriptionHtml.matchAll(imgRegex)]
            descImages.push(...matches.map(m => m[1]).filter(Boolean))
        }

        const combinedImages = [...baseImages]

        descImages.forEach(img => {
            if (!combinedImages.includes(img)) combinedImages.push(img)
        })

        const skuImage = selectedSku?.image
        if (skuImage && !combinedImages.includes(skuImage)) {
            combinedImages.unshift(skuImage)
        }

        const normalizedImages = combinedImages.map(getValidImage).filter(Boolean)
        const fallbackPoster = getValidImage(skuImage || product.image || normalizedImages[0] || '/no-image.jpg')

        const items: MediaItem[] = []

        if (product.videos && product.videos.length > 0) {
            const videoUrl = getValidVideo(product.videos[0])
            if (videoUrl) {
                items.push({
                    type: 'video',
                    url: videoUrl,
                    poster: fallbackPoster
                })
            }
        }

        normalizedImages.forEach(url => {
            items.push({
                type: 'image',
                url
            })
        })

        return items
    }, [product.images, product.descriptionHtml, selectedSku, product.videos, product.image])

    const activeMedia = mediaItems[selectedImage]
    const videoPoster =
        activeMedia && activeMedia.type === 'video' ? activeMedia.poster : getValidImage(selectedSku?.image || product.image)

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
            if (!selectedSku && product.skuOptions?.length) {
                toast.error('Пожалуйста, выберите параметры товара')
                if (isMobile) setIsDrawerOpen(true)
                return
            }
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

    // Обработка кнопки "Оплатить" в шторке
    const handleDrawerSubmit = () => {
        if (product.skuOptions?.length && !selectedSku) {
            toast.error('Пожалуйста, выберите все характеристики')
            return
        }
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
        setIsDrawerOpen(false)
        router.push('/cart')
    }

    const onMainActionClick = () => {
        if (isMobile) setIsDrawerOpen(true)
        else {
            if (isInCart) router.push('/cart')
            else handleCartClick()
        }
    }

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

    const sourceColors = { taobao: 'bg-orange-500', '1688': 'bg-[#0f6b46]', poizon: 'bg-black' }

    // Компонент селекторов для использования в десктопе и шторке
    const SelectorsContent = () => (
        <>
            {colors.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-bold uppercase text-gray-900">{colorKey} {selectedColor && <span className="ml-2 font-normal text-gray-500">({selectedColor})</span>}</label>
                    <div className="flex flex-wrap gap-3">
                        {colors.map(color => {
                            const isSelected = selectedColor === color
                            const imgPath = colorImages[color] || product.skuOptions?.find(s => s.attributes[colorKey] === color)?.image
                            return (
                                <button key={color} onClick={() => setSelectedColor(color)} className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 transition-all ${isSelected ? 'border-[#0f6b46] ring-2 ring-green-100' : 'border-gray-200 hover:border-gray-400'}`}>
                                    {imgPath ? (
                                        <Image src={getValidImage(imgPath)} alt={color} fill className="object-cover" unoptimized />
                                    ) : (
                                        <div className="h-full w-full" style={{ backgroundColor: getColorHex(color) }} />
                                    )}
                                    {isSelected && <div className="absolute inset-0 flex items-center justify-center bg-black/20"><Check className="h-5 w-5 stroke-[3] text-white" /></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {sizes.length > 0 && (
                <div className="space-y-3">
                    <label className="block text-sm font-bold uppercase text-gray-900">{sizeKey}</label>
                    <div className="flex flex-wrap gap-2">
                        {sizes.map(size => (
                            <button key={size} onClick={() => setSelectedSize(size)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${selectedSize === size ? 'border-[#0f6b46] bg-green-50 text-[#0f6b46]' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                                {extractNumericSize(size)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {otherAttributes.map(attr => (
                <div key={attr.key} className="space-y-3">
                    <label className="block text-sm font-bold uppercase text-gray-900">{attr.key}</label>
                    <div className="flex flex-wrap gap-2">
                        {attr.values.map(value => (
                            <button key={value} onClick={() => handleSelectOtherAttribute(attr.key, value)} className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${selectedOtherAttributes[attr.key] === value ? 'border-[#0f6b46] bg-green-50 text-[#0f6b46]' : 'border-gray-200 text-gray-700 hover:border-gray-400'}`}>
                                {value}
                            </button>
                        ))}
                    </div>
                </div>
            ))}

            <div className="space-y-3 pb-4">
                <label className="block text-sm font-bold uppercase text-gray-900">Количество</label>
                <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={currentStock > 0 ? currentStock : 99} />
            </div>
        </>
    )

    return (
        <div className="container mx-auto px-4 py-8 pb-32 md:pb-8 text-gray-900">
            <Link href="/" className="mb-4 flex items-center gap-2 font-medium text-[#0f6b46] hover:underline">
                <ArrowLeft size={20} /><span>На главную</span>
            </Link>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div className="space-y-4">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-black">
                        {activeMedia?.type === 'video' ? (
                            videoError ? <Image src={videoPoster} alt="v" fill className="object-contain bg-gray-100" sizes="(max-width: 768px) 100vw, 50vw" priority /> :
                            <video key={activeMedia.url} controls playsInline preload="none" poster={videoPoster} className="h-full w-full object-contain" onError={() => setVideoError(true)}>
                                <source src={activeMedia.url} type="video/mp4" />
                                Ваш браузер не поддерживает видео.
                            </video>
                        ) : (
                            <Image src={getValidImage(activeMedia?.url || product.image)} alt="p" fill className="object-cover bg-gray-100" sizes="(max-width: 768px) 100vw, 50vw" priority />
                        )}

                        {product.source && (
                            <span className={`absolute right-4 top-4 rounded px-3 py-1 text-sm font-bold text-white ${sourceColors[product.source] || 'bg-gray-500'}`}>
                                {product.source.toUpperCase()}
                            </span>
                        )}
                    </div>
                    {mediaItems.length > 1 && (
                        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
                            {mediaItems.map((item, idx) => (
                                <button key={`${item.type}-${idx}`} onClick={() => { setSelectedImage(idx); setVideoError(false); }} className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md transition-all border-2 ${idx === selectedImage ? 'border-[#0f6b46]' : 'border-transparent bg-gray-50'}`}>
                                    {item.type === 'video' ? (
                                        <div className="relative flex h-full w-full items-center justify-center bg-gray-900">
                                            <Image src={item.poster} alt="Превью видео" fill className="object-cover opacity-70" sizes="80px" loading="lazy" />
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="rounded-full bg-black/60 p-2">
                                                    <svg className="ml-0.5 h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <Image src={getValidImage(item.url)} alt={`${product.title} ${idx + 1}`} fill className="object-cover" sizes="80px" loading="lazy" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h1 className="text-lg font-bold leading-tight text-gray-900 md:text-2xl">{product.title}</h1>

                    {product.sales !== undefined && <p className="text-sm text-gray-500" suppressHydrationWarning>Продано: {product.sales.toLocaleString('ru-RU')}</p>}

                    <div className="flex items-baseline gap-4">
                        <span className="text-4xl font-bold text-[#0f6b46]" suppressHydrationWarning>{currentPrice.toLocaleString('ru-RU')} ₽</span>
                        {product.originalPrice && product.originalPrice > basePrice && (
                            <span className="text-xl text-gray-400 line-through" suppressHydrationWarning>{product.originalPrice.toLocaleString('ru-RU')} ₽</span>
                        )}
                    </div>

                    {product.sellerRating && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <span>Рейтинг продавца:</span>
                            <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="font-medium text-gray-900">{product.sellerRating.overall.toFixed(1)}</span>
                            </div>
                        </div>
                    )}

                    {!isMobile && (
                        <div className="space-y-6 border-y border-gray-100 py-6">
                            <SelectorsContent />
                        </div>
                    )}

                    <p className="flex items-center gap-2">
                        <span className="inline-block rounded-md border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700">
                            📦 Доставим за 25+ дней
                        </span>
                    </p>

                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-bold text-gray-900">Характеристики товара</h3>
                            <div className="overflow-hidden rounded-lg border border-gray-200">
                                <table className="w-full text-left text-sm">
                                    <tbody>
                                        {Object.entries(product.specifications).map(([key, value], index) => (
                                            <tr key={key} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                                                <td className="w-1/3 border-r border-gray-200 px-4 py-3 align-top font-medium text-gray-500">{key}</td>
                                                <td className="px-4 py-3 align-top text-gray-900">{String(value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- B2C ШТОРКА --- */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}>
                    <div className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-[24px] bg-white animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start gap-4 border-b border-gray-100 p-4">
                            <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                                <Image src={getValidImage(selectedSku?.image || product.image)} alt="preview" fill className="object-cover" unoptimized />
                            </div>
                            <div className="flex-1 pt-1">
                                <p className="text-2xl font-black text-[#0f6b46]" suppressHydrationWarning>{currentPrice.toLocaleString('ru-RU')} ₽</p>
                                <p className="mt-1 text-sm text-gray-500">Остаток: {currentStock || 'Много'}</p>
                                <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
                                    Выбрано: {[selectedColor, selectedSize, ...Object.values(selectedOtherAttributes)].filter(Boolean).join(', ') || 'Ничего не выбрано'}
                                </p>
                            </div>
                            <button onClick={() => setIsDrawerOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="scrollbar-none flex-1 overflow-y-auto p-4">
                            <SelectorsContent />
                        </div>

                        <div className="border-t border-gray-100 bg-white p-4 pb-8 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                            <Button className="w-full rounded-xl bg-[#0f6b46] py-6 text-lg font-bold text-white shadow-lg active:scale-95 transition-all hover:bg-[#0a4e32]" onClick={handleDrawerSubmit}>
                                {isInCart ? 'Перейти к оформлению' : 'Оплатить'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ПАНЕЛЬ КНОПОК ИСПРАВЛЕНА: ДОБАВЛЕНО isDrawerOpen ? 'hidden md:block' : 'block' --- */}
            <div 
                className={`fixed left-0 z-[9999] w-full border-t border-gray-200 bg-white p-3 shadow-[0_-10px_20px_-5px_rgba(0,0,0,0.1)] md:relative md:bottom-auto md:left-auto md:z-auto md:mt-8 md:border-none md:bg-transparent md:p-0 md:shadow-none ${isDrawerOpen ? 'hidden md:block' : 'block'}`}
                style={{ bottom: isMobile ? '65px' : 'auto' }}
            >
                <div className="mx-auto flex max-w-7xl flex-row gap-3">
                    <Button
                        variant={isInCart ? 'secondary' : 'primary'}
                        onClick={onMainActionClick}
                        className={`flex-1 rounded-xl py-4 text-sm transition-all md:text-lg ${
                            isInCart ? 'bg-gray-100 text-gray-700' : 'bg-[#0f6b46] text-white hover:bg-[#0a4e32]'
                        }`}
                    >
                        <div className="flex items-center justify-center gap-2">
                            <ShoppingBag size={20} />
                            <span className="font-bold">{isInCart && !isMobile ? 'В корзине' : 'Купить сейчас'}</span>
                        </div>
                    </Button>

                    <Button
                        variant={isFav ? 'secondary' : 'outline'}
                        onClick={handleFavoriteClick}
                        className="w-[64px] rounded-xl border-[#0f6b46] bg-white py-4 text-[#0f6b46] hover:bg-green-50 md:w-auto md:flex-1"
                    >
                        <div className="flex items-center justify-center gap-2">
                            <Heart size={20} className={isFav ? 'fill-red-500 text-red-500' : ''} />
                            {!isMobile && <span className="font-bold">{isFav ? 'В избранном' : 'В избранное'}</span>}
                        </div>
                    </Button>
                </div>
            </div>
        </div>
    )
}