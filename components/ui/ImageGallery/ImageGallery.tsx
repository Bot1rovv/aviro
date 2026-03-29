'use client'

import { normalizeImageUrl } from '@/lib/utils/utils'
import Image from 'next/image'
import { useState } from 'react'

interface ImageGalleryProps {
	images: string[]
	title: string
	source?: 'taobao' | '1688' | 'poizon'
	sourceColors?: Record<string, string>
}

function getValidImage(img: string | undefined | null): string {
	if (img && img.trim() !== '') {
		return normalizeImageUrl(img.trim())
	}
	return '/no-image.jpg'
}

export default function ImageGallery({ images, title, source, sourceColors = {} }: ImageGalleryProps) {
	const [selectedIndex, setSelectedIndex] = useState(0)

	if (!images || images.length === 0) {
		return (
			<div className="relative aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
				<span className="text-gray-400">Нет изображений</span>
			</div>
		)
	}

	return (
		<div className="space-y-4">
			{/* Основное изображение */}
			<div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
				<Image
					src={getValidImage(images[selectedIndex])}
					alt={`${title} ${selectedIndex + 1}`}
					fill
					className="object-cover"
					sizes="(max-width: 768px) 100vw, 50vw"
					priority={selectedIndex === 0}
				/>
				{source && (
					<span className={`absolute top-4 right-4 px-3 py-1 text-sm text-white rounded ${sourceColors[source]}`}>{source.toUpperCase()}</span>
				)}
			</div>

			{/* Миниатюры */}
			{images.length > 1 && (
				<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
					{images.filter(Boolean).map((img, idx) => (
						<button
							key={idx}
							onClick={() => setSelectedIndex(idx)}
							className={`relative w-20 h-20 rounded-md overflow-hidden border-2 flex-shrink-0 ${
								idx === selectedIndex ? 'border-blue-500' : 'border-transparent hover:border-gray-300'
							}`}
						>
							<Image
								src={getValidImage(img)}
								alt={`${title} ${idx + 1}`}
								fill
								className="object-cover"
								sizes="80px"
								loading="lazy"
							/>
						</button>
					))}
				</div>
			)}
		</div>
	)
}
