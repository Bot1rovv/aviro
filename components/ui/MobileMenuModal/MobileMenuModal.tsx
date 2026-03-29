'use client'

import { PagesConfig } from '@/config/pages.config'
import { useCartStore } from '@/lib/store/cart'
import { useTermsModalStore } from '@/lib/store/terms-modal'
import { Headset, ShoppingBag, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import CatalogModal from '../CatalogModal/CatalogModal'
import Modal from '../Modal/Modal'
import TermsModal from '../TermsModal/TermsModal'

interface MobileMenuModalProps {
	isOpen: boolean
	onClose: () => void
}

export default function MobileMenuModal({ isOpen, onClose }: MobileMenuModalProps) {
	const { isOpen: termsOpen, open: openTerms, close: closeTerms } = useTermsModalStore()
	const totalCartItems = useCartStore(state => state.totalItems)
	const pathname = usePathname()
	const searchParams = useSearchParams()
	const [catalogOpen, setCatalogOpen] = useState(false)

	// Закрыть меню при изменении маршрута
	useEffect(() => {
		if (isOpen) {
			onClose()
		}
	}, [pathname, searchParams])

	// Закрыть TermsModal при изменении маршрута
	useEffect(() => {
		if (termsOpen) {
			requestAnimationFrame(() => {
				closeTerms()
			})
		}
	}, [pathname, searchParams])

	const handleTermsClick = (e: React.MouseEvent) => {
		e.preventDefault()
		openTerms()
	}

	const openCatalog = () => {
		setCatalogOpen(true)
	}

	const closeCatalog = () => {
		setCatalogOpen(false)
	}

	return (
		<>
			<Modal
				isOpen={isOpen}
				onClose={onClose}
				position="left"
				width="w-full sm:w-1/2"
				height="h-full"
				maxHeight="max-h-screen"
				className="rounded-none"
			>
				{/* Header */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
					<button
						onClick={onClose}
						className="p-2 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Закрыть меню"
					>
						<X
							size={24}
							aria-hidden="true"
						/>
					</button>
					<div className="flex-1 flex justify-center">
						<Link
							href={PagesConfig.HOME}
							onClick={onClose}
							className="flex-shrink-0"
						>
							<Image
								src="/images/logo-header.png"
								alt="Logo"
								width={80}
								height={40}
								className="h-10 w-auto"
							/>
						</Link>
					</div>
					<Link
						href={PagesConfig.CART}
						onClick={onClose}
						className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
						aria-label="Корзина"
					>
						<ShoppingBag
							size={24}
							aria-hidden="true"
						/>
						{totalCartItems > 0 && (
							<span className="absolute -top-1 -right-1 bg-red-500 text-xs text-white rounded-full w-4 h-4 flex items-center justify-center">
								{totalCartItems > 9 ? '9+' : totalCartItems}
							</span>
						)}
					</Link>
				</div>

				{/* Content */}
				<div className="flex-1 overflow-y-auto p-4">
					<nav className="space-y-4">
						<button
							onClick={openCatalog}
							className="block w-full text-left py-3 text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors"
						>
							Каталог
						</button>
						<Link
							href={PagesConfig.ABOUT_US}
							onClick={onClose}
							className="block py-3 text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors"
						>
							О компании
						</Link>
						<Link
							href={PagesConfig.PAYMENT_AND_DELIVERY}
							onClick={onClose}
							className="block py-3 text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors"
						>
							Оплата и доставка
						</Link>
						<Link
							href={PagesConfig.FAQ}
							onClick={onClose}
							className="block py-3 text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors"
						>
							Часто задаваемые вопросы
						</Link>
						<button
							onClick={handleTermsClick}
							className="block w-full text-left py-3 text-lg font-medium text-gray-900 hover:text-orange-500 transition-colors"
						>
							Публичная оферта
						</button>
					</nav>

					{/* Footer */}
					<div className="mt-8 pt-6 border-t border-gray-200">
						<div className="flex items-center gap-3 mb-4">
							<Headset
								className="text-orange-500"
								size={24}
							/>
							<div>
								<p className="text-sm text-gray-600">Позвонить</p>
								<a
									href="tel:+79037402024"
									className="text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors"
								>
									+7 (903) 740-20-24
								</a>
							</div>
						</div>
						{/* Соцсети временно скрыты
						<div className="flex gap-4">
							<a
								href="https://facebook.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-blue-600 transition-colors"
								aria-label="Facebook"
							>
								<Facebook
									size={24}
									aria-hidden="true"
								/>
							</a>
							<a
								href="https://instagram.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-pink-600 transition-colors"
								aria-label="Instagram"
							>
								<Instagram
									size={24}
									aria-hidden="true"
								/>
							</a>
							<a
								href="https://twitter.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-blue-400 transition-colors"
								aria-label="Twitter"
							>
								<Twitter
									size={24}
									aria-hidden="true"
								/>
							</a>
							<a
								href="https://youtube.com"
								target="_blank"
								rel="noopener noreferrer"
								className="text-gray-400 hover:text-red-600 transition-colors"
								aria-label="YouTube"
							>
								<Youtube
									size={24}
									aria-hidden="true"
								/>
							</a>
						</div>
						*/}
					</div>
				</div>
			</Modal>

			<TermsModal
				isOpen={termsOpen}
				onClose={closeTerms}
			/>
			<CatalogModal
				isOpen={catalogOpen}
				onClose={closeCatalog}
			/>
		</>
	)
}
