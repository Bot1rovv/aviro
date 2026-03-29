/**
 * Цвета для бейджей источников товаров.
 * Используются в компонентах SourceBadge, Product, ImageGallery.
 */
export const SOURCE_COLORS = {
	taobao: 'bg-orange-500',
	'1688': 'bg-blue-500',
	poizon: 'bg-green-500'
} as const

export type SourceType = keyof typeof SOURCE_COLORS
