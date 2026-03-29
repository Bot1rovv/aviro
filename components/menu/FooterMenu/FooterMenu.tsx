'use client'

import Link from 'next/link'
import { MenuData } from './footer-menu-data'

interface FooterMenuProps {
	openTerms?: () => void
}

export default function FooterMenu({ openTerms }: FooterMenuProps) {
	const handleClick = (e: React.MouseEvent, link: string, title: string) => {
		// Если это ссылка на условия использования и есть openTerms, открываем модалку
		if (title === 'Публичная оферта' && openTerms) {
			e.preventDefault()
			openTerms()
		}
		// Иначе переход по ссылке произойдет стандартно
	}

	return (
		<div className="w-full border-t border-gray-300 bg-gray-100 px-4 py-6 flex items-center justify-center">
			<nav className="flex flex-row items-center gap-8">
				{MenuData.map(item => (
					<Link
						key={item.title}
						href={item.link}
						className="text-black/50 transition-colors duration-300 hover:text-amber-600 whitespace-nowrap"
						onClick={e => handleClick(e, item.link, item.title)}
					>
						{item.title}
					</Link>
				))}
			</nav>
		</div>
	)
}
