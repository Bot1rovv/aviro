'use client'

import { Button, FormInput } from '@/components/ui'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

type SortOption =
	| 'price_asc'
	| 'price_desc'
	| 'title_asc'
	| 'title_desc'
	| 'repeat_purchase_asc'
	| 'repeat_purchase_desc'
	| 'seller_rating_asc'
	| 'seller_rating_desc'
	| 'monthly_sales_asc'
	| 'monthly_sales_desc'
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
	const [selectedSources, setSelectedSources] = useState<('taobao' | '1688' | 'poizon')[]>(['taobao', '1688', 'poizon'])

	// Инициализация из URL параметров
	useEffect(() => {
		const sortParam = searchParams.get('sort') as SortOption | null
		if (
			sortParam &&
			[
				'price_asc',
				'price_desc',
				'title_asc',
				'title_desc',
				'repeat_purchase_asc',
				'repeat_purchase_desc',
				'seller_rating_asc',
				'seller_rating_desc',
				'monthly_sales_asc',
				'monthly_sales_desc',
				'default'
			].includes(sortParam)
		) {
			// Используем setTimeout чтобы избежать синхронного вызова setState внутри эффекта
			setTimeout(() => setSort(sortParam), 0)
		}
		const min = searchParams.get('minPrice')
		const max = searchParams.get('maxPrice')
		if (min) setTimeout(() => setMinPrice(min), 0)
		if (max) setTimeout(() => setMaxPrice(max), 0)
		const sourcesParam = searchParams.get('sources')
		if (sourcesParam) {
			const sources = sourcesParam.split(',').filter(s => ['taobao', '1688', 'poizon'].includes(s)) as ('taobao' | '1688' | 'poizon')[]
			setTimeout(() => setSelectedSources(sources.length > 0 ? sources : ['taobao', '1688', 'poizon']), 0)
		}
	}, [searchParams])

	const applyFilters = () => {
		const params = new URLSearchParams(searchParams.toString())
		if (sort !== 'default') {
			params.set('sort', sort)
		} else {
			params.delete('sort')
		}
		if (minPrice) {
			params.set('minPrice', minPrice)
		} else {
			params.delete('minPrice')
		}
		if (maxPrice) {
			params.set('maxPrice', maxPrice)
		} else {
			params.delete('maxPrice')
		}
		// Источники
		if (selectedSources.length > 0 && selectedSources.length < 3) {
			params.set('sources', selectedSources.join(','))
		} else {
			params.delete('sources')
		}
		// Сбросить страницу на первую при изменении фильтров
		params.delete('page')
		router.push(`/search?${params.toString()}`)
	}

	const resetFilters = () => {
		setSort('default')
		setMinPrice('')
		setMaxPrice('')
		setSelectedSources(['taobao', '1688', 'poizon'])
		const params = new URLSearchParams(searchParams.toString())
		params.delete('sort')
		params.delete('minPrice')
		params.delete('maxPrice')
		params.delete('sources')
		params.delete('page')
		router.push(`/search?${params.toString()}`)
	}

	const handleMinPriceChange = (value: string) => {
		setMinPrice(value)
	}

	const handleMaxPriceChange = (value: string) => {
		setMaxPrice(value)
	}

	const toggleSource = (source: 'taobao' | '1688' | 'poizon') => {
		setSelectedSources(prev => (prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source]))
	}

	const is1688Selected = selectedSources.includes('1688')

	return (
		<div className={`flex flex-col md:flex-row gap-4 items-start md:items-center mb-6 bg-gray-50 border-b border-gray-400 pb-4 ${className}`}>
			<div className="flex flex-wrap md:flex-row gap-1.5 lg:gap-20 items-center justify-center w-full">
				{/* Выбор источников */}
				<div className="flex flex-col gap-2 items-center mb-5 lg:mb-0">
					<label className="text-sm font-bold text-gray-700">Источники:</label>
					<div className="flex gap-4">
						<label className="flex items-center gap-1 cursor-pointer">
							<input
								type="checkbox"
								checked={selectedSources.includes('taobao')}
								onChange={() => toggleSource('taobao')}
								className="w-4 h-4"
							/>
							<span className="text-sm">Taobao</span>
						</label>
						<label className="flex items-center gap-1 cursor-pointer">
							<input
								type="checkbox"
								checked={selectedSources.includes('1688')}
								onChange={() => toggleSource('1688')}
								className="w-4 h-4"
							/>
							<span className="text-sm">1688</span>
						</label>
						<label className="flex items-center gap-1 cursor-pointer">
							<input
								type="checkbox"
								checked={selectedSources.includes('poizon')}
								onChange={() => toggleSource('poizon')}
								className="w-4 h-4"
							/>
							<span className="text-sm">Poizon</span>
						</label>
					</div>
				</div>

				{/* Сортировка по цене */}
				<div className="flex flex-col gap-2 items-center">
					<label className="text-sm font-bold text-gray-700">Сортировка по цене:</label>
					<div className="flex gap-2">
						<Button
							variant={sort === 'price_asc' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setSort('price_asc')}
						>
							Цена ↑
						</Button>
						<Button
							variant={sort === 'price_desc' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setSort('price_desc')}
						>
							Цена ↓
						</Button>
					</div>
				</div>

				{/* Сортировка по названию */}
				<div className="flex flex-col gap-2 items-center">
					<label className="text-sm font-bold text-gray-700">Сортировка по названию:</label>
					<div className="flex gap-2">
						<Button
							variant={sort === 'title_asc' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setSort('title_asc')}
						>
							А-Я
						</Button>
						<Button
							variant={sort === 'title_desc' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setSort('title_desc')}
						>
							Я-А
						</Button>
					</div>
				</div>

				{/* Дополнительная сортировка для 1688 */}
				{is1688Selected && (
					<div className="flex flex-col gap-2 items-center mt-5 mr-2.5 lg:mt-0 lg:mr-0">
						<label className="text-sm font-bold text-gray-700">Сортировка для 1688:</label>
						<div className="flex flex-col lg:flex-row gap-5 lg:gap-4">
							<div className="flex flex-col lg:flex-row gap-2 lg:gap-1">
								<Button
									variant={sort === 'repeat_purchase_asc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('repeat_purchase_asc')}
								>
									Повторные закупки ↑
								</Button>
								<Button
									variant={sort === 'repeat_purchase_desc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('repeat_purchase_desc')}
								>
									Повторные закупки ↓
								</Button>
							</div>
							<div className="flex flex-col lg:flex-row gap-2 lg:gap-1">
								<Button
									variant={sort === 'seller_rating_asc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('seller_rating_asc')}
								>
									Рейтинг продавца ↑
								</Button>
								<Button
									variant={sort === 'seller_rating_desc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('seller_rating_desc')}
								>
									Рейтинг продавца ↓
								</Button>
							</div>
							<div className="flex flex-col lg:flex-row gap-2 lg:gap-1">
								<Button
									variant={sort === 'monthly_sales_asc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('monthly_sales_asc')}
								>
									Месячные продажи ↑
								</Button>
								<Button
									variant={sort === 'monthly_sales_desc' ? 'primary' : 'outline'}
									size="sm"
									onClick={() => setSort('monthly_sales_desc')}
								>
									Месячные продажи ↓
								</Button>
							</div>
						</div>
					</div>
				)}

				{/* Диапазон цен */}
				<div className="flex flex-col gap-2 items-center mt-5 lg:mt-0">
					<label className="text-sm font-bold text-gray-700">Диапазон цен:</label>
					<div className="flex gap-2 items-center">
						<FormInput
							type="number"
							placeholder="Мин"
							value={minPrice}
							onChange={handleMinPriceChange}
							className="w-15 lg:w-24"
						/>
						<span className="text-gray-500">—</span>
						<FormInput
							type="number"
							placeholder="Макс"
							value={maxPrice}
							onChange={handleMaxPriceChange}
							className="w-15 lg:w-24"
						/>
					</div>
				</div>

				{/* Кнопки */}
				<div className="flex flex-col gap-2 justify-end">
					<label className="text-sm font-bold text-gray-700 invisible">Действия</label>
					<div className="flex gap-2">
						<Button
							variant="primary"
							size="sm"
							onClick={applyFilters}
						>
							Применить
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={resetFilters}
						>
							Сбросить
						</Button>
					</div>
				</div>
			</div>
		</div>
	)
}
