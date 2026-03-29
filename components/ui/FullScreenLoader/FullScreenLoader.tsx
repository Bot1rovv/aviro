'use client'

import { Loader2 } from 'lucide-react'

interface FullScreenLoaderProps {
	isLoading: boolean
	text?: string
}

export default function FullScreenLoader({ isLoading, text = 'Идет поиск...' }: FullScreenLoaderProps) {
	if (!isLoading) return null

	return (
		<div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-white/90 shadow-2xl">
				<Loader2
					size={64}
					className="animate-spin text-blue-600"
				/>
				<p className="text-lg font-semibold text-gray-800">{text}</p>
				<p className="text-sm text-gray-600">Пожалуйста, подождите</p>
			</div>
		</div>
	)
}
