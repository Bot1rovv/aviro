import { PagesConfig } from '@/config/pages.config'
import Link from 'next/link'

export default function MobileHeaderMenu() {
	return (
		<nav className="grid grid-cols-3 gap-2.5">
			<Link
				href={PagesConfig.HOME}
				className="relative block border-radius-18px text-decoration-none aspect-ratio-1-1 min-height-0 overflow-hidden border-0 box-shadow-0-10-24-rgba-15-23-42-0-08 background-white color-black"
			>
				<span className="text-2xl font-bold">Главная</span>
			</Link>
			<Link
				href={PagesConfig.CATALOG}
				className="relative block border-radius-18px text-decoration-none aspect-ratio-1-1 min-height-0 overflow-hidden border-0 box-shadow-0-10-24-rgba-15-23-42-0-08 background-white color-black"
			>
				<span className="text-2xl font-bold">Каталог</span>
			</Link>
			<Link
				href={PagesConfig.CART}
				className="relative block border-radius-18px text-decoration-none aspect-ratio-1-1 min-height-0 overflow-hidden border-0 box-shadow-0-10-24-rgba-15-23-42-0-08 background-white color-black"
			>
				<span className="text-2xl font-bold">Корзина</span>
			</Link>
		</nav>
	)
}
 