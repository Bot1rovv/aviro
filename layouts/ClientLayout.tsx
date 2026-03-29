'use client'

import Cart from '@/components/cart/Cart'
import Footer from '@/components/footer/Footer'
import Header from '@/components/header/Header'
import { PageLoader } from '@/components/ui'
import { useTermsModalStore } from '@/lib/store/terms-modal'
import dynamic from 'next/dynamic'
import { Suspense, useState } from 'react'
import { Toaster } from 'sonner'

const TermsModal = dynamic(() => import('@/components/ui/TermsModal/TermsModal'), {
	ssr: false,
	loading: () => null
})

const CookieConsent = dynamic(() => import('@/components/ui/CookieConsent/CookieConsent'), {
	ssr: false,
	loading: () => null
})

export default function ClientLayout({ children }: { children: React.ReactNode }) {
	const [isCartOpen, setIsCartOpen] = useState(false)
	const { isOpen: isTermsOpen, open: openTerms, close: closeTerms } = useTermsModalStore()

	const openCart = () => setIsCartOpen(true)
	const closeCart = () => setIsCartOpen(false)

	return (
		<div className="flex flex-col min-h-screen">
			<Cart
				isOpen={isCartOpen}
				onClose={closeCart}
			/>
			<Suspense fallback={null}>
				<TermsModal
					isOpen={isTermsOpen}
					onClose={closeTerms}
				/>
			</Suspense>
			<Header openCart={openCart} />
			<PageLoader />
			<main className="flex-grow bg-gray-50 pt-[40px] pb-[40px]">{children}</main>
			<Footer openTerms={openTerms} />
			<CookieConsent />
			<Toaster
				position="bottom-right"
				expand={false}
				richColors
				closeButton
			/>
		</div>
	)
}
