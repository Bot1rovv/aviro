'use client'

import { PagesConfig } from '@/config/pages.config'
import categories1688 from '@/lib/data/categories_1688_translated.json'
import type { Category1688 } from '@/types/category'
import type { MenuItem } from '@/types/menu'
import { Box, CircleChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import Modal from '../Modal/Modal'

interface CatalogModalProps {
	isOpen: boolean
	onClose: () => void
}

// Преобразование категорий в данные меню (аналогично HeaderMenu)
const transformCategoriesToMenu = (): MenuItem[] => {
	const categories = categories1688 as Record<string, Category1688>
	const menuItems: MenuItem[] = []

	// Добавляем "Все товары" первым
	menuItems.push({
		id: 'all',
		title: 'Все товары',
		link: '/products',
		icon: Box,
		subcategories: undefined
	})

	// Обрабатываем категории из JSON
	Object.entries(categories).forEach(([id, category]) => {
		menuItems.push({
			id,
			title: category.name_ru || category.name_en || category.name_zh,
			link: `/products?category=${id}`,
			icon: Box,
			subcategories: category.subcategories
		})
	})

	return menuItems
}

export default function CatalogModal({ isOpen, onClose }: CatalogModalProps) {
	const [selectedCategory, setSelectedCategory] = useState<MenuItem | null>(null)

	const menuItems = useMemo(() => transformCategoriesToMenu(), [])

	// const truncateText = (text: string, maxLength = 25) => {
	// 	if (text.length <= maxLength) return text
	// 	return text.slice(0, maxLength) + '...'
	// }

	const handleCategoryClick = (category: MenuItem) => {
		setSelectedCategory(category)
	}

	const handleBack = () => {
		setSelectedCategory(null)
	}

	// Определяем подкатегории для выбранной категории
	const subcategories = useMemo(() => {
		if (!selectedCategory || !selectedCategory.subcategories) return []
		return Object.entries(selectedCategory.subcategories).map(([id, name]) => ({
			id,
			title: name,
			link: `/products?category=${selectedCategory.id}&subcategory=${id}`
		}))
	}, [selectedCategory])

	// Определяем ширину модального окна в зависимости от размера экрана
	// На экранах менее 768px (mobile) - полный экран (w-full)
	// На экранах от 768px до 1023px (tablet) - полэкрана (w-1/2)
	// На экранах 1024px и выше (desktop) - треть экрана (w-1/3)
	const widthClass = 'w-full sm:w-1/2 lg:w-1/2'
	const heightClass = 'h-full'

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			position="left"
			width={widthClass}
			height={heightClass}
			maxHeight="max-h-screen"
			className="rounded-none"
		>
			{/* Header */}
			<div className="flex items-center justify-between p-1 border-b border-gray-200 sticky top-0 bg-white z-10">
				{selectedCategory ? (
					<button
						onClick={handleBack}
						className="p-2 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Назад"
					>
						<CircleChevronLeft
							size={24}
							aria-hidden="true"
						/>
					</button>
				) : (
					<button
						onClick={onClose}
						className="p-2 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Закрыть"
					>
						<CircleChevronLeft
							size={24}
							aria-hidden="true"
						/>
					</button>
				)}
				<div className="flex-1 flex justify-center">
					<h2 className="text-lg font-semibold text-gray-900">{selectedCategory ? selectedCategory.title : 'Каталог'}</h2>
				</div>
				<Link
					href={PagesConfig.ALL_PRODUCTS}
					onClick={onClose}
					className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
				>
					Все
				</Link>
			</div>

			{/* Content */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden p-2 px-0 lg:p-4">
				{!selectedCategory ? (
					<div className="grid grid-cols-3 gap-3">
						{menuItems.map(category => {
							const subCount = Object.keys(category.subcategories || {}).length
							const isAll = category.id === 'all'
							return (
								<button
									key={category.id}
									onClick={() => handleCategoryClick(category)}
									className="relative block aspect-square rounded-[18px] overflow-hidden bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:shadow-xl transition-shadow min-h-[113px] w-full"
								>
									<div className="absolute inset-0 bg-gray-100" />
									<div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/42" />
									<div className="relative z-10 flex flex-col items-start justify-start p-2 h-full">
										<span className="text-xs font-bold leading-[1.12] text-white truncate max-w-[calc(100%-26px)]">{category.title}</span>
										{!isAll && (
											<span className="mt-[5px] text-[10px] text-white/94">{subCount === 0 ? 'Нет подкатегорий' : `${subCount} подкатегорий`}</span>
										)}
									</div>
								</button>
							)
						})}
					</div>
				) : (
					<div className="grid grid-cols-3 gap-3">
						{subcategories.length > 0 ? (
							subcategories.map(sub => (
								<Link
									key={sub.id}
									href={sub.link}
									onClick={onClose}
									className="relative block aspect-square rounded-[18px] overflow-hidden bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)] hover:shadow-xl transition-shadow min-h-[113px] w-full"
								>
									<div className="absolute inset-0 bg-gray-100" />
									<div className="absolute inset-0 bg-gradient-to-b from-black/10 to-black/42" />
									<div className="relative z-10 flex flex-col items-start justify-start p-2 h-full">
										<span className="text-xs font-bold leading-[1.12] text-white truncate max-w-[calc(100%-26px)]">{sub.title}</span>
									</div>
								</Link>
							))
						) : (
							<p className="text-gray-500 text-center py-8 col-span-full">Подкатегории пока не добавлены</p>
						)}
					</div>
				)}
			</div>
		</Modal>
	)
}
