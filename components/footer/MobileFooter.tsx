import { MobileFooterData } from '@/components/menu/FooterMenu/footer-menu-data'
import CatalogModal from '@/components/ui/CatalogModal/CatalogModal'
import { useCartStore, useFavoritesStore } from '@/lib/store'
import { useUserStore } from '@/lib/store/user'
import Link from 'next/link'
import { useState } from 'react'

export default function MobileFooter() {
	const totalFavorites = useFavoritesStore(state => state.totalItems)
	const totalCartItems = useCartStore(state => state.totalItems)
	const { isAuthenticated } = useUserStore()
	const [catalogOpen, setCatalogOpen] = useState(false)

	const openCatalog = () => setCatalogOpen(true)
	const closeCatalog = () => setCatalogOpen(false)

	return (
		<>
			<footer className="fixed bottom-0 z-5 w-screen h-auto lg:hidden bg-white px-0.5 py-2.5 shadow-sm border-t border-black/10">
				<nav className=" grid grid-cols-5 items-center justify-between gap-0.5">
					{MobileFooterData.map(item => {
						const isFavorites = item.title === 'Избранное'
						const isCart = item.title === 'Корзина'
						// Динамически определяем ссылку для пункта "Профиль"
						const link = item.title === 'Профиль' ? (isAuthenticated ? item.link : '/login') : item.link

						// Для каталога используем кнопку, открывающую модальное окно
						if (item.title === 'Каталог') {
							return (
								<button
									key={item.title}
									onClick={openCatalog}
									className="flex items-center flex-col gap-0.5 transition-colors duration-300 focus:text-amber-500 text-xs relative"
								>
									<div className="relative">{<item.icon />}</div>
									{item.title}
								</button>
							)
						}

						return (
							<Link
								key={item.title}
								href={link}
								className="flex items-center flex-col gap-0.5 transition-colors duration-300 focus:text-amber-500 text-xs relative"
							>
								<div className="relative">
									{<item.icon />}
									{isFavorites && totalFavorites > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
											{totalFavorites > 9 ? '9+' : totalFavorites}
										</span>
									)}
									{isCart && totalCartItems > 0 && (
										<span className="absolute -top-2 -right-2 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
											{totalCartItems > 9 ? '9+' : totalCartItems}
										</span>
									)}
								</div>
								{item.title}
							</Link>
						)
					})}
				</nav>
			</footer>
			<CatalogModal
				isOpen={catalogOpen}
				onClose={closeCatalog}
			/>
		</>
	)
}
