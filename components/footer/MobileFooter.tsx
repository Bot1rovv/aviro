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
            <footer className="fixed bottom-0 left-0 right-0 z-50 w-full h-auto lg:hidden bg-white pt-2 pb-6 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-200">
                <nav className="grid grid-cols-4 items-center w-full">
                    {MobileFooterData.map(item => {
                        const isFavorites = item.title === 'Избранное'
                        const isCart = item.title === 'Корзина'
                        const link = item.title === 'Профиль' ? (isAuthenticated ? item.link : '/login') : item.link

                        // ИЗМЕНЕНО: hover:text-red-500 focus:text-red-500 -> hover:text-[#0f6b46] focus:text-[#0f6b46]
                        const baseItemClasses = "flex flex-col items-center justify-center gap-1 w-full transition-colors duration-200 text-[10px] text-gray-500 hover:text-[#0f6b46] focus:text-[#0f6b46]"

                        if (item.title === 'Каталог') {
                            return (
                                <button
                                    key={item.title}
                                    onClick={openCatalog}
                                    className={baseItemClasses}
                                >
                                    <div className="relative text-xl">{<item.icon />}</div>
                                    <span>{item.title}</span>
                                </button>
                            )
                        }

                        return (
                            <Link
                                key={item.title}
                                href={link}
                                className={baseItemClasses}
                            >
                                <div className="relative text-xl">
                                    {<item.icon />}
                                    {isFavorites && totalFavorites > 0 && (
                                        /* ИЗМЕНЕНО: bg-red-500 -> bg-[#0f6b46] */
                                        <span className="absolute -top-1 -right-2 bg-[#0f6b46] text-[10px] font-bold text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                            {totalFavorites > 99 ? '99+' : totalFavorites}
                                        </span>
                                    )}
                                    {isCart && totalCartItems > 0 && (
                                        /* ИЗМЕНЕНО: bg-red-500 -> bg-[#0f6b46] */
                                        <span className="absolute -top-1 -right-2 bg-[#0f6b46] text-[10px] font-bold text-white rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                            {totalCartItems > 99 ? '99+' : totalCartItems}
                                        </span>
                                    )}
                                </div>
                                <span>{item.title}</span>
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