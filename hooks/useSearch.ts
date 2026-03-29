'use client'

import { PagesConfig } from '@/config/pages.config'
import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Хук для управления поиском товаров.
 * Возвращает состояние поиска и обработчики.
 */
export function useSearch() {
	const router = useRouter()
	const pathname = usePathname()
	const prevPathnameRef = useRef(pathname)
	const [searchValue, setSearchValue] = useState('')

	useEffect(() => {
		if (prevPathnameRef.current !== pathname) {
			prevPathnameRef.current = pathname
			requestAnimationFrame(() => setSearchValue(''))
		}
	}, [pathname])

	const handleSearch = useCallback(
		(value: string) => {
			if (value.trim()) {
				router.push(`${PagesConfig.PRODUCTS_BY_SEARCH}?q=${encodeURIComponent(value)}`)
			}
		},
		[router]
	)

	const handleChange = useCallback((value: string) => {
		setSearchValue(value)
	}, [])

	const handleSubmit = useCallback(
		(e?: React.FormEvent) => {
			e?.preventDefault()
			handleSearch(searchValue)
		},
		[handleSearch, searchValue]
	)

	const resetSearch = useCallback(() => setSearchValue(''), [])

	return {
		searchValue,
		setSearchValue,
		handleSearch,
		handleChange,
		handleSubmit,
		resetSearch
	}
}
