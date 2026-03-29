'use client'

import categories1688 from '@/lib/data/categories_1688_translated.json'
import type { Category1688 } from '@/types/category'
import type { MenuItem } from '@/types/menu'
import {
	Armchair,
	Baby,
	Bike,
	BookText,
	Box,
	BriefcaseMedical,
	Bubbles,
	Car,
	Coffee,
	Cpu,
	Factory,
	Footprints,
	Gamepad2,
	House,
	LampDesk,
	Laptop,
	LayoutGrid,
	LucideIcon,
	MirrorRound,
	Package,
	Paintbrush,
	Paperclip,
	PawPrint,
	Shield,
	Shirt,
	ShoppingBag,
	Smartphone,
	Sparkles,
	TreeDeciduous,
	Truck,
	User,
	UtensilsCrossed,
	Warehouse,
	Wrench,
	Zap
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import Button from '../../ui/Button/Button'

// Маппинг иконок для категорий
const iconMap: Record<string, LucideIcon> = {
	// Основные категории
	Электроника: Smartphone,
	'Компьютеры и периферия': Laptop,
	Мебель: Armchair,
	'Строительство и ремонт': Paintbrush,
	Аптека: BriefcaseMedical,
	'Личная гигиена и уборка': Bubbles,
	'Детские товары': Baby,
	'Для животных': PawPrint,
	'Дом и сад': House,
	'Игры и консоли': Gamepad2,
	Книги: BookText,
	'Канцелярские товары': Paperclip,
	'Красота и здоровье': MirrorRound,
	'Кухонная посуда': Coffee,
	Обувь: Footprints,
	Освещение: LampDesk,
	'Спорт и отдых': Bike,
	Телекоммуникации: Smartphone,
	Игрушки: Gamepad2,
	'Приборы и инструменты': Cpu,
	'Промышленное оборудование': Warehouse,
	'Химическая промышленность': Zap,
	Безопасность: Shield,
	Стройматериалы: Wrench,
	'Сумки и кожаные изделия': ShoppingBag,
	'Аксессуары и украшения': Sparkles,
	Автотовары: Car,
	'Домашний текстиль': House,
	'Транспорт и логистика': Truck,
	'Сельское хозяйство': TreeDeciduous,
	'Медицина и здоровье': BriefcaseMedical,
	'Косметика и уход': Sparkles,
	'Продажа б/у оборудования': Package,
	Производство: Factory,
	'Напитки и продукты': UtensilsCrossed,
	'Мода и стиль': Shirt,
	'Взрослые товары': User
}

// Преобразование категорий в данные меню
const transformCategoriesToMenu = (): MenuItem[] => {
	const categories = categories1688 as Record<string, Category1688>
	const menuItems: MenuItem[] = []

	// Добавляем "Все товары" первым
	menuItems.push({
		id: 'all',
		title: 'Все товары',
		link: '/products',
		icon: Box
	})

	// Обрабатываем категории из JSON
	Object.entries(categories).forEach(([id, category]) => {
		// Определяем иконку по названию
		let IconComponent = Box
		for (const [key, icon] of Object.entries(iconMap)) {
			if (category.name_ru.includes(key) || category.name_en?.includes(key)) {
				IconComponent = icon
				break
			}
		}

		// Если не нашли по ключу, пробуем по умолчанию
		if (IconComponent === Box) {
			if (category.name_ru.includes('одежда') || category.name_en?.toLowerCase().includes('clothing')) {
				IconComponent = Shirt
			} else if (category.name_ru.includes('обувь') || category.name_en?.toLowerCase().includes('shoe')) {
				IconComponent = Footprints
			} else if (category.name_ru.includes('электроник') || category.name_en?.toLowerCase().includes('electronic')) {
				IconComponent = Smartphone
			} else if (category.name_ru.includes('мебель') || category.name_en?.toLowerCase().includes('furniture')) {
				IconComponent = Armchair
			} else if (
				category.name_ru.includes('игр') ||
				category.name_en?.toLowerCase().includes('toy') ||
				category.name_en?.toLowerCase().includes('game')
			) {
				IconComponent = Gamepad2
			} else if (category.name_ru.includes('спорт') || category.name_en?.toLowerCase().includes('sport')) {
				IconComponent = Bike
			} else if (
				category.name_ru.includes('красот') ||
				category.name_en?.toLowerCase().includes('beauty') ||
				category.name_en?.toLowerCase().includes('cosmetic')
			) {
				IconComponent = Sparkles
			} else if (
				category.name_ru.includes('дом') ||
				category.name_en?.toLowerCase().includes('home') ||
				category.name_en?.toLowerCase().includes('kitchen')
			) {
				IconComponent = House
			} else if (
				category.name_ru.includes('авто') ||
				category.name_en?.toLowerCase().includes('car') ||
				category.name_en?.toLowerCase().includes('automotive')
			) {
				IconComponent = Car
			} else if (
				category.name_ru.includes('строительств') ||
				category.name_en?.toLowerCase().includes('building') ||
				category.name_en?.toLowerCase().includes('construction')
			) {
				IconComponent = Wrench
			}
		}

		menuItems.push({
			id,
			title: category.name_ru || category.name_en || category.name_zh,
			link: `/products?category=${id}`,
			icon: IconComponent,
			subcategories: category.subcategories
		})
	})

	return menuItems
}

const FirstMenuData = transformCategoriesToMenu()

export default function HeaderMenu() {
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [selectedCategory, setSelectedCategory] = useState<MenuItem | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)

	// Получаем подкатегории для выбранной категории
	const currentSubcategories = selectedCategory?.subcategories
		? Object.entries(selectedCategory.subcategories).map(([id, name]) => ({
				title: name,
				link: `/products?category=${selectedCategory.id}&subcategory=${id}`
			}))
		: []

	const toggleOpenMenu = () => {
		setIsMenuOpen(prev => !prev)
		if (!isMenuOpen) {
			setSelectedCategory(null)
		}
	}

	const closeMenu = () => {
		setIsMenuOpen(false)
		setSelectedCategory(null)
	}

	const handleCategoryLinkClick = (item: MenuItem, e: React.MouseEvent) => {
		// Если есть подкатегории - показываем их, не переходим
		if (item.subcategories && Object.keys(item.subcategories).length > 0) {
			e.preventDefault()
			setSelectedCategory(item)
		}
		// Если нет подкатегорий - переходим по ссылке
	}

	const handleBackClick = () => {
		setSelectedCategory(null)
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				isMenuOpen &&
				menuRef.current &&
				!menuRef.current.contains(event.target as Node) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target as Node)
			) {
				closeMenu()
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [isMenuOpen])

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isMenuOpen) {
				closeMenu()
			}
		}
		document.addEventListener('keydown', handleEscape)
		return () => {
			document.removeEventListener('keydown', handleEscape)
		}
	}, [isMenuOpen])

	return (
		<div
			className="relative"
			ref={menuRef}
		>
			<Button
				ref={buttonRef}
				onClick={toggleOpenMenu}
				id="toggle-menu"
				icon={<LayoutGrid />}
				iconPosition="right"
				variant="primary"
				size="md"
				className="w-[192px]"
			>
				<span>Каталог</span>
			</Button>
			<nav
				className={`absolute top-full left-0 bg-white p-4 rounded-lg z-20 flex items-start gap-2 shadow-lg transition-all duration-300 mt-2 ${
					isMenuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'
				}`}
				id="header-menu"
			>
				<div>
					<h3 className="text-base text-black font-extrabold mb-7">Категории</h3>
					<ul className="list-none flex flex-col gap-2 overflow-y-scroll p-4 max-h-[45vh]">
						{FirstMenuData.map(item => (
							<li
								key={item.id}
								className="border-b border-gray-200 last:border-none p-2 group cursor-pointer"
							>
								<a
									href={item.link}
									onClick={e => handleCategoryLinkClick(item, e)}
									className="text-sm font-semibold text-black hover:text-gray-700 flex items-center gap-2 w-full"
								>
									{<item.icon className="group-hover:text-amber-500 duration-300 transition-colors w-4 h-4" />}
									<span className="group-hover:duration-300 transition-colors hover:text-blue-500 truncate">{item.title}</span>
									{item.subcategories && Object.keys(item.subcategories).length > 0 && <span className="ml-auto text-gray-400 text-xs">→</span>}
								</a>
							</li>
						))}
					</ul>
				</div>
				<div className="border-l border-gray-200 pl-4 min-w-[200px]">
					{selectedCategory ? (
						<>
							<button
								onClick={handleBackClick}
								className="text-sm text-blue-500 hover:text-blue-700 mb-2 flex items-center gap-1"
							>
								← Назад
							</button>
							<h3 className="text-sm text-black font-extrabold mb-2">{selectedCategory.title}</h3>
							<ul className="list-none flex flex-col gap-2 overflow-y-scroll max-h-[40vh]">
								{currentSubcategories.map((item, index) => (
									<li
										key={index}
										className="border-b border-gray-200 last:border-none p-2 group"
									>
										<a
											href={item.link}
											className="text-sm text-gray-700 hover:text-gray-900 flex items-center gap-2 w-full"
										>
											<span className="group-hover:duration-300 transition-colors hover:text-blue-500 truncate">{item.title}</span>
										</a>
									</li>
								))}
							</ul>
						</>
					) : (
						<>
							<h3 className="text-sm text-black font-extrabold mb-2">Популярное</h3>
							<ul className="list-none flex flex-col gap-2 overflow-y-scroll max-h-[45vh]">
								<li className="border-b border-gray-200 last:border-none p-2 group">
									<a
										href="/products"
										className="text-sm text-gray-700 hover:text-gray-900"
									>
										Все товары
									</a>
								</li>
								<li className="border-b border-gray-200 last:border-none p-2 group">
									<a
										href="/products?category=1038378"
										className="text-sm text-gray-700 hover:text-gray-900"
									>
										Обувь
									</a>
								</li>
								<li className="border-b border-gray-200 last:border-none p-2 group">
									<a
										href="/products?category=1813"
										className="text-sm text-gray-700 hover:text-gray-900"
									>
										Игрушки
									</a>
								</li>
								<li className="border-b border-gray-200 last:border-none p-2 group">
									<a
										href="/products?category=18"
										className="text-sm text-gray-700 hover:text-gray-900"
									>
										Спорт и отдых
									</a>
								</li>
								<li className="border-b border-gray-200 last:border-none p-2 group">
									<a
										href="/products?category=97"
										className="text-sm text-gray-700 hover:text-gray-900"
									>
										Косметика
									</a>
								</li>
							</ul>
						</>
					)}
				</div>
			</nav>
		</div>
	)
}
