'use client'
import MobileFooter from '@/components/footer/MobileFooter'
import MobileHeader from '@/components/header/MobileHeader'
import { CookieConsent } from '@/components/ui'

export default function MobileLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex flex-col min-h-screen">
			<MobileHeader />
			<main className="flex-grow bg-gray-50 pt-[145px] pb-[75px]">{children}</main>
			<MobileFooter />
			<CookieConsent />
		</div>
	)
}
