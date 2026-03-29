import { PagesConfig } from '@/config/pages.config'
import { Home, LayoutGrid, User, LucideIcon, ShoppingBag } from 'lucide-react'

export const MenuData = [
	{
		title: 'FAQ',
		link: PagesConfig.FAQ
	},
	{
		title: 'Оплата и доставка',
		link: PagesConfig.PAYMENT_AND_DELIVERY
	},
	{
		title: 'Публичная оферта',
		link: '#'
	},
	{
		title: 'О компании',
		link: PagesConfig.ABOUT_US
	}
]

export const MobileFooterData: { title: string; link: string; icon: LucideIcon }[] = [
	{
		title: 'Главная',
		link: PagesConfig.HOME,
		icon: Home
	},
	{
		title: 'Каталог',
		link: PagesConfig.CATALOG,
		icon: LayoutGrid
	},
	{
		title: 'Корзина',
		link: PagesConfig.CART,
		icon: ShoppingBag
	},
	{
		title: 'Профиль',
		link: PagesConfig.USER,
		icon: User
	}
]