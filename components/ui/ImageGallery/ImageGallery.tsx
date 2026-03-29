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
                <span className="text-gray-400">Нет медиафайлов</span>
            </div>
        )
    }

    const currentMedia = images[selectedIndex]
    // Используем includes вместо endsWith, так как в ссылке могут быть параметры
    const isVideo = currentMedia?.toLowerCase().includes('.mp4')
    
    // Надежно находим первую картинку для постера к видео
    const firstImage = images.find(img => !img.toLowerCase().includes('.mp4'))
    const posterUrl = firstImage ? getValidImage(firstImage) : '/no-image.jpg'

    return (
        <div className="space-y-4">
            {/* Основное изображение или видео */}
            <div className="relative aspect-square bg-black rounded-lg overflow-hidden group flex items-center justify-center">
                {isVideo ? (
                    <video
                        src={getValidImage(currentMedia)}
                        poster={posterUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <Image
                        src={getValidImage(currentMedia)}
                        alt={`${title} ${selectedIndex + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority={selectedIndex === 0}
                    />
                )}
                
                {source && !isVideo && (
                    <span className={`absolute top-4 right-4 px-3 py-1 text-sm font-medium text-white rounded ${sourceColors[source] || 'bg-blue-500'}`}>
                        {source.toUpperCase()}
                    </span>
                )}
            </div>

            {/* Миниатюры */}
            {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                    {images.filter(Boolean).map((media, idx) => {
                        const isThumbVideo = media.toLowerCase().includes('.mp4')
                        return (
                            <button
                                key={idx}
                                onClick={() => setSelectedIndex(idx)}
                                className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 transition-all ${
                                    idx === selectedIndex ? 'ring-2 ring-red-500' : 'ring-1 ring-gray-200 hover:ring-gray-300'
                                }`}
                            >
                                {isThumbVideo ? (
                                    <div className="relative w-full h-full bg-gray-800 flex items-center justify-center">
                                        <Image src={posterUrl} alt="Video poster" fill className="object-cover opacity-50" sizes="64px" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                           <span className="bg-black/60 rounded-full p-1.5">
                                               <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                                           </span>
                                        </div>
                                    </div>
                                ) : (
                                    <Image
                                        src={getValidImage(media)}
                                        alt={`${title} thumbnail ${idx + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="64px"
                                        loading="lazy"
                                    />
                                )}
                            </button>
                        )
                    })}
                </div>
            )}
        </div>
    )
}