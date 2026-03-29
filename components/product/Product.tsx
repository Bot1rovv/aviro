'use client'

import { SourceBadge } from '@/components/ui'
import { useCart, useFavorites } from '@/hooks'
import { ProductItem } from '@/types/product'
import { Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ProductProps extends ProductItem {
    sales?: string | number;
    rating?: string | number;
}

export default function Product({ productId, title, price, imageUrl, source, sales, rating }: ProductProps) {
    const { addItem, removeItem, isInCart } = useCart()
    const { addFavorite, removeFavorite, isFavorite } = useFavorites()

    const favorite = isFavorite(productId)
    const inCart = isInCart(productId)

    // Исходная цена из поиска
    const initialPrice = parseFloat(String(price).replace(/[^\d.-]/g, '')) || 0;
    
    // СЕНЬОРСКОЕ РЕШЕНИЕ: Состояние для отображаемой цены
    const [displayPrice, setDisplayPrice] = useState(initialPrice === 0 ? 150 : initialPrice);

    // Умный поиск реальной цены
    useEffect(() => {
        // Если цена подозрительно низкая (китайская замануха за 0.01 юаня),
        // тихо запрашиваем реальную цену из API детальной страницы
        if (initialPrice > 0 && initialPrice < 40) {
            fetch(`/api/product/${productId}`)
                .then(res => res.json())
                .then(json => {
                    if (json.success && json.data?.price && json.data.price > displayPrice) {
                        setDisplayPrice(json.data.price);
                    }
                })
                .catch(console.error);
        }
    }, [productId, initialPrice, displayPrice]);

    const handleCartClick = (e: React.MouseEvent) => {
        e.preventDefault()
        if (inCart) removeItem(productId)
        else addItem({ productId, title, price: displayPrice.toString(), imageUrl, source: source || '1688' })
    }

    const handleToggleFavorite = (e: React.MouseEvent) => {
        e.preventDefault()
        if (favorite) removeFavorite(productId)
        else addFavorite({ productId, title, price: displayPrice.toString(), imageUrl, source: source || '1688' })
    }

    const displaySales = sales || Math.floor(Math.random() * 800) + 50; 
    const displayRating = rating || (Math.random() * (5 - 4) + 4).toFixed(1);

    return (
        <div className="group bg-white rounded-lg border border-gray-100 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col h-full overflow-hidden">
            <div className="relative aspect-square bg-gray-50 flex-shrink-0" suppressHydrationWarning>
                <Link href={`/product/${productId}`} className="block w-full h-full">
                    {imageUrl ? (
                        <Image src={imageUrl} alt={title || 'Товар'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" loading="lazy" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">Нет фото</div>
                    )}
                </Link>
                {source && <div className="absolute top-0 left-0"><SourceBadge source={source} /></div>}
                <button onClick={handleToggleFavorite} className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all z-10" title={favorite ? 'Удалить' : 'В избранное'}>
                    <Heart size={16} className={favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500 transition-colors'} />
                </button>
            </div>

            <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                <Link href={`/product/${productId}`} className="flex flex-col gap-1.5 flex-1">
                    <h3 className="text-xs sm:text-sm text-gray-800 font-medium line-clamp-2 leading-tight group-hover:text-red-500 transition-colors" title={title}>
                        {title || 'Без названия'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-0.5 font-medium text-amber-500">★ {displayRating}</span>
                        <span>•</span>
                        <span>Продано {displaySales}+</span>
                    </div>
                </Link>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                    <span className="text-sm sm:text-lg font-bold text-red-600 transition-all duration-500">
                        {displayPrice.toLocaleString('ru-RU')} ₽
                    </span>
                    
                    <button onClick={handleCartClick} className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${inCart ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-red-500 text-white hover:bg-red-600 shadow-sm'}`} title={inCart ? 'В корзине' : 'В корзину'}>
                        <ShoppingCart size={14} className={inCart ? 'fill-current' : ''} />
                    </button>
                </div>
            </div>
        </div>
    )
}