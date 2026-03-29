'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageLoader() {
	const [loading, setLoading] = useState(false)
	const pathname = usePathname()

	useEffect(() => {
		const handleStart = () => setLoading(true)
		const handleComplete = () => setLoading(false)

		// При изменении пути показываем лоадер на короткое время
		handleStart()
		const timer = setTimeout(() => {
			handleComplete()
		}, 500) // Имитация загрузки, можно увеличить если нужно

		return () => clearTimeout(timer)
	}, [pathname])

	if (!loading) return null

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
			<div className="relative">
				{/* Внешний градиентный круг */}
				<div className="h-20 w-20 animate-spin rounded-full border-4 border-solid border-transparent border-t-blue-500 border-r-blue-400 border-b-blue-300 border-l-blue-200"></div>
				{/* Внутренний круг с градиентом как у кнопки */}
				<div
					className="absolute inset-0 m-auto h-12 w-12 animate-spin rounded-full border-4 border-solid border-transparent"
					style={{
						borderTopColor: '#0d65df',
						borderRightColor: '#0d65df',
						borderBottomColor: '#0752c2',
						borderLeftColor: '#0752c2'
					}}
				></div>
				{/* Центральная точка */}
				<div className="absolute inset-0 m-auto h-6 w-6 rounded-full bg-gradient-to-t from-[#0d65df] to-[#0752c2]"></div>
			</div>
		</div>
	)
}
