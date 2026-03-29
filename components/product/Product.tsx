'use client'

import { SourceBadge } from '@/components/ui'
import { useCart, useFavorites } from '@/hooks'
import { ProductItem } from '@/types/product'
import { Heart, ShoppingCart } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface ProductProps extends Omit<ProductItem, 'sales' | 'rating'> {
    sales?: string | number;
    rating?: string | number;
}

export default function Product({ productId, title, price, imageUrl, source, sales, rating }: ProductProps) {
    const { addItem, removeItem, isInCart } = useCart()
    const { addFavorite, removeFavorite, isFavorite } = useFavorites()

    const favorite = isFavorite(productId)
    const inCart = isInCart(productId)

    const initialPrice = parseFloat(String(price).replace(/[^\d.-]/g, '')) || 0;
    const [displayPrice, setDisplayPrice] = useState(initialPrice === 0 ? 150 : initialPrice);

    useEffect(() => {
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
        else addFavorite({ productId, title: displayPrice.toString(), price: displayPrice.toString(), imageUrl, source: source || '1688' })
    }

    const displaySales = sales || Math.floor(Math.random() * 800) + 50; 
    const displayRating = rating || (Math.random() * (5 - 4) + 4).toFixed(1);

    return (
        <div className="group bg-white rounded-xl border border-gray-100 hover:shadow-xl hover:border-green-100 transition-all duration-300 flex flex-col h-full overflow-hidden">
            <div className="relative aspect-square bg-gray-50 flex-shrink-0" suppressHydrationWarning>
                <Link href={`/product/${productId}`} className="block w-full h-full">
                    {imageUrl ? (
                        <Image src={imageUrl} alt={title || 'Товар'} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 25vw" loading="lazy" />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">Нет фото</div>
                    )}
                </Link>
                {source && <div className="absolute top-0 left-0"><SourceBadge source={source} /></div>}
                <button onClick={handleToggleFavorite} className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm hover:shadow transition-all z-10">
                    <Heart size={16} className={favorite ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500 transition-colors'} />
                </button>
            </div>

            <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <Link href={`/product/${productId}`} className="flex flex-col gap-1.5 flex-1">
                    <h3 className="text-xs sm:text-sm text-gray-800 font-medium line-clamp-2 leading-tight group-hover:text-[#0f6b46] transition-colors" title={title}>
                        {title || 'Без названия'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-400 mt-auto">
                        <span className="flex items-center gap-0.5 font-medium text-amber-500">★ {displayRating}</span>
                        <span>•</span>
                        <span>{displaySales}+ купили</span>
                    </div>
                </Link>

                <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                    <span className="text-sm sm:text-lg font-bold text-[#0f6b46] transition-all duration-500">
                        {displayPrice.toLocaleString('ru-RU')} ₽
                    </span>
                    <button 
                        onClick={handleCartClick} 
                        className={`w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center transition-all ${
                            inCart 
                            ? 'bg-green-50 text-[#0f6b46] border border-green-100' 
                            : 'bg-[#0f6b46] text-white hover:bg-[#0a4e32] shadow-sm active:scale-90'
                        }`}
                    >
                        <ShoppingCart size={16} className={inCart ? 'fill-current' : ''} />
                    </button>
                </div>
            </div>
        </div>
    )
}