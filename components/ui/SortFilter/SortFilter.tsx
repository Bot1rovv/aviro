'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type SortOption =
    | 'price_asc'
    | 'price_desc'
    | 'default'

interface SortFilterProps {
    className?: string
}

export default function SortFilter({ className = '' }: SortFilterProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [sort, setSort] = useState<SortOption>('default')
    const [minPrice, setMinPrice] = useState<string>('')
    const [maxPrice, setMaxPrice] = useState<string>('')

    useEffect(() => {
        const sortParam = searchParams.get('sort') as SortOption | null
        if (sortParam && ['price_asc', 'price_desc', 'default'].includes(sortParam)) {
            setTimeout(() => setSort(sortParam), 0)
        }
        const min = searchParams.get('minPrice')
        const max = searchParams.get('maxPrice')
        if (min) setTimeout(() => setMinPrice(min), 0)
        if (max) setTimeout(() => setMaxPrice(max), 0)
    }, [searchParams])

    const handleSortChange = (newSort: SortOption) => {
        setSort(newSort)
        const params = new URLSearchParams(searchParams.toString())
        
        if (newSort !== 'default') {
            params.set('sort', newSort)
        } else {
            params.delete('sort')
        }
        
        params.delete('page')
        router.push(`/search?${params.toString()}`)
    }

    const applyPriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString())
        if (minPrice) params.set('minPrice', minPrice)
        else params.delete('minPrice')
        
        if (maxPrice) params.set('maxPrice', maxPrice)
        else params.delete('maxPrice')
        
        params.delete('page')
        router.push(`/search?${params.toString()}`)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            applyPriceFilter()
        }
    }

    return (
        <div className={`w-full bg-white border-b border-gray-100 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 sm:px-0 max-w-7xl mx-auto gap-4">
                
                {/* Левая часть: Вкладки сортировки */}
                <div className="flex items-center gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
                    <button 
                        onClick={() => handleSortChange('default')}
                        /* ИЗМЕНЕНО: text-red-500 -> text-[#0f6b46] */
                        className={`text-sm font-medium transition-colors ${sort === 'default' ? 'text-[#0f6b46]' : 'text-gray-600 hover:text-[#0f6b46]'}`}
                    >
                        По умолчанию
                    </button>
                    
                    <button 
                        onClick={() => handleSortChange('price_asc')}
                        /* ИЗМЕНЕНО: text-red-500 -> text-[#0f6b46] */
                        className={`text-sm font-medium flex items-center gap-1 transition-colors ${sort === 'price_asc' ? 'text-[#0f6b46]' : 'text-gray-600 hover:text-[#0f6b46]'}`}
                    >
                        Цена (по возр.)
                    </button>

                    <button 
                        onClick={() => handleSortChange('price_desc')}
                        /* ИЗМЕНЕНО: text-red-500 -> text-[#0f6b46] */
                        className={`text-sm font-medium flex items-center gap-1 transition-colors ${sort === 'price_desc' ? 'text-[#0f6b46]' : 'text-gray-600 hover:text-[#0f6b46]'}`}
                    >
                        Цена (по убыв.)
                    </button>
                </div>

                {/* Правая часть: Фильтр по цене */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 hidden md:inline">Диапазон цен (₽):</span>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-md p-1 border border-gray-200">
                        <input
                            type="number"
                            placeholder="Мин"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-16 sm:w-20 px-2 py-1 text-sm bg-transparent outline-none text-center"
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="number"
                            placeholder="Макс"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="w-16 sm:w-20 px-2 py-1 text-sm bg-transparent outline-none text-center"
                        />
                        <button 
                            onClick={applyPriceFilter}
                            /* ИЗМЕНЕНО: bg-red-500 -> bg-[#0f6b46], hover:bg-red-600 -> hover:bg-[#0a4e32] */
                            className="px-3 py-1 bg-[#0f6b46] text-white text-xs font-medium rounded hover:bg-[#0a4e32] transition-colors"
                        >
                            OK
                        </button>
                    </div>
                </div>

            </div>
        </div>
    )
}