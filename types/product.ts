export type ProductSource = 'taobao' | '1688' | 'poizon'

// Интерфейс для SKU варианта товара
export interface SkuOption {
	skuId: string
	price: number
	originalPrice?: number
	stock: number
	attributes: Record<string, string> // { "Color": "Red", "Size": "M" }
	image?: string
}

// Базовый интерфейс для товара в списках (цена как строка для отображения)
export interface ProductItem {
	productId: string
	title: string
	price: string // строка для отображения (может содержать валюту)
	imageUrl: string
	shopName?: string
	sales?: number
	source?: ProductSource
}

// Рейтинг продавца
export interface SellerRating {
	// Общая оценка (tradeScore)
	overall: number
	// Оценка сервиса
	compositeService?: number
	// Оценка логистики
	logistics?: number
	// Оценка по спорам
	disputeComplaint?: number
	// Оценка предложений
	offerExperience?: number
	// Оценка консультаций
	consultingExperience?: number
	// Оценка послепродажного сервиса
	afterSalesExperience?: number
}

// Диапазон цен за количество (для 1688)
export interface PriceRange {
	// Минимальное количество для этой цены
	minQuantity: number
	// Цена без скидки (в юанях, нужно конвертировать)
	price: number
	// Цена со скидкой (в юанях, нужно конвертировать)
	promotionPrice?: number
}

// Детали товара (цена как число для вычислений)
export interface ProductDetail {
	productId: string
	title: string
	price: number // числовая цена
	originalPrice?: number
	image: string
	images: string[]
	shopName?: string
	sales?: number
	// Месячные продажи (для 1688)
	monthlySales?: number
	// Процент повторных покупок (для 1688)
	repeatPurchasePercent?: number
	// Рейтинг продавца (для 1688)
	sellerRating?: SellerRating
	// Цены за количество (для 1688)
	priceRanges?: PriceRange[]
	source: ProductSource
	description?: string
	descriptionHtml?: string
	descriptionType?: 'html' | 'base64' | 'text'
	specifications?: Record<string, string>
	// Видео товара (URL)
	videos?: string[]
	// SKU варианты (цвет, размер, остаток, цена)
	skuOptions?: SkuOption[]
	// Для отладки
	_debug?: {
		source: string
		rawData?: unknown
	}
}

// Унифицированный продукт из API клиента
export interface UnifiedProduct {
	id: string
	title: string
	price: number
	image: string
	source: ProductSource
	shopName?: string
	sales?: number
	originalData: unknown
}
