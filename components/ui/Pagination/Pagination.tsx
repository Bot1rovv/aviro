'use client'

import { Button } from '@/components/ui'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface PaginationProps {
	currentPage: number
	totalPages?: number
	baseUrl: string
	queryParams?: Record<string, string>
	showNext?: boolean
}

export default function Pagination({ currentPage, totalPages, baseUrl, queryParams = {}, showNext = true }: PaginationProps) {
	const router = useRouter()
	const [navigatingToPage, setNavigatingToPage] = useState<number | null>(null)

	const buildUrl = (page: number) => {
		const params = new URLSearchParams({ ...queryParams, page: page.toString() })
		return `${baseUrl}?${params.toString()}`
	}

	const handleNavigation = (page: number) => {
		setNavigatingToPage(page)
		router.push(buildUrl(page))
		// Состояние сбросится после размонтирования компонента, но на случай ошибки сбросим через 3 секунды
		setTimeout(() => setNavigatingToPage(null), 3000)
	}

	const hasPrev = currentPage > 1
	const hasNext = showNext && (!totalPages || currentPage < totalPages)

	return (
		<div className="mt-10 text-center mb-5">
			<div className="flex items-center justify-center gap-4">
				{hasPrev && (
					<Button
						variant="secondary"
						onClick={() => handleNavigation(currentPage - 1)}
						loading={navigatingToPage === currentPage - 1}
						disabled={navigatingToPage !== null}
					>
						<ChevronLeft size={18} />
						<span>Назад</span>
					</Button>
				)}
				{hasNext && (
					<Button
						variant="primary"
						onClick={() => handleNavigation(currentPage + 1)}
						loading={navigatingToPage === currentPage + 1}
						disabled={navigatingToPage !== null}
					>
						<span>Далее</span>
						<ChevronRight size={18} />
					</Button>
				)}
			</div>
		</div>
	)
}
