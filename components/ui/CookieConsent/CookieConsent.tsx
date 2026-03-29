'use client'

import { Button } from '@/components/ui'
import { useCookieConsentStore } from '@/lib/store/cookie-consent'
import { cn } from '@/lib/utils/utils'
import { X } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export default function CookieConsent() {
	const { consented, dismissed, setConsented, setDismissed } = useCookieConsentStore()
	const [mounted, setMounted] = useState(false)
	const bannerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const timer = setTimeout(() => setMounted(true), 300)
		return () => clearTimeout(timer)
	}, [])

	// Обработка клавиши Escape для закрытия
	useEffect(() => {
		if (!mounted || dismissed || consented) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') {
				setDismissed(true)
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [mounted, dismissed, consented, setDismissed])

	const isVisible = !dismissed && !consented && mounted

	const handleAccept = () => {
		setConsented(true)
	}

	const handleDecline = () => {
		setDismissed(true)
	}

	const handleClose = () => {
		setDismissed(true)
	}

	if (!isVisible) return null

	return (
		<div
			ref={bannerRef}
			role="region"
			aria-label="Уведомление об использовании cookie"
			aria-live="polite"
			className={cn(
				'fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg transition-transform duration-300 touch-pan-y',
				isVisible ? 'translate-y-0' : 'translate-y-full'
			)}
		>
			<div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4 relative">
				<div className="flex-1">
					<div className="flex items-center justify-between mb-2">
						<h3 className="text-md lg:text-lg font-bold text-gray-900">🍪 Использование файлов cookie</h3>
						<button
							onClick={handleClose}
							className="text-gray-500 hover:text-gray-800 p-1 rounded-full hover:bg-gray-100 lg:cursor-pointer lg:absolute top-1.5 -right-20"
							aria-label="Закрыть"
						>
							<X size={20} />
						</button>
					</div>
					<p className="text-gray-700 text-xs lg:text-sm">
						Мы используем файлы cookie для улучшения работы сайта, персонализации контента и анализа трафика. Нажимая «Принять», вы соглашаетесь на
						использование cookie в соответствии с нашей{' '}
						<Link
							href="/privacy-policy"
							className="text-blue-600 hover:underline font-medium"
							target="_blank"
							rel="noopener noreferrer"
						>
							Политикой конфиденциальности
						</Link>
						. Вы можете отозвать согласие в любое время.
					</p>
				</div>
				<div className="flex flex-row gap-3 shrink-0">
					<Button
						variant="outline"
						size="sm"
						onClick={handleDecline}
						className="whitespace-nowrap"
					>
						Отклонить
					</Button>
					<Button
						variant="primary"
						size="sm"
						onClick={handleAccept}
						className="whitespace-nowrap"
					>
						Принять все
					</Button>
				</div>
			</div>
		</div>
	)
}
