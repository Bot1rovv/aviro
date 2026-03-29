'use client'

import SessionProvider from '@/components/providers/SessionProvider'
import { DESKTOP_BREAKPOINT } from '@/config/constants'
import { useEffect, useState } from 'react'
import ClientLayout from './ClientLayout'
import MobileLayout from './MobileLayout'

export default function AppLayout({ children }: { children: React.ReactNode }) {
	const [isDesktop, setIsDesktop] = useState(false)
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		// Устанавливаем mounted асинхронно, чтобы избежать синхронного setState в эффекте
		requestAnimationFrame(() => {
			setMounted(true)
		})

		const mediaQuery = window.matchMedia(`(min-width: ${DESKTOP_BREAKPOINT + 1}px)`)
		const handleResize = () => setIsDesktop(mediaQuery.matches)

		handleResize()
		mediaQuery.addEventListener('change', handleResize)

		return () => mediaQuery.removeEventListener('change', handleResize)
	}, [])

	// Оборачиваем в SessionProvider для синхронизации NextAuth с Zustand
	const content = (
		<>
			{!mounted ? (
				<ClientLayout>{children}</ClientLayout>
			) : isDesktop ? (
				<ClientLayout>{children}</ClientLayout>
			) : (
				<MobileLayout>{children}</MobileLayout>
			)}
		</>
	)

	return <SessionProvider>{content}</SessionProvider>
}
