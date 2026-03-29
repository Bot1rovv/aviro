import { Metadata } from 'next'

export interface PageMetadata {
	title: string
	description: string
	keywords?: string[]
	openGraph?: {
		type?: 'website' | 'article'
		images?: string[]
	}
	robots?: {
		index?: boolean
		follow?: boolean
	}
	canonical?: string
}

// Базовые метаданные для всего сайта
export const baseMetadata: Metadata = {
	metadataBase: new URL('https://arivoo.ru'),
	title: {
		template: '%s | Arivoo маркетплейс',
		default: 'Arivoo маркетплейс'
	},
	description:
		'Покупайте товары с китайских маркетплейсов Taobao, 1688, Poizon с доставкой по России. Безопасные сделки, проверка качества, лучшие цены.',
	keywords: ['китайские товары', 'Taobao', '1688', 'Poizon', 'доставка из Китая', 'маркетплейс', 'Arivoo'],
	openGraph: {
		type: 'website',
		locale: 'ru_RU',
		siteName: 'Arivoo',
		images: [
			{
				url: '/images/og-image.png',
				width: 1200,
				height: 630,
				alt: 'Arivoo маркетплейс'
			}
		]
	},
	twitter: {
		card: 'summary_large_image',
		creator: '@arivoo'
	},
	robots: {
		index: true,
		follow: true
	},
	icons: {
		icon: '/favicons/cropped-favicon-32x32.png',
		shortcut: '/favicons/cropped-favicon-32x32.png',
		apple: '/favicons/cropped-favicon-180x180.png',
		other: {
			rel: 'apple-touch-icon-precomposed',
			url: '/favicons/cropped-favicon-180x180.png'
		}
	},
	manifest: '/manifest.json',
	alternates: {
		canonical: 'https://arivoo.ru'
	}
}

// Метаданные для конкретных страниц
export const pageMetadata: Record<string, PageMetadata> = {
	'/': {
		title: 'Arivoo маркетплейс',
		description:
			'Покупайте товары с китайских маркетплейсов Taobao, 1688, Poizon с доставкой по России. Безопасные сделки, проверка качества, лучшие цены.',
		keywords: ['китайские товары', 'Taobao', '1688', 'Poizon', 'доставка из Китая', 'маркетплейс', 'Arivoo']
	},
	'/about-us': {
		title: 'О компании',
		description: 'О компании Arivoo'
	},
	'/faq': {
		title: 'FAQ Arivoo',
		description: 'Часто задаваемые вопросы и ответы на платформе Arivoo'
	},
	'/payment-and-delivery': {
		title: 'Оплата и Доставка',
		description: 'Оплата и Доставка на сайте Arivoo'
	},
	'/privacy-policy': {
		title: 'Политика конфиденциальности',
		description: 'Политика конфиденциальности Arivoo Редакция от 27 февраля 2026 года'
	},
	'/cart': {
		title: 'Корзина',
		description: 'Корзина Arivoo'
	},
	'/favorites': {
		title: 'Избранное',
		description: 'Избранные товары Arivoo'
	},
	'/login': {
		title: 'Вход',
		description: 'Вход в аккаунт Arivoo'
	},
	'/registration': {
		title: 'Регистрация',
		description: 'Регистрация на Arivoo'
	},
	'/user': {
		title: 'Личный кабинет',
		description: 'Личный кабинет пользователя Arivoo'
	},
	'/search': {
		title: 'Поиск товаров',
		description: 'Поиск товаров на Arivoo'
	},
	'/products': {
		title: 'Товары',
		description: 'Каталог товаров Arivoo'
	},
	'/product/[id]': {
		title: 'Товар',
		description: 'Детальная информация о товаре'
	}
}

// Функция для получения метаданных для страницы
export function getMetadataForPage(path: string): Metadata {
	const pageMeta = pageMetadata[path]
	if (!pageMeta) {
		return baseMetadata
	}

	return {
		...baseMetadata,
		title: pageMeta.title,
		description: pageMeta.description,
		keywords: pageMeta.keywords,
		openGraph: {
			...baseMetadata.openGraph,
			title: pageMeta.title,
			description: pageMeta.description
		},
		twitter: {
			...baseMetadata.twitter,
			title: pageMeta.title,
			description: pageMeta.description
		},
		robots: pageMeta.robots,
		alternates: {
			canonical: pageMeta.canonical || `https://arivoo.ru${path}`
		}
	}
}
