'use client'

import { Button, QuantitySelector } from '@/components/ui'
import { useFavorites } from '@/hooks'
import { useCartStore } from '@/lib/store'
import { getColorHex, normalizeColor } from '@/lib/utils/color'
import { normalizeImageUrl } from '@/lib/utils/utils'
import { ProductDetail, SkuOption } from '@/types/product'
import { ArrowLeft, Check, Heart, ShoppingBag, Star, X, Plus, Minus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { toast } from 'sonner'

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (ПОЛНОСТЬЮ СОХРАНЕНЫ) ---

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
        xs: 'XS', s: 'S', м: 'M', m: 'M', л: 'L', l: 'L', xl: 'XL', хл: 'XL', xxl: 'XXL', ххл: 'XXL', xxxl: 'XXXL', хххл: 'XXXL',
        '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '10': '10'
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
        await fetch('/api/user/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action, productId, productTitle, productPrice, productImage
            })
        })
    } catch (e) {
        console.error('Failed to add to history:', e)
    }
}

// --- ОСНОВНОЙ КОМПОНЕНТ ---

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
    const [isDrawerOpen, setIsDrawerOpen] = useState(false) // Шторка для выбора SKU
    const hasRecordedView = useRef(false)

    // ЛОГИКА МНОЖЕСТВЕННОГО ВЫБОРА (WHOLESALE)
    const [selectedQuantities, setSelectedQuantities] = useState<Record<string, number>>({})

    const handleUpdateQty = (skuId: string, delta: number, stock: number) => {
        setSelectedQuantities(prev => {
            const current = prev[skuId] || 0
            const next = Math.max(0, Math.min(stock, current + delta))
            return { ...prev, [skuId]: next }
        })
    }

    const totalWholesalePrice = useMemo(() => {
        return Object.entries(selectedQuantities).reduce((sum, [skuId, qty]) => {
            const sku = product.skuOptions?.find(s => s.skuId === skuId)
            return sum + (sku ? sku.price * qty : 0)
        }, 0)
    }, [selectedQuantities, product.skuOptions])

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const passedPrice = params.get('p')
            if (passedPrice) setBasePrice(parseInt(passedPrice, 10))
        }
    }, [])

    useEffect(() => {
        if (productId && product && !hasRecordedView.current) {
            addToHistory('view_product', productId, product.title, basePrice.toString(), product.image)
            hasRecordedView.current = true
        }
    }, [productId, product, basePrice])

    // Обработка опций (Цвета, Размеры)
    const { colors, sizes, colorKey, sizeKey, otherAttributes, colorImages } = useMemo(() => {
        const skuOptions = product.skuOptions || []
        const colorMap = new Map<string, string>()
        const sizeMap = new Map<string, string>()
        const otherAttributesMap = new Map<string, Set<string>>()
        const colorImageMap = new Map<string, string>()
        let foundColorKey = 'Цвет', foundSizeKey = 'Размер'

        skuOptions.forEach(sku => {
            Object.entries(sku.attributes).forEach(([key, val]) => {
                const value = val as string
                const keyLower = key.toLowerCase()
                if (keyLower.includes('color') || keyLower.includes('颜色') || keyLower.includes('цвет')) {
                    const normalized = normalizeColor(value)
                    if (!colorMap.has(normalized)) colorMap.set(normalized, value)
                    foundColorKey = key
                    if (sku.image && !colorImageMap.has(value)) colorImageMap.set(value, sku.image)
                } else if (keyLower.includes('size') || keyLower.includes('尺码') || keyLower.includes('размер')) {
                    const normalized = normalizeSize(value)
                    if (!sizeMap.has(normalized)) sizeMap.set(normalized, value)
                    foundSizeKey = key
                } else {
                    if (!otherAttributesMap.has(key)) otherAttributesMap.set(key, new Set())
                    otherAttributesMap.get(key)!.add(value)
                }
            })
        })
        return {
            colors: Array.from(colorMap.values()), sizes: Array.from(sizeMap.values()),
            colorKey: foundColorKey, sizeKey: foundSizeKey,
            otherAttributes: Array.from(otherAttributesMap.entries()).map(([key, valuesSet]) => ({ key, values: Array.from(valuesSet) })),
            colorImages: Object.fromEntries(colorImageMap)
        }
    }, [product.skuOptions])

    const [selectedColor, setSelectedColor] = useState<string>('')
    const [selectedSize, setSelectedSize] = useState<string>('')
    const [selectedOtherAttributes, setSelectedOtherAttributes] = useState<Record<string, string>>({})
    const [quantity, setQuantity] = useState(1)

    const handleSelectOtherAttribute = (key: string, value: string) => {
        setSelectedOtherAttributes(prev => ({ ...prev, [key]: value }))
    }

    const selectedSku = useMemo(() => {
        if (!product.skuOptions?.length) return null
        return product.skuOptions.find(sku => {
            const attrs = sku.attributes
            const colorMatch = !selectedColor || attrs[colorKey] === selectedColor
            const sizeMatch = !selectedSize || attrs[sizeKey] === selectedSize
            const otherMatch = otherAttributes.every(attr => !selectedOtherAttributes[attr.key] || attrs[attr.key] === selectedOtherAttributes[attr.key])
            return colorMatch && sizeMatch && otherMatch
        }) || null
    }, [product.skuOptions, selectedColor, selectedSize, colorKey, sizeKey, otherAttributes, selectedOtherAttributes])

    const currentPrice = selectedSku?.price || basePrice
    const currentStock = selectedSku?.stock || 0

    useEffect(() => {
        if (selectedImage !== 0) { requestAnimationFrame(() => setSelectedImage(0)) }
        setVideoError(false)
    }, [selectedSku])

    const mediaItems = useMemo(() => {
        const baseImages = product.images || []
        const descImages: string[] = []
        if (product.descriptionHtml) {
            const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
            const matches = [...product.descriptionHtml.matchAll(imgRegex)]
            descImages.push(...matches.map(m => m[1]).filter(Boolean))
        }
        const combinedImages = [...baseImages]
        descImages.forEach(img => { if (!combinedImages.includes(img)) combinedImages.push(img) })
        const skuImage = selectedSku?.image
        if (skuImage && !combinedImages.includes(skuImage)) combinedImages.unshift(skuImage)
        const normalizedImages = combinedImages.map(getValidImage).filter(Boolean)
        const items: MediaItem[] = []
        if (product.videos && product.videos.length > 0) {
            const videoUrl = getValidVideo(product.videos[0])
            if (videoUrl) items.push({ type: 'video', url: videoUrl, poster: getValidImage(skuImage || product.image || normalizedImages[0]) })
        }
        normalizedImages.forEach(url => { items.push({ type: 'image', url }) })
        return items
    }, [product.images, product.descriptionHtml, selectedSku, product.videos, product.image])

    const activeMedia = mediaItems[selectedImage]
    const videoPoster = activeMedia && activeMedia.type === 'video' ? activeMedia.poster : getValidImage(selectedSku?.image || product.image)

    // Логика корзины
    const { addItem, removeItem, items } = useCartStore()
    const isInCart = items.some(item => item.productId === productId)

    const handleCartClick = () => {
        if (isInCart) {
            router.push('/cart')
        } else {
            addItem({
                productId, title: product.title, price: currentPrice.toString(), imageUrl: selectedSku?.image || product.image,
                source: product.source, color: selectedColor || undefined, size: selectedSize || undefined,
                skuId: selectedSku?.skuId, quantity
            })
            toast.success('Товар добавлен в корзину')
        }
    }

    const handleWholesaleSubmit = () => {
        const selectedEntries = Object.entries(selectedQuantities).filter(([_, qty]) => qty > 0)
        if (selectedEntries.length === 0) {
            toast.error('Выберите количество товара')
            return
        }
        selectedEntries.forEach(([skuId, qty]) => {
            const sku = product.skuOptions?.find(s => s.skuId === skuId)
            if (sku) {
                addItem({
                    productId, title: product.title, price: sku.price.toString(), imageUrl: sku.image || product.image,
                    source: product.source, skuId: sku.skuId, quantity: qty,
                    color: sku.attributes[colorKey], size: sku.attributes[sizeKey]
                })
            }
        })
        setIsDrawerOpen(false)
        router.push('/cart') // Сразу к оплате
    }

    const onMainActionClick = () => {
        if (isMobile && !isInCart) setIsDrawerOpen(true)
        else handleCartClick()
    }

    // Логика избранного
    const { isFavorite, addFavorite, removeFavorite } = useFavorites()
    const isFav = isFavorite(productId)

    const handleFavoriteClick = () => {
        if (isFav) {
            removeFavorite(productId)
        } else {
            addFavorite({
                productId, title: product.title, price: currentPrice.toString(),
                imageUrl: selectedSku?.image || product.image, source: product.source
            })
        }
    }

    const sourceColors = { taobao: 'bg-orange-500', '1688': 'bg-[#0f6b46]', poizon: 'bg-black' }

    return (
        <div className="container mx-auto px-4 py-8 pb-32 md:pb-8">
            <Link href="/" className="mb-4 flex items-center gap-2 text-[#0f6b46] hover:underline font-medium">
                <ArrowLeft size={20} />
                <span>Назад к поиску</span>
            </Link>

            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                {/* ГАЛЕРЕЯ */}
                <div className="space-y-4">
                    <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-black border border-gray-100 shadow-sm">
                        {activeMedia ? (
                            activeMedia.type === 'video' ? (
                                <video key={activeMedia.url} controls playsInline poster={videoPoster} className="h-full w-full object-contain" onError={() => setVideoError(true)}>
                                    <source src={activeMedia.url} type="video/mp4" />
                                </video>
                            ) : (
                                <Image src={getValidImage(activeMedia.url)} alt={product.title} fill className="object-contain bg-white" sizes="(max-width: 768px) 100vw, 50vw" priority unoptimized />
                            )
                        ) : (
                            <Image src={getValidImage(product.image)} alt={product.title} fill className="object-contain bg-white" priority />
                        )}
                        {product.source && (
                            <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold text-white uppercase ${sourceColors[product.source] || 'bg-gray-500'}`}>
                                {product.source}
                            </span>
                        )}
                    </div>
                    {mediaItems.length > 1 && (
                        <div className="scrollbar-none flex gap-2 overflow-x-auto pb-2">
                            {mediaItems.map((item, idx) => (
                                <button key={idx} onClick={() => { setSelectedImage(idx); setVideoError(false); }} className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${idx === selectedImage ? 'border-[#0f6b46]' : 'border-transparent bg-gray-50'}`}>
                                    <Image src={getValidImage(item.type === 'video' ? item.poster : item.url)} alt="thumb" fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* КОНТЕНТНАЯ ЧАСТЬ */}
                <div className="space-y-6">
                    <h1 className="text-xl font-bold leading-tight text-gray-900 md:text-3xl">{product.title}</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-4xl font-black text-[#0f6b46]">{currentPrice.toLocaleString()} ₽</span>
                        {product.sales !== undefined && <span className="text-sm text-gray-400">Продано: {product.sales.toLocaleString()}+</span>}
                    </div>

                    {product.sellerRating && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-lg inline-flex">
                            <span>Рейтинг продавца:</span>
                            <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /><span className="font-bold text-gray-900">{product.sellerRating.overall.toFixed(1)}</span></div>
                        </div>
                    )}

                    {!isMobile && (
                        <div className="space-y-6 border-y border-gray-100 py-6">
                            {colors.length > 0 && (
                                <div className="space-y-3">
                                    <label className="block text-sm font-bold uppercase text-gray-900">{colorKey}</label>
                                    <div className="flex flex-wrap gap-3">
                                        {colors.map(color => (
                                            <button key={color} onClick={() => setSelectedColor(color)} className={`relative h-14 w-14 overflow-hidden rounded-xl border-2 transition-all ${selectedColor === color ? 'border-[#0f6b46] ring-4 ring-green-50' : 'border-gray-100'}`}>
                                                <Image src={getValidImage(colorImages[color] || product.image)} alt={color} fill className="object-cover" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <QuantitySelector value={quantity} onChange={setQuantity} min={1} max={currentStock || 99} />
                        </div>
                    )}

                    {/* ТАБЛИЦА ХАРАКТЕРИСТИК (ПОЛНАЯ) */}
                    {product.specifications && Object.keys(product.specifications).length > 0 && (
                        <div className="mt-8">
                            <h3 className="mb-4 text-lg font-bold text-gray-900 uppercase">Характеристики товара</h3>
                            <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm text-sm">
                                <table className="w-full text-left">
                                    <tbody>
                                        {Object.entries(product.specifications).map(([key, value], index) => (
                                            <tr key={key} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                                                <td className="w-1/3 border-r p-3 font-bold text-gray-500 uppercase text-[10px] tracking-widest">{key}</td>
                                                <td className="p-3 text-gray-900 font-medium">{String(value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- ШТОРКА (BOTTOM SHEET) ДЛЯ МОБИЛЬНЫХ --- */}
            {isDrawerOpen && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end justify-center transition-all" onClick={() => setIsDrawerOpen(false)}>
                    <div className="w-full max-w-2xl bg-white rounded-t-[32px] overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
                            <h2 className="font-bold text-gray-800 line-clamp-1 text-sm">{product.title}</h2>
                            <button onClick={() => setIsDrawerOpen(false)} className="p-1 hover:bg-gray-100 rounded-full"><X size={24}/></button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-none">
                            {product.skuOptions?.map((sku) => (
                                <div key={sku.skuId} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-none">
                                    <div className="w-16 h-16 relative rounded-lg overflow-hidden bg-gray-100 border flex-shrink-0">
                                        <Image src={getValidImage(sku.image || product.image)} alt="sku" fill className="object-cover" unoptimized />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-bold mb-1">{sku.attributes[sizeKey] || 'Стандарт'} {sku.attributes[colorKey] && `/ ${sku.attributes[colorKey]}`}</p>
                                        <p className="text-sm font-black text-[#0f6b46]">RUB {sku.price.toLocaleString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200 h-9">
                                            <button onClick={() => handleUpdateQty(sku.skuId, -1, sku.stock)} className={`px-3 h-full ${selectedQuantities[sku.skuId] > 0 ? 'bg-white text-[#0f6b46]' : 'text-gray-300'}`}><Minus size={16} /></button>
                                            <div className="w-10 text-center bg-white border-x text-sm font-black flex items-center justify-center h-full">{selectedQuantities[sku.skuId] || 0}</div>
                                            <button onClick={() => handleUpdateQty(sku.skuId, 1, sku.stock)} className="px-3 h-full bg-[#0f6b46] text-white"><Plus size={16} /></button>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Запас {sku.stock}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 border-t bg-white flex items-center justify-between gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
                            <div className="space-y-1">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Общая цена</p>
                                <p className="text-xl font-black text-[#0f6b46]">RUB {totalWholesalePrice.toLocaleString()}</p>
                            </div>
                            <Button className="flex-1 bg-[#0f6b46] text-white py-6 rounded-2xl font-black text-lg border-none active:scale-95 transition-all shadow-lg" onClick={handleWholesaleSubmit}>ОТПРАВИТЬ</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- ПРИЛИПАЮЩИЕ КНОПКИ (FIXED) --- */}
            <div className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-100 bg-white/95 backdrop-blur-md p-4 flex gap-4 md:relative md:mt-10 md:bg-transparent md:border-none md:p-0">
                <div className="mx-auto flex w-full max-w-7xl gap-4">
                    <Button 
                        onClick={onMainActionClick}
                        className={`flex-[3] rounded-2xl py-4 text-lg font-black transition-all active:scale-95 flex items-center justify-center gap-3 border-none ${
                            isInCart ? 'bg-gray-100 text-gray-400' : 'bg-[#0f6b46] text-white shadow-lg shadow-green-900/20'
                        }`}
                    >
                        <ShoppingBag size={24} />
                        <span>{isInCart ? 'В КОРЗИНЕ' : 'КУПИТЬ СЕЙЧАС'}</span>
                    </Button>
                    <Button onClick={handleFavoriteClick} className={`flex-1 rounded-2xl border-2 py-4 flex items-center justify-center transition-all ${isFav ? 'border-red-500 bg-red-50 text-red-500' : 'border-[#0f6b46] bg-white text-[#0f6b46]'}`}>
                        <Heart size={24} className={isFav ? 'fill-red-500' : ''} />
                        {!isMobile && <span className="ml-2 font-bold uppercase tracking-tight">{isFav ? 'В ИЗБРАННОМ' : 'В ИЗБРАННОЕ'}</span>}
                    </Button>
                </div>
            </div>
        </div>
    )
}